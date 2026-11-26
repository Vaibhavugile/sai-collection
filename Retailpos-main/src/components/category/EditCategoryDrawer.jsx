
import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import {
  CloseRounded,
  CloudUploadRounded,
  SaveRounded,
} from "@mui/icons-material";

import { motion } from "framer-motion";

const initialForm = {
  name: "",
  description: "",
  status: true,
};

const GOLD = "#B58A45";
const DARK = "#29251F";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export default function EditCategoryDrawer({
  open,
  category,
  onClose,
  onSave,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [form, setForm] = useState(initialForm);

  // --------------------------------------------------
  // INITIALIZE CATEGORY DATA
  // --------------------------------------------------

  useEffect(() => {
    if (!open || !category) return;

    setForm({
      name: category.name || "",
      description: category.description || "",
      status: category.status !== false,
    });

    setImage(category.image || null);
    setImageFile(null);
    setError("");
  }, [open, category]);

  // --------------------------------------------------
  // CLEANUP TEMPORARY IMAGE PREVIEW
  // --------------------------------------------------

  useEffect(() => {
    return () => {
      if (image?.startsWith("blob:")) {
        URL.revokeObjectURL(image);
      }
    };
  }, [image]);

  // --------------------------------------------------
  // CLOSE DRAWER
  // --------------------------------------------------

  const handleClose = () => {
    if (loading) return;

    setError("");
    setImageFile(null);
    setForm(initialForm);

    onClose?.();
  };

  // --------------------------------------------------
  // FORM HANDLING
  // --------------------------------------------------

  const handleChange = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  // --------------------------------------------------
  // IMAGE UPLOAD PREVIEW
  // --------------------------------------------------

  const handleImage = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image size must be less than 5 MB.");
      event.target.value = "";
      return;
    }

    setImageFile(file);
    setImage(URL.createObjectURL(file));

    // Allow selecting the same file again.
    event.target.value = "";
  };

  // --------------------------------------------------
  // CREATE CATEGORY SLUG
  // --------------------------------------------------

  const createSlug = (value) => {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  // --------------------------------------------------
  // SAVE CATEGORY
  // --------------------------------------------------

  const handleSave = async () => {
    setError("");

    if (!category?.id) {
      setError("Category information is missing.");
      return;
    }

    if (!form.name.trim()) {
      setError("Category name is required.");
      return;
    }

    if (!form.description.trim()) {
      setError("Category description is required.");
      return;
    }

    if (typeof onSave !== "function") {
      setError("Category update handler is not connected.");
      return;
    }

    try {
      setLoading(true);

      const updatedData = {
        name: form.name.trim(),

        slug: createSlug(form.name),

        description: form.description.trim(),

        // Preserve the existing image until the service
        // successfully uploads a replacement.
        image: category.image || null,
        imagePath: category.imagePath || null,

        status: form.status,

        productCount: Number(category.productCount) || 0,
      };

      // The parent Categories page manages Firebase
      // upload and Firestore update operations.
      // Third argument is the selected replacement file.
      await onSave(
        category.id,
        updatedData,
        imageFile
      );

      // Parent closes the drawer after a successful save.
    } catch (err) {
      console.error("Update category failed:", err);

      setError(
        err?.message ||
          "Could not update category. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // FIELD STYLES
  // --------------------------------------------------

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "11px",
      backgroundColor: "#FFFFFF",
      fontSize: 13,

      "& fieldset": {
        borderColor: "#E9E2D7",
      },

      "&:hover fieldset": {
        borderColor: "#D8C39C",
      },

      "&.Mui-focused fieldset": {
        borderColor: GOLD,
        borderWidth: 1,
      },
    },

    "& .MuiInputLabel-root": {
      fontSize: 13,
    },

    "& .MuiInputLabel-root.Mui-focused": {
      color: GOLD,
    },
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: {
              xs: "100%",
              sm: 480,
              md: 520,
            },

            maxWidth: "100%",

            borderRadius: {
              xs: 0,
              sm: "18px 0 0 18px",
            },

            background: "#FFFEFC",
          },
        }}
      >
        <Box className="sai-edit-category-drawer">

          {/* HEADER */}

          <Box className="sai-edit-category-header">
            <Box>
              <Typography className="sai-edit-category-eyebrow">
                SAI COLLECTION · LATUR
              </Typography>

              <Typography className="sai-edit-category-title">
                Edit Category
              </Typography>

              <Typography className="sai-edit-category-subtitle">
                Update category details and visibility.
              </Typography>
            </Box>

            <IconButton
              onClick={handleClose}
              disabled={loading}
              aria-label="Close edit category"
              sx={{
                width: 40,
                height: 40,
                border: "1px solid #EEE8DD",
                color: DARK,
              }}
            >
              <CloseRounded />
            </IconButton>
          </Box>

          <Divider sx={{ borderColor: "#F0EBE3" }} />

          {/* FORM BODY */}

          <Box className="sai-edit-category-body">
            <Stack spacing={2.5}>

              {/* CATEGORY IMAGE */}

              <Box>
                <Typography className="sai-edit-field-label">
                  CATEGORY IMAGE
                </Typography>

                <motion.label
                  whileTap={{ scale: 0.99 }}
                  className="sai-edit-image-upload"
                  style={{
                    position: "relative",
                  }}
                >
                  {image ? (
                    <>
                      <img
                        src={image}
                        alt="Category preview"
                      />

                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 10,
                          right: 10,
                          px: 1.5,
                          py: 0.8,
                          borderRadius: "8px",
                          background: "rgba(35,30,24,0.82)",
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        Change Image
                      </Box>
                    </>
                  ) : (
                    <Box className="sai-edit-image-placeholder">
                      <CloudUploadRounded />

                      <strong>
                        Upload category image
                      </strong>

                      <span>
                        JPG, PNG or WEBP · Maximum 5 MB
                      </span>
                    </Box>
                  )}

                  <input
                    hidden
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImage}
                    disabled={loading}
                  />
                </motion.label>

                {imageFile && (
                  <Typography
                    sx={{
                      mt: 1,
                      fontSize: 11,
                      color: "#8C7549",
                    }}
                  >
                    New image selected: {imageFile.name}
                  </Typography>
                )}
              </Box>

              {/* CATEGORY NAME */}

              <Box>
                <Typography className="sai-edit-field-label">
                  CATEGORY NAME *
                </Typography>

                <TextField
                  fullWidth
                  placeholder="Enter category name"
                  value={form.name}
                  onChange={(e) =>
                    handleChange("name", e.target.value)
                  }
                  disabled={loading}
                  inputProps={{
                    maxLength: 80,
                  }}
                  sx={fieldSx}
                />
              </Box>

              {/* DESCRIPTION */}

              <Box>
                <Typography className="sai-edit-field-label">
                  DESCRIPTION *
                </Typography>

                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  placeholder="Write a short category description..."
                  value={form.description}
                  onChange={(e) =>
                    handleChange("description", e.target.value)
                  }
                  disabled={loading}
                  inputProps={{
                    maxLength: 500,
                  }}
                  sx={{
                    ...fieldSx,

                    "& .MuiOutlinedInput-root": {
                      ...fieldSx["& .MuiOutlinedInput-root"],
                      alignItems: "flex-start",
                    },
                  }}
                />

                <Typography
                  sx={{
                    mt: 0.7,
                    textAlign: "right",
                    fontSize: 10,
                    color: "#A1988B",
                  }}
                >
                  {form.description.length}/500
                </Typography>
              </Box>

              {/* STATUS */}

              <Box className="sai-edit-category-status">
                <Box>
                  <Typography
                    fontWeight={800}
                    fontSize={13}
                    color={DARK}
                  >
                    Active Category
                  </Typography>

                  <Typography
                    color="text.secondary"
                    fontSize={11}
                    sx={{ mt: 0.4 }}
                  >
                    Allow this category to be used in your store.
                  </Typography>
                </Box>

                <Switch
                  checked={form.status}
                  onChange={(e) =>
                    handleChange("status", e.target.checked)
                  }
                  disabled={loading}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: GOLD,
                    },

                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: GOLD,
                    },
                  }}
                />
              </Box>

            </Stack>
          </Box>

          <Divider sx={{ borderColor: "#F0EBE3" }} />

          {/* FOOTER */}

          <Box className="sai-edit-category-footer">
            <Button
              fullWidth
              variant="outlined"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button
              fullWidth
              variant="contained"
              onClick={handleSave}
              disabled={loading}
              startIcon={
                loading ? (
                  <CircularProgress
                    size={18}
                    color="inherit"
                  />
                ) : (
                  <SaveRounded />
                )
              }
              sx={{
                background: GOLD,

                "&:hover": {
                  background: "#9D7438",
                },
              }}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </Box>

        </Box>
      </Drawer>

      {/* ERROR NOTIFICATION */}

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={4000}
        onClose={() => setError("")}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}
