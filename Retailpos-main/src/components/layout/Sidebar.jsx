
import { useEffect, useMemo, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";

import { auth, db } from "../../firebase";

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
  AdminPanelSettingsRounded,
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
  CircularProgress,
} from "@mui/material";

import "./Sidebar.css";

const ALL_MENUS = [
  {
    title: "Dashboard",
    icon: <DashboardRounded />,
    path: "/dashboard",
    permission: "dashboard",
  },
  { header: "PRODUCTS" },
  {
    title: "Categories",
    icon: <CategoryRounded />,
    path: "/categories",
    permission: "categories",
  },
  {
    title: "Sub Categories",
    icon: <Inventory2Rounded />,
    path: "/subcategories",
    permission: "subcategories",
  },
  {
    title: "Sizes",
    icon: <StraightenRounded />,
    path: "/sizes",
    permission: "sizes",
  },
  {
    title: "Products",
    icon: <StoreRounded />,
    path: "/inventory",
    permission: "inventory",
  },
  { header: "PURCHASE" },
  {
    title: "Orders",
    icon: <ShoppingCartRounded />,
    path: "/orders",
    permission: "orders",
  },
  { header: "SALES" },
  {
    title: "Billing",
    icon: <ReceiptLongRounded />,
    path: "/billing",
    permission: "billing",
  },
  {
    title: "Customers",
    icon: <PeopleRounded />,
    path: "/customers",
    permission: "customers",
  },
  { header: "INSIGHTS" },
  {
    title: "Reports",
    icon: <AssessmentRounded />,
    path: "/reports",
    permission: "reports",
  },
];

export default function Sidebar({
  open = false,
  onClose,
  onCollapseChange,
}) {
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [profileLoading, setProfileLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Load the logged-in user's role and permissions.
  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;

      setProfileLoading(true);
      setUserRole("");
      setPermissions([]);
      setIsAdmin(false);

      if (!user) {
        setProfileLoading(false);
        return;
      }

      try {
        const profileSnapshot = await getDoc(doc(db, "users", user.uid));

        if (!profileSnapshot.exists()) {
          if (mounted) setProfileLoading(false);
          return;
        }

        const profile = profileSnapshot.data();

        if (profile.status !== "active") {
          if (mounted) setProfileLoading(false);
          return;
        }

        const roleName = String(profile.role || "").trim().toLowerCase();

        // Admin gets full access.
        if (roleName === "admin") {
          if (mounted) {
            setUserRole("Admin");
            setIsAdmin(true);
            setPermissions(ALL_MENUS.filter((item) => item.permission).map((item) => item.permission));
          }
          return;
        }

        let roleData = null;

        // Preferred method: use the assigned Firestore role document ID.
        if (profile.roleId) {
          const roleSnapshot = await getDoc(
            doc(db, "roles", profile.roleId)
          );

          if (roleSnapshot.exists()) {
            roleData = roleSnapshot.data();
          }
        } else if (roleName) {
          // Backward compatibility with existing Signup role values.
          const rolesSnapshot = await getDocs(collection(db, "roles"));

          roleData = rolesSnapshot.docs
            .map((roleDoc) => roleDoc.data())
            .find(
              (role) =>
                String(role.name || "").trim().toLowerCase() === roleName
            );
        }

        if (mounted && roleData && roleData.status === "active") {
          setUserRole(roleData.name || profile.role || "");
          setPermissions(
            Array.isArray(roleData.permissions)
              ? roleData.permissions
              : []
          );
        }
      } catch (error) {
        console.error("Unable to load sidebar permissions:", error);
      } finally {
        if (mounted) setProfileLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Build visible menu and retain section headings only when needed.
  const visibleMenus = useMemo(() => {
    const permittedItems = ALL_MENUS.filter(
      (item) => item.permission && permissions.includes(item.permission)
    );

    const permittedPaths = new Set(
      permittedItems.map((item) => item.path)
    );

    const result = [];

    ALL_MENUS.forEach((item) => {
      if (item.header) {
        const headerIndex = ALL_MENUS.indexOf(item);

        const nextHeaderIndex = ALL_MENUS.findIndex(
          (entry, index) => index > headerIndex && entry.header
        );

        const endIndex =
          nextHeaderIndex === -1 ? ALL_MENUS.length : nextHeaderIndex;

        const hasVisibleItem = ALL_MENUS
          .slice(headerIndex + 1, endIndex)
          .some((entry) => permittedPaths.has(entry.path));

        if (hasVisibleItem) result.push(item);
        return;
      }

      if (permittedPaths.has(item.path)) {
        result.push(item);
      }
    });

    // Roles management is reserved for admin.
    if (isAdmin) {
      result.push({ header: "ADMINISTRATION" });
      result.push({
        title: "Roles & Permissions",
        icon: <AdminPanelSettingsRounded />,
        path: "/roles",
      });
    }

    return result;
  }, [permissions, isAdmin]);

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
          {profileLoading ? (
            <Box className="sai-sidebar-permission-loading">
              <CircularProgress size={19} />
              {!collapsed && (
                <Typography>Loading permissions...</Typography>
              )}
            </Box>
          ) : (
            <>
              {visibleMenus.map((item, index) => {
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

                    {!collapsed && (
                      <ListItemText primary={item.title} />
                    )}

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

              {!visibleMenus.length && (
                <Typography className="sai-sidebar-no-access">
                  {collapsed ? "!" : "No sidebar permissions assigned"}
                </Typography>
              )}
            </>
          )}
        </List>

        <Box className="sai-sidebar-footer">
          <img src="/assets/sai-collection-logo.png" alt="" />

          {!collapsed && (
            <Box className="sai-sidebar-footer-copy">
              <Typography className="sai-sidebar-footer-title">
                Sai Collection
              </Typography>
              <Typography className="sai-sidebar-footer-subtitle">
                {userRole || "Retail management"}
              </Typography>
            </Box>
          )}

          {!collapsed && (
            <span className="sai-sidebar-footer-version">v1.0</span>
          )}
        </Box>

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
