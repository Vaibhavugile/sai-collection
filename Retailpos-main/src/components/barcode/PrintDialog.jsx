
import "./PrintDialog.css";

import { useEffect, useMemo, useState } from "react";

import {
  CloseRounded,
  LocalPrintshopOutlined,
  StorefrontOutlined,
  Inventory2Outlined,
  RestartAltRounded,
  CheckCircleRounded,
  AddRounded,
  RemoveRounded,
  LabelOutlined,
} from "@mui/icons-material";

import { printBarcodes } from "./services/PrintService";

export default function PrintDialog({ product, onClose }) {
  const [format, setFormat] = useState("58mm");
  const [storeName, setStoreName] = useState("Jamale Collection");

  const [variants, setVariants] = useState(() =>
    (product?.variants || []).map((variant) => ({
      ...variant,
      selected: true,
      printQty: Math.max(0, Number(variant.stock) || 0),
    }))
  );

  /* =====================================================
     SYNC VARIANTS WHEN PRODUCT CHANGES
  ===================================================== */

  useEffect(() => {
    setVariants(
      (product?.variants || []).map((variant) => ({
        ...variant,
        selected: true,
        printQty: Math.max(0, Number(variant.stock) || 0),
      }))
    );
  }, [product]);

  /* =====================================================
     SUMMARY
  ===================================================== */

  const selectedCount = useMemo(
    () => variants.filter((variant) => variant.selected).length,
    [variants]
  );

  const totalLabels = useMemo(
    () =>
      variants.reduce((total, variant) => {
        if (!variant.selected) return total;

        return total + Math.max(0, Number(variant.printQty) || 0);
      }, 0),
    [variants]
  );

  const allSelected =
    variants.length > 0 &&
    variants.every((variant) => variant.selected);

  /* =====================================================
     UPDATE SINGLE VARIANT
  ===================================================== */

  const updateVariant = (index, updates) => {
    setVariants((previous) =>
      previous.map((variant, currentIndex) =>
        currentIndex === index
          ? { ...variant, ...updates }
          : variant
      )
    );
  };

  /* =====================================================
     SELECT ALL
  ===================================================== */

  const handleSelectAll = (checked) => {
    setVariants((previous) =>
      previous.map((variant) => ({
        ...variant,
        selected: checked,
      }))
    );
  };

  /* =====================================================
     QUANTITY
  ===================================================== */

  const changeQuantity = (index, amount) => {
    setVariants((previous) =>
      previous.map((variant, currentIndex) => {
        if (currentIndex !== index) return variant;

        return {
          ...variant,
          printQty: Math.max(
            0,
            (Number(variant.printQty) || 0) + amount
          ),
        };
      })
    );
  };

  const handleQuantityInput = (index, value) => {
    const quantity =
      value === "" ? 0 : Math.max(0, Math.floor(Number(value) || 0));

    updateVariant(index, {
      printQty: quantity,
    });
  };

  /* =====================================================
     RESET
  ===================================================== */

  const handleReset = () => {
    setFormat("58mm");

    setVariants(
      (product?.variants || []).map((variant) => ({
        ...variant,
        selected: true,
        printQty: Math.max(0, Number(variant.stock) || 0),
      }))
    );
  };

  /* =====================================================
     PRINT
  ===================================================== */

  const handlePrint = () => {
    const selectedVariants = variants.filter(
      (variant) =>
        variant.selected &&
        Number(variant.printQty) > 0
    );

    if (!selectedVariants.length) {
      alert("Please select at least one variant with a print quantity.");
      return;
    }

    if (!storeName.trim()) {
      alert("Please enter your store name.");
      return;
    }

    try {
      printBarcodes({
        product,
        variants: selectedVariants,
        format,
        storeName: storeName.trim(),
      });

      onClose?.();
    } catch (error) {
      console.error("Barcode printing failed:", error);
      alert("Unable to start barcode printing. Please try again.");
    }
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div
      className="print-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-dialog-title"
    >
      {/* HEADER */}

      <div className="print-dialog-header">
        <div className="print-dialog-heading">
          <div className="print-dialog-heading-icon">
            <LocalPrintshopOutlined />
          </div>

          <div>
            <span className="print-dialog-eyebrow">
              INVENTORY TOOLS
            </span>

            <h2 id="print-dialog-title">Print Barcodes</h2>

            <p>Configure and print your product labels.</p>
          </div>
        </div>

        <button
          type="button"
          className="print-dialog-close"
          onClick={onClose}
          aria-label="Close barcode dialog"
          title="Close"
        >
          <CloseRounded />
        </button>
      </div>

      {/* PRODUCT SUMMARY */}

      <section className="print-product-summary">
        <div className="print-product-icon">
          <Inventory2Outlined />
        </div>

        <div className="print-product-details">
          <span>SELECTED PRODUCT</span>

          <h3>{product?.name || "Unnamed Product"}</h3>

          <div className="print-product-meta">
            <span>
              Code: <strong>{product?.productCode || "—"}</strong>
            </span>

            {product?.categoryName && (
              <>
                <i />
                <span>{product.categoryName}</span>
              </>
            )}
          </div>
        </div>

        <div className="print-product-status">
          <CheckCircleRounded />
          <span>Ready</span>
        </div>
      </section>

      {/* CONFIGURATION */}

      <section className="print-config-grid">
        <div className="print-form-group">
          <label htmlFor="print-format">
            <LocalPrintshopOutlined />
            Print Format
          </label>

          <select
            id="print-format"
            value={format}
            onChange={(event) => setFormat(event.target.value)}
          >
            <option value="58mm">58mm Thermal Printer (2")</option>
            <option value="80mm">80mm Thermal Printer (3")</option>
            <option value="a4">A4 Sticker Sheet (3 × 8 Labels)</option>
          </select>

          <small>Choose the paper or printer layout.</small>
        </div>

        <div className="print-form-group">
          <label htmlFor="print-store-name">
            <StorefrontOutlined />
            Store Name
          </label>

          <input
            id="print-store-name"
            type="text"
            placeholder="Enter Store Name"
            value={storeName}
            onChange={(event) => setStoreName(event.target.value)}
            maxLength={60}
          />

          <small>This name will appear on your printed labels.</small>
        </div>
      </section>

      {/* VARIANT SECTION */}

      <section className="print-variants-section">
        <div className="print-section-heading">
          <div>
            <span className="print-section-eyebrow">
              LABEL CONFIGURATION
            </span>

            <h3>Choose Variants</h3>

            <p>Select which variants you want to print.</p>
          </div>

          <div className="print-variant-count">
            {variants.length} Variants
          </div>
        </div>

        {/* SELECT ALL */}

        <label className="print-select-all">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(event) => handleSelectAll(event.target.checked)}
            disabled={!variants.length}
          />

          <span className="print-custom-checkbox">
            <CheckCircleRounded />
          </span>

          <span className="print-select-all-text">
            <strong>Select all variants</strong>
            <small>Include all product variants in this print job.</small>
          </span>
        </label>

        {/* TABLE */}

        <div className="print-variants-table-wrap">
          <table className="print-variants-table">
            <thead>
              <tr>
                <th className="print-check-column">Select</th>
                <th>Variant</th>
                <th>Barcode</th>
                <th>Current Stock</th>
                <th>Print Quantity</th>
              </tr>
            </thead>

            <tbody>
              {variants.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <div className="print-no-variants">
                      <Inventory2Outlined />
                      <strong>No variants available</strong>
                      <span>Add product variants before printing barcodes.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                variants.map((variant, index) => (
                  <tr
                    key={variant.id || variant.barcode || index}
                    className={variant.selected ? "is-selected" : ""}
                  >
                    <td className="print-check-column">
                      <input
                        type="checkbox"
                        checked={variant.selected}
                        onChange={(event) =>
                          updateVariant(index, {
                            selected: event.target.checked,
                          })
                        }
                        aria-label={`Select ${variant.variantName || "variant"}`}
                      />
                    </td>

                    <td>
                      <div className="print-variant-name">
                        <span className="print-variant-dot" />
                        <strong>
                          {variant.variantName || "Unnamed Variant"}
                        </strong>
                      </div>
                    </td>

                    <td>
                      <span className="print-barcode-value">
                        {variant.barcode || variant.sku || "—"}
                      </span>
                    </td>

                    <td>
                      <span className="print-stock-value">
                        {Number(variant.stock) || 0}
                      </span>
                    </td>

                    <td>
                      <div className="print-qty-control">
                        <button
                          type="button"
                          onClick={() => changeQuantity(index, -1)}
                          disabled={Number(variant.printQty) <= 0}
                          aria-label="Decrease print quantity"
                        >
                          <RemoveRounded />
                        </button>

                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={variant.printQty}
                          onChange={(event) =>
                            handleQuantityInput(index, event.target.value)
                          }
                          aria-label={`Print quantity for ${variant.variantName || "variant"}`}
                        />

                        <button
                          type="button"
                          onClick={() => changeQuantity(index, 1)}
                          aria-label="Increase print quantity"
                        >
                          <AddRounded />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* PRINT SUMMARY */}

      <section className="print-summary-grid">
        <div className="print-summary-card">
          <div className="print-summary-icon">
            <Inventory2Outlined />
          </div>

          <div>
            <span>SELECTED VARIANTS</span>
            <strong>{selectedCount}</strong>
          </div>
        </div>

        <div className="print-summary-card print-summary-card-highlight">
          <div className="print-summary-icon">
            <LabelOutlined />
          </div>

          <div>
            <span>TOTAL LABELS</span>
            <strong>{totalLabels.toLocaleString("en-IN")}</strong>
          </div>
        </div>
      </section>

      {/* FOOTER */}

      <div className="print-dialog-footer">
        <div className="print-footer-note">
          <CheckCircleRounded />
          <span>Review your quantities before printing.</span>
        </div>

        <div className="print-footer-actions">
          <button
            type="button"
            className="print-dialog-reset"
            onClick={handleReset}
          >
            <RestartAltRounded />
            Reset
          </button>

          <button
            type="button"
            className="print-dialog-cancel"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="print-dialog-submit"
            onClick={handlePrint}
            disabled={totalLabels === 0 || !storeName.trim()}
          >
            <LocalPrintshopOutlined />
            Print {totalLabels > 0 ? `${totalLabels} Labels` : "Labels"}
          </button>
        </div>
      </div>
    </div>
  );
}
