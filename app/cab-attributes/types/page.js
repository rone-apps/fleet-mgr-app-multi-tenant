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
  MenuItem,
  Alert,
  Chip,
  Grid,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  CheckCircle,
  Block,
  Search,
  FilterList,
  Clear,
} from "@mui/icons-material";
import { getCurrentUser, isAuthenticated, API_BASE_URL } from "../../lib/api";

const ATTRIBUTE_CATEGORIES = [
  { value: "LICENSE", label: "License/Permit" },
  { value: "EQUIPMENT", label: "Equipment/Hardware" },
  { value: "TYPE", label: "Vehicle Type/Classification" },
  { value: "PERMIT", label: "Special Permits" },
  { value: "CERTIFICATION", label: "Certifications" },
];

const DATA_TYPES = [
  { value: "STRING", label: "Text" },
  { value: "NUMBER", label: "Number" },
  { value: "DATE", label: "Date" },
  { value: "BOOLEAN", label: "Yes/No" },
];

export default function CabAttributeTypesPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [attributeTypes, setAttributeTypes] = useState([]);
  const [filteredTypes, setFilteredTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search and filter
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [editingType, setEditingType] = useState(null);

  const [formData, setFormData] = useState({
    attributeCode: "",
    attributeName: "",
    description: "",
    category: "LICENSE",
    dataType: "STRING",
    requiresValue: false,
    validationPattern: "",
    helpText: "",
  });

  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/signin");
      return;
    }

    const user = getCurrentUser();
    setCurrentUser(user);

    // Only ADMIN can manage attribute types
    if (user?.role !== "ADMIN") {
      router.push("/");
      return;
    }

    loadAttributeTypes();
  }, [router]);

  useEffect(() => {
    filterAttributeTypes();
  }, [searchTerm, categoryFilter, statusFilter, attributeTypes]);

  const loadAttributeTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/cab-attribute-types`, {
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

  const filterAttributeTypes = () => {
    let filtered = [...attributeTypes];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (type) =>
          type.attributeName.toLowerCase().includes(term) ||
          type.attributeCode.toLowerCase().includes(term)
      );
    }

    if (categoryFilter !== "ALL") {
      filtered = filtered.filter((type) => type.category === categoryFilter);
    }

    if (statusFilter !== "ALL") {
      const isActive = statusFilter === "ACTIVE";
      filtered = filtered.filter((type) => type.isActive === isActive);
    }

    setFilteredTypes(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("ALL");
    setStatusFilter("ALL");
  };

  const handleOpenDialog = (mode, type = null) => {
    setDialogMode(mode);
    setEditingType(type);

    if (mode === "create") {
      setFormData({
        attributeCode: "",
        attributeName: "",
        description: "",
        category: "LICENSE",
        dataType: "STRING",
        requiresValue: false,
        validationPattern: "",
        helpText: "",
      });
    } else {
      setFormData({
        attributeCode: type.attributeCode,
        attributeName: type.attributeName,
        description: type.description || "",
        category: type.category,
        dataType: type.dataType,
        requiresValue: type.requiresValue,
        validationPattern: type.validationPattern || "",
        helpText: type.helpText || "",
      });
    }

    setError("");
    setSuccess("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingType(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const handleSubmit = async () => {
    try {
      if (!formData.attributeName.trim()) {
        setError("Attribute name is required");
        return;
      }

      const url =
        dialogMode === "create"
          ? `${API_BASE_URL}/cab-attribute-types`
          : `${API_BASE_URL}/cab-attribute-types/${editingType.id}`;

      const method = dialogMode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save attribute type");
      }

      setSuccess(
        `Attribute type ${dialogMode === "create" ? "created" : "updated"} successfully`
      );
      handleCloseDialog();
      loadAttributeTypes();
    } catch (err) {
      console.error("Error saving attribute type:", err);
      setError(err.message || "Failed to save attribute type");
    }
  };

  const handleToggleActive = async (typeId, isActive) => {
    try {
      const endpoint = isActive
        ? `${API_BASE_URL}/cab-attribute-types/${typeId}/deactivate`
        : `${API_BASE_URL}/cab-attribute-types/${typeId}/activate`;

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });

      if (!response.ok) throw new Error("Failed to toggle status");

      setSuccess("Status updated successfully");
      loadAttributeTypes();
    } catch (err) {
      console.error("Error toggling status:", err);
      setError("Failed to toggle status");
    }
  };

  const handleDelete = async (typeId) => {
    if (!window.confirm("Are you sure you want to delete this attribute type?"))
      return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/cab-attribute-types/${typeId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }
      );

      if (!response.ok) throw new Error("Failed to delete");

      setSuccess("Attribute type deleted successfully");
      loadAttributeTypes();
    } catch (err) {
      console.error("Error deleting:", err);
      setError("Failed to delete attribute type");
    }
  };

  const getCategoryLabel = (category) => {
    const cat = ATTRIBUTE_CATEGORIES.find((c) => c.value === category);
    return cat ? cat.label : category;
  };

  const getDataTypeLabel = (dataType) => {
    const dt = DATA_TYPES.find((d) => d.value === dataType);
    return dt ? dt.label : dataType;
  };

  const hasActiveFilters =
    searchTerm || categoryFilter !== "ALL" || statusFilter !== "ALL";

  if (!currentUser) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
      <GlobalNav
        currentUser={currentUser}
        title="FareFlow - Cab Attribute Types"
      />

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

        {/* Header */}
        <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>
            Cab Attribute Types
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog("create")}
            disabled={loading}
          >
            Create Attribute Type
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Types
                </Typography>
                <Typography variant="h4">{attributeTypes.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active
                </Typography>
                <Typography variant="h4" color="success.main">
                  {attributeTypes.filter((t) => t.isActive).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Inactive
                </Typography>
                <Typography variant="h4" color="error.main">
                  {attributeTypes.filter((t) => !t.isActive).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
            <TextField
              label="Search"
              placeholder="Name or Code"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              select
              label="Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              size="small"
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="ALL">All Categories</MenuItem>
              {ATTRIBUTE_CATEGORIES.map((cat) => (
                <MenuItem key={cat.value} value={cat.value}>
                  {cat.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              size="small"
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </TextField>

            {hasActiveFilters && (
              <Button
                variant="outlined"
                startIcon={<Clear />}
                onClick={clearFilters}
              >
                Clear
              </Button>
            )}
          </Box>
        </Paper>

        {/* Results Count */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Showing {filteredTypes.length} of {attributeTypes.length} types
            {hasActiveFilters && " (filtered)"}
          </Typography>
        </Box>

        {/* Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell>
                  <strong>Code</strong>
                </TableCell>
                <TableCell>
                  <strong>Name</strong>
                </TableCell>
                <TableCell>
                  <strong>Category</strong>
                </TableCell>
                <TableCell>
                  <strong>Data Type</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Requires Value</strong>
                </TableCell>
                <TableCell>
                  <strong>Status</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Actions</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      {attributeTypes.length === 0
                        ? "No attribute types found"
                        : "No matches for your filters"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTypes.map((type) => (
                  <TableRow key={type.id} hover>
                    <TableCell sx={{ fontFamily: "monospace" }}>
                      {type.attributeCode}
                    </TableCell>
                    <TableCell>{type.attributeName}</TableCell>
                    <TableCell>
                      <Chip
                        label={getCategoryLabel(type.category)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{getDataTypeLabel(type.dataType)}</TableCell>
                    <TableCell align="center">
                      {type.requiresValue ? (
                        <CheckCircle sx={{ color: "green" }} />
                      ) : (
                        <Block sx={{ color: "gray" }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={type.active ? "Active" : "Inactive"}
                        color={type.active ? "success" : "default"}
                        size="small"
                        icon={type.active ? <CheckCircle /> : <Block />}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog("edit", type)}
                        title="Edit"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color={type.active ? "warning" : "success"}
                        onClick={() => handleToggleActive(type.id, type.active)}
                        title={
                          type.active ? "Deactivate" : "Activate"
                        }
                      >
                        {type.active ? (
                          <Block fontSize="small" />
                        ) : (
                          <CheckCircle fontSize="small" />
                        )}
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(type.id)}
                        title="Delete"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === "create"
            ? "Create Attribute Type"
            : `Edit: ${editingType?.attributeName}`}
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            margin="normal"
            label="Attribute Code"
            name="attributeCode"
            value={formData.attributeCode}
            onChange={handleChange}
            disabled={dialogMode === "edit"}
            placeholder="e.g., AIRPORT_LICENSE"
            helperText={
              dialogMode === "edit" ? "Code cannot be changed" : "Unique identifier"
            }
          />

          <TextField
            fullWidth
            margin="normal"
            label="Attribute Name"
            name="attributeName"
            value={formData.attributeName}
            onChange={handleChange}
            placeholder="e.g., Airport License"
          />

          <TextField
            fullWidth
            margin="normal"
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={2}
          />

          <TextField
            select
            fullWidth
            margin="normal"
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            {ATTRIBUTE_CATEGORIES.map((cat) => (
              <MenuItem key={cat.value} value={cat.value}>
                {cat.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            margin="normal"
            label="Data Type"
            name="dataType"
            value={formData.dataType}
            onChange={handleChange}
          >
            {DATA_TYPES.map((dt) => (
              <MenuItem key={dt.value} value={dt.value}>
                {dt.label}
              </MenuItem>
            ))}
          </TextField>

          <FormControlLabel
            control={
              <Checkbox
                name="requiresValue"
                checked={formData.requiresValue}
                onChange={handleChange}
              />
            }
            label="Requires Value (e.g., License Number)"
            sx={{ my: 1 }}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Validation Pattern (Regex)"
            name="validationPattern"
            value={formData.validationPattern}
            onChange={handleChange}
            placeholder="Optional regex for validation"
            helperText="Leave empty for no validation"
          />

          <TextField
            fullWidth
            margin="normal"
            label="Help Text"
            name="helpText"
            value={formData.helpText}
            onChange={handleChange}
            multiline
            rows={2}
            placeholder="Guide text for users"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {dialogMode === "create" ? "Create" : "Update"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
