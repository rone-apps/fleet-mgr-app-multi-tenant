"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GlobalNav from "../components/GlobalNav";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Block, CheckCircle, Star, Edit as EditIcon, Add as AddIcon } from "@mui/icons-material";
import { getCurrentUser, isAuthenticated, API_BASE_URL, getTenantSchema, tenantFetch } from "../lib/api";

export default function DriversPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tenantSchema, setTenantSchema] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("create"); // "create" or "edit"
  const [editingDriver, setEditingDriver] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    driverNumber: "",
    firstName: "",
    lastName: "",
    licenseNumber: "",
    licenseExpiry: "",
    phone: "",
    email: "",
    address: "",
    joinedDate: "",
    notes: "",
    isOwner: false,
    sin: "",
    gstNumber: "",
    depositAmount: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    securityDepositDate: "",
    refundDate: "",
    picDate: "",
    ibcRecordsDate: "",
  });

  // Initialize tenant and user
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/signin");
      return;
    }

    const user = getCurrentUser();
    setCurrentUser(user);
    setTenantSchema(getTenantSchema());

    if (!["ADMIN", "MANAGER", "DISPATCHER"].includes(user?.role)) {
      router.push("/");
      return;
    }
  }, [router]);

  // Load drivers when tenant changes
  useEffect(() => {
    if (tenantSchema && currentUser) {
      loadDrivers();
    }
  }, [tenantSchema, currentUser]);

  // Filter drivers whenever search/filter changes
  useEffect(() => {
    filterDrivers();
  }, [searchTerm, statusFilter, typeFilter, drivers]);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await tenantFetch(`${API_BASE_URL}/drivers`);

      if (!response.ok) {
        throw new Error("Failed to load drivers");
      }

      const data = await response.json();

      const sorted = data.sort((a, b) => {
        const nameA = `${a.firstName ?? ""} ${a.lastName ?? ""}`.toLowerCase();
        const nameB = `${b.firstName ?? ""} ${b.lastName ?? ""}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });

      setDrivers(sorted);
    } catch (err) {
      console.error(err);
      setError("Failed to load drivers");
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  const filterDrivers = () => {
    let filtered = [...drivers];

    // Search by name or driver number
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (driver) =>
          `${driver.firstName ?? ""} ${driver.lastName ?? ""}`.toLowerCase().includes(term) ||
          driver.driverNumber?.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((driver) => driver.status === statusFilter);
    }

    // Filter by type (Owner/Driver)
    if (typeFilter !== "ALL") {
      if (typeFilter === "OWNER") {
        filtered = filtered.filter((driver) => driver.isOwner);
      } else if (typeFilter === "DRIVER") {
        filtered = filtered.filter((driver) => !driver.isOwner);
      }
    }

    setFilteredDrivers(filtered);
  };

  const handleToggleStatus = async (driver) => {
    try {
      const endpoint =
        driver.status === "ACTIVE"
          ? `${API_BASE_URL}/drivers/${driver.id}/suspend`
          : `${API_BASE_URL}/drivers/${driver.id}/activate`;

      await tenantFetch(endpoint, {
        method: "PUT"
      });

      setDrivers((prev) =>
        prev.map((d) =>
          d.id === driver.id
            ? { ...d, status: d.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" }
            : d
        )
      );
    } catch {
      setError("Failed to update driver status");
    }
  };

  const handleOpenDialog = (driver = null) => {
    if (driver) {
      // Edit mode
      setDialogMode("edit");
      setEditingDriver(driver);
      setFormData({
        driverNumber: driver.driverNumber || "",
        firstName: driver.firstName || "",
        lastName: driver.lastName || "",
        licenseNumber: driver.licenseNumber || "",
        licenseExpiry: driver.licenseExpiry || "",
        phone: driver.phone || "",
        email: driver.email || "",
        address: driver.address || "",
        joinedDate: driver.joinedDate || "",
        notes: driver.notes || "",
        isOwner: driver.isOwner || false,
        sin: driver.sin || "",
        gstNumber: driver.gstNumber || "",
        depositAmount: driver.depositAmount || "",
        emergencyContactName: driver.emergencyContactName || "",
        emergencyContactPhone: driver.emergencyContactPhone || "",
        emergencyContactRelationship: driver.emergencyContactRelationship || "",
        securityDepositDate: driver.securityDepositDate || "",
        refundDate: driver.refundDate || "",
        picDate: driver.picDate || "",
        ibcRecordsDate: driver.ibcRecordsDate || "",
      });
    } else {
      // Create mode
      setDialogMode("create");
      setEditingDriver(null);
      setFormData({
        driverNumber: "",
        firstName: "",
        lastName: "",
        licenseNumber: "",
        licenseExpiry: "",
        phone: "",
        email: "",
        address: "",
        joinedDate: new Date().toISOString().split("T")[0],
        notes: "",
        isOwner: false,
        sin: "",
        gstNumber: "",
        depositAmount: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        emergencyContactRelationship: "",
        securityDepositDate: "",
        refundDate: "",
        picDate: "",
        ibcRecordsDate: "",
      });
    }
    setError("");
    setSuccess("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDriver(null);
    setFormData({
      driverNumber: "",
      firstName: "",
      lastName: "",
      licenseNumber: "",
      licenseExpiry: "",
      phone: "",
      email: "",
      address: "",
      joinedDate: "",
      notes: "",
      isOwner: false,
      sin: "",
      gstNumber: "",
      depositAmount: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelationship: "",
      securityDepositDate: "",
      refundDate: "",
      picDate: "",
      ibcRecordsDate: "",
    });
    setError("");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    // Required fields validation
    if (!formData.firstName?.trim()) {
      setError("First name is required");
      return false;
    }
    if (!formData.lastName?.trim()) {
      setError("Last name is required");
      return false;
    }
    if (!formData.licenseNumber?.trim()) {
      setError("License number is required");
      return false;
    }

    // First name length
    if (formData.firstName.trim().length < 2 || formData.firstName.trim().length > 50) {
      setError("First name must be between 2 and 50 characters");
      return false;
    }

    // Last name length
    if (formData.lastName.trim().length < 2 || formData.lastName.trim().length > 50) {
      setError("Last name must be between 2 and 50 characters");
      return false;
    }

    // License number length
    if (formData.licenseNumber.trim().length > 50) {
      setError("License number must be max 50 characters");
      return false;
    }

    // Email validation if provided
    if (formData.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("Please enter a valid email address");
        return false;
      }
    }

    // Phone validation
    if (formData.phone?.trim() && formData.phone.trim().length > 20) {
      setError("Phone number must be max 20 characters");
      return false;
    }

    // Notes length
    if (formData.notes?.length > 1000) {
      setError("Notes must be max 1000 characters");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setFormLoading(true);
    setError("");

    try {
      const url = dialogMode === "create"
        ? `${API_BASE_URL}/drivers`
        : `${API_BASE_URL}/drivers/${editingDriver.id}`;

      const method = dialogMode === "create" ? "POST" : "PUT";

      const response = await tenantFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Driver ${dialogMode === "create" ? "created" : "updated"} successfully!`);
        handleCloseDialog();
        loadDrivers();

        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || `Failed to ${dialogMode === "create" ? "create" : "update"} driver`);
      }
    } catch (err) {
      console.error("Error saving driver:", err);
      setError(`Failed to ${dialogMode === "create" ? "create" : "update"} driver`);
    } finally {
      setFormLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  const canEdit = ["ADMIN", "MANAGER"].includes(currentUser.role);

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
      <GlobalNav currentUser={currentUser} title="FareFlow - Driver Management" />

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {loading ? (
          <CircularProgress />
        ) : (
          <>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success" onClose={() => setSuccess("")}>{success}</Alert>}

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography variant="h4">
                Driver Management
              </Typography>
              {canEdit && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                >
                  Add Driver
                </Button>
              )}
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
                <TextField
                  label="Search"
                  placeholder="Name or Driver #"
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
                    <MenuItem value="SUSPENDED">Suspended</MenuItem>
                    <MenuItem value="TERMINATED">Terminated</MenuItem>
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
                    <MenuItem value="OWNER">Owner</MenuItem>
                    <MenuItem value="DRIVER">Driver</MenuItem>
                  </Select>
                </FormControl>

                {(searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL") && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("ALL");
                      setTypeFilter("ALL");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}

                <Box sx={{ flexGrow: 1 }} />
              </Box>

              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  Showing {filteredDrivers.length} of {drivers.length} drivers
                  {(searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL") && " (filtered)"}
                </Typography>
              </Box>
            </Paper>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell><strong>Driver #</strong></TableCell>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>License #</strong></TableCell>
                    <TableCell><strong>Phone</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    {canEdit && <TableCell align="center"><strong>Actions</strong></TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDrivers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canEdit ? 7 : 6} align="center">
                        {drivers.length === 0 ? "No drivers found" : "No matches for your filters"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDrivers.map((driver) => (
                      <TableRow key={driver.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: "bold" }}>
                            {driver.driverNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="body2">
                              {driver.firstName} {driver.lastName}
                            </Typography>
                            {driver.isOwner && (
                              <Star sx={{ fontSize: 16, color: "#FFD700" }} title="Owner" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                            {driver.licenseNumber ? (
                              driver.licenseNumber.length > 8
                                ? `${driver.licenseNumber.slice(0, 4)}...${driver.licenseNumber.slice(-4)}`
                                : driver.licenseNumber
                            ) : "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {driver.phone || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={driver.isOwner ? "Owner" : "Driver"}
                            color={driver.isOwner ? "warning" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={driver.status}
                            color={
                              driver.status === "ACTIVE"
                                ? "success"
                                : driver.status === "SUSPENDED"
                                ? "warning"
                                : "default"
                            }
                            size="small"
                            icon={driver.status === "ACTIVE" ? <CheckCircle /> : <Block />}
                          />
                        </TableCell>
                        {canEdit && (
                          <TableCell align="center">
                            <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenDialog(driver)}
                                title="Edit Driver"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color={driver.status === "ACTIVE" ? "warning" : "success"}
                                onClick={() => handleToggleStatus(driver)}
                                title={driver.status === "ACTIVE" ? "Suspend" : "Activate"}
                              >
                                {driver.status === "ACTIVE" ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                              </IconButton>
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
      </Container>

      {/* Create/Edit Driver Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          {dialogMode === "create" ? "Add New Driver" : `Edit Driver: ${editingDriver?.firstName} ${editingDriver?.lastName}`}
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {/* Row 1: Driver Number & License Number */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Driver Number"
                  value={formData.driverNumber}
                  onChange={handleChange}
                  name="driverNumber"
                  fullWidth
                  size="small"
                  disabled={dialogMode === "edit"}
                  helperText={dialogMode === "create" ? "Auto-generated if left empty" : ""}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  label="License Number"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  name="licenseNumber"
                  fullWidth
                  size="small"
                />
              </Grid>

              {/* Row 2: First Name & Last Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  name="firstName"
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  name="lastName"
                  fullWidth
                  size="small"
                />
              </Grid>

              {/* Row 3: License Expiry & Joined Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="License Expiry"
                  value={formData.licenseExpiry}
                  onChange={handleChange}
                  name="licenseExpiry"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Joined Date"
                  value={formData.joinedDate}
                  onChange={handleChange}
                  name="joinedDate"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Row 4: Phone & Email */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone"
                  value={formData.phone}
                  onChange={handleChange}
                  name="phone"
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  value={formData.email}
                  onChange={handleChange}
                  name="email"
                  type="email"
                  fullWidth
                  size="small"
                />
              </Grid>

              {/* Row 5: Address */}
              <Grid item xs={12}>
                <TextField
                  label="Address"
                  value={formData.address}
                  onChange={handleChange}
                  name="address"
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                />
              </Grid>

              {/* Row 6: Notes */}
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  value={formData.notes}
                  onChange={handleChange}
                  name="notes"
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  helperText={`${formData.notes.length}/1000 characters`}
                />
              </Grid>

              {/* Row 7: Is Owner */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.isOwner}
                      onChange={handleChange}
                      name="isOwner"
                    />
                  }
                  label="Is Owner (Check if this driver is a cab owner)"
                />
              </Grid>

              {/* Divider for Tax & Financial Info */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: "bold", color: "#1976d2" }}>
                  Tax & Financial Information
                </Typography>
              </Grid>

              {/* Row 8: SIN & GST Number */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="SIN (Social Insurance Number)"
                  value={formData.sin}
                  onChange={handleChange}
                  name="sin"
                  fullWidth
                  size="small"
                  placeholder="e.g., 123-456-789"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="GST Number"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  name="gstNumber"
                  fullWidth
                  size="small"
                />
              </Grid>

              {/* Row 9: Deposit Amount */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Deposit Amount"
                  value={formData.depositAmount}
                  onChange={handleChange}
                  name="depositAmount"
                  type="number"
                  fullWidth
                  size="small"
                  inputProps={{ step: "0.01", min: "0" }}
                />
              </Grid>

              {/* Divider for Emergency Contact */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: "bold", color: "#1976d2" }}>
                  Emergency Contact Information
                </Typography>
              </Grid>

              {/* Row 10: Emergency Contact Name, Phone, Relationship */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Emergency Contact Name"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  name="emergencyContactName"
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Emergency Contact Phone"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  name="emergencyContactPhone"
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Relationship"
                  value={formData.emergencyContactRelationship}
                  onChange={handleChange}
                  name="emergencyContactRelationship"
                  fullWidth
                  size="small"
                  placeholder="e.g., Spouse, Parent, Friend"
                />
              </Grid>

              {/* Divider for Document Dates */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: "bold", color: "#1976d2" }}>
                  Document & Record Dates
                </Typography>
              </Grid>

              {/* Row 10: Security Deposit Date & Refund Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Security Deposit Date"
                  value={formData.securityDepositDate}
                  onChange={handleChange}
                  name="securityDepositDate"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Refund Date"
                  value={formData.refundDate}
                  onChange={handleChange}
                  name="refundDate"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Row 11: PIC Date & ICBC Records Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="PIC Date"
                  value={formData.picDate}
                  onChange={handleChange}
                  name="picDate"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="ICBC Records Date"
                  value={formData.ibcRecordsDate}
                  onChange={handleChange}
                  name="ibcRecordsDate"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={formLoading}
          >
            {dialogMode === "create" ? "Add Driver" : "Update Driver"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
