
import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  CircularProgress,
  Snackbar,
  Typography,
} from "@mui/material";

import { Inventory2Rounded } from "@mui/icons-material";
import { motion } from "framer-motion";

import {
  fetchInventoryProductsPage,
  getInventoryProductsCount,
} from "../../services/productService";

import { subscribeCategories } from "../../services/categoryService";
import { subscribeSubCategories } from "../../services/subCategoryService";

import InventoryStats from "../../components/Inventory/InventoryStats";
import InventoryToolbar from "../../components/Inventory/InventoryToolbar";
import InventoryTable from "../../components/Inventory/InventoryTable";

import "./InventoryDashboard.css";

const GOLD = "#B58A45";
const PAGE_SIZE = 100;

export default function InventoryDashboard() {
  const [products, setProducts] = useState([]);

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  // Search input and applied search are separate.
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [status, setStatus] = useState("");

  const [pageIndex, setPageIndex] = useState(0);
  const [pageCursors, setPageCursors] = useState([null]);

  const [lastVisible, setLastVisible] = useState(null);

  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [loading, setLoading] = useState(true);
  const [countLoading, setCountLoading] = useState(true);

  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");

  /* =========================================
     RESET PAGINATION
  ========================================= */

  const resetPagination = () => {
    setPageIndex(0);
    setPageCursors([null]);
    setLastVisible(null);
  };

  /* =========================================
     SEARCH INPUT CHANGE
     Does NOT query Firestore.
  ========================================= */

  const handleSearchChange = (value) => {
    setSearch(value.toUpperCase());
  };

  /* =========================================
     APPLY SEARCH
     Runs only on Enter or Search button.
  ========================================= */

  const handleSearchSubmit = (value) => {
    const productCode = String(value || "")
      .trim()
      .toUpperCase();

    setAppliedSearch(productCode);
    resetPagination();
  };

  /* =========================================
     CATEGORY SUBSCRIPTION
  ========================================= */

  useEffect(() => {
    const unsubscribe = subscribeCategories((data) => {
      setCategories(Array.isArray(data) ? data : []);
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  /* =========================================
     SUBCATEGORY SUBSCRIPTION
  ========================================= */

  useEffect(() => {
    const unsubscribe = subscribeSubCategories((data) => {
      setSubCategories(Array.isArray(data) ? data : []);
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  /* =========================================
     FETCH MATCHING PRODUCT COUNT
  ========================================= */

  useEffect(() => {
    let cancelled = false;

    const loadCount = async () => {
      setCountLoading(true);

      try {
        const count = await getInventoryProductsCount({
          productCode: appliedSearch,
          categoryId: category,
          subCategoryId: subCategory,
          status,
        });

        if (!cancelled) {
          setTotalCount(count);
        }
      } catch (err) {
        console.error("Inventory count error:", err);

        if (!cancelled) {
          setError(
            err.message || "Unable to calculate product count."
          );
        }
      } finally {
        if (!cancelled) {
          setCountLoading(false);
        }
      }
    };

    loadCount();

    return () => {
      cancelled = true;
    };
  }, [appliedSearch, category, subCategory, status]);

  /* =========================================
     FETCH CURRENT PRODUCT PAGE
  ========================================= */

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      setLoading(true);
      setError("");

      try {
        const cursor = pageCursors[pageIndex] || null;

        const result = await fetchInventoryProductsPage({
          pageSize: PAGE_SIZE,
          cursor,
          productCode: appliedSearch,
          categoryId: category,
          subCategoryId: subCategory,
          status,
        });

        if (cancelled) return;

        setProducts(result.products || []);
        setHasMore(Boolean(result.hasMore));
        setLastVisible(result.lastVisible || null);
      } catch (err) {
        console.error("Inventory page error:", err);

        if (!cancelled) {
          setProducts([]);
          setHasMore(false);
          setLastVisible(null);
          setError(
            err.message || "Unable to load inventory products."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [
    pageIndex,
    pageCursors,
    appliedSearch,
    category,
    subCategory,
    status,
  ]);

  /* =========================================
     FILTER HANDLERS
  ========================================= */

  const handleCategoryChange = (value) => {
    setCategory(value);
    setSubCategory("");
    resetPagination();
  };

  const handleSubCategoryChange = (value) => {
    setSubCategory(value);
    resetPagination();
  };

  const handleStatusChange = (value) => {
    setStatus(value);
    resetPagination();
  };

  /* =========================================
     RESET ALL FILTERS
  ========================================= */

  const handleRefresh = () => {
    setSearch("");
    setAppliedSearch("");

    setCategory("");
    setSubCategory("");
    setStatus("");

    resetPagination();

    setNotification("Inventory filters have been reset.");
  };

  /* =========================================
     NEXT PAGE
  ========================================= */

  const handleNext = () => {
    if (!hasMore || !lastVisible || loading) return;

    setPageCursors((previous) => [
      ...previous.slice(0, pageIndex + 1),
      lastVisible,
    ]);

    setPageIndex((previous) => previous + 1);
  };

  /* =========================================
     PREVIOUS PAGE
  ========================================= */

  const handlePrevious = () => {
    if (pageIndex === 0 || loading) return;

    setPageIndex((previous) => previous - 1);
  };

  /* =========================================
     PAGINATION DISPLAY
  ========================================= */

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const startItem =
    totalCount === 0 ? 0 : pageIndex * PAGE_SIZE + 1;

  const endItem = Math.min(
    (pageIndex + 1) * PAGE_SIZE,
    totalCount
  );

  const activeFilterCount = [
    Boolean(appliedSearch),
    Boolean(category),
    Boolean(subCategory),
    Boolean(status),
  ].filter(Boolean).length;

  /* =========================================
     UI
  ========================================= */

  return (
    <motion.div
      className="inventory-page"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* HEADER */}

      <Box className="inventory-page-header">
        <Box>
          <Box className="inventory-page-eyebrow">
            <Inventory2Rounded />
            <span>SAI COLLECTION · LATUR</span>
          </Box>

          <Typography className="inventory-page-title">
            Inventory
          </Typography>

          <Typography className="inventory-page-subtitle">
            Manage your products, stock levels and inventory in one place.
          </Typography>
        </Box>

        <Box className="inventory-header-right">
          <Box className="inventory-live-indicator">
            <span />
            Paginated Inventory
          </Box>
        </Box>
      </Box>

      {/* TOTAL MATCHING PRODUCTS */}

      <Box className="inventory-summary">
        <Box>
          <Typography className="inventory-summary-label">
            MATCHING PRODUCTS
          </Typography>

          <Typography className="inventory-summary-value">
            {countLoading
              ? "—"
              : totalCount.toLocaleString("en-IN")}
          </Typography>

          <Typography className="inventory-summary-caption">
            Products matching your current filters
          </Typography>
        </Box>

        <Box className="inventory-summary-decoration">
          <Inventory2Rounded />
        </Box>
      </Box>

      {/* PAGE STATISTICS */}

      {!loading && products.length > 0 && (
        <>
          <Typography
            sx={{
              fontSize: 11,
              color: "#8A806F",
              mb: 1,
            }}
          >
            Statistics below are calculated from the 100 products on this page.
          </Typography>

          <InventoryStats products={products} />
        </>
      )}

      {/* TOOLBAR */}

      <InventoryToolbar
        search={search}
        setSearch={handleSearchChange}
        onSearch={handleSearchSubmit}

        category={category}
        setCategory={handleCategoryChange}

        subCategory={subCategory}
        setSubCategory={handleSubCategoryChange}

        status={status}
        setStatus={handleStatusChange}

        categories={categories}
        subCategories={subCategories}

        onRefresh={handleRefresh}
      />

      {/* RESULTS HEADER */}

      <Box className="inventory-results-heading">
        <Box>
          <Typography className="inventory-results-title">
            Product Inventory
          </Typography>

          <Typography className="inventory-results-caption">
            {loading
              ? "Loading products..."
              : `Showing ${startItem.toLocaleString("en-IN")}–${endItem.toLocaleString("en-IN")} of ${totalCount.toLocaleString("en-IN")} products`}
          </Typography>
        </Box>

        {activeFilterCount > 0 && (
          <Box className="inventory-filter-count">
            {activeFilterCount} active filter
            {activeFilterCount > 1 ? "s" : ""}
          </Box>
        )}
      </Box>

      {/* ERROR */}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* TABLE */}

      {loading ? (
        <Box className="inventory-loading inventory-table-loading">
          <CircularProgress
            size={30}
            sx={{ color: GOLD }}
          />

          <Typography>
            Loading up to 100 products...
          </Typography>
        </Box>
      ) : (
        <InventoryTable
          products={products}
          search=""
        />
      )}

      {/* PAGINATION */}

      <Box className="inventory-pagination">
        <Typography className="inventory-pagination-info">
          Page {pageIndex + 1}
          {totalPages > 0 ? ` of ${totalPages}` : ""}
        </Typography>

        <Box className="inventory-pagination-actions">
          <button
            type="button"
            className="inventory-page-button"
            onClick={handlePrevious}
            disabled={pageIndex === 0 || loading}
          >
            ← Previous
          </button>

          <button
            type="button"
            className="inventory-page-button primary"
            onClick={handleNext}
            disabled={!hasMore || loading}
          >
            Next →
          </button>
        </Box>
      </Box>

      {/* NOTIFICATION */}

      <Snackbar
        open={Boolean(notification)}
        autoHideDuration={2500}
        onClose={() => setNotification("")}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setNotification("")}
          sx={{ borderRadius: "10px" }}
        >
          {notification}
        </Alert>
      </Snackbar>
    </motion.div>
  );
}
