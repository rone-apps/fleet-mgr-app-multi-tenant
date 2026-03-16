"use client";

import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
  Link,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  LocalTaxi,
  LocalShipping,
  DirectionsCar,
  AirportShuttle,
} from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from '../lib/api';

const theme = createTheme({
  palette: {
    primary: { main: "#635bff" },
    background: { default: "#fff" },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
    button: { textTransform: "none" },
  },
});

// Known companies - maps company ID to display name and database schema
const KNOWN_COMPANIES = [
  { id: 'mac-cabs', name: 'Maclures Cabs', schema: 'fareflow' },
  { id: 'bonny-taxi', name: 'Bonny Taxi', schema: 'fareflow_bonny' },
];

export default function SignInPage() {
  const [companyId, setCompanyId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    if (!companyId) {
      setError("Please enter your company ID");
      setLoading(false);
      return;
    }

    if (!username || !password) {
      setError("Please enter both username and password");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const matchedCompany = KNOWN_COMPANIES.find(
        c => c.id.toLowerCase() === companyId.toLowerCase() ||
             c.name.toLowerCase() === companyId.toLowerCase()
      );

      const schemaName = matchedCompany ? matchedCompany.schema : companyId.toLowerCase().replace(/[^a-z0-9_]/g, '');
      const displayName = matchedCompany ? matchedCompany.name : companyId;
      const tenantId = matchedCompany ? matchedCompany.id : companyId;

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": schemaName,
        },
        body: JSON.stringify({
          username,
          password,
          tenantId: schemaName
        }),
      });

      if (response.ok) {
        const data = await response.json();

        localStorage.setItem("token", data.token);
        localStorage.setItem("tenantId", tenantId);
        localStorage.setItem("tenantSchema", schemaName);
        localStorage.setItem("tenantName", data.tenantName || displayName);
        localStorage.setItem("user", JSON.stringify({
          userId: data.userId,
          username: data.username,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          driverId: data.driverId,
          tenantId: tenantId,
          tenantSchema: schemaName
        }));

        document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Strict`;
        document.cookie = `tenantId=${schemaName}; path=/; max-age=86400; SameSite=Strict`;

        // Redirect to the page they were trying to access, or home
        const params = new URLSearchParams(window.location.search);
        const redirectTo = params.get("redirect") || "/";
        window.location.replace(redirectTo);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || "Invalid company, username or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "6px",
      backgroundColor: "#fff",
      fontSize: "0.95rem",
      height: "52px",
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "#b0b7c3",
      },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: "#635bff",
        borderWidth: "2px",
        boxShadow: "0 0 0 3px rgba(99,91,255,0.12)",
      },
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#d8dde6",
    },
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#fff",
        }}
      >
        {/* Stripe-style animated gradient band at top */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "50%",
            background: "linear-gradient(135deg, #a960ee 0%, #635bff 25%, #18bfff 50%, #5be4a0 75%, #f7c948 100%)",
            backgroundSize: "400% 400%",
            animation: "gradientShift 12s ease infinite",
            "@keyframes gradientShift": {
              "0%": { backgroundPosition: "0% 50%" },
              "50%": { backgroundPosition: "100% 50%" },
              "100%": { backgroundPosition: "0% 50%" },
            },
            "&::after": {
              content: '""',
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "120px",
              background: "linear-gradient(to top, #fff 0%, transparent 100%)",
            },
          }}
        />

        {/* Content */}
        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            px: 2,
            py: 4,
            overflowY: "auto",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: 560,
            }}
          >
            {/* Logo */}
            <Box sx={{ textAlign: "center", mb: 5 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: "-0.5px",
                  mb: 0.5,
                  textShadow: "0 1px 3px rgba(0,0,0,0.15)",
                }}
              >
                Smart Fleets
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "rgba(255,255,255,0.85)", fontSize: "0.95rem", mb: 2, textShadow: "0 1px 2px rgba(0,0,0,0.1)" }}
              >
                Fleet Management
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "center", gap: 2.5 }}>
                <LocalTaxi sx={{ fontSize: 28, color: "rgba(255,255,255,0.7)" }} />
                <DirectionsCar sx={{ fontSize: 28, color: "rgba(255,255,255,0.7)" }} />
                <LocalShipping sx={{ fontSize: 28, color: "rgba(255,255,255,0.7)" }} />
                <AirportShuttle sx={{ fontSize: 28, color: "rgba(255,255,255,0.7)" }} />
              </Box>
            </Box>

            {/* Form Card */}
            <Box
              sx={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                boxShadow: "0 15px 35px rgba(0,0,0,0.08), 0 5px 15px rgba(0,0,0,0.04)",
                p: { xs: 4, sm: 6 },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: "#0a2540",
                  mb: 3.5,
                  fontSize: "1.15rem",
                }}
              >
                Sign in to your account
              </Typography>

              {error && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 2.5,
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                    "& .MuiAlert-icon": { fontSize: "1.2rem" },
                  }}
                >
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                {/* Company ID */}
                <Box sx={{ mb: 2.5 }}>
                  <Typography
                    component="label"
                    variant="body2"
                    sx={{
                      display: "block",
                      fontWeight: 600,
                      color: "#3c4257",
                      mb: 0.75,
                      fontSize: "0.9rem",
                    }}
                  >
                    Company ID
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="your-company-id"
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    disabled={loading}
                    sx={inputSx}
                  />
                </Box>

                {/* Username */}
                <Box sx={{ mb: 2.5 }}>
                  <Typography
                    component="label"
                    variant="body2"
                    sx={{
                      display: "block",
                      fontWeight: 600,
                      color: "#3c4257",
                      mb: 0.75,
                      fontSize: "0.9rem",
                    }}
                  >
                    Username
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    autoComplete="username"
                    sx={inputSx}
                  />
                </Box>

                {/* Password */}
                <Box sx={{ mb: 3.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
                    <Typography
                      component="label"
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: "#3c4257",
                        fontSize: "0.9rem",
                      }}
                    >
                      Password
                    </Typography>
                    <Link
                      href="#"
                      underline="none"
                      sx={{
                        fontSize: "0.85rem",
                        color: "#635bff",
                        fontWeight: 500,
                        "&:hover": { color: "#4b45c6" },
                      }}
                    >
                      Forgot password?
                    </Link>
                  </Box>
                  <TextField
                    fullWidth
                    size="small"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="current-password"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                            disabled={loading}
                            sx={{ color: "#697386" }}
                          >
                            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={inputSx}
                  />
                </Box>

                {/* Submit */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  disableElevation
                  sx={{
                    py: 1.7,
                    backgroundColor: "#635bff",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    borderRadius: "8px",
                    "&:hover": {
                      backgroundColor: "#4b45c6",
                    },
                    "&:disabled": {
                      backgroundColor: "#a5a1ff",
                      color: "#fff",
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={22} sx={{ color: "#fff" }} />
                  ) : (
                    "Continue"
                  )}
                </Button>
              </Box>
            </Box>

            {/* Demo info */}
            <Box
              sx={{
                mt: 3,
                backgroundColor: "#f7f8fa",
                borderRadius: "10px",
                border: "1px solid #e3e8ee",
                p: 3,
                pt: 2,
                textAlign: "center",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: "inline-block",
                  backgroundColor: "#ff9800",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.65rem",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  px: 1.5,
                  py: 0.4,
                  borderRadius: "4px",
                  mb: 1.5,
                }}
              >
                Demo Account
              </Typography>
              <Typography variant="body2" sx={{ color: "#3c4257", fontSize: "0.95rem", mb: 1.5, fontWeight: 600 }}>
                🚕 Yellow Cab NYC (Demo)
              </Typography>
              <Typography variant="body2" sx={{ color: "#697386", fontSize: "0.85rem", fontFamily: "monospace", mb: 0.5 }}>
                Company: <strong style={{ color: "#3c4257" }}>yellow-cab-demo</strong>
              </Typography>
              <Typography variant="body2" sx={{ color: "#697386", fontSize: "0.85rem", fontFamily: "monospace", mb: 1 }}>
                User: <strong style={{ color: "#3c4257" }}>admin2</strong> / <strong style={{ color: "#3c4257" }}>admin123</strong>
              </Typography>
              <Typography variant="caption" sx={{ color: "#8792a2", fontSize: "0.75rem", fontStyle: "italic" }}>
                For testing and demonstrations only
              </Typography>
            </Box>

            {/* Footer */}
            <Box sx={{ mt: 3, mb: 2, textAlign: "center" }}>
              <Typography variant="caption" sx={{ color: "#8792a2", fontSize: "0.75rem" }}>
                &copy; 2025 Smart Fleets. All rights reserved.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
