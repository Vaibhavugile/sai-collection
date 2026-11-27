
import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebase";

import {
  AddRounded,
  AdminPanelSettingsRounded,
  CheckCircleRounded,
  DeleteOutlineRounded,
  EditRounded,
  LockRounded,
  PeopleAltRounded,
  SaveRounded,
  ShieldRounded,
  VisibilityRounded,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import "./RolesPage.css";

const PERMISSION_GROUPS = [
  {
    title: "OVERVIEW",
    items: [{ id: "dashboard", label: "Dashboard", description: "View store dashboard" }],
  },
  {
    title: "PRODUCT MANAGEMENT",
    items: [
      { id: "categories", label: "Categories", description: "Manage product categories" },
      { id: "subcategories", label: "Sub Categories", description: "Manage subcategories" },
      { id: "sizes", label: "Sizes", description: "Manage sizes and variants" },
      { id: "inventory", label: "Products", description: "View and manage inventory" },
    ],
  },
  {
    title: "PURCHASE",
    items: [{ id: "orders", label: "Orders", description: "View and manage orders" }],
  },
  {
    title: "SALES",
    items: [
      { id: "billing", label: "Billing", description: "Access billing and invoices" },
      { id: "customers", label: "Customers", description: "View and manage customers" },
    ],
  },
  {
    title: "INSIGHTS",
    items: [{ id: "reports", label: "Reports", description: "View business reports" }],
  },
];

const EMPTY_FORM = {
  name: "",
  description: "",
  permissions: [],
};

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const allPermissionIds = useMemo(
    () => PERMISSION_GROUPS.flatMap((group) => group.items.map((item) => item.id)),
    []
  );

  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  // Check whether the logged-in user is an admin.
  useEffect(() => {
    let mounted = true;

    const checkAccess = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          if (mounted) setIsAdmin(false);
          return;
        }

        const userSnapshot = await getDoc(doc(db, "users", user.uid));

        if (mounted) {
          const profile = userSnapshot.exists() ? userSnapshot.data() : null;
          setIsAdmin(profile?.role === "admin" && profile?.status === "active");
        }
      } catch (error) {
        console.error("Role access check failed:", error);
        if (mounted) setIsAdmin(false);
      } finally {
        if (mounted) setCheckingAccess(false);
      }
    };

    checkAccess();

    return () => {
      mounted = false;
    };
  }, []);

  // Fetch roles from Firestore.
  const fetchRoles = async () => {
    setLoading(true);

    try {
      const snapshot = await getDocs(collection(db, "roles"));

      const data = snapshot.docs.map((roleDoc) => ({
        id: roleDoc.id,
        ...roleDoc.data(),
      }));

      data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setRoles(data);
    } catch (error) {
      console.error("Unable to fetch roles:", error);
      showNotification("Unable to load roles. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchRoles();
  }, [isAdmin]);

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (role) => {
    setEditingId(role.id);
    setForm({
      name: role.name || "",
      description: role.description || "",
      permissions: Array.isArray(role.permissions) ? role.permissions : [],
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const togglePermission = (permissionId) => {
    setForm((current) => ({
      ...current,
      permissions: current.permissions.includes(permissionId)
        ? current.permissions.filter((item) => item !== permissionId)
        : [...current.permissions, permissionId],
    }));
  };

  const selectAllPermissions = () => {
    setForm((current) => ({
      ...current,
      permissions: [...allPermissionIds],
    }));
  };

  const clearAllPermissions = () => {
    setForm((current) => ({
      ...current,
      permissions: [],
    }));
  };

  const handleSave = async () => {
    const name = form.name.trim();

    if (!name) {
      showNotification("Please enter a role name.", "error");
      return;
    }

    if (form.permissions.length === 0) {
      showNotification("Select at least one sidebar permission.", "error");
      return;
    }

    const duplicate = roles.find(
      (role) =>
        role.id !== editingId &&
        (role.name || "").trim().toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
      showNotification("A role with this name already exists.", "error");
      return;
    }

    setSaving(true);

    try {
      const roleData = {
        name,
        description: form.description.trim(),
        permissions: form.permissions,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "roles", editingId), roleData);
        showNotification("Role updated successfully.");
      } else {
        await addDoc(collection(db, "roles"), {
          ...roleData,
          status: "active",
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser?.uid || null,
        });
        showNotification("New role created successfully.");
      }

      setDialogOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      await fetchRoles();
    } catch (error) {
      console.error("Saving role failed:", error);
      showNotification("Unable to save role. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);

    try {
      await deleteDoc(doc(db, "roles", deleteTarget.id));
      showNotification("Role deleted successfully.");
      setDeleteTarget(null);
      await fetchRoles();
    } catch (error) {
      console.error("Deleting role failed:", error);
      showNotification("Unable to delete this role.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  if (checkingAccess || loading) {
    return (
      <div className="roles-loading">
        <CircularProgress size={28} />
        <Typography>Loading roles workspace...</Typography>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="roles-access-denied">
        <div className="roles-denied-icon">
          <LockRounded />
        </div>
        <Typography className="roles-denied-title">
          Admin access required
        </Typography>
        <Typography className="roles-denied-description">
          Only an active administrator can manage staff roles and permissions.
        </Typography>
      </div>
    );
  }

  return (
    <Box className="roles-page">
      <Box className="roles-page-heading">
        <Box>
          <Box className="roles-eyebrow">
            <ShieldRounded />
            STAFF ACCESS CONTROL
          </Box>

          <Typography className="roles-page-title">
            Roles & Permissions
          </Typography>

          <Typography className="roles-page-subtitle">
            Create staff roles and control which sections they can access.
          </Typography>
        </Box>

        <Button
          className="roles-create-button"
          startIcon={<AddRounded />}
          onClick={openCreateDialog}
        >
          Create New Role
        </Button>
      </Box>

      <Box className="roles-summary-grid">
        <Box className="roles-summary-card">
          <Box className="roles-summary-icon">
            <PeopleAltRounded />
          </Box>
          <Box>
            <Typography className="roles-summary-label">TOTAL ROLES</Typography>
            <Typography className="roles-summary-value">{roles.length}</Typography>
          </Box>
        </Box>

        <Box className="roles-summary-card">
          <Box className="roles-summary-icon">
            <VisibilityRounded />
          </Box>
          <Box>
            <Typography className="roles-summary-label">AVAILABLE PERMISSIONS</Typography>
            <Typography className="roles-summary-value">
              {allPermissionIds.length}
            </Typography>
          </Box>
        </Box>

        <Box className="roles-summary-card">
          <Box className="roles-summary-icon">
            <AdminPanelSettingsRounded />
          </Box>
          <Box>
            <Typography className="roles-summary-label">CUSTOM ROLES</Typography>
            <Typography className="roles-summary-value">
              {roles.length}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box className="roles-section-heading">
        <Box>
          <Typography className="roles-section-title">Your Staff Roles</Typography>
          <Typography className="roles-section-subtitle">
            Manage the permissions assigned to each role.
          </Typography>
        </Box>
        <Chip label={`${roles.length} roles`} className="roles-count-chip" />
      </Box>

      {roles.length === 0 ? (
        <Box className="roles-empty">
          <div className="roles-empty-icon">
            <ShieldRounded />
          </div>
          <Typography className="roles-empty-title">No roles created yet</Typography>
          <Typography className="roles-empty-description">
            Create your first role and choose which sidebar sections it can access.
          </Typography>
          <Button
            className="roles-create-button"
            startIcon={<AddRounded />}
            onClick={openCreateDialog}
          >
            Create First Role
          </Button>
        </Box>
      ) : (
        <Box className="roles-grid">
          {roles.map((role) => (
            <Box className="roles-card" key={role.id}>
              <Box className="roles-card-top">
                <Box className="roles-card-icon">
                  <AdminPanelSettingsRounded />
                </Box>

                <Box className="roles-card-actions">
                  <Tooltip title="Edit role">
                    <IconButton onClick={() => openEditDialog(role)}>
                      <EditRounded />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Delete role">
                    <IconButton
                      className="roles-delete-action"
                      onClick={() => setDeleteTarget(role)}
                    >
                      <DeleteOutlineRounded />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Typography className="roles-card-name">{role.name}</Typography>

              <Typography className="roles-card-description">
                {role.description || "No description added."}
              </Typography>

              <Divider className="roles-card-divider" />

              <Box className="roles-card-permission-heading">
                <Typography>SIDEBAR ACCESS</Typography>
                <Chip
                  size="small"
                  label={`${role.permissions?.length || 0} / ${allPermissionIds.length}`}
                />
              </Box>

              <Box className="roles-card-permissions">
                {(role.permissions || []).length ? (
                  role.permissions.map((permission) => {
                    const permissionLabel = PERMISSION_GROUPS
                      .flatMap((group) => group.items)
                      .find((item) => item.id === permission)?.label || permission;

                    return (
                      <Chip
                        key={permission}
                        icon={<CheckCircleRounded />}
                        label={permissionLabel}
                        className="roles-permission-chip"
                      />
                    );
                  })
                ) : (
                  <Typography className="roles-no-permissions">
                    No sidebar permissions assigned.
                  </Typography>
                )}
              </Box>

              <Box className="roles-card-bottom">
                <span className="roles-status-dot" />
                <Typography>Active role</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* CREATE / EDIT ROLE DIALOG */}
      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="md"
        PaperProps={{ className: "roles-dialog" }}
      >
        <DialogTitle className="roles-dialog-title">
          <Box>
            <Typography className="roles-dialog-heading">
              {editingId ? "Edit Role" : "Create New Role"}
            </Typography>
            <Typography className="roles-dialog-subheading">
              Configure the role details and sidebar visibility.
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent className="roles-dialog-content">
          <Box className="roles-form-fields">
            <TextField
              fullWidth
              label="Role Name"
              placeholder="e.g. Store Manager"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              inputProps={{ maxLength: 40 }}
            />

            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Description (Optional)"
              placeholder="Describe what this staff role is responsible for..."
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              inputProps={{ maxLength: 180 }}
            />
          </Box>

          <Box className="roles-permissions-header">
            <Box>
              <Typography className="roles-permissions-title">
                Sidebar Permissions
              </Typography>
              <Typography className="roles-permissions-subtitle">
                Select the sections this role should be able to see.
              </Typography>
            </Box>

            <Box className="roles-selection-actions">
              <Button onClick={selectAllPermissions}>Select All</Button>
              <Button onClick={clearAllPermissions}>Clear All</Button>
            </Box>
          </Box>

          <Box className="roles-selected-count">
            <CheckCircleRounded />
            {form.permissions.length} of {allPermissionIds.length} sections selected
          </Box>

          <Box className="roles-permission-groups">
            {PERMISSION_GROUPS.map((group) => (
              <Box className="roles-permission-group" key={group.title}>
                <Typography className="roles-group-title">
                  {group.title}
                </Typography>

                <Box className="roles-permission-options">
                  {group.items.map((item) => {
                    const checked = form.permissions.includes(item.id);

                    return (
                      <button
                        type="button"
                        key={item.id}
                        className={`roles-permission-option ${
                          checked ? "selected" : ""
                        }`}
                        onClick={() => togglePermission(item.id)}
                      >
                        <span className="roles-option-checkbox">
                          {checked ? <CheckCircleRounded /> : null}
                        </span>

                        <span className="roles-option-copy">
                          <strong>{item.label}</strong>
                          <small>{item.description}</small>
                        </span>
                      </button>
                    );
                  })}
                </Box>
              </Box>
            ))}
          </Box>
        </DialogContent>

        <DialogActions className="roles-dialog-actions">
          <Button className="roles-cancel-button" onClick={closeDialog}>
            Cancel
          </Button>

          <Button
            className="roles-save-button"
            startIcon={saving ? <CircularProgress size={16} /> : <SaveRounded />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : editingId ? "Save Changes" : "Create Role"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !deletingId && setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete this role?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
            This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={Boolean(deletingId)}>
            Cancel
          </Button>
          <Button
            color="error"
            onClick={handleDelete}
            disabled={Boolean(deletingId)}
          >
            {deletingId ? "Deleting..." : "Delete Role"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={3500}
        onClose={() => setNotification((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={notification.severity}
          variant="filled"
          onClose={() => setNotification((current) => ({ ...current, open: false }))}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
