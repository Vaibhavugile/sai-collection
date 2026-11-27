import React from "react";
import "./ThermalReceipt.css";

export default function ThermalReceipt({
  cart = [],
  customer,
  billSummary,
  paymentMethod,
  receivedAmount,
  cashier = "Administrator",
  invoiceNumber = "",
  date = new Date(),
  storeName = "SAI COLLECTION",
  storeAddress = "Hiras Complex, Opposite Warana Agency, Main Kapad Line, Latur - 413512",
  storePhone = "9271747777 / 8180918191",
  logo = "/logo.png",
}) {
  const currency = "₹";

  const money = (value) =>
    `${currency}${Number(value || 0).toFixed(2)}`;

  const total = Number(billSummary?.grandTotal || 0);
  const received = Number(receivedAmount || 0);
  const change = Math.max(received - total, 0);

  const receiptDate =
    date instanceof Date ? date : new Date(date);

  return (
    <div className="thermal-receipt" id="thermal-receipt">
      {/* BRAND HEADER */}
      <div className="receipt-brand">
        {logo && (
          <img
            src={logo}
            alt={storeName}
            className="receipt-logo"
          />
        )}

        <div className="receipt-brand-name">
          {storeName}
        </div>

        {/* Full shop address replaces the old brand line. */}
        <div className="receipt-store-address">
          {storeAddress}
        </div>

        {storePhone && (
          <div className="receipt-store-phone">
            Mob: {storePhone}
          </div>
        )}

        <div className="receipt-brand-divider">
          ✦ ───────────── ✦
        </div>

        <div className="receipt-tagline">
          YOUR STYLE, OUR PASSION
        </div>
      </div>

      {/* INVOICE INFORMATION */}
      <div className="receipt-section-title">
        INVOICE DETAILS
      </div>

      <div className="receipt-info">
        <div>
          <span>Invoice No.</span>
          <strong>{invoiceNumber || "Pending"}</strong>
        </div>

        <div>
          <span>Date</span>
          <strong>
            {receiptDate.toLocaleDateString("en-IN")}
          </strong>
        </div>

        <div>
          <span>Time</span>
          <strong>
            {receiptDate.toLocaleTimeString("en-IN")}
          </strong>
        </div>

        <div>
          <span>Cashier</span>
          <strong>{cashier}</strong>
        </div>
      </div>

      {/* CUSTOMER DETAILS */}
      <div className="receipt-divider" />

      <div className="receipt-section-title">
        CUSTOMER DETAILS
      </div>

      <div className="receipt-customer">
        <strong>
          {customer?.name || "Walk-in Customer"}
        </strong>

        {customer?.mobile && (
          <span>
            Mobile: {customer.mobile}
          </span>
        )}
      </div>

      <div className="receipt-divider" />

      {/* PURCHASE DETAILS */}
      <div className="receipt-section-title">
        PURCHASE DETAILS
      </div>

      {cart.map((item, index) => {
        const qty = Number(item.qty || 0);
        const price = Number(item.sellingPrice || 0);
        const itemTotal = qty * price;

        const productCode =
          item.productCode ||
          item.code ||
          item.barcode ||
          "-";

        const category =
          item.categoryName ||
          item.category ||
          item.productCategory ||
          "-";

        return (
          <div
            className="receipt-product"
            key={item.variantId || item.productId || index}
          >
            <div className="receipt-product-heading">
              <strong>
                {item.productName || item.name || "Product"}
              </strong>

              <strong>
                {money(itemTotal)}
              </strong>
            </div>

            <div className="receipt-product-meta">
              <span>Code: {productCode}</span>
              <span>Category: {category}</span>
            </div>

            {item.variantName && (
              <div className="receipt-product-variant">
                Style / Size: {item.variantName}
              </div>
            )}

            <div className="receipt-product-calculation">
              {qty} × {money(price)}
            </div>
          </div>
        );
      })}

      {/* BILL SUMMARY */}
      <div className="receipt-divider" />

      <div className="receipt-section-title">
        BILL SUMMARY
      </div>

      <div className="receipt-total-row">
        <span>Subtotal</span>
        <strong>{money(billSummary?.subtotal)}</strong>
      </div>

      {Number(billSummary?.discount || 0) > 0 && (
        <div className="receipt-total-row">
          <span>Discount</span>
          <strong>- {money(billSummary.discount)}</strong>
        </div>
      )}

      {Number(billSummary?.gst || 0) > 0 && (
        <div className="receipt-total-row">
          <span>GST</span>
          <strong>{money(billSummary.gst)}</strong>
        </div>
      )}

      <div className="receipt-grand-total">
        <span>NET PAYABLE</span>
        <strong>{money(total)}</strong>
      </div>

      {/* PAYMENT DETAILS */}
      <div className="receipt-divider" />

      <div className="receipt-section-title">
        PAYMENT DETAILS
      </div>

      <div className="receipt-total-row">
        <span>Payment Mode</span>
        <strong>
          {String(paymentMethod || "Cash").toUpperCase()}
        </strong>
      </div>

      <div className="receipt-total-row">
        <span>Amount Received</span>
        <strong>{money(received)}</strong>
      </div>

      <div className="receipt-total-row">
        <span>Change Returned</span>
        <strong>{money(change)}</strong>
      </div>

      {/* STORE POLICIES */}
      <div className="receipt-divider" />

      <div className="receipt-policy">
        <div className="receipt-exchange-policy">
          बदलावा ७ दिवसाच्या आत सकाळी ११ ते १२ पर्यंत
        </div>

        <div className="receipt-return-policy">
          एकदा विकलेला माल परत घेतला जाणार नाही.
        </div>

        <div className="receipt-guarantee">
          गॅरंटी नाही.
        </div>
      </div>

      {/* FINAL FOOTER */}
      <div className="receipt-footer">
        <div className="receipt-footer-decoration">
          ✦ ───────────── ✦
        </div>

        <h2>धन्यवाद! / THANK YOU!</h2>

        <div className="receipt-signature">
          सही: __________________
        </div>
      </div>
    </div>
  );
}
