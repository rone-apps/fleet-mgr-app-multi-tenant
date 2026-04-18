"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Button, Card, CardContent, CircularProgress, Container, Dialog,
  DialogActions, DialogContent, DialogTitle, Grid, Paper, Step, StepLabel,
  Stepper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography, Alert, Select, MenuItem, FormControl, InputLabel,
  Snackbar, Alert as SnackAlert, AppBar, Toolbar, IconButton, Chip,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon, PhotoCamera as PhotoCameraIcon,
  Check as CheckIcon, Edit as EditIcon, Replay as ReplayIcon,
  ArrowBack as ArrowBackIcon, Logout as LogoutIcon, Person as PersonIcon,
  CommuteOutlined, AutoAwesome, Business,
} from "@mui/icons-material";
import GlobalNav from "../components/GlobalNav";
import { tenantFetch, getCurrentUser, getTenantName, logout, isAuthenticated } from "../lib/api";

export default function ReceiptScanPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tenantName, setTenantName] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      if (!isAuthenticated()) {
        router.push("/");
        return;
      }
      setUser(getCurrentUser());
      setTenantName(getTenantName());
    };
    checkAuth();
  }, [router]);

  const handleLogout = () => {
    setLogoutDialogOpen(true);
  };

  const handleConfirmLogout = () => {
    setLogoutDialogOpen(false);
    logout();
  };

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  // Step 1 - Capture
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Step 2 - AI Processing
  const [receiptData, setReceiptData] = useState(null);

  // Step 3 - Review & Confirm
  const [formData, setFormData] = useState({
    receiptId: null,
    documentType: "OTHER",
    vendorName: "",
    receiptDate: "",
    taxAmount: 0,
    totalAmount: 0,
    lineItems: [],
    notes: "",
  });

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  // Receipt History & Filters
  const [receipts, setReceipts] = useState([]);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    cabId: "",
    shiftId: "",
    ownerId: "",
    vendorName: "",
  });
  const [showHistory, setShowHistory] = useState(false);

  // Fetch receipts on component mount and when filters change
  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    console.log("🔍 Fetching receipts with filters:", filters);
    setReceiptsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.cabId) params.append("cabId", filters.cabId);
      if (filters.shiftId) params.append("shiftId", filters.shiftId);
      if (filters.ownerId) params.append("ownerId", filters.ownerId);
      if (filters.vendorName) params.append("vendorName", filters.vendorName);

      const url = `/api/receipts?${params.toString()}`;
      console.log("🌐 Request URL:", url);
      const response = await tenantFetch(url);

      console.log("📨 Receipts response:", { status: response.status });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Receipts fetched:", {
          count: data.content?.length || 0,
          totalElements: data.totalElements,
          totalPages: data.totalPages,
        });
        setReceipts(data.content || []);
      } else {
        console.error("❌ Failed to fetch receipts:", response.status);
      }
    } catch (err) {
      console.error("❌ Error fetching receipts:", err);
    } finally {
      setReceiptsLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    fetchReceipts();
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      cabId: "",
      shiftId: "",
      ownerId: "",
      vendorName: "",
    });
    setReceipts([]);
  };

  // Handle file selection
  const handleFileSelect = (file) => {
    if (!file) {
      console.log("❌ No file provided");
      return;
    }

    console.log("📁 File selected:", {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeInMB: (file.size / 1024 / 1024).toFixed(2),
      lastModified: new Date(file.lastModified).toISOString(),
    });

    const fileName = file.name.toLowerCase();
    const mimeType = file.type.toLowerCase();

    // Check for HEIC format
    if (fileName.endsWith(".heic") || fileName.endsWith(".heif") || mimeType.includes("heic")) {
      console.warn("⚠️ HEIC format detected - not supported");
      setError("HEIC format is not supported. Please convert your image to JPEG, PNG, GIF, or WebP. On iPhone: Use Settings > Camera > Formats > Most Compatible or export as JPEG from Photos.");
      return;
    }

    // More lenient validation - just check file size
    // Backend will validate the actual format
    if (file.size > 10 * 1024 * 1024) {
      console.warn("⚠️ File too large:", file.size);
      setError("Image file must be smaller than 10MB");
      return;
    }

    if (file.size === 0) {
      console.warn("⚠️ File is empty");
      setError("File is empty. Please select a valid image.");
      return;
    }

    console.log("✅ File validation passed");
    setSelectedImage(file);
    setError("");

    // Create preview
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log("📸 Preview generated");
        setImagePreview(reader.result);
      };
      reader.onerror = () => {
        console.error("❌ FileReader error:", reader.error);
        setError("Failed to read file. Please try again.");
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("❌ Error reading file:", err);
      setError("Error reading file: " + err.message);
    }
  };

  // Handle camera/file input change
  const handleInputChange = (e) => {
    console.log("📂 Input change event triggered");
    try {
      const file = e.target.files?.[0];
      console.log("📂 Files array:", {
        length: e.target.files?.length || 0,
        file: file ? { name: file.name, type: file.type, size: file.size } : null,
      });

      if (file) {
        handleFileSelect(file);
      } else {
        console.warn("⚠️ No file selected");
        setError("No file selected. Please try again.");
      }
      // Reset input so user can select the same file again
      e.target.value = "";
    } catch (err) {
      console.error("❌ File selection error:", err);
      setError("Error selecting file: " + err.message);
    }
  };

  // Analyze receipt with Claude
  const handleAnalyzeReceipt = async () => {
    if (!selectedImage) {
      console.warn("⚠️ No image selected");
      setError("Please select an image first");
      return;
    }

    console.log("🚀 Starting receipt analysis for:", selectedImage.name);
    setLoading(true);
    setError("");

    try {
      const formDataObj = new FormData();
      formDataObj.append("image", selectedImage);
      console.log("📦 FormData prepared with image");

      console.log("🌐 Sending to backend: POST /api/receipts/analyze");
      const response = await tenantFetch("/api/receipts/analyze", {
        method: "POST",
        body: formDataObj,
      });

      console.log("📨 Response received:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers),
      });

      if (!response.ok) {
        console.error("❌ API error:", response.status);
        const errorData = await response.json();
        console.error("Error details:", errorData);
        throw new Error(errorData.error || "Failed to analyze receipt");
      }

      const data = await response.json();
      console.log("✅ Analysis successful:", {
        receiptId: data.receiptId,
        documentType: data.documentType,
        vendorName: data.vendorName,
        totalAmount: data.totalAmount,
        lineItemsCount: data.lineItems?.length || 0,
      });

      setReceiptData(data);
      setFormData({
        receiptId: data.receiptId,
        documentType: data.documentType || "OTHER",
        vendorName: data.vendorName || "",
        receiptDate: data.receiptDate || "",
        taxAmount: data.taxAmount || 0,
        totalAmount: data.totalAmount || 0,
        lineItems: data.lineItems || [],
        notes: "",
      });

      setStep(2); // Move to review step
    } catch (err) {
      console.error("❌ Analysis failed:", {
        message: err.message,
        stack: err.stack,
      });
      setError(err.message || "Failed to analyze receipt. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle form field changes
  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle line item change
  const handleLineItemChange = (index, field, value) => {
    const updatedItems = [...formData.lineItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
    handleFormChange("lineItems", updatedItems);
  };

  // Confirm and save receipt
  const handleConfirmReceipt = async () => {
    console.log("💾 Starting receipt confirmation");
    console.log("📋 Form data:", {
      receiptId: formData.receiptId,
      documentType: formData.documentType,
      vendorName: formData.vendorName,
      receiptDate: formData.receiptDate,
      totalAmount: formData.totalAmount,
      taxAmount: formData.taxAmount,
      lineItemsCount: formData.lineItems?.length || 0,
    });

    setLoading(true);
    setError("");

    try {
      console.log("🌐 Sending to backend: POST /api/receipts/confirm");
      const response = await tenantFetch("/api/receipts/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      console.log("📨 Confirm response received:", {
        status: response.status,
        statusText: response.statusText,
      });

      if (!response.ok) {
        console.error("❌ Confirm failed with status:", response.status);
        const errorData = await response.json();
        console.error("Error details:", errorData);
        throw new Error(errorData.error || "Failed to save receipt");
      }

      const responseData = await response.json();
      console.log("✅ Receipt confirmed successfully:", responseData);

      setSnackbar({
        open: true,
        message: "Receipt saved successfully!",
        severity: "success",
      });

      // Reset form
      setTimeout(() => {
        setStep(0);
        setSelectedImage(null);
        setImagePreview(null);
        setReceiptData(null);
        setFormData({
          receiptId: null,
          documentType: "OTHER",
          vendorName: "",
          receiptDate: "",
          taxAmount: 0,
          totalAmount: 0,
          lineItems: [],
          notes: "",
        });
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to save receipt. Please try again.");
      console.error("Confirm error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRescan = () => {
    setStep(0);
    setSelectedImage(null);
    setImagePreview(null);
    setReceiptData(null);
  };

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f6f9fc' }}>
      {/* Header AppBar */}
      <AppBar position="static" elevation={0} sx={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #635bff 0%, #7c6cff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CommuteOutlined sx={{ fontSize: 22, color: '#fff' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, color: '#1a1a2e', fontSize: '1rem' }}>
                Smart Fleets
              </Typography>
              {tenantName && (
                <Typography variant="caption" sx={{ color: '#8792a2', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem' }}>
                  <Business sx={{ fontSize: 13 }} />
                  {tenantName}
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon sx={{ color: '#697386', fontSize: 20 }} />
              <Box>
                <Typography variant="body2" sx={{ color: '#1a1a2e', fontWeight: 600, fontSize: '0.85rem' }}>
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography variant="caption" sx={{ color: '#8792a2' }}>
                  {user.role}
                </Typography>
              </Box>
            </Box>

            <IconButton
              onClick={handleLogout}
              title="Logout"
              sx={{
                color: '#697386',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                '&:hover': { color: '#e74c3c', backgroundColor: 'rgba(231,76,60,0.04)' }
              }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Breadcrumb Navigation */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            onClick={() => router.push("/")}
            sx={{
              color: '#667eea',
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.95rem',
              p: 0,
              minWidth: 'auto',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            Dashboard
          </Button>
          <Typography sx={{ color: '#999' }}>/</Typography>
          <Typography sx={{ fontWeight: 600, color: '#3e5244', fontSize: '0.95rem' }}>
            Scan Receipts
          </Typography>
        </Box>

        {/* Title & History Toggle */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#3e5244' }}>
            {showHistory ? "Receipt History" : "Receipt Scanner - AI-Powered Analysis"}
          </Typography>
          <Button
            variant={showHistory ? "contained" : "outlined"}
            onClick={() => setShowHistory(!showHistory)}
            sx={{
              backgroundColor: showHistory ? '#667eea' : 'transparent',
              color: showHistory ? '#fff' : '#667eea',
              borderColor: '#667eea',
              '&:hover': {
                backgroundColor: showHistory ? '#5568d3' : 'rgba(102, 126, 234, 0.04)'
              }
            }}
          >
            {showHistory ? "Back to Scanner" : "View History"}
          </Button>
        </Box>

        {/* Receipt History Section */}
        {showHistory ? (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#193366' }}>
                Filter Receipts
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Start Date"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange("startDate", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="End Date"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange("endDate", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Vendor Name"
                    value={filters.vendorName}
                    onChange={(e) => handleFilterChange("vendorName", e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Cab ID"
                    type="number"
                    value={filters.cabId}
                    onChange={(e) => handleFilterChange("cabId", e.target.value)}
                    fullWidth
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleApplyFilters}
                  sx={{
                    backgroundColor: '#4caf50',
                    '&:hover': { backgroundColor: '#388e3c' }
                  }}
                >
                  Apply Filters
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  sx={{ color: '#667eea', borderColor: '#667eea' }}
                >
                  Clear All
                </Button>
              </Box>

              {/* Receipts Table */}
              {receiptsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : receipts.length > 0 ? (
                <TableContainer component={Paper} sx={{ mt: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell><strong>ID</strong></TableCell>
                        <TableCell><strong>Vendor</strong></TableCell>
                        <TableCell><strong>Date</strong></TableCell>
                        <TableCell align="right"><strong>Amount</strong></TableCell>
                        <TableCell><strong>Cab</strong></TableCell>
                        <TableCell><strong>Driver</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {receipts.map((receipt) => (
                        <TableRow key={receipt.id}>
                          <TableCell>#{receipt.id}</TableCell>
                          <TableCell>{receipt.vendorName || "-"}</TableCell>
                          <TableCell>{receipt.receiptDate || "-"}</TableCell>
                          <TableCell align="right">${receipt.totalAmount || "0.00"}</TableCell>
                          <TableCell>{receipt.cabNumber || "-"}</TableCell>
                          <TableCell>{receipt.ownerName || "-"}</TableCell>
                          <TableCell>
                            <Chip
                              label={receipt.status}
                              size="small"
                              color={receipt.status === "CONFIRMED" ? "success" : "default"}
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography sx={{ mt: 3, color: '#999', textAlign: 'center' }}>
                  No receipts found. Try adjusting your filters.
                </Typography>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stepper */}
        <Stepper activeStep={step} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>Capture Receipt</StepLabel>
          </Step>
          <Step>
            <StepLabel>AI Analysis</StepLabel>
          </Step>
          <Step>
            <StepLabel>Review & Confirm</StepLabel>
          </Step>
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* STEP 1: Capture */}
        {step === 0 && (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 6 }}>
              <PhotoCameraIcon sx={{ fontSize: 64, color: "#6699cc", mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 3, color: "#193366" }}>
                Take or Upload a Receipt Photo
              </Typography>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                style={{ display: "none" }}
              />

              <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mb: 4 }}>
                <Button
                  variant="contained"
                  startIcon={<PhotoCameraIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    backgroundColor: "#6699cc",
                    "&:hover": { backgroundColor: "#5588bb" },
                  }}
                >
                  Take Photo / Choose File
                </Button>
              </Box>

              {imagePreview && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, color: "#555" }}>
                    Selected Image:
                  </Typography>
                  <Box
                    component="img"
                    src={imagePreview}
                    sx={{
                      maxWidth: "100%",
                      maxHeight: 400,
                      borderRadius: 1,
                      mb: 3,
                      border: "1px solid #ddd",
                    }}
                  />

                  <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                    <Button
                      variant="outlined"
                      onClick={handleRescan}
                      startIcon={<ReplayIcon />}
                    >
                      Choose Different Image
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleAnalyzeReceipt}
                      disabled={loading}
                      sx={{
                        backgroundColor: "#4caf50",
                        "&:hover": { backgroundColor: "#388e3c" },
                      }}
                      endIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
                    >
                      {loading ? "Analyzing..." : "Analyze Receipt"}
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 2: AI Processing */}
        {step === 1 && (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 8 }}>
              <CircularProgress size={80} sx={{ color: "#6699cc", mb: 3 }} />
              <Typography variant="h6" sx={{ mb: 2, color: "#193366" }}>
                🤖 Analyzing with AI...
              </Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                Reading document type, amounts, and line items. This may take a few seconds.
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Review & Confirm */}
        {step === 2 && receiptData && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, color: "#193366", display: "flex", alignItems: "center", gap: 1 }}>
                <CheckIcon sx={{ color: "#4caf50" }} />
                Receipt Detected
              </Typography>

              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Document Type</InputLabel>
                    <Select
                      value={formData.documentType}
                      onChange={(e) => handleFormChange("documentType", e.target.value)}
                      label="Document Type"
                    >
                      <MenuItem value="GAS_RECEIPT">Gas Receipt</MenuItem>
                      <MenuItem value="PARKING">Parking</MenuItem>
                      <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                      <MenuItem value="BILL">Bill</MenuItem>
                      <MenuItem value="ACCOUNT_CHARGE">Account Charge</MenuItem>
                      <MenuItem value="AIRPORT_FEE">Airport Fee</MenuItem>
                      <MenuItem value="MEAL">Meal</MenuItem>
                      <MenuItem value="OTHER">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Vendor Name"
                    value={formData.vendorName}
                    onChange={(e) => handleFormChange("vendorName", e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Receipt Date"
                    type="date"
                    value={formData.receiptDate}
                    onChange={(e) => handleFormChange("receiptDate", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Total Amount"
                    type="number"
                    value={formData.totalAmount}
                    onChange={(e) => handleFormChange("totalAmount", parseFloat(e.target.value) || 0)}
                    inputProps={{ step: "0.01" }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tax Amount"
                    type="number"
                    value={formData.taxAmount}
                    onChange={(e) => handleFormChange("taxAmount", parseFloat(e.target.value) || 0)}
                    inputProps={{ step: "0.01" }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Notes"
                    value={formData.notes}
                    onChange={(e) => handleFormChange("notes", e.target.value)}
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>

              {/* Line Items Table */}
              {formData.lineItems && formData.lineItems.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold", color: "#193366" }}>
                    Line Items
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                          <TableCell>Description</TableCell>
                          <TableCell align="right">Qty</TableCell>
                          <TableCell align="right">Unit Price</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {formData.lineItems.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <TextField
                                size="small"
                                value={item.description || ""}
                                onChange={(e) => handleLineItemChange(idx, "description", e.target.value)}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                size="small"
                                type="number"
                                value={item.quantity || 0}
                                onChange={(e) => handleLineItemChange(idx, "quantity", parseFloat(e.target.value) || 0)}
                                inputProps={{ step: "0.01" }}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                size="small"
                                type="number"
                                value={item.unitPrice || 0}
                                onChange={(e) => handleLineItemChange(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                                inputProps={{ step: "0.01" }}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                size="small"
                                type="number"
                                value={item.total || 0}
                                onChange={(e) => handleLineItemChange(idx, "total", parseFloat(e.target.value) || 0)}
                                inputProps={{ step: "0.01" }}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Action Buttons */}
              <Box sx={{ display: "flex", gap: 2, justifyContent: "space-between" }}>
                <Button
                  variant="outlined"
                  onClick={handleRescan}
                  startIcon={<ReplayIcon />}
                >
                  Rescan Receipt
                </Button>
                <Button
                  variant="contained"
                  onClick={handleConfirmReceipt}
                  disabled={loading}
                  sx={{
                    backgroundColor: "#4caf50",
                    "&:hover": { backgroundColor: "#388e3c" },
                  }}
                  endIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
                >
                  {loading ? "Saving..." : "Save Receipt"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
          </>
        )}

        {/* Success Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <SnackAlert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
          >
            {snackbar.message}
          </SnackAlert>
        </Snackbar>
      </Container>

      {/* Logout Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff', fontWeight: 700, fontSize: '1.3rem', pb: 1 }}>
          🚪 Confirm Logout
        </DialogTitle>
        <DialogContent sx={{ color: '#fff' }}>
          <Typography>Are you sure you want to logout?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setLogoutDialogOpen(false)}
            sx={{ color: '#fff', borderColor: '#fff' }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmLogout}
            variant="contained"
            sx={{
              backgroundColor: '#ff6b6b',
              '&:hover': { backgroundColor: '#ff5252' }
            }}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
