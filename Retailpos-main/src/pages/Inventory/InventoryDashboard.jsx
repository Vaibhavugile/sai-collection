
import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  CircularProgress,
  Snackbar,
  Typography,
} from "@mui/material";

import {
  Inventory2Rounded,
  RefreshRounded,
} from "@mui/icons-material";

import { motion } from "framer-motion";

import { subscribeProducts } from "../../services/productService";
import { subscribeCategories } from "../../services/categoryService";
import { subscribeSubCategories } from "../../services/subCategoryService";

import InventoryStats from "../../components/Inventory/InventoryStats";
import InventoryToolbar from "../../components/Inventory/InventoryToolbar";
import InventoryTable from "../../components/Inventory/InventoryTable";

import "./InventoryDashboard.css";

const GOLD = "#B58A45";

// --------------------------------------------------
// INVENTORY DASHBOARD
// --------------------------------------------------

export default function InventoryDashboard() {
  // --------------------------------------------------
  // STATES
  // --------------------------------------------------

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");

  // --------------------------------------------------
  // FIREBASE: PRODUCTS
  // --------------------------------------------------

  useEffect(() => {
    let mounted = true;

    const unsubscribe = subscribeProducts((data) => {
      if (!mounted) return;

      setProducts(Array.isArray(data) ? data : []);
      setLoading(false);
    });

    return () => {
      mounted = false;

      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  // --------------------------------------------------
  // FIREBASE: CATEGORIES
  // --------------------------------------------------

  useEffect(() => {
    let mounted = true;

    const unsubscribe = subscribeCategories((data) => {
      if (!mounted) return;

      setCategories(Array.isArray(data) ? data : []);
    });

    return () => {
      mounted = false;

      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  // --------------------------------------------------
  // FIREBASE: SUBCATEGORIES
  // --------------------------------------------------

  useEffect(() => {
    let mounted = true;

    const unsubscribe = subscribeSubCategories((data) => {
      if (!mounted) return;

      setSubCategories(Array.isArray(data) ? data : []);
    });

    return () => {
      mounted = false;

      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  // --------------------------------------------------
  // RESET FILTERS
  // --------------------------------------------------

  const handleRefresh = () => {
    setSearch("");
    setCategory("");
    setSubCategory("");
    setStatus("");

    setNotification("Inventory filters have been reset.");
  };

  // --------------------------------------------------
  // PRODUCT FILTERING
  // --------------------------------------------------

  const filteredProducts = useMemo(() => {
    let result = [...products];

    const keyword = search.trim().toLowerCase();

    // SEARCH BY PRODUCT NAME OR CODE
    if (keyword) {
      result = result.filter((product) => {
        return (
          product.name?.toLowerCase().includes(keyword) ||
          product.productCode?.toLowerCase().includes(keyword)
        );
      });
    }

    // CATEGORY FILTER
    if (category) {
      result = result.filter((product) => {
        return (
          product.categoryId === category ||
          product.categoryName === category
        );
      });
    }

    // SUBCATEGORY FILTER
    if (subCategory) {
      result = result.filter((product) => {
        return (
          product.subCategoryId === subCategory ||
          product.subcategoryId === subCategory ||
          product.subCategoryName === subCategory
        );
      });
    }

    // STATUS FILTER
    if (status) {
      result = result.filter((product) => {
        const productStatus =
          typeof product.status === "boolean"
            ? product.status
              ? "active"
              : "inactive"
            : String(product.status || "").toLowerCase();

        return productStatus === status;
      });
    }

    return result;
  }, [
    products,
    search,
    category,
    subCategory,
    status,
  ]);

  // --------------------------------------------------
  // ACTIVE FILTER COUNT
  // --------------------------------------------------

  const activeFilterCount = [
    Boolean(search.trim()),
    Boolean(category),
    Boolean(subCategory),
    Boolean(status),
  ].filter(Boolean).length;

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <motion.div
      className="inventory-page"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* ==========================================
          PAGE HEADER
      ========================================== */}

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
            Live Inventory
          </Box>
        </Box>

      </Box>

      {/* ==========================================
          INVENTORY SUMMARY
      ========================================== */}

      <Box className="inventory-summary">
        <Box>
          <Typography className="inventory-summary-label">
            TOTAL PRODUCTS
          </Typography>

          <Typography className="inventory-summary-value">
            {loading
              ? "—"
              : products.length.toLocaleString("en-IN")}
          </Typography>

          <Typography className="inventory-summary-caption">
            Products registered in your catalogue
          </Typography>
        </Box>

        <Box className="inventory-summary-decoration">
          <Inventory2Rounded />
        </Box>
      </Box>

      {/* ==========================================
          STATISTICS
      ========================================== */}

      {loading ? (
        <Box className="inventory-loading">
          <CircularProgress
            size={30}
            sx={{ color: GOLD }}
          />

          <Typography>
            Loading inventory...
          </Typography>
        </Box>
      ) : (
        <InventoryStats products={products} />
      )}

      {/* ==========================================
          TOOLBAR
      ========================================== */}

      <InventoryToolbar
        search={search}
        setSearch={setSearch}

        category={category}
        setCategory={setCategory}

        subCategory={subCategory}
        setSubCategory={setSubCategory}

        status={status}
        setStatus={setStatus}

        categories={categories}
        subCategories={subCategories}

        onRefresh={handleRefresh}
      />

      {/* ==========================================
          PRODUCT RESULTS
      ========================================== */}

      <Box className="inventory-results-heading">

        <Box>
          <Typography className="inventory-results-title">
            Product Inventory
          </Typography>

          <Typography className="inventory-results-caption">
            {loading
              ? "Fetching your products..."
              : `Showing ${filteredProducts.length.toLocaleString("en-IN")} of ${products.length.toLocaleString("en-IN")} products`}
          </Typography>
        </Box>

        {activeFilterCount > 0 && (
          <Box className="inventory-filter-count">
            {activeFilterCount} active filter
            {activeFilterCount > 1 ? "s" : ""}
          </Box>
        )}

      </Box>

      {/* ==========================================
          TABLE
      ========================================== */}

      {loading ? (
        <Box className="inventory-loading inventory-table-loading">
          <CircularProgress
            size={30}
            sx={{ color: GOLD }}
          />

          <Typography>
            Preparing your product catalogue...
          </Typography>
        </Box>
      ) : (
        <InventoryTable
          products={filteredProducts}
          search=""
        />
      )}

      {/* ==========================================
          NOTIFICATION
      ========================================== */}

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
