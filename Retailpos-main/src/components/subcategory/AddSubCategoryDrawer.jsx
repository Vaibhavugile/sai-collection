import { useEffect, useState } from "react";
import {
  Alert, Box, Button, CircularProgress, Divider, Drawer, IconButton,
  MenuItem, Snackbar, Stack, Switch, TextField, Typography,
} from "@mui/material";
import { CloseRounded, CloudUploadRounded, SaveRounded } from "@mui/icons-material";
import { motion } from "framer-motion";
import { addSubCategory, uploadSubCategoryImage } from "../../services/subCategoryService";
import { subscribeCategories } from "../../services/categoryService";

const initialForm = {
  categoryId: "",
  categoryName: "",
  name: "",
  description: "",
  status: true,
};

const GOLD = "#B58A45";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export default function AddSubCategoryDrawer({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeCategories(
      (list) => setCategories(Array.isArray(list) ? list : []),
      (err) => {
        console.error("Category subscription failed:", err);
        setError("Unable to load parent categories.");
      }
    );
    return typeof unsubscribe === "function" ? unsubscribe : undefined;
  }, []);

  useEffect(() => {
    return () => {
      if (image?.startsWith("blob:")) URL.revokeObjectURL(image);
    };
  }, [image]);

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

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please choose a JPG, PNG or WEBP image.");
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
    event.target.value = "";
  };

  const createSlug = (value) => value.trim().toLowerCase()
    .replace(/\s+/g, "-").replace(/[^\w-]+/g, "")
    .replace(/-+/g, "-").replace(/^-|-$/g, "");

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!form.categoryId) return setError("Please select a parent category.");
    if (!form.name.trim()) return setError("Subcategory name is required.");
    if (!form.description.trim()) return setError("Description is required.");

    const parent = categories.find((item) => item.id === form.categoryId);
    if (!parent) return setError("The selected parent category could not be found.");

    try {
      setLoading(true);
      let imageUrl = null;
      let imagePath = null;

      if (imageFile) {
        const uploaded = await uploadSubCategoryImage(imageFile);
        imageUrl = uploaded.imageUrl;
        imagePath = uploaded.imagePath;
      }

      await addSubCategory({
        categoryId: parent.id,
        categoryName: parent.name,
        name: form.name.trim(),
        slug: createSlug(form.name),
        description: form.description.trim(),
        image: imageUrl,
        imagePath,
        status: form.status,
        productCount: 0,
      });

      setSuccess("Subcategory created successfully.");
      await onSuccess?.();
      resetForm();
      onClose?.();
    } catch (err) {
      console.error("Add subcategory failed:", err);
      setError(err?.message || "Unable to save subcategory. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px", background: "#fff", fontSize: 13,
      "& fieldset": { borderColor: "#E9E2D7" },
      "&:hover fieldset": { borderColor: "#D8C39C" },
      "&.Mui-focused fieldset": { borderColor: GOLD },
    },
    "& .MuiInputLabel-root.Mui-focused": { color: GOLD },
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 480, md: 520 },
            maxWidth: "100%",
            borderRadius: { xs: 0, sm: "22px 0 0 22px" },
            background: "#FFFEFC",
          },
        }}
      >
        <Box className="sai-subcategory-drawer">
          <Box className="sai-subcategory-drawer-header">
            <Box>
              <Typography className="sai-subcategory-eyebrow">SAI COLLECTION · LATUR</Typography>
              <Typography className="sai-subcategory-drawer-title">Add Subcategory</Typography>
              <Typography className="sai-subcategory-drawer-subtitle">
                Create a subcategory under an existing category.
              </Typography>
            </Box>
            <IconButton onClick={handleClose} disabled={loading} aria-label="Close drawer">
              <CloseRounded />
            </IconButton>
          </Box>

          <Divider sx={{ borderColor: "#F0EBE3" }} />

          <Box className="sai-subcategory-drawer-body">
            <Stack spacing={2.6}>
              <Box>
                <Typography className="sai-subcategory-field-label">SUBCATEGORY IMAGE</Typography>
                <motion.label whileTap={{ scale: 0.99 }} className="sai-subcategory-image-upload">
                  {image ? (
                    <>
                      <img src={image} alt="Subcategory preview" />
                      <span className="sai-subcategory-image-change">Change image</span>
                    </>
                  ) : (
                    <Box className="sai-subcategory-image-placeholder">
                      <CloudUploadRounded />
                      <strong>Upload subcategory image</strong>
                      <span>JPG, PNG or WEBP · Maximum 5 MB · Optional</span>
                    </Box>
                  )}
                  <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImage} disabled={loading} />
                </motion.label>
                {imageFile && <Typography className="sai-subcategory-file-name">{imageFile.name}</Typography>}
              </Box>

              <TextField
                select fullWidth label="Parent category *"
                value={form.categoryId}
                onChange={(e) => {
                  const selected = categories.find((item) => item.id === e.target.value);
                  setForm((prev) => ({
                    ...prev,
                    categoryId: selected?.id || "",
                    categoryName: selected?.name || "",
                  }));
                }}
                disabled={loading}
                sx={fieldSx}
              >
                <MenuItem value="">Select parent category</MenuItem>
                {categories.filter((item) => item.status !== false).map((item) => (
                  <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
                ))}
              </TextField>

              <Box>
                <Typography className="sai-subcategory-field-label">SUBCATEGORY NAME *</Typography>
                <TextField
                  fullWidth placeholder="e.g. Kurtis, Sarees, Formal Shirts"
                  value={form.name} onChange={(e) => handleChange("name", e.target.value)}
                  disabled={loading} inputProps={{ maxLength: 80 }} sx={fieldSx}
                />
              </Box>

              <Box>
                <Typography className="sai-subcategory-field-label">DESCRIPTION *</Typography>
                <TextField
                  fullWidth multiline minRows={4}
                  placeholder="Write a short description for this subcategory..."
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  disabled={loading} inputProps={{ maxLength: 500 }} sx={fieldSx}
                />
                <Typography className="sai-subcategory-character-count">
                  {form.description.length}/500
                </Typography>
              </Box>

              <Box className="sai-subcategory-status-row">
                <Box>
                  <Typography className="sai-subcategory-status-title">Active subcategory</Typography>
                  <Typography className="sai-subcategory-status-caption">
                    Make this subcategory available in your store.
                  </Typography>
                </Box>
                <Switch
                  checked={form.status}
                  onChange={(e) => handleChange("status", e.target.checked)}
                  disabled={loading}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": { color: GOLD },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: GOLD },
                  }}
                />
              </Box>
            </Stack>
          </Box>

          <Divider sx={{ borderColor: "#F0EBE3" }} />

          <Box className="sai-subcategory-drawer-footer">
            <Button fullWidth variant="outlined" onClick={handleClose} disabled={loading}>Cancel</Button>
            <Button
              fullWidth variant="contained" onClick={handleSave} disabled={loading}
              startIcon={loading ? <CircularProgress size={17} color="inherit" /> : <SaveRounded />}
              sx={{ background: GOLD, "&:hover": { background: "#9D7438" } }}
            >
              {loading ? "Saving..." : "Save Subcategory"}
            </Button>
          </Box>
        </Box>
      </Drawer>

      <Snackbar open={Boolean(error)} autoHideDuration={4000} onClose={() => setError("")} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity="error" variant="filled" onClose={() => setError("")}>{error}</Alert>
      </Snackbar>
      <Snackbar open={Boolean(success)} autoHideDuration={3000} onClose={() => setSuccess("")} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity="success" variant="filled" onClose={() => setSuccess("")}>{success}</Alert>
      </Snackbar>
    </>
  );
}
