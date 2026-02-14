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
} from "@mui/icons-material";
import { API_BASE_URL } from "../../lib/api";

// Application type display mapping
const APPLICATION_TYPES = {
  SHIFT_PROFILE: { label: "Shift Profile", description: "Apply to all shifts with a specific profile" },
  SPECIFIC_SHIFT: { label: "Specific Shift", description: "Apply to one specific shift" },
  SPECIFIC_OWNER_DRIVER: { label: "Specific Owner/Driver", description: "Apply to a specific owner or driver" },
  ALL_ACTIVE_SHIFTS: { label: "All Active Shifts", description: "Apply to all currently active shifts" },
  ALL_NON_OWNER_DRIVERS: { label: "All Non-Owner Drivers", description: "Apply to all drivers who are not owners" },
};

export default function RevenueCategoriesTab({
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
    categoryType: "FIXED",
    appliesTo: "SHIFT",
    applicationType: "ALL_ACTIVE_SHIFTS",
    shiftProfileId: null,
    specificShiftId: null,
    specificOwnerId: null,
    specificDriverId: null,
    isActive: true,
  });

  // Dropdown options
  const [shiftProfiles, setShiftProfiles] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [drivers, setDrivers] = useState([]);

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
      const response = await fetch(`${API_BASE_URL}/revenue-categories`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        updateStats({ revenueCategories: data.length });
      }
    } catch (err) {
      console.error("Error loading revenue categories:", err);
      setError("Failed to load revenue categories");
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
        applicationType: category.applicationType,
        shiftProfileId: category.shiftProfileId || null,
        specificShiftId: category.specificShiftId || null,
        specificOwnerId: category.specificOwnerId || null,
        specificDriverId: category.specificDriverId || null,
        isActive: category.isActive,
      });
    } else {
      setEditing(null);
      setFormData({
        categoryCode: "",
        categoryName: "",
        description: "",
        categoryType: "FIXED",
        appliesTo: "SHIFT",
        applicationType: "ALL_ACTIVE_SHIFTS",
        shiftProfileId: null,
        specificShiftId: null,
        specificOwnerId: null,
        specificDriverId: null,
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const validateForm = () => {
    if (!formData.categoryCode || !formData.categoryName) {
      setError("Category code and name are required");
      return false;
    }

    // Validate application type requirements
    switch (formData.applicationType) {
      case "SHIFT_PROFILE":
        if (!formData.shiftProfileId) {
          setError("Shift profile is required for SHIFT_PROFILE application type");
          return false;
        }
        break;
      case "SPECIFIC_SHIFT":
        if (!formData.specificShiftId) {
          setError("Specific shift is required for SPECIFIC_SHIFT application type");
          return false;
        }
        break;
      case "SPECIFIC_OWNER_DRIVER":
        if (!formData.specificOwnerId && !formData.specificDriverId) {
          setError("Either owner or driver is required for SPECIFIC_OWNER_DRIVER application type");
          return false;
        }
        if (formData.specificOwnerId && formData.specificDriverId) {
          setError("Cannot set both owner and driver for SPECIFIC_OWNER_DRIVER application type");
          return false;
        }
        break;
      case "ALL_ACTIVE_SHIFTS":
      case "ALL_NON_OWNER_DRIVERS":
        // No additional validation needed
        break;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const url = editing
        ? `${API_BASE_URL}/revenue-categories/${editing.id}`
        : `${API_BASE_URL}/revenue-categories`;

      const response = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setError(`Failed to save revenue category: ${errorText}`);
        return;
      }

      setSuccess(editing ? "Revenue category updated" : "Revenue category created");
      setOpenDialog(false);
      loadCategories();
    } catch (err) {
      setError("Failed to save revenue category: " + err.message);
    }
  };

  const handleToggleActive = async (category) => {
    try {
      const action = category.isActive ? "deactivate" : "activate";
      const response = await fetch(
        `${API_BASE_URL}/revenue-categories/${category.id}/${action}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }
      );

      if (response.ok) {
        setSuccess(`Revenue category ${action}d successfully`);
        loadCategories();
      } else {
        setError(`Failed to ${action} revenue category`);
      }
    } catch (err) {
      setError("Failed to update revenue category status");
    }
  };

  const handleDelete = (category) => {
    setDeleteWarningData({
      name: category.categoryName,
    });
    setOpenDeleteWarning(true);
  };

  const renderApplicationTarget = (category) => {
    switch (category.applicationType) {
      case "SHIFT_PROFILE":
        return `Profile: ${category.shiftProfileId || "-"}`;
      case "SPECIFIC_SHIFT":
        return `Shift: ${category.specificShift?.cabNumber || category.specificShiftId || "-"}`;
      case "SPECIFIC_OWNER_DRIVER":
        if (category.specificOwner) {
          return `Owner: ${category.specificOwner.firstName} ${category.specificOwner.lastName}`;
        } else if (category.specificDriver) {
          return `Driver: ${category.specificDriver.firstName} ${category.specificDriver.lastName}`;
        }
        return "-";
      case "ALL_ACTIVE_SHIFTS":
        return <Chip label="All Active Shifts" size="small" color="success" />;
      case "ALL_NON_OWNER_DRIVERS":
        return <Chip label="All Non-Owner Drivers" size="small" color="info" />;
      default:
        return "-";
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
        <Typography variant="h6">Revenue Categories</Typography>
        {canEdit && (
          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Add Revenue Category
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
              <TableCell>Applies To</TableCell>
              <TableCell>Application Type</TableCell>
              <TableCell>Application Target</TableCell>
              <TableCell>Status</TableCell>
              {canEdit && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <Chip label={category.categoryCode} size="small" color="success" />
                </TableCell>
                <TableCell>{category.categoryName}</TableCell>
                <TableCell>
                  <Chip
                    label={category.categoryType}
                    color={
                      category.categoryType === "FIXED" ? "primary" : "default"
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={category.appliesTo}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={APPLICATION_TYPES[category.applicationType]?.label || category.applicationType}
                    size="small"
                    color="primary"
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
                    >
                      <EditIcon />
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

      {/* Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "success.light" }}>
          {editing ? "Edit Revenue Category" : "Add Revenue Category"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
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
                  fullWidth
                  placeholder="E.g., LEASE_DAY"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Category Name"
                  value={formData.categoryName}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryName: e.target.value })
                  }
                  required
                  fullWidth
                  placeholder="E.g., Lease Revenue - Day Shift"
                />
              </Grid>
            </Grid>

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              multiline
              rows={3}
              fullWidth
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Category Type</InputLabel>
                  <Select
                    value={formData.categoryType}
                    label="Category Type"
                    onChange={(e) =>
                      setFormData({ ...formData, categoryType: e.target.value })
                    }
                  >
                    <MenuItem value="FIXED">Fixed</MenuItem>
                    <MenuItem value="VARIABLE">Variable</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Applies To</InputLabel>
                  <Select
                    value={formData.appliesTo}
                    label="Applies To"
                    onChange={(e) =>
                      setFormData({ ...formData, appliesTo: e.target.value })
                    }
                  >
                    <MenuItem value="CAB">Cab</MenuItem>
                    <MenuItem value="COMPANY">Company</MenuItem>
                    <MenuItem value="DRIVER">Driver</MenuItem>
                    <MenuItem value="OWNER">Owner</MenuItem>
                    <MenuItem value="SHIFT">Shift</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <FormControl fullWidth required>
              <InputLabel>Application Type</InputLabel>
              <Select
                value={formData.applicationType}
                label="Application Type"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    applicationType: e.target.value,
                    // Clear specific fields when type changes
                    shiftProfileId: null,
                    specificShiftId: null,
                    specificOwnerId: null,
                    specificDriverId: null,
                  })
                }
              >
                {Object.entries(APPLICATION_TYPES).map(([key, value]) => (
                  <MenuItem key={key} value={key}>
                    {value.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Conditional fields based on application type */}
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
                  <MenuItem value="">Select a profile</MenuItem>
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
                  <MenuItem value="">Select a shift</MenuItem>
                  {shifts.map((shift) => (
                    <MenuItem key={shift.id} value={shift.id}>
                      {shift.cabNumber || `Shift ${shift.id}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {formData.applicationType === "SPECIFIC_OWNER_DRIVER" && (
              <>
                <Alert severity="info">
                  <AlertTitle>Select Either Owner or Driver</AlertTitle>
                  Choose one entity - either an owner or a driver, but not both.
                </Alert>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
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
                        <MenuItem value="">None</MenuItem>
                        {drivers
                          .filter((d) => d.isOwner)
                          .map((driver) => (
                            <MenuItem key={driver.id} value={driver.id}>
                              {driver.firstName} {driver.lastName}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
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
                        <MenuItem value="">None</MenuItem>
                        {drivers.map((driver) => (
                          <MenuItem key={driver.id} value={driver.id}>
                            {driver.firstName} {driver.lastName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </>
            )}

            {(formData.applicationType === "ALL_ACTIVE_SHIFTS" ||
              formData.applicationType === "ALL_NON_OWNER_DRIVERS") && (
              <Alert severity="info" icon={<InfoIcon />}>
                <AlertTitle>Automatic Application</AlertTitle>
                This revenue category will automatically apply to{" "}
                {formData.applicationType === "ALL_ACTIVE_SHIFTS"
                  ? "all currently active shifts"
                  : "all drivers who are not owners"}
                . No specific selection needed.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="success">
            {editing ? "Update" : "Create"}
          </Button>
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
          Cannot Delete Revenue Category
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Deletion Blocked</AlertTitle>
              The revenue category "{deleteWarningData.name}" cannot be deleted.
            </Alert>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Reason:
              </Typography>
              <Typography variant="body2">
                Revenue categories are part of the core financial configuration.
                Deleting them could affect historical revenue records and
                reporting accuracy.
              </Typography>
            </Box>

            <Box sx={{ p: 2, bgcolor: "info.lighter", borderRadius: 1 }}>
              <Typography variant="subtitle2" color="info.main" gutterBottom>
                What you can do:
              </Typography>
              <Typography variant="body2">
                If you no longer need this category, deactivate it instead. This
                will hide it from new revenue entries while preserving all
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
