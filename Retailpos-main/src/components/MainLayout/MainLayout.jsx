
import { useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";

import "./MainLayout.css";

const PAGE_META = [
  { match: "/dashboard", title: "Dashboard", subtitle: "Your store at a glance" },
  { match: "/categories", title: "Categories", subtitle: "Organise your product catalogue" },
  { match: "/subcategories", title: "Sub Categories", subtitle: "Keep your catalogue structured" },
  { match: "/brands", title: "Brands", subtitle: "Manage the brands in your store" },
  { match: "/colors", title: "Colours", subtitle: "Manage product colour options" },
  { match: "/sizes", title: "Sizes", subtitle: "Manage clothing sizes and variants" },
  { match: "/inventory", title: "Products", subtitle: "Manage your products and stock" },
  { match: "/orders", title: "Orders", subtitle: "Review and manage store orders" },
  { match: "/customers", title: "Customers", subtitle: "Manage customer relationships and purchase history" },
  { match: "/billing", title: "Billing", subtitle: "Create bills and manage transactions" },
  { match: "/reports", title: "Reports", subtitle: "Understand your store performance" },
  { match: "/users", title: "Users", subtitle: "Manage your team and permissions" },
  { match: "/settings", title: "Settings", subtitle: "Configure your store experience" },
];

export default function MainLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const page = useMemo(() => {
    const match = PAGE_META.find((item) =>
      location.pathname === item.match ||
      location.pathname.startsWith(`${item.match}/`)
    );

    return match || {
      title: "Sai Collection",
      subtitle: "Store management workspace",
    };
  }, [location.pathname]);

  // Close the mobile drawer after navigating to another page.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent the page behind the drawer from scrolling on mobile.
  useEffect(() => {
    if (!mobileOpen) return undefined;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  return (
    <Box
      className={`sai-layout ${
        sidebarCollapsed ? "sidebar-is-collapsed" : ""
      }`}
    >
      <Sidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onCollapseChange={setSidebarCollapsed}
      />

      <Box className="sai-main-content">
        <Topbar
          title={page.title}
          subtitle={page.subtitle}
          onMenuClick={() => setMobileOpen(true)}
        />

        <Box component="main" className="sai-page-content">
          <div className="sai-page-content-inner">
            <Outlet />
          </div>
        </Box>

        <footer className="sai-layout-footer">
          <span>© {new Date().getFullYear()} Sai Collection, Latur</span>
          <span>Retail management, made simpler.</span>
        </footer>
      </Box>
    </Box>
  );
}
