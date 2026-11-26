
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import "./ProductCategory.css";

import {
  subscribeCategories,
} from "../../../services/categoryService";

import {
  subscribeSubCategories,
} from "../../../services/subCategoryService";

import {
  CategoryOutlined,
  AccountTreeOutlined,
  KeyboardArrowDownRounded,
  CheckCircleOutlineRounded,
  VisibilityOutlined,
} from "@mui/icons-material";

export default function ProductCategory({
  product,
  setProduct,
}) {
  const location = useLocation();

  const isView = location.pathname.startsWith("/products/view");

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  /* ===========================================
      LOAD CATEGORIES
  =========================================== */

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

  /* ===========================================
      LOAD SUB CATEGORIES
  =========================================== */

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

  /* ===========================================
      FILTER SUB CATEGORIES
  =========================================== */

  const filteredSubCategories = subCategories.filter(
    (item) =>
      String(item.categoryId) === String(product?.categoryId)
  );

  /* ===========================================
      CATEGORY CHANGE
  =========================================== */

  const handleCategory = (event) => {
    if (isView) return;

    const id = event.target.value;

    const selected = categories.find(
      (category) => String(category.id) === String(id)
    );

    setProduct((previous) => ({
      ...previous,

      categoryId: selected?.id || "",
      categoryName: selected?.name || "",

      // Reset subcategory when category changes
      subCategoryId: "",
      subCategoryName: "",
    }));
  };

  /* ===========================================
      SUBCATEGORY CHANGE
  =========================================== */

  const handleSubCategory = (event) => {
    if (isView) return;

    const id = event.target.value;

    const selected = filteredSubCategories.find(
      (category) => String(category.id) === String(id)
    );

    setProduct((previous) => ({
      ...previous,

      subCategoryId: selected?.id || "",
      subCategoryName: selected?.name || "",
    }));
  };

  return (
    <section
      className={`product-card product-category-card ${
        isView ? "product-category-view-mode" : ""
      }`}
    >

      {/* HEADER */}

      <div className="product-card-header category-card-header">

        <div className="category-heading">

          <div className="category-heading-icon">
            <CategoryOutlined />
          </div>

          <div className="category-heading-content">

            <span className="category-eyebrow">
              PRODUCT CLASSIFICATION
            </span>

            <h2>Product Category</h2>

            <p>
              Organize your product by selecting its category and subcategory.
            </p>

          </div>

        </div>

        <div className={`category-mode-indicator ${isView ? "view" : "edit"}`}>
          {isView ? (
            <VisibilityOutlined />
          ) : (
            <CheckCircleOutlineRounded />
          )}

          <span>{isView ? "View Mode" : "Classification"}</span>
        </div>

      </div>

      {/* BODY */}

      <div className="product-card-body category-card-body">

        <div className="category-grid">

          {/* CATEGORY */}

          <div className="category-field">

            <label htmlFor="product-category">
              <span>Category</span>
              <span className="category-required">*</span>
            </label>

            <div className="category-select-wrapper">

              <div className="category-select-icon">
                <CategoryOutlined />
              </div>

              <select
                id="product-category"
                value={product?.categoryId || ""}
                onChange={handleCategory}
                disabled={isView}
                required
              >
                <option value="">
                  {categories.length
                    ? "Select a category"
                    : "Loading categories..."}
                </option>

                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}

              </select>

              <KeyboardArrowDownRounded className="category-select-arrow" />

            </div>

            <div className="category-field-help">
              Choose the main product category.
            </div>

          </div>

          {/* SUBCATEGORY */}

          <div className="category-field">

            <label htmlFor="product-subcategory">
              <span>Sub Category</span>
              <span className="category-required">*</span>
            </label>

            <div className={`category-select-wrapper ${
              !product?.categoryId ? "is-disabled" : ""
            }`}>

              <div className="category-select-icon">
                <AccountTreeOutlined />
              </div>

              <select
                id="product-subcategory"
                value={product?.subCategoryId || ""}
                onChange={handleSubCategory}
                disabled={isView || !product?.categoryId}
                required
              >
                <option value="">
                  {!product?.categoryId
                    ? "Select category first"
                    : filteredSubCategories.length
                    ? "Select a subcategory"
                    : "No subcategories available"}
                </option>

                {filteredSubCategories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}

              </select>

              <KeyboardArrowDownRounded className="category-select-arrow" />

            </div>

            <div className="category-field-help">
              Choose a subcategory belonging to the selected category.
            </div>

          </div>

        </div>

        {/* SELECTION SUMMARY */}

        <div className="category-selection-summary">

          <div className="category-summary-icon">
            <CheckCircleOutlineRounded />
          </div>

          <div className="category-summary-content">

            <strong>
              {product?.categoryName && product?.subCategoryName
                ? "Classification complete"
                : product?.categoryName
                ? "Category selected"
                : "Classification pending"}
            </strong>

            <p>
              {product?.categoryName
                ? `${product.categoryName}${
                    product.subCategoryName
                      ? ` / ${product.subCategoryName}`
                      : ""
                  }`
                : "Select a category and subcategory for your product."}
            </p>

          </div>

          {product?.categoryName && product?.subCategoryName && (
            <span className="category-summary-check">
              <CheckCircleOutlineRounded />
            </span>
          )}

        </div>

      </div>

    </section>
  );
}
