"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Backdrop,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  TablePagination,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  SwapHoriz as MapIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowIcon,
  Refresh as RefreshIcon,
  TableChart as TableIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { API_BASE_URL, getAuthHeaders } from "../../lib/api";

const steps = [
  "Upload File",
  "Map Columns",
  "Preview Data",
  "Import Results",
];

export default function DataMapperSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  // Step 1 result
  const [analysisResult, setAnalysisResult] = useState(null);

  // Step 2 state
  const [columnMappings, setColumnMappings] = useState({});

  // Step 3 state
  const [previewData, setPreviewData] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [previewPage, setPreviewPage] = useState(0);
  const [previewRowsPerPage, setPreviewRowsPerPage] = useState(25);

  // Step 4 state
  const [importResults, setImportResults] = useState(null);

  // --- Step 1: File Upload & Analysis ---
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError("");
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setLoadingMessage("Analyzing file headers...");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${API_BASE_URL}/uploads/data-mapper/analyze`, {
        method: "POST",
        headers: getAuthHeaders(null), // no Content-Type for FormData
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setAnalysisResult(data);
      setColumnMappings(data.suggestedMappings || {});
      setActiveStep(1);
      setSuccess(`File analyzed: ${data.sourceHeaders?.length || 0} columns detected`);
    } catch (err) {
      setError("Failed to analyze file: " + err.message);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  // --- Step 2: Column Mapping ---
  const handleMappingChange = (sourceHeader, targetField) => {
    setColumnMappings((prev) => ({
      ...prev,
      [sourceHeader]: targetField,
    }));
  };

  const getMappedCount = () => {
    return Object.values(columnMappings).filter((v) => v && v !== "unmapped").length;
  };

  const getRequiredFieldsMapped = () => {
    const required = ["authorizationCode", "transactionDate", "transactionTime", "amount"];
    const mappedTargets = new Set(Object.values(columnMappings));
    return required.filter((f) => mappedTargets.has(f));
  };

  const handlePreview = async () => {
    setLoading(true);
    setLoadingMessage("Parsing and validating data with your mappings...");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("mappings", JSON.stringify(columnMappings));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);

      const response = await fetch(`${API_BASE_URL}/uploads/data-mapper/preview`, {
        method: "POST",
        headers: getAuthHeaders(null),
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setPreviewData(data);
      setSessionId(data.sessionId);
      setActiveStep(2);
      setSuccess(`Data parsed: ${data.totalRows} rows found`);
    } catch (err) {
      setError("Failed to preview data: " + err.message);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  // --- Step 3: Import ---
  const handleImport = async () => {
    if (!sessionId) {
      setError("Session expired. Please go back and re-preview.");
      return;
    }

    setLoading(true);
    setLoadingMessage(`Importing ${previewData?.totalRows || 0} transactions...`);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/uploads/data-mapper/import?sessionId=${sessionId}&filename=${encodeURIComponent(selectedFile.name)}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to import");
      }

      const result = await response.json();
      setImportResults(result);
      setActiveStep(3);

      if (result.errorCount === 0) {
        setSuccess(`Successfully imported ${result.successCount} transactions!`);
      } else {
        setError(`Import completed with ${result.errorCount} errors.`);
      }
    } catch (err) {
      setError("Import failed: " + err.message);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  // --- Navigation ---
  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError("");
    setSuccess("");
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedFile(null);
    setAnalysisResult(null);
    setColumnMappings({});
    setPreviewData(null);
    setSessionId(null);
    setImportResults(null);
    setError("");
    setSuccess("");
  };

  // --- Preview columns to display ---
  const previewColumns = [
    { key: "transactionDate", label: "Date" },
    { key: "transactionTime", label: "Time" },
    { key: "merchantId", label: "Merchant" },
    { key: "terminalId", label: "Terminal" },
    { key: "authorizationCode", label: "Auth Code" },
    { key: "amount", label: "Amount" },
    { key: "cardType", label: "Card Type" },
    { key: "cabNumber", label: "Cab" },
    { key: "driverNumber", label: "Driver" },
    { key: "driverName", label: "Driver Name" },
  ];

  return (
    <Box>
      {/* Loading Backdrop */}
      <Backdrop
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: "column",
          gap: 2,
        }}
        open={loading}
      >
        <CircularProgress color="inherit" size={60} />
        <Typography variant="h6">{loadingMessage || "Processing..."}</Typography>
        <Typography variant="body2">Please do not close this page</Typography>
      </Backdrop>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step 1: File Upload */}
      {activeStep === 0 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Upload a CSV or Excel File
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Upload a file from any credit card processor. The system will analyze the columns
            and suggest mappings to the FareFlow credit card transaction format.
          </Typography>

          <Box
            sx={{
              border: "2px dashed #ccc",
              borderRadius: 2,
              p: 4,
              textAlign: "center",
              backgroundColor: selectedFile ? "#f0f7ff" : "#fafafa",
              transition: "all 0.2s",
              "&:hover": { borderColor: "#1976d2", backgroundColor: "#f0f7ff" },
            }}
          >
            <UploadIcon sx={{ fontSize: 48, color: selectedFile ? "#1976d2" : "#ccc", mb: 2 }} />
            <Typography variant="body1" gutterBottom>
              {selectedFile ? selectedFile.name : "Drag and drop or click to select"}
            </Typography>
            {selectedFile && (
              <Typography variant="body2" color="text.secondary">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </Typography>
            )}
            <Button variant="outlined" component="label" sx={{ mt: 2 }}>
              {selectedFile ? "Change File" : "Select File"}
              <input
                type="file"
                hidden
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
              />
            </Button>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
            <Button
              variant="contained"
              onClick={handleAnalyze}
              disabled={!selectedFile || loading}
              startIcon={<MapIcon />}
            >
              Analyze & Map Columns
            </Button>
          </Box>
        </Paper>
      )}

      {/* Step 2: Column Mapping */}
      {activeStep === 1 && analysisResult && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box>
              <Typography variant="h6">Column Mapping</Typography>
              <Typography variant="body2" color="text.secondary">
                Map your file columns to FareFlow credit card transaction fields.
                The system has auto-detected {getMappedCount()} mappings.
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Chip
                label={`${getMappedCount()} / ${analysisResult.sourceHeaders?.length || 0} mapped`}
                color={getMappedCount() > 0 ? "primary" : "default"}
                variant="outlined"
              />
              <Chip
                label={`${getRequiredFieldsMapped().length} / 4 required`}
                color={getRequiredFieldsMapped().length === 4 ? "success" : "warning"}
                variant="outlined"
              />
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Sample data preview */}
          {analysisResult.sampleData && analysisResult.sampleData.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom color="text.secondary">
                Sample Data (first {analysisResult.sampleData.length} rows)
              </Typography>
              <TableContainer sx={{ maxHeight: 200, border: "1px solid #e0e0e0", borderRadius: 1 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {analysisResult.sourceHeaders.map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 600, fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analysisResult.sampleData.map((row, idx) => (
                      <TableRow key={idx}>
                        {analysisResult.sourceHeaders.map((h) => (
                          <TableCell key={h} sx={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                            {row[h] || ""}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Mapping Table */}
          <TableContainer sx={{ border: "1px solid #e0e0e0", borderRadius: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: 600, width: "35%" }}>Source Column (Your File)</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: "10%", textAlign: "center" }}></TableCell>
                  <TableCell sx={{ fontWeight: 600, width: "45%" }}>Target Field (FareFlow)</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: "10%", textAlign: "center" }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analysisResult.sourceHeaders.map((header) => {
                  const currentMapping = columnMappings[header] || "unmapped";
                  const isMapped = currentMapping !== "unmapped";
                  const isRequired = ["authorizationCode", "transactionDate", "transactionTime", "amount"].includes(currentMapping);

                  return (
                    <TableRow key={header} sx={{ "&:hover": { backgroundColor: "#fafafa" } }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {header}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <ArrowIcon color={isMapped ? "primary" : "disabled"} />
                      </TableCell>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select
                            value={currentMapping}
                            onChange={(e) => handleMappingChange(header, e.target.value)}
                            sx={{
                              backgroundColor: isMapped ? "#f0f7ff" : "transparent",
                              "& .MuiSelect-select": { py: 1 },
                            }}
                          >
                            <MenuItem value="unmapped">
                              <em>-- Skip / Not Mapped --</em>
                            </MenuItem>
                            {Object.entries(analysisResult.targetFields || {}).map(([key, label]) => (
                              <MenuItem key={key} value={key}>
                                {label} ({key})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell align="center">
                        {isMapped ? (
                          <Tooltip title={isRequired ? "Required field - mapped" : "Mapped"}>
                            <CheckIcon color={isRequired ? "success" : "primary"} fontSize="small" />
                          </Tooltip>
                        ) : (
                          <Tooltip title="Not mapped - will be skipped">
                            <WarningIcon color="disabled" fontSize="small" />
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
            <Button onClick={handleBack}>Back</Button>
            <Button
              variant="contained"
              onClick={handlePreview}
              disabled={loading || getRequiredFieldsMapped().length < 3}
              startIcon={<TableIcon />}
            >
              Preview Mapped Data
            </Button>
          </Box>
        </Paper>
      )}

      {/* Step 3: Data Preview */}
      {activeStep === 2 && previewData && (
        <Box>
          {/* Statistics Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TableIcon color="primary" />
                    <Box>
                      <Typography color="textSecondary" variant="body2">Total Rows</Typography>
                      <Typography variant="h5">{previewData.totalRows}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckIcon color="success" />
                    <Box>
                      <Typography color="textSecondary" variant="body2">Valid Rows</Typography>
                      <Typography variant="h5">{previewData.statistics?.validRows || 0}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckIcon color="info" />
                    <Box>
                      <Typography color="textSecondary" variant="body2">Cab Matches</Typography>
                      <Typography variant="h5">{previewData.statistics?.cabMatches || 0}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckIcon color="secondary" />
                    <Box>
                      <Typography color="textSecondary" variant="body2">Driver Matches</Typography>
                      <Typography variant="h5">{previewData.statistics?.driverMatches || 0}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Data Table */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Mapped Data Preview
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Showing first {Math.min(previewData.previewData?.length || 0, 100)} of {previewData.totalRows} rows.
              Review the data below before importing.
            </Typography>

            <TableContainer sx={{ maxHeight: 500 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>#</TableCell>
                    {previewColumns.map((col) => (
                      <TableCell key={col.key} sx={{ fontWeight: 600, fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                        {col.label}
                      </TableCell>
                    ))}
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(previewData.previewData || [])
                    .slice(previewPage * previewRowsPerPage, previewPage * previewRowsPerPage + previewRowsPerPage)
                    .map((row, idx) => (
                    <TableRow
                      key={idx}
                      sx={{
                        backgroundColor: !row.valid ? "#fff3f3" : row.cabLookupSuccess ? "#f0fff0" : "inherit",
                      }}
                    >
                      <TableCell sx={{ fontSize: "0.75rem" }}>{previewPage * previewRowsPerPage + idx + 1}</TableCell>
                      {previewColumns.map((col) => (
                        <TableCell key={col.key} sx={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                          {col.key === "amount"
                            ? row[col.key] != null
                              ? `$${parseFloat(row[col.key]).toFixed(2)}`
                              : ""
                            : row[col.key] || ""}
                        </TableCell>
                      ))}
                      <TableCell>
                        {!row.valid ? (
                          <Tooltip title={row.validationMessage || "Invalid"}>
                            <Chip label="Invalid" color="error" size="small" variant="outlined" />
                          </Tooltip>
                        ) : !row.cabLookupSuccess ? (
                          <Chip label="No Cab" color="warning" size="small" variant="outlined" />
                        ) : (
                          <Chip label="Ready" color="success" size="small" variant="outlined" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={previewData.previewData?.length || 0}
              rowsPerPage={previewRowsPerPage}
              page={previewPage}
              onPageChange={(e, p) => setPreviewPage(p)}
              onRowsPerPageChange={(e) => {
                setPreviewRowsPerPage(parseInt(e.target.value, 10));
                setPreviewPage(0);
              }}
            />

            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
              <Button onClick={handleBack}>Back to Mapping</Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleImport}
                disabled={loading || (previewData.statistics?.validRows || 0) === 0}
                startIcon={<UploadIcon />}
              >
                Import {previewData.totalRows} Transactions
              </Button>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Step 4: Import Results */}
      {activeStep === 3 && importResults && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Import Complete
          </Typography>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ backgroundColor: "#e8f5e9" }}>
                <CardContent>
                  <Typography color="text.secondary" variant="body2">Successfully Imported</Typography>
                  <Typography variant="h4" sx={{ color: "#2e7d32", fontWeight: 700 }}>
                    {importResults.successCount || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ backgroundColor: "#fff3e0" }}>
                <CardContent>
                  <Typography color="text.secondary" variant="body2">Duplicates Skipped</Typography>
                  <Typography variant="h4" sx={{ color: "#e65100", fontWeight: 700 }}>
                    {importResults.skipCount || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ backgroundColor: importResults.errorCount > 0 ? "#ffebee" : "#f5f5f5" }}>
                <CardContent>
                  <Typography color="text.secondary" variant="body2">Errors</Typography>
                  <Typography
                    variant="h4"
                    sx={{ color: importResults.errorCount > 0 ? "#c62828" : "#757575", fontWeight: 700 }}
                  >
                    {importResults.errorCount || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {importResults.errors && importResults.errors.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Error Details (showing up to 50):
              </Typography>
              <Paper
                variant="outlined"
                sx={{ maxHeight: 200, overflow: "auto", p: 2, backgroundColor: "#fff8f8" }}
              >
                {importResults.errors.map((err, idx) => (
                  <Typography key={idx} variant="body2" sx={{ fontSize: "0.8rem", mb: 0.5 }}>
                    {err}
                  </Typography>
                ))}
              </Paper>
            </Box>
          )}

          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Button variant="contained" onClick={handleReset} startIcon={<RefreshIcon />}>
              Start New Import
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
