
import { useEffect, useRef } from "react";
import "./OrderDetailsDrawer.css";

export default function OrderDetailsDrawer({
  order,
  onClose,
  onPrint,
  onDownloadPDF,
}) {
  const bodyRef = useRef(null);

  useEffect(() => {
    if (!order) return;

    // Always start at the top when opening another order.
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [order, onClose]);

  if (!order) return null;

  const formatDate = (createdAt) => {
    if (!createdAt) return "—";

    const date =
      typeof createdAt?.toDate === "function"
        ? createdAt.toDate()
        : new Date(createdAt);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const money = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const statusClass = String(order.status || "unknown").toLowerCase();
  const paymentClass = String(order.paymentMethod || "unknown").toLowerCase();

  return (
    <div className="order-drawer-overlay" onMouseDown={onClose}>
      <aside
        className="order-details-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Order ${order.invoiceNumber || "details"}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* FIXED HEADER */}
        <header className="order-drawer-header">
          <div>
            <span className="order-drawer-eyebrow">SALES INVOICE</span>
            <h2>#{order.invoiceNumber || "—"}</h2>
            <p>{formatDate(order.createdAt)}</p>
          </div>

          <button
            type="button"
            className="order-drawer-close"
            onClick={onClose}
            aria-label="Close order details"
          >
            ×
          </button>
        </header>

        {/* SCROLLABLE CONTENT */}
        <div className="order-drawer-body" ref={bodyRef}>

          {/* ORDER INFORMATION */}
          <section className="order-drawer-section">
            <div className="order-section-title">
              <h3>Order Information</h3>
              <span>OVERVIEW</span>
            </div>

            <div className="order-detail-row">
              <span>Order status</span>
              <strong>
                <span className={`order-detail-badge ${statusClass}`}>
                  {order.status || "—"}
                </span>
              </strong>
            </div>

            <div className="order-detail-row">
              <span>Payment method</span>
              <strong>
                <span className={`order-detail-badge ${paymentClass}`}>
                  {order.paymentMethod || "—"}
                </span>
              </strong>
            </div>

            <div className="order-detail-row">
              <span>Cashier</span>
              <strong>{order.cashier || "—"}</strong>
            </div>
          </section>

          {/* CUSTOMER DETAILS */}
          <section className="order-drawer-section">
            <div className="order-section-title">
              <h3>Customer Details</h3>
              <span>BUYER INFORMATION</span>
            </div>

            <div className="order-customer-highlight">
              <div className="order-customer-avatar">
                {(order.customer?.name || "W").charAt(0).toUpperCase()}
              </div>

              <div>
                <strong>
                  {order.customer?.name || "Walk-in Customer"}
                </strong>
                <span>Customer</span>
              </div>
            </div>

            <div className="order-detail-row">
              <span>Customer Name</span>
              <strong>
                {order.customer?.name || "Walk-in Customer"}
              </strong>
            </div>

            <div className="order-detail-row">
              <span>Mobile Number</span>
              <strong>
                {order.customer?.mobile || "Not provided"}
              </strong>
            </div>
          </section>

          {/* ITEMS */}
          <section className="order-drawer-section">
            <div className="order-section-title">
              <h3>Items Purchased</h3>
              <span>{(order.items || []).length} LINE ITEMS</span>
            </div>

            {(order.items || []).map((item, index) => (
              <div
                className="order-drawer-item"
                key={item.variantId || item.id || index}
              >
                <div className="order-item-main">
                  <strong>{item.productName || "Product"}</strong>
                  <span>{item.variantName || "Standard variant"}</span>
                  {item.sku && <small>SKU: {item.sku}</small>}
                </div>

                <div className="order-item-price">
                  <strong>
                    {money(Number(item.qty || 0) * Number(item.sellingPrice || 0))}
                  </strong>
                  <span>
                    {item.qty || 0} × {money(item.sellingPrice)}
                  </span>
                </div>
              </div>
            ))}
          </section>

          {/* BILL SUMMARY */}
          <section className="order-drawer-section">
            <div className="order-section-title">
              <h3>Bill Summary</h3>
              <span>AMOUNT BREAKDOWN</span>
            </div>

            <div className="order-detail-row">
              <span>Total items</span>
              <strong>{Number(order.totalQuantity || 0)}</strong>
            </div>

            <div className="order-detail-row">
              <span>Subtotal</span>
              <strong>{money(order.subtotal)}</strong>
            </div>

            <div className="order-detail-row">
              <span>GST</span>
              <strong>{money(order.gst)}</strong>
            </div>

            <div className="order-detail-row order-grand-total">
              <span>Grand total</span>
              <strong>{money(order.grandTotal)}</strong>
            </div>

            <div className="order-detail-row">
              <span>Profit</span>
              <strong className="order-profit-value">
                {money(order.totalProfit)}
              </strong>
            </div>
          </section>

          {/* PAYMENT */}
          <section className="order-drawer-section">
            <div className="order-section-title">
              <h3>Payment Details</h3>
              <span>SETTLEMENT</span>
            </div>

            <div className="order-detail-row">
              <span>Received</span>
              <strong>{money(order.receivedAmount)}</strong>
            </div>

            <div className="order-detail-row">
              <span>Change returned</span>
              <strong>{money(order.changeAmount)}</strong>
            </div>
          </section>
        </div>

        {/* FIXED FOOTER */}
        <footer className="order-drawer-footer">
          <button
            type="button"
            className="order-drawer-print"
            onClick={() => onPrint?.(order)}
          >
            Print Invoice
          </button>

          <button
            type="button"
            className="order-drawer-pdf"
            onClick={() => onDownloadPDF?.(order)}
          >
            Download PDF
          </button>
        </footer>
      </aside>
    </div>
  );
}
