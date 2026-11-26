import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Alert, Box, Button, Checkbox, CircularProgress, FormControlLabel,
  IconButton, InputAdornment, Stack, TextField, Typography
} from "@mui/material";
import {
  EmailRounded, LockRounded, LoginRounded, Visibility, VisibilityOff,
  ArrowForwardRounded
} from "@mui/icons-material";
import {
  browserLocalPersistence, browserSessionPersistence,
  sendPasswordResetEmail, setPersistence, signInWithEmailAndPassword
} from "firebase/auth";
import { auth } from "../../firebase";
import AuthLayout from "./AuthLayout";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) return setError("Please enter your email address.");
    if (!password) return setError("Please enter your password.");

    try {
      setLoading(true);
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setSuccess("Welcome back! Opening your dashboard…");
      setTimeout(() => navigate("/dashboard"), 650);
    } catch (err) {
      const messages = {
        "auth/user-not-found": "No account was found with this email address.",
        "auth/invalid-credential": "The email or password you entered is incorrect.",
        "auth/wrong-password": "The password you entered is incorrect.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
        "auth/network-request-failed": "Network error. Check your internet connection and try again."
      };
      setError(messages[err.code] || "We couldn't sign you in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setSuccess("");
    if (!email.trim()) {
      setError("Enter your email address first, then select Forgot password.");
      return;
    }
    try {
      setResetLoading(true);
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess("Password reset email sent. Please check your inbox.");
    } catch (err) {
      const messages = {
        "auth/user-not-found": "No account was found with this email address.",
        "auth/invalid-email": "Please enter a valid email address."
      };
      setError(messages[err.code] || "Unable to send the reset email. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue managing your store."
      footer={
        <Typography className="sai-switch-auth">
          New to Sai Collection? <Link to="/signup">Create an account <ArrowForwardRounded /></Link>
        </Typography>
      }
    >
      <Box component="form" onSubmit={handleLogin} className="sai-auth-form" noValidate>
        {error && <Alert severity="error" className="sai-auth-alert">{error}</Alert>}
        {success && <Alert severity="success" className="sai-auth-alert">{success}</Alert>}

        <Stack spacing={2.2}>
          <TextField
            fullWidth label="Email address" type="email" value={email}
            autoComplete="email" onChange={(e) => setEmail(e.target.value)}
            className="sai-input"
            InputProps={{ startAdornment: <InputAdornment position="start"><EmailRounded /></InputAdornment> }}
          />

          <TextField
            fullWidth label="Password" type={showPassword ? "text" : "password"}
            value={password} autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)} className="sai-input"
            InputProps={{
              startAdornment: <InputAdornment position="start"><LockRounded /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((value) => !value)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Stack>

        <Box className="sai-login-options">
          <FormControlLabel
            control={<Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />}
            label="Keep me signed in"
          />
          <Button type="button" onClick={handleForgotPassword} disabled={resetLoading} className="sai-text-button">
            {resetLoading ? "Sending…" : "Forgot password?"}
          </Button>
        </Box>

        <Button type="submit" fullWidth variant="contained" disabled={loading}
          className="sai-submit-button" endIcon={!loading && <LoginRounded />}>
          {loading ? <CircularProgress size={23} color="inherit" /> : "Sign in to your store"}
        </Button>

        <Box className="sai-security-note">
          <LockRounded />
          <Typography>Your account and store data are protected with Firebase Authentication.</Typography>
        </Box>
      </Box>
    </AuthLayout>
  );
}
