import {
  Box, Button, InputAdornment, MenuItem, Paper, TextField, Typography,
} from "@mui/material";
import {
  AddRounded, FilterListRounded, SearchRounded, SortRounded,
} from "@mui/icons-material";

export default function CategoryToolbar({
  search = "", setSearch, status = "all", setStatus,
  sort = "latest", setSort, onAdd,
}) {
  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      minHeight: 46, borderRadius: "11px", background: "#fffefa",
      fontSize: 12, color: "#514331",
      "& fieldset": { borderColor: "#eee6d8" },
      "&:hover fieldset": { borderColor: "#d9c69e" },
      "&.Mui-focused fieldset": { borderColor: "#bd8b2d", borderWidth: 1 },
    },
  };

  return (
    <Paper elevation={0} className="sai-category-toolbar">
      <Box className="sai-category-toolbar-top">
        <Box className="sai-category-toolbar-heading">
          <Typography className="sai-category-toolbar-title">Category directory</Typography>
          <Typography className="sai-category-toolbar-caption">Search, filter and organise your product categories.</Typography>
        </Box>
        <Button onClick={onAdd} variant="contained" startIcon={<AddRounded />} className="sai-category-add-button">
          Add category
        </Button>
      </Box>

      <Box className="sai-category-toolbar-controls">
        <TextField
          fullWidth
          placeholder="Search category name or description..."
          value={search}
          onChange={(e) => setSearch?.(e.target.value)}
          sx={{ ...fieldSx, flex: "1 1 260px", minWidth: 0 }}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start"><SearchRounded /></InputAdornment> }
          }}
        />
        <TextField
          select
          value={status}
          onChange={(e) => setStatus?.(e.target.value)}
          sx={{ ...fieldSx, width: { xs: "calc(50% - 6px)", sm: 155 }, flex: "0 0 auto" }}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start"><FilterListRounded /></InputAdornment> }
          }}
        >
          <MenuItem value="all">All status</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </TextField>
        <TextField
          select
          value={sort}
          onChange={(e) => setSort?.(e.target.value)}
          sx={{ ...fieldSx, width: { xs: "calc(50% - 6px)", sm: 145 }, flex: "0 0 auto" }}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start"><SortRounded /></InputAdornment> }
          }}
        >
          <MenuItem value="latest">Latest</MenuItem>
          <MenuItem value="oldest">Oldest</MenuItem>
          <MenuItem value="az">Name: A–Z</MenuItem>
          <MenuItem value="za">Name: Z–A</MenuItem>
        </TextField>
      </Box>

      <Box className="sai-category-toolbar-foot">
        <Typography>{search ? `Search results for “${search}”` : "Showing your category catalogue"}</Typography>
        <Typography className="sai-category-toolbar-brand">SAI COLLECTION · LATUR</Typography>
      </Box>
    </Paper>
  );
}
