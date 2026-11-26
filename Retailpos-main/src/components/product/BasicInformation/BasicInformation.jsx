
import "./BasicInformation.css";

import { useLocation } from "react-router-dom";

import {
  EditOutlined,
  DescriptionOutlined,
  Inventory2Outlined,
  VisibilityOutlined,
} from "@mui/icons-material";

export default function BasicInformation({
  product,
  setProduct,
}) {
  const location = useLocation();

  const isView = location.pathname.startsWith("/products/view");

  const handleChange = (event) => {
    if (isView) return;

    const { name, value } = event.target;

    setProduct((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  return (
    <section className={`product-card basic-info-card ${isView ? "basic-info-view-mode" : ""}`}>

      {/* HEADER */}

      <div className="product-card-header basic-info-header">

        <div className="basic-info-heading">

          <div className="basic-info-heading-icon">
            <Inventory2Outlined />
          </div>

          <div>
            <span className="basic-info-eyebrow">
              PRODUCT DETAILS
            </span>

            <h2>Basic Information</h2>

            <p>
              Enter the essential details about your product.
            </p>
          </div>

        </div>

        <div className={`basic-info-mode ${isView ? "view" : "edit"}`}>
          {isView ? <VisibilityOutlined /> : <EditOutlined />}

          <span>{isView ? "View Mode" : "Editable"}</span>
        </div>

      </div>

      {/* BODY */}

      <div className="product-card-body basic-info-body">

        {/* PRODUCT NAME */}

        <div className="form-group basic-info-field">

          <label htmlFor="product-name">
            Product Name
            <span className="basic-info-required">*</span>
          </label>

          <div className="basic-info-input-wrap">

            <input
              id="product-name"
              type="text"
              name="name"
              placeholder="Enter product name"
              value={product?.name || ""}
              onChange={handleChange}
              readOnly={isView}
              maxLength={150}
            />

            {!isView && (
              <span className="basic-info-field-icon">
                <EditOutlined />
              </span>
            )}

          </div>

          <div className="basic-info-field-footer">
            <span>A clear name makes products easier to identify.</span>

            <span>
              {(product?.name || "").length}/150
            </span>
          </div>

        </div>

        {/* DESCRIPTION */}

        <div className="form-group basic-info-field">

          <label htmlFor="product-description">
            Description
            <span className="basic-info-optional">Optional</span>
          </label>

          <div className="basic-info-textarea-wrap">

            <textarea
              id="product-description"
              rows={5}
              name="description"
              placeholder="Write a detailed product description..."
              value={product?.description || ""}
              onChange={handleChange}
              readOnly={isView}
              maxLength={1000}
            />

            <div className="basic-info-textarea-icon">
              <DescriptionOutlined />
            </div>

          </div>

          <div className="basic-info-field-footer">
            <span>
              Add useful details to help identify this product.
            </span>

            <span>
              {(product?.description || "").length}/1000
            </span>
          </div>

        </div>

      </div>

    </section>
  );
}
