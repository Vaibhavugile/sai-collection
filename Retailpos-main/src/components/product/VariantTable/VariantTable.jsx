
import "./VariantTable.css";
import { useState } from "react";
import { useLocation } from "react-router-dom";

import {
  FiPackage,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiLayers,
  FiDollarSign,
  FiTrendingUp,
  FiBox,
  FiSliders,
} from "react-icons/fi";

export default function VariantTable({ product, setProduct }) {
  const location = useLocation();

  const isView = location.pathname.startsWith("/products/view");

  const [bulk, setBulk] = useState({
    purchasePrice: "",
    sellingPrice: "",
    stock: "",
    lowStock: "",
  });

  const variants = product?.variants || [];

  // -----------------------------------------
  // PREVENT ACCIDENTAL NUMBER CHANGES
  // -----------------------------------------

  const preventNumberChange = (e) => {
    if (e.type === "wheel") {
      e.preventDefault();
      e.currentTarget.blur();
      return;
    }

    if (
      ["ArrowUp", "ArrowDown", "PageUp", "PageDown"].includes(e.key)
    ) {
      e.preventDefault();
    }
  };

  const updateVariant = (index, field, value) => {
    if (isView) return;

    setProduct((prev) => ({
      ...prev,
      variants: (prev.variants || []).map((variant, i) =>
        i === index
          ? { ...variant, [field]: value }
          : variant
      ),
    }));
  };

  const deleteVariant = (index) => {
    if (isView) return;

    const variant = variants[index];

    const confirmed = window.confirm(
      `Delete variant "${variant.variantName || "Unnamed"}"? This change will be saved when you update the product.`
    );

    if (!confirmed) return;

    setProduct((prev) => ({
      ...prev,
      variants: (prev.variants || []).filter((_, i) => i !== index),
    }));
  };

  const applyToAll = (field) => {
    if (isView || bulk[field] === "") return;

    const value = Number(bulk[field]);

    if (!Number.isFinite(value) || value < 0) {
      window.alert("Please enter a valid non-negative number.");
      return;
    }

    setProduct((prev) => ({
      ...prev,
      variants: (prev.variants || []).map((variant) => ({
        ...variant,
        [field]: value,
      })),
    }));
  };

  const handleBulkChange = (field, value) => {
    setBulk((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (variants.length === 0) return null;

  const totalStock = variants.reduce(
    (sum, variant) => sum + (Number(variant.stock) || 0),
    0
  );

  const activeCount = variants.filter(
    (variant) => variant.status !== false
  ).length;

  const inactiveCount = variants.length - activeCount;

  const bulkFields = [
    {
      field: "purchasePrice",
      label: "Purchase Price",
      icon: <FiDollarSign />,
      prefix: "₹",
    },
    {
      field: "sellingPrice",
      label: "Selling Price",
      icon: <FiTrendingUp />,
      prefix: "₹",
    },
    {
      field: "stock",
      label: "Stock Quantity",
      icon: <FiBox />,
      prefix: "",
    },
    {
      field: "lowStock",
      label: "Low Stock Alert",
      icon: <FiAlertCircle />,
      prefix: "",
    },
  ];

  return (
    <section className="variant-table-section">
      {/* HEADER */}
      <div className="variant-table-heading">
        <div className="variant-heading-left">
          <div className="variant-heading-icon">
            <FiLayers />
          </div>

          <div>
            <span className="variant-eyebrow">
              PRODUCT CONFIGURATION
            </span>

            <h2>Generated Variants</h2>

            <p>
              Manage pricing, inventory and availability for each variant.
            </p>
          </div>
        </div>

        <div className="variant-count-badge">
          <FiPackage />
          <span>
            {variants.length} {variants.length === 1 ? "Variant" : "Variants"}
          </span>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="variant-summary-grid">
        <div className="variant-summary-card">
          <span className="variant-summary-label">Total Variants</span>
          <strong>{variants.length}</strong>
          <span className="variant-summary-caption">Generated combinations</span>
        </div>

        <div className="variant-summary-card">
          <span className="variant-summary-label">Total Stock</span>
          <strong>{totalStock.toLocaleString("en-IN")}</strong>
          <span className="variant-summary-caption">Units available</span>
        </div>

        <div className="variant-summary-card">
          <span className="variant-summary-label">Active</span>
          <strong className="variant-active-number">{activeCount}</strong>
          <span className="variant-summary-caption">Available variants</span>
        </div>

        <div className="variant-summary-card">
          <span className="variant-summary-label">Inactive</span>
          <strong className="variant-inactive-number">{inactiveCount}</strong>
          <span className="variant-summary-caption">Disabled variants</span>
        </div>
      </div>

      {/* TABLE */}
      <div className="variant-table-card">
        <div className="variant-table-card-header">
          <div>
            <h3>Variant Inventory</h3>
            <p>Review and manage individual variant details.</p>
          </div>

          {isView && (
            <span className="variant-readonly-badge">
              <FiCheckCircle />
              Read Only
            </span>
          )}
        </div>

        <div className="variant-table-wrapper">
          <table className="variant-table">
            <thead>
              <tr>
                <th>VARIANT</th>
                <th>BARCODE</th>
                <th>SKU</th>
                <th>PURCHASE PRICE</th>
                <th>SELLING PRICE</th>
                <th>STOCK</th>
                <th>LOW STOCK</th>
                <th>STATUS</th>
                {!isView && <th>ACTIONS</th>}
              </tr>
            </thead>

            <tbody>
              {variants.map((variant, index) => {
                const isActive = variant.status !== false;

                return (
                  <tr key={variant.id || variant.barcode || index}>
                    <td>
                      <div className="variant-name-cell">
                        <div className="variant-row-icon">
                          <FiPackage />
                        </div>

                        <div>
                          <strong>
                            {variant.variantName || "Default Variant"}
                          </strong>
                          <span>
                            Variant {String(index + 1).padStart(2, "0")}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="variant-code">
                        {variant.barcode || "—"}
                      </span>
                    </td>

                    <td>
                      <span className="variant-code">
                        {variant.sku || "—"}
                      </span>
                    </td>

                    {[
                      "purchasePrice",
                      "sellingPrice",
                      "stock",
                      "lowStock",
                    ].map((field) => (
                      <td key={field}>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          className="variant-table-input"
                          value={variant[field] ?? ""}
                          readOnly={isView}
                          aria-label={`${variant.variantName || "Variant"} ${field}`}
                          onWheel={preventNumberChange}
                          onKeyDown={preventNumberChange}
                          onChange={(e) =>
                            updateVariant(
                              index,
                              field,
                              e.target.value === ""
                                ? ""
                                : Math.max(0, Number(e.target.value))
                            )
                          }
                        />
                      </td>
                    ))}

                    <td>
                      <label
                        className={`variant-status-switch ${
                          isActive ? "is-active" : "is-inactive"
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={isView}
                          checked={isActive}
                          onChange={(e) =>
                            updateVariant(index, "status", e.target.checked)
                          }
                        />

                        <span className="variant-switch-track">
                          <span className="variant-switch-thumb" />
                        </span>

                        <span className="variant-status-text">
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </label>
                    </td>

                    {!isView && (
                      <td>
                        <button
                          type="button"
                          className="variant-delete-button"
                          onClick={() => deleteVariant(index)}
                          title="Delete variant"
                          aria-label={`Delete ${variant.variantName || "variant"}`}
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="variant-table-footer">
          <span>
            Showing <strong>{variants.length}</strong> product variants
          </span>

          <span>
            Total inventory: <strong>{totalStock.toLocaleString("en-IN")} units</strong>
          </span>
        </div>
      </div>

      {/* BULK UPDATE */}
      {!isView && (
        <div className="variant-bulk-card">
          <div className="variant-bulk-heading">
            <div className="variant-bulk-icon">
              <FiSliders />
            </div>

            <div>
              <h3>Bulk Update</h3>
              <p>
                Apply the same value to all {variants.length} variants at once.
              </p>
            </div>
          </div>

          <div className="variant-bulk-grid">
            {bulkFields.map((item) => (
              <div className="variant-bulk-item" key={item.field}>
                <label>{item.label}</label>

                <div className="variant-bulk-input-wrap">
                  {item.prefix && (
                    <span className="variant-input-prefix">
                      {item.prefix}
                    </span>
                  )}

                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Enter value"
                    value={bulk[item.field]}
                    onWheel={preventNumberChange}
                    onKeyDown={preventNumberChange}
                    onChange={(e) =>
                      handleBulkChange(item.field, e.target.value)
                    }
                  />
                </div>

                <button
                  type="button"
                  className="variant-bulk-apply"
                  disabled={bulk[item.field] === ""}
                  onClick={() => applyToAll(item.field)}
                >
                  Apply to all
                </button>
              </div>
            ))}
          </div>

          <div className="variant-bulk-note">
            <FiAlertCircle />
            <span>
              Bulk changes update all variants immediately in this form. Save
              the product to persist your changes.
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
