import "./OrdersTable.css";

export default function OrdersTable({
  orders = [],
  loading = false,
  onViewOrder,
  onPrint,
}) {
  const formatDate = (createdAt) => {
    if (!createdAt) return "—";

    const date = typeof createdAt?.toDate === "function"
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

  const paymentClass = (value) =>
    String(value || "unknown").toLowerCase().replace(/[^a-z0-9_-]/g, "");

  const statusClass = (value) =>
    String(value || "unknown").toLowerCase().replace(/[^a-z0-9_-]/g, "");

  if (loading) {
    return (
      <div className="orders-table-state">
        <div className="orders-loading-spinner" />
        <strong>Loading orders</strong>
        <span>Preparing your sales records...</span>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="orders-table-state orders-empty-state">
        <div className="orders-empty-icon">▤</div>
        <h3>No Orders Found</h3>
        <p>Try changing your filters or search for another invoice.</p>
      </div>
    );
  }

  return (
    <section className="orders-table-card">
      <div className="orders-table-heading">
        <div>
          <h2>Sales Records</h2>
          <p>{orders.length} order{orders.length === 1 ? "" : "s"} displayed</p>
        </div>
        <span className="orders-record-count">LATEST TRANSACTIONS</span>
      </div>

      <div className="orders-table-scroll">
        <table className="orders-table">
          <thead>
            <tr>
              <th>INVOICE</th>
              <th>DATE</th>
              <th>CUSTOMER</th>
              <th>ITEMS</th>
              <th>AMOUNT</th>
              <th>PAYMENT</th>
              <th>PROFIT</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr key={order.id || order.invoiceNumber || index}>
                <td>
                  <strong className="orders-invoice-number">
                    {order.invoiceNumber || "—"}
                  </strong>
                </td>
                <td className="orders-date-cell">{formatDate(order.createdAt)}</td>
                <td>
                  <div className="orders-customer-cell">
                    <strong>{order.customer?.name || "Walk-in Customer"}</strong>
                    <span>{order.customer?.mobile || "No mobile provided"}</span>
                  </div>
                </td>
                <td><span className="orders-quantity">{Number(order.totalQuantity || 0)}</span></td>
                <td><strong className="orders-amount">{money(order.grandTotal)}</strong></td>
                <td>
                  <span className={`orders-payment-badge ${paymentClass(order.paymentMethod)}`}>
                    {order.paymentMethod || "—"}
                  </span>
                </td>
                <td><span className="orders-profit">{money(order.totalProfit)}</span></td>
                <td>
                  <span className={`orders-status-badge ${statusClass(order.status)}`}>
                    {order.status || "Unknown"}
                  </span>
                </td>
                <td>
                  <div className="orders-row-actions">
                    <button type="button" className="orders-view-button" onClick={() => onViewOrder?.(order)}>
                      View
                    </button>
                    <button type="button" className="orders-print-button" onClick={() => onPrint?.(order)}>
                      Print
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
