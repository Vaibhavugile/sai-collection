
import { useState } from "react";

import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  InputAdornment,
} from "@mui/material";

import {
  CategoryOutlined,
  DeleteOutlineRounded,
  EditOutlined,
  Inventory2Outlined,
  LockOutlined,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";

const DELETE_PASSWORD = "Reddy@2002";

export default function SubCategoryTable({
  subCategories = [],
  onEdit,
  onDelete,
  onView,
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const openDeleteDialog = (item) => {
    setSelectedSubCategory(item);
    setPassword("");
    setPasswordError("");
    setShowPassword(false);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    if (deleting) return;

    setDeleteDialogOpen(false);
    setSelectedSubCategory(null);
    setPassword("");
    setPasswordError("");
    setShowPassword(false);
  };

  const confirmDelete = async () => {
    if (password !== DELETE_PASSWORD) {
      setPasswordError("Incorrect password. Please try again.");
      return;
    }

    if (!selectedSubCategory || !onDelete) return;

    try {
      setDeleting(true);
      setPasswordError("");

      await onDelete(selectedSubCategory);

      setDeleteDialogOpen(false);
      setSelectedSubCategory(null);
      setPassword("");
    } catch (error) {
      console.error("Subcategory deletion failed:", error);
      setPasswordError(
        error?.message || "Unable to delete subcategory. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <TableContainer
        component={Paper}
        elevation={0}
        className="sai-subcategory-table-wrap"
      >
        <Table stickyHeader sx={{ minWidth: 850 }}>
          <TableHead>
            <TableRow>
              <TableCell>Subcategory</TableCell>
              <TableCell>Parent category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="center">Products</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {subCategories.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    minWidth={190}
                  >
                    <Avatar
                      src={item.image || undefined}
                      variant="rounded"
                      className="sai-subcategory-avatar"
                    >
                      {!item.image &&
                        (item.name?.charAt(0)?.toUpperCase() || (
                          <CategoryOutlined />
                        ))}
                    </Avatar>

                    <Box minWidth={0}>
                      <Typography className="sai-subcategory-name">
                        {item.name || "Untitled subcategory"}
                      </Typography>

                      <Typography className="sai-subcategory-meta">
                        ID: {item.id?.slice(0, 8) || "—"}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>

                <TableCell>
                  <Chip
                    icon={<CategoryOutlined />}
                    label={item.categoryName || "Unassigned"}
                    className="sai-subcategory-parent-chip"
                  />
                </TableCell>

                <TableCell>
                  <Typography className="sai-subcategory-description">
                    {item.description?.trim() || "No description added"}
                  </Typography>
                </TableCell>

                <TableCell align="center">
                  <Chip
                    icon={<Inventory2Outlined />}
                    label={`${Number(item.productCount) || 0} products`}
                    className="sai-subcategory-count"
                  />
                </TableCell>

                <TableCell align="center">
                  <Chip
                    label={item.status ? "Active" : "Inactive"}
                    className={`sai-subcategory-status ${
                      item.status ? "is-active" : "is-inactive"
                    }`}
                  />
                </TableCell>

                <TableCell align="right">
                  <Stack
                    direction="row"
                    spacing={0.5}
                    justifyContent="flex-end"
                  >
                    {onView && (
                      <Tooltip title="View subcategory">
                        <IconButton
                          aria-label="View subcategory"
                          className="sai-subcategory-action view"
                          onClick={() => onView(item)}
                        >
                          <CategoryOutlined />
                        </IconButton>
                      </Tooltip>
                    )}

                    <Tooltip title="Edit subcategory">
                      <IconButton
                        aria-label={`Edit ${item.name || "subcategory"}`}
                        className="sai-subcategory-action edit"
                        onClick={() => onEdit?.(item)}
                      >
                        <EditOutlined />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete subcategory">
                      <IconButton
                        aria-label={`Delete ${item.name || "subcategory"}`}
                        className="sai-subcategory-action delete"
                        onClick={() => openDeleteDialog(item)}
                      >
                        <DeleteOutlineRounded />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}

            {subCategories.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Box className="sai-subcategory-empty">
                    <Box className="sai-subcategory-empty-icon">
                      <CategoryOutlined />
                    </Box>

                    <Typography className="sai-subcategory-empty-title">
                      No subcategories found
                    </Typography>

                    <Typography className="sai-subcategory-empty-copy">
                      Add a subcategory under one of your parent categories
                      to organise your products.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: "18px",
            padding: "8px",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          Confirm subcategory deletion
        </DialogTitle>

        <DialogContent>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Enter the administrator password to delete this subcategory.
          </Typography>

          {selectedSubCategory && (
            <Box
              sx={{
                p: 1.5,
                mb: 2,
                borderRadius: 2,
                bgcolor: "#fff5f4",
                border: "1px solid #f3d4d1",
              }}
            >
              <Typography fontWeight={700} color="#a52d26">
                {selectedSubCategory.name || "Untitled subcategory"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                This action cannot be undone.
              </Typography>
            </Box>
          )}

          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Administrator password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !deleting) {
                confirmDelete();
              }
            }}
            error={Boolean(passwordError)}
            helperText={passwordError}
            disabled={deleting}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlined fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                    disabled={deleting}
                  >
                    {showPassword ? (
                      <VisibilityOff fontSize="small" />
                    ) : (
                      <Visibility fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
          <Button
            onClick={closeDeleteDialog}
            disabled={deleting}
            color="inherit"
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Cancel
          </Button>

          <Button
            onClick={confirmDelete}
            disabled={!password || deleting}
            variant="contained"
            color="error"
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "9px",
              minWidth: 115,
            }}
          >
            {deleting ? "Deleting..." : "Confirm Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
