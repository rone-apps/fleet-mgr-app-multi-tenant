"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Alert } from "@mui/material";
import GlobalNav from "../components/GlobalNav";
import { getCurrentUser, apiRequest } from "../lib/api";
import { DriverTripsTab } from "../account-management/components/tabs";

export default function DriverTripsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [cabs, setCabs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState("");
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user) {
      const role = user.role || "";
      setCanEdit(["ADMIN", "MANAGER"].includes(role));
    }
    fetchLookupData();
  }, []);

  const fetchLookupData = async () => {
    try {
      const [cabsRes, driversRes, customersRes] = await Promise.all([
        apiRequest("/cabs").then((r) => r.json()),
        apiRequest("/drivers").then((r) => r.json()),
        apiRequest("/account-customers").then((r) => r.json()),
      ]);
      setCabs(Array.isArray(cabsRes) ? cabsRes : []);
      setDrivers(Array.isArray(driversRes) ? driversRes : []);
      setCustomers(Array.isArray(customersRes) ? customersRes : []);
    } catch (err) {
      console.error("Failed to load lookup data:", err);
      setError("Failed to load lookup data");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
      <GlobalNav currentUser={currentUser} title="Trip Management" />
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: "#3e5244" }}>
            Trip Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Browse driver trips and associate account charges
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <DriverTripsTab
          cabs={cabs}
          drivers={drivers}
          customers={customers}
          canEdit={canEdit}
        />
      </Box>
    </Box>
  );
}
