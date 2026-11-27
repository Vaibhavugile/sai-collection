import React from "react";
import { createPortal } from "react-dom";
import "./SaleSuccessModal.css";

export default function SaleSuccessModal({
  open,
  invoiceNumber,
  total,
  onClose,
}) {
  if (!open) return null;

  const modalContent = (
    <div className="sale-success-overlay">
      <div
        className="sale-success-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sale-success-title"
      >
        <div className="sale-success-icon">
          <svg viewBox="0 0 52 52" aria-hidden="true">
            <circle cx="26" cy="26" r="24" />
            <path d="M14 27 L22 35 L39 17" />
          </svg>
        </div>

        <div className="sale-success-eyebrow">
          SAI COLLECTION
        </div>

        <h2 id="sale-success-title">Bill Saved Successfully!</h2>

        <p className="sale-success-message">
          Your sale has been completed and saved successfully.
        </p>

        <div className="sale-success-details">
          <div>
            <span>Invoice Number</span>
            <strong>{invoiceNumber || "—"}</strong>
          </div>

          <div>
            <span>Amount Received</span>
            <strong>₹ {Number(total || 0).toFixed(2)}</strong>
          </div>
        </div>

        <button
          type="button"
          className="sale-success-close"
          onClick={onClose}
        >
          Continue Billing
        </button>

        <span className="sale-success-footer">
          Thank you for choosing Sai Collection
        </span>
      </div>
    </div>
  );

  // Render directly under document.body so transformed/scrollable app
  // containers cannot shift the fixed modal away from the viewport center.
  return createPortal(modalContent, document.body);
}
