import {
  Avatar, Box, Chip, IconButton, Paper, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography,
} from "@mui/material";
import { CategoryOutlined, DeleteOutlineRounded, EditOutlined, Inventory2Outlined } from "@mui/icons-material";

export default function SubCategoryTable({ subCategories = [], onEdit, onDelete, onView }) {
  return (
    <TableContainer component={Paper} elevation={0} className="sai-subcategory-table-wrap">
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
                <Stack direction="row" spacing={1.5} alignItems="center" minWidth={190}>
                  <Avatar src={item.image || undefined} variant="rounded" className="sai-subcategory-avatar">
                    {!item.image && (item.name?.charAt(0)?.toUpperCase() || <CategoryOutlined />)}
                  </Avatar>
                  <Box minWidth={0}>
                    <Typography className="sai-subcategory-name">{item.name || "Untitled subcategory"}</Typography>
                    <Typography className="sai-subcategory-meta">ID: {item.id?.slice(0, 8) || "—"}</Typography>
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
                  className={`sai-subcategory-status ${item.status ? "is-active" : "is-inactive"}`}
                />
              </TableCell>

              <TableCell align="right">
                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                  {onView && (
                    <Tooltip title="View subcategory">
                      <IconButton aria-label="View subcategory" className="sai-subcategory-action view" onClick={() => onView(item)}>
                        <CategoryOutlined />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Edit subcategory">
                    <IconButton aria-label={`Edit ${item.name || "subcategory"}`} className="sai-subcategory-action edit" onClick={() => onEdit?.(item)}>
                      <EditOutlined />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete subcategory">
                    <IconButton aria-label={`Delete ${item.name || "subcategory"}`} className="sai-subcategory-action delete" onClick={() => onDelete?.(item)}>
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
                  <Box className="sai-subcategory-empty-icon"><CategoryOutlined /></Box>
                  <Typography className="sai-subcategory-empty-title">No subcategories found</Typography>
                  <Typography className="sai-subcategory-empty-copy">
                    Add a subcategory under one of your parent categories to organise your products.
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
