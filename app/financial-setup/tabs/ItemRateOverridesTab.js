"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Paper,
  Grid,
  Tabs,
  Tab,
  FormControlLabel,
  Checkbox,
  Alert,
  AlertTitle,
  Autocomplete,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { API_BASE_URL } from "../../lib/api";

export default function ItemRateOverridesTab({ canEdit, canDelete, setError, setSuccess, updateStats }) {
  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState("");
  const [ownerCabs, setOwnerCabs] = useState([]);
  const [baseRates, setBaseRates] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [openDeleteWarning, setOpenDeleteWarning] = useState(false);
  const [deleteWarningData, setDeleteWarningData] = useState({ info: "" });

  const [openOverrideDialog, setOpenOverrideDialog] = useState(false);
  const [editingOverride, setEditingOverride] = useState(null);
  const [overrideTabValue, setOverrideTabValue] = useState(0);
  const [overrideFormData, setOverrideFormData] = useState({
    itemRateId: "",
    cabNumber: "",
    shiftType: "",
    dayOfWeek: "",
    overrideRate: "",
    startDate: new Date(),
    endDate: null,
    notes: "",
  });
  const [bulkOverrideFormData, setBulkOverrideFormData] = useState({
    itemRateId: "",
    cabNumber: "",
    shiftType: "",
    daysOfWeek: [],
    overrideRate: "",
    startDate: new Date(),
    endDate: null,
    notes: "",
  });

  const daysOfWeek = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

  useEffect(() => {
    loadOwners();
    loadBaseRates();
  }, []);

  useEffect(() => {
    if (selectedOwner) {
      loadOverrides(selectedOwner);
      // Find the owner object and use its id to load cabs
      const owner = owners.find((o) => o.driverNumber === selectedOwner);
      if (owner) {
        loadOwnerCabs(owner.id);
      }
    } else {
      setOwnerCabs([]);
    }
  }, [selectedOwner]);

  const loadOwners = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/drivers`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });
      if (response.ok) {
        const data = await response.json();
        const ownerDrivers = data.filter((d) => d.isOwner);
        setOwners(ownerDrivers);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const loadBaseRates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/item-rates`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBaseRates(data);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const loadOverrides = async (ownerDriverNumber) => {
    try {
      const response = await fetch(`${API_BASE_URL}/item-rates/overrides/${ownerDriverNumber}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setOverrides(data);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const loadOwnerCabs = async (ownerId) => {
    if (!ownerId) {
      setOwnerCabs([]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/shifts/owner/${ownerId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });
      if (response.ok) {
        const shiftsData = await response.json();
        // Extract unique cabs from shifts
        const uniqueCabNumbers = [...new Set(shiftsData.map((s) => s.cabNumber))].filter(Boolean);
        const cabs = uniqueCabNumbers.map((cabNumber) => {
          const shift = shiftsData.find((s) => s.cabNumber === cabNumber);
          return {
            cabNumber,
            cabType: shift?.cabType,
            hasAirportLicense: shift?.hasAirportLicense,
          };
        });
        setOwnerCabs(cabs);
      } else {
        setOwnerCabs([]);
      }
    } catch (err) {
      console.error("Failed to load owner cabs:", err);
      setOwnerCabs([]);
    }
  };

  const handleOpenDialog = (override = null) => {
    setOverrideTabValue(0);
    if (override) {
      setEditingOverride(override);
      setOverrideFormData({
        itemRateId: override.itemRateId.toString(),
        cabNumber: override.cabNumber || "",
        shiftType: override.shiftType || "",
        dayOfWeek: override.dayOfWeek || "",
        overrideRate: override.overrideRate.toString(),
        startDate: new Date(override.startDate),
        endDate: override.endDate ? new Date(override.endDate) : null,
        notes: override.notes || "",
      });
    } else {
      setEditingOverride(null);
      setOverrideFormData({
        itemRateId: "",
        cabNumber: "",
        shiftType: "",
        dayOfWeek: "",
        overrideRate: "",
        startDate: new Date(),
        endDate: null,
        notes: "",
      });
      setBulkOverrideFormData({
        itemRateId: "",
        cabNumber: "",
        shiftType: "",
        daysOfWeek: [],
        overrideRate: "",
        startDate: new Date(),
        endDate: null,
        notes: "",
      });
    }
    setOpenOverrideDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenOverrideDialog(false);
    setEditingOverride(null);
  };

  const handleSave = async () => {
    try {
      if (!selectedOwner) {
        setError("Please select an owner");
        return;
      }

      if (!overrideFormData.itemRateId || !overrideFormData.overrideRate) {
        setError("Item Rate and Override Rate are required");
        return;
      }

      const payload = {
        itemRateId: parseInt(overrideFormData.itemRateId),
        ownerDriverNumber: selectedOwner,
        cabNumber: overrideFormData.cabNumber || null,
        shiftType: overrideFormData.shiftType || null,
        dayOfWeek: overrideFormData.dayOfWeek || null,
        overrideRate: parseFloat(overrideFormData.overrideRate),
        startDate: overrideFormData.startDate.toISOString().split("T")[0],
        endDate: overrideFormData.endDate ? overrideFormData.endDate.toISOString().split("T")[0] : null,
        notes: overrideFormData.notes,
      };

      const url = editingOverride
        ? `${API_BASE_URL}/item-rates/overrides/${editingOverride.id}`
        : `${API_BASE_URL}/item-rates/overrides`;

      const method = editingOverride ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save override");

      setSuccess(editingOverride ? "Override updated successfully" : "Override created successfully");
      handleCloseDialog();
      loadOverrides(selectedOwner);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (overrideId) => {
    setOpenDeleteWarning(true);
    setDeleteWarningData({
      id: overrideId,
      info: "Are you sure you want to deactivate this override?",
    });
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/item-rates/overrides/${deleteWarningData.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });

      if (!response.ok) throw new Error("Failed to delete override");

      setSuccess("Override deactivated successfully");
      setOpenDeleteWarning(false);
      loadOverrides(selectedOwner);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Item Rate Overrides
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Override base item rates for specific owners. Define overrides for particular cabs, shifts, days, and date
        ranges.
      </Typography>

      {/* Owner Selector */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Autocomplete
          options={owners}
          getOptionLabel={(owner) => `${owner.fullName} (${owner.driverNumber})`}
          value={owners.find((o) => o.driverNumber === selectedOwner) || null}
          onChange={(e, owner) => setSelectedOwner(owner?.driverNumber || "")}
          renderInput={(params) => <TextField {...params} label="Select Owner" />}
          isOptionEqualToValue={(option, value) => option.driverNumber === value.driverNumber}
        />
      </Paper>

      {/* Action Button */}
      {canEdit && selectedOwner && (
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ bgcolor: "secondary.main" }}
          >
            + NEW OVERRIDE
          </Button>
        </Box>
      )}

      {/* Overrides Table */}
      {selectedOwner && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: 700 }}>Item Rate</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Cab #</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Shift</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Day</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Override Rate
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Priority
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date Range</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {overrides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3, color: "text.secondary" }}>
                    No overrides found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                overrides.map((override) => (
                  <TableRow key={override.id} hover>
                    <TableCell>{override.itemRateName}</TableCell>
                    <TableCell>{override.cabNumber || "All cabs"}</TableCell>
                    <TableCell>{override.shiftType || "All shifts"}</TableCell>
                    <TableCell>{override.dayOfWeek || "All days"}</TableCell>
                    <TableCell align="right">${override.overrideRate}</TableCell>
                    <TableCell align="right">
                      <Chip label={override.priority} size="small" />
                    </TableCell>
                    <TableCell>
                      {new Date(override.startDate).toLocaleDateString()}
                      {override.endDate && ` - ${new Date(override.endDate).toLocaleDateString()}`}
                    </TableCell>
                    <TableCell>
                      {override.isActive ? (
                        <Chip
                          icon={<ActiveIcon />}
                          label="Active"
                          color="success"
                          variant="outlined"
                          size="small"
                        />
                      ) : (
                        <Chip
                          icon={<InactiveIcon />}
                          label="Inactive"
                          variant="outlined"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {override.isActive && canEdit && (
                        <>
                          <IconButton size="small" onClick={() => handleOpenDialog(override)} title="Edit">
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDelete(override.id)} title="Deactivate">
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Override Dialog */}
      <Dialog open={openOverrideDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: "secondary.light" }}>
          {editingOverride ? "Edit Override" : "Create New Override"}
        </DialogTitle>
        <DialogContent>
          <Tabs value={overrideTabValue} onChange={(e, v) => setOverrideTabValue(v)} sx={{ mb: 3, mt: 1 }}>
            <Tab label="Single Override" />
            <Tab label="Bulk Create" disabled={!!editingOverride} />
          </Tabs>

          {overrideTabValue === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Item Rate</InputLabel>
                  <Select
                    value={overrideFormData.itemRateId}
                    onChange={(e) => setOverrideFormData({ ...overrideFormData, itemRateId: e.target.value })}
                    label="Item Rate"
                  >
                    {baseRates.map((rate) => (
                      <MenuItem key={rate.id} value={rate.id}>
                        {rate.name} (${rate.rate})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Override Rate"
                  type="number"
                  value={overrideFormData.overrideRate}
                  onChange={(e) =>
                    setOverrideFormData({ ...overrideFormData, overrideRate: e.target.value })
                  }
                  InputProps={{ startAdornment: "$" }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Cab Number</InputLabel>
                  <Select
                    value={overrideFormData.cabNumber}
                    onChange={(e) =>
                      setOverrideFormData({ ...overrideFormData, cabNumber: e.target.value })
                    }
                    label="Cab Number"
                  >
                    <MenuItem value="">All Cabs</MenuItem>
                    {ownerCabs.map((cab) => (
                      <MenuItem key={cab.cabNumber} value={cab.cabNumber}>
                        {cab.cabNumber}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Shift Type</InputLabel>
                  <Select
                    value={overrideFormData.shiftType}
                    onChange={(e) =>
                      setOverrideFormData({ ...overrideFormData, shiftType: e.target.value })
                    }
                    label="Shift Type"
                  >
                    <MenuItem value="">All Shifts</MenuItem>
                    <MenuItem value="DAY">DAY</MenuItem>
                    <MenuItem value="NIGHT">NIGHT</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Day of Week</InputLabel>
                  <Select
                    value={overrideFormData.dayOfWeek}
                    onChange={(e) =>
                      setOverrideFormData({ ...overrideFormData, dayOfWeek: e.target.value })
                    }
                    label="Day of Week"
                  >
                    <MenuItem value="">All Days</MenuItem>
                    {daysOfWeek.map((day) => (
                      <MenuItem key={day} value={day}>
                        {day}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Start Date"
                  value={overrideFormData.startDate}
                  onChange={(date) => setOverrideFormData({ ...overrideFormData, startDate: date })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="End Date (Optional)"
                  value={overrideFormData.endDate}
                  onChange={(date) => setOverrideFormData({ ...overrideFormData, endDate: date })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={overrideFormData.notes}
                  onChange={(e) => setOverrideFormData({ ...overrideFormData, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          )}

          {overrideTabValue === 1 && (
            <Alert severity="info">
              <AlertTitle>Bulk Create Coming Soon</AlertTitle>
              Use Single Override tab to create individual overrides for now.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>CANCEL</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: "secondary.main" }}>
            {editingOverride ? "UPDATE" : "CREATE"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Warning Dialog */}
      <Dialog open={openDeleteWarning} onClose={() => setOpenDeleteWarning(false)}>
        <DialogTitle>Confirm Deactivation</DialogTitle>
        <DialogContent>
          <Typography>{deleteWarningData.info}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteWarning(false)}>CANCEL</Button>
          <Button onClick={confirmDelete} variant="contained" color="error">
            DEACTIVATE
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
