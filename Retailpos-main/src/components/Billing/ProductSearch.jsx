
import "./ProductSearch.css";

import { useState, useRef, useEffect, useCallback } from "react";

import { parseSearchCode } from "../../utils/codeParser";
import { searchProduct } from "../../services/productSearchService";

import successSound from "../../assets/sounds/success.mp3";
import errorSound from "../../assets/sounds/error.mp3";

import {
  FiSearch,
  FiCamera,
  FiPackage,
  FiHash,
  FiCheckCircle,
  FiAlertCircle,
  FiLoader,
  FiShoppingBag,
  FiZap,
} from "react-icons/fi";

export default function ProductSearch({ cart, setCart }) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState("");

  const searchRef = useRef(null);
  const lastScanRef = useRef("");
  const lastScanTimeRef = useRef(0);

  const successAudio = useRef(null);
  const errorAudio = useRef(null);

  // =========================================
  // FOCUS BARCODE INPUT
  // =========================================

  const focusBarcodeInput = useCallback(() => {
    searchRef.current?.focus();
    searchRef.current?.select();
  }, []);

  // =========================================
  // INITIALIZATION
  // =========================================

  useEffect(() => {
    successAudio.current = new Audio(successSound);
    errorAudio.current = new Audio(errorSound);

    successAudio.current.volume = 0.6;
    errorAudio.current.volume = 0.7;

    const timer = setTimeout(focusBarcodeInput, 250);

    return () => {
      clearTimeout(timer);
      successAudio.current = null;
      errorAudio.current = null;
    };
  }, [focusBarcodeInput]);

  // =========================================
  // F2 SHORTCUT
  // =========================================

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "F2") {
        event.preventDefault();
        focusBarcodeInput();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [focusBarcodeInput]);

  // =========================================
  // SOUND
  // =========================================

  const playSound = (type) => {
    const audio =
      type === "success"
        ? successAudio.current
        : errorAudio.current;

    if (!audio) return;

    audio.currentTime = 0;
    audio.play().catch(() => {});
  };

  // =========================================
  // ADD VARIANT TO CART
  // =========================================

  const addVariantToCart = (product, variant) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.variantId === variant.id
      );

      if (existing) {
        return prev.map((item) =>
          item.variantId === variant.id
            ? {
                ...item,
                qty: item.qty + 1,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          productId: product.id,
          productCode: product.productCode,
          productName: product.name,
          image: product.images?.[0] || "",

          variantId: variant.id,
          variantName: variant.variantName,
          barcode: variant.barcode,

          sellingPrice: Number(variant.sellingPrice),
          purchasePrice: Number(variant.purchasePrice),
          stock: Number(variant.stock),

          qty: 1,
        },
      ];
    });

    playSound("success");

    setSearch("");
    setSearchError("");
    setSearchResult(null);

    lastScanRef.current = "";

    setTimeout(focusBarcodeInput, 50);
  };

  // =========================================
  // SEARCH PRODUCT
  // =========================================

  const handleSearch = async (value) => {
    if (loading) return;

    const code = value.trim().toUpperCase();

    if (!code) {
      focusBarcodeInput();
      return;
    }

    const now = Date.now();

    // Prevent duplicate scans within 300ms
    if (
      lastScanRef.current === code &&
      now - lastScanTimeRef.current < 300
    ) {
      return;
    }

    lastScanRef.current = code;
    lastScanTimeRef.current = now;

    const parsed = parseSearchCode(code);

    if (!parsed?.valid) {
      playSound("error");

      setSearch(code);
      setSearchResult(null);
      setSearchError(
        "Please enter a valid product code or barcode."
      );

      lastScanRef.current = "";
      return;
    }

    setSearch(parsed.code);
    setLoading(true);
    setSearchError("");
    setSearchResult(null);

    try {
      const result = await searchProduct(parsed.code);

      if (!result) {
        playSound("error");

        setSearchResult(null);
        setSearchError(
          `No product found for "${parsed.code}"`
        );

        lastScanRef.current = "";
        return;
      }

      if (result.type === "variant") {
        addVariantToCart(result.product, result.variant);
        return;
      }

      setSearchError("");
      setSearchResult(result);

    } catch (error) {
      console.error("Product search error:", error);

      playSound("error");

      setSearchResult(null);
      setSearchError(
        "Something went wrong. Please try again."
      );

      lastScanRef.current = "";

    } finally {
      setLoading(false);
      setTimeout(focusBarcodeInput, 50);
    }
  };

  // =========================================
  // INPUT CHANGE
  // =========================================

  const handleInputChange = (event) => {
    const value = event.target.value.toUpperCase();

    setSearch(value);
    setSearchError("");
    setSearchResult(null);

    lastScanRef.current = "";
  };

  // =========================================
  // STOCK STATUS
  // =========================================

  const getStockStatus = (stock) => {
    const quantity = Number(stock || 0);

    if (quantity <= 0) {
      return {
        label: "Out of stock",
        className: "stock-out",
      };
    }

    if (quantity <= 5) {
      return {
        label: `Low stock · ${quantity}`,
        className: "stock-low",
      };
    }

    return {
      label: `In stock · ${quantity}`,
      className: "stock-available",
    };
  };

  const product = searchResult?.product;

  // =========================================
  // RENDER
  // =========================================

  return (
    <section className="product-search-card">

      {/* HEADER */}
      <div className="product-search-header-top">

        <div className="product-search-heading">
          <div className="product-search-heading-icon">
            <FiShoppingBag />
          </div>

          <div>
            <h2>Product Search</h2>
            <p>Find products and scan barcodes</p>
          </div>
        </div>

        <button
          className="product-scan-button"
          type="button"
          onClick={focusBarcodeInput}
        >
          <FiCamera />
          <span>Scan Barcode</span>
          <kbd>F2</kbd>
        </button>

      </div>

      {/* SEARCH INPUT */}
      <div className="product-search-field">

        <FiHash className="product-search-field-icon" />

        <input
          ref={searchRef}
          type="text"
          className="product-search-input"
          placeholder="Enter product code or scan barcode..."
          value={search}
          autoComplete="off"
          autoFocus
          tabIndex={0}
          spellCheck={false}
          onClick={focusBarcodeInput}
          onChange={handleInputChange}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSearch(search);
            }
          }}
        />

        {loading ? (
          <FiLoader className="product-search-loading-icon" />
        ) : (
          <span className="product-search-enter-hint">
            ENTER
          </span>
        )}

      </div>

      {/* RESULTS */}
      <div className="product-results">

        {/* LOADING */}
        {loading && (
          <div className="product-search-state">
            <div className="product-state-icon loading-state-icon">
              <FiLoader />
            </div>

            <h3>Searching products</h3>
            <p>Please wait while we find your product...</p>
          </div>
        )}

        {/* ERROR */}
        {!loading && searchError && (
          <div className="product-search-state">
            <div className="product-state-icon error-state-icon">
              <FiAlertCircle />
            </div>

            <h3>Product Not Found</h3>
            <p>{searchError}</p>

            <button
              type="button"
              className="product-retry-button"
              onClick={() => {
                setSearch("");
                setSearchError("");
                setSearchResult(null);
                lastScanRef.current = "";
                focusBarcodeInput();
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !searchResult && !searchError && (
          <div className="product-search-state">
            <div className="product-state-icon empty-state-icon">
              <FiSearch />
            </div>

            <h3>Ready to Search</h3>

            <p>
              Enter a product code or scan a variant barcode
              to get started.
            </p>

            <div className="product-search-tips">
              <span>
                <FiZap />
                Fast barcode scanning
              </span>

              <span>
                <FiPackage />
                Instant cart addition
              </span>
            </div>
          </div>
        )}

        {/* PRODUCT RESULT */}
        {!loading && searchResult?.type === "product" && (
          <div className="search-product-card">

            <div className="search-product-info">

              <div className="search-product-image">
                {product?.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                  />
                ) : (
                  <FiPackage />
                )}
              </div>

              <div className="search-product-details">
                <span className="search-product-label">
                  PRODUCT FOUND
                </span>

                <h3>{product.name}</h3>

                <p>
                  <FiHash />
                  {product.productCode}
                </p>
              </div>

              <div className="search-product-count">
                <strong>
                  {product.variants?.length || 0}
                </strong>
                <span>Variants</span>
              </div>

            </div>

            <div className="variant-list-header">
              <span>Available Variants</span>
              <small>Select a variant to add it to the bill</small>
            </div>

            <div className="variant-list">
              {product.variants?.length > 0 ? (
                product.variants.map((variant) => {
                  const stockStatus = getStockStatus(variant.stock);

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      className="variant-item"
                      onClick={() =>
                        addVariantToCart(product, variant)
                      }
                    >
                      <div className="variant-item-main">
                        <div className="variant-item-icon">
                          <FiPackage />
                        </div>

                        <div className="variant-item-details">
                          <strong>{variant.variantName}</strong>

                          <span>
                            <FiHash />
                            {variant.id}
                          </span>
                        </div>
                      </div>

                      <div className="variant-item-right">
                        <strong className="variant-price">
                          ₹{Number(
                            variant.sellingPrice || 0
                          ).toLocaleString("en-IN")}
                        </strong>

                        <span
                          className={`variant-stock ${stockStatus.className}`}
                        >
                          {stockStatus.label}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="variant-empty-state">
                  No variants available for this product.
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* FOOTER */}
      <div className="product-search-footer">
        <span>
          <FiCheckCircle />
          Barcode scanner ready
        </span>

        <span>
          Shortcut: <kbd>F2</kbd>
        </span>
      </div>

    </section>
  );
}
