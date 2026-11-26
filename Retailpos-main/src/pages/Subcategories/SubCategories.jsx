
import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";

import {
  AddRounded,
  CategoryRounded,
  DeleteOutlineRounded,
  RefreshRounded,
} from "@mui/icons-material";

import { motion } from "framer-motion";

// COMPONENTS
import SubCategoryStats from "../../components/subcategory/SubCategoryStats";
import SubCategoryToolbar from "../../components/subcategory/SubCategoryToolbar";
import SubCategoryTable from "../../components/subcategory/SubCategoryTable";
import AddSubCategoryDrawer from "../../components/subcategory/AddSubCategoryDrawer";

// CSS
import "../../components/subcategory/SubCategoryManagement.css";

// SERVICES
import {
  subscribeSubCategories,
  deleteSubCategory,
} from "../../services/subCategoryService";

import {
  subscribeCategories,
} from "../../services/categoryService";

const GOLD = "#B58A45";
const DARK = "#29251F";

// --------------------------------------------------
// DATE HELPER
// --------------------------------------------------

const getDateValue = (value) => {
  if (!value) return 0;

  if (typeof value.toMillis === "function") {
    return value.toMillis();
  }

  if (typeof value.seconds === "number") {
    return value.seconds * 1000;
  }

  const date = new Date(value).getTime();

  return Number.isNaN(date) ? 0 : date;
};

// --------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------

