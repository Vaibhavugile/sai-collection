
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
  ImageRounded,
} from "@mui/icons-material";

import { motion } from "framer-motion";

import {
  addCategory,
  uploadCategoryImage,
} from "../../services/categoryService";

const initialForm = {
  name: "",
  description: "",
  status: true,
};

const GOLD = "#B58A45";
const DARK = "#29251F";

export default function AddCategoryDrawer({
  open,
  onClose,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    return () => {
      if (image?.startsWith("blob:")) {
        URL.revokeObjectURL(image);
      }
    };
  }, [image]);

  const handleChange = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleImage = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5 MB.");
      event.target.value = "";
      return;
    }

    setError("");

    setImageFile(file);
    setImage(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setForm(initialForm);
    setImage(null);
    setImageFile(null);
    setError("");
    setSuccess("");
  };

  const handleClose = () => {
    if (loading) return;

    resetForm();
    onClose?.();
  };

  const createSlug = (value) =>
    value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/-+/g, "-");

  const handleSaveCategory = async () => {
    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Category name is required.");
      return;
    }

    if (!form.description.trim()) {
      setError("Category description is required.");
      return;
    }

    try {
      setLoading(true);

      let imageUrl = null;
      let imagePath = null;

      if (imageFile) {
        const uploadResult =
          await uploadCategoryImage(imageFile);

        imageUrl = uploadResult.imageUrl;
        imagePath = uploadResult.imagePath;
      }

      const slug = createSlug(form.name);

      await addCategory({
        name: form.name.trim(),
        slug,
        description: form.description.trim(),
        image: imageUrl,
        imagePath,
        status: form.status,
        productCount: 0,
      });

      setSuccess("Category added successfully.");

      await onSuccess?.();

      resetForm();
      onClose?.();
    } catch (err) {
      console.error("Add category error:", err);

      setError(
        err.message ||
          "Something went wrong while adding the category."
      );
    } finally {
      setLoading(false);
    }
  };

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
              sm: "24px 0 0 24px",
            },
            background: "#FFFEFC",
          },
        }}
      >
        <Box
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* HEADER */}
          <Box
            sx={{
              px: { xs: 2.5, sm: 3.5 },
              py: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                  color: GOLD,
                  mb: 0.7,
                }}
              >
                STORE MANAGEMENT
              </Typography>

              <Typography
                sx={{
                  fontSize: 25,
                  fontWeight: 800,
                  color: DARK,
                  letterSpacing: "-0.7px",
                }}
              >
                Add Category
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,
                  fontSize: 13,
                  color: "#8B847A",
                }}
              >
                Create a new product category.
              </Typography>
            </Box>

            <IconButton
              onClick={handleClose}
              disabled={loading}
              sx={{
                width: 42,
                height: 42,
                border: "1px solid #EEE8DD",
                color: DARK,
              }}
            >
              <CloseRounded />
            </IconButton>
          </Box>

          <Divider sx={{ borderColor: "#F0EBE3" }} />

          {/* FORM CONTENT */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              px: { xs: 2.5, sm: 3.5 },
              py: 3,
            }}
          >
            <Stack spacing={3}>
              {/* IMAGE UPLOAD */}
              <Box>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 750,
                    color: DARK,
                    mb: 1.3,
                  }}
                >
                  Category Image
                </Typography>

                <motion.label
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  style={{ display: "block", cursor: "pointer" }}
                >
                  <Box
                    sx={{
                      height: 220,
                      border: "1.5px dashed #D8C7A9",
                      borderRadius: "18px",
                      background: "#FAF7F0",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      transition: "0.2s",
                      "&:hover": {
                        borderColor: GOLD,
                        background: "#F8F3E9",
                      },
                    }}
                  >
                    {image ? (
                      <>
                        <Box
                          component="img"
                          src={image}
                          alt="Category preview"
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />

                        <Box
                          sx={{
                            position: "absolute",
                            bottom: 12,
                            right: 12,
                            px: 1.5,
                            py: 0.8,
                            borderRadius: 2,
                            background: "rgba(35,30,24,0.8)",
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          Change Image
                        </Box>
                      </>
                    ) : (
                      <Box textAlign="center" px={2}>
                        <Box
                          sx={{
                            width: 62,
                            height: 62,
                            borderRadius: "18px",
                            background: "#F0E5D1",
                            display: "grid",
                            placeItems: "center",
                            mx: "auto",
                            mb: 2,
                          }}
                        >
                          <CloudUploadRounded
                            sx={{
                              fontSize: 30,
                              color: GOLD,
                            }}
                          />
                        </Box>

                        <Typography
                          fontWeight={800}
                          color={DARK}
                        >
                          Upload category image
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.7,
                            fontSize: 12,
                            color: "#91897E",
                          }}
                        >
                          JPG, PNG or WEBP · Maximum 5 MB
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <input
                    hidden
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImage}
                  />
                </motion.label>
              </Box>

              {/* CATEGORY NAME */}
              <Box>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 750,
                    color: DARK,
                    mb: 1,
                  }}
                >
                  Category Name *
                </Typography>

                <TextField
                  fullWidth
                  placeholder="e.g. Men's Clothing"
                  value={form.name}
                  onChange={(event) =>
                    handleChange("name", event.target.value)
                  }
                  disabled={loading}
                  inputProps={{ maxLength: 80 }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px",
                      background: "#fff",
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#E9E2D7",
                    },
                    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: GOLD,
                    },
                  }}
                />
              </Box>

              {/* DESCRIPTION */}
              <Box>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 750,
                    color: DARK,
                    mb: 1,
                  }}
                >
                  Description *
                </Typography>

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Write a short description for this category..."
                  value={form.description}
                  onChange={(event) =>
                    handleChange(
                      "description",
                      event.target.value
                    )
                  }
                  disabled={loading}
                  inputProps={{ maxLength: 500 }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px",
                      background: "#fff",
                      alignItems: "flex-start",
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#E9E2D7",
                    },
                    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: GOLD,
                    },
                  }}
                />

                <Typography
                  sx={{
                    mt: 0.7,
                    textAlign: "right",
                    fontSize: 11,
                    color: "#9A9287",
                  }}
                >
                  {form.description.length}/500
                </Typography>
              </Box>

              {/* STATUS */}
              <Box
                sx={{
                  p: 2,
                  border: "1px solid #EEE7DB",
                  borderRadius: "14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#FFFDF9",
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: DARK,
                    }}
                  >
                    Active Category
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.4,
                      fontSize: 11,
                      color: "#91897E",
                    }}
                  >
                    Make this category available in your store.
                  </Typography>
                </Box>

                <Switch
                  checked={form.status}
                  onChange={(event) =>
                    handleChange(
                      "status",
                      event.target.checked
                    )
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
          <Box
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              display: "flex",
              gap: 1.5,
              background: "#FFFEFC",
            }}
          >
            <Button
              fullWidth
              variant="outlined"
              onClick={handleClose}
              disabled={loading}
              sx={{
                height: 48,
                borderRadius: "12px",
                borderColor: "#E6DED1",
                color: "#6D655A",
                fontWeight: 750,
                textTransform: "none",
                "&:hover": {
                  borderColor: GOLD,
                  background: "#FAF7F0",
                },
              }}
            >
              Cancel
            </Button>

            <Button
              fullWidth
              variant="contained"
              onClick={handleSaveCategory}
              disabled={loading}
              startIcon={
                loading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <SaveRounded />
                )
              }
              sx={{
                height: 48,
                borderRadius: "12px",
                background: GOLD,
                color: "#fff",
                fontWeight: 800,
                textTransform: "none",
                boxShadow: "0 7px 18px rgba(181,138,69,0.2)",
                "&:hover": {
                  background: "#9D7438",
                },
              }}
            >
              {loading ? "Saving..." : "Save Category"}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* NOTIFICATIONS */}
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

      <Snackbar
        open={Boolean(success)}
        autoHideDuration={3000}
        onClose={() => setSuccess("")}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setSuccess("")}
        >
          {success}
        </Alert>
      </Snackbar>
    </>
  );
}
