
import { useNavigate, useLocation } from "react-router-dom";

import "./ProductHeader.css";

import {
  ArrowBackRounded,
  Inventory2Outlined,
  AutoAwesomeOutlined,
  TagOutlined,
} from "@mui/icons-material";

export default function ProductHeader({
  productCode,
  title,
  description,
  mode,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const isEdit =
    mode === "edit" ||
    location.pathname.startsWith("/products/edit");

  const isView =
    mode === "view" ||
    location.pathname.startsWith("/products/view");

  const pageTitle =
    title ||
    (isView
      ? "Product Details"
      : isEdit
      ? "Edit Product"
      : "Add New Product");

  const pageDescription =
    description ||
    (isView
      ? "Review product information, variants, pricing and inventory."
      : isEdit
      ? "Update product details, variants, pricing and inventory."
      : "Create and organize products with variants, pricing, inventory and barcode management.");

  const handleBack = () => {
    navigate("/products");
  };

  return (
    <section className="product-header">

      {/* DECORATIVE BACKGROUND */}

      <div className="product-header-decoration">
        <span className="product-header-orb orb-one" />
        <span className="product-header-orb orb-two" />
      </div>

      {/* LEFT CONTENT */}

      <div className="product-header-left">

        <button
          className="product-header-back"
          type="button"
          onClick={handleBack}
        >
          <ArrowBackRounded />

          <span>Back to Products</span>
        </button>

        <div className="product-header-title-row">

          <div className="product-header-icon">
            <Inventory2Outlined />
          </div>

          <div className="product-header-title-content">

            <span className="product-header-eyebrow">
              SAI COLLECTION / PRODUCT MANAGEMENT
            </span>

            <h1>{pageTitle}</h1>

            <p>{pageDescription}</p>

          </div>

        </div>

        <div className="product-header-features">

          <span>
            <AutoAwesomeOutlined />
            Smart Inventory
          </span>

          <i />

          <span>
            <TagOutlined />
            Product Management
          </span>

        </div>

      </div>

      {/* PRODUCT CODE CARD */}

      <div className="product-code-card">

        <div className="product-code-card-top">

          <div className="product-code-icon">
            <TagOutlined />
          </div>

          <span>PRODUCT IDENTIFIER</span>

        </div>

        <div className="product-code-content">

          <span className="product-code-label">
            Product Code
          </span>

          <h2>
            {productCode || "Auto Generated"}
          </h2>

          <div className="product-code-divider" />

          <div className="product-code-footer">

            <span className="product-code-status-dot" />

            <small>
              {productCode
                ? "Product code assigned"
                : "Generated automatically"}
            </small>

          </div>

        </div>

        <div className="product-code-watermark">
          <TagOutlined />
        </div>

      </div>

    </section>
  );
}
