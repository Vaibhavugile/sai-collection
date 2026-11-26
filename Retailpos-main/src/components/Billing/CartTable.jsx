
import "./CartTable.css";

import {
  FiShoppingCart,
  FiPackage,
  FiMinus,
  FiPlus,
  FiTrash2,
  FiHash,
  FiTag,
  FiLayers,
  FiCheckCircle,
} from "react-icons/fi";

export default function CartTable({ cart, setCart }) {

  const totalQty = cart.reduce(
    (sum, item) => sum + Number(item.qty || 0),
    0
  );

  const totalAmount = cart.reduce(
    (sum, item) =>
      sum +
      Number(item.qty || 0) *
      Number(item.sellingPrice || 0),
    0
  );

  // =========================================
  // INCREASE QUANTITY
  // =========================================

  const increaseQty = (index) => {
    setCart((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        if (item.qty >= item.stock) return item;

        return {
          ...item,
          qty: item.qty + 1,
        };
      })
    );
  };

  // =========================================
  // DECREASE QUANTITY
  // =========================================

  const decreaseQty = (index) => {
    setCart((prev) => {
      const item = prev[index];

      if (item.qty === 1) {
        return prev.filter((_, i) => i !== index);
      }

      return prev.map((item, i) =>
        i === index
          ? {
              ...item,
              qty: item.qty - 1,
            }
          : item
      );
    });
  };

  // =========================================
  // REMOVE ITEM
  // =========================================

  const removeItem = (index) => {
    setCart((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  // =========================================
  // EMPTY CART
  // =========================================

  if (cart.length === 0) {
    return (
      <section className="cart-card">

        <div className="cart-empty">

          <div className="cart-empty-icon">
            <FiShoppingCart />
          </div>

          <span className="cart-empty-label">
            BILLING CART
          </span>

          <h2>Your Cart is Empty</h2>

          <p>
            Search or scan a product to start creating
            your bill.
          </p>

          <div className="cart-empty-hint">
            <FiPackage />
            <span>Products will appear here</span>
          </div>

        </div>

      </section>
    );
  }

  // =========================================
  // CART UI
  // =========================================

  return (
    <section className="cart-card">

      {/* HEADER */}
      <div className="cart-header">

        <div className="cart-heading-left">

          <div className="cart-heading-icon">
            <FiShoppingCart />
          </div>

          <div>
            <h2>Billing Cart</h2>
            <p>Review and manage your products</p>
          </div>

        </div>

        <div className="cart-header-count">

          <span>{cart.length} Products</span>

          <span className="cart-count-divider">/</span>

          <span>{totalQty} Qty</span>

        </div>

      </div>

      {/* CART ITEMS */}
      <div className="cart-items-list">

        {cart.map((item, index) => {

          const itemTotal =
            Number(item.qty || 0) *
            Number(item.sellingPrice || 0);

          const isStockLimitReached =
            Number(item.qty) >= Number(item.stock);

          return (
            <article
              className="cart-item"
              key={item.variantId || `${item.productId}-${index}`}
            >

              {/* PRODUCT IMAGE */}
              <div className="cart-image-wrap">

                {item.image ? (
                  <img
                    className="cart-image"
                    src={item.image}
                    alt={item.productName}
                  />
                ) : (
                  <div className="cart-image-placeholder">
                    <FiPackage />
                  </div>
                )}

              </div>

              {/* PRODUCT DETAILS */}
              <div className="cart-info">

                <div className="cart-product-title-row">

                  <h3>{item.productName}</h3>

                  <span className="cart-product-badge">
                    <FiCheckCircle />
                    Added
                  </span>

                </div>

                <p className="cart-variant-name">
                  {item.variantName}
                </p>

                <div className="cart-meta">

                  <span>
                    <FiTag />
                    {item.productCode || "N/A"}
                  </span>

                  <span>
                    <FiHash />
                    {item.barcode || "N/A"}
                  </span>

                  <span>
                    <FiLayers />
                    Stock: {item.stock}
                  </span>

                </div>

                <div className="cart-unit-price">
                  ₹
                  {Number(item.sellingPrice || 0).toFixed(2)}
                  <span>/ unit</span>
                </div>

              </div>

              {/* CART ACTIONS */}
              <div className="cart-actions">

                {/* QUANTITY */}
                <div className="cart-quantity-label">
                  Quantity
                </div>

                <div className="qty-box">

                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={item.qty <= 1}
                    onClick={() => decreaseQty(index)}
                  >
                    <FiMinus />
                  </button>

                  <span>{item.qty}</span>

                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={isStockLimitReached}
                    onClick={() => increaseQty(index)}
                  >
                    <FiPlus />
                  </button>

                </div>

                {isStockLimitReached && (
                  <small className="cart-stock-warning">
                    Stock limit reached
                  </small>
                )}

                {/* ITEM TOTAL */}
                <div className="item-total">
                  <span>Item Total</span>

                  <strong>
                    ₹{itemTotal.toFixed(2)}
                  </strong>
                </div>

                {/* REMOVE */}
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeItem(index)}
                >
                  <FiTrash2 />
                  <span>Remove</span>
                </button>

              </div>

            </article>
          );
        })}

      </div>

      {/* CART FOOTER */}
      <div className="cart-footer">

        <div className="cart-footer-info">

          <span>Total Items</span>

          <strong>{totalQty}</strong>

        </div>

        <div className="cart-footer-divider" />

        <div className="cart-footer-info cart-footer-total">

          <span>Cart Subtotal</span>

          <strong>
            ₹{totalAmount.toFixed(2)}
          </strong>

        </div>

      </div>

    </section>
  );
}
