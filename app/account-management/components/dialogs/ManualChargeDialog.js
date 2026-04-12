"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Grid,
  InputAdornment,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import { API_BASE_URL } from "../../../lib/api";

export default function ManualChargeDialog({
  open,
  onClose,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [cabs, setCabs] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    accountCustomerId: null,
    driverId: null,
    cabId: null,
    tripDate: new Date().toISOString().split("T")[0],
    startTime: "",
    endTime: "",
    fareAmount: "",
    notes: "",
  });

  // Load customers and drivers on mount
  useEffect(() => {
    if (open) {
      loadCustomersAndDrivers();
    }
  }, [open]);

  const loadCustomersAndDrivers = async () => {
    setLoadingData(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const tenantSchema = localStorage.getItem("tenantSchema");

      // Load customers
      const customersRes = await fetch(`${API_BASE_URL}/account-customers`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-Tenant-ID": tenantSchema,
        },
      });

      if (customersRes.ok) {
        const customersData = await customersRes.json();
        const sorted = customersData.sort((a, b) =>
          (a.accountId || "").localeCompare(b.accountId || "")
        );
        setCustomers(sorted);
      }

      // Load drivers
      const driversRes = await fetch(`${API_BASE_URL}/drivers`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-Tenant-ID": tenantSchema,
        },
      });

      if (driversRes.ok) {
        const driversData = await driversRes.json();
        const sorted = driversData.sort((a, b) => {
          const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
          const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setDrivers(sorted);
      }

      // Load cabs
      const cabsRes = await fetch(`${API_BASE_URL}/cabs`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-Tenant-ID": tenantSchema,
        },
      });

      if (cabsRes.ok) {
        const cabsData = await cabsRes.json();
        const sorted = cabsData.sort((a, b) =>
          (a.cabNumber || "").localeCompare(b.cabNumber || "")
        );
        setCabs(sorted);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load customers, drivers, and cabs");
    } finally {
      setLoadingData(false);
    }
  };

  const handleClose = () => {
    setFormData({
      accountCustomerId: null,
      driverId: null,
      cabId: null,
      tripDate: new Date().toISOString().split("T")[0],
      startTime: "",
      endTime: "",
      fareAmount: "",
      notes: "",
    });
    setError("");
    onClose();
  };

  const handleSubmit = async () => {
    setError("");

    // Validate required fields
    if (!formData.accountCustomerId) {
      setError("Customer is required");
      return;
    }
    if (!formData.driverId) {
      setError("Driver is required");
      return;
    }
    if (!formData.cabId) {
      setError("Cab is required");
      return;
    }
    if (!formData.tripDate) {
      setError("Date is required");
      return;
    }
    if (!formData.fareAmount || parseFloat(formData.fareAmount) <= 0) {
      setError("Fare amount must be greater than 0");
      return;
    }
    if (!formData.notes || formData.notes.trim().length < 5) {
      setError("Notes/reason must be at least 5 characters");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const tenantSchema = localStorage.getItem("tenantSchema");

      const chargePayload = {
        accountCustomer: { id: formData.accountCustomerId.id },
        accountId: formData.accountCustomerId.accountId,
        driver: { id: formData.driverId.id },
        cab: { id: formData.cabId.id },
        tripDate: formData.tripDate,
        startTime: formData.startTime || null,
        endTime: formData.endTime || null,
        fareAmount: parseFloat(formData.fareAmount),
        notes: formData.notes,
      };

      const response = await fetch(`${API_BASE_URL}/account-charges/manual`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-Tenant-ID": tenantSchema,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chargePayload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Manual charge created:", result);
        if (onSuccess) {
          onSuccess();
        }
        handleClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to create charge");
      }
    } catch (err) {
      console.error("Error creating charge:", err);
      setError("Failed to create charge. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Manual Charge</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Warning Alert */}
          <Alert severity="warning">
            This is a MANUAL charge entry. It will be flagged as manually created and your username will be recorded.
          </Alert>

          {error && (
            <Alert severity="error" onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {loadingData ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={30} />
            </Box>
          ) : (
            <>
              {/* Customer Autocomplete */}
              <Autocomplete
                options={customers}
                getOptionLabel={(option) =>
                  `${option.accountId} - ${option.companyName}`
                }
                value={formData.accountCustomerId}
                onChange={(e, newValue) => {
                  setFormData({ ...formData, accountCustomerId: newValue });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Customer"
                    placeholder="Search by account ID or name"
                    required
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                disabled={loading}
              />

              {/* Driver Autocomplete */}
              <Autocomplete
                options={drivers}
                getOptionLabel={(option) =>
                  `${option.driverNumber} - ${option.firstName} ${option.lastName}`
                }
                value={formData.driverId}
                onChange={(e, newValue) => {
                  setFormData({ ...formData, driverId: newValue });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Driver"
                    placeholder="Search by number or name"
                    required
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                disabled={loading}
              />

              {/* Cab Autocomplete */}
              <Autocomplete
                options={cabs}
                getOptionLabel={(option) =>
                  `${option.cabNumber} - ${option.cabType}`
                }
                value={formData.cabId}
                onChange={(e, newValue) => {
                  setFormData({ ...formData, cabId: newValue });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Cab"
                    placeholder="Search by cab number"
                    required
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                disabled={loading}
              />

              {/* Date field */}
              <TextField
                label="Date"
                type="date"
                value={formData.tripDate}
                onChange={(e) => setFormData({ ...formData, tripDate: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                disabled={loading}
              />

              {/* Time range */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="From Time"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="To Time"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    disabled={loading}
                  />
                </Grid>
              </Grid>

              {/* Fare Amount */}
              <TextField
                label="Fare Amount"
                type="number"
                value={formData.fareAmount}
                onChange={(e) => setFormData({ ...formData, fareAmount: e.target.value })}
                fullWidth
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                inputProps={{ step: "0.01", min: "0" }}
                disabled={loading}
              />

              {/* Notes / Reason */}
              <TextField
                label="Notes / Reason (Required)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                fullWidth
                multiline
                rows={3}
                placeholder="Explain why this charge is being added manually..."
                helperText="Minimum 5 characters"
                required
                disabled={loading}
              />
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || loadingData}
        >
          {loading ? "Creating..." : "Create Charge"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
