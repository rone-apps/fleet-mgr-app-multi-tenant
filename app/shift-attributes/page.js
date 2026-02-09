"use client";

import { useState, useEffect } from "react";
import GlobalNav from "../components/GlobalNav";
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Tune as TuneIcon,
} from "@mui/icons-material";
import { getCurrentUser, API_BASE_URL } from "../lib/api";

export default function ShiftAttributesPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Attribute Types state
  const [attributeTypes, setAttributeTypes] = useState([]);
  const [openCreateTypeDialog, setOpenCreateTypeDialog] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeFormData, setTypeFormData] = useState({
    attributeCode: "",
    attributeName: "",
    description: "",
    category: "LICENSE",
    dataType: "STRING",
    requiresValue: false,
    validationPattern: "",
    helpText: "",
  });

  // Shift Attributes state
  const [shifts, setShifts] = useState([]);
  const [selectedShift, setSelectedShift] = useState(null);
  const [currentAttributes, setCurrentAttributes] = useState([]);
  const [attributeHistory, setAttributeHistory] = useState([]);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [assignFormData, setAssignFormData] = useState({
    attributeTypeId: "",
    attributeValue: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    notes: "",
  });

  const canEdit =
    currentUser &&
    ["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(currentUser.role);

  // Initialize
  useEffect(() => {
    const initializePage = async () => {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUser(user);
        await Promise.all([loadAttributeTypes(), loadShifts()]);
      }
      setLoading(false);
    };

    initializePage();
  }, []);

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

  const loadShifts = async () => {
    try {
      const url = `${API_BASE_URL}/shifts`;
      console.log("Loading shifts from:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Shifts loaded:", data);
        setShifts(Array.isArray(data) ? data : []);
      } else {
        const errorText = await response.text();
        console.error("Error loading shifts - Status:", response.status, "Response:", errorText);
        setError(`Failed to load shifts: HTTP ${response.status}`);
      }
    } catch (err) {
      console.error("Error loading shifts:", err);
      setError(`Failed to load shifts: ${err.message}`);
    }
  };

  const handleCreateAttributeType = async () => {
    try {
      if (!typeFormData.attributeCode || !typeFormData.attributeName) {
        setError("Attribute code and name are required");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/cab-attribute-types`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
        body: JSON.stringify(typeFormData),
      });

      if (response.ok) {
        setSuccess("Attribute type created successfully");
        setOpenCreateTypeDialog(false);
        setTypeFormData({
          attributeCode: "",
          attributeName: "",
          description: "",
          category: "LICENSE",
          dataType: "STRING",
          requiresValue: false,
          validationPattern: "",
          helpText: "",
        });
        await loadAttributeTypes();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create attribute type");
      }
    } catch (err) {
      console.error("Error creating attribute type:", err);
      setError("Failed to create attribute type");
    }
  };

  const handleSelectShift = async (shift) => {
    setSelectedShift(shift);
    await loadShiftAttributes(shift.id);
  };

  const loadShiftAttributes = async (shiftId) => {
    try {
      const [currentRes, historyRes] = await Promise.all([
        fetch(`${API_BASE_URL}/cab-shifts/${shiftId}/custom-attributes/current`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }),
        fetch(`${API_BASE_URL}/cab-shifts/${shiftId}/custom-attributes/history`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }),
      ]);

      if (currentRes.ok) {
        const data = await currentRes.json();
        setCurrentAttributes(data);
      }

      if (historyRes.ok) {
        const data = await historyRes.json();
        setAttributeHistory(data);
      } else {
        setAttributeHistory([]);
      }
    } catch (err) {
      console.error("Error loading shift attributes:", err);
      setCurrentAttributes([]);
      setAttributeHistory([]);
    }
  };

  const handleAssignAttribute = async () => {
    try {
      if (!selectedShift) {
        setError("Please select a shift first");
        return;
      }

      if (!assignFormData.attributeTypeId) {
        setError("Please select an attribute type");
        return;
      }

      if (!assignFormData.startDate) {
        setError("Please select a start date");
        return;
      }

      const url = `${API_BASE_URL}/cab-shifts/${selectedShift.id}/custom-attributes`;
      console.log("Assigning attribute to URL:", url);
      console.log("Payload:", {
        attributeTypeId: parseInt(assignFormData.attributeTypeId),
        attributeValue: assignFormData.attributeValue,
        startDate: assignFormData.startDate,
        endDate: assignFormData.endDate || null,
        notes: assignFormData.notes,
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
        body: JSON.stringify({
          attributeTypeId: parseInt(assignFormData.attributeTypeId),
          attributeValue: assignFormData.attributeValue,
          startDate: assignFormData.startDate,
          endDate: assignFormData.endDate || null,
          notes: assignFormData.notes,
        }),
      });

      if (response.ok) {
        setSuccess("Attribute assigned successfully");
        setOpenAssignDialog(false);
        setAssignFormData({
          attributeTypeId: "",
          attributeValue: "",
          startDate: new Date().toISOString().split("T")[0],
          endDate: "",
          notes: "",
        });
        await loadShiftAttributes(selectedShift.id);
      } else {
        const text = await response.text();
        try {
          const errorData = JSON.parse(text);
          setError(errorData.error || `HTTP ${response.status}: Failed to assign attribute`);
        } catch {
          setError(`HTTP ${response.status}: ${text || "Failed to assign attribute"}`);
        }
        console.error("Error response:", response.status, text);
      }
    } catch (err) {
      console.error("Error assigning attribute:", err);
      setError(`Error: ${err.message}`);
    }
  };

  const handleDeleteAttribute = async (attributeId) => {
    if (window.confirm("Are you sure you want to delete this attribute?")) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/cab-shifts/${selectedShift.id}/custom-attributes/${attributeId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            },
          }
        );

        if (response.ok) {
          setSuccess("Attribute deleted successfully");
          await loadShiftAttributes(selectedShift.id);
        } else {
          setError("Failed to delete attribute");
        }
      } catch (err) {
        console.error("Error deleting attribute:", err);
        setError("Failed to delete attribute");
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentUser) {
    return <Typography>Access denied</Typography>;
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
      <GlobalNav currentUser={currentUser} title="FareFlow - Shift Attributes" />
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Shift Attributes Management
            <Chip icon={<TuneIcon />} label="Admin Only" size="small" sx={{ ml: 2 }} />
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Create custom attribute types and assign them to shifts
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Attribute Types" />
            <Tab label="Assign to Shifts" />
          </Tabs>
        </Paper>

        {/* TAB 1: Attribute Types Management */}
        {activeTab === 0 && (
          <Box>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6">Attribute Types</Typography>
                {canEdit && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenCreateTypeDialog(true)}
                  >
                    Create Attribute Type
                  </Button>
                )}
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableCell>Code</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Data Type</TableCell>
                      <TableCell>Requires Value</TableCell>
                      <TableCell>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attributeTypes.map((type) => (
                      <TableRow key={type.id}>
                        <TableCell>
                          <Chip label={type.attributeCode} size="small" />
                        </TableCell>
                        <TableCell>{type.attributeName}</TableCell>
                        <TableCell>{type.category}</TableCell>
                        <TableCell>{type.dataType}</TableCell>
                        <TableCell>{type.requiresValue ? "Yes" : "No"}</TableCell>
                        <TableCell>{type.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        )}

        {/* TAB 2: Assign to Shifts */}
        {activeTab === 1 && (
          <Box>
            {attributeTypes.length === 0 && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                No attribute types created yet. Please create attribute types in the "Attribute Types" tab first before assigning attributes to shifts.
              </Alert>
            )}

            {selectedShift && (
              <Box>
                {/* Shift Information - Detailed View */}
                <Paper sx={{ p: 3, mb: 3, backgroundColor: "#f0f7ff", border: "2px solid #2196f3" }}>
                  {/* Header: Shift Type with Status */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
                    <Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="h6">
                          {selectedShift.shiftTypeDisplay}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        {selectedShift.shiftHours}
                      </Typography>
                    </Box>
                    <Chip
                      label={selectedShift.status || "ACTIVE"}
                      color={selectedShift.status === "ACTIVE" || selectedShift.isActive ? "success" : "default"}
                      sx={{ fontWeight: "bold" }}
                    />
                  </Box>

                  {/* Current Owner */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.5 }}>
                      Current Owner
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        label={`${selectedShift.currentOwnerName} ${selectedShift.currentOwnerDriverNumber || ""}`}
                        variant="outlined"
                      />
                    </Box>
                  </Box>

                  {/* Shift Attributes */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: "bold" }}>
                      Shift Attributes
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Cab Type
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {selectedShift.cabType || "-"}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Share Type
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {selectedShift.shareType ? selectedShift.shareType.replace(/_/g, " ") : "-"}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Airport License
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {selectedShift.hasAirportLicense ? "Yes" : "No"}
                          </Typography>
                        </Box>
                      </Grid>
                      {selectedShift.hasAirportLicense && (
                        <>
                          <Grid item xs={12} sm={6}>
                            <Box>
                              <Typography variant="caption" color="textSecondary">
                                License #
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: "monospace" }}>
                                {selectedShift.airportLicenseNumber || "-"}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Box>
                              <Typography variant="caption" color="textSecondary">
                                Expires
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {selectedShift.airportLicenseExpiry || "-"}
                              </Typography>
                            </Box>
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </Box>

                  {/* Shift Profile */}
                  {selectedShift.currentProfile && (
                    <Box sx={{ mb: 3, pb: 3, borderBottom: "1px solid #e0e0e0" }}>
                      <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 1 }}>
                        Shift Profile
                      </Typography>
                      <Chip
                        label={selectedShift.currentProfile.profileName}
                        size="small"
                        sx={{
                          backgroundColor: selectedShift.currentProfile.colorCode || "#2196f3",
                          color: "#fff",
                        }}
                      />
                    </Box>
                  )}

                  {/* Manage Attributes Button */}
                  {canEdit && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setAssignFormData({
                          attributeTypeId: "",
                          attributeValue: "",
                          startDate: new Date().toISOString().split("T")[0],
                          endDate: "",
                          notes: "",
                        });
                        setOpenAssignDialog(true);
                      }}
                    >
                      Manage Attributes
                    </Button>
                  )}
                </Paper>

                {/* Active Attributes */}
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 2 }}>
                    Active Attributes:
                  </Typography>
                  {currentAttributes.length === 0 ? (
                    <Typography variant="body2" color="textSecondary">
                      No active attributes assigned to this shift
                    </Typography>
                  ) : (
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                      {currentAttributes.map((attr) => (
                        <Chip
                          key={attr.id}
                          label={
                            attr.attributeValue
                              ? `${attr.attributeCode}: ${attr.attributeValue}`
                              : attr.attributeCode
                          }
                          onDelete={canEdit ? () => handleDeleteAttribute(attr.id) : undefined}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  )}
                </Paper>

                {/* Attribute History */}
                {attributeHistory && attributeHistory.length > 0 && (
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Other Attributes
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                            <TableCell>Attribute</TableCell>
                            <TableCell>Value</TableCell>
                            <TableCell>Start Date</TableCell>
                            <TableCell>End Date</TableCell>
                            <TableCell>Notes</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {attributeHistory.map((attr) => (
                            <TableRow key={attr.id}>
                              <TableCell>
                                <Chip label={attr.attributeCode} size="small" />
                              </TableCell>
                              <TableCell>{attr.attributeValue || "-"}</TableCell>
                              <TableCell>{attr.startDate}</TableCell>
                              <TableCell>{attr.endDate || "-"}</TableCell>
                              <TableCell>{attr.notes || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                )}
              </Box>
            )}

            {!selectedShift && (
              <Alert severity="info" sx={{ mb: 3 }}>
                Select a shift below to view and manage its attributes
              </Alert>
            )}

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Select a Shift
              </Typography>
              {shifts.length === 0 ? (
                <Alert severity="info">No shifts available</Alert>
              ) : (
              <Grid container spacing={2}>
                {shifts.map((shift) => (
                  <Grid item xs={12} sm={6} md={4} key={shift.id}>
                    <Card
                      onClick={() => handleSelectShift(shift)}
                      sx={{
                        cursor: "pointer",
                        border: selectedShift?.id === shift.id ? "2px solid #2196f3" : "1px solid #ddd",
                        backgroundColor:
                          selectedShift?.id === shift.id ? "#f0f7ff" : "white",
                        transition: "all 0.2s",
                        "&:hover": { boxShadow: 2 },
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {shift.cabNumber} - {shift.shiftTypeDisplay}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Owner: {shift.currentOwnerName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {shift.shiftHours}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              )}
            </Paper>
          </Box>
        )}

        {/* Create Attribute Type Dialog */}
        <Dialog open={openCreateTypeDialog} onClose={() => setOpenCreateTypeDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              Create Attribute Type
              <IconButton onClick={() => setOpenCreateTypeDialog(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Attribute Code"
                placeholder="e.g., TRANSPONDER, GPS_UNIT"
                value={typeFormData.attributeCode}
                onChange={(e) =>
                  setTypeFormData({
                    ...typeFormData,
                    attributeCode: e.target.value.toUpperCase(),
                  })
                }
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Attribute Name"
                placeholder="e.g., Transponder Device"
                value={typeFormData.attributeName}
                onChange={(e) =>
                  setTypeFormData({
                    ...typeFormData,
                    attributeName: e.target.value,
                  })
                }
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={typeFormData.description}
                onChange={(e) =>
                  setTypeFormData({
                    ...typeFormData,
                    description: e.target.value,
                  })
                }
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={typeFormData.category}
                  onChange={(e) =>
                    setTypeFormData({
                      ...typeFormData,
                      category: e.target.value,
                    })
                  }
                  label="Category"
                >
                  <MenuItem value="LICENSE">License</MenuItem>
                  <MenuItem value="EQUIPMENT">Equipment</MenuItem>
                  <MenuItem value="PERMIT">Permit</MenuItem>
                  <MenuItem value="CERTIFICATION">Certification</MenuItem>
                  <MenuItem value="TYPE">Type</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Data Type</InputLabel>
                <Select
                  value={typeFormData.dataType}
                  onChange={(e) =>
                    setTypeFormData({
                      ...typeFormData,
                      dataType: e.target.value,
                    })
                  }
                  label="Data Type"
                >
                  <MenuItem value="STRING">Text</MenuItem>
                  <MenuItem value="NUMBER">Number</MenuItem>
                  <MenuItem value="DATE">Date</MenuItem>
                  <MenuItem value="BOOLEAN">Yes/No</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreateTypeDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateAttributeType} variant="contained" color="primary">
              Create
            </Button>
          </DialogActions>
        </Dialog>

        {/* Assign Attribute Dialog */}
        <Dialog open={openAssignDialog} onClose={() => setOpenAssignDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              Assign Attribute to {selectedShift?.cabNumber}
              <IconButton onClick={() => setOpenAssignDialog(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ pt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Attribute Type</InputLabel>
                <Select
                  value={assignFormData.attributeTypeId}
                  onChange={(e) =>
                    setAssignFormData({
                      ...assignFormData,
                      attributeTypeId: e.target.value,
                    })
                  }
                  label="Attribute Type"
                >
                  {attributeTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.attributeName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Value"
                value={assignFormData.attributeValue}
                onChange={(e) =>
                  setAssignFormData({
                    ...assignFormData,
                    attributeValue: e.target.value,
                  })
                }
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={assignFormData.startDate}
                onChange={(e) =>
                  setAssignFormData({
                    ...assignFormData,
                    startDate: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="End Date (optional)"
                type="date"
                value={assignFormData.endDate}
                onChange={(e) =>
                  setAssignFormData({
                    ...assignFormData,
                    endDate: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={assignFormData.notes}
                onChange={(e) =>
                  setAssignFormData({
                    ...assignFormData,
                    notes: e.target.value,
                  })
                }
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAssignDialog(false)}>Cancel</Button>
            <Button onClick={handleAssignAttribute} variant="contained" color="primary">
              Assign
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
