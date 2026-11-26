
import "./ProductEditHistory.css";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowBackRounded,
  HistoryRounded,
  PersonOutlineRounded,
  ScheduleRounded,
  Inventory2Outlined,
  RefreshRounded,
  EditOutlined,
  TrendingUpRounded,
} from "@mui/icons-material";

import {
  getProductById,
  subscribeProductEditHistory,
} from "../../services/productService";

/* =========================================================
   DATE FORMAT
========================================================= */

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  const date = value?.toDate
    ? value.toDate()
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* =========================================================
   FIELD LABEL
========================================================= */

const formatFieldName = (field = "") => {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

/* =========================================================
   VALUE FORMAT
========================================================= */

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Empty";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value.length
      ? value.map(formatValue).join(", ")
      : "None";
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .filter(
        ([key]) =>
          ![
            "id",
            "sku",
            "barcode",
            "productCode",
            "attributes",
          ].includes(key)
      )
      .map(
        ([key, val]) =>
          `${formatFieldName(key)}: ${formatValue(val)}`
      )
      .join(" · ");
  }

  return String(value);
};

/* =========================================================
   GET VARIANT DISPLAY NAME
========================================================= */

const getVariantName = (variant) => {
  if (!variant) return "Variant";

  if (variant.variantName) {
    return variant.variantName;
  }

  if (variant.attributes && typeof variant.attributes === "object") {
    const attributeValues = Object.values(variant.attributes)
      .filter(Boolean)
      .join(" / ");

    if (attributeValues) return attributeValues;
  }

  return "Variant";
};

/* =========================================================
   COMPARE VARIANTS
   Displays only changed properties.
========================================================= */

const getVariantChanges = (beforeVariants = [], afterVariants = []) => {
  const rows = [];

  const getVariantKey = (variant, index) =>
    variant?.id ||
    variant?.sku ||
    variant?.variantName ||
    `variant-${index}`;

  const beforeMap = new Map(
    beforeVariants.map((variant, index) => [
      getVariantKey(variant, index),
      variant,
    ])
  );

  const afterMap = new Map(
    afterVariants.map((variant, index) => [
      getVariantKey(variant, index),
      variant,
    ])
  );

  const allKeys = new Set([
    ...beforeMap.keys(),
    ...afterMap.keys(),
  ]);

  allKeys.forEach((key) => {
    const before = beforeMap.get(key);
    const after = afterMap.get(key);

    if (!before && after) {
      rows.push({
        key: `added-${key}`,
        label: `${getVariantName(after)} · Added`,
        before: "Not present",
        after: "Added",
      });

      return;
    }

    if (before && !after) {
      rows.push({
        key: `removed-${key}`,
        label: `${getVariantName(before)} · Removed`,
        before: "Present",
        after: "Removed",
      });

      return;
    }

    const properties = new Set([
      ...Object.keys(before || {}),
      ...Object.keys(after || {}),
    ]);

    properties.forEach((property) => {
      // Ignore technical fields that are not useful in the timeline.
      if (
        [
          "id",
          "sku",
          "barcode",
          "productCode",
        ].includes(property)
      ) {
        return;
      }

     const oldValue =
  property === "attributes"
    ? Object.fromEntries(
        Object.entries(before?.attributes || {}).sort(([a], [b]) =>
          a.localeCompare(b)
        )
      )
    : before?.[property] ?? null;

const newValue =
  property === "attributes"
    ? Object.fromEntries(
        Object.entries(after?.attributes || {}).sort(([a], [b]) =>
          a.localeCompare(b)
        )
      )
    : after?.[property] ?? null;

      if (
        JSON.stringify(oldValue) !==
        JSON.stringify(newValue)
      ) {
        rows.push({
          key: `${key}-${property}`,
          label: `${getVariantName(after)} · ${formatFieldName(property)}`,
          before: oldValue,
          after: newValue,
        });
      }
    });
  });

  return rows;
};

/* =========================================================
   GET DISPLAY CHANGES
   Supports old and new history records.
========================================================= */

