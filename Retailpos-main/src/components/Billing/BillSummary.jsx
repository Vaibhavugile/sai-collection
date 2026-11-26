
import React, { useState } from "react";
import "./BillSummary.css";
import { calculateBill } from "../../utils/billingCalculator";

export default function BillSummary({
  cart,
  billingSettings,
  billDiscount,
  setBillDiscount,
}) {
  const [discountType, setDiscountType] = useState("fixed");

  const currencySymbol =
    billingSettings?.currencySymbol || "₹";

  const discountEnabled =
    billingSettings?.discountEnabled ?? true;

  const gstEnabled =
    billingSettings?.gstEnabled ?? false;

  // Calculate subtotal first, before applying discount.
  const initialBill = calculateBill({
    cart,
    billDiscount: 0,
    billingSettings,
  });

  const subtotal = Number(initialBill.subtotal) || 0;

  // Convert percentage discount into a fixed amount.
  const discountValue = Math.max(
    0,
    Number(billDiscount) || 0
  );

  const calculatedDiscount =
    discountType === "percent"
      ? Math.min((subtotal * Math.min(discountValue, 100)) / 100, subtotal)
      : Math.min(discountValue, subtotal);

  // Pass calculated fixed discount to existing calculator.
  const {
    totalProducts,
    totalQuantity,
    discount,
    gstPercentage,
    gst,
    taxableAmount,
    grandTotal,
  } = calculateBill({
    cart,
    billDiscount: calculatedDiscount,
    billingSettings,
  });

  const formatAmount = (amount) =>
    `${currencySymbol} ${Number(amount || 0).toFixed(2)}`;

  const handleDiscountChange = (e) => {
    const value = e.target.value;

    if (value === "") {
      setBillDiscount(0);
      return;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) return;

    const maxValue =
      discountType === "percent" ? 100 : subtotal;

    setBillDiscount(
      Math.min(Math.max(numericValue, 0), maxValue)
    );
  };

  const handleDiscountTypeChange = (type) => {
    setDiscountType(type);
    setBillDiscount(0);
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
              <small>Optional</small>
            </div>

            {/* Discount Type Selector */}
            <div className="discount-type-selector">

              <button
                type="button"
                className={
                  discountType === "fixed"
                    ? "discount-type-btn active"
                    : "discount-type-btn"
                }
                onClick={() =>
                  handleDiscountTypeChange("fixed")
                }
              >
                ₹ Fixed
              </button>

              <button
                type="button"
                className={
                  discountType === "percent"
                    ? "discount-type-btn active"
                    : "discount-type-btn"
                }
                onClick={() =>
                  handleDiscountTypeChange("percent")
                }
              >
                % Percentage
              </button>

            </div>

            {/* Discount Input */}
            <div className="summary-discount-field">

              <span>
                {discountType === "fixed" ? currencySymbol : "%"}
              </span>

              <input
                type="number"
                className="discount-input"
                min="0"
                max={
                  discountType === "percent"
                    ? 100
                    : subtotal
                }
                step="0.01"
                value={billDiscount ?? 0}
                onChange={handleDiscountChange}
                placeholder={
                  discountType === "fixed"
                    ? "Enter discount amount"
                    : "Enter discount percentage"
                }
              />

            </div>

            {discountType === "percent" && (
              <div className="discount-calculation-hint">
                {discountValue}% discount = {formatAmount(calculatedDiscount)}
              </div>
            )}

          </div>
        )}

        {discountEnabled && (
          <div className="summary-row">
            <span>Discount Applied</span>

            <strong className="summary-discount-value">
              - {formatAmount(discount)}
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
