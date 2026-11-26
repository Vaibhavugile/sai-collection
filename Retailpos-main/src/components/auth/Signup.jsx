import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Alert, Box, Button, Checkbox, CircularProgress, FormControlLabel,
  IconButton, InputAdornment, MenuItem, Stack, TextField, Typography
} from "@mui/material";
import {
  PersonRounded, EmailRounded, LockRounded, BadgeRounded,
  Visibility, VisibilityOff, PersonAddRounded, ArrowForwardRounded
} from "@mui/icons-material";
import { createUserWithEmailAndPassword, updateProfile, signOut } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import AuthLayout from "./AuthLayout";
import "./Login.css";

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    fullName: "", email: "", role: "cashier", password: "",
    confirmPassword: "", acceptTerms: false
  });

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.fullName.trim()) return setError("Please enter your full name.");
    if (!form.email.trim()) return setError("Please enter your email address.");
    if (form.password.length < 6) return setError("Password must contain at least 6 characters.");
    if (form.password !== form.confirmPassword) return setError("Your passwords do not match.");
    if (!form.acceptTerms) return setError("Please accept the Terms & Conditions.");

    try {
      setLoading(true);
      const credential = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
      const user = credential.user;

      await updateProfile(user, { displayName: form.fullName.trim() });
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        role: form.role,
        status: "active",
        storeName: "Sai Collection",
        storeLocation: "Latur",
        createdAt: serverTimestamp()
      });

      await signOut(auth);
      setSuccess("Your account has been created. Redirecting to sign in…");
      setTimeout(() => navigate("/login"), 1100);
    } catch (err) {
      const messages = {
        "auth/email-already-in-use": "An account with this email already exists.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/weak-password": "Choose a stronger password with at least 6 characters.",
        "auth/network-request-failed": "Network error. Check your internet connection and try again."
      };
      setError(messages[err.code] || "We couldn't create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Set up access for your Sai Collection store."
      footer={
        <Typography className="sai-switch-auth">
          Already have an account? <Link to="/login">Sign in <ArrowForwardRounded /></Link>
        </Typography>
      }
    >
      <Box component="form" onSubmit={handleSignup} className="sai-auth-form sai-signup-form" noValidate>
        {error && <Alert severity="error" className="sai-auth-alert">{error}</Alert>}
        {success && <Alert severity="success" className="sai-auth-alert">{success}</Alert>}

        <Stack spacing={1.7}>
          <TextField fullWidth label="Full name" value={form.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)} autoComplete="name"
            className="sai-input"
            InputProps={{ startAdornment: <InputAdornment position="start"><PersonRounded /></InputAdornment> }} />

          <TextField fullWidth label="Email address" type="email" value={form.email}
            onChange={(e) => handleChange("email", e.target.value)} autoComplete="email"
            className="sai-input"
            InputProps={{ startAdornment: <InputAdornment position="start"><EmailRounded /></InputAdornment> }} />

          <TextField fullWidth select label="Staff role" value={form.role}
            onChange={(e) => handleChange("role", e.target.value)} className="sai-input"
            InputProps={{ startAdornment: <InputAdornment position="start"><BadgeRounded /></InputAdornment> }}>
            <MenuItem value="cashier">Cashier</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </TextField>

          <TextField fullWidth label="Password" type={showPassword ? "text" : "password"}
            value={form.password} onChange={(e) => handleChange("password", e.target.value)}
            autoComplete="new-password" className="sai-input"
            InputProps={{
              startAdornment: <InputAdornment position="start"><LockRounded /></InputAdornment>,
              endAdornment: <InputAdornment position="end"><IconButton aria-label="Toggle password visibility"
                onClick={() => setShowPassword((v) => !v)} edge="end">
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton></InputAdornment>
            }} />

          <TextField fullWidth label="Confirm password" type={showConfirm ? "text" : "password"}
            value={form.confirmPassword} onChange={(e) => handleChange("confirmPassword", e.target.value)}
            autoComplete="new-password" className="sai-input"
            InputProps={{
              startAdornment: <InputAdornment position="start"><LockRounded /></InputAdornment>,
              endAdornment: <InputAdornment position="end"><IconButton aria-label="Toggle confirm password visibility"
                onClick={() => setShowConfirm((v) => !v)} edge="end">
                {showConfirm ? <VisibilityOff /> : <Visibility />}
              </IconButton></InputAdornment>
            }} />
        </Stack>

        <FormControlLabel className="sai-terms"
          control={<Checkbox checked={form.acceptTerms} onChange={(e) => handleChange("acceptTerms", e.target.checked)} />}
          label="I agree to the Terms & Conditions" />

        <Button type="submit" fullWidth variant="contained" disabled={loading}
          className="sai-submit-button" endIcon={!loading && <PersonAddRounded />}>
          {loading ? <CircularProgress size={23} color="inherit" /> : "Create account"}
        </Button>
      </Box>
    </AuthLayout>
  );
}
