
import "./OrderDetailsPage.css";

import {
  FiArrowLeft,
  FiPrinter,
  FiDownload,
  FiUser,
  FiPhone,
  FiCalendar,
  FiCreditCard,
  FiPackage,
  FiFileText,
  FiCheckCircle,
} from "react-icons/fi";

export default function OrderDetailsPage({
  order,
  onBack,
  onPrint,
  onDownloadPDF,
}) {
  if (!order) return null;

  const money = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (createdAt) => {
    if (!createdAt) return "—";

    const date =
      typeof createdAt?.toDate === "function"
        ? createdAt.toDate()
        : new Date(createdAt);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const status = String(order.status || "unknown").toLowerCase();
  const payment = String(order.paymentMethod || "unknown").toLowerCase();

  const items = order.items || [];

  return (
    <main className="order-details-page">

      {/* TOP NAVIGATION */}
      <div className="order-details-topbar">
        <button
          type="button"
          className="order-back-button"
          onClick={onBack}
        >
          <FiArrowLeft />
          Back to Orders
        </button>

        <div className="order-details-breadcrumb">
          Orders <span>/</span> Order Details
        </div>
      </div>

      {/* INVOICE HEADER */}
      <section className="order-page-hero">
        <div className="order-page-hero-main">
          <div className="order-page-icon">
            <FiFileText />
          </div>

          <div>
            <span className="order-page-eyebrow">
              SALES INVOICE
            </span>

            <h1>#{order.invoiceNumber || "—"}</h1>

            <div className="order-page-date">
              <FiCalendar />
              {formatDate(order.createdAt)}
            </div>
          </div>
        </div>

        <div className="order-page-hero-actions">
          <span className={`order-page-status ${status}`}>
            <FiCheckCircle />
            {order.status || "Unknown"}
          </span>

          <button
            type="button"
            className="order-page-print-button"
            onClick={() => onPrint?.(order)}
          >
            <FiPrinter />
            Print Invoice
          </button>

          <button
            type="button"
            className="order-page-download-button"
            onClick={() => onDownloadPDF?.(order)}
          >
            <FiDownload />
            Download PDF
          </button>
        </div>
      </section>

      {/* CUSTOMER + ORDER INFORMATION */}
      <div className="order-page-info-grid">

        <section className="order-page-card">
          <div className="order-page-card-heading">
            <div className="order-page-card-icon">
              <FiUser />
            </div>

            <div>
              <h2>Customer Information</h2>
              <p>Customer details for this transaction</p>
            </div>
          </div>

          <div className="order-customer-profile">
            <div className="order-customer-avatar">
              {(order.customer?.name || "W")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {order.customer?.name || "Walk-in Customer"}
              </strong>

              <span>Customer</span>
            </div>
          </div>

          <div className="order-info-line">
            <span>
              <FiUser />
              Customer Name
            </span>

            <strong>
              {order.customer?.name || "Walk-in Customer"}
            </strong>
          </div>

          <div className="order-info-line">
            <span>
              <FiPhone />
              Mobile Number
            </span>

            <strong>
              {order.customer?.mobile || "Not provided"}
            </strong>
          </div>
        </section>

        <section className="order-page-card">
          <div className="order-page-card-heading">
            <div className="order-page-card-icon">
              <FiCreditCard />
            </div>

            <div>
              <h2>Order Information</h2>
              <p>Transaction and payment details</p>
            </div>
          </div>

          <div className="order-info-line">
            <span>Invoice Number</span>
            <strong>{order.invoiceNumber || "—"}</strong>
          </div>

          <div className="order-info-line">
            <span>Order Status</span>
            <strong>
              <span className={`order-inline-badge ${status}`}>
                {order.status || "Unknown"}
              </span>
            </strong>
          </div>

          <div className="order-info-line">
            <span>Payment Method</span>
            <strong>
              <span className={`order-inline-badge ${payment}`}>
                {order.paymentMethod || "—"}
              </span>
            </strong>
          </div>

          <div className="order-info-line">
            <span>Cashier</span>
            <strong>{order.cashier || "—"}</strong>
          </div>
        </section>
      </div>

      {/* PURCHASED ITEMS */}
      <section className="order-page-card order-items-card">
        <div className="order-page-card-heading">
          <div className="order-page-card-icon">
            <FiPackage />
          </div>

          <div>
            <h2>Items Purchased</h2>
            <p>
              {items.length} line item{items.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {items.length > 0 ? (
          <div className="order-items-table-wrapper">
            <table className="order-items-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>PRODUCT</th>
                  <th>VARIANT</th>
                  <th>SKU</th>
                  <th>PRICE</th>
                  <th>QUANTITY</th>
                  <th>TOTAL</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item, index) => (
                  <tr key={item.variantId || item.id || index}>
                    <td>{index + 1}</td>

                    <td>
                      <strong>
                        {item.productName || "Product"}
                      </strong>
                    </td>

                    <td>
                      {item.variantName || "Standard variant"}
                    </td>

                    <td>
                      {item.sku || "—"}
                    </td>

                    <td>{money(item.sellingPrice)}</td>

                    <td>
                      <span className="order-item-qty">
                        {item.qty || 0}
                      </span>
                    </td>

                    <td>
                      <strong className="order-item-total">
                        {money(
                          Number(item.qty || 0) *
                          Number(item.sellingPrice || 0)
                        )}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="order-no-items">
            No item details available.
          </div>
        )}
      </section>

      {/* BILLING AND PAYMENT */}
      <div className="order-page-bottom-grid">

        <section className="order-page-card">
          <div className="order-page-card-heading">
            <div className="order-page-card-icon">
              <FiFileText />
            </div>

            <div>
              <h2>Payment Details</h2>
              <p>Settlement information</p>
            </div>
          </div>

          <div className="order-info-line">
            <span>Payment Method</span>
            <strong>{order.paymentMethod || "—"}</strong>
          </div>

          <div className="order-info-line">
            <span>Amount Received</span>
            <strong>{money(order.receivedAmount)}</strong>
          </div>

          <div className="order-info-line">
            <span>Change Returned</span>
            <strong>{money(order.changeAmount)}</strong>
          </div>
        </section>

        <section className="order-page-card order-bill-card">
          <div className="order-page-card-heading">
            <div className="order-page-card-icon">
              <FiCreditCard />
            </div>

            <div>
              <h2>Bill Summary</h2>
              <p>Complete invoice breakdown</p>
            </div>
          </div>

          <div className="order-info-line">
            <span>Total Items</span>
            <strong>{Number(order.totalQuantity || 0)}</strong>
          </div>

          <div className="order-info-line">
            <span>Subtotal</span>
            <strong>{money(order.subtotal)}</strong>
          </div>

          <div className="order-info-line">
            <span>GST</span>
            <strong>{money(order.gst)}</strong>
          </div>

          <div className="order-info-line order-total-line">
            <span>Grand Total</span>
            <strong>{money(order.grandTotal)}</strong>
          </div>

          <div className="order-info-line">
            <span>Total Profit</span>
            <strong className="order-profit-text">
              {money(order.totalProfit)}
            </strong>
          </div>
        </section>
      </div>

      {/* BOTTOM ACTIONS */}
      <div className="order-page-bottom-actions">
        <button
          type="button"
          className="order-page-back-secondary"
          onClick={onBack}
        >
          <FiArrowLeft />
          Back to Orders
        </button>

        <div>
          <button
            type="button"
            className="order-page-print-button"
            onClick={() => onPrint?.(order)}
          >
            <FiPrinter />
            Print Invoice
          </button>

          <button
            type="button"
            className="order-page-download-button"
            onClick={() => onDownloadPDF?.(order)}
          >
            <FiDownload />
            Download PDF
          </button>
        </div>
      </div>

    </main>
  );
}
