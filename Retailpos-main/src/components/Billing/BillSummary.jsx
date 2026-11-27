
import React, { useEffect, useMemo, useState } from "react";
import "./BillSummary.css";
import { calculateBill } from "../../utils/billingCalculator";

export default function BillSummary({
  cart,
  billingSettings,
  billDiscount,
  setBillDiscount,
}) {
  const [percentDiscount, setPercentDiscount] = useState(0);
  const [fixedDiscount, setFixedDiscount] = useState(0);

  const currencySymbol = billingSettings?.currencySymbol || "₹";
  const discountEnabled = billingSettings?.discountEnabled ?? true;
  const gstEnabled = billingSettings?.gstEnabled ?? false;

  const initialBill = useMemo(
    () =>
      calculateBill({
        cart,
        billDiscount: 0,
        billingSettings,
      }),
    [cart, billingSettings]
  );

  const subtotal = Math.max(
    0,
    Math.round(Number(initialBill.subtotal) || 0)
  );

  // Percentage discount rounded to whole rupees.
  const percentageAmount = Math.min(
    Math.round((subtotal * percentDiscount) / 100),
    subtotal
  );

  // Flat discount is applied after percentage discount.
  const remainingAfterPercentage = Math.max(
    0,
    subtotal - percentageAmount
  );

  const appliedFixedDiscount = Math.min(
    fixedDiscount,
    remainingAfterPercentage
  );

  const combinedDiscount = Math.min(
    percentageAmount + appliedFixedDiscount,
    subtotal
  );

  const bill = useMemo(
    () =>
      calculateBill({
        cart,
        billDiscount: combinedDiscount,
        billingSettings,
      }),
    [cart, combinedDiscount, billingSettings]
  );

  const {
    totalProducts,
    totalQuantity,
    discount,
    gstPercentage,
    gst,
    taxableAmount,
    grandTotal,
  } = bill;

  // Send combined discount to the existing billing flow.
  useEffect(() => {
    setBillDiscount(combinedDiscount);
  }, [combinedDiscount, setBillDiscount]);

  // Reset discount inputs after checkout resets the parent value.
  useEffect(() => {
    if (Number(billDiscount) === 0) {
      setPercentDiscount(0);
      setFixedDiscount(0);
    }
  }, [billDiscount]);

  const formatAmount = (amount) =>
    `${currencySymbol} ${Number(amount || 0).toFixed(2)}`;

  // Whole-number input handling.
  const handleWholeNumber = (value, setter, max) => {
    if (value === "") {
      setter(0);
      return;
    }

    const numericValue = Number.parseInt(value, 10);

    if (!Number.isFinite(numericValue)) return;

    setter(
      Math.min(
        Math.max(numericValue, 0),
        max
      )
    );
  };

  // Prevent accidental mouse-wheel and arrow-key changes.
  const preventNumberScroll = (event) => {
    if (event.type === "wheel") {
      event.preventDefault();
      event.currentTarget.blur();
    }

    if (
      event.type === "keydown" &&
      ["ArrowUp", "ArrowDown"].includes(event.key)
    ) {
      event.preventDefault();
    }
  };

  return (
    <div className="bill-summary">

      {/* Header */}
      <div className="summary-header">
        <div className="summary-header-icon">₹</div>

        <div className="summary-header-text">
          <h2>Bill Summary</h2>
          <p>Review your billing details</p>
        </div>

        <span className="summary-badge">SUMMARY</span>
      </div>

      {/* Statistics */}
      <div className="summary-stats">
        <div className="summary-stat">
          <span className="summary-stat-icon">▦</span>
          <div>
            <span>Total Products</span>
            <strong>{totalProducts}</strong>
          </div>
        </div>

        <div className="summary-stat">
          <span className="summary-stat-icon">▤</span>
          <div>
            <span>Total Quantity</span>
            <strong>{totalQuantity}</strong>
          </div>
        </div>
      </div>

      {/* Amount Details */}
      <div className="summary-details">

        <div className="summary-row">
          <span>Subtotal</span>
          <strong>{formatAmount(subtotal)}</strong>
        </div>

        {discountEnabled && (
          <div className="summary-discount">

            <div className="summary-discount-heading">
              <span>Bill Discount</span>
              <small>Optional · Whole numbers only</small>
            </div>

            <div className="discount-input-group">

              {/* Percentage Discount */}
              <label className="discount-field-label">
                <span>Percentage discount</span>

                <div className="summary-discount-field">
                  <span>%</span>

                  <input
                    type="number"
                    className="discount-input"
                    min="0"
                    max="100"
                    step="1"
                    inputMode="numeric"
                    value={percentDiscount}
                    onWheel={preventNumberScroll}
                    onKeyDown={preventNumberScroll}
                    onChange={(e) =>
                      handleWholeNumber(
                        e.target.value,
                        setPercentDiscount,
                        100
                      )
                    }
                    placeholder="0"
                  />
                </div>
              </label>

              {/* Additional Flat Discount */}
              <label className="discount-field-label">
                <span>Additional flat discount</span>

                <div className="summary-discount-field">
                  <span>{currencySymbol}</span>

                  <input
                    type="number"
                    className="discount-input"
                    min="0"
                    max={remainingAfterPercentage}
                    step="1"
                    inputMode="numeric"
                    value={fixedDiscount}
                    onWheel={preventNumberScroll}
                    onKeyDown={preventNumberScroll}
                    onChange={(e) =>
                      handleWholeNumber(
                        e.target.value,
                        setFixedDiscount,
                        remainingAfterPercentage
                      )
                    }
                    placeholder="0"
                  />
                </div>
              </label>

            </div>

            {/* Discount Breakdown */}
            {(percentDiscount > 0 || fixedDiscount > 0) && (
              <div className="discount-breakdown">

                {percentDiscount > 0 && (
                  <div>
                    <span>{percentDiscount}% discount</span>
                    <strong>
                      − {formatAmount(percentageAmount)}
                    </strong>
                  </div>
                )}

                {fixedDiscount > 0 && (
                  <div>
                    <span>Additional discount</span>
                    <strong>
                      − {formatAmount(appliedFixedDiscount)}
                    </strong>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

        {discountEnabled && (
          <div className="summary-row">
            <span>Total Discount Applied</span>

            <strong className="summary-discount-value">
              − {formatAmount(discount)}
            </strong>
          </div>
        )}

        <div className="summary-row">
          <span>Taxable Amount</span>
          <strong>{formatAmount(taxableAmount)}</strong>
        </div>

        {gstEnabled && (
          <div className="summary-row">
            <span>GST ({gstPercentage}%)</span>
            <strong>{formatAmount(gst)}</strong>
          </div>
        )}

      </div>

      {/* Grand Total */}
      <div className="grand-total-box">

        <div className="grand-total-info">
          <span className="grand-total-symbol">₹</span>

          <div>
            <span className="grand-total-title">
              Grand Total
            </span>

            <small>Final payable amount</small>
          </div>
        </div>

        <strong className="grand-total-amount">
          {formatAmount(grandTotal)}
        </strong>

      </div>

      <div className="summary-footer">
        <span className="summary-footer-dot"></span>
        Amount calculated automatically
      </div>

    </div>
  );
}
