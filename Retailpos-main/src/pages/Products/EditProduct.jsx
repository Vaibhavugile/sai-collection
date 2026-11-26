
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import BasicInformation from "../../components/product/BasicInformation/BasicInformation";
import ProductImages from "../../components/product/ProductImages/ProductImages";
import ProductCategory from "../../components/product/ProductCategory/ProductCategory";
import VariantGenerator from "../../components/product/VariantGenerator/VariantGenerator";
import VariantTable from "../../components/product/VariantTable/VariantTable";
import ProductValidation from "../../components/product/ProductValidation/ProductValidation";

import {
  getProductById,
  updateProductWithHistory,
} from "../../services/productService";

import "./EditProduct.css";

const emptyProduct = {
  id: "",
  productCode: "",
  name: "",
  description: "",
  categoryId: "",
  categoryName: "",
  subCategoryId: "",
  subCategoryName: "",
  images: [],
  selectedColors: [],
  selectedSizes: [],
  variants: [],
  status: "active",
  totalStock: 0,
  totalVariants: 0,
};

const normalizeProduct = (data, id) => ({
  ...emptyProduct,
  ...data,
  id,
  images: (data.images || []).map((image) => ({
    ...image,
    // Keep the persisted image identity unchanged. Synthetic IDs can
    // otherwise create false image changes in the edit-history comparison.
    preview: image.preview || image.url || "",
    isCover: Boolean(image.isCover),
  })),
  selectedColors: data.selectedColors || [],
  selectedSizes: data.selectedSizes || [],
  variants: (data.variants || []).map((variant) => ({
    ...variant,
    purchasePrice: Number(variant.purchasePrice || 0),
    sellingPrice: Number(variant.sellingPrice || 0),
    stock: Number(variant.stock || 0),
    lowStock: Number(variant.lowStock || 0),
    status: variant.status !== false,
  })),
});

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(emptyProduct);
  const [originalProduct, setOriginalProduct] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // LOAD PRODUCT
  // --------------------------------------------------

  useEffect(() => {
    let active = true;

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getProductById(id);

        if (!result) {
          throw new Error("Product not found.");
        }

        const normalized = normalizeProduct(result, id);

        if (!active) return;

        setProduct(normalized);
        setOriginalProduct(normalized);
      } catch (err) {
        console.error("Load product error:", err);

        if (active) {
          setError(err.message || "Unable to load product.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (id) {
      loadProduct();
    } else {
      setError("Product ID is missing.");
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [id]);

  // --------------------------------------------------
  // VALIDATE PRODUCT
  // --------------------------------------------------

  const validateProduct = () => {
    if (!product.name.trim()) {
      alert("Please enter the product name.");
      return false;
    }

    if (!product.categoryId) {
      alert("Please select a category.");
      return false;
    }

    if (!product.subCategoryId) {
      alert("Please select a subcategory.");
      return false;
    }

    if (!product.variants?.length) {
      alert("Please add at least one product variant.");
      return false;
    }

    const invalidVariant = product.variants.find((variant) => {
      const sellingPrice = Number(variant.sellingPrice);
      const purchasePrice = Number(variant.purchasePrice);
      const stock = Number(variant.stock);
      const lowStock = Number(variant.lowStock);

      return (
        !Number.isFinite(sellingPrice) ||
        sellingPrice <= 0 ||
        !Number.isFinite(purchasePrice) ||
        purchasePrice < 0 ||
        !Number.isFinite(stock) ||
        stock < 0 ||
        !Number.isFinite(lowStock) ||
        lowStock < 0
      );
    });

    if (invalidVariant) {
      alert(
        `Please check the prices and stock for ${invalidVariant.variantName}.`
      );
      return false;
    }

    return true;
  };

  // --------------------------------------------------
  // SAVE PRODUCT + HISTORY
  // --------------------------------------------------

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (saving || !originalProduct) return;

    if (!validateProduct()) return;

    try {
      setSaving(true);
      setError("");

      const result = await updateProductWithHistory(
        id,
        product,
        originalProduct,
        {
          name: "Admin",
          uid: null,
        }
      );

      if (result?.changed === false) {
        alert("No changes were made to this product.");
        return;
      }

      alert("Product updated successfully!");

      navigate("/inventory");
    } catch (err) {
      console.error("Update product error:", err);

      setError(
        err.message || "Unable to update product. Please try again."
      );

      alert(err.message || "Failed to update product.");
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="edit-product-loading">
        <div className="edit-product-spinner" />
        <h3>Loading product...</h3>
        <p>Please wait while we fetch your product details.</p>
      </div>
    );
  }

  // --------------------------------------------------
  // ERROR / NOT FOUND
  // --------------------------------------------------

  if (error && !originalProduct) {
    return (
      <div className="edit-product-error">
        <div className="edit-error-icon">!</div>
        <h2>Unable to load product</h2>
        <p>{error}</p>

        <button
          type="button"
          onClick={() => navigate("/inventory")}
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="edit-product-page">

      {/* PAGE HEADER */}

      <div className="edit-product-header">
        <div>
          <button
            type="button"
            className="edit-back-button"
            onClick={() => navigate("/inventory")}
          >
            ← Back to Products
          </button>

          <div className="edit-heading-row">
            <div>
              <span className="edit-eyebrow">
                PRODUCT MANAGEMENT
              </span>

              <h1>Edit Product</h1>

              <p>
                Update product information, images, pricing and inventory.
              </p>
            </div>

            <div className="edit-product-code">
              <span>PRODUCT CODE</span>
              <strong>{product.productCode}</strong>
              <button
                type="button"
                className="edit-history-link"
                onClick={() => navigate(`/products/${id}/history`)}
              >
                View Edit History
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="edit-inline-error">
          {error}
        </div>
      )}

      <form onSubmit={handleUpdate}>

        <div className="edit-product-layout">

          <div className="edit-product-main">

            <BasicInformation
              product={product}
              setProduct={setProduct}
            />

            <ProductImages
              product={product}
              setProduct={setProduct}
            />

            <ProductCategory
              product={product}
              setProduct={setProduct}
            />

            <VariantGenerator
              product={product}
              setProduct={setProduct}
            />

            <VariantTable
              product={product}
              setProduct={setProduct}
            />

          </div>

          <aside className="edit-product-sidebar">

            <div className="edit-sidebar-card">
              <div className="edit-sidebar-heading">
                <div>
                  <span>PRODUCT STATUS</span>
                  <h3>Visibility</h3>
                </div>
                <span className="edit-status-icon">●</span>
              </div>

              <label className="edit-status-option">
                <input
                  type="radio"
                  name="productStatus"
                  value="active"
                  checked={product.status === "active"}
                  onChange={() =>
                    setProduct((prev) => ({
                      ...prev,
                      status: "active",
                    }))
                  }
                />

                <span>
                  <strong>Active</strong>
                  <small>Product is available in inventory.</small>
                </span>
              </label>

              <label className="edit-status-option">
                <input
                  type="radio"
                  name="productStatus"
                  value="inactive"
                  checked={product.status === "inactive"}
                  onChange={() =>
                    setProduct((prev) => ({
                      ...prev,
                      status: "inactive",
                    }))
                  }
                />

                <span>
                  <strong>Inactive</strong>
                  <small>Product is not currently active.</small>
                </span>
              </label>
            </div>

            <ProductValidation product={product} />

            <div className="edit-sidebar-card edit-summary-card">
              <span>INVENTORY SUMMARY</span>

              <div className="edit-summary-row">
                <span>Total Variants</span>
                <strong>{product.variants.length}</strong>
              </div>

              <div className="edit-summary-row">
                <span>Total Stock</span>
                <strong>
                  {product.variants.reduce(
                    (total, variant) =>
                      total + Number(variant.stock || 0),
                    0
                  )}
                </strong>
              </div>

              <div className="edit-summary-row">
                <span>Product Images</span>
                <strong>{product.images.length}</strong>
              </div>
            </div>

          </aside>

        </div>

        {/* FOOTER ACTIONS */}

        <div className="edit-product-footer">

          <button
            type="button"
            className="edit-cancel-button"
            onClick={() => navigate("/inventory")}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="edit-save-button"
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="edit-button-spinner" />
                Saving Changes...
              </>
            ) : (
              "Save Product Changes →"
            )}
          </button>

        </div>

      </form>
    </div>
  );
}
