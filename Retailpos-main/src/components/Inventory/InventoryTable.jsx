
import "./InventoryTable.css";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  DeleteOutlineRounded,
  EditOutlined,
  HistoryRounded,
  Inventory2Outlined,
  VisibilityOutlined,
} from "@mui/icons-material";

const formatCurrency = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "—";

  return `₹ ${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

export default function InventoryTable({
  products = [],
  search = "",
  onEdit,
  onDelete,
  onView,
  onHistory,
}) {
  const navigate = useNavigate();

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return products;

    return products.filter(
      (product) =>
        product.name?.toLowerCase().includes(keyword) ||
        product.productCode?.toLowerCase().includes(keyword)
    );
  }, [products, search]);

  const handleView = (product) => {
    if (typeof onView === "function") {
      onView(product);
    } else {
      navigate(`/products/view/${product.id}`);
    }
  };

  const handleEdit = (product) => {
    if (typeof onEdit === "function") {
      onEdit(product);
    } else {
      navigate(`/products/edit/${product.id}`);
    }
  };

  const handleHistory = (product) => {
    if (typeof onHistory === "function") {
      onHistory(product);
    } else {
      navigate(`/products/${product.id}/history`);
    }
  };

  if (filteredProducts.length === 0) {
    return (
      <section className="inventory-table-card">
        <div className="empty-state">
          <div className="empty-icon">
            <Inventory2Outlined />
          </div>

          <h3>
            {search ? "No matching products" : "No products found"}
          </h3>

          <p>
            {search
              ? "Try another product name or product code."
              : "Your products will appear here once they have been added."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="inventory-table-card">
      <div className="inventory-table-scroll">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Product Code</th>
              <th>Category</th>
              <th>Variants</th>
              <th>Stock</th>
              <th>Starting Price</th>
              <th>Status</th>
              <th className="inventory-actions-heading">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.map((product) => {
              const coverImage =
                product.images?.find((image) => image.isCover)?.url ||
                product.images?.[0]?.url ||
                "";

              const variants = Array.isArray(product.variants)
                ? product.variants
                : [];

              const variantPrices = variants
                .map((variant) => Number(variant.sellingPrice))
                .filter(
                  (price) => Number.isFinite(price) && price >= 0
                );

              const startingPrice = variantPrices.length
                ? Math.min(...variantPrices)
                : Number(product.sellingPrice ?? product.price);

              const stock = Number(product.totalStock) || 0;
              const productStatus = product.status === "active";

              return (
                <tr key={product.id}>
                  {/* Product */}
                  <td>
                    <div className="inventory-product-cell">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={product.name || "Product"}
                          className="product-thumb"
                          loading="lazy"
                        />
                      ) : (
                        <div className="product-thumb product-thumb-placeholder">
                          <Inventory2Outlined />
                        </div>
                      )}

                      <div className="inventory-product-info">
                        <strong>
                          {product.name || "Unnamed product"}
                        </strong>

                        <span>
                          {product.totalVariants ?? variants.length} variant(s)
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Product Code */}
                  <td>
                    <span className="inventory-code">
                      {product.productCode || "—"}
                    </span>
                  </td>

                  {/* Category */}
                  <td>{product.categoryName || "—"}</td>

                  {/* Variants */}
                  <td>
                    {product.totalVariants ?? variants.length}
                  </td>

                  {/* Stock */}
                  <td>
                    <span
                      className={`inventory-stock ${
                        stock <= 0
                          ? "out"
                          : stock <= 5
                          ? "low"
                          : ""
                      }`}
                    >
                      {stock.toLocaleString("en-IN")}
                    </span>
                  </td>

                  {/* Starting Price */}
                  <td className="inventory-price">
                    {Number.isFinite(startingPrice)
                      ? formatCurrency(startingPrice)
                      : "—"}
                  </td>

                  {/* Status */}
                  <td>
                    <span
                      className={`inventory-status ${
                        productStatus ? "active" : "inactive"
                      }`}
                    >
                      {productStatus ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td>
                    <div className="inventory-row-actions">
                      <button
                        type="button"
                        title="View product"
                        aria-label={`View ${product.name || "product"}`}
                        className="inventory-action view"
                        onClick={() => handleView(product)}
                      >
                        <VisibilityOutlined />
                      </button>

                      <button
                        type="button"
                        title="Edit product"
                        aria-label={`Edit ${product.name || "product"}`}
                        className="inventory-action edit"
                        onClick={() => handleEdit(product)}
                      >
                        <EditOutlined />
                      </button>

                      <button
                        type="button"
                        title="View edit history"
                        aria-label={`View edit history for ${
                          product.name || "product"
                        }`}
                        className="inventory-action history"
                        onClick={() => handleHistory(product)}
                      >
                        <HistoryRounded />
                      </button>

                      <button
                        type="button"
                        title="Delete product"
                        aria-label={`Delete ${product.name || "product"}`}
                        className="inventory-action delete"
                        onClick={() => onDelete?.(product)}
                        disabled={typeof onDelete !== "function"}
                      >
                        <DeleteOutlineRounded />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="inventory-table-footer">
        Showing{" "}
        {filteredProducts.length.toLocaleString("en-IN")} product(s)
      </div>
    </section>
  );
}
