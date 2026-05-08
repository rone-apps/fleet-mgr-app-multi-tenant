"use client";

import { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Grid,
  CircularProgress,
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
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  LinearProgress,
} from "@mui/material";
import {
  FileDownload as ExportIcon,
  TableChart as TableIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Link as ConnectIcon,
  ArrowForward as ArrowIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
import { API_BASE_URL, getAuthHeaders } from "../../lib/api";

const steps = [
  "Connect to External DB",
  "Select Tables",
  "Map Columns",
  "Filter Data",
  "Preview & Export",
];

export default function DbExportSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Connection state
  const [connection, setConnection] = useState({
    host: "",
    port: 3306,
    username: "",
    password: "",
  });
  const [connected, setConnected] = useState(false);
  const [externalDatabases, setExternalDatabases] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState("");

  // Tables state
  const [localTables, setLocalTables] = useState([]);
  const [externalTables, setExternalTables] = useState([]);
  const [selectedSourceTable, setSelectedSourceTable] = useState("");
  const [selectedDestTable, setSelectedDestTable] = useState("");
  const [sourceTableSearch, setSourceTableSearch] = useState("");
  const [destTableSearch, setDestTableSearch] = useState("");

  // Columns state
  const [sourceColumns, setSourceColumns] = useState([]);
  const [destColumns, setDestColumns] = useState([]);
  const [columnMappings, setColumnMappings] = useState([]); // Array to support one-to-many mappings

  // Filter state
  const [filters, setFilters] = useState([]);

  // Preview and export data
  const [previewData, setPreviewData] = useState([]);
  const [recordCount, setRecordCount] = useState(null);
  const [countQuery, setCountQuery] = useState(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportResult, setExportResult] = useState(null);

  // ========== Step 1: Connection ==========
  const handleConnect = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/db-migration/connect`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(connection),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Connection failed");
      }

      const data = await response.json();
      setExternalDatabases(data.databases || []);
      setConnected(true);
      setSuccess("✅ Connected to external database successfully!");

      // Fetch local FareFlow tables
      await fetchLocalTables();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocalTables = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/db-migration/local-tables`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setLocalTables(data.tables || []);
      }
    } catch (err) {
      console.error("Error fetching local tables:", err);
    }
  };

  const handleDisconnect = () => {
    setConnected(false);
    setExternalDatabases([]);
    setSelectedDatabase("");
    setExternalTables([]);
    setLocalTables([]);
    setSelectedSourceTable("");
    setSelectedDestTable("");
    setActiveStep(0);
  };

  // ========== Step 2: Select Database & Tables ==========
  const handleSelectDatabase = async (dbName) => {
    setSelectedDatabase(dbName);
    setLoading(true);
    setError("");

    try {
      // Use POST endpoint with connection details to fetch tables
      const response = await fetch(`${API_BASE_URL}/db-migration/tables/external`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          host: connection.host,
          port: connection.port,
          username: connection.username,
          password: connection.password,
          database: dbName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch external tables");
      }

      const data = await response.json();
      setExternalTables(data.tables || []);
      console.log("✅ Fetched external tables:", data.tables?.length || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSourceTable = async (table) => {
    setSelectedSourceTable(table);
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/db-migration/local-columns?table=${table}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch source columns");
      }

      const data = await response.json();
      setSourceColumns(data.columns || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDestTable = async (table) => {
    setSelectedDestTable(table);
    setLoading(true);
    setError("");

    try {
      // Use POST endpoint with connection details to fetch columns
      const response = await fetch(`${API_BASE_URL}/db-migration/columns/external`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          host: connection.host,
          port: connection.port,
          username: connection.username,
          password: connection.password,
          database: selectedDatabase,
          table: table,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch destination columns");
      }

      const data = await response.json();
      setDestColumns(data.columns || []);
      console.log("✅ Fetched destination columns:", data.columns?.length || 0);

      // Auto-map matching column names (array-based for one-to-many support)
      const autoMappings = [];
      sourceColumns.forEach((srcCol) => {
        const match = data.columns.find((destCol) => destCol.name.toLowerCase() === srcCol.name.toLowerCase());
        if (match) {
          autoMappings.push({ source: srcCol.name, dest: match.name });
        }
      });
      setColumnMappings(autoMappings);
      console.log("🔗 Auto-mapped columns:", autoMappings.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== Step 3: Column Mapping ==========
  const handleAddColumnMapping = () => {
    setColumnMappings([...columnMappings, { source: "", dest: "" }]);
  };

  const handleRemoveColumnMapping = (index) => {
    setColumnMappings(columnMappings.filter((_, i) => i !== index));
  };

  const handleColumnMappingChange = (index, field, value) => {
    const newMappings = [...columnMappings];
    newMappings[index][field] = value;
    setColumnMappings(newMappings);
  };

  // ========== Step 4: Filter Management ==========
  const handleAddFilter = () => {
    setFilters([...filters, { column: "", operator: "=", value: "" }]);
  };

  const handleRemoveFilter = (index) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const handleFilterChange = (index, field, value) => {
    const newFilters = [...filters];
    newFilters[index][field] = value;
    setFilters(newFilters);
  };

  // ========== Step 5: Preview & Export ==========
  const handlePreviewData = async () => {
    setLoading(true);
    setError("");
    setRecordCount(null);
    setExportResult(null);

    try {
      // Filter out empty/invalid mappings
      const validMappings = columnMappings.filter(
        (mapping) => mapping.source && mapping.source.trim() && mapping.dest && mapping.dest.trim()
      );

      if (validMappings.length === 0) {
        throw new Error("No valid column mappings found. Please map at least one column.");
      }

      const validFilters = filters.filter(f => f.column && f.value);

      // First, get the count of records that will be exported
      const countResponse = await fetch(`${API_BASE_URL}/db-migration/count-export`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          sourceTable: selectedSourceTable,
          filters: validFilters,
        }),
      });

      if (countResponse.ok) {
        const countData = await countResponse.json();
        setRecordCount(countData.count);
        setCountQuery({
          query: countData.query,
          parameters: countData.parameters || []
        });
      }

      // Then get the preview
      const response = await fetch(`${API_BASE_URL}/db-migration/preview-export`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          connection: connection,
          sourceDatabase: selectedDatabase,
          sourceTable: selectedSourceTable,
          destTable: selectedDestTable,
          columnMappings: validMappings,
          filters: validFilters,
          limit: 10,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to preview data");
      }

      const data = await response.json();
      setPreviewData(data.rows || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    setError("");
    setExportProgress(0);
    setExportResult(null);

    try {
      // Filter out empty/invalid mappings
      const validMappings = columnMappings.filter(
        (mapping) => mapping.source && mapping.source.trim() && mapping.dest && mapping.dest.trim()
      );

      if (validMappings.length === 0) {
        throw new Error("No valid column mappings found. Please map at least one column.");
      }

      console.log("📤 Exporting with mappings:", validMappings);

      const response = await fetch(`${API_BASE_URL}/db-migration/export`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          connection,
          sourceDatabase: selectedDatabase,
          sourceTable: selectedSourceTable,
          destTable: selectedDestTable,
          columnMappings: validMappings,
          filters: filters.filter(f => f.column && f.value), // Only send valid filters
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Export failed");
      }

      const result = await response.json();
      setExportResult(result);

      if (result.failedRecords > 0) {
        setSuccess(`✅ Export completed: ${result.successfulRecords} succeeded, ${result.failedRecords} failed`);
      } else {
        setSuccess(`✅ Successfully exported all ${result.successfulRecords} rows to ${selectedDestTable}!`);
      }
      setExportProgress(100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch count when entering Step 4
  const fetchCountOnly = async () => {
    if (!selectedSourceTable) return;

    setLoading(true);
    setError("");

    try {
      const validFilters = filters.filter(f => f.column && f.value);

      const countResponse = await fetch(`${API_BASE_URL}/db-migration/count-export`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          sourceTable: selectedSourceTable,
          filters: validFilters,
        }),
      });

      if (countResponse.ok) {
        const countData = await countResponse.json();
        setRecordCount(countData.count);
        setCountQuery({
          query: countData.query,
          parameters: countData.parameters || []
        });
      }
    } catch (err) {
      console.error("Failed to fetch count:", err);
    } finally {
      setLoading(false);
    }
  };

  // ========== Navigation ==========
  const handleNext = () => {
    if (activeStep === 0 && !connected) {
      handleConnect();
    } else if (activeStep === 1 && !selectedSourceTable) {
      setError("Please select both source and destination tables");
    } else if (activeStep === 2 && columnMappings.length === 0) {
      setError("Please add at least one column mapping");
    } else if (activeStep === 3) {
      // Step 3 -> 4: Fetch count when moving to preview step
      setActiveStep((prev) => prev + 1);
      setError("");
      // Fetch count after state updates
      setTimeout(() => fetchCountOnly(), 100);
    } else if (activeStep === 4) {
      // Step 4: Execute export
      handleExportData();
    } else {
      setActiveStep((prev) => prev + 1);
      setError("");
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError("");
  };

  // ========== Render ==========
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3, border: "1px solid #e5e7eb" }} elevation={0}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <ExportIcon sx={{ fontSize: 32, color: "#3b82f6" }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#1a1a2e" }}>
              Database Export
            </Typography>
            <Typography variant="body2" sx={{ color: "#697386" }}>
              Export data from FareFlow to an external database
            </Typography>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Export Flow:</strong> Local FareFlow DB → External Database
          <br />
          Select local tables as source and external tables as destination.
        </Alert>

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

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 0: Connection */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Connect to External Database (Destination)
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Host"
                  value={connection.host}
                  onChange={(e) => setConnection({ ...connection, host: e.target.value })}
                  placeholder="e.g., localhost or 192.168.1.100"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Port"
                  type="number"
                  value={connection.port}
                  onChange={(e) => setConnection({ ...connection, port: parseInt(e.target.value) || 3306 })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Username"
                  value={connection.username}
                  onChange={(e) => setConnection({ ...connection, username: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={connection.password}
                  onChange={(e) => setConnection({ ...connection, password: e.target.value })}
                />
              </Grid>
            </Grid>

            {connected && (
              <Alert severity="success" sx={{ mb: 2 }}>
                ✅ Connected to {connection.host}:{connection.port}
                <Button size="small" onClick={handleDisconnect} sx={{ ml: 2 }}>
                  Disconnect
                </Button>
              </Alert>
            )}
          </Box>
        )}

        {/* Step 1: Table Selection */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Select Source (Local) and Destination (External) Tables
            </Typography>

            <Grid container spacing={3}>
              {/* Left: Local FareFlow DB (Source) */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, border: "1px solid #e5e7eb", height: 500, display: "flex", flexDirection: "column" }} elevation={0}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: "#2ecc71" }}>
                    Source (Local FareFlow DB)
                  </Typography>

                  <TextField
                    size="small"
                    placeholder="Search tables..."
                    value={sourceTableSearch}
                    onChange={(e) => setSourceTableSearch(e.target.value)}
                    fullWidth
                    sx={{ mb: 1 }}
                  />
                  <Box sx={{ overflow: "auto", flex: 1, border: "1px solid #eee", borderRadius: 1 }}>
                    <List dense disablePadding>
                      {localTables
                        .filter((t) => !sourceTableSearch || t.toLowerCase().includes(sourceTableSearch.toLowerCase()))
                        .map((table) => (
                          <ListItemButton
                            key={table}
                            selected={selectedSourceTable === table}
                            onClick={() => handleSelectSourceTable(table)}
                            sx={{ py: 0.5 }}
                          >
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <TableIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={table} primaryTypographyProps={{ fontSize: 13 }} />
                          </ListItemButton>
                        ))}
                    </List>
                  </Box>
                </Paper>
              </Grid>

              {/* Right: External DB (Destination) */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, border: "1px solid #e5e7eb", height: 500, display: "flex", flexDirection: "column" }} elevation={0}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: "#e74c3c" }}>
                    Destination (External DB)
                  </Typography>

                  <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                    <InputLabel>Database</InputLabel>
                    <Select value={selectedDatabase} label="Database" onChange={(e) => handleSelectDatabase(e.target.value)}>
                      {externalDatabases.map((db) => (
                        <MenuItem key={db} value={db}>
                          {db}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {selectedDatabase && (
                    <>
                      <TextField
                        size="small"
                        placeholder="Search tables..."
                        value={destTableSearch}
                        onChange={(e) => setDestTableSearch(e.target.value)}
                        fullWidth
                        sx={{ mb: 1 }}
                      />
                      <Box sx={{ overflow: "auto", flex: 1, border: "1px solid #eee", borderRadius: 1 }}>
                        <List dense disablePadding>
                          {externalTables
                            .filter((t) => !destTableSearch || t.toLowerCase().includes(destTableSearch.toLowerCase()))
                            .map((table) => (
                              <ListItemButton
                                key={table}
                                selected={selectedDestTable === table}
                                onClick={() => handleSelectDestTable(table)}
                                sx={{ py: 0.5 }}
                              >
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                  <TableIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary={table} primaryTypographyProps={{ fontSize: 13 }} />
                              </ListItemButton>
                            ))}
                        </List>
                      </Box>
                    </>
                  )}
                </Paper>
              </Grid>
            </Grid>

            {selectedSourceTable && selectedDestTable && (
              <Alert severity="success" sx={{ mt: 2 }}>
                ✅ Selected: {selectedSourceTable} → {selectedDestTable}
              </Alert>
            )}
          </Box>
        )}

        {/* Step 2: Column Mapping */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Map Columns: {selectedSourceTable} → {selectedDestTable}
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              💡 <strong>One-to-Many Mapping Supported:</strong> You can map the same source column to multiple destination columns.
              <br />
              Example: Map <code>transaction_datetime</code> to both <code>transaction_date</code> AND <code>transaction_time</code>
            </Alert>

            {columnMappings.map((mapping, index) => (
              <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: "center" }}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Source Column (Local)</InputLabel>
                    <Select
                      value={mapping.source}
                      label="Source Column (Local)"
                      onChange={(e) => handleColumnMappingChange(index, "source", e.target.value)}
                    >
                      {sourceColumns.map((col) => (
                        <MenuItem key={col.name} value={col.name}>
                          {col.name} <Chip label={col.type} size="small" variant="outlined" sx={{ ml: 1 }} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={1} sx={{ textAlign: "center" }}>
                  <ArrowIcon fontSize="small" sx={{ color: "#697386" }} />
                </Grid>
                <Grid item xs={12} sm={5}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Destination Column (External)</InputLabel>
                    <Select
                      value={mapping.dest}
                      label="Destination Column (External)"
                      onChange={(e) => handleColumnMappingChange(index, "dest", e.target.value)}
                    >
                      {destColumns.map((col) => (
                        <MenuItem key={col.name} value={col.name}>
                          {col.name} <Chip label={col.type} size="small" variant="outlined" sx={{ ml: 1 }} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => handleRemoveColumnMapping(index)}
                    startIcon={<DeleteIcon />}
                    fullWidth
                  >
                    Remove
                  </Button>
                </Grid>
              </Grid>
            ))}

            <Button
              variant="outlined"
              onClick={handleAddColumnMapping}
              startIcon={<AddIcon />}
              sx={{ mb: 2, borderColor: "#3b82f6", color: "#3b82f6" }}
            >
              Add Column Mapping
            </Button>

            {columnMappings.length > 0 && (
              <Alert severity="success" sx={{ mt: 2 }}>
                ✅ {columnMappings.length} column mapping(s) configured
              </Alert>
            )}
          </Box>
        )}

        {/* Step 3: Filter Data */}
        {activeStep === 3 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              <FilterIcon sx={{ verticalAlign: "middle", mr: 1 }} />
              Add Filters (Optional)
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              Add WHERE conditions to export only specific rows. For example: date {'>'} '2024-01-01'
            </Alert>

            {filters.map((filter, index) => (
              <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: "center" }}>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Column</InputLabel>
                    <Select
                      value={filter.column}
                      label="Column"
                      onChange={(e) => handleFilterChange(index, "column", e.target.value)}
                    >
                      {sourceColumns.map((col) => (
                        <MenuItem key={col.name} value={col.name}>
                          {col.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Operator</InputLabel>
                    <Select
                      value={filter.operator}
                      label="Operator"
                      onChange={(e) => handleFilterChange(index, "operator", e.target.value)}
                    >
                      <MenuItem value="=">=</MenuItem>
                      <MenuItem value="!=">!=</MenuItem>
                      <MenuItem value=">">{'>'}</MenuItem>
                      <MenuItem value=">=">{'>='}</MenuItem>
                      <MenuItem value="<">{'<'}</MenuItem>
                      <MenuItem value="<=">{'<='}</MenuItem>
                      <MenuItem value="LIKE">LIKE</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Value"
                    value={filter.value}
                    onChange={(e) => handleFilterChange(index, "value", e.target.value)}
                    placeholder="e.g., 2024-01-01 or %keyword%"
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => handleRemoveFilter(index)}
                    startIcon={<DeleteIcon />}
                    fullWidth
                  >
                    Remove
                  </Button>
                </Grid>
              </Grid>
            ))}

            <Button
              variant="outlined"
              onClick={handleAddFilter}
              startIcon={<AddIcon />}
              sx={{ mb: 2, borderColor: "#3b82f6", color: "#3b82f6" }}
            >
              Add Filter
            </Button>

            {filters.length > 0 && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {filters.length} filter(s) added. Only rows matching ALL filters will be exported.
              </Alert>
            )}
          </Box>
        )}

        {/* Step 4: Preview & Export */}
        {activeStep === 4 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Preview & Export Data
            </Typography>

            <Button
              variant="outlined"
              onClick={handlePreviewData}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
              sx={{ mb: 2 }}
            >
              Preview First 10 Rows
            </Button>

            {/* Record Count Info */}
            {recordCount !== null && (
              <Box sx={{ mb: 2 }}>
                <Alert severity="info" icon={<TableIcon />} sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {recordCount.toLocaleString()} record{recordCount !== 1 ? 's' : ''} will be exported
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#697386" }}>
                    From: {selectedSourceTable} → To: {selectedDestTable}
                  </Typography>
                </Alert>

                {/* SQL Query Display */}
                {countQuery && (
                  <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: "#374151" }}>
                      Query Used for Count:
                    </Typography>
                    <Box sx={{
                      p: 1.5,
                      backgroundColor: "#1e293b",
                      borderRadius: 1,
                      fontFamily: "monospace",
                      fontSize: "0.875rem",
                      color: "#e2e8f0",
                      overflowX: "auto",
                      mb: 1
                    }}>
                      {countQuery.query}
                    </Box>
                    {countQuery.parameters && countQuery.parameters.length > 0 && (
                      <Box>
                        <Typography variant="caption" sx={{ color: "#697386", fontWeight: 600 }}>
                          Parameters:
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 0.5 }}>
                          {countQuery.parameters.map((param, idx) => (
                            <Chip
                              key={idx}
                              label={`${idx + 1}: ${param}`}
                              size="small"
                              sx={{ fontFamily: "monospace" }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Paper>
                )}
              </Box>
            )}

            {/* Preview Table */}
            {previewData.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1, color: "#697386" }}>
                  Preview (first 10 rows with destination column names and transformations applied):
                </Typography>
                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e5e7eb", maxHeight: 400 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f9fafb" }}>
                        {Object.keys(previewData[0] || {}).map((col) => (
                          <TableCell key={col} sx={{ fontWeight: 600 }}>
                            {col}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previewData.map((row, idx) => (
                        <TableRow key={idx}>
                          {Object.values(row).map((val, i) => (
                            <TableCell key={i}>{val !== null ? String(val) : <em>null</em>}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Export Progress */}
            {exportProgress > 0 && exportProgress < 100 && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress variant="determinate" value={exportProgress} />
                <Typography variant="caption" sx={{ color: "#697386", mt: 1, display: "block" }}>
                  Exporting data... {exportProgress}%
                </Typography>
              </Box>
            )}

            {/* Export Result Statistics */}
            {exportResult && (
              <Box sx={{ mb: 2 }}>
                <Alert severity={exportResult.failedRecords > 0 ? "warning" : "success"} sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    Export Complete
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        ✅ Successful: <strong>{exportResult.successfulRecords.toLocaleString()}</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        ❌ Failed: <strong>{exportResult.failedRecords.toLocaleString()}</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ color: "#697386" }}>
                        Total Processed: {exportResult.processedRecords.toLocaleString()} / {exportResult.totalRecords.toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Alert>

                {/* Failure Reasons Breakdown */}
                {exportResult.failureReasons && Object.keys(exportResult.failureReasons).length > 0 && (
                  <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb", mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      Failure Reasons:
                    </Typography>
                    {Object.entries(exportResult.failureReasons).map(([reason, count]) => (
                      <Box key={reason} sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="body2" sx={{ color: "#697386" }}>
                          {reason}:
                        </Typography>
                        <Chip label={count} size="small" color="error" />
                      </Box>
                    ))}
                  </Paper>
                )}

                {/* Sample Errors */}
                {exportResult.sampleErrors && exportResult.sampleErrors.length > 0 && (
                  <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      Sample Errors (first {exportResult.sampleErrors.length}):
                    </Typography>
                    {exportResult.sampleErrors.map((err, idx) => (
                      <Typography key={idx} variant="caption" sx={{ display: "block", color: "#dc2626", fontFamily: "monospace", mb: 0.5 }}>
                        {err}
                      </Typography>
                    ))}
                  </Paper>
                )}
              </Box>
            )}

            {/* Ready to Export Message */}
            {!exportResult && recordCount !== null && (
              <Alert severity="info">
                Ready to export {recordCount.toLocaleString()} record{recordCount !== 1 ? 's' : ''} from <strong>{selectedSourceTable}</strong> to <strong>{selectedDestTable}</strong>.
                <br />
                Mapped columns: {columnMappings.length}
              </Alert>
            )}
          </Box>
        )}

        {/* Navigation Buttons */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : activeStep === 3 ? <ExportIcon /> : <ArrowIcon />}
            sx={{ backgroundColor: "#3b82f6", "&:hover": { backgroundColor: "#2563eb" } }}
          >
            {activeStep === 0 && !connected && "Connect"}
            {activeStep === 0 && connected && "Next"}
            {activeStep === 1 && "Next: Map Columns"}
            {activeStep === 2 && "Next: Add Filters"}
            {activeStep === 3 && "Next: Preview"}
            {activeStep === 4 && "Export Data"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
