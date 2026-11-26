import "./OrderSummary.css";

export default function OrderSummary({ summary }) {
  const data = {
    totalOrders: Number(summary?.totalOrders || 0),
    totalSales: Number(summary?.totalSales || 0),
    totalProfit: Number(summary?.totalProfit || 0),
    averageBill: Number(summary?.averageBill || 0),
    cashSales: Number(summary?.cashSales || 0),
    upiSales: Number(summary?.upiSales || 0),
    cardSales: Number(summary?.cardSales || 0),
    totalGST: Number(summary?.totalGST || 0),
  };

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const cards = [
    { title: "Total Orders", value: data.totalOrders.toLocaleString("en-IN"), icon: "▤", tone: "gold" },
    { title: "Total Sales", value: formatCurrency(data.totalSales), icon: "₹", tone: "sand" },
    { title: "Total Profit", value: formatCurrency(data.totalProfit), icon: "↗", tone: "green" },
    { title: "Average Bill", value: formatCurrency(data.averageBill), icon: "◫", tone: "charcoal" },
    { title: "Cash Sales", value: formatCurrency(data.cashSales), icon: "C", tone: "gold" },
    { title: "UPI Sales", value: formatCurrency(data.upiSales), icon: "U", tone: "sand" },
    { title: "Card Sales", value: formatCurrency(data.cardSales), icon: "▣", tone: "charcoal" },
    { title: "Total GST", value: formatCurrency(data.totalGST), icon: "%", tone: "green" },
  ];

  return (
    <section className="orders-summary-grid" aria-label="Order summary">
      {cards.map((card) => (
        <article className="orders-summary-card" key={card.title}>
          <div className={`orders-summary-icon ${card.tone}`} aria-hidden="true">
            {card.icon}
          </div>
          <div className="orders-summary-content">
            <span>{card.title}</span>
            <strong>{card.value}</strong>
          </div>
        </article>
      ))}
    </section>
  );
}
