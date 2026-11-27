
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";

import { auth, db } from "../../firebase";

import {
  NotificationsNoneRounded,
  KeyboardArrowDownRounded,
  Inventory2Outlined,
  CategoryOutlined,
  LocalOfferOutlined,
  PaletteOutlined,
  StraightenRounded,
  ShoppingBagOutlined,
  ShoppingCartOutlined,
  ReceiptLongOutlined,
  AssessmentOutlined,
  GroupsOutlined,
  SettingsOutlined,
  AddRounded,
  ArrowForwardRounded,
  WarehouseOutlined,
  HistoryRounded,
  CheckCircleOutlineRounded,
  StorefrontRounded,
  QrCode2Rounded,
  BusinessCenterOutlined,
} from "@mui/icons-material";

import CircularProgress from "@mui/material/CircularProgress";
import "./Dashboard.css";

const managementItems = [
  {
    title: "Categories",
    description: "Organise your products into clear collections.",
    action: "Manage categories",
    path: "/categories",
    permission: "categories",
    Icon: CategoryOutlined,
    tone: "gold",
  },
  {
    title: "Sub categories",
    description: "Keep every product group structured.",
    action: "Manage sub categories",
    path: "/subcategories",
    permission: "subcategories",
    Icon: BusinessCenterOutlined,
    tone: "rose",
  },
  {
    title: "Brands",
    description: "Manage the brands available in your store.",
    action: "Manage brands",
    path: "/brands",
    adminOnly: true,
    Icon: LocalOfferOutlined,
    tone: "sage",
  },
  {
    title: "Colours",
    description: "Maintain product colour options.",
    action: "Manage colours",
    path: "/colors",
    adminOnly: true,
    Icon: PaletteOutlined,
    tone: "lavender",
  },
  {
    title: "Sizes",
    description: "Set up clothing sizes and options.",
    action: "Manage sizes",
    path: "/sizes",
    permission: "sizes",
    Icon: StraightenRounded,
    tone: "blue",
  },
  {
    title: "Products",
    description: "Manage your catalogue and variants.",
    action: "Manage products",
    path: "/inventory",
    permission: "inventory",
    Icon: Inventory2Outlined,
    tone: "gold",
  },
  {
    title: "Orders",
    description: "Review and manage store orders.",
    action: "Manage orders",
    path: "/orders",
    permission: "orders",
    Icon: ShoppingCartOutlined,
    tone: "sage",
  },
  {
    title: "Billing",
    description: "Create bills and review transactions.",
    action: "Open billing",
    path: "/billing",
    permission: "billing",
    Icon: ReceiptLongOutlined,
    tone: "rose",
  },
  {
    title: "Reports",
    description: "Explore business and financial reports.",
    action: "View reports",
    path: "/reports",
    permission: "reports",
    Icon: AssessmentOutlined,
    tone: "lavender",
  },
  {
    title: "Users",
    description: "Manage your team and access roles.",
    action: "Manage users",
    path: "/users",
    adminOnly: true,
    Icon: GroupsOutlined,
    tone: "blue",
  },
  {
    title: "Settings",
    description: "Configure your store preferences.",
    action: "Open settings",
    path: "/settings",
    adminOnly: true,
    Icon: SettingsOutlined,
    tone: "gold",
  },
];

const quickActions = [
  {
    title: "Add a product",
    detail: "Create a new product listing",
    path: "/addproduct",
    permission: "inventory",
    Icon: AddRounded,
  },
  {
    title: "View product catalogue",
    detail: "Browse products and variants",
    path: "/inventory",
    permission: "inventory",
    Icon: Inventory2Outlined,
  },
  {
    title: "Manage orders",
    detail: "Review incoming store orders",
    path: "/orders",
    permission: "orders",
    Icon: ShoppingCartOutlined,
  },
  {
    title: "Open billing",
    detail: "Start a billing transaction",
    path: "/billing",
    permission: "billing",
    Icon: ReceiptLongOutlined,
  },
  {
    title: "Business reports",
    detail: "View your store performance",
    path: "/reports",
    permission: "reports",
    Icon: AssessmentOutlined,
  },
  {
    title: "Store settings",
    detail: "Update your store configuration",
    path: "/settings",
    adminOnly: true,
    Icon: SettingsOutlined,
  },
];

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="sai-section-heading">
      <div>
        <span className="sai-section-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
    </div>
  );
}

