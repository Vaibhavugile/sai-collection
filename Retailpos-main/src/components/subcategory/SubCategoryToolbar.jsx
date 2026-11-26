import { Box, Button, InputAdornment, MenuItem, Paper, TextField, Typography } from "@mui/material";
import { AddRounded, CategoryRounded, FilterListRounded, SearchRounded, SortRounded } from "@mui/icons-material";
import { motion } from "framer-motion";

export default function SubCategoryToolbar({
  search = "", setSearch,
  category = "all", setCategory,
  categories = [],
  status = "all", setStatus,
  sort = "latest", setSort,
  onAdd,
}) {
  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      minHeight: 44, borderRadius: "11px", background: "#fffefa",
      fontSize: 12, color: "#514331",
      "& fieldset": { borderColor: "#EEE6D8" },
      "&:hover fieldset": { borderColor: "#D9C69E" },
      "&.Mui-focused fieldset": { borderColor: "#BD8B2D", borderWidth: 1 },
    },
  };

  return (
    <Paper elevation={0} className="sai-subcategory-toolbar">
      <Box className="sai-subcategory-toolbar-top">
        <Box>
          <Typography className="sai-subcategory-toolbar-title">Subcategory directory</Typography>
          <Typography className="sai-subcategory-toolbar-caption">
            Search, filter and organise your product subcategories.
          </Typography>
        </Box>
        <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={onAdd} variant="contained" startIcon={<AddRounded />} className="sai-subcategory-add-button">
            Add subcategory
          </Button>
        </motion.div>
      </Box>

      <Box className="sai-subcategory-toolbar-controls">
        <TextField
          fullWidth placeholder="Search subcategory name or description..."
          value={search} onChange={(e) => setSearch?.(e.target.value)}
          sx={{ ...fieldSx, flex: "1 1 240px", minWidth: 0 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded /></InputAdornment> }}
        />
        <TextField
          select value={category} onChange={(e) => setCategory?.(e.target.value)}
          sx={{ ...fieldSx, width: { xs: "calc(50% - 5px)", sm: 180 }, flex: "0 0 auto" }}
          InputProps={{ startAdornment: <InputAdornment position="start"><CategoryRounded /></InputAdornment> }}
        >
          <MenuItem value="all">All categories</MenuItem>
          {categories.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
        </TextField>
        <TextField
          select value={status} onChange={(e) => setStatus?.(e.target.value)}
          sx={{ ...fieldSx, width: { xs: "calc(50% - 5px)", sm: 145 }, flex: "0 0 auto" }}
          InputProps={{ startAdornment: <InputAdornment position="start"><FilterListRounded /></InputAdornment> }}
        >
          <MenuItem value="all">All status</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </TextField>
        <TextField
          select value={sort} onChange={(e) => setSort?.(e.target.value)}
          sx={{ ...fieldSx, width: { xs: "100%", sm: 135 }, flex: "0 0 auto" }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SortRounded /></InputAdornment> }}
        >
          <MenuItem value="latest">Latest</MenuItem>
          <MenuItem value="oldest">Oldest</MenuItem>
          <MenuItem value="az">Name: A–Z</MenuItem>
          <MenuItem value="za">Name: Z–A</MenuItem>
        </TextField>
      </Box>

      <Box className="sai-subcategory-toolbar-foot">
        <Typography>{search ? `Search results for “${search}”` : "Showing your subcategory catalogue"}</Typography>
        <Typography className="sai-subcategory-toolbar-brand">SAI COLLECTION · LATUR</Typography>
      </Box>
    </Paper>
  );
}
