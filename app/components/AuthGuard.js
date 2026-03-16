"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { isTokenExpired } from "../lib/api";

const PUBLIC_PATHS = ["/signin", "/signup", "/forgot-password", "/"];

/**
 * AuthGuard - Client-side authentication protection
 *
 * 1. Checks token validity on every route change
 * 2. Periodically checks token expiry (every 30 seconds)
 * 3. Intercepts all fetch() 401 responses and redirects to signin
 *
 * Placed in the root layout to protect ALL pages globally.
 */
export default function AuthGuard({ children }) {
  const pathname = usePathname();
  const interceptorInstalled = useRef(false);

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

  return children;
}
