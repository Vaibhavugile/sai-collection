
import "./InventoryToolbar.css";
import { useNavigate } from "react-router-dom";

import {
  AddRounded,
  FilterListRounded,
  RefreshRounded,
  SearchRounded,
  CloseRounded,
} from "@mui/icons-material";

export default function InventoryToolbar({
  search = "",
  setSearch,
  onSearch,
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

  const handleSearch = (event) => {
    event.preventDefault();
    onSearch?.(search.trim().toUpperCase());
  };

  const clearSearch = () => {
    setSearch?.("");
    onSearch?.("");
  };

  const handleCategoryChange = (value) => {
    setCategory?.(value);
    setSubCategory?.("");
  };

  const availableSubCategories = subCategories.filter((item) => {
    if (!category) return true;

    return (
      item.categoryId === category ||
      item.parentCategoryId === category
    );
  });

  const activeFilters = [
    Boolean(search.trim()),
    Boolean(category),
    Boolean(subCategory),
    Boolean(status),
  ].filter(Boolean).length;

  return (
    <section className="inventory-toolbar-card">

      <div className="inventory-toolbar-heading">
        <div>
          <h3>Product directory</h3>
          <p>
            Search products by product code and manage your store inventory.
          </p>
        </div>

        <button
          type="button"
          className="add-product-btn"
          onClick={handleAdd}
        >
          <AddRounded />
          <span>Add Product</span>
        </button>
      </div>

      <div className="inventory-toolbar">

        <div className="toolbar-left">

          {/* PRODUCT CODE SEARCH */}

          <form
            className="inventory-search-wrap"
            onSubmit={handleSearch}
          >
            <SearchRounded />

            <input
              type="search"
              className="search-input"
              placeholder="Enter Product Code (e.g. P000125)"
              value={search}
              onChange={(event) =>
                setSearch?.(event.target.value.toUpperCase())
              }
              aria-label="Enter product code"
              autoComplete="off"
            />

            {search && (
              <button
                type="button"
                className="inventory-search-clear"
                onClick={clearSearch}
                title="Clear search"
                aria-label="Clear product code search"
              >
                <CloseRounded />
              </button>
            )}

            <button
              type="submit"
              className="inventory-search-submit"
              title="Search product code"
            >
              <SearchRounded />
              <span>Search</span>
            </button>
          </form>

          {/* CATEGORY */}

          <label className="inventory-select-wrap">
            <FilterListRounded />

            <select
              className="toolbar-select"
              value={category}
              onChange={(event) =>
                handleCategoryChange(event.target.value)
              }
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>

              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name ||
                    item.categoryName ||
                    "Unnamed Category"}
                </option>
              ))}
            </select>
          </label>

          {/* SUBCATEGORY */}

          <label className="inventory-select-wrap">
            <select
              className="toolbar-select"
              value={subCategory}
              onChange={(event) =>
                setSubCategory?.(event.target.value)
              }
              aria-label="Filter by subcategory"
            >
              <option value="">All Subcategories</option>

              {availableSubCategories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name ||
                    item.subCategoryName ||
                    item.subcategoryName ||
                    "Unnamed Subcategory"}
                </option>
              ))}
            </select>
          </label>

          {/* STATUS */}

          <label className="inventory-select-wrap">
            <select
              className="toolbar-select"
              value={status}
              onChange={(event) =>
                setStatus?.(event.target.value)
              }
              aria-label="Filter by status"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

        </div>

        <div className="toolbar-actions">

          {activeFilters > 0 && (
            <span className="inventory-active-filters">
              {activeFilters} filter
              {activeFilters > 1 ? "s" : ""} active
            </span>
          )}

          <button
            type="button"
            className="refresh-btn"
            onClick={onRefresh}
          >
            <RefreshRounded />
            <span>Reset Filters</span>
          </button>

        </div>

      </div>
    </section>
  );
}
