
import { useState } from "react";

import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Button,
  Alert,
  IconButton as MuiIconButton,
} from "@mui/material";

import {
  DeleteOutlineRounded,
  EditOutlined,
  Inventory2Outlined,
  CategoryOutlined,
  LockOutlined,
  VisibilityOutlined,
  VisibilityOffOutlined,
} from "@mui/icons-material";

const DELETE_PASSWORD = "Reddy@2002";

export default function CategoryTable({
  categories = [],
  onEdit,
  onDelete,
  onView,
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const openDeleteDialog = (category) => {
    setSelectedCategory(category);
    setPassword("");
    setPasswordError("");
    setShowPassword(false);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedCategory(null);
    setPassword("");
    setPasswordError("");
    setShowPassword(false);
  };

  const confirmDelete = () => {
    if (password !== DELETE_PASSWORD) {
      setPasswordError("Incorrect password. Please try again.");
      return;
    }

    if (selectedCategory) {
      onDelete?.(selectedCategory);
    }

    closeDeleteDialog();
  };

  return (
    <>
      <TableContainer
        component={Paper}
        elevation={0}
        className="sai-category-table-wrap"
      >
        <Table stickyHeader sx={{ minWidth: 720 }}>
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="center">Products</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id} hover>
                <TableCell>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    minWidth={190}
                  >
                    <Avatar
                      src={category.image || undefined}
                      variant="rounded"
                      className="sai-category-avatar"
                    >
                      {!category.image &&
                        (category.name?.charAt(0)?.toUpperCase() || (
                          <CategoryOutlined />
                        ))}
                    </Avatar>

                    <Box minWidth={0}>
                      <Typography className="sai-category-name">
                        {category.name || "Untitled category"}
                      </Typography>

                      <Typography className="sai-category-meta">
                        Sai Collection catalogue
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>

                <TableCell>
                  <Typography className="sai-category-description">
                    {category.description?.trim() || "No description added"}
                  </Typography>
                </TableCell>

                <TableCell align="center">
                  <Chip
                    icon={<Inventory2Outlined />}
                    label={`${Number(category.productCount) || 0} products`}
                    className="sai-category-count"
                  />
                </TableCell>

                <TableCell align="center">
                  <Chip
                    label={category.status ? "Active" : "Inactive"}
                    className={`sai-category-status ${
                      category.status ? "is-active" : "is-inactive"
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
                      <Tooltip title="View category">
                        <IconButton
                          aria-label="View category"
                          className="sai-table-action view"
                          onClick={() => onView(category)}
                        >
                          <CategoryOutlined />
                        </IconButton>
                      </Tooltip>
                    )}

                    <Tooltip title="Edit category">
                      <IconButton
                        aria-label={`Edit ${category.name || "category"}`}
                        className="sai-table-action edit"
                        onClick={() => onEdit?.(category)}
                      >
                        <EditOutlined />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete category">
                      <IconButton
                        aria-label={`Delete ${category.name || "category"}`}
                        className="sai-table-action delete"
                        onClick={() => openDeleteDialog(category)}
                      >
                        <DeleteOutlineRounded />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}

            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Box className="sai-category-empty">
                    <Box className="sai-category-empty-icon">
                      <CategoryOutlined />
                    </Box>

                    <Typography className="sai-category-empty-title">
                      No categories yet
                    </Typography>

                    <Typography className="sai-category-empty-copy">
                      Add your first category to start organising products
                      in Sai Collection.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* DELETE PASSWORD DIALOG */}

      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: "16px",
            padding: "8px",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            fontWeight: 750,
            fontSize: "18px",
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "12px",
              display: "grid",
              placeItems: "center",
              background: "#fff0ed",
              color: "#c45f51",
            }}
          >
            <LockOutlined />
          </Box>

          Confirm Category Deletion
        </DialogTitle>

        <DialogContent>
          <Typography
            sx={{
              fontSize: "13px",
              color: "#777",
              mb: 2,
              lineHeight: 1.7,
            }}
          >
            Enter your administrator password to delete
            {" "}
            <strong>{selectedCategory?.name}</strong>.
          </Typography>

          <TextField
            autoFocus
            fullWidth
            size="medium"
            type={showPassword ? "text" : "password"}
            label="Administrator Password"
            placeholder="Enter password"
            value={password}
            error={Boolean(passwordError)}
            helperText={passwordError}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                confirmDelete();
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlined fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <MuiIconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? (
                      <VisibilityOffOutlined />
                    ) : (
                      <VisibilityOutlined />
                    )}
                  </MuiIconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
              },
            }}
          />

          <Alert
            severity="warning"
            sx={{
              mt: 2,
              borderRadius: "9px",
              fontSize: "11px",
            }}
          >
            Make sure you have selected the correct category before
            continuing.
          </Alert>
        </DialogContent>

        <DialogActions sx={{ px: 2.5, pb: 2, gap: 1 }}>
          <Button
            onClick={closeDeleteDialog}
            variant="outlined"
            sx={{
              borderRadius: "9px",
              textTransform: "none",
              color: "#68645e",
              borderColor: "#dedbd4",
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={confirmDelete}
            disabled={!password.trim()}
            variant="contained"
            startIcon={<DeleteOutlineRounded />}
            sx={{
              borderRadius: "9px",
              textTransform: "none",
              background: "#bd6258",
              "&:hover": {
                background: "#a94d44",
              },
            }}
          >
            Verify & Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
