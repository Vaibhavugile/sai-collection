
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  PersonRounded,
  EmailRounded,
  LockRounded,
  BadgeRounded,
  Visibility,
  VisibilityOff,
  PersonAddRounded,
  ArrowForwardRounded,
  ShieldRounded,
} from "@mui/icons-material";

import {
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";

import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "../../firebase";
import AuthLayout from "./AuthLayout";
import "./Login.css";

// Signup access password.
// IMPORTANT: This is only a client-side convenience gate.
const SIGNUP_ACCESS_PASSWORD = "Reddy@7733";

export default function Signup() {
  const navigate = useNavigate();

  const [unlocked, setUnlocked] = useState(false);
  const [accessPassword, setAccessPassword] = useState("");
  const [showAccessPassword, setShowAccessPassword] = useState(false);
  const [accessError, setAccessError] = useState("");

  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    roleId: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Load available active roles from Firestore.
  useEffect(() => {
    let mounted = true;

    const loadRoles = async () => {
      setRolesLoading(true);

      try {
        const rolesQuery = query(
          collection(db, "roles"),
          where("status", "==", "active")
        );

        const snapshot = await getDocs(rolesQuery);

        const availableRoles = snapshot.docs
          .map((roleDoc) => ({
            id: roleDoc.id,
            ...roleDoc.data(),
          }))
          // Public signup must never allow Admin registration.
          .filter(
            (role) =>
              String(role.name || "").trim().toLowerCase() !== "admin"
          )
          .sort((a, b) =>
            String(a.name || "").localeCompare(String(b.name || ""))
          );

        if (mounted) {
          setRoles(availableRoles);

          setForm((prev) => ({
            ...prev,
            roleId: availableRoles.length ? availableRoles[0].id : "",
          }));
        }
      } catch (err) {
        console.error("Unable to load staff roles:", err);

        if (mounted) {
          setError("Unable to load staff roles. Please refresh and try again.");
        }
      } finally {
        if (mounted) setRolesLoading(false);
      }
    };

    loadRoles();

    return () => {
      mounted = false;
    };
  }, []);

  // Verify signup access password.
  const handleUnlock = (e) => {
    e.preventDefault();
    setAccessError("");

    if (accessPassword !== SIGNUP_ACCESS_PASSWORD) {
      setAccessError("Incorrect access password. Please try again.");
      return;
    }

    setUnlocked(true);
    setAccessPassword("");
  };

  // Create staff account.
  const handleSignup = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.fullName.trim()) {
      return setError("Please enter your full name.");
    }

    if (!form.email.trim()) {
      return setError("Please enter your email address.");
    }

    if (!form.roleId) {
      return setError("Please select a staff role.");
    }

    if (form.password.length < 6) {
      return setError("Password must contain at least 6 characters.");
    }

    if (form.password !== form.confirmPassword) {
      return setError("Your passwords do not match.");
    }

    if (!form.acceptTerms) {
      return setError("Please accept the Terms & Conditions.");
    }

    const selectedRole = roles.find((role) => role.id === form.roleId);

    if (!selectedRole || selectedRole.status !== "active") {
      return setError("This staff role is no longer available. Refresh the page.");
    }

    if (
      String(selectedRole.name || "").trim().toLowerCase() === "admin"
    ) {
      return setError("Admin accounts cannot be created through public signup.");
    }

    try {
      setLoading(true);

      const credential = await createUserWithEmailAndPassword(
        auth,
        form.email.trim(),
        form.password
      );

      const user = credential.user;

      await updateProfile(user, {
        displayName: form.fullName.trim(),
      });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: form.fullName.trim(),
        email: form.email.trim(),

        // Save both the role name and Firestore role document ID.
        role: selectedRole.name,
        roleId: selectedRole.id,

        status: "active",
        storeName: "Sai Collection",
        storeLocation: "Latur",
        createdAt: serverTimestamp(),
      });

      await signOut(auth);

      setSuccess(
        "Your account has been created successfully. Redirecting to sign in..."
      );

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (err) {
      console.error("Signup failed:", err);

      const messages = {
        "auth/email-already-in-use":
          "An account with this email already exists.",
        "auth/invalid-email":
          "Please enter a valid email address.",
        "auth/weak-password":
          "Choose a stronger password with at least 6 characters.",
        "auth/network-request-failed":
          "Network error. Check your internet connection and try again.",
      };

      setError(
        messages[err.code] ||
          "We couldn't create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={unlocked ? "Create your account" : "Protected registration"}
      subtitle={
        unlocked
          ? "Set up staff access for your Sai Collection store."
          : "Enter the registration access password to continue."
      }
      footer={
        <Typography className="sai-switch-auth">
          Already have an account?{" "}
          <Link to="/login">
            Sign in <ArrowForwardRounded />
          </Link>
        </Typography>
      }
    >
      {!unlocked ? (
        /* PASSWORD PROTECTION SCREEN */
        <Box
          component="form"
          onSubmit={handleUnlock}
          className="sai-auth-form"
          noValidate
        >
          {accessError && (
            <Alert severity="error" className="sai-auth-alert">
              {accessError}
            </Alert>
          )}

          <Box
            sx={{
              textAlign: "center",
              py: 2,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                mx: "auto",
                mb: 2,
                borderRadius: "18px",
                display: "grid",
                placeItems: "center",
                color: "#a77b2d",
                background: "#f7f0e3",
              }}
            >
              <ShieldRounded sx={{ fontSize: 32 }} />
            </Box>

            <Typography
              sx={{
                fontWeight: 800,
                fontSize: 16,
                color: "#34291b",
              }}
            >
              Registration is protected
            </Typography>

            <Typography
              sx={{
                mt: 0.7,
                fontSize: 11,
                color: "#938777",
              }}
            >
              Enter your access password to open staff registration.
            </Typography>
          </Box>

          <TextField
            fullWidth
            label="Registration access password"
            type={showAccessPassword ? "text" : "password"}
            value={accessPassword}
            onChange={(e) => setAccessPassword(e.target.value)}
            autoComplete="off"
            className="sai-input"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockRounded />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="Toggle access password visibility"
                    onClick={() =>
                      setShowAccessPassword((value) => !value)
                    }
                    edge="end"
                  >
                    {showAccessPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={!accessPassword}
            className="sai-submit-button"
            endIcon={<ArrowForwardRounded />}
          >
            Continue to registration
          </Button>
        </Box>
      ) : (
        /* STAFF REGISTRATION FORM */
        <Box
          component="form"
          onSubmit={handleSignup}
          className="sai-auth-form sai-signup-form"
          noValidate
        >
          {error && (
            <Alert severity="error" className="sai-auth-alert">
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" className="sai-auth-alert">
              {success}
            </Alert>
          )}

          <Stack spacing={1.7}>
            <TextField
              fullWidth
              label="Full name"
              value={form.fullName}
              onChange={(e) =>
                handleChange("fullName", e.target.value)
              }
              autoComplete="name"
              className="sai-input"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonRounded />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Email address"
              type="email"
              value={form.email}
              onChange={(e) =>
                handleChange("email", e.target.value)
              }
              autoComplete="email"
              className="sai-input"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailRounded />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              select
              label="Staff role"
              value={form.roleId}
              onChange={(e) =>
                handleChange("roleId", e.target.value)
              }
              className="sai-input"
              disabled={rolesLoading || roles.length === 0}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BadgeRounded />
                  </InputAdornment>
                ),
              }}
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name}
                </MenuItem>
              ))}
            </TextField>

            {!rolesLoading && roles.length === 0 && (
              <Alert severity="warning">
                No active staff roles are available. Please ask your
                administrator to create an active role first.
              </Alert>
            )}

            {rolesLoading && (
              <Typography
                sx={{
                  fontSize: 11,
                  color: "#938777",
                }}
              >
                Loading available staff roles...
              </Typography>
            )}

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) =>
                handleChange("password", e.target.value)
              }
              autoComplete="new-password"
              className="sai-input"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockRounded />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="Toggle password visibility"
                      onClick={() =>
                        setShowPassword((value) => !value)
                      }
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Confirm password"
              type={showConfirm ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) =>
                handleChange("confirmPassword", e.target.value)
              }
              autoComplete="new-password"
              className="sai-input"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockRounded />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="Toggle confirm password visibility"
                      onClick={() =>
                        setShowConfirm((value) => !value)
                      }
                      edge="end"
                    >
                      {showConfirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>

          <FormControlLabel
            className="sai-terms"
            control={
              <Checkbox
                checked={form.acceptTerms}
                onChange={(e) =>
                  handleChange("acceptTerms", e.target.checked)
                }
              />
            }
            label="I agree to the Terms & Conditions"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={
              loading ||
              rolesLoading ||
              roles.length === 0 ||
              !form.roleId
            }
            className="sai-submit-button"
            endIcon={!loading && <PersonAddRounded />}
          >
            {loading ? (
              <CircularProgress size={23} color="inherit" />
            ) : (
              "Create account"
            )}
          </Button>
        </Box>
      )}
    </AuthLayout>
  );
}
