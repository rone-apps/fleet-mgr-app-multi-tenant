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
  Alert,
  Card,
  CardContent,
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

export default function ItemRatesTab({ canEdit, canDelete, setError, setSuccess, updateStats }) {
  const [rates, setRates] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    unitType: "MILEAGE",
    rate: "",
    chargedTo: "DRIVER",
    effectiveFrom: new Date(),
    notes: "",
  });

  // Load item rates on mount
  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/item-rates`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });
      if (!response.ok) throw new Error("Failed to load rates");
      const data = await response.json();
      setRates(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (rate = null) => {
    if (rate) {
      setEditing(rate.id);
      setFormData({
        name: rate.name,
        unitType: rate.unitType,
        rate: rate.rate.toString(),
        chargedTo: rate.chargedTo,
        effectiveFrom: new Date(rate.effectiveFrom),
        notes: rate.notes || "",
      });
    } else {
      setEditing(null);
      setFormData({
        name: "",
        unitType: "MILEAGE",
        rate: "",
        chargedTo: "DRIVER",
        effectiveFrom: new Date(),
        notes: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditing(null);
  };

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.rate) {
        setError("Name and rate are required");
        return;
      }

      const payload = {
        name: formData.name,
        unitType: formData.unitType,
        rate: parseFloat(formData.rate),
        chargedTo: formData.chargedTo,
        effectiveFrom: formData.effectiveFrom.toISOString().split("T")[0],
        notes: formData.notes,
      };

      const url = editing
        ? `${API_BASE_URL}/item-rates/${editing}`
        : `${API_BASE_URL}/item-rates`;

      const method = editing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save rate");

      setSuccess(editing ? "Rate updated successfully" : "Rate created successfully");
      handleCloseDialog();
      loadRates();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (rateId) => {
    if (!window.confirm("Are you sure you want to deactivate this rate?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/item-rates/${rateId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });

      if (!response.ok) throw new Error("Failed to delete rate");

      setSuccess("Rate deactivated successfully");
      loadRates();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Global Item Rates
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Define base per-unit expense rates (mileage, airport trips, etc.). These can be overridden per owner in the
        Item Rate Overrides tab.
      </Typography>

      {/* Action Button */}
      {canEdit && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ mb: 3 }}
        >
          Add Item Rate
        </Button>
      )}

      {/* Rates Table */}
      <TableContainer component={Card}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Unit Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Rate
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Charged To</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Effective From</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3, color: "text.secondary" }}>
                  No active rates found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              rates.map((rate) => (
                <TableRow key={rate.id} hover>
                  <TableCell>{rate.name}</TableCell>
                  <TableCell>{rate.unitTypeDisplay}</TableCell>
                  <TableCell align="right">${rate.rate}</TableCell>
                  <TableCell>{rate.chargedToDisplay}</TableCell>
                  <TableCell>{new Date(rate.effectiveFrom).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {rate.isActive ? (
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
                    {rate.isActive && canEdit && (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(rate)}
                          title="Edit (creates new version)"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(rate.id)}
                          title="Deactivate"
                        >
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

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Edit Item Rate (Creates New Version)" : "Add New Item Rate"}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Rate Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Per Mile Insurance"
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Unit Type</InputLabel>
            <Select
              value={formData.unitType}
              label="Unit Type"
              onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
            >
              <MenuItem value="MILEAGE">Mileage (miles driven)</MenuItem>
              <MenuItem value="AIRPORT_TRIP">Airport Trips</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Base Rate per Unit"
            type="number"
            inputProps={{ step: "0.01", min: "0" }}
            value={formData.rate}
            onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
            placeholder="e.g., 0.10"
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Charged To</InputLabel>
            <Select
              value={formData.chargedTo}
              label="Charged To"
              onChange={(e) => setFormData({ ...formData, chargedTo: e.target.value })}
            >
              <MenuItem value="DRIVER">Driver</MenuItem>
              <MenuItem value="OWNER">Owner</MenuItem>
            </Select>
          </FormControl>

          <DatePicker
            label="Effective From"
            value={formData.effectiveFrom}
            onChange={(newValue) => setFormData({ ...formData, effectiveFrom: newValue })}
            slotProps={{ textField: { fullWidth: true, sx: { mb: 2 } } }}
          />

          <TextField
            fullWidth
            label="Notes (Optional)"
            multiline
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="e.g., This is the default rate that can be overridden per owner"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editing ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
