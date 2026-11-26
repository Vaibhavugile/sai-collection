
import React, { useState } from "react";
import "./PaymentSection.css";
import { completeSale } from "../../services/checkoutService";

export default function PaymentSection({
  cart,
  customer,
  billSummary,
  cashier = "Administrator",
  onSaleCompleted,
}) {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const grandTotal = Number(billSummary?.grandTotal || 0);
  const received = Number(receivedAmount || 0);

  const change = Math.max(received - grandTotal, 0);
  const balance = Math.max(grandTotal - received, 0);

  const formatAmount = (amount) =>
    `₹ ${Number(amount || 0).toFixed(2)}`;

  const handleCompleteSale = async () => {
    if (isProcessing) return;

    if (!cart || cart.length === 0) {
      alert("Please add products to the cart.");
      return;
    }

    if (grandTotal <= 0) {
      alert("Invalid bill amount.");
      return;
    }

    if (received < grandTotal) {
      alert("Received amount is less than the grand total.");
      return;
    }

    try {
      setIsProcessing(true);

      const result = await completeSale({
        cart,
        customer,
        billSummary,
        paymentMethod,
        receivedAmount: received,
        cashier,
      });

      alert(
        `Sale completed successfully!\n\nInvoice: ${result.invoiceNumber}`
      );

      if (onSaleCompleted) {
        onSaleCompleted(result);
      }
    } catch (error) {
      console.error("Sale completion error:", error);
      alert(error?.message || "Unable to complete sale.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="payment-card">

      {/* Header */}
      <div className="payment-header">
        <div className="payment-header-left">
          <div className="payment-header-icon">₹</div>

          <div>
            <h2>Payment</h2>
            <p>Choose payment method</p>
          </div>
        </div>

        <span className="payment-header-badge">
          CHECKOUT
        </span>
      </div>

      {/* Payment Methods */}
      <div className="payment-methods">

        <button
          type="button"
          className={paymentMethod === "cash" ? "active" : ""}
          disabled={isProcessing}
          onClick={() => setPaymentMethod("cash")}
        >
          <span className="payment-method-symbol">₹</span>
          Cash
        </button>

        <button
          type="button"
          className={paymentMethod === "upi" ? "active" : ""}
          disabled={isProcessing}
          onClick={() => setPaymentMethod("upi")}
        >
          <span className="payment-method-symbol">UPI</span>
          UPI
        </button>

        <button
          type="button"
          className={paymentMethod === "card" ? "active" : ""}
          disabled={isProcessing}
          onClick={() => setPaymentMethod("card")}
        >
          <span className="payment-method-symbol">▤</span>
          Card
        </button>

      </div>

      {/* Amount Received */}
      <div className="payment-input">

        <label htmlFor="payment-received">
          Amount Received
        </label>

        <div className="payment-input-wrap">
          <span>₹</span>

          <input
            id="payment-received"
            type="number"
            min="0"
            step="0.01"
            placeholder="Enter received amount"
            value={receivedAmount}
            disabled={isProcessing}
            onChange={(e) => setReceivedAmount(e.target.value)}
          />
        </div>

        {paymentMethod === "cash" && grandTotal > 0 && (
          <button
            type="button"
            className="exact-amount-btn"
            disabled={isProcessing}
            onClick={() => setReceivedAmount(String(grandTotal))}
          >
            Use exact amount ({formatAmount(grandTotal)})
          </button>
        )}

      </div>

      {/* Payment Details */}
      <div className="payment-summary">

        <div className="payment-summary-row">
          <span>Grand Total</span>
          <strong>{formatAmount(grandTotal)}</strong>
        </div>

        <div className="payment-summary-row">
          <span>Received Amount</span>
          <strong>{formatAmount(received)}</strong>
        </div>

        <div className={`payment-result-row ${received >= grandTotal ? "payment-change" : "payment-balance"}`}>
          <span>
            {received >= grandTotal ? "Change to Return" : "Balance Due"}
          </span>

          <strong>
            {formatAmount(received >= grandTotal ? change : balance)}
          </strong>
        </div>

      </div>

      {/* Actions */}
      <div className="payment-actions">

        <button
          type="button"
          className="payment-print-btn"
          disabled={isProcessing}
          onClick={() => window.print()}
        >
          Print
        </button>

        <button
          type="button"
          className="payment-complete-btn"
          disabled={
            isProcessing ||
            !cart?.length ||
            grandTotal <= 0 ||
            received < grandTotal
          }
          onClick={handleCompleteSale}
        >
          {isProcessing ? "Processing..." : "Complete Sale"}
        </button>

      </div>

    </div>
  );
}
