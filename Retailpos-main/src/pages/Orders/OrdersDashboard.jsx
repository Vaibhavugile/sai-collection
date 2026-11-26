
import { useCallback, useEffect, useState } from "react";
import "./OrdersDashboard.css";

import {
  getOrders,
  getSummary,
  searchOrders,
} from "../../services/orderService";

import OrderSummary from "./OrderSummary";
import OrderFilters from "./OrderFilters";
import OrdersTable from "./OrdersTable";
import OrderDetailsPage from "./OrderDetailsPage";

const INITIAL_FILTERS = {
  search: "",
  payment: "all",
  status: "all",
  dateFilter: "today",
  custom: {},
};

export default function OrdersDashboard() {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (filters.search.trim()) {
        const result = await searchOrders(filters.search.trim());

        setOrders(Array.isArray(result) ? result : []);
        setSummary(null);
        setHasMore(false);
        setLastDoc(null);
        return;
      }

      const [summaryResult, ordersResult] = await Promise.all([
        getSummary({
          dateFilter: filters.dateFilter,
          custom: filters.custom,
        }),
        getOrders({
          dateFilter: filters.dateFilter,
          custom: filters.custom,
          payment: filters.payment,
          status: filters.status,
          pageSize: 20,
        }),
      ]);

      setSummary(summaryResult || null);
      setOrders(ordersResult?.orders || []);
      setLastDoc(ordersResult?.lastDoc || null);
      setHasMore(Boolean(ordersResult?.hasMore));
    } catch (err) {
      console.error("Unable to load orders:", err);
      setError("We couldn't load your orders. Please try again.");
      setOrders([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [
    filters.search,
    filters.payment,
    filters.status,
    filters.dateFilter,
    filters.custom,
  ]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleLoadMore = async () => {
    if (
      !hasMore ||
      loadingMore ||
      loading ||
      filters.search.trim() ||
      !lastDoc
    ) {
      return;
    }

    try {
      setLoadingMore(true);

      const result = await getOrders({
        dateFilter: filters.dateFilter,
        custom: filters.custom,
        payment: filters.payment,
        status: filters.status,
        pageSize: 20,
        lastDoc,
      });

      setOrders((prev) => [
        ...prev,
        ...(result?.orders || []),
      ]);

      setLastDoc(result?.lastDoc || null);
      setHasMore(Boolean(result?.hasMore));
    } catch (err) {
      console.error("Unable to load more orders:", err);
      setError("Unable to load more orders. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePrint = (order) => {
    console.log("Print Invoice", order);
  };

  const handleDownloadPDF = (order) => {
    console.log("Download PDF", order);
  };

  // FULL PAGE ORDER DETAILS
  if (selectedOrder) {
    return (
      <OrderDetailsPage
        order={selectedOrder}
        onBack={() => setSelectedOrder(null)}
        onPrint={handlePrint}
        onDownloadPDF={handleDownloadPDF}
      />
    );
  }

  // ORDERS DASHBOARD
  return (
    <main className="orders-page">
      <header className="orders-page-header">
        <div>
          <span className="orders-page-eyebrow">
            SAI COLLECTION · LATUR
          </span>

          <h1>Orders</h1>

          <p>
            Track sales, review invoices and monitor payment performance.
          </p>
        </div>

        <div className="orders-page-date">
          <span>ORDERS OVERVIEW</span>

          <strong>
            {new Date().toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </strong>
        </div>
      </header>

      {!filters.search.trim() && (
        <OrderSummary summary={summary} />
      )}

      <OrderFilters
        filters={filters}
        setFilters={setFilters}
      />

      {error && (
        <div className="orders-error" role="alert">
          <span>{error}</span>

          <button
            type="button"
            onClick={loadDashboard}
          >
            Retry
          </button>
        </div>
      )}

      <OrdersTable
        orders={orders}
        loading={loading}
        onViewOrder={setSelectedOrder}
        onPrint={handlePrint}
      />

      {hasMore && !loading && (
        <div className="orders-load-more">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore
              ? "Loading orders..."
              : "Load More Orders"}
          </button>
        </div>
      )}
    </main>
  );
}
