
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";

import { Box, Button, Typography } from "@mui/material";

import Login from "../components/auth/Login";
import Signup from "../components/auth/Signup";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import RoleProtectedRoute from "../components/auth/RoleProtectedRoute";

import MainLayout from "../components/MainLayout/MainLayout";

import Dashboard from "../pages/Dashboard/Dashboard";
import Categories from "../pages/Categories/Categories";
import SubCategories from "../pages/Subcategories/SubCategories";

import AddProduct from "../pages/Products/AddProduct";
import ViewProduct from "../pages/Products/ViewProduct";
import EditProduct from "../pages/Products/EditProduct";
import ProductEditHistory from "../pages/Products/ProductEditHistory";

import InventoryDashboard from "../pages/Inventory/InventoryDashboard";
import BillingDashboard from "../pages/Billing/BillingDashboard";
import OrdersDashboard from "../pages/Orders/OrdersDashboard";
import FinanceDashboard from "../pages/Finance/FinanceDashboard";
import CustomersDashboard from "../pages/Customers/CustomersDashboard";
import VariantDefaults from "../pages/Variants/VariantDefaults";

import RolesPage from "../pages/Roles/RolesPage";

function AccessDenied() {
  return (
    <Box
      sx={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 2,
        p: 3,
      }}
    >
      <Typography
        sx={{
          fontSize: 48,
          color: "#b58b45",
          fontWeight: 800,
        }}
      >
        403
      </Typography>

      <Typography sx={{ fontSize: 21, fontWeight: 800 }}>
        Access Restricted
      </Typography>

      <Typography sx={{ color: "#938777", fontSize: 13 }}>
        You don't have permission to access this page.
        Please contact your administrator.
      </Typography>

      <Button
        component={Link}
        to="/dashboard"
        variant="contained"
        sx={{
          mt: 1,
          bgcolor: "#a77b2d",
          textTransform: "none",
          borderRadius: "9px",
          "&:hover": { bgcolor: "#89621f" },
        }}
      >
        Back to Dashboard
      </Button>
    </Box>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Login authentication */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>

            {/* Permission-independent access denied page */}
            <Route
              path="/access-denied"
              element={<AccessDenied />}
            />

            {/* Dashboard */}
            <Route element={<RoleProtectedRoute permission="dashboard" />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>

            {/* Product management */}
            <Route element={<RoleProtectedRoute permission="categories" />}>
              <Route path="/categories" element={<Categories />} />
            </Route>

            <Route element={<RoleProtectedRoute permission="subcategories" />}>
              <Route path="/subcategories" element={<SubCategories />} />
            </Route>

            <Route element={<RoleProtectedRoute permission="sizes" />}>
              <Route path="/sizes" element={<VariantDefaults />} />
            </Route>

            {/* Inventory and product pages */}
            <Route element={<RoleProtectedRoute permission="inventory" />}>
              <Route path="/inventory" element={<InventoryDashboard />} />
              <Route path="/addproduct" element={<AddProduct />} />
              <Route path="/products/view/:id" element={<ViewProduct />} />
              <Route path="/products/edit/:id" element={<EditProduct />} />
              <Route path="/products/:id/history" element={<ProductEditHistory />} />
            </Route>

            {/* Orders */}
            <Route element={<RoleProtectedRoute permission="orders" />}>
              <Route path="/orders" element={<OrdersDashboard />} />
            </Route>

            {/* Billing */}
            <Route element={<RoleProtectedRoute permission="billing" />}>
              <Route path="/billing" element={<BillingDashboard />} />
            </Route>

            {/* Customers */}
            <Route element={<RoleProtectedRoute permission="customers" />}>
              <Route path="/customers" element={<CustomersDashboard />} />
            </Route>

            {/* Reports */}
            <Route element={<RoleProtectedRoute permission="reports" />}>
              <Route path="/reports" element={<FinanceDashboard />} />
            </Route>

            {/* Admin-only role management */}
            <Route element={<RoleProtectedRoute adminOnly />}>
              <Route path="/roles" element={<RolesPage />} />
            </Route>

          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
