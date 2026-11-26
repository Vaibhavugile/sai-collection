import "./InventoryStats.css";
import {
  Inventory2Rounded,
  WarehouseRounded,
  WarningAmberRounded,
  RemoveShoppingCartRounded,
} from "@mui/icons-material";
import { motion } from "framer-motion";

export default function InventoryStats({ products = [] }) {
  const safeProducts = Array.isArray(products) ? products : [];

  const totalProducts = safeProducts.length;

  const totalStock = safeProducts.reduce(
    (sum, product) => sum + Math.max(0, Number(product.totalStock) || 0),
    0
  );

  const lowStock = safeProducts.filter((product) => {
    const stock = Number(product.totalStock) || 0;
    return stock > 0 && stock <= 5;
  }).length;

  const outOfStock = safeProducts.filter(
    (product) => (Number(product.totalStock) || 0) <= 0
  ).length;

  const stats = [
    {
      title: "Total Products",
      value: totalProducts,
      subtitle: "Products in your catalogue",
      icon: <Inventory2Rounded />,
      tone: "gold",
    },
    {
      title: "Total Stock",
      value: totalStock,
      subtitle: "Units currently available",
      icon: <WarehouseRounded />,
      tone: "sand",
    },
    {
      title: "Low Stock",
      value: lowStock,
      subtitle: "Products with 1–5 units",
      icon: <WarningAmberRounded />,
      tone: "amber",
    },
    {
      title: "Out of Stock",
      value: outOfStock,
      subtitle: "Products needing restock",
      icon: <RemoveShoppingCartRounded />,
      tone: "rose",
    },
  ];

  return (
    <section className="inventory-stats" aria-label="Inventory overview">
      {stats.map((item, index) => (
        <motion.article
          key={item.title}
          className={`stat-card ${item.tone}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: index * 0.06 }}
          whileHover={{ y: -3 }}
        >
          <div className="stat-card-top">
            <span className="stat-title">{item.title}</span>
            <span className="stat-icon">{item.icon}</span>
          </div>

          <div className="stat-info">
            <h2>{item.value.toLocaleString("en-IN")}</h2>
            <span className="stat-subtitle">{item.subtitle}</span>
          </div>
        </motion.article>
      ))}
    </section>
  );
}
