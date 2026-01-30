"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GlobalNav from "../../components/GlobalNav";
import {
  Box,
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Card,
  CardContent,
  Grid,
  Autocomplete,
  InputAdornment,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  Add,
  Edit,
  Close,
  CheckCircle,
  Block,
  History,
  CalendarToday,
} from "@mui/icons-material";
import { getCurrentUser, isAuthenticated, API_BASE_URL } from "../../lib/api";

export default function CabAttributesPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [cabs, setCabs] = useState([]);
  const [selectedCab, setSelectedCab] = useState(null);
  const [attributeTypes, setAttributeTypes] = useState([]);
  const [currentAttributes, setCurrentAttributes] = useState([]);
  const [attributeHistory, setAttributeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("assign");
  const [editingAttribute, setEditingAttribute] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const [formData, setFormData] = useState({
    attributeTypeId: "",
    attributeValue: "",
    startDate: "",
    endDate: "",
    notes: "",
  });

  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/signin");
      return;
    }

    const user = getCurrentUser();
    setCurrentUser(user);

    // Only ADMIN and MANAGER can manage cab attributes
    if (!["ADMIN", "MANAGER"].includes(user?.role)) {
      router.push("/");
      return;
    }

    loadCabs();
    loadAttributeTypes();
  }, [router]);

  const loadCabs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cabs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });

      if (!response.ok) throw new Error("Failed to load cabs");
      const data = await response.json();
      setCabs(data.sort((a, b) => parseInt(a.cabNumber.replace(/\D/g, '')) - parseInt(b.cabNumber.replace(/\D/g, ''))));
    } catch (err) {
      console.error("Error loading cabs:", err);
      setError("Failed to load cabs");
    }
  };

  const loadAttributeTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cab-attribute-types/active`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });

      if (!response.ok) throw new Error("Failed to load attribute types");
      const data = await response.json();
      setAttributeTypes(data);
    } catch (err) {
      console.error("Error loading attribute types:", err);
      setError("Failed to load attribute types");
    } finally {
      setLoading(false);
    }
  };

  const loadCabAttributes = async (cabId) => {
    try {
      // Load current attributes
      const currentRes = await fetch(
        `${API_BASE_URL}/cabs/${cabId}/attributes/current`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }
      );

      if (currentRes.ok) {
        setCurrentAttributes(await currentRes.json());
      }

      // Load history
      const historyRes = await fetch(
        `${API_BASE_URL}/cabs/${cabId}/attributes/history`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }
      );

      if (historyRes.ok) {
        setAttributeHistory(await historyRes.json());
      }
    } catch (err) {
      console.error("Error loading cab attributes:", err);
      setError("Failed to load attributes for this cab");
    }
  };

  const handleCabSelect = (event, cab) => {
    setSelectedCab(cab);
    if (cab) {
      loadCabAttributes(cab.id);
    }
    setError("");
    setSuccess("");
  };

  const handleOpenDialog = (mode, attribute = null) => {
    setDialogMode(mode);
    setEditingAttribute(attribute);

    if (mode === "assign") {
      setFormData({
        attributeTypeId: "",
        attributeValue: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        notes: "",
      });
    } else if (attribute) {
      setFormData({
        attributeTypeId: attribute.attributeTypeId,
        attributeValue: attribute.attributeValue || "",
        startDate: attribute.startDate,
        endDate: attribute.endDate || "",
        notes: attribute.notes || "",
      });
    }

    setError("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAttribute(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async () => {
    if (!selectedCab) {
      setError("Please select a cab first");
      return;
    }

    if (!formData.attributeTypeId) {
      setError("Please select an attribute type");
      return;
    }

    if (!formData.startDate) {
      setError("Start date is required");
      return;
    }

    try {
      const url =
        dialogMode === "assign"
          ? `${API_BASE_URL}/cabs/${selectedCab.id}/attributes`
          : `${API_BASE_URL}/cabs/${selectedCab.id}/attributes/${editingAttribute.id}`;

      const method = dialogMode === "assign" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
        body: JSON.stringify({
          attributeTypeId: parseInt(formData.attributeTypeId),
          attributeValue: formData.attributeValue || null,
          startDate: formData.startDate,
          endDate: formData.endDate || null,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save");
      }

      setSuccess(
        `Attribute ${dialogMode === "assign" ? "assigned" : "updated"} successfully`
      );
      handleCloseDialog();
      loadCabAttributes(selectedCab.id);
    } catch (err) {
      console.error("Error saving attribute:", err);
      setError(err.message || "Failed to save attribute");
    }
  };

  const handleEndAttribute = async (attributeId) => {
    if (!window.confirm("End this attribute assignment?")) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/cabs/${selectedCab.id}/attributes/${attributeId}/end`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
          body: JSON.stringify({
            endDate: new Date().toISOString().split("T")[0],
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to end attribute");

      setSuccess("Attribute assignment ended");
      loadCabAttributes(selectedCab.id);
    } catch (err) {
      console.error("Error ending attribute:", err);
      setError("Failed to end attribute");
    }
  };

  const handleDelete = async (attributeId) => {
    if (!window.confirm("Delete this attribute assignment?")) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/cabs/${selectedCab.id}/attributes/${attributeId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }
      );

      if (!response.ok) throw new Error("Failed to delete");

      setSuccess("Attribute deleted successfully");
      loadCabAttributes(selectedCab.id);
    } catch (err) {
      console.error("Error deleting:", err);
      setError("Failed to delete attribute");
    }
  };

  const getAttributeType = (typeId) => {
    return attributeTypes.find((t) => t.id === typeId);
  };

  const getTodayDate = () => new Date().toISOString().split("T")[0];

  if (!currentUser) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
      <GlobalNav currentUser={currentUser} title="FareFlow - Cab Attributes" />

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {success && (
          <Alert severity="success" onClose={() => setSuccess("")} sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Cab Selection */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Select a Cab
          </Typography>
          <Autocomplete
            options={cabs}
            getOptionLabel={(cab) => `${cab.cabNumber} - ${cab.registrationNumber}`}
            value={selectedCab}
            onChange={handleCabSelect}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search and select a cab"
                placeholder="CAB-001, Registration..."
              />
            )}
          />
        </Paper>

        {selectedCab ? (
          <>
            {/* Cab Info Card */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography color="textSecondary" gutterBottom>
                      Cab Number
                    </Typography>
                    <Typography variant="h6">{selectedCab.cabNumber}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography color="textSecondary" gutterBottom>
                      Registration
                    </Typography>
                    <Typography variant="h6">
                      {selectedCab.registrationNumber}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography color="textSecondary" gutterBottom>
                      Make/Model
                    </Typography>
                    <Typography variant="h6">
                      {selectedCab.make} {selectedCab.model}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography color="textSecondary" gutterBottom>
                      Status
                    </Typography>
                    <Chip
                      label={selectedCab.status}
                      color={
                        selectedCab.status === "ACTIVE"
                          ? "success"
                          : selectedCab.status === "MAINTENANCE"
                          ? "warning"
                          : "error"
                      }
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Tabs for Current & History */}
            <Box sx={{ mb: 3 }}>
              <Button
                variant={!showHistory ? "contained" : "outlined"}
                onClick={() => setShowHistory(false)}
                sx={{ mr: 1 }}
              >
                Current Attributes ({currentAttributes.length})
              </Button>
              <Button
                variant={showHistory ? "contained" : "outlined"}
                onClick={() => setShowHistory(true)}
              >
                History ({attributeHistory.length})
              </Button>
            </Box>

            {!showHistory ? (
              <>
                {/* Current Attributes */}
                <Paper sx={{ mb: 3 }}>
                  <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h6">Current Attributes</Typography>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => handleOpenDialog("assign")}
                      disabled={loading}
                    >
                      Assign Attribute
                    </Button>
                  </Box>
                  <Divider />

                  {currentAttributes.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: "center" }}>
                      <Typography color="textSecondary">
                        No current attributes assigned
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                            <TableCell><strong>Attribute</strong></TableCell>
                            <TableCell><strong>Value</strong></TableCell>
                            <TableCell><strong>Start Date</strong></TableCell>
                            <TableCell><strong>Notes</strong></TableCell>
                            <TableCell align="right"><strong>Actions</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {currentAttributes.map((attr) => (
                            <TableRow key={attr.id} hover>
                              <TableCell>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <CheckCircle sx={{ color: "green", fontSize: 18 }} />
                                  {attr.attributeName}
                                </Box>
                              </TableCell>
                              <TableCell sx={{ fontFamily: "monospace" }}>
                                {attr.attributeValue || "-"}
                              </TableCell>
                              <TableCell>{attr.startDate}</TableCell>
                              <TableCell>{attr.notes || "-"}</TableCell>
                              <TableCell align="right">
                                <Tooltip title="Edit">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleOpenDialog("edit", attr)}
                                  >
                                    <Edit fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="End Assignment">
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() => handleEndAttribute(attr.id)}
                                  >
                                    <Close fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Paper>
              </>
            ) : (
              <>
                {/* History */}
                <Paper>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="h6">Attribute History</Typography>
                  </Box>
                  <Divider />

                  {attributeHistory.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: "center" }}>
                      <Typography color="textSecondary">
                        No attribute history
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                            <TableCell><strong>Attribute</strong></TableCell>
                            <TableCell><strong>Value</strong></TableCell>
                            <TableCell><strong>Start</strong></TableCell>
                            <TableCell><strong>End</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell align="right"><strong>Actions</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {attributeHistory.map((attr) => (
                            <TableRow key={attr.id}>
                              <TableCell>{attr.attributeName}</TableCell>
                              <TableCell sx={{ fontFamily: "monospace" }}>
                                {attr.attributeValue || "-"}
                              </TableCell>
                              <TableCell>{attr.startDate}</TableCell>
                              <TableCell>{attr.endDate || "-"}</TableCell>
                              <TableCell>
                                <Chip
                                  label={attr.isCurrent ? "Current" : "Ended"}
                                  size="small"
                                  color={attr.isCurrent ? "success" : "default"}
                                  icon={
                                    attr.isCurrent ? <CheckCircle /> : <Block />
                                  }
                                />
                              </TableCell>
                              <TableCell align="right">
                                {attr.isCurrent && (
                                  <Tooltip title="Delete">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDelete(attr.id)}
                                    >
                                      <Close fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Paper>
              </>
            )}
          </>
        ) : (
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography color="textSecondary">
              Select a cab to manage its attributes
            </Typography>
          </Paper>
        )}
      </Container>

      {/* Assign/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === "assign" ? "Assign Attribute" : "Edit Attribute"}
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            select
            fullWidth
            margin="normal"
            label="Attribute Type"
            name="attributeTypeId"
            value={formData.attributeTypeId}
            onChange={handleChange}
            disabled={dialogMode === "edit"}
            helperText={dialogMode === "edit" ? "Type cannot be changed" : ""}
          >
            {attributeTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.attributeName}
              </option>
            ))}
          </TextField>

          {formData.attributeTypeId && getAttributeType(parseInt(formData.attributeTypeId))?.requiresValue && (
            <TextField
              fullWidth
              margin="normal"
              label="Value"
              name="attributeValue"
              value={formData.attributeValue}
              onChange={handleChange}
              placeholder="e.g., License Number or ID"
            />
          )}

          <TextField
            fullWidth
            margin="normal"
            label="Start Date"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            margin="normal"
            label="End Date (Optional)"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            helperText="Leave blank for ongoing"
          />

          <TextField
            fullWidth
            margin="normal"
            label="Notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            multiline
            rows={2}
            placeholder="Optional notes"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {dialogMode === "assign" ? "Assign" : "Update"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
