"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Paper, Alert } from "@mui/material";
import GlobalNav from "../components/GlobalNav";
import { getCurrentUser, isAuthenticated } from "../lib/api";
import { useRouter } from "next/navigation";
import MerchantMappingsTab from "../financial-setup/tabs/MerchantMappingsTab";

export default function MerchantMappingsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [stats, setStats] = useState({ merchantMappings: 0 });
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/");
      return;
    }
    const user = getCurrentUser();
    if (!user || !["ADMIN", "MANAGER"].includes(user.role)) {
      router.push("/");
      return;
    }
    setCurrentUser(user);
  }, [router]);

  const canEdit = currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER";
  const canDelete = currentUser?.role === "ADMIN";

  const updateStats = (newStats) => {
    setStats((prev) => ({ ...prev, ...newStats }));
  };

  if (!currentUser) return null;

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
      <GlobalNav currentUser={currentUser} title="Smart Fleets - Merchant Mappings" />

      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: "#1a1a2e" }}>
          Merchant to Cab Mappings
        </Typography>
        <Typography variant="body1" sx={{ color: "#697386", mb: 3 }}>
          Map payment processor merchants to cabs and shifts for transaction routing
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
            {success}
          </Alert>
        )}

        <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid #e5e7eb", p: 3 }}>
          <MerchantMappingsTab
            canEdit={canEdit}
            canDelete={canDelete}
            setError={setError}
            setSuccess={setSuccess}
            updateStats={updateStats}
          />
        </Paper>
      </Box>
    </Box>
  );
}
