"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GlobalNav from "../components/GlobalNav";
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
  Paper,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Tooltip,
  Checkbox,
  FormControlLabel,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Divider,
  Autocomplete,
  Container,
  InputAdornment,
  Menu,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  DirectionsCar,
  Close as CloseIcon,
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  AirplanemodeActive as AirportIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Tune as TuneIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { getCurrentUser, API_BASE_URL } from "../lib/api";
import { downloadCSV, downloadPDF, formatCabsForExport } from "../lib/exportUtils";

export default function CabsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [cabs, setCabs] = useState([]);
  const [filteredCabs, setFilteredCabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCab, setSelectedCab] = useState(null);

  // Download menu state
  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState(null);

  // Attribute states
  const [attributeTypes, setAttributeTypes] = useState([]);
  const [currentAttributes, setCurrentAttributes] = useState([]);
  const [attributeHistory, setAttributeHistory] = useState([]);
  const [selectedCabForAttributes, setSelectedCabForAttributes] = useState(null);
  const [showAttributeHistory, setShowAttributeHistory] = useState(false);
  const [openAttributeDialog, setOpenAttributeDialog] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState(null);
  const [cabAttributesMap, setCabAttributesMap] = useState({}); // Map of cabId -> attributes array

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [airportFilter, setAirportFilter] = useState("ALL");
  const [shareTypeFilter, setShareTypeFilter] = useState("ALL");
  const [shiftTypeFilter, setShiftTypeFilter] = useState("ALL");

  // Form data
  const [formData, setFormData] = useState({
    registrationNumber: "",
    make: "",
    model: "",
    year: "",
    color: "",
    cabType: "SEDAN",
    shareType: "",
    cabShiftType: "",
    hasAirportLicense: false,
    airportLicenseNumber: "",
    airportLicenseExpiry: "",
    notes: "",
  });

  // Attribute form data
  const [attributeFormData, setAttributeFormData] = useState({
    attributeTypeId: "",
    attributeValue: "",
    startDate: "",
    endDate: "",
    notes: "",
  });

  // Attribute Types Management States
  const [allAttributeTypes, setAllAttributeTypes] = useState([]);
  const [filteredAttributeTypes, setFilteredAttributeTypes] = useState([]);
  const [attributeTypeSearchTerm, setAttributeTypeSearchTerm] = useState("");
  const [attributeTypeCategoryFilter, setAttributeTypeCategoryFilter] = useState("ALL");
  const [attributeTypeStatusFilter, setAttributeTypeStatusFilter] = useState("ALL");
  const [openAttributeTypeDialog, setOpenAttributeTypeDialog] = useState(false);
  const [attributeTypeDialogMode, setAttributeTypeDialogMode] = useState("create");
  const [editingAttributeType, setEditingAttributeType] = useState(null);
  const [attributeTypeFormData, setAttributeTypeFormData] = useState({
    attributeCode: "",
    attributeName: "",
    description: "",
    category: "LICENSE",
    dataType: "STRING",
    requiresValue: false,
    validationPattern: "",
    helpText: "",
  });

  // Check authentication and load cabs
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signin");
      return;
    }

    const user = getCurrentUser();
    setCurrentUser(user);

    // Check if user has access
    if (!["ADMIN", "MANAGER", "DISPATCHER"].includes(user?.role)) {
      router.push("/");
      return;
    }

    loadCabs();
    loadAttributeTypes();
  }, [router]);

  // Filter cabs whenever search/filter changes
  useEffect(() => {
    filterCabs();
  }, [searchTerm, statusFilter, typeFilter, airportFilter, shareTypeFilter, shiftTypeFilter, cabs]);

  const loadCabs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cabs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("🚗 Cabs loaded:", data);

        // ✅ Sort by cab number (numeric)
        const sortedCabs = data.sort((a, b) => {
          // Extract numeric part from cab number (e.g., "CAB-001" -> 1, "CAB-123" -> 123)
          const numA = parseInt(a.cabNumber?.replace(/\D/g, '') || '0');
          const numB = parseInt(b.cabNumber?.replace(/\D/g, '') || '0');
          return numA - numB;
        });

        setCabs(sortedCabs);

        // Load current attributes for all cabs
        loadCabsAttributes(sortedCabs);
      } else {
        setError("Failed to load cabs");
      }
      setLoading(false);
    } catch (err) {
      console.error("Error loading cabs:", err);
      setError("Failed to load cabs");
      setLoading(false);
    }
  };

  const loadCabsAttributes = async (cabsList) => {
    try {
      const attributesMap = {};

      // Load attributes for each cab in parallel
      const attributePromises = cabsList.map((cab) =>
        fetch(`${API_BASE_URL}/cabs/${cab.id}/attributes/current`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        })
          .then((res) => (res.ok ? res.json() : []))
          .then((attrs) => {
            console.log(`Attributes for cab ${cab.id}:`, attrs);
            attributesMap[cab.id] = attrs;
          })
          .catch((err) => {
            console.error(`Error loading attributes for cab ${cab.id}:`, err);
            attributesMap[cab.id] = [];
          })
      );

      await Promise.all(attributePromises);
      setCabAttributesMap(attributesMap);
    } catch (err) {
      console.error("Error loading cab attributes:", err);
    }
  };

  const filterCabs = () => {
    let filtered = [...cabs];

    // Search by cab number, registration, make, model
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (cab) =>
          cab.cabNumber?.toLowerCase().includes(term) ||
          cab.registrationNumber?.toLowerCase().includes(term) ||
          cab.make?.toLowerCase().includes(term) ||
          cab.model?.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((cab) => cab.status === statusFilter);
    }

    // Filter by type
    if (typeFilter !== "ALL") {
      filtered = filtered.filter((cab) => cab.cabType === typeFilter);
    }

    // Filter by airport license
    if (airportFilter === "LICENSED") {
      filtered = filtered.filter((cab) => cab.hasAirportLicense);
    } else if (airportFilter === "UNLICENSED") {
      filtered = filtered.filter((cab) => !cab.hasAirportLicense);
    }

    // Filter by share type
    if (shareTypeFilter !== "ALL") {
      filtered = filtered.filter((cab) => cab.shareType === shareTypeFilter);
    }

    // Filter by shift type
    if (shiftTypeFilter !== "ALL") {
      filtered = filtered.filter((cab) => cab.cabShiftType === shiftTypeFilter);
    }

    setFilteredCabs(filtered);
  };

  const handleOpenDialog = (cab = null) => {
    if (cab) {
      // Edit mode
      setEditMode(true);
      setSelectedCab(cab);
      setFormData({
        registrationNumber: cab.registrationNumber || "",
        make: cab.make || "",
        model: cab.model || "",
        year: cab.year || "",
        color: cab.color || "",
        cabType: cab.cabType || "SEDAN",
        shareType: cab.shareType || "",
        cabShiftType: cab.cabShiftType || "",
        hasAirportLicense: cab.hasAirportLicense || false,
        airportLicenseNumber: cab.airportLicenseNumber || "",
        airportLicenseExpiry: cab.airportLicenseExpiry || "",
        notes: cab.notes || "",
      });
    } else {
      // Create mode
      setEditMode(false);
      setSelectedCab(null);
      setFormData({
        registrationNumber: "",
        make: "",
        model: "",
        year: "",
        color: "",
        cabType: "SEDAN",
        shareType: "",
        cabShiftType: "",
        hasAirportLicense: false,
        airportLicenseNumber: "",
        airportLicenseExpiry: "",
        notes: "",
      });
    }
    
    setError("");
    setSuccess("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCab(null);
    setFormData({
      registrationNumber: "",
      make: "",
      model: "",
      year: "",
      color: "",
      cabType: "SEDAN",
      shareType: "",
      cabShiftType: "",
      hasAirportLicense: false,
      airportLicenseNumber: "",
      airportLicenseExpiry: "",
      notes: "",
    });
  };

  const handleSubmit = async () => {
    try {
      const url = editMode
        ? `${API_BASE_URL}/cabs/${selectedCab.id}`
        : `${API_BASE_URL}/cabs`;
      
      const method = editMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message || `Cab ${editMode ? "updated" : "created"} successfully`);
        handleCloseDialog();
        loadCabs();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save cab");
      }
    } catch (err) {
      console.error("Error saving cab:", err);
      setError("Failed to save cab");
    }
  };

  const handleStatusChange = async (cabId, action) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cabs/${cabId}/${action}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message);
        loadCabs();
      } else {
        setError(`Failed to ${action} cab`);
      }
    } catch (err) {
      console.error(`Error changing cab status:`, err);
      setError(`Failed to ${action} cab`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/signin");
  };

  // ===== Attribute Functions =====

  const loadAttributeTypes = async () => {
    try {
      // Load active types for dropdown in Tab 2
      const activeRes = await fetch(`${API_BASE_URL}/cab-attribute-types/active`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });
      if (activeRes.ok) {
        const data = await activeRes.json();
        setAttributeTypes(data);
      }

      // Load all types for management in Tab 3
      const allRes = await fetch(`${API_BASE_URL}/cab-attribute-types`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });
      if (allRes.ok) {
        const data = await allRes.json();
        setAllAttributeTypes(data);
      }
    } catch (err) {
      console.error("Error loading attribute types:", err);
    }
  };

  const loadCabAttributes = async (cabId) => {
    try {
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
      setError("Failed to load attributes");
    }
  };

  const handleSelectCabForAttributes = (event, cab) => {
    setSelectedCabForAttributes(cab);
    if (cab) {
      loadCabAttributes(cab.id);
    }
    setShowAttributeHistory(false);
  };

  const handleOpenAttributeDialog = (attribute = null) => {
    setEditingAttribute(attribute);
    if (attribute) {
      setAttributeFormData({
        attributeTypeId: attribute.attributeTypeId,
        attributeValue: attribute.attributeValue || "",
        startDate: attribute.startDate,
        endDate: attribute.endDate || "",
        notes: attribute.notes || "",
      });
    } else {
      setAttributeFormData({
        attributeTypeId: "",
        attributeValue: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        notes: "",
      });
    }
    setError("");
    setOpenAttributeDialog(true);
  };

  const handleCloseAttributeDialog = () => {
    setOpenAttributeDialog(false);
    setEditingAttribute(null);
  };

  const handleAttributeFormChange = (e) => {
    const { name, value } = e.target;
    setAttributeFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitAttribute = async () => {
    if (!selectedCabForAttributes) {
      setError("Please select a cab first");
      return;
    }
    if (!attributeFormData.attributeTypeId) {
      setError("Please select an attribute type");
      return;
    }
    if (!attributeFormData.startDate) {
      setError("Start date is required");
      return;
    }

    try {
      const url = editingAttribute
        ? `${API_BASE_URL}/cabs/${selectedCabForAttributes.id}/attributes/${editingAttribute.id}`
        : `${API_BASE_URL}/cabs/${selectedCabForAttributes.id}/attributes`;

      const method = editingAttribute ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
        body: JSON.stringify({
          attributeTypeId: parseInt(attributeFormData.attributeTypeId),
          attributeValue: attributeFormData.attributeValue || null,
          startDate: attributeFormData.startDate,
          endDate: attributeFormData.endDate || null,
          notes: attributeFormData.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save");
      }

      setSuccess(
        `Attribute ${editingAttribute ? "updated" : "assigned"} successfully`
      );
      handleCloseAttributeDialog();
      loadCabAttributes(selectedCabForAttributes.id);
    } catch (err) {
      console.error("Error saving attribute:", err);
      setError(err.message || "Failed to save attribute");
    }
  };

  const handleEndAttribute = async (attributeId) => {
    if (!window.confirm("End this attribute assignment?")) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/cabs/${selectedCabForAttributes.id}/attributes/${attributeId}/end`,
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
      loadCabAttributes(selectedCabForAttributes.id);
    } catch (err) {
      console.error("Error ending attribute:", err);
      setError("Failed to end attribute");
    }
  };

  const handleDeleteAttribute = async (attributeId) => {
    if (!window.confirm("Delete this attribute?")) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/cabs/${selectedCabForAttributes.id}/attributes/${attributeId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }
      );

      if (!response.ok) throw new Error("Failed to delete");

      setSuccess("Attribute deleted");
      loadCabAttributes(selectedCabForAttributes.id);
    } catch (err) {
      console.error("Error deleting:", err);
      setError("Failed to delete attribute");
    }
  };

  const getAttributeType = (typeId) => {
    return attributeTypes.find((t) => t.id === typeId);
  };

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: "success",
      MAINTENANCE: "warning",
      RETIRED: "error",
    };
    return colors[status] || "default";
  };

  const getTypeColor = (type) => {
    const colors = {
      SEDAN: "primary",
      HANDICAP_VAN: "secondary",
    };
    return colors[type] || "default";
  };

  // Attribute Types Management Functions
  useEffect(() => {
    filterAttributeTypes();
  }, [attributeTypeSearchTerm, attributeTypeCategoryFilter, attributeTypeStatusFilter, allAttributeTypes]);

  const filterAttributeTypes = () => {
    let filtered = [...allAttributeTypes];

    if (attributeTypeSearchTerm) {
      const term = attributeTypeSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (type) =>
          type.attributeName.toLowerCase().includes(term) ||
          type.attributeCode.toLowerCase().includes(term)
      );
    }

    if (attributeTypeCategoryFilter !== "ALL") {
      filtered = filtered.filter((type) => type.category === attributeTypeCategoryFilter);
    }

    if (attributeTypeStatusFilter !== "ALL") {
      const isActive = attributeTypeStatusFilter === "ACTIVE";
      filtered = filtered.filter((type) => type.active === isActive);
    }

    setFilteredAttributeTypes(filtered);
  };

  const handleSubmitAttributeType = async () => {
    try {
      if (!attributeTypeFormData.attributeName.trim()) {
        setError("Attribute name is required");
        return;
      }

      const url =
        attributeTypeDialogMode === "create"
          ? `${API_BASE_URL}/cab-attribute-types`
          : `${API_BASE_URL}/cab-attribute-types/${editingAttributeType.id}`;

      const method = attributeTypeDialogMode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
        body: JSON.stringify(attributeTypeFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save attribute type");
      }

      setSuccess(
        `Attribute type ${attributeTypeDialogMode === "create" ? "created" : "updated"} successfully`
      );
      setOpenAttributeTypeDialog(false);
      loadAttributeTypes();
    } catch (err) {
      console.error("Error saving attribute type:", err);
      setError(err.message || "Failed to save attribute type");
    }
  };

  const handleToggleAttributeTypeStatus = async (typeId, isActive) => {
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

  const handleDeleteAttributeType = async (typeId) => {
    if (!window.confirm("Are you sure you want to delete this attribute type?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/cab-attribute-types/${typeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });

      if (!response.ok) throw new Error("Failed to delete");

      setSuccess("Attribute type deleted successfully");
      loadAttributeTypes();
    } catch (err) {
      console.error("Error deleting:", err);
      setError("Failed to delete attribute type");
    }
  };

  const handleDownloadMenuOpen = (event) => {
    setDownloadMenuAnchor(event.currentTarget);
  };

  const handleDownloadMenuClose = () => {
    setDownloadMenuAnchor(null);
  };

  const handleDownloadCSV = () => {
    const dataToExport = formatCabsForExport(filteredCabs.length > 0 ? filteredCabs : cabs);
    const fileName = `cabs_${new Date().toISOString().split("T")[0]}.csv`;
    downloadCSV(dataToExport, fileName);
    handleDownloadMenuClose();
  };

  const handleDownloadPDF = async () => {
    const dataToExport = formatCabsForExport(filteredCabs.length > 0 ? filteredCabs : cabs);
    const fileName = `cabs_${new Date().toISOString().split("T")[0]}.pdf`;
    await downloadPDF(dataToExport, fileName, "Cab List");
    handleDownloadMenuClose();
  };

  if (!currentUser) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  const hasActiveFilters = searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL" || airportFilter !== "ALL" || shareTypeFilter !== "ALL" || shiftTypeFilter !== "ALL";
  const canEdit = ["ADMIN", "MANAGER"].includes(currentUser.role);

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
      {/* Global Navigation */}
      <GlobalNav currentUser={currentUser} title="FareFlow - Cab Management" />

      {/* Tabs */}
      <Paper sx={{ mb: 0 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => {
            setActiveTab(newValue);
            setError("");
            setSuccess("");
          }}
          sx={{ p: 0 }}
        >
          <Tab label="Manage Cabs" icon={<DirectionsCar />} iconPosition="start" />
          <Tab label="Manage Attributes" icon={<AirportIcon />} iconPosition="start" />
          <Tab label="Attribute Types" icon={<TuneIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Main Content */}
      <Box sx={{ p: 3 }}>
        {/* Success/Error Messages */}
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

        {/* TAB 0: Manage Cabs */}
        {activeTab === 0 && (
          <>
        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Cabs
                </Typography>
                <Typography variant="h4">{cabs.length}</Typography>
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
                  {cabs.filter((c) => c.status === "ACTIVE").length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  In Maintenance
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {cabs.filter((c) => c.status === "MAINTENANCE").length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Airport Licensed
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {cabs.filter((c) => c.hasAirportLicense).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Actions */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
            <TextField
              label="Search"
              placeholder="Cab#, Registration, Make, Model"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ minWidth: 250 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Status</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                <MenuItem value="RETIRED">Retired</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Types</MenuItem>
                <MenuItem value="SEDAN">Sedan</MenuItem>
                <MenuItem value="HANDICAP_VAN">Handicap Van</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Airport License</InputLabel>
              <Select
                value={airportFilter}
                label="Airport License"
                onChange={(e) => setAirportFilter(e.target.value)}
              >
                <MenuItem value="ALL">All</MenuItem>
                <MenuItem value="LICENSED">Licensed</MenuItem>
                <MenuItem value="UNLICENSED">Unlicensed</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Share Type</InputLabel>
              <Select
                value={shareTypeFilter}
                label="Share Type"
                onChange={(e) => setShareTypeFilter(e.target.value)}
              >
                <MenuItem value="ALL">All</MenuItem>
                <MenuItem value="VOTING_SHARE">Voting Share</MenuItem>
                <MenuItem value="NON_VOTING_SHARE">Non-Voting Share</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Shift Type</InputLabel>
              <Select
                value={shiftTypeFilter}
                label="Shift Type"
                onChange={(e) => setShiftTypeFilter(e.target.value)}
              >
                <MenuItem value="ALL">All</MenuItem>
                <MenuItem value="SINGLE">Single</MenuItem>
                <MenuItem value="DOUBLE">Double</MenuItem>
              </Select>
            </FormControl>

            {hasActiveFilters && (
              <Button
                variant="outlined"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("ALL");
                  setTypeFilter("ALL");
                  setAirportFilter("ALL");
                  setShareTypeFilter("ALL");
                  setShiftTypeFilter("ALL");
                }}
              >
                Clear Filters
              </Button>
            )}

            <Box sx={{ flexGrow: 1 }} />

            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadMenuOpen}
              disabled={cabs.length === 0}
            >
              Download
            </Button>
            <Menu
              anchorEl={downloadMenuAnchor}
              open={Boolean(downloadMenuAnchor)}
              onClose={handleDownloadMenuClose}
            >
              <MenuItem onClick={handleDownloadCSV}>
                Download as CSV
              </MenuItem>
              <MenuItem onClick={handleDownloadPDF}>
                Download as PDF
              </MenuItem>
            </Menu>

            {canEdit && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add Cab
              </Button>
            )}
          </Box>

          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="textSecondary">
              Showing {filteredCabs.length} of {cabs.length} cabs
              {hasActiveFilters && " (filtered)"}
            </Typography>
          </Box>
        </Paper>

        {/* Cabs Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell><strong>Cab #</strong></TableCell>
                <TableCell><strong>Registration</strong></TableCell>
                <TableCell><strong>Vehicle</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Share Type</strong></TableCell>
                <TableCell><strong>Shift Type</strong></TableCell>
                <TableCell><strong>Airport</strong></TableCell>
                <TableCell><strong>Attributes</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                {canEdit && <TableCell align="center"><strong>Actions</strong></TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 10 : 9} align="center">
                    Loading cabs...
                  </TableCell>
                </TableRow>
              ) : filteredCabs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 10 : 9} align="center">
                    No cabs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCabs.map((cab) => (
                  <TableRow key={cab.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: "bold" }}>
                        {cab.cabNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{cab.registrationNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {cab.year} {cab.make} {cab.model}
                        </Typography>
                        {cab.color && (
                          <Typography variant="caption" color="textSecondary">
                            {cab.color}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={cab.cabType === "HANDICAP_VAN" ? "Handicap Van" : "Sedan"}
                        color={getTypeColor(cab.cabType)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {cab.shareType ? (
                        <Chip
                          label={cab.shareType === "VOTING_SHARE" ? "Voting" : "Non-Voting"}
                          color={cab.shareType === "VOTING_SHARE" ? "primary" : "default"}
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="body2" color="textSecondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {cab.cabShiftType ? (
                        <Chip
                          label={cab.cabShiftType === "SINGLE" ? "Single" : "Double"}
                          color={cab.cabShiftType === "DOUBLE" ? "secondary" : "default"}
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="body2" color="textSecondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {cab.hasAirportLicense ? (
                        <Tooltip title={`License: ${cab.airportLicenseNumber || "N/A"} | Expiry: ${cab.airportLicenseExpiry || "N/A"}`}>
                          <Chip
                            icon={<AirportIcon />}
                            label={cab.airportLicenseExpired ? "Expired" : "Yes"}
                            color={cab.airportLicenseExpired ? "error" : "success"}
                            size="small"
                          />
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {cabAttributesMap[cab.id] && cabAttributesMap[cab.id].length > 0 ? (
                        <Typography variant="body2">
                          {cabAttributesMap[cab.id]
                            .map((attr) => {
                              // Handle different possible field names from the API
                              const attrName = attr.attributeTypeName || attr.attributeName || attr.name || 'Unknown';
                              const attrValue = attr.attributeValue || attr.value;
                              return attrValue ? `${attrName} (${attrValue})` : attrName;
                            })
                            .join(", ")}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={cab.status}
                        color={getStatusColor(cab.status)}
                        size="small"
                      />
                    </TableCell>
                    {canEdit && (
                      <TableCell align="center">
                        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(cab)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          {cab.status === "ACTIVE" && (
                            <Tooltip title="Set Maintenance">
                              <IconButton
                                size="small"
                                onClick={() => handleStatusChange(cab.id, "maintenance")}
                                color="warning"
                              >
                                <BuildIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          {cab.status === "MAINTENANCE" && (
                            <Tooltip title="Activate">
                              <IconButton
                                size="small"
                                onClick={() => handleStatusChange(cab.id, "activate")}
                                color="success"
                              >
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          {currentUser.role === "ADMIN" && cab.status !== "RETIRED" && (
                            <Tooltip title="Retire">
                              <IconButton
                                size="small"
                                onClick={() => handleStatusChange(cab.id, "retire")}
                                color="error"
                              >
                                <BlockIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        </>
        )}

        {/* TAB 1: Manage Attributes */}
        {activeTab === 1 && (
          <Box>
            {/* Cab Selection */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Select a Cab
              </Typography>
              <Autocomplete
                options={cabs}
                getOptionLabel={(cab) => `${cab.cabNumber} - ${cab.registrationNumber}`}
                value={selectedCabForAttributes}
                onChange={handleSelectCabForAttributes}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search and select a cab"
                    placeholder="CAB-001, Registration..."
                  />
                )}
              />
            </Paper>

            {selectedCabForAttributes ? (
              <>
                {/* Cab Info Card */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography color="textSecondary" gutterBottom>
                          Cab Number
                        </Typography>
                        <Typography variant="h6">
                          {selectedCabForAttributes.cabNumber}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography color="textSecondary" gutterBottom>
                          Registration
                        </Typography>
                        <Typography variant="h6">
                          {selectedCabForAttributes.registrationNumber}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography color="textSecondary" gutterBottom>
                          Make/Model
                        </Typography>
                        <Typography variant="h6">
                          {selectedCabForAttributes.make} {selectedCabForAttributes.model}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography color="textSecondary" gutterBottom>
                          Status
                        </Typography>
                        <Chip
                          label={selectedCabForAttributes.status}
                          color={
                            selectedCabForAttributes.status === "ACTIVE"
                              ? "success"
                              : selectedCabForAttributes.status === "MAINTENANCE"
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
                    variant={!showAttributeHistory ? "contained" : "outlined"}
                    onClick={() => setShowAttributeHistory(false)}
                    sx={{ mr: 1 }}
                  >
                    Current Attributes ({currentAttributes.length})
                  </Button>
                  <Button
                    variant={showAttributeHistory ? "contained" : "outlined"}
                    onClick={() => setShowAttributeHistory(true)}
                  >
                    History ({attributeHistory.length})
                  </Button>
                </Box>

                {!showAttributeHistory ? (
                  <>
                    {/* Current Attributes */}
                    <Paper sx={{ mb: 3 }}>
                      <Box
                        sx={{
                          p: 2,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="h6">Current Attributes</Typography>
                        {canEdit && (
                          <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenAttributeDialog()}
                          >
                            Assign Attribute
                          </Button>
                        )}
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
                                <TableCell>
                                  <strong>Attribute</strong>
                                </TableCell>
                                <TableCell>
                                  <strong>Value</strong>
                                </TableCell>
                                <TableCell>
                                  <strong>Start Date</strong>
                                </TableCell>
                                <TableCell>
                                  <strong>Notes</strong>
                                </TableCell>
                                {canEdit && (
                                  <TableCell align="right">
                                    <strong>Actions</strong>
                                  </TableCell>
                                )}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {currentAttributes.map((attr) => (
                                <TableRow key={attr.id} hover>
                                  <TableCell>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                      }}
                                    >
                                      <CheckCircleIcon
                                        sx={{ color: "green", fontSize: 18 }}
                                      />
                                      {attr.attributeName}
                                    </Box>
                                  </TableCell>
                                  <TableCell sx={{ fontFamily: "monospace" }}>
                                    {attr.attributeValue || "-"}
                                  </TableCell>
                                  <TableCell>{attr.startDate}</TableCell>
                                  <TableCell>{attr.notes || "-"}</TableCell>
                                  {canEdit && (
                                    <TableCell align="right">
                                      <Tooltip title="Edit">
                                        <IconButton
                                          size="small"
                                          color="primary"
                                          onClick={() => handleOpenAttributeDialog(attr)}
                                        >
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="End Assignment">
                                        <IconButton
                                          size="small"
                                          color="warning"
                                          onClick={() => handleEndAttribute(attr.id)}
                                        >
                                          <CloseIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </TableCell>
                                  )}
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
                                <TableCell>
                                  <strong>Attribute</strong>
                                </TableCell>
                                <TableCell>
                                  <strong>Value</strong>
                                </TableCell>
                                <TableCell>
                                  <strong>Start</strong>
                                </TableCell>
                                <TableCell>
                                  <strong>End</strong>
                                </TableCell>
                                <TableCell>
                                  <strong>Status</strong>
                                </TableCell>
                                {canEdit && (
                                  <TableCell align="right">
                                    <strong>Actions</strong>
                                  </TableCell>
                                )}
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
                                      color={
                                        attr.isCurrent ? "success" : "default"
                                      }
                                      icon={
                                        attr.isCurrent ? (
                                          <CheckCircleIcon />
                                        ) : (
                                          <BlockIcon />
                                        )
                                      }
                                    />
                                  </TableCell>
                                  {canEdit && (
                                    <TableCell align="right">
                                      {attr.isCurrent && (
                                        <Tooltip title="Delete">
                                          <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() =>
                                              handleDeleteAttribute(attr.id)
                                            }
                                          >
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                    </TableCell>
                                  )}
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
          </Box>
        )}

        {/* TAB 2: Manage Attribute Types */}
        {activeTab === 2 && (
          <>
            {/* Header */}
            <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                Cab Attribute Types
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setAttributeTypeDialogMode("create");
                  setEditingAttributeType(null);
                  setAttributeTypeFormData({
                    attributeCode: "",
                    attributeName: "",
                    description: "",
                    category: "LICENSE",
                    dataType: "STRING",
                    requiresValue: false,
                    validationPattern: "",
                    helpText: "",
                  });
                  setOpenAttributeTypeDialog(true);
                }}
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
                    <Typography variant="h4">{allAttributeTypes.length}</Typography>
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
                      {allAttributeTypes.filter((t) => t.active).length}
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
                      {allAttributeTypes.filter((t) => !t.active).length}
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
                  value={attributeTypeSearchTerm}
                  onChange={(e) => setAttributeTypeSearchTerm(e.target.value)}
                  size="small"
                  sx={{ minWidth: 200 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  select
                  label="Category"
                  value={attributeTypeCategoryFilter}
                  onChange={(e) => setAttributeTypeCategoryFilter(e.target.value)}
                  size="small"
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="ALL">All Categories</MenuItem>
                  <MenuItem value="LICENSE">License/Permit</MenuItem>
                  <MenuItem value="EQUIPMENT">Equipment/Hardware</MenuItem>
                  <MenuItem value="TYPE">Vehicle Type/Classification</MenuItem>
                  <MenuItem value="PERMIT">Special Permits</MenuItem>
                  <MenuItem value="CERTIFICATION">Certifications</MenuItem>
                </TextField>

                <TextField
                  select
                  label="Status"
                  value={attributeTypeStatusFilter}
                  onChange={(e) => setAttributeTypeStatusFilter(e.target.value)}
                  size="small"
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="ALL">All Status</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                </TextField>

                {(attributeTypeSearchTerm || attributeTypeCategoryFilter !== "ALL" || attributeTypeStatusFilter !== "ALL") && (
                  <Button
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={() => {
                      setAttributeTypeSearchTerm("");
                      setAttributeTypeCategoryFilter("ALL");
                      setAttributeTypeStatusFilter("ALL");
                    }}
                  >
                    Clear
                  </Button>
                )}
              </Box>
            </Paper>

            {/* Results Count */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Showing {filteredAttributeTypes.length} of {allAttributeTypes.length} types
              </Typography>
            </Box>

            {/* Table */}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell><strong>Code</strong></TableCell>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Category</strong></TableCell>
                    <TableCell><strong>Data Type</strong></TableCell>
                    <TableCell align="center"><strong>Requires Value</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAttributeTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography color="textSecondary">
                          {allAttributeTypes.length === 0
                            ? "No attribute types found"
                            : "No matches for your filters"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAttributeTypes.map((type) => (
                      <TableRow key={type.id} hover>
                        <TableCell sx={{ fontFamily: "monospace" }}>
                          {type.attributeCode}
                        </TableCell>
                        <TableCell>{type.attributeName}</TableCell>
                        <TableCell>
                          <Chip label={type.category} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{type.dataType}</TableCell>
                        <TableCell align="center">
                          {type.requiresValue ? (
                            <CheckCircleIcon sx={{ color: "green" }} />
                          ) : (
                            <BlockIcon sx={{ color: "gray" }} />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={type.active ? "Active" : "Inactive"}
                            color={type.active ? "success" : "default"}
                            size="small"
                            icon={type.active ? <CheckCircleIcon /> : <BlockIcon />}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setAttributeTypeDialogMode("edit");
                              setEditingAttributeType(type);
                              setAttributeTypeFormData({
                                attributeCode: type.attributeCode,
                                attributeName: type.attributeName,
                                description: type.description || "",
                                category: type.category,
                                dataType: type.dataType,
                                requiresValue: type.requiresValue,
                                validationPattern: type.validationPattern || "",
                                helpText: type.helpText || "",
                              });
                              setOpenAttributeTypeDialog(true);
                            }}
                            title="Edit"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color={type.active ? "warning" : "success"}
                            onClick={() => handleToggleAttributeTypeStatus(type.id, type.active)}
                            title={type.active ? "Deactivate" : "Activate"}
                          >
                            {type.active ? (
                              <BlockIcon fontSize="small" />
                            ) : (
                              <CheckCircleIcon fontSize="small" />
                            )}
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteAttributeType(type.id)}
                            title="Delete"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">
              {editMode ? "Edit Cab" : "Add New Cab"}
            </Typography>
            <IconButton onClick={handleCloseDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2}>
            {editMode && (
              <Grid item xs={12}>
                <TextField
                  label="Cab Number"
                  value={selectedCab?.cabNumber || ""}
                  fullWidth
                  disabled
                  size="small"
                />
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                required
                label="Registration Number"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                fullWidth
                size="small"
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Make"
                placeholder="Toyota"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                fullWidth
                size="small"
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Model"
                placeholder="Camry"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                fullWidth
                size="small"
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                fullWidth
                size="small"
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                fullWidth
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Cab Type</InputLabel>
                <Select
                  value={formData.cabType}
                  label="Cab Type"
                  onChange={(e) => setFormData({ ...formData, cabType: e.target.value })}
                >
                  <MenuItem value="SEDAN">Sedan</MenuItem>
                  <MenuItem value="HANDICAP_VAN">Handicap Van</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Share Type</InputLabel>
                <Select
                  value={formData.shareType}
                  label="Share Type"
                  onChange={(e) => setFormData({ ...formData, shareType: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="VOTING_SHARE">Voting Share</MenuItem>
                  <MenuItem value="NON_VOTING_SHARE">Non-Voting Share</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Shift Type</InputLabel>
                <Select
                  value={formData.cabShiftType}
                  label="Shift Type"
                  onChange={(e) => setFormData({ ...formData, cabShiftType: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="SINGLE">Single Shift</MenuItem>
                  <MenuItem value="DOUBLE">Double Shift</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.hasAirportLicense}
                    onChange={(e) => setFormData({ ...formData, hasAirportLicense: e.target.checked })}
                  />
                }
                label="Has Airport License"
              />
            </Grid>

            {formData.hasAirportLicense && (
              <>
                <Grid item xs={6}>
                  <TextField
                    label="Airport License Number"
                    value={formData.airportLicenseNumber}
                    onChange={(e) => setFormData({ ...formData, airportLicenseNumber: e.target.value })}
                    fullWidth
                    size="small"
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    label="License Expiry"
                    type="date"
                    value={formData.airportLicenseExpiry}
                    onChange={(e) => setFormData({ ...formData, airportLicenseExpiry: e.target.value })}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <TextField
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                fullWidth
                multiline
                rows={3}
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editMode ? "Update" : "Add"} Cab
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign/Edit Attribute Dialog */}
      <Dialog open={openAttributeDialog} onClose={handleCloseAttributeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAttribute ? "Edit Attribute" : "Assign Attribute"}
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
            value={attributeFormData.attributeTypeId}
            onChange={handleAttributeFormChange}
            disabled={editingAttribute}
            helperText={editingAttribute ? "Type cannot be changed" : ""}
          >
            {attributeTypes.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.attributeName}
              </MenuItem>
            ))}
          </TextField>

          {attributeFormData.attributeTypeId &&
            getAttributeType(parseInt(attributeFormData.attributeTypeId))?.requiresValue && (
            <TextField
              fullWidth
              margin="normal"
              label="Value"
              name="attributeValue"
              value={attributeFormData.attributeValue}
              onChange={handleAttributeFormChange}
              placeholder="e.g., License Number or ID"
            />
          )}

          <TextField
            fullWidth
            margin="normal"
            label="Start Date"
            name="startDate"
            type="date"
            value={attributeFormData.startDate}
            onChange={handleAttributeFormChange}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            margin="normal"
            label="End Date (Optional)"
            name="endDate"
            type="date"
            value={attributeFormData.endDate}
            onChange={handleAttributeFormChange}
            InputLabelProps={{ shrink: true }}
            helperText="Leave blank for ongoing"
          />

          <TextField
            fullWidth
            margin="normal"
            label="Notes"
            name="notes"
            value={attributeFormData.notes}
            onChange={handleAttributeFormChange}
            multiline
            rows={2}
            placeholder="Optional notes"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAttributeDialog}>Cancel</Button>
          <Button onClick={handleSubmitAttribute} variant="contained" color="primary">
            {editingAttribute ? "Update" : "Assign"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create/Edit Attribute Type Dialog */}
      <Dialog open={openAttributeTypeDialog} onClose={() => setOpenAttributeTypeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {attributeTypeDialogMode === "create"
            ? "Create Attribute Type"
            : `Edit: ${editingAttributeType?.attributeName}`}
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
            value={attributeTypeFormData.attributeCode}
            onChange={(e) => setAttributeTypeFormData({ ...attributeTypeFormData, attributeCode: e.target.value })}
            disabled={attributeTypeDialogMode === "edit"}
            placeholder="e.g., AIRPORT_LICENSE"
            helperText={
              attributeTypeDialogMode === "edit" ? "Code cannot be changed" : "Unique identifier"
            }
          />

          <TextField
            fullWidth
            margin="normal"
            label="Attribute Name"
            value={attributeTypeFormData.attributeName}
            onChange={(e) => setAttributeTypeFormData({ ...attributeTypeFormData, attributeName: e.target.value })}
            placeholder="e.g., Airport License"
          />

          <TextField
            fullWidth
            margin="normal"
            label="Description"
            value={attributeTypeFormData.description}
            onChange={(e) => setAttributeTypeFormData({ ...attributeTypeFormData, description: e.target.value })}
            multiline
            rows={2}
          />

          <TextField
            select
            fullWidth
            margin="normal"
            label="Category"
            value={attributeTypeFormData.category}
            onChange={(e) => setAttributeTypeFormData({ ...attributeTypeFormData, category: e.target.value })}
          >
            <MenuItem value="LICENSE">License/Permit</MenuItem>
            <MenuItem value="EQUIPMENT">Equipment/Hardware</MenuItem>
            <MenuItem value="TYPE">Vehicle Type/Classification</MenuItem>
            <MenuItem value="PERMIT">Special Permits</MenuItem>
            <MenuItem value="CERTIFICATION">Certifications</MenuItem>
          </TextField>

          <TextField
            select
            fullWidth
            margin="normal"
            label="Data Type"
            value={attributeTypeFormData.dataType}
            onChange={(e) => setAttributeTypeFormData({ ...attributeTypeFormData, dataType: e.target.value })}
          >
            <MenuItem value="STRING">Text</MenuItem>
            <MenuItem value="NUMBER">Number</MenuItem>
            <MenuItem value="DATE">Date</MenuItem>
            <MenuItem value="BOOLEAN">Yes/No</MenuItem>
          </TextField>

          <FormControlLabel
            control={
              <Checkbox
                checked={attributeTypeFormData.requiresValue}
                onChange={(e) => setAttributeTypeFormData({ ...attributeTypeFormData, requiresValue: e.target.checked })}
              />
            }
            label="Requires Value (e.g., License Number)"
            sx={{ my: 1 }}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Validation Pattern (Regex)"
            value={attributeTypeFormData.validationPattern}
            onChange={(e) => setAttributeTypeFormData({ ...attributeTypeFormData, validationPattern: e.target.value })}
            placeholder="Optional regex for validation"
            helperText="Leave empty for no validation"
          />

          <TextField
            fullWidth
            margin="normal"
            label="Help Text"
            value={attributeTypeFormData.helpText}
            onChange={(e) => setAttributeTypeFormData({ ...attributeTypeFormData, helpText: e.target.value })}
            multiline
            rows={2}
            placeholder="Guide text for users"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAttributeTypeDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmitAttributeType} variant="contained" color="primary">
            {attributeTypeDialogMode === "create" ? "Create" : "Update"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}