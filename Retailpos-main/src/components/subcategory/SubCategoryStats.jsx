import { Grid, Paper, Typography, Box } from "@mui/material";
import {
  CategoryRounded, CheckCircleRounded, Inventory2Rounded, BlockRounded,
} from "@mui/icons-material";
import { motion } from "framer-motion";

export default function SubCategoryStats({ subCategories = [] }) {
  const total = subCategories.length;
  const active = subCategories.filter((item) => item.status === true).length;
  const inactive = total - active;
  const products = subCategories.reduce(
    (sum, item) => sum + (Number(item.productCount) || 0), 0
  );

  const stats = [
    { title: "Total Subcategories", value: total, subtitle: "Across your catalogue", icon: <CategoryRounded />, tone: "gold" },
    { title: "Active Subcategories", value: active, subtitle: "Available in your store", icon: <CheckCircleRounded />, tone: "green" },
    { title: "Inactive Subcategories", value: inactive, subtitle: "Currently disabled", icon: <BlockRounded />, tone: "rose" },
    { title: "Products", value: products, subtitle: "Assigned to subcategories", icon: <Inventory2Rounded />, tone: "sand" },
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
            <Paper elevation={0} className={`sai-subcategory-stat ${item.tone}`}>
              <Box className="sai-subcategory-stat-top">
                <Typography className="sai-subcategory-stat-label">{item.title}</Typography>
                <Box className="sai-subcategory-stat-icon">{item.icon}</Box>
              </Box>
              <Typography className="sai-subcategory-stat-value">
                {item.value.toLocaleString("en-IN")}
              </Typography>
              <Typography className="sai-subcategory-stat-subtitle">{item.subtitle}</Typography>
            </Paper>
          </motion.div>
        </Grid>
      ))}
    </Grid>
  );
}
