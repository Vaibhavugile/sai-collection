import { Grid, Paper, Typography, Box } from "@mui/material";
import {
  CategoryRounded,
  CheckCircleRounded,
  Inventory2Rounded,
  BlockRounded,
} from "@mui/icons-material";
import { motion } from "framer-motion";

export default function CategoryStats({ categories = [] }) {
  const totalCategories = categories.length;
  const activeCategories = categories.filter((c) => c.status === true).length;
  const inactiveCategories = totalCategories - activeCategories;
  const totalProducts = categories.reduce(
    (total, category) => total + (Number(category.productCount) || 0),
    0
  );

  const stats = [
    { title: "Total Categories", value: totalCategories, subtitle: "Across your catalogue", icon: <CategoryRounded />, tone: "gold" },
    { title: "Active Categories", value: activeCategories, subtitle: "Available in your store", icon: <CheckCircleRounded />, tone: "green" },
    { title: "Inactive Categories", value: inactiveCategories, subtitle: "Currently disabled", icon: <BlockRounded />, tone: "rose" },
    { title: "Products", value: totalProducts, subtitle: "Assigned to categories", icon: <Inventory2Rounded />, tone: "sand" },
  ];

  return (
    <Grid container spacing={{ xs: 1.5, md: 2 }} sx={{ mb: { xs: 2.5, md: 3 } }}>
      {stats.map((item, index) => (
        <Grid item xs={6} md={3} key={item.title}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.28 }}
            whileHover={{ y: -3 }}
            style={{ height: "100%" }}
          >
            <Paper elevation={0} className={`sai-category-stat ${item.tone}`}>
              <Box className="sai-category-stat-top">
                <Typography className="sai-category-stat-label">{item.title}</Typography>
                <Box className="sai-category-stat-icon">{item.icon}</Box>
              </Box>
              <Typography className="sai-category-stat-value">{item.value.toLocaleString("en-IN")}</Typography>
              <Typography className="sai-category-stat-subtitle">{item.subtitle}</Typography>
            </Paper>
          </motion.div>
        </Grid>
      ))}
    </Grid>
  );
}