const getDisplayChanges = (entry) => {
  const changes = entry.changes || {};
  const rows = [];

  Object.entries(changes).forEach(([field, change]) => {
    if (field === "variants") {
      const variantRows = getVariantChanges(
        Array.isArray(change.before) ? change.before : [],
        Array.isArray(change.after) ? change.after : []
      );

      rows.push(...variantRows);
      return;
    }

    rows.push({
      key: field,
      label: formatFieldName(field),
      before: change.before,
      after: change.after,
    });
  });

  return rows;
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function ProductEditHistory() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(true);
  const [error, setError] = useState("");

  /* -------------------------------------------------------
     LOAD PRODUCT
  ------------------------------------------------------- */

  useEffect(() => {
    let mounted = true;

    const loadProduct = async () => {
      try {
        setProductLoading(true);

        const result = await getProductById(id);

        if (mounted) {
          setProduct(result || null);
        }
      } catch (err) {
        console.error("Product loading error:", err);

        if (mounted) {
          setError("Unable to load product details.");
        }
      } finally {
        if (mounted) {
          setProductLoading(false);
        }
      }
    };

    if (id) {
      loadProduct();
    }

    return () => {
      mounted = false;
    };
  }, [id]);

  /* -------------------------------------------------------
     LIVE HISTORY SUBSCRIPTION
  ------------------------------------------------------- */

  useEffect(() => {
    if (!id) return undefined;

    setLoading(true);
    setError("");

    const unsubscribe = subscribeProductEditHistory(
      id,
      (records) => {
        setHistory(Array.isArray(records) ? records : []);
        setLoading(false);
      },
      (err) => {
        console.error(
          "Product history subscription error:",
          err
        );

        setError(
          "Unable to load edit history. Please try again."
        );

        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [id]);

  /* -------------------------------------------------------
     PRODUCT DETAILS
  ------------------------------------------------------- */

  const productName = product?.name || "Product";
  const productCode = product?.productCode || id || "—";

  const totalChanges = history.reduce(
    (total, entry) =>
      total + getDisplayChanges(entry).length,
    0
  );

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <main className="product-history-page">
      <div className="product-history-container">

        {/* TOP BAR */}

        <div className="product-history-topbar">
          <button
            type="button"
            className="history-back-button"
            onClick={() => navigate("/inventory")}
          >
            <ArrowBackRounded />
            <span>Back to Inventory</span>
          </button>

          <button
            type="button"
            className="history-refresh-button"
            onClick={() => window.location.reload()}
            title="Refresh history"
            aria-label="Refresh history"
          >
            <RefreshRounded />
          </button>
        </div>

        {/* PAGE HEADING */}

        <section className="product-history-heading">
          <div className="history-heading-icon">
            <HistoryRounded />
          </div>

          <div className="history-heading-content">
            <span className="history-eyebrow">
              PRODUCT MANAGEMENT
            </span>

            <h1>Product Edit History</h1>

            <p>
              A complete record of changes made to your product.
            </p>
          </div>
        </section>

        {/* PRODUCT CARD */}

        <section className="history-product-card">
          <div className="history-product-icon">
            <Inventory2Outlined />
          </div>

          <div className="history-product-details">
            <span>PRODUCT DETAILS</span>

            <h2>
              {productLoading
                ? "Loading product..."
                : productName}
            </h2>

            <p>
              Product Code: <strong>{productCode}</strong>
            </p>
          </div>

          <button
            type="button"
            className="history-edit-button"
            onClick={() => navigate(`/products/edit/${id}`)}
          >
            <EditOutlined />
            <span>Edit Product</span>
          </button>
        </section>

        {/* SUMMARY */}

        <section className="history-summary-grid">
          <div className="history-summary-card">
            <div className="history-summary-icon">
              <HistoryRounded />
            </div>

            <div>
              <span>EDIT SESSIONS</span>
              <strong>
                {history.length.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>

          <div className="history-summary-card">
            <div className="history-summary-icon">
              <TrendingUpRounded />
            </div>

            <div>
              <span>FIELD CHANGES</span>
              <strong>
                {totalChanges.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>
        </section>

        {/* HISTORY CONTENT */}

        <section className="history-content-card">

          <div className="history-section-header">
            <div>
              <span className="history-section-eyebrow">
                AUDIT LOG
              </span>

              <h2>Activity Timeline</h2>

              <p>
                Every saved product update, organized by date.
              </p>
            </div>

            <div className="history-live-label">
              <span />
              Live updates
            </div>
          </div>

          {/* ERROR */}

          {error ? (
            <div className="history-message history-error">
              <p>{error}</p>
            </div>
          ) : loading ? (
            <div className="history-message">
              <div className="history-loader" />
              <p>Loading product history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="history-message history-empty">
              <div className="history-empty-icon">
                <HistoryRounded />
              </div>

              <h3>No edit history yet</h3>

              <p>
                When you update this product, the changes
                will automatically appear here.
              </p>

              <button
                type="button"
                onClick={() => navigate(`/products/edit/${id}`)}
              >
                Edit This Product
              </button>
            </div>
          ) : (
            <div className="history-timeline">

              {history.map((entry, index) => {
                const displayChanges = getDisplayChanges(entry);

                return (
                  <article
                    className="history-entry"
                    key={entry.id || entry.historyId || index}
                  >
                    {/* TIMELINE MARKER */}

                    <div className="history-timeline-marker">
                      <span />
                    </div>

                    {/* ENTRY CARD */}

                    <div className="history-entry-card">

                      <div className="history-entry-header">
                        <div className="history-entry-title">
                          <div className="history-entry-title-icon">
                            <EditOutlined />
                          </div>

                          <div>
                            <h3>Product updated</h3>

                            <div className="history-entry-meta">
                              <span>
                                <PersonOutlineRounded />

                                {entry.editedBy?.name ||
                                  entry.editedBy?.email ||
                                  "Admin"}
                              </span>

                              <span>
                                <ScheduleRounded />

                                {formatDate(entry.editedAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span className="history-change-count">
                          {displayChanges.length}{" "}
                          {displayChanges.length === 1
                            ? "change"
                            : "changes"}
                        </span>
                      </div>

                      {/* INDIVIDUAL CHANGES */}

                      {displayChanges.length > 0 ? (
                        <div className="history-changes-list">

                          {displayChanges.map((change) => (
                            <div
                              className="history-change-row"
                              key={change.key}
                            >
                              <div className="history-field-name">
                                <span className="history-field-dot" />
                                {change.label}
                              </div>

                              <div className="history-values">

                                <div className="history-value-box before">
                                  <span>BEFORE</span>
                                  <p>
                                    {formatValue(change.before)}
                                  </p>
                                </div>

                                <div className="history-change-arrow">
                                  →
                                </div>

                                <div className="history-value-box after">
                                  <span>AFTER</span>
                                  <p>
                                    {formatValue(change.after)}
                                  </p>
                                </div>

                              </div>
                            </div>
                          ))}

                        </div>
                      ) : (
                        <p className="history-no-details">
                          Change details are not available for this record.
                        </p>
                      )}

                    </div>
                  </article>
                );
              })}

            </div>
          )}

        </section>

        {/* FOOTER */}

        <div className="history-page-footer">
          <span>Sai Collection · Latur</span>
          <span>Product Activity Records</span>
        </div>

      </div>
    </main>
  );
}
