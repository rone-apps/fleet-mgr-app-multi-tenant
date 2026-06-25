"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { isTokenExpired } from "../lib/api";
import { useIdleTimeout } from "../hooks/useIdleTimeout";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";

const PUBLIC_PATHS = ["/signin", "/signup", "/forgot-password", "/"];

/**
 * AuthGuard - Client-side authentication protection
 *
 * 1. Checks token validity on every route change
 * 2. Periodically checks token expiry (every 30 seconds)
 * 3. Intercepts all fetch() 401 responses and redirects to signin
 * 4. Auto-logout after 5 minutes of inactivity (with 1-minute warning)
 *
 * Placed in the root layout to protect ALL pages globally.
 */
export default function AuthGuard({ children }) {
  const pathname = usePathname();
  const interceptorInstalled = useRef(false);
  const [showIdleWarning, setShowIdleWarning] = useState(false);

  // Redirect to signin, clearing all auth state
  const redirectToSignin = () => {
    // Prevent redirect loops
    if (window.location.pathname === "/signin") return;

    localStorage.clear();
    sessionStorage.clear();
    document.cookie = "token=; path=/; max-age=0; SameSite=Strict";
    document.cookie = "tenantId=; path=/; max-age=0; SameSite=Strict";
    window.location.replace("/signin");
  };

  // Check if current token is valid
  const checkAuth = () => {
    if (PUBLIC_PATHS.includes(pathname)) return;

    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      redirectToSignin();
    }
  };

  // Check auth on route changes
  useEffect(() => {
    checkAuth();
  }, [pathname]);

  // Periodic token check (every 30 seconds)
  useEffect(() => {
    if (PUBLIC_PATHS.includes(pathname)) return;

    const interval = setInterval(checkAuth, 30000);
    return () => clearInterval(interval);
  }, [pathname]);

  // Idle timeout - only active on protected pages
  const isProtectedPage = !PUBLIC_PATHS.includes(pathname);

  // Show warning 1 minute before auto-logout
  const handleIdleWarning = () => {
    if (isProtectedPage) {
      setShowIdleWarning(true);
    }
  };

  // Dismiss warning and reset idle timer (user is still active)
  const dismissWarning = () => {
    setShowIdleWarning(false);
    // Timer will auto-reset on user interaction (handled by useIdleTimeout)
  };

  // Use idle timeout hook - 5 minutes idle = auto logout
  // Only enabled on protected pages
  useIdleTimeout(5, handleIdleWarning, isProtectedPage);

  // Global fetch interceptor — catches 401 from ANY fetch call
  useEffect(() => {
    if (interceptorInstalled.current) return;
    interceptorInstalled.current = true;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      // If server responds 401, token is invalid/expired
      if (response.status === 401) {
        const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
        // Only intercept API calls, not external requests
        if (url.includes("/api/")) {
          console.warn("401 received from API, redirecting to login...");
          redirectToSignin();
        }
      }

      return response;
    };

    // Cleanup: restore original fetch on unmount (unlikely for root layout)
    return () => {
      window.fetch = originalFetch;
      interceptorInstalled.current = false;
    };
  }, []);

  return (
    <>
      {children}

      {/* Idle Warning Dialog */}
      <Dialog
        open={showIdleWarning}
        onClose={dismissWarning}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#fff3e0', color: '#e65100' }}>
          ⚠️ Session Timeout Warning
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography>
            You've been inactive for 4 minutes. Your session will automatically logout in{' '}
            <strong>1 minute</strong> for security.
          </Typography>
          <Typography sx={{ mt: 2 }} variant="body2" color="text.secondary">
            Click "Stay Logged In" or move your mouse to remain active.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={dismissWarning} variant="contained" color="primary" autoFocus>
            Stay Logged In
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
