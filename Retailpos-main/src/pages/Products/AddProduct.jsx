
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./AddProduct.css";

import ProductBasicInfo from "../../components/product/BasicInformation/BasicInformation";
import ProductImages from "../../components/product/ProductImages/ProductImages";
import ProductCategory from "../../components/product/ProductCategory/ProductCategory";
import VariantGenerator from "../../components/product/VariantGenerator/VariantGenerator";
import VariantTable from "../../components/product/VariantTable/VariantTable";
import ProductValidation from "../../components/product/ProductValidation/ProductValidation";
import ProductHeader from "../../components/product/ProductHeader/ProductHeader";
import BarcodePrint from "../../components/barcode/BarcodePrint";

import {
  addProduct,
  getPreviewProductCode,
} from "../../services/productService";

import {
  AddCircleOutlineRounded,
  ArrowBackRounded,
  CheckCircleOutlineRounded,
  Inventory2Outlined,
  SaveRounded,
  StorefrontOutlined,
} from "@mui/icons-material";

export default function AddProduct() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(true);

  const [product, setProduct] = useState({
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
  });

  // -----------------------------------------
  // LOAD PRODUCT CODE
  // -----------------------------------------

  useEffect(() => {
    let mounted = true;

    const loadProductCode = async () => {
      try {
        setCodeLoading(true);

        const code = await getPreviewProductCode();

        if (mounted) {
          setProduct((prev) => ({
            ...prev,
            productCode: code,
          }));
        }
      } catch (error) {
        console.error("Product code loading failed:", error);
      } finally {
        if (mounted) {
          setCodeLoading(false);
        }
      }
    };

    loadProductCode();

    return () => {
      mounted = false;
    };
  }, []);

  // -----------------------------------------
  // SAVE PRODUCT
  // -----------------------------------------

  const handleSaveProduct = async () => {
    if (loading || codeLoading) return;

    try {
      setLoading(true);

      // Save product to Firebase
      const productCode = await addProduct(product);

      // Navigate only after successful save
      navigate("/inventory", {
        replace: true,
        state: {
          productSaved: true,
          savedProductCode: productCode,
        },
      });

    } catch (error) {
      console.error("Product save failed:", error);

      alert(
        error?.message || "Failed to save product. Please try again."
      );

      setLoading(false);
    }
  };

  // -----------------------------------------
  // CANCEL
  // -----------------------------------------

  const handleCancel = () => {
    if (loading) return;

    navigate("/inventory");
  };

  return (
    <main className="add-product-page">
      <div className="add-product-container">

        {/* TOP INTRODUCTION */}

        <section className="add-product-intro">
          <div className="add-product-intro-content">
            <div className="add-product-breadcrumb">
              <StorefrontOutlined />
              <span>SAI COLLECTION</span>
              <span className="breadcrumb-divider">/</span>
              <span>INVENTORY</span>
            </div>

            <div className="add-product-title-row">
              <div className="add-product-title-icon">
                <AddCircleOutlineRounded />
              </div>

              <div>
                <span className="add-product-eyebrow">
                  PRODUCT MANAGEMENT
                </span>

                <h1>Add New Product</h1>

                <p>
                  Create a product, configure its variants and
                  manage your inventory.
                </p>
              </div>
            </div>
          </div>

          <div className="add-product-intro-decoration">
            <Inventory2Outlined />
          </div>
        </section>

        {/* PRODUCT HEADER */}

        <div className="add-product-header-wrap">
          <ProductHeader
            productCode={
              codeLoading ? "Generating..." : product.productCode
            }
          />
        </div>

        {/* PRODUCT FORM */}

        <div className="add-product-content">
          <div className="add-product-section-heading">
            <div>
              <span>PRODUCT CONFIGURATION</span>
              <h2>Product Information</h2>
            </div>

            <div className="add-product-required-note">
              <span>*</span> Required information
            </div>
          </div>

          <section className="add-product-section">
            <ProductBasicInfo
              product={product}
              setProduct={setProduct}
            />
          </section>

          {/*
          <section className="add-product-section">
            <ProductImages
              product={product}
              setProduct={setProduct}
            />
          </section>
          */}

          <section className="add-product-section">
            <ProductCategory
              product={product}
              setProduct={setProduct}
            />
          </section>

          <section className="add-product-section">
            <VariantGenerator
              product={product}
              setProduct={setProduct}
            />
          </section>

          <section className="add-product-section">
            <VariantTable
              product={product}
              setProduct={setProduct}
            />
          </section>

          <section className="add-product-section add-product-validation-section">
            <ProductValidation product={product} />
          </section>

          <section className="add-product-section">
            <BarcodePrint product={product} />
          </section>
        </div>

        {/* FOOTER ACTIONS */}

        <footer className="product-page-footer">
          <div className="product-footer-information">
            <div className="product-footer-icon">
              <CheckCircleOutlineRounded />
            </div>

            <div>
              <strong>
                {loading ? "Saving your product..." : "Almost ready?"}
              </strong>

              <span>
                {loading
                  ? "Please wait. Your product is being saved to inventory."
                  : "Review your product details before saving."}
              </span>
            </div>
          </div>

          <div className="product-footer-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={handleCancel}
              disabled={loading}
            >
              <ArrowBackRounded />
              <span>Cancel</span>
            </button>

            <button
              type="button"
              className="save-btn"
              disabled={loading || codeLoading}
              onClick={handleSaveProduct}
            >
              {loading ? (
                <>
                  <span className="save-button-spinner" />
                  <span>Saving Product...</span>
                </>
              ) : (
                <>
                  <SaveRounded />
                  <span>Save Product</span>
                </>
              )}
            </button>
          </div>
        </footer>

        <div className="add-product-bottom-note">
          <span>SAI COLLECTION</span>
          <span>Inventory Management · Latur</span>
        </div>
      </div>
    </main>
  );
}
