import {
  Avatar, Box, Chip, IconButton, Paper, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography,
} from "@mui/material";
import {
  DeleteOutlineRounded, EditOutlined, Inventory2Outlined, CategoryOutlined,
} from "@mui/icons-material";

export default function CategoryTable({ categories = [], onEdit, onDelete, onView }) {
  return (
    <TableContainer component={Paper} elevation={0} className="sai-category-table-wrap">
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
                <Stack direction="row" spacing={1.5} alignItems="center" minWidth={190}>
                  <Avatar src={category.image || undefined} variant="rounded" className="sai-category-avatar">
                    {!category.image && (category.name?.charAt(0)?.toUpperCase() || <CategoryOutlined />)}
                  </Avatar>
                  <Box minWidth={0}>
                    <Typography className="sai-category-name">{category.name || "Untitled category"}</Typography>
                    <Typography className="sai-category-meta">Sai Collection catalogue</Typography>
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
                  className={`sai-category-status ${category.status ? "is-active" : "is-inactive"}`}
                />
              </TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                  {onView && (
                    <Tooltip title="View category">
                      <IconButton aria-label="View category" className="sai-table-action view" onClick={() => onView(category)}>
                        <CategoryOutlined />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Edit category">
                    <IconButton aria-label={`Edit ${category.name || "category"}`} className="sai-table-action edit" onClick={() => onEdit?.(category)}>
                      <EditOutlined />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete category">
                    <IconButton aria-label={`Delete ${category.name || "category"}`} className="sai-table-action delete" onClick={() => onDelete?.(category)}>
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
                  <Box className="sai-category-empty-icon"><CategoryOutlined /></Box>
                  <Typography className="sai-category-empty-title">No categories yet</Typography>
                  <Typography className="sai-category-empty-copy">
                    Add your first category to start organising products in Sai Collection.
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
