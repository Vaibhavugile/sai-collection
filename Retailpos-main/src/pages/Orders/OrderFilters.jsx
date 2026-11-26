import "./OrderFilters.css";

export default function OrderFilters({ filters, setFilters }) {
  const safeFilters = {
    search: "",
    payment: "all",
    status: "all",
    dateFilter: "today",
    ...(filters || {}),
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      payment: "all",
      status: "all",
      dateFilter: "today",
      custom: {},
    });
  };

  const hasActiveFilters =
    safeFilters.search ||
    safeFilters.payment !== "all" ||
    safeFilters.status !== "all" ||
    safeFilters.dateFilter !== "today";

  return (
    <section className="orders-filter-panel" aria-label="Filter orders">
      <div className="orders-filter-heading">
        <div>
          <span className="orders-filter-eyebrow">FIND A TRANSACTION</span>
          <h2>Orders & Filters</h2>
        </div>
        <button type="button" className="orders-reset-button" onClick={resetFilters}>
          Reset filters
        </button>
      </div>

      <div className="orders-filter-controls">
        <label className="orders-search-field">
          <span className="orders-search-icon" aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder="Search invoice, customer or mobile..."
            value={safeFilters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            aria-label="Search invoice, customer or mobile"
          />
          {safeFilters.search && (
            <button
              type="button"
              className="orders-clear-search"
              onClick={() => updateFilter("search", "")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </label>

        <label className="orders-filter-select">
          <span>Payment</span>
          <select
            value={safeFilters.payment}
            onChange={(e) => updateFilter("payment", e.target.value)}
          >
            <option value="all">All Payments</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
          </select>
        </label>

        <label className="orders-filter-select">
          <span>Status</span>
          <select
            value={safeFilters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="RETURNED">Returned</option>
          </select>
        </label>

        <label className="orders-filter-select">
          <span>Date range</span>
          <select
            value={safeFilters.dateFilter}
            onChange={(e) => updateFilter("dateFilter", e.target.value)}
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom</option>
            <option value="all">All Time</option>
          </select>
        </label>
      </div>

      {hasActiveFilters && (
        <div className="orders-filter-footnote">
          Filters are applied automatically when you change a selection.
        </div>
      )}
    </section>
  );
}
