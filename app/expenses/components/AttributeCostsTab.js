import { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, FormControl, InputLabel, Select, IconButton, Chip, Alert,
  Grid,
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Info as InfoIcon, Calculate as CalculateIcon, AttachMoney as AttachMoneyIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import { API_BASE_URL } from "../../lib/api";
import ShiftChargesCalculator from "./ShiftChargesCalculator";

export default function AttributeCostsTab({ canEdit }) {
  const [attributeCosts, setAttributeCosts] = useState([]);
  const [attributeTypes, setAttributeTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [openDialog, setOpenDialog] = useState(false);
  const [openCalculator, setOpenCalculator] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    attributeTypeId: "",
    price: "",
    billingUnit: "MONTHLY",
    effectiveFrom: new Date().toISOString().split("T")[0],
    effectiveTo: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadAttributeCosts(), loadAttributeTypes()]);
    } finally {
      setLoading(false);
    }
  };

  const loadAttributeCosts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/attribute-costs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAttributeCosts(data);
      }
    } catch (err) {
      console.error("Error loading attribute costs:", err);
      setError("Failed to load attribute costs");
    }
  };

  const loadAttributeTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cab-attribute-types`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAttributeTypes(data);
      }
    } catch (err) {
      console.error("Error loading attribute types:", err);
    }
  };

  const handleOpenDialog = (cost = null) => {
    if (cost) {
      setEditing(cost);
      setFormData({
        attributeTypeId: cost.attributeTypeId,
        price: cost.price,
        billingUnit: cost.billingUnit,
        effectiveFrom: cost.effectiveFrom,
        effectiveTo: cost.effectiveTo || "",
      });
    } else {
      setEditing(null);
      setFormData({
        attributeTypeId: "",
        price: "",
        billingUnit: "MONTHLY",
        effectiveFrom: new Date().toISOString().split("T")[0],
        effectiveTo: "",
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
      if (!formData.attributeTypeId || !formData.price || !formData.effectiveFrom) {
        setError("Please fill in all required fields");
        return;
      }

      const url = editing
        ? `${API_BASE_URL}/attribute-costs/${editing.id}`
        : `${API_BASE_URL}/attribute-costs`;

      const response = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(editing ? "Attribute cost updated successfully" : "Attribute cost created successfully");
        handleCloseDialog();
        loadAttributeCosts();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save attribute cost");
      }
    } catch (err) {
      console.error("Error saving attribute cost:", err);
      setError("Failed to save attribute cost");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this attribute cost?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/attribute-costs/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        });

        if (response.ok) {
          setSuccess("Attribute cost deleted successfully");
          loadAttributeCosts();
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Failed to delete attribute cost");
        }
      } catch (err) {
        console.error("Error deleting attribute cost:", err);
        setError("Failed to delete attribute cost");
      }
    }
  };

  const handleEnd = async (id) => {
    const endDate = prompt("Enter end date (YYYY-MM-DD):", new Date().toISOString().split("T")[0]);
    if (!endDate) return;

    try {
      const response = await fetch(`${API_BASE_URL}/attribute-costs/${id}/end?endDate=${endDate}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });

      if (response.ok) {
        setSuccess("Attribute cost ended successfully");
        loadAttributeCosts();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to end attribute cost");
      }
    } catch (err) {
      console.error("Error ending attribute cost:", err);
      setError("Failed to end attribute cost");
    }
  };

  const handleCreateExpenses = async (costId, attributeName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/attribute-costs/${costId}/create-expenses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(
          `Created ${data.result.expensesCreated} expenses for ${data.result.totalMatchingShifts} shifts with ${attributeName}`
        );
        loadAttributeCosts();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create expenses");
      }
    } catch (err) {
      console.error("Error creating expenses:", err);
      setError("Failed to create expenses for attribute cost");
    }
  };

  const getAttributeName = (attributeTypeId) => {
    const attr = attributeTypes.find(a => a.id === attributeTypeId);
    return attr ? attr.attributeName : "-";
  };

  return (
    <Box sx={{ p: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}

      <Alert severity="info" sx={{ mb: 2 }}>
        <InfoIcon sx={{ mr: 1, verticalAlign: "middle" }} />
        Define costs for shift attributes. Not all attributes need pricing. Shifts with these attributes will be automatically charged based on the rules defined here.
      </Alert>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={5}>
          {canEdit && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              Add Attribute Cost
            </Button>
          )}
        </Grid>
        <Grid item xs={12} sm={5.5}>
          <Button
            variant="outlined"
            startIcon={<CalculateIcon />}
            onClick={() => setOpenCalculator(true)}
            fullWidth
          >
            Calculate Shift Charges
          </Button>
        </Grid>
        <Grid item xs={12} sm={1.5}>
          <Button variant="outlined" onClick={loadAttributeCosts} fullWidth sx={{ height: '100%', minWidth: 'auto', px: 1 }}>
            <RefreshIcon />
          </Button>
        </Grid>
      </Grid>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell>Attribute</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Billing Unit</TableCell>
              <TableCell>Effective From</TableCell>
              <TableCell>Effective To</TableCell>
              <TableCell>Status</TableCell>
              {canEdit && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {attributeCosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 7 : 6} align="center">
                  <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                    No attribute costs defined yet
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              attributeCosts.map((cost) => (
                <TableRow key={cost.id} sx={{ "&:hover": { backgroundColor: "#f9f9f9" } }}>
                  <TableCell>
                    <Chip label={cost.attributeName} size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      ${parseFloat(cost.price).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={cost.billingUnit} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{cost.effectiveFrom}</TableCell>
                  <TableCell>{cost.effectiveTo || "Ongoing"}</TableCell>
                  <TableCell>
                    <Chip
                      label={cost.isCurrentlyActive ? "Active" : "Inactive"}
                      size="small"
                      color={cost.isCurrentlyActive ? "success" : "default"}
                    />
                  </TableCell>
                  {canEdit && (
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenDialog(cost)} title="Edit">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      {cost.isCurrentlyActive && (
                        <IconButton
                          size="small"
                          onClick={() => handleCreateExpenses(cost.id, cost.attributeName)}
                          title="Create expenses for shifts with this attribute"
                          color="success"
                        >
                          <AttachMoneyIcon fontSize="small" />
                        </IconButton>
                      )}
                      {!cost.effectiveTo && (
                        <IconButton
                          size="small"
                          onClick={() => handleEnd(cost.id)}
                          title="End this cost"
                          color="warning"
                        >
                          ⏹
                        </IconButton>
                      )}
                      <IconButton size="small" onClick={() => handleDelete(cost.id)} color="error" title="Delete">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Edit Attribute Cost" : "Add Attribute Cost"}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth required disabled={editing}>
                <InputLabel>Attribute</InputLabel>
                <Select
                  value={formData.attributeTypeId}
                  onChange={(e) => setFormData({ ...formData, attributeTypeId: e.target.value })}
                  label="Attribute"
                >
                  {attributeTypes.map((attr) => (
                    <MenuItem key={attr.id} value={attr.id}>
                      {attr.attributeName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                fullWidth
                required
                inputProps={{ step: "0.01", min: "0" }}
              />
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>Billing Unit</InputLabel>
                <Select
                  value={formData.billingUnit}
                  onChange={(e) => setFormData({ ...formData, billingUnit: e.target.value })}
                  label="Billing Unit"
                >
                  <MenuItem value="MONTHLY">Monthly</MenuItem>
                  <MenuItem value="DAILY">Daily</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Effective From"
                type="date"
                value={formData.effectiveFrom}
                onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                fullWidth
                required
                disabled={editing}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Effective To (optional)"
                type="date"
                value={formData.effectiveTo}
                onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {editing ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Shift Charges Calculator Dialog */}
      <ShiftChargesCalculator open={openCalculator} onClose={() => setOpenCalculator(false)} />
    </Box>
  );
}
