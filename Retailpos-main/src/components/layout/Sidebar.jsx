
import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase"; // Adjust path if needed

import {
  DashboardRounded,
  CategoryRounded,
  Inventory2Rounded,
  ShoppingCartRounded,
  ReceiptLongRounded,
  AssessmentRounded,
  PeopleRounded,
  StraightenRounded,
  StoreRounded,
  ChevronLeftRounded,
  CloseRounded,
  LogoutRounded,
} from "@mui/icons-material";

import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Divider,
  Tooltip,
} from "@mui/material";

import "./Sidebar.css";

const menus = [
  { title: "Dashboard", icon: <DashboardRounded />, path: "/dashboard" },
  { header: "PRODUCTS" },
  { title: "Categories", icon: <CategoryRounded />, path: "/categories" },
  { title: "Sub Categories", icon: <Inventory2Rounded />, path: "/subcategories" },
  { title: "Sizes", icon: <StraightenRounded />, path: "/sizes" },
  { title: "Products", icon: <StoreRounded />, path: "/inventory" },
  { header: "PURCHASE" },
  { title: "Orders", icon: <ShoppingCartRounded />, path: "/orders" },
  { header: "SALES" },
  { title: "Billing", icon: <ReceiptLongRounded />, path: "/billing" },
  { title: "Customers", icon: <PeopleRounded />, path: "/customers" },
  { header: "INSIGHTS" },
  { title: "Reports", icon: <AssessmentRounded />, path: "/reports" },
];

export default function Sidebar({
  open = false,
  onClose,
  onCollapseChange,
}) {
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      onCollapseChange?.(next);
      return next;
    });
  };

  const closeMobile = () => {
    onClose?.();
  };

  const handleSignOut = async () => {
    if (signingOut) return;

    try {
      setSigningOut(true);

      await signOut(auth);

      closeMobile();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Sign out failed:", error);
      window.alert("Unable to sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation"
        className={`sai-sidebar-backdrop ${open ? "visible" : ""}`}
        onClick={closeMobile}
        tabIndex={open ? 0 : -1}
      />

      <Box
        className={`sai-sidebar ${
          collapsed ? "is-collapsed" : ""
        } ${open ? "is-open" : ""}`}
      >
        <Box className="sai-sidebar-brand">
          <img
            src="/assets/sai-collection-logo.png"
            alt="Sai Collection logo"
            className="sai-sidebar-logo-image"
          />

          {!collapsed && (
            <Box className="sai-sidebar-brand-copy">
              <Typography className="sai-sidebar-brand-name">
                Sai Collection
              </Typography>
              <Typography className="sai-sidebar-brand-location">
                LATUR · MAHARASHTRA
              </Typography>
            </Box>
          )}

          <IconButton
            className="sai-sidebar-collapse"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={toggleCollapsed}
          >
            <ChevronLeftRounded />
          </IconButton>

          <IconButton
            className="sai-sidebar-mobile-close"
            aria-label="Close menu"
            onClick={closeMobile}
          >
            <CloseRounded />
          </IconButton>
        </Box>

        <Divider className="sai-sidebar-divider" />

        <Box className="sai-sidebar-store-tag">
          <span className="sai-sidebar-store-dot" />
          {!collapsed && <span>STORE WORKSPACE</span>}
        </Box>

        <List className="sai-sidebar-menu" disablePadding>
          {menus.map((item, index) => {
            if (item.header) {
              return !collapsed ? (
                <Typography
                  key={`${item.header}-${index}`}
                  className="sai-sidebar-section-label"
                >
                  {item.header}
                </Typography>
              ) : (
                <Box
                  key={`${item.header}-${index}`}
                  className="sai-sidebar-section-divider"
                />
              );
            }

            const link = (
              <ListItemButton
                component={NavLink}
                to={item.path}
                end={item.path === "/dashboard"}
                onClick={closeMobile}
                className={({ isActive }) =>
                  `sai-sidebar-item${isActive ? " active" : ""}`
                }
              >
                <ListItemIcon>{item.icon}</ListItemIcon>

                {!collapsed && <ListItemText primary={item.title} />}

                {!collapsed && item.path === "/dashboard" && (
                  <span className="sai-sidebar-active-dot" />
                )}
              </ListItemButton>
            );

            return (
              <Tooltip
                key={item.path}
                title={collapsed ? item.title : ""}
                placement="right"
                arrow
              >
                {link}
              </Tooltip>
            );
          })}
        </List>

        <Box className="sai-sidebar-footer">
          <img src="/assets/sai-collection-logo.png" alt="" />

          {!collapsed && (
            <Box className="sai-sidebar-footer-copy">
              <Typography className="sai-sidebar-footer-title">
                Sai Collection
              </Typography>
              <Typography className="sai-sidebar-footer-subtitle">
                Retail management
              </Typography>
            </Box>
          )}

          {!collapsed && (
            <span className="sai-sidebar-footer-version">v1.0</span>
          )}
        </Box>

        {/* SIGN OUT */}
        <Divider className="sai-sidebar-divider" />

        <Tooltip
          title={collapsed ? "Sign Out" : ""}
          placement="right"
          arrow
        >
          <ListItemButton
            className="sai-sidebar-signout"
            onClick={handleSignOut}
            disabled={signingOut}
            aria-label="Sign out"
          >
            <ListItemIcon>
              <LogoutRounded />
            </ListItemIcon>

            {!collapsed && (
              <ListItemText
                primary={signingOut ? "Signing out..." : "Sign Out"}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </Box>
    </>
  );
}
