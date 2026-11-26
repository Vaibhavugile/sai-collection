
import "./ProductValidation.css";

export default function ProductValidation({ product = {} }) {
  const variants = product.variants || [];

  const checks = [
    {
      label: "Product Code",
      valid: Boolean(product.productCode?.trim()),
    },
    {
      label: "Product Name",
      valid: Boolean(product.name?.trim()),
    },
    {
      label: "Category",
      valid: Boolean(product.categoryId),
    },
    {
      label: "Sub Category",
      valid: Boolean(product.subCategoryId),
    },
    {
      label: "Variants",
      valid: variants.length > 0,
    },
    {
      label: "Purchase Price",
      valid:
        variants.length > 0 &&
        variants.every(
          (v) =>
            v.purchasePrice !== "" &&
            v.purchasePrice !== null &&
            Number.isFinite(Number(v.purchasePrice)) &&
            Number(v.purchasePrice) >= 0
        ),
    },
    {
      label: "Selling Price",
      valid:
        variants.length > 0 &&
        variants.every(
          (v) =>
            v.sellingPrice !== "" &&
            v.sellingPrice !== null &&
            Number.isFinite(Number(v.sellingPrice)) &&
            Number(v.sellingPrice) > 0
        ),
    },
    {
      label: "Stock",
      valid:
        variants.length > 0 &&
        variants.every(
          (v) =>
            v.stock !== "" &&
            v.stock !== null &&
            Number.isFinite(Number(v.stock)) &&
            Number(v.stock) >= 0
        ),
    },
  ];

  const completed = checks.filter((item) => item.valid).length;
  const pending = checks.length - completed;
  const ready = pending === 0;

  return (
    <div className="product-validation">
      <div className="validation-top">
        <div className="validation-title">
          <h3>Product Validation</h3>
          <span>{completed}/{checks.length} Completed</span>
        </div>

        <span className={`validation-result ${ready ? "ready" : "pending"}`}>
          {ready ? "✓ Ready to Save" : `${pending} Remaining`}
        </span>
      </div>

      <div className="validation-progress">
        <div
          className={ready ? "complete" : ""}
          style={{ width: `${(completed / checks.length) * 100}%` }}
        />
      </div>

      <div className="validation-list">
        {checks.map((item) => (
          <div
            key={item.label}
            className={`validation-chip ${item.valid ? "success" : "error"}`}
          >
            <span>{item.valid ? "✓" : "✕"}</span>
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
