import "./InventoryToolbar.css";
import { useNavigate } from "react-router-dom";
import {
  AddRounded,
  FilterListRounded,
  RefreshRounded,
  SearchRounded,
} from "@mui/icons-material";

export default function InventoryToolbar({
  search = "",
  setSearch,
  category = "",
  setCategory,
  subCategory = "",
  setSubCategory,
  status = "",
  setStatus,
  categories = [],
  subCategories = [],
  onRefresh,
  onAdd,
}) {
  const navigate = useNavigate();

  const handleAdd = () => {
    if (typeof onAdd === "function") {
      onAdd();
    } else {
      navigate("/addproduct");
    }
  };

  return (
    <section className="inventory-toolbar-card">
      <div className="inventory-toolbar-heading">
        <div>
          <h3>Product directory</h3>
          <p>Search, filter and manage your store inventory.</p>
        </div>

        <button type="button" className="add-product-btn" onClick={handleAdd}>
          <AddRounded />
          <span>Add Product</span>
        </button>
      </div>

      <div className="inventory-toolbar">
        <div className="toolbar-left">
          <label className="inventory-search-wrap">
            <SearchRounded />
            <input
              type="search"
              className="search-input"
              placeholder="Search by product name or product code..."
              value={search}
              onChange={(event) => setSearch?.(event.target.value)}
              aria-label="Search products"
            />
          </label>

          <label className="inventory-select-wrap">
            <FilterListRounded />
            <select
              className="toolbar-select"
              value={category}
              onChange={(event) => {
                setCategory?.(event.target.value);
                setSubCategory?.("");
              }}
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>

          <label className="inventory-select-wrap">
            <select
              className="toolbar-select"
              value={subCategory}
              onChange={(event) => setSubCategory?.(event.target.value)}
              aria-label="Filter by subcategory"
            >
              <option value="">All Subcategories</option>
              {subCategories
                .filter((item) => !category || item.categoryId === category)
                .map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
            </select>
          </label>

          <label className="inventory-select-wrap">
            <select
              className="toolbar-select"
              value={status}
              onChange={(event) => setStatus?.(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>

        <div className="toolbar-actions">
          <button type="button" className="refresh-btn" onClick={onRefresh}>
            <RefreshRounded />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </section>
  );
}
