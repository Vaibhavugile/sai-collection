
import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Snackbar,
  Typography,
} from "@mui/material";

import {
  AddRounded,
  CategoryRounded,
  RefreshRounded,
} from "@mui/icons-material";

import { motion } from "framer-motion";

import CategoryStats from "../../components/category/CategoryStats";
import CategoryToolbar from "../../components/category/CategoryToolbar";
import CategoryTable from "../../components/category/CategoryTable";

import AddCategoryDrawer from "../../components/category/AddCategoryDrawer";
import EditCategoryDrawer from "../../components/category/EditCategoryDrawer";

import {
  subscribeCategories,
  deleteCategory,
  updateCategory,
  updateCategoryWithImage,
} from "../../services/categoryService";
import "../../components/category/CategoryManagement.css";
const GOLD = "#B58A45";
const DARK = "#29251F";

export default function Categories() {
  // ==================================================
  // SEARCH AND FILTERS
  // ==================================================

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("latest");

  // ==================================================
  // DRAWERS
  // ==================================================

  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // ==================================================
  // FIRESTORE DATA
  // ==================================================

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // ==================================================
  // NOTIFICATIONS
  // ==================================================

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showNotification = (message, severity = "success") => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  const closeNotification = () => {
    setNotification((previous) => ({
      ...previous,
      open: false,
    }));
  };

  // ==================================================
  // REALTIME FIRESTORE SUBSCRIPTION
  // ==================================================

  useEffect(() => {
    setLoading(true);

    const unsubscribe = subscribeCategories(
      (data) => {
        setCategories(Array.isArray(data) ? data : []);
        setLoading(false);
      },
      (error) => {
        console.error("Category subscription error:", error);

        setLoading(false);

        showNotification(
          error.message || "Unable to load categories.",
          "error"
        );
      }
    );

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  // ==================================================
  // FILTER AND SORT
  // ==================================================

  const filteredCategories = useMemo(() => {
    let data = [...categories];

    const searchText = search.trim().toLowerCase();

    // Search
    if (searchText) {
      data = data.filter((item) => {
        const name = item.name?.toLowerCase() || "";
        const description =
          item.description?.toLowerCase() || "";

        return (
          name.includes(searchText) ||
          description.includes(searchText)
        );
      });
    }

    // Status
    if (status === "active") {
      data = data.filter((item) => item.status === true);
    } else if (status === "inactive") {
      data = data.filter((item) => item.status === false);
    }

    // Timestamp helper
    const getTimestamp = (item) => {
      const createdAt = item.createdAt;

      if (!createdAt) return 0;

      if (typeof createdAt.toMillis === "function") {
        return createdAt.toMillis();
      }

      if (typeof createdAt.seconds === "number") {
        return createdAt.seconds * 1000;
      }

      const parsed = new Date(createdAt).getTime();

      return Number.isNaN(parsed) ? 0 : parsed;
    };

    // Sorting
    switch (sort) {
      case "az":
        data.sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        );
        break;

      case "za":
        data.sort((a, b) =>
          (b.name || "").localeCompare(a.name || "")
        );
        break;

      case "oldest":
        data.sort(
          (a, b) => getTimestamp(a) - getTimestamp(b)
        );
        break;

      case "latest":
      default:
        data.sort(
          (a, b) => getTimestamp(b) - getTimestamp(a)
        );
        break;
    }

    return data;
  }, [categories, search, status, sort]);

  // ==================================================
  // EDIT CATEGORY
  // ==================================================

  const handleEdit = (category) => {
    setEditingCategory(category);
  };

  const handleSaveEdit = async (id, data, imageFile) => {
    try {
      if (imageFile) {
        await updateCategoryWithImage(
          id,
          data,
          imageFile,
          editingCategory?.imagePath || ""
        );
      } else {
        await updateCategory(id, data);
      }

      setEditingCategory(null);

      showNotification("Category updated successfully.");

    } catch (error) {
      console.error("Update category error:", error);

      showNotification(
        error.message || "Unable to update category.",
        "error"
      );

      throw error;
    }
  };

  // ==================================================
  // DELETE CATEGORY
  // ==================================================

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      await deleteCategory(
        category.id,
        category.imagePath || ""
      );

      showNotification(
        `"${category.name}" deleted successfully.`
      );

    } catch (error) {
      console.error("Delete category error:", error);

      showNotification(
        error.message || "Unable to delete category.",
        "error"
      );

    } finally {
      setDeleting(false);
    }
  };

  // ==================================================
  // RESET FILTERS
  // ==================================================

  const handleRefresh = () => {
    setSearch("");
    setStatus("all");
    setSort("latest");
  };

  // ==================================================
  // ADD SUCCESS
  // ==================================================

  const handleAddSuccess = () => {
    showNotification("Category added successfully.");
  };

  // ==================================================
  // PAGE UI
  // ==================================================

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: "easeOut",
      }}
    >
      <Box
        sx={{
          width: "100%",
          minHeight: "100%",
          pb: 4,
        }}
      >
        {/* ==========================================
            PAGE HEADER
        ========================================== */}

        <Box
          sx={{
            mb: { xs: 3, md: 4 },
            display: "flex",
            justifyContent: "space-between",
            alignItems: {
              xs: "flex-start",
              sm: "center",
            },
            flexDirection: {
              xs: "column",
              sm: "row",
            },
            gap: 2.5,
          }}
        >
          <Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 1,
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "12px",
                  display: "grid",
                  placeItems: "center",
                  background: "#F2E8D7",
                  color: GOLD,
                }}
              >
                <CategoryRounded fontSize="small" />
              </Box>

              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                  color: GOLD,
                }}
              >
                STORE MANAGEMENT
              </Typography>
            </Box>

            <Typography
              sx={{
                fontSize: {
                  xs: 30,
                  sm: 36,
                  md: 42,
                },
                fontWeight: 850,
                color: DARK,
                letterSpacing: "-0.045em",
                lineHeight: 1.1,
              }}
            >
              Categories
            </Typography>

            <Typography
              sx={{
                mt: 1,
                fontSize: 13,
                color: "#898176",
                lineHeight: 1.6,
              }}
            >
              Organize and manage your store's product categories.
            </Typography>
          </Box>

          {/* HEADER BUTTONS */}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              width: {
                xs: "100%",
                sm: "auto",
              },
            }}
          >
            <Button
              variant="outlined"
              startIcon={<RefreshRounded />}
              onClick={handleRefresh}
              sx={{
                minHeight: 45,
                borderRadius: "12px",
                borderColor: "#E8DFD0",
                color: "#655D52",
                fontWeight: 750,
                textTransform: "none",
                "&:hover": {
                  borderColor: GOLD,
                  background: "#FAF7F0",
                },
              }}
            >
              Reset
            </Button>

            <Button
              variant="contained"
              startIcon={<AddRounded />}
              onClick={() => setAddDrawerOpen(true)}
              sx={{
                minHeight: 45,
                px: 2.5,
                flex: {
                  xs: 1,
                  sm: "initial",
                },
                borderRadius: "12px",
                background: GOLD,
                color: "#fff",
                fontWeight: 800,
                textTransform: "none",
                boxShadow: "0 7px 18px rgba(181,138,69,0.18)",
                "&:hover": {
                  background: "#9D7438",
                },
              }}
            >
              Add Category
            </Button>
          </Box>
        </Box>

        {/* ==========================================
            CATEGORY OVERVIEW
        ========================================== */}

        <Box
          sx={{
            mb: 3,
            p: 2.2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
            border: "1px solid #EEE7DB",
            borderRadius: "16px",
            background:
              "linear-gradient(120deg, #FFFEFC 0%, #FAF6EE 100%)",
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: 11,
                color: "#8D8579",
                fontWeight: 750,
                letterSpacing: "0.08em",
              }}
            >
              TOTAL CATEGORIES
            </Typography>

            <Typography
              sx={{
                mt: 0.4,
                fontSize: 24,
                fontWeight: 850,
                color: DARK,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {categories.length.toString().padStart(2, "0")}
            </Typography>
          </Box>

          <Box
            sx={{
              px: 2,
              py: 1,
              borderRadius: "10px",
              background: "#F1E7D5",
              color: "#99713A",
              fontSize: 11,
              fontWeight: 850,
              letterSpacing: "0.06em",
            }}
          >
            SAI COLLECTION · LATUR
          </Box>
        </Box>

        {/* ==========================================
            STATISTICS
        ========================================== */}

        <Box sx={{ mb: 3 }}>
          <CategoryStats categories={categories} />
        </Box>

        {/* ==========================================
            TOOLBAR
        ========================================== */}

        <Box sx={{ mb: 3 }}>
          <CategoryToolbar
            search={search}
            setSearch={setSearch}
            status={status}
            setStatus={setStatus}
            sort={sort}
            setSort={setSort}
            onAdd={() => setAddDrawerOpen(true)}
          />
        </Box>

        {/* ==========================================
            CATEGORY TABLE
        ========================================== */}

        <Box
          sx={{
            background: "#FFFEFC",
            border: "1px solid #EEE8DE",
            borderRadius: {
              xs: "14px",
              md: "20px",
            },
            overflow: "hidden",
            boxShadow: "0 8px 30px rgba(48,39,24,0.035)",
          }}
        >
          {/* TABLE HEADER */}

          <Box
            sx={{
              px: { xs: 2, md: 3 },
              py: 2.2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
              borderBottom: "1px solid #F0EBE3",
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: 16,
                  fontWeight: 850,
                  color: DARK,
                }}
              >
                All Categories
              </Typography>

              <Typography
                sx={{
                  mt: 0.4,
                  fontSize: 12,
                  color: "#948B7F",
                }}
              >
                Manage your category collection
              </Typography>
            </Box>

            <Typography
              sx={{
                px: 1.5,
                py: 0.8,
                borderRadius: "9px",
                background: "#F5EFE4",
                color: "#99733D",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {filteredCategories.length} Results
            </Typography>
          </Box>

          {/* TABLE BODY */}

          {loading ? (
            <Box
              sx={{
                py: 12,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <CircularProgress
                size={38}
                thickness={4}
                sx={{ color: GOLD }}
              />

              <Typography
                sx={{
                  fontSize: 13,
                  color: "#91897E",
                  fontWeight: 600,
                }}
              >
                Loading categories...
              </Typography>
            </Box>
          ) : (
            <CategoryTable
              categories={filteredCategories}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </Box>

        {/* ==========================================
            ADD CATEGORY DRAWER
        ========================================== */}

        <AddCategoryDrawer
          open={addDrawerOpen}
          onClose={() => setAddDrawerOpen(false)}
          onSuccess={handleAddSuccess}
        />

        {/* ==========================================
            EDIT CATEGORY DRAWER
        ========================================== */}

        <EditCategoryDrawer
          open={Boolean(editingCategory)}
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSave={handleSaveEdit}
        />

        {/* ==========================================
            NOTIFICATIONS
        ========================================== */}

        <Snackbar
          open={notification.open}
          autoHideDuration={3500}
          onClose={closeNotification}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
        >
          <Alert
            severity={notification.severity}
            variant="filled"
            onClose={closeNotification}
            sx={{
              borderRadius: "12px",
              fontWeight: 650,
            }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </motion.div>
  );
}