export default function SubCategories() {
  // --------------------------------------------------
  // STATES
  // --------------------------------------------------

  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("latest");

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // --------------------------------------------------
  // NOTIFICATION
  // --------------------------------------------------

  const showNotification = (message, severity = "success") => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  const closeNotification = () => {
    setNotification((prev) => ({
      ...prev,
      open: false,
    }));
  };

  // --------------------------------------------------
  // FIREBASE: SUBCATEGORY SUBSCRIPTION
  // --------------------------------------------------

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = subscribeSubCategories(
      (data) => {
        if (!isMounted) return;

        setSubCategories(Array.isArray(data) ? data : []);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => {
      isMounted = false;

      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  // --------------------------------------------------
  // FIREBASE: PARENT CATEGORY SUBSCRIPTION
  // --------------------------------------------------

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = subscribeCategories(
      (data) => {
        if (!isMounted) return;

        setCategories(Array.isArray(data) ? data : []);
      }
    );

    return () => {
      isMounted = false;

      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  // --------------------------------------------------
  // REFRESH
  // --------------------------------------------------

  const handleRefresh = () => {
    setRefreshing(true);

    // Firestore onSnapshot automatically keeps the list
    // updated. This resets filters and gives visual feedback.
    setSearch("");
    setCategory("all");
    setStatus("all");
    setSort("latest");

    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  // --------------------------------------------------
  // ADD SUBCATEGORY
  // --------------------------------------------------

  const handleAdd = () => {
    setDrawerOpen(true);
  };

  const handleAddSuccess = () => {
    setDrawerOpen(false);

    showNotification(
      "Subcategory created successfully.",
      "success"
    );
  };

  // --------------------------------------------------
  // DELETE DIALOG
  // --------------------------------------------------

  const handleDeleteRequest = (item) => {
    setSelectedSubCategory(item);
    setDeleteDialogOpen(true);
  };

  const handleCancelDelete = () => {
    if (deleting) return;

    setDeleteDialogOpen(false);
    setSelectedSubCategory(null);
  };

  // --------------------------------------------------
  // DELETE SUBCATEGORY
  // --------------------------------------------------

  const handleConfirmDelete = async () => {
    if (!selectedSubCategory?.id) {
      showNotification(
        "Subcategory information is missing.",
        "error"
      );
      return;
    }

    try {
      setDeleting(true);

      await deleteSubCategory(
        selectedSubCategory.id,
        selectedSubCategory.imagePath || ""
      );

      setDeleteDialogOpen(false);

      showNotification(
        `"${selectedSubCategory.name}" deleted successfully.`,
        "success"
      );

      setSelectedSubCategory(null);
    } catch (error) {
      console.error("Delete subcategory error:", error);

      showNotification(
        error?.message || "Unable to delete subcategory.",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  // --------------------------------------------------
  // EDIT SUBCATEGORY
  // --------------------------------------------------

  const handleEdit = (item) => {
    // The edit drawer and update service are not included
    // in the supplied files yet.
    console.log("Selected subcategory for editing:", item);

    showNotification(
      "The edit drawer and update service need to be connected.",
      "info"
    );
  };

  // --------------------------------------------------
  // FILTERING AND SORTING
  // --------------------------------------------------

  const filteredSubCategories = useMemo(() => {
    let data = [...subCategories];

    const keyword = search.trim().toLowerCase();

    // SEARCH
    if (keyword) {
      data = data.filter((item) => {
        return (
          item.name?.toLowerCase().includes(keyword) ||
          item.description?.toLowerCase().includes(keyword) ||
          item.categoryName?.toLowerCase().includes(keyword)
        );
      });
    }

    // PARENT CATEGORY
    if (category !== "all") {
      data = data.filter(
        (item) => item.categoryId === category
      );
    }

    // STATUS
    if (status !== "all") {
      data = data.filter((item) =>
        status === "active"
          ? item.status === true
          : item.status === false
      );
    }

    // SORT
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
          (a, b) =>
            getDateValue(a.createdAt) -
            getDateValue(b.createdAt)
        );
        break;

      case "latest":
      default:
        data.sort(
          (a, b) =>
            getDateValue(b.createdAt) -
            getDateValue(a.createdAt)
        );
        break;
    }

    return data;
  }, [
    subCategories,
    search,
    category,
    status,
    sort,
  ]);

  // --------------------------------------------------
  // RESET FILTERS
  // --------------------------------------------------

  const handleReset = () => {
    setSearch("");
    setCategory("all");
    setStatus("all");
    setSort("latest");
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "100%",
            pb: 4,
          }}
        >

          {/* ==========================================
              PAGE HEADER
          ========================================== */}

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: {
                xs: "flex-start",
                md: "center",
              },
              flexDirection: {
                xs: "column",
                md: "row",
              },
              gap: 2,
              mb: 3.5,
            }}
          >
            <Box>
              <Stack
                direction="row"
                spacing={1.2}
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: "13px",
                    display: "grid",
                    placeItems: "center",
                    color: GOLD,
                    background: "#F3E9D5",
                  }}
                >
                  <CategoryRounded />
                </Box>

                <Typography
                  sx={{
                    color: GOLD,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "1.7px",
                  }}
                >
                  STORE MANAGEMENT
                </Typography>
              </Stack>

              <Typography
                sx={{
                  fontSize: {
                    xs: 27,
                    sm: 32,
                    md: 38,
                  },
                  fontWeight: 800,
                  color: DARK,
                  letterSpacing: "-1.4px",
                  lineHeight: 1.2,
                }}
              >
                Subcategories
              </Typography>

              <Typography
                sx={{
                  mt: 0.8,
                  fontSize: 13,
                  color: "#918779",
                }}
              >
                Organise and manage your store's product subcategories.
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={1.2}
              sx={{
                width: {
                  xs: "100%",
                  md: "auto",
                },
              }}
            >
              <Button
                fullWidth
                variant="outlined"
                startIcon={
                  <RefreshRounded
                    sx={{
                      animation: refreshing
                        ? "saiRefresh .8s linear infinite"
                        : "none",
                    }}
                  />
                }
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{
                  height: 48,
                  px: 2,
                  borderRadius: "12px",
                  borderColor: "#E9DFCE",
                  color: "#746956",
                  fontWeight: 700,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: GOLD,
                    background: "#FAF7F0",
                  },
                  "@keyframes saiRefresh": {
                    from: { transform: "rotate(0deg)" },
                    to: { transform: "rotate(360deg)" },
                  },
                }}
              >
                Reset
              </Button>

              <Button
                fullWidth
                variant="contained"
                startIcon={<AddRounded />}
                onClick={handleAdd}
                sx={{
                  height: 48,
                  px: 2.5,
                  borderRadius: "12px",
                  color: "#fff",
                  background: "linear-gradient(135deg, #BD8B2D, #9E7021)",
                  boxShadow: "0 7px 18px rgba(157,112,33,.18)",
                  fontWeight: 800,
                  textTransform: "none",
                  whiteSpace: "nowrap",
                  "&:hover": {
                    background: "linear-gradient(135deg, #A97925, #875D18)",
                  },
                }}
              >
                Add Subcategory
              </Button>
            </Stack>
          </Box>

          {/* ==========================================
              OVERVIEW BANNER
          ========================================== */}

          <Box
            sx={{
              mb: 3,
              p: {
                xs: 2,
                sm: 2.5,
              },
              borderRadius: "17px",
              border: "1px solid #EEE5D7",
              background: "linear-gradient(110deg, #FFFEFC, #F8F2E7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#9A8F7E",
                  letterSpacing: "1px",
                }}
              >
                TOTAL SUBCATEGORIES
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,
                  color: DARK,
                  fontSize: 28,
                  lineHeight: 1.2,
                  fontWeight: 800,
                  letterSpacing: "-1px",
                }}
              >
                {loading
                  ? "—"
                  : String(subCategories.length).padStart(2, "0")}
              </Typography>
            </Box>

            <Box
              sx={{
                px: 2,
                py: 1.2,
                borderRadius: "10px",
                background: "#F1E7D4",
                color: "#9B712C",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: ".8px",
                whiteSpace: "nowrap",
              }}
            >
              SAI COLLECTION · LATUR
            </Box>
          </Box>

          {/* ==========================================
              STATISTICS
          ========================================== */}

          {loading ? (
            <Box
              sx={{
                minHeight: 130,
                display: "grid",
                placeItems: "center",
              }}
            >
              <CircularProgress
                size={30}
                sx={{ color: GOLD }}
              />
            </Box>
          ) : (
            <SubCategoryStats
              subCategories={subCategories}
            />
          )}

          {/* ==========================================
              TOOLBAR
          ========================================== */}

          <SubCategoryToolbar
            search={search}
            setSearch={setSearch}
            category={category}
            setCategory={setCategory}
            categories={categories}
            status={status}
            setStatus={setStatus}
            sort={sort}
            setSort={setSort}
            onAdd={handleAdd}
          />

          {/* ==========================================
              RESULTS INFORMATION
          ========================================== */}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 1,
              mb: 1.5,
            }}
          >
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 700,
                color: "#716757",
              }}
            >
              {loading
                ? "Loading subcategories..."
                : `Showing ${filteredSubCategories.length} of ${subCategories.length} subcategories`}
            </Typography>

            {(search || category !== "all" || status !== "all") && (
              <Button
                size="small"
                onClick={handleReset}
                sx={{
                  color: GOLD,
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "none",
                }}
              >
                Clear filters
              </Button>
            )}
          </Box>

          {/* ==========================================
              TABLE
          ========================================== */}

          {loading ? (
            <Box
              sx={{
                minHeight: 260,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 2,
                border: "1px solid #EEE7DB",
                borderRadius: "15px",
                background: "#FFFEFC",
              }}
            >
              <CircularProgress
                size={32}
                sx={{ color: GOLD }}
              />

              <Typography
                sx={{
                  color: "#918779",
                  fontSize: 12,
                }}
              >
                Loading your subcategory catalogue...
              </Typography>
            </Box>
          ) : (
            <SubCategoryTable
              subCategories={filteredSubCategories}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
            />
          )}

        </Box>
      </motion.div>

      {/* ==========================================
          ADD SUBCATEGORY DRAWER
      ========================================== */}

      <AddSubCategoryDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {/* ==========================================
          DELETE CONFIRMATION DIALOG
      ========================================== */}

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: "20px",
            p: 1,
            background: "#FFFEFC",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            color: DARK,
            fontSize: 19,
            fontWeight: 800,
          }}
        >
          <Box
            sx={{
              width: 42,
              height: 42,
              display: "grid",
              placeItems: "center",
              borderRadius: "12px",
              color: "#B36B64",
              background: "#FAEFED",
            }}
          >
            <DeleteOutlineRounded />
          </Box>

          Delete Subcategory?
        </DialogTitle>

        <DialogContent>
          <Typography
            sx={{
              color: "#81786C",
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            Are you sure you want to delete{" "}
            <Box
              component="span"
              sx={{
                fontWeight: 800,
                color: DARK,
              }}
            >
              {selectedSubCategory?.name}
            </Box>
            ? This action cannot be undone.
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
            gap: 1,
          }}
        >
          <Button
            fullWidth
            variant="outlined"
            onClick={handleCancelDelete}
            disabled={deleting}
            sx={{
              minHeight: 43,
              borderRadius: "10px",
              borderColor: "#E6DED1",
              color: "#6D655A",
              fontWeight: 700,
              textTransform: "none",
            }}
          >
            Cancel
          </Button>

          <Button
            fullWidth
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleting}
            startIcon={
              deleting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <DeleteOutlineRounded />
              )
            }
            sx={{
              minHeight: 43,
              borderRadius: "10px",
              fontWeight: 800,
              textTransform: "none",
              boxShadow: "none",
            }}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

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
          onClose={closeNotification}
          severity={notification.severity}
          variant="filled"
          sx={{
            borderRadius: "11px",
            fontSize: 12,
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}