function EmptyState({ Icon, title, description, compact = false }) {
  return (
    <div className={`sai-empty-state${compact ? " is-compact" : ""}`}>
      <span className="sai-empty-icon"><Icon /></span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [permissions, setPermissions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState(null);
  const [accessLoading, setAccessLoading] = useState(true);

  // Load the same Firestore role permissions used by the Sidebar.
  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;

      setAccessLoading(true);
      setPermissions([]);
      setIsAdmin(false);
      setProfile(null);

      if (!user) {
        setAccessLoading(false);
        return;
      }

      try {
        const profileSnapshot = await getDoc(
          doc(db, "users", user.uid)
        );

        if (!profileSnapshot.exists()) {
          setAccessLoading(false);
          return;
        }

        const userProfile = profileSnapshot.data();

        if (userProfile.status !== "active") {
          setAccessLoading(false);
          return;
        }

        if (!mounted) return;

        setProfile({
          name:
            userProfile.fullName ||
            user.displayName ||
            user.email?.split("@")[0] ||
            "Staff Member",
          role: userProfile.role || "Staff",
        });

        const roleName = String(userProfile.role || "")
          .trim()
          .toLowerCase();

        if (roleName === "admin") {
          if (mounted) {
            setIsAdmin(true);
            setPermissions([
              "dashboard",
              "categories",
              "subcategories",
              "sizes",
              "inventory",
              "orders",
              "billing",
              "customers",
              "reports",
            ]);
          }
          return;
        }

        let roleData = null;

        if (userProfile.roleId) {
          const roleSnapshot = await getDoc(
            doc(db, "roles", userProfile.roleId)
          );

          if (roleSnapshot.exists()) {
            roleData = roleSnapshot.data();
          }
        } else if (roleName) {
          const rolesSnapshot = await getDocs(
            collection(db, "roles")
          );

          const matchingRole = rolesSnapshot.docs.find(
            (roleDoc) =>
              String(roleDoc.data().name || "")
                .trim()
                .toLowerCase() === roleName
          );

          if (matchingRole) {
            roleData = matchingRole.data();
          }
        }

        if (
          mounted &&
          roleData &&
          roleData.status === "active"
        ) {
          setPermissions(
            Array.isArray(roleData.permissions)
              ? roleData.permissions
              : []
          );
        }
      } catch (error) {
        console.error("Dashboard permission loading failed:", error);
      } finally {
        if (mounted) setAccessLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const canAccess = (permission) =>
    isAdmin || permissions.includes(permission);

  const visibleManagementItems = useMemo(
    () =>
      managementItems.filter((item) => {
        if (item.adminOnly) return isAdmin;
        return permissions.includes(item.permission);
      }),
    [permissions, isAdmin]
  );

  const visibleQuickActions = useMemo(
    () =>
      quickActions.filter((item) => {
        if (item.adminOnly) return isAdmin;
        return permissions.includes(item.permission);
      }),
    [permissions, isAdmin]
  );

  const currentHour = new Date().getHours();

  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 17
        ? "Good afternoon"
        : "Good evening";

  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  if (accessLoading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          color: "#a77b2d",
        }}
      >
        <CircularProgress size={28} sx={{ color: "#a77b2d" }} />
        <span style={{ fontSize: 12, color: "#938777" }}>
          Loading your workspace...
        </span>
      </div>
    );
  }

  return (
    <main className="sai-dashboard">
      <div className="sai-dashboard-topline">
        <div className="sai-dashboard-brand">
          <img
            src="/assets/sai-collection-logo.png"
            alt="Sai Collection logo"
          />
          <div>
            <strong>Sai Collection</strong>
            <span>LATUR · MAHARASHTRA</span>
          </div>
        </div>

        <div className="sai-dashboard-top-actions">
          <span className="sai-date-label">{today}</span>

          <button
            className="sai-notification-button"
            type="button"
            aria-label="Notifications"
          >
            <NotificationsNoneRounded />
            <i />
          </button>

          <button
            className="sai-admin-chip"
            type="button"
            aria-label="User profile"
          >
            <span className="sai-admin-avatar">
              {(profile?.name || "S").charAt(0).toUpperCase()}
            </span>

            <span className="sai-admin-copy">
              <strong>{profile?.name || "Staff Member"}</strong>
              <small>{profile?.role || "Staff"}</small>
            </span>

            <KeyboardArrowDownRounded className="sai-admin-chevron" />
          </button>
        </div>
      </div>

      <header className="sai-dashboard-hero">
        <div className="sai-hero-copy">
          <span className="sai-hero-kicker">
            <span /> YOUR STORE OVERVIEW
          </span>

          <h1>
            {greeting}, <em>Welcome back.</em>
          </h1>

          <p>
            Everything you need to manage Sai Collection,
            thoughtfully organised in one place.
          </p>

          <div className="sai-hero-location">
            <StorefrontRounded />
            Sai Collection <span>•</span> Latur
          </div>
        </div>

        <div className="sai-hero-emblem" aria-hidden="true">
          <div className="sai-emblem-ring">
            <img src="/assets/sai-collection-logo.png" alt="" />
          </div>
          <span>YOUR BUSINESS, IN GOOD HANDS</span>
        </div>

        <div className="sai-hero-decoration" aria-hidden="true" />
      </header>

      {/* ONLY PERMITTED MANAGEMENT CARDS */}
      {visibleManagementItems.length > 0 && (
        <section className="sai-management-section">
          <SectionHeading
            eyebrow="YOUR WORKSPACE"
            title="Store management"
            description="Choose an area to manage and keep your store running smoothly."
          />

          <div className="sai-management-grid">
            {visibleManagementItems.map(
              ({ title, description, action, path, Icon, tone }) => (
                <article
                  className="sai-management-card"
                  key={title}
                  onClick={() => navigate(path)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      navigate(path);
                    }
                  }}
                >
                  <div className={`sai-management-icon tone-${tone}`}>
                    <Icon />
                  </div>

                  <div className="sai-management-card-copy">
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>

                  <button
                    className="sai-card-link"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(path);
                    }}
                  >
                    {action}
                    <ArrowForwardRounded />
                  </button>
                </article>
              )
            )}
          </div>
        </section>
      )}

      {/* INVENTORY AND QUICK ACTIONS */}
      {(canAccess("inventory") || visibleQuickActions.length > 0) && (
        <section className="sai-dashboard-content-grid">
          {canAccess("inventory") && (
            <article className="sai-dashboard-panel sai-inventory-panel">
              <div className="sai-panel-heading">
                <div>
                  <span className="sai-section-eyebrow">YOUR CATALOGUE</span>
                  <h2>Inventory overview</h2>
                </div>

                <button
                  className="sai-panel-link"
                  onClick={() => navigate("/inventory")}
                  type="button"
                >
                  View inventory <ArrowForwardRounded />
                </button>
              </div>

              <EmptyState
                Icon={WarehouseOutlined}
                title="Your inventory starts here"
                description="Once you add products, your inventory overview and stock information can appear here."
              />

              <div className="sai-panel-bottom-note">
                <span className="sai-note-dot" />
                Your product catalogue is ready to be managed.
              </div>
            </article>
          )}

          {visibleQuickActions.length > 0 && (
            <article className="sai-dashboard-panel sai-quick-panel">
              <div className="sai-panel-heading">
                <div>
                  <span className="sai-section-eyebrow">SHORTCUTS</span>
                  <h2>Quick actions</h2>
                </div>

                <span className="sai-shortcut-count">
                  {String(visibleQuickActions.length).padStart(2, "0")}
                </span>
              </div>

              <div className="sai-quick-action-list">
                {visibleQuickActions.map(
                  ({ title, detail, path, Icon }) => (
                    <button
                      className="sai-quick-action"
                      key={title}
                      type="button"
                      onClick={() => navigate(path)}
                    >
                      <span className="sai-quick-action-icon">
                        <Icon />
                      </span>

                      <span className="sai-quick-action-copy">
                        <strong>{title}</strong>
                        <small>{detail}</small>
                      </span>

                      <ArrowForwardRounded className="sai-quick-arrow" />
                    </button>
                  )
                )}
              </div>
            </article>
          )}
        </section>
      )}

      {/* REPORT ACTIVITY - REPORTS PERMISSION */}
      {canAccess("reports") && (
        <section className="sai-dashboard-bottom-grid">
          <article className="sai-dashboard-panel">
            <div className="sai-panel-heading">
              <div>
                <span className="sai-section-eyebrow">STORE TIMELINE</span>
                <h2>Recent activity</h2>
              </div>

              <button
                className="sai-panel-link"
                onClick={() => navigate("/reports")}
                type="button"
              >
                View reports <ArrowForwardRounded />
              </button>
            </div>

            <EmptyState
              compact
              Icon={HistoryRounded}
              title="Nothing to show just yet"
              description="Your latest store activity will appear here."
            />
          </article>

          {canAccess("inventory") && (
            <article className="sai-dashboard-panel">
              <div className="sai-panel-heading">
                <div>
                  <span className="sai-section-eyebrow">STOCK HEALTH</span>
                  <h2>Stock alerts</h2>
                </div>

                <button
                  className="sai-panel-link"
                  onClick={() => navigate("/inventory")}
                  type="button"
                >
                  View stock <ArrowForwardRounded />
                </button>
              </div>

              <EmptyState
                compact
                Icon={CheckCircleOutlineRounded}
                title="You're all set"
                description="Low-stock and out-of-stock alerts will appear here."
              />
            </article>
          )}
        </section>
      )}

      <footer className="sai-dashboard-footer">
        <span>© {new Date().getFullYear()} Sai Collection, Latur</span>
        <span>
          <QrCode2Rounded /> Retail management, made simpler.
        </span>
      </footer>
    </main>
  );
}
