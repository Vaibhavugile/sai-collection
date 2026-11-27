
import React, { useEffect, useState } from "react";
import "./PaymentSection.css";
import { completeSale } from "../../services/checkoutService";

export default function PaymentSection({
  cart,
  customer,
  billSummary,
  cashier = "Administrator",
  paymentMethod,
  setPaymentMethod,
  receivedAmount,
  setReceivedAmount,
  invoiceNumber,
  onReserveInvoice,
  onSaleCompleted,
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [hasEditedReceived, setHasEditedReceived] = useState(false);

  const grandTotal = Math.max(0, Number(billSummary?.grandTotal || 0));
  const received = Math.max(0, Number.parseInt(receivedAmount || "0", 10) || 0);

  // Default to the payable amount until the cashier edits it.
  useEffect(() => {
    if (!cart?.length) {
      setHasEditedReceived(false);
      return;
    }

    if (!hasEditedReceived) {
      setReceivedAmount(String(Math.ceil(grandTotal)));
    }
  }, [cart?.length, grandTotal, hasEditedReceived, setReceivedAmount]);

  const change = Math.max(received - grandTotal, 0);
  const balance = Math.max(grandTotal - received, 0);

  const formatAmount = (amount) =>
    `₹ ${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleReceivedAmountChange = (event) => {
    const digitsOnly = event.target.value.replace(/\D/g, "");
    setHasEditedReceived(true);
    setReceivedAmount(digitsOnly);
  };

  // =========================================================
  // PRINT THERMAL RECEIPT - DYNAMIC 80MM HEIGHT
  // PRINT ONLY - NO FIREBASE OPERATION
  // =========================================================

  const handlePrint = async () => {
    if (isPrinting || isProcessing) return;

    const receipt = document.getElementById("thermal-receipt");

    if (!receipt) {
      alert("Thermal receipt not found. Please check the receipt component.");
      return;
    }

    if (!cart || cart.length === 0) {
      alert("Please add products before printing.");
      return;
    }

    // Open immediately inside the click event to avoid popup blocking.
    const printWindow = window.open(
      "",
      "_blank",
      "width=420,height=800"
    );

    if (!printWindow) {
      alert("Please allow pop-ups for this website to print the receipt.");
      return;
    }

    setIsPrinting(true);

    try {
      // Reserve the invoice number only after opening the popup synchronously.
      // This keeps the popup from being blocked by the browser.
      if (!invoiceNumber && typeof onReserveInvoice !== "function") {
        throw new Error("Invoice reservation is not configured.");
      }

      const reservedInvoiceNumber =
        invoiceNumber || (await onReserveInvoice());

      if (!reservedInvoiceNumber) {
        throw new Error("Could not reserve an invoice number.");
      }

      // Wait for React to render the reserved number into ThermalReceipt.
      await new Promise((resolve) => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(resolve);
        });
      });

      const updatedReceipt = document.getElementById("thermal-receipt");

      if (!updatedReceipt) {
        throw new Error("Thermal receipt not found after invoice reservation.");
      }

      const receiptClone = updatedReceipt.cloneNode(true);

      // Copy application stylesheets into the isolated print window.
      const stylesheetPromises = [];

      document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
        const clonedLink = printWindow.document.createElement("link");

        clonedLink.rel = "stylesheet";
        clonedLink.href = link.href;

        stylesheetPromises.push(
          new Promise((resolve) => {
            clonedLink.onload = resolve;
            clonedLink.onerror = resolve;
            setTimeout(resolve, 2500);
          })
        );

        printWindow.document.head.appendChild(clonedLink);
      });

      // Copy inline styles, including styles injected by React tooling.
      document.querySelectorAll("style").forEach((style) => {
        const clonedStyle = printWindow.document.createElement("style");
        clonedStyle.textContent = style.textContent;
        printWindow.document.head.appendChild(clonedStyle);
      });

      // Copy accessible stylesheet rules that may not have a link/style node.
      // Cross-origin stylesheets are skipped safely.
      try {
        Array.from(document.styleSheets).forEach((sheet) => {
          if (sheet.href) return;

          if (sheet.ownerNode?.tagName === "STYLE") return;

          try {
            const cssText = Array.from(sheet.cssRules)
              .map((rule) => rule.cssText)
              .join("\n");

            if (cssText) {
              const style = printWindow.document.createElement("style");
              style.textContent = cssText;
              printWindow.document.head.appendChild(style);
            }
          } catch (error) {
            // Browser security may prevent reading some stylesheet rules.
          }
        });
      } catch (error) {
        console.warn("Some stylesheets could not be copied:", error);
      }

      const baseStyle = printWindow.document.createElement("style");

      baseStyle.textContent = `
        * {
          box-sizing: border-box !important;
        }

        html,
        body {
          width: 80mm !important;
          min-width: 80mm !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #fff !important;
          color: #000 !important;
          overflow: visible !important;
          font-family: Arial, Helvetica, sans-serif !important;
        }

        body {
          display: block !important;
        }

        #thermal-receipt {
          display: block !important;
          position: relative !important;
          width: 76mm !important;
          max-width: 76mm !important;
          height: auto !important;
          min-height: 0 !important;
          max-height: none !important;
          margin: 0 auto !important;
          padding: 2mm 2mm 0 !important;
          overflow: visible !important;
          background: #fff !important;
          color: #000 !important;
          font-family: Arial, Helvetica, sans-serif !important;
          font-size: 10px !important;
          line-height: 1.4 !important;
        }

        #thermal-receipt img {
          max-width: 100%;
        }

        .receipt-brand {
          text-align: center !important;
          padding-bottom: 3px !important;
          margin-bottom: 0 !important;
        }

        .receipt-logo {
          display: block !important;
          width: 19mm !important;
          max-width: 100% !important;
          max-height: 18mm !important;
          object-fit: contain !important;
          margin: 0 auto 4px !important;
        }

        .receipt-brand-name {
          font-family: Georgia, "Times New Roman", serif !important;
          font-size: 21px !important;
          font-weight: 800 !important;
          letter-spacing: 1.5px !important;
          line-height: 1.2 !important;
          margin: 0 !important;
        }

        .receipt-brand-line {
          font-size: 8px !important;
          font-weight: 700 !important;
          letter-spacing: 1.6px !important;
          margin-top: 3px !important;
        }

        .receipt-store-address {
          font-size: 9px !important;
          font-weight: 600 !important;
          margin-top: 5px !important;
        }

        .receipt-store-phone {
          font-size: 9px !important;
          margin-top: 2px !important;
        }

        .receipt-brand-divider {
          margin: 6px 0 2px !important;
          font-size: 10px !important;
          font-weight: 700 !important;
        }

        .receipt-tagline {
          font-size: 8px !important;
          font-weight: 700 !important;
          letter-spacing: 1.2px !important;
          margin: 0 !important;
        }

        .receipt-section-title {
          font-size: 9px !important;
          font-weight: 800 !important;
          letter-spacing: 1px !important;
          margin: 6px 0 4px !important;
          line-height: 1.25 !important;
        }

        .receipt-divider {
          border-top: 1px dashed #333 !important;
          margin: 5px 0 !important;
        }

        .receipt-info > div {
          display: flex !important;
          justify-content: space-between !important;
          align-items: flex-start !important;
          gap: 5px !important;
          margin: 2px 0 !important;
          line-height: 1.3 !important;
        }

        .receipt-info span {
          color: #333 !important;
        }

        .receipt-info strong {
          text-align: right !important;
          overflow-wrap: anywhere !important;
        }

        .receipt-customer {
          display: flex !important;
          flex-direction: column !important;
          gap: 2px !important;
          font-size: 10px !important;
          line-height: 1.35 !important;
        }

        .receipt-product {
          padding: 5px 0 !important;
          border-bottom: 1px dotted #777 !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }

        .receipt-product-heading {
          display: flex !important;
          align-items: flex-start !important;
          justify-content: space-between !important;
          gap: 7px !important;
          font-size: 10px !important;
          font-weight: 800 !important;
          line-height: 1.3 !important;
        }

        .receipt-product-heading strong:first-child {
          max-width: 49mm !important;
          overflow-wrap: anywhere !important;
        }

        .receipt-product-heading strong:last-child {
          white-space: nowrap !important;
        }

        .receipt-product-meta {
          display: flex !important;
          flex-direction: column !important;
          gap: 1px !important;
          margin-top: 2px !important;
          font-size: 8.5px !important;
          line-height: 1.3 !important;
          overflow-wrap: anywhere !important;
        }

        .receipt-product-variant {
          margin-top: 2px !important;
          font-size: 9px !important;
          font-weight: 600 !important;
        }

        .receipt-product-calculation {
          margin-top: 2px !important;
          font-size: 9px !important;
          line-height: 1.3 !important;
        }

        .receipt-total-row {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 5px !important;
          margin: 3px 0 !important;
          line-height: 1.3 !important;
        }

        .receipt-total-row strong {
          text-align: right !important;
          white-space: nowrap !important;
        }

        .receipt-grand-total {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          gap: 5px !important;
          margin: 7px 0 !important;
          padding: 6px 5px !important;
          border-top: 1px solid #000 !important;
          border-bottom: 1px solid #000 !important;
          font-size: 14px !important;
          font-weight: 900 !important;
          line-height: 1.3 !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }

        .receipt-payment {
          margin: 0 !important;
          padding: 0 !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }

        .receipt-footer {
          display: block !important;
          width: 100% !important;
          height: auto !important;
          min-height: 0 !important;
          max-height: none !important;
          margin: 5px 0 0 !important;
          padding: 0 !important;
          text-align: center !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }

        .receipt-footer-decoration {
          margin: 0 0 3px !important;
          padding: 0 !important;
          font-size: 10px !important;
          line-height: 1.2 !important;
        }

        .receipt-footer h2 {
          margin: 0 !important;
          padding: 0 !important;
          font-family: Georgia, "Times New Roman", serif !important;
          font-size: 18px !important;
          font-weight: 800 !important;
          letter-spacing: 1.5px !important;
          line-height: 1.2 !important;
        }

        .receipt-footer p,
        .receipt-footer-brand,
        .receipt-footer small,
        .receipt-copyright {
          display: none !important;
        }

        @page {
          size: 80mm auto;
          margin: 0;
        }

        @media print {
          html,
          body {
            width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }

          #thermal-receipt {
            width: 76mm !important;
            margin: 0 auto !important;
            padding-bottom: 0 !important;
          }

          #thermal-receipt,
          #thermal-receipt * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `;

      printWindow.document.head.appendChild(baseStyle);

      printWindow.document.title = "Sai Collection - Thermal Receipt";

      printWindow.document.body.innerHTML = "";
      printWindow.document.body.appendChild(receiptClone);

      // Wait for linked stylesheets.
      await Promise.all(stylesheetPromises);

      // Wait for fonts.
      if (printWindow.document.fonts?.ready) {
        await printWindow.document.fonts.ready;
      }

      // Wait for receipt images, especially the store logo.
      const images = Array.from(
        printWindow.document.querySelectorAll("#thermal-receipt img")
      );

      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();

          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 3000);
          });
        })
      );

      // Allow the browser to finish layout.
      await new Promise((resolve) => {
        printWindow.requestAnimationFrame(() => {
          printWindow.requestAnimationFrame(resolve);
        });
      });

      const printedReceipt =
        printWindow.document.getElementById("thermal-receipt");

      if (!printedReceipt) {
        throw new Error("Receipt could not be prepared for printing.");
      }

      // Measure the actual receipt content.
      const contentHeightPx = Math.ceil(
        Math.max(
          printedReceipt.scrollHeight,
          printedReceipt.getBoundingClientRect().height
        )
      );

      // Convert CSS pixels to millimetres.
      // Add only a small 2mm allowance to avoid cutting the last line.
      const heightMm = Math.max(
        45,
        Math.ceil((contentHeightPx * 25.4) / 96 + 2)
      );

      // Apply the measured custom paper size.
      const pageSizeStyle = printWindow.document.createElement("style");

      pageSizeStyle.textContent = `
        @page {
          size: 80mm ${heightMm}mm;
          margin: 0;
        }

        @media print {
          html,
          body {
            width: 80mm !important;
            height: ${heightMm}mm !important;
            min-height: 0 !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }

          body {
            position: relative !important;
            top: 0 !important;
            left: 0 !important;
          }

          #thermal-receipt {
            position: absolute !important;
            top: 0 !important;
            left: 2mm !important;
            width: 76mm !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 2mm 2mm 0 !important;
            overflow: visible !important;
          }
        }
      `;

      printWindow.document.head.appendChild(pageSizeStyle);

      printWindow.focus();

      printWindow.onafterprint = () => {
        printWindow.close();
      };

      // Print only the isolated receipt.
      printWindow.print();

    } catch (error) {
      console.error("Thermal receipt printing error:", error);

      alert(
        error?.message ||
        "Unable to print receipt. Please try again."
      );

      if (!printWindow.closed) {
        printWindow.close();
      }
    } finally {
      setIsPrinting(false);
    }
  };

  // =========================================================
  // COMPLETE SALE - FIREBASE OPERATION
  // =========================================================

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
        reservedInvoiceNumber: invoiceNumber || "",
      });

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
      <div className="payment-header">
        <div className="payment-header-left">
          <div className="payment-header-icon">₹</div>

          <div>
            <h2>Payment</h2>
            <p>Choose payment method</p>
          </div>
        </div>

        <span className="payment-header-badge">CHECKOUT</span>
      </div>

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

      <div className="payment-input">
        <label htmlFor="payment-received">Amount Received</label>

        <div className="payment-input-wrap">
          <span>₹</span>

          <input
            id="payment-received"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            placeholder="Enter received amount"
            value={receivedAmount ?? ""}
            disabled={isProcessing}
            onChange={handleReceivedAmountChange}
            onWheel={(event) => event.currentTarget.blur()}
            onKeyDown={(event) => {
              if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                event.preventDefault();
              }
            }}
          />
        </div>

        {paymentMethod === "cash" && grandTotal > 0 && (
          <button
            type="button"
            className="exact-amount-btn"
            disabled={isProcessing}
            onClick={() => { setHasEditedReceived(true); setReceivedAmount(String(Math.ceil(grandTotal))); }}
          >
            Use exact amount ({formatAmount(grandTotal)})
          </button>
        )}
      </div>

      <div className="payment-summary">
        <div className="payment-summary-row">
          <span>Grand Total</span>
          <strong>{formatAmount(grandTotal)}</strong>
        </div>

        <div className="payment-summary-row">
          <span>Received Amount</span>
          <strong>{formatAmount(received)}</strong>
        </div>

        <div
          className={`payment-result-row ${
            received >= grandTotal
              ? "payment-change"
              : "payment-balance"
          }`}
        >
          <span>
            {received >= grandTotal
              ? "Change to Return"
              : "Balance Due"}
          </span>

          <strong>
            {formatAmount(
              received >= grandTotal ? change : balance
            )}
          </strong>
        </div>
      </div>

      <div className="payment-actions">
        <button
          type="button"
          className="payment-print-btn"
          disabled={isProcessing || isPrinting}
          onClick={handlePrint}
        >
          {isPrinting ? "Preparing..." : "Print"}
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
