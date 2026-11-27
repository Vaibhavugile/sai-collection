import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCustomerBillsPage,
  getCustomerCount,
  getCustomersPage,
  searchCustomers,
} from "../../services/customerDirectoryService";
import "./CustomersDashboard.css";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const dateText = (value) => {
  const date = typeof value?.toDate === "function" ? value.toDate() : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export default function CustomersDashboard() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [totalCustomers, setTotalCustomers] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [dateFilter, setDateFilter] = useState("all");
  const [custom, setCustom] = useState({ startDate: "", endDate: "" });
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [bills, setBills] = useState([]);
  const [billCursor, setBillCursor] = useState(null);
  const [billHasMore, setBillHasMore] = useState(false);
  const [billsLoading, setBillsLoading] = useState(false);
  const searchTimer = useRef(null);
  const lastDocRef = useRef(null);

  const loadCustomers = useCallback(async ({ append = false } = {}) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError("");
    try {
      const result = await getCustomersPage({
        sort,
        dateFilter,
        custom,
        lastDoc: append ? lastDocRef.current : null,
      });
      setCustomers((current) => append ? [...current, ...result.customers] : result.customers);
      lastDocRef.current = result.lastDoc;
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error("Customers load failed:", err);
      setError(err?.message || "Unable to load customers.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sort, dateFilter, custom]);

  useEffect(() => {
    let active = true;
    getCustomerCount().then((count) => {
      if (active) setTotalCustomers(count);
    }).catch((err) => console.error("Customer count failed:", err));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (search.trim()) return;
    loadCustomers();
  }, [sort, dateFilter, custom, search, loadCustomers]);

  useEffect(() => () => window.clearTimeout(searchTimer.current), []);

  const handleSearch = (value) => {
    setSearch(value);
    window.clearTimeout(searchTimer.current);
    if (!value.trim()) {
      lastDocRef.current = null;
      setLastDoc(null);
      return;
    }
    searchTimer.current = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const result = await searchCustomers(value);
        setCustomers(result);
        lastDocRef.current = null;
        setLastDoc(null);
        setHasMore(false);
      } catch (err) {
        setError(err?.message || "Search failed.");
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const openCustomer = async (customer) => {
    setSelected(customer);
    setBills([]);
    setBillCursor(null);
    setBillHasMore(false);
    setBillsLoading(true);
    try {
      const result = await getCustomerBillsPage(customer.mobile);
      setBills(result.bills);
      setBillCursor(result.lastDoc);
      setBillHasMore(result.hasMore);
    } catch (err) {
      console.error("Customer bills load failed:", err);
    } finally {
      setBillsLoading(false);
    }
  };

  const loadMoreBills = async () => {
    if (!selected || !billHasMore || billsLoading) return;
    setBillsLoading(true);
    try {
      const result = await getCustomerBillsPage(selected.mobile, billCursor);
      setBills((current) => [...current, ...result.bills]);
      setBillCursor(result.lastDoc);
      setBillHasMore(result.hasMore);
    } finally {
      setBillsLoading(false);
    }
  };

  const pageStats = useMemo(() => customers.reduce((acc, customer) => ({
    bills: acc.bills + Number(customer.totalOrders || 0),
    spent: acc.spent + Number(customer.totalSpent || 0),
    repeat: acc.repeat + (Number(customer.totalOrders || 0) > 1 ? 1 : 0),
  }), { bills: 0, spent: 0, repeat: 0 }), [customers]);

  return (
    <main className="customers-page">
      <header className="customers-header">
        <div>
          <span className="customers-eyebrow">SAI COLLECTION · LATUR</span>
          <h1>Customers</h1>
          <p>Customer records and purchase history</p>
        </div>
        <div className="customers-total">
          <strong>{totalCustomers === null ? "—" : totalCustomers.toLocaleString("en-IN")}</strong>
          <span>Total customers</span>
        </div>
      </header>

      <section className="customers-toolbar">
        <label className="customers-search">
          <span aria-hidden="true">⌕</span>
          <input value={search} onChange={(event) => handleSearch(event.target.value)} placeholder="Search name or mobile" />
          {search && <button type="button" onClick={() => handleSearch("")} aria-label="Clear search">×</button>}
        </label>
        <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort customers">
          <option value="recent">Recently visited</option>
          <option value="visits">Most visited</option>
          <option value="spending">Highest spending</option>
        </select>
        <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} aria-label="Filter last visit">
          <option value="all">All dates</option>
          <option value="today">Visited today</option>
          <option value="7days">Last 7 days</option>
          <option value="30days">Last 30 days</option>
          <option value="month">This month</option>
          <option value="custom">Custom range</option>
        </select>
      </section>

      {dateFilter === "custom" && (
        <div className="customers-custom-date">
          <label>From <input type="date" value={custom.startDate} onChange={(e) => setCustom((v) => ({ ...v, startDate: e.target.value }))} /></label>
          <label>To <input type="date" value={custom.endDate} min={custom.startDate || undefined} onChange={(e) => setCustom((v) => ({ ...v, endDate: e.target.value }))} /></label>
        </div>
      )}

      <div className="customers-page-stats">
        <span><b>{customers.length}</b> loaded</span>
        <span><b>{pageStats.repeat}</b> repeat on this page</span>
        <span><b>{money(pageStats.spent)}</b> lifetime spend on this page</span>
      </div>

      {error && <div className="customers-error">{error} <button onClick={() => loadCustomers()}>Retry</button></div>}

      <section className="customers-table-wrap">
        <table className="customers-table">
          <thead><tr><th>Customer</th><th>Mobile</th><th>Bills</th><th>Total spent</th><th>Last visit</th><th /></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="6" className="customers-empty">Loading customers…</td></tr> : customers.length === 0 ? <tr><td colSpan="6" className="customers-empty">No customers found.</td></tr> : customers.map((customer) => (
              <tr key={customer.id} onClick={() => openCustomer(customer)}>
                <td><strong>{customer.name || "Customer"}</strong><small>Since {dateText(customer.createdAt)}</small></td>
                <td>{customer.mobile || customer.id}</td>
                <td>{Number(customer.totalOrders || 0)}</td>
                <td className="customers-amount">{money(customer.totalSpent)}</td>
                <td>{dateText(customer.updatedAt)}</td>
                <td><button className="customers-view" type="button" onClick={(event) => { event.stopPropagation(); openCustomer(customer); }}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {!search.trim() && hasMore && !loading && <div className="customers-load-more"><button disabled={loadingMore} onClick={() => loadCustomers({ append: true })}>{loadingMore ? "Loading…" : "Load more customers"}</button></div>}

      {selected && (
        <div className="customer-drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <aside className="customer-drawer">
            <div className="customer-drawer-head">
              <div><span>CUSTOMER PROFILE</span><h2>{selected.name || "Customer"}</h2><p>{selected.mobile}</p></div>
              <button onClick={() => setSelected(null)} aria-label="Close customer profile">×</button>
            </div>
            <div className="customer-profile-stats">
              <div><small>Total bills</small><strong>{Number(selected.totalOrders || 0)}</strong></div>
              <div><small>Total spent</small><strong>{money(selected.totalSpent)}</strong></div>
              <div><small>Average bill</small><strong>{money(Number(selected.totalOrders || 0) ? Number(selected.totalSpent || 0) / Number(selected.totalOrders) : 0)}</strong></div>
            </div>
            <div className="customer-history-title"><h3>Purchase history</h3><span>Latest bills first</span></div>
            {billsLoading && bills.length === 0 ? <p className="customer-history-empty">Loading bills…</p> : bills.length === 0 ? <p className="customer-history-empty">No bills found for this customer.</p> : (
              <div className="customer-bills-list">
                {bills.map((bill) => <div className="customer-bill-row" key={bill.id}>
                  <div><strong>{bill.invoiceNumber || bill.id}</strong><small>{dateText(bill.createdAt)} · {bill.paymentMethod || "—"}</small></div>
                  <strong>{money(bill.grandTotal)}</strong>
                  <button onClick={() => navigate(`/orders?invoice=${encodeURIComponent(bill.invoiceNumber || bill.id)}`)}>Orders</button>
                </div>)}
              </div>
            )}
            {billHasMore && <button className="customer-history-more" disabled={billsLoading} onClick={loadMoreBills}>{billsLoading ? "Loading…" : "Load more bills"}</button>}
          </aside>
        </div>
      )}
    </main>
  );
}
