import { useCallback, useEffect, useMemo, useState } from "react";
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
import ThermalReceipt from "../../components/Billing/ThermalReceipt";
import { printThermalReceiptInWindow } from "../../services/thermalPrintService";

const INITIAL_FILTERS = {
  search: "",
  payment: "all",
  status: "all",
  dateFilter: "today",
  custom: {},
};

const STORE_ADDRESS =
  "Hiras Complex, Opposite Warana Agency, Main Kapad Line, Latur - 413512";

function toDate(value) {
  if (typeof value?.toDate === "function") return value.toDate();
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function mapOrderToReceipt(order) {
  const items = (order?.items || []).map((item) => ({
    ...item,
    qty: Number(item.qty || 0),
    sellingPrice: Number(item.sellingPrice || 0),
    productName: item.productName || item.name || "Product",
    productCode: item.productCode || item.code || item.sku || item.barcode || "-",
    categoryName: item.categoryName || item.category || item.productCategory || "-",
    variantName: item.variantName || "",
  }));

  return {
    cart: items,
    customer: order?.customer || null,
    billSummary: {
      subtotal: Number(order?.subtotal || 0),
      discount: Number(order?.discount || 0),
      gst: Number(order?.gst || 0),
      grandTotal: Number(order?.grandTotal || 0),
    },
    paymentMethod: order?.paymentMethod || "cash",
    receivedAmount: Number(order?.receivedAmount ?? order?.grandTotal ?? 0),
    invoiceNumber: order?.invoiceNumber || "",
    date: toDate(order?.createdAt),
    cashier: order?.cashier || "Administrator",
  };
}

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

  const [printOrder, setPrintOrder] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const receiptData = useMemo(
    () => (printOrder ? mapOrderToReceipt(printOrder) : null),
    [printOrder]
  );

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

      setOrders((prev) => [...prev, ...(result?.orders || [])]);
      setLastDoc(result?.lastDoc || null);
      setHasMore(Boolean(result?.hasMore));
    } catch (err) {
      console.error("Unable to load more orders:", err);
      setError("Unable to load more orders. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePrint = async (order) => {
    if (!order || isPrinting) return;

    if (!order.items?.length) {
      alert("No product details are available for this invoice.");
      return;
    }

    // Open synchronously during the click to avoid popup blocking.
    const printWindow = window.open("", "_blank", "width=420,height=800");
    if (!printWindow) {
      alert("Please allow pop-ups for this website to print the receipt.");
      return;
    }

    setIsPrinting(true);
    setPrintOrder(order);

    try {
      // Let React render the order data into the shared ThermalReceipt.
      await new Promise((resolve) => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(resolve);
        });
      });

      await printThermalReceiptInWindow(printWindow);
    } catch (err) {
      console.error("Order thermal printing failed:", err);
      alert(err?.message || "Unable to print this invoice.");
      if (!printWindow.closed) printWindow.close();
    } finally {
      setPrintOrder(null);
      setIsPrinting(false);
    }
  };

  const handleDownloadPDF = (order) => {
    console.log("Download PDF", order);
  };

  if (selectedOrder) {
    return (
      <>
        <OrderDetailsPage
          order={selectedOrder}
          onBack={() => setSelectedOrder(null)}
          onPrint={handlePrint}
          onDownloadPDF={handleDownloadPDF}
        />

        {receiptData && (
          <div aria-hidden="true">
            <ThermalReceipt
              {...receiptData}
              storeName="SAI COLLECTION"
              storeAddress={STORE_ADDRESS}
              storePhone="9271747777 / 8180918191"
              logo="/assets/sai-collection-logo.png"
            />
          </div>
        )}
      </>
    );
  }

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

      {!filters.search.trim() && <OrderSummary summary={summary} />}

      <OrderFilters filters={filters} setFilters={setFilters} />

      {error && (
        <div className="orders-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={loadDashboard}>Retry</button>
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
            {loadingMore ? "Loading orders..." : "Load More Orders"}
          </button>
        </div>
      )}

      {receiptData && (
        <div aria-hidden="true">
          <ThermalReceipt
            {...receiptData}
            storeName="SAI COLLECTION"
            storeAddress={STORE_ADDRESS}
            storePhone="9271747777 / 8180918191"
            logo="/assets/sai-collection-logo.png"
          />
        </div>
      )}

      {isPrinting && (
        <span className="orders-printing-status" role="status">
          Preparing thermal receipt...
        </span>
      )}
    </main>
  );
}
