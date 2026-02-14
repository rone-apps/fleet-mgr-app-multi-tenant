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
  FormControlLabel,
  Checkbox,
  Alert,
  AlertTitle,
  Grid,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Block as BlockIcon,
  Info as InfoIcon,
  Preview as PreviewIcon,
} from "@mui/icons-material";
import { API_BASE_URL } from "../../lib/api";

// Application type display mapping
const APPLICATION_TYPES = {
  SHIFT_PROFILE: { label: "Shift Profile", description: "Apply to all shifts with a specific profile" },
  SPECIFIC_SHIFT: { label: "Specific Shift", description: "Apply to one specific shift" },
  SPECIFIC_OWNER_DRIVER: { label: "Specific Owner/Driver", description: "Apply to a specific owner or driver" },
  ALL_ACTIVE_SHIFTS: { label: "All Active Shifts", description: "Apply to all currently active shifts" },
  ALL_NON_OWNER_DRIVERS: { label: "All Non-Owner Drivers", description: "Apply to all drivers who are not owners" },
  SHIFTS_WITH_ATTRIBUTE: { label: "Shifts with Attribute", description: "Apply to all shifts with a specific attribute" },
};

export default function ExpenseCategoriesTab({
  canEdit,
  canDelete,
  setError,
  setSuccess,
  updateStats,
}) {
  const [categories, setCategories] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    categoryCode: "",
    categoryName: "",
    description: "",
    categoryType: "VARIABLE",
    appliesTo: "SHIFT",
    applicationType: "ALL_ACTIVE_SHIFTS",
    shiftProfileId: null,
    specificShiftId: null,
    specificOwnerId: null,
    specificDriverId: null,
    attributeTypeId: null,
    isActive: true,
  });

  // Dropdown options
  const [shiftProfiles, setShiftProfiles] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [attributeTypes, setAttributeTypes] = useState([]);

  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Delete Warning Dialog
  const [openDeleteWarning, setOpenDeleteWarning] = useState(false);
  const [deleteWarningData, setDeleteWarningData] = useState({ name: "" });

  // Load data on component mount
  useEffect(() => {
    loadCategories();
    loadDropdownOptions();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/expense-categories`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        updateStats({ expenseCategories: data.length });
      }
    } catch (err) {
      console.error("Error loading expense categories:", err);
      setError("Failed to load expense categories");
    }
  };

  const loadDropdownOptions = async () => {
    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "X-Tenant-ID": localStorage.getItem("tenantSchema"),
      };

      // Load shift profiles
      const profilesRes = await fetch(`${API_BASE_URL}/shift-profiles`, { headers });
      if (profilesRes.ok) {
        setShiftProfiles(await profilesRes.json());
      }

      // Load shifts
      const shiftsRes = await fetch(`${API_BASE_URL}/shifts`, { headers });
      if (shiftsRes.ok) {
        setShifts(await shiftsRes.json());
      }

      // Load drivers
      const driversRes = await fetch(`${API_BASE_URL}/drivers`, { headers });
      if (driversRes.ok) {
        setDrivers(await driversRes.json());
      }

      // Load attribute types
      const attributesRes = await fetch(`${API_BASE_URL}/cab-attribute-types`, { headers });
      if (attributesRes.ok) {
        setAttributeTypes(await attributesRes.json());
      }
    } catch (err) {
      console.error("Error loading dropdown options:", err);
      // Don't fail the entire component if dropdowns fail
    }
  };

  const handleOpen = (category = null) => {
    if (category) {
      setEditing(category);
      setFormData({
        categoryCode: category.categoryCode,
        categoryName: category.categoryName,
        description: category.description || "",
        categoryType: category.categoryType,
        appliesTo: category.appliesTo,
        applicationType: category.applicationType || "ALL_ACTIVE_SHIFTS",
        shiftProfileId: category.shiftProfileId || null,
        specificShiftId: category.specificShiftId || null,
        specificOwnerId: category.specificOwnerId || null,
        specificDriverId: category.specificDriverId || null,
        attributeTypeId: category.attributeTypeId || null,
        isActive: category.isActive,
      });
    } else {
      setEditing(null);
      setFormData({
        categoryCode: "",
        categoryName: "",
        description: "",
        categoryType: "VARIABLE",
        appliesTo: "SHIFT",
        applicationType: "ALL_ACTIVE_SHIFTS",
        shiftProfileId: null,
        specificShiftId: null,
        specificOwnerId: null,
        specificDriverId: null,
        attributeTypeId: null,
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.categoryCode || !formData.categoryName) {
      setError("Category code and name are required");
      return;
    }

    // Validate application type fields
    if (!validateApplicationType()) {
      return;
    }

    try {
      const url = editing
        ? `${API_BASE_URL}/expense-categories/${editing.id}`
        : `${API_BASE_URL}/expense-categories`;

      const payload = {
        categoryCode: formData.categoryCode,
        categoryName: formData.categoryName,
        description: formData.description,
        categoryType: formData.categoryType,
        appliesTo: formData.appliesTo,
        applicationType: formData.applicationType,
        shiftProfileId: formData.shiftProfileId,
        specificShiftId: formData.specificShiftId,
        specificOwnerId: formData.specificOwnerId,
        specificDriverId: formData.specificDriverId,
        attributeTypeId: formData.attributeTypeId,
        isActive: formData.isActive,
      };

      const response = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setError(`Failed to save expense category: ${errorText}`);
        return;
      }

      setSuccess(editing ? "Expense category updated" : "Expense category created");
      setOpenDialog(false);
      loadCategories();
    } catch (err) {
      setError("Failed to save expense category: " + err.message);
    }
  };

  const validateApplicationType = () => {
    switch (formData.applicationType) {
      case "SHIFT_PROFILE":
        if (!formData.shiftProfileId) {
          setError("Please select a shift profile");
          return false;
        }
        break;
      case "SPECIFIC_SHIFT":
        if (!formData.specificShiftId) {
          setError("Please select a specific shift");
          return false;
        }
        break;
      case "SPECIFIC_OWNER_DRIVER":
        if (!formData.specificOwnerId && !formData.specificDriverId) {
          setError("Please select either an owner or driver");
          return false;
        }
        if (formData.specificOwnerId && formData.specificDriverId) {
          setError("Please select either owner or driver, not both");
          return false;
        }
        break;
      case "SHIFTS_WITH_ATTRIBUTE":
        if (!formData.attributeTypeId) {
          setError("Please select an attribute type");
          return false;
        }
        break;
      case "ALL_ACTIVE_SHIFTS":
      case "ALL_NON_OWNER_DRIVERS":
        // No validation needed
        break;
      default:
        setError("Please select an application type");
        return false;
    }
    return true;
  };

  const handleApplicationTypeChange = (newType) => {
    setFormData({
      ...formData,
      applicationType: newType,
      // Clear type-specific fields when changing type
      shiftProfileId: null,
      specificShiftId: null,
      specificOwnerId: null,
      specificDriverId: null,
      attributeTypeId: null,
    });
  };

  const handleToggleActive = async (category) => {
    try {
      const action = category.isActive ? "deactivate" : "activate";
      const response = await fetch(
        `${API_BASE_URL}/expense-categories/${category.id}/${action}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }
      );

      if (response.ok) {
        setSuccess(`Expense category ${action}d successfully`);
        loadCategories();
      } else {
        setError(`Failed to ${action} expense category`);
      }
    } catch (err) {
      setError("Failed to update expense category status");
    }
  };

  const handleDelete = (category) => {
    setDeleteWarningData({
      name: category.categoryName,
    });
    setOpenDeleteWarning(true);
  };

  const handlePreview = async (category) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/expense-categories/${category.id}/preview-application`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
        setPreviewOpen(true);
      } else {
        setError("Failed to load preview");
      }
    } catch (err) {
      console.error("Error loading preview:", err);
      setError("Failed to load preview: " + err.message);
    }
  };

  const getApplicationTypeLabel = (type) => {
    return APPLICATION_TYPES[type]?.label || type;
  };

  const renderApplicationTarget = (category) => {
    switch (category.applicationType) {
      case "SHIFT_PROFILE":
        const profile = shiftProfiles.find((p) => p.id === category.shiftProfileId);
        return (
          <Chip
            label={profile?.profileName || "Profile"}
            size="small"
            style={{ backgroundColor: profile?.colorCode || "#999" }}
          />
        );
      case "SPECIFIC_SHIFT":
        const shift = shifts.find((s) => s.id === category.specificShiftId);
        return (
          <Chip
            label={shift ? `${shift.cabNumber} - ${shift.shiftType}` : "Shift"}
            size="small"
            variant="outlined"
          />
        );
      case "SPECIFIC_OWNER_DRIVER":
        if (category.specificOwnerId) {
          const owner = drivers.find((d) => d.id === category.specificOwnerId);
          return (
            <Chip
              label={owner ? `Owner: ${owner.firstName} ${owner.lastName}` : "Owner"}
              size="small"
              color="primary"
              variant="outlined"
            />
          );
        } else if (category.specificDriverId) {
          const driver = drivers.find((d) => d.id === category.specificDriverId);
          return (
            <Chip
              label={driver ? `Driver: ${driver.firstName} ${driver.lastName}` : "Driver"}
              size="small"
              color="secondary"
              variant="outlined"
            />
          );
        }
        return <Typography variant="caption">-</Typography>;
      case "ALL_ACTIVE_SHIFTS":
        return <Chip label="All Active Shifts" size="small" color="success" variant="outlined" />;
      case "ALL_NON_OWNER_DRIVERS":
        return <Chip label="All Non-Owner Drivers" size="small" color="info" variant="outlined" />;
      default:
        return <Typography variant="caption">-</Typography>;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6">Expense Categories</Typography>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Add Expense Category
          </Button>
        )}
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Application Type</TableCell>
              <TableCell>Target</TableCell>
              <TableCell>Status</TableCell>
              {canEdit && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <Chip label={category.categoryCode} size="small" />
                </TableCell>
                <TableCell>{category.categoryName}</TableCell>
                <TableCell>
                  <Chip
                    label={category.categoryType}
                    color={category.categoryType === "FIXED" ? "primary" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={getApplicationTypeLabel(category.applicationType)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{renderApplicationTarget(category)}</TableCell>
                <TableCell>
                  <Chip
                    icon={category.isActive ? <ActiveIcon /> : <InactiveIcon />}
                    label={category.isActive ? "Active" : "Inactive"}
                    color={category.isActive ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                {canEdit && (
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpen(category)}
                      title="Edit"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handlePreview(category)}
                      title="Preview Application"
                      color="primary"
                    >
                      <PreviewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleActive(category)}
                      color={category.isActive ? "default" : "success"}
                      title={category.isActive ? "Deactivate" : "Activate"}
                    >
                      {category.isActive ? <InactiveIcon /> : <ActiveIcon />}
                    </IconButton>
                    {canDelete && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(category)}
                        title="Delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Category Creation/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editing ? "Edit Expense Category" : "Add Expense Category"}
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              label="Category Code"
              value={formData.categoryCode}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  categoryCode: e.target.value.toUpperCase(),
                })
              }
              required
              placeholder="E.g., FUEL"
              fullWidth
            />

            <TextField
              label="Category Name"
              value={formData.categoryName}
              onChange={(e) =>
                setFormData({ ...formData, categoryName: e.target.value })
              }
              required
              placeholder="E.g., Fuel Expenses"
              fullWidth
            />

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              multiline
              rows={2}
              fullWidth
            />

            <FormControl fullWidth required>
              <InputLabel>Category Type</InputLabel>
              <Select
                value={formData.categoryType}
                label="Category Type"
                onChange={(e) =>
                  setFormData({ ...formData, categoryType: e.target.value })
                }
              >
                <MenuItem value="FIXED">Fixed Expense</MenuItem>
                <MenuItem value="VARIABLE">Variable Expense</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Applies To</InputLabel>
              <Select
                value={formData.appliesTo}
                label="Applies To"
                onChange={(e) =>
                  setFormData({ ...formData, appliesTo: e.target.value })
                }
              >
                <MenuItem value="CAB">Per Cab</MenuItem>
                <MenuItem value="SHIFT">Per Shift</MenuItem>
                <MenuItem value="DRIVER">Per Driver</MenuItem>
                <MenuItem value="OWNER">Per Owner</MenuItem>
                <MenuItem value="COMPANY">Company-wide</MenuItem>
              </Select>
            </FormControl>

            {/* Application Type Section */}
            <Box sx={{ p: 2, bgcolor: "info.light", borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: "bold" }}>
                How This Expense Is Applied
              </Typography>

              <FormControl fullWidth required>
                <InputLabel>Application Type</InputLabel>
                <Select
                  value={formData.applicationType}
                  label="Application Type"
                  onChange={(e) => handleApplicationTypeChange(e.target.value)}
                >
                  <MenuItem value="SHIFT_PROFILE">Shift Profile</MenuItem>
                  <MenuItem value="SPECIFIC_SHIFT">Specific Shift</MenuItem>
                  <MenuItem value="SPECIFIC_OWNER_DRIVER">Specific Owner/Driver</MenuItem>
                  <MenuItem value="ALL_ACTIVE_SHIFTS">All Active Shifts</MenuItem>
                  <MenuItem value="ALL_NON_OWNER_DRIVERS">All Non-Owner Drivers</MenuItem>
                  <MenuItem value="SHIFTS_WITH_ATTRIBUTE">Shifts with Attribute</MenuItem>
                </Select>
              </FormControl>

              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
                {APPLICATION_TYPES[formData.applicationType]?.description}
              </Typography>

              {/* Conditional Fields Based on Application Type */}
              <Box sx={{ mt: 2 }}>
                {formData.applicationType === "SHIFT_PROFILE" && (
                  <FormControl fullWidth required>
                    <InputLabel>Shift Profile</InputLabel>
                    <Select
                      value={formData.shiftProfileId || ""}
                      label="Shift Profile"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shiftProfileId: e.target.value,
                        })
                      }
                    >
                      <MenuItem value="">-- Select Profile --</MenuItem>
                      {shiftProfiles.map((profile) => (
                        <MenuItem key={profile.id} value={profile.id}>
                          {profile.profileName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {formData.applicationType === "SPECIFIC_SHIFT" && (
                  <FormControl fullWidth required>
                    <InputLabel>Shift</InputLabel>
                    <Select
                      value={formData.specificShiftId || ""}
                      label="Shift"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specificShiftId: e.target.value,
                        })
                      }
                    >
                      <MenuItem value="">-- Select Shift --</MenuItem>
                      {shifts.map((shift) => (
                        <MenuItem key={shift.id} value={shift.id}>
                          {shift.cabNumber} - {shift.shiftType}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {formData.applicationType === "SPECIFIC_OWNER_DRIVER" && (
                  <Box>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Select either an owner OR a driver (not both)
                    </Alert>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <FormControl fullWidth>
                          <InputLabel>Owner</InputLabel>
                          <Select
                            value={formData.specificOwnerId || ""}
                            label="Owner"
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                specificOwnerId: e.target.value,
                                specificDriverId: null,
                              })
                            }
                            disabled={formData.specificDriverId !== null}
                          >
                            <MenuItem value="">-- None --</MenuItem>
                            {drivers.map((driver) => (
                              <MenuItem key={driver.id} value={driver.id}>
                                {driver.firstName} {driver.lastName}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={6}>
                        <FormControl fullWidth>
                          <InputLabel>Driver</InputLabel>
                          <Select
                            value={formData.specificDriverId || ""}
                            label="Driver"
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                specificDriverId: e.target.value,
                                specificOwnerId: null,
                              })
                            }
                            disabled={formData.specificOwnerId !== null}
                          >
                            <MenuItem value="">-- None --</MenuItem>
                            {drivers.map((driver) => (
                              <MenuItem key={driver.id} value={driver.id}>
                                {driver.firstName} {driver.lastName}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {formData.applicationType === "SHIFTS_WITH_ATTRIBUTE" && (
                  <FormControl fullWidth required>
                    <InputLabel>Attribute Type</InputLabel>
                    <Select
                      value={formData.attributeTypeId || ""}
                      label="Attribute Type"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          attributeTypeId: e.target.value,
                        })
                      }
                    >
                      <MenuItem value="">-- Select Attribute --</MenuItem>
                      {attributeTypes.map((attr) => (
                        <MenuItem key={attr.id} value={attr.id}>
                          {attr.attributeName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {(formData.applicationType === "ALL_ACTIVE_SHIFTS" ||
                  formData.applicationType === "ALL_NON_OWNER_DRIVERS") && (
                  <Alert severity="success" icon={<InfoIcon />}>
                    This expense will automatically apply to{" "}
                    <strong>
                      {formData.applicationType === "ALL_ACTIVE_SHIFTS"
                        ? "all currently active shifts"
                        : "all drivers who are not owners"}
                    </strong>
                  </Alert>
                )}
              </Box>
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editing ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Application Preview</DialogTitle>
        <DialogContent>
          {previewData && (
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Application Type
                </Typography>
                <Chip
                  label={getApplicationTypeLabel(previewData.applicationType)}
                  variant="outlined"
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Affected Entities
                </Typography>
                <Typography variant="h6" color="primary">
                  {previewData.affectedEntityCount}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Target
                </Typography>
                <Typography variant="body2">{previewData.targetEntityDescription}</Typography>
              </Box>

              <Alert severity="info">{previewData.description}</Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Warning Dialog */}
      <Dialog
        open={openDeleteWarning}
        onClose={() => setOpenDeleteWarning(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            bgcolor: "error.light",
            color: "error.contrastText",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <BlockIcon />
          Cannot Delete Expense Category
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Deletion Blocked</AlertTitle>
              The expense category "{deleteWarningData.name}" cannot be deleted.
            </Alert>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Reason:
              </Typography>
              <Typography variant="body2">
                Expense categories are part of the core financial configuration.
                Deleting them could affect historical expense records and
                reporting accuracy.
              </Typography>
            </Box>

            <Box sx={{ p: 2, bgcolor: "info.light", borderRadius: 1 }}>
              <Typography variant="subtitle2" color="info.main" gutterBottom>
                What you can do:
              </Typography>
              <Typography variant="body2">
                If you no longer need this category, deactivate it instead. This
                will hide it from new expense entries while preserving all
                historical data and reports.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDeleteWarning(false)}
            variant="contained"
          >
            I Understand
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
