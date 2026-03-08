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
  Divider,
  Autocomplete,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  InputAdornment,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  LinearProgress,
} from "@mui/material";
import {
  Storage as DbIcon,
  TableChart as TableIcon,
  SwapHoriz as MapIcon,
  PlayArrow as RunIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Visibility as PreviewIcon,
  Link as ConnectIcon,
  LinkOff as DisconnectIcon,
  ArrowForward as ArrowIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { API_BASE_URL, getAuthHeaders } from "../../lib/api";

const steps = [
  "Connect & Select Tables",
  "Map Columns",
  "Filter & Configure",
  "Preview & Migrate",
];

export default function DbMigrationSection() {
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
  const [externalTables, setExternalTables] = useState([]);
  const [localTables, setLocalTables] = useState([]);
  const [selectedSourceTable, setSelectedSourceTable] = useState("");
  const [selectedDestTable, setSelectedDestTable] = useState("");

  // Columns state
  const [sourceColumns, setSourceColumns] = useState([]);
  const [destColumns, setDestColumns] = useState([]);
  const [columnMappings, setColumnMappings] = useState({});
  const [defaultValues, setDefaultValues] = useState({});
  const [conflictResolution, setConflictResolution] = useState({});

  // Filter state - supports multiple filters
  const [filters, setFilters] = useState([{ column: "", operator: "gte", value: "" }]);

  // Preview/Results state
  const [sampleData, setSampleData] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [migrationResult, setMigrationResult] = useState(null);

  // Table search filters
  const [sourceTableSearch, setSourceTableSearch] = useState("");
  const [destTableSearch, setDestTableSearch] = useState("");

  const getConnectionPayload = useCallback(() => ({
    host: connection.host,
    port: connection.port,
    username: connection.username,
    password: connection.password,
    database: selectedDatabase,
  }), [connection, selectedDatabase]);

  // --- Step 1: Connect ---

  const handleConnect = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/db-migration/connect`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(connection),
      });
      const data = await res.json();
      if (data.connected) {
        setConnected(true);
        setExternalDatabases(data.databases || []);
        setSuccess("Connected successfully");
        // Also load local tables
        const localRes = await fetch(`${API_BASE_URL}/db-migration/tables/local`, {
          headers: getAuthHeaders(),
        });
        const localData = await localRes.json();
        setLocalTables(localData.tables || []);
      } else {
        setError(data.error || "Connection failed");
      }
    } catch (e) {
      setError("Connection failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setConnected(false);
    setExternalDatabases([]);
    setSelectedDatabase("");
    setExternalTables([]);
    setSelectedSourceTable("");
    setSelectedDestTable("");
    setSourceColumns([]);
    setDestColumns([]);
    setColumnMappings({});
    setActiveStep(0);
    setSuccess("");
  };

  const handleSelectDatabase = async (db) => {
    setSelectedDatabase(db);
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/db-migration/tables/external`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...connection, database: db }),
      });
      const data = await res.json();
      setExternalTables(data.tables || []);
    } catch (e) {
      setError("Failed to list tables: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSourceTable = async (table) => {
    setSelectedSourceTable(table);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/db-migration/columns/external`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...connection, database: selectedDatabase, table }),
      });
      const data = await res.json();
      setSourceColumns(data.columns || []);
      // Auto-suggest mappings
      if (destColumns.length > 0) {
        autoSuggestMappings(data.columns || [], destColumns);
      }
    } catch (e) {
      setError("Failed to list columns: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDestTable = async (table) => {
    setSelectedDestTable(table);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/db-migration/columns/local?table=${encodeURIComponent(table)}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setDestColumns(data.columns || []);
      // Auto-suggest mappings
      if (sourceColumns.length > 0) {
        autoSuggestMappings(sourceColumns, data.columns || []);
      }
    } catch (e) {
      setError("Failed to list columns: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const autoSuggestMappings = (srcCols, dstCols) => {
    const mappings = {};
    const dstNames = dstCols.map(c => c.name);
    // Skip auto-mapping to these common auto-generated columns
    const skipDest = new Set(["id"]);

    for (const srcCol of srcCols) {
      const srcName = srcCol.name.toLowerCase().replace(/_/g, "");
      // Exact match (normalized)
      let match = dstNames.find(d => {
        if (skipDest.has(d.toLowerCase())) return false;
        return d.toLowerCase().replace(/_/g, "") === srcName;
      });
      // Partial match - only if both sides are meaningful length (>3 chars)
      if (!match) {
        match = dstNames.find(d => {
          if (skipDest.has(d.toLowerCase())) return false;
          const dNorm = d.toLowerCase().replace(/_/g, "");
          // Only match if the shorter string is > 3 chars to avoid false positives like "id" in "driverid"
          const shorter = srcName.length < dNorm.length ? srcName : dNorm;
          if (shorter.length <= 3) return false;
          return dNorm.includes(srcName) || srcName.includes(dNorm);
        });
      }
      if (match) {
        mappings[srcCol.name] = [match];
      }
    }
    setColumnMappings(mappings);
  };

  // --- Step 2: Map Columns ---

  const handleMappingChange = (sourceCol, destCols) => {
    setColumnMappings(prev => {
      const updated = { ...prev };
      if (!destCols || destCols.length === 0) {
        delete updated[sourceCol];
      } else {
        updated[sourceCol] = destCols;
      }
      return updated;
    });
  };

  const handleDefaultValueChange = (destCol, value) => {
    setDefaultValues(prev => {
      const updated = { ...prev };
      if (!value) {
        delete updated[destCol];
      } else {
        updated[destCol] = value;
      }
      return updated;
    });
  };

  const handleConflictChange = (col, value) => {
    setConflictResolution(prev => ({ ...prev, [col]: value }));
  };

  // --- Step 3: Filter & Preview Sample ---

  const getActiveFilters = () => filters.filter(f => f.column && f.value);

  const handleFetchSample = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/db-migration/sample-data`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...getConnectionPayload(),
          table: selectedSourceTable,
          filters: getActiveFilters(),
          limit: 20,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSampleData(data);
      }
    } catch (e) {
      setError("Failed to fetch sample: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Step 4: Preview & Execute ---

  const handlePreview = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/db-migration/preview`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...getConnectionPayload(),
          sourceTable: selectedSourceTable,
          destTable: selectedDestTable,
          columnMappings,
          defaultValues,
          conflictResolution,
          filters: getActiveFilters(),
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setPreviewData(data);
      }
    } catch (e) {
      setError("Failed to preview: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteMigration = async () => {
    setLoading(true);
    setError("");
    setMigrationResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/db-migration/execute`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...getConnectionPayload(),
          sourceTable: selectedSourceTable,
          destTable: selectedDestTable,
          columnMappings,
          defaultValues,
          conflictResolution,
          filters: getActiveFilters(),
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMigrationResult(data);
        setSuccess("Migration completed!");
      }
    } catch (e) {
      setError("Migration failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const canProceedToStep2 = connected && selectedSourceTable && selectedDestTable;
  const canProceedToStep3 = Object.keys(columnMappings).length > 0;
  const canProceedToStep4 = true;

  const mappedDestCols = new Set(Object.values(columnMappings).flat());

  // Columns in dest that exist in source mappings (for conflict resolution)
  const overlappingColumns = Object.entries(columnMappings)
    .filter(([src, dsts]) => dsts && dsts.length > 0)
    .flatMap(([src, dsts]) => dsts.map(dst => ({ source: src, dest: dst })));

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
        Database Migration Tool
      </Typography>
      <Typography variant="body2" sx={{ color: "#697386", mb: 3 }}>
        Connect to an external MySQL database and migrate data to local tables with column mapping, filtering, and conflict resolution.
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && !error && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {/* STEP 0: Connect & Select Tables */}
      {activeStep === 0 && (
        <Box>
          {/* Connection Form */}
          <Paper sx={{ p: 3, mb: 3, border: "1px solid #e5e7eb" }} elevation={0}>
            <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <DbIcon /> External Database Connection
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={5}>
                <TextField
                  label="Host"
                  value={connection.host}
                  onChange={(e) => setConnection(prev => ({ ...prev, host: e.target.value }))}
                  fullWidth
                  size="small"
                  placeholder="e.g. 192.168.1.100"
                  disabled={connected}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  label="Port"
                  type="number"
                  value={connection.port}
                  onChange={(e) => setConnection(prev => ({ ...prev, port: parseInt(e.target.value) || 3306 }))}
                  fullWidth
                  size="small"
                  disabled={connected}
                />
              </Grid>
              <Grid item xs={12} sm={2.5}>
                <TextField
                  label="Username"
                  value={connection.username}
                  onChange={(e) => setConnection(prev => ({ ...prev, username: e.target.value }))}
                  fullWidth
                  size="small"
                  disabled={connected}
                />
              </Grid>
              <Grid item xs={12} sm={2.5}>
                <TextField
                  label="Password"
                  type="password"
                  value={connection.password}
                  onChange={(e) => setConnection(prev => ({ ...prev, password: e.target.value }))}
                  fullWidth
                  size="small"
                  disabled={connected}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
              {!connected ? (
                <Button
                  variant="contained"
                  onClick={handleConnect}
                  disabled={loading || !connection.host || !connection.username}
                  startIcon={loading ? <CircularProgress size={16} /> : <ConnectIcon />}
                >
                  Connect
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDisconnect}
                  startIcon={<DisconnectIcon />}
                >
                  Disconnect
                </Button>
              )}
              {connected && (
                <Chip label="Connected" color="success" size="small" icon={<CheckIcon />} />
              )}
            </Box>
          </Paper>

          {/* Table Selection - Side by Side */}
          {connected && (
            <Grid container spacing={3}>
              {/* Left: External DB */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, border: "1px solid #e5e7eb", height: 500, display: "flex", flexDirection: "column" }} elevation={0}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: "#e74c3c" }}>
                    Source (External DB)
                  </Typography>

                  {/* Database selector */}
                  <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                    <InputLabel>Database</InputLabel>
                    <Select
                      value={selectedDatabase}
                      label="Database"
                      onChange={(e) => handleSelectDatabase(e.target.value)}
                    >
                      {externalDatabases.map(db => (
                        <MenuItem key={db} value={db}>{db}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Table list */}
                  {selectedDatabase && (
                    <>
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
                          {externalTables
                            .filter(t => !sourceTableSearch || t.toLowerCase().includes(sourceTableSearch.toLowerCase()))
                            .map(table => (
                              <ListItemButton
                                key={table}
                                selected={selectedSourceTable === table}
                                onClick={() => handleSelectSourceTable(table)}
                                sx={{ py: 0.5 }}
                              >
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                  <TableIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={table}
                                  primaryTypographyProps={{ fontSize: 13 }}
                                />
                              </ListItemButton>
                            ))}
                        </List>
                      </Box>
                    </>
                  )}
                </Paper>
              </Grid>

              {/* Right: Local DB */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, border: "1px solid #e5e7eb", height: 500, display: "flex", flexDirection: "column" }} elevation={0}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: "#2ecc71" }}>
                    Destination (Local DB)
                  </Typography>

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
                      {localTables
                        .filter(t => !destTableSearch || t.toLowerCase().includes(destTableSearch.toLowerCase()))
                        .map(table => (
                          <ListItemButton
                            key={table}
                            selected={selectedDestTable === table}
                            onClick={() => handleSelectDestTable(table)}
                            sx={{ py: 0.5 }}
                          >
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <TableIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={table}
                              primaryTypographyProps={{ fontSize: 13 }}
                            />
                          </ListItemButton>
                        ))}
                    </List>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Selected tables summary */}
          {selectedSourceTable && selectedDestTable && (
            <Paper sx={{ p: 2, mt: 2, border: "1px solid #e5e7eb", backgroundColor: "#f0f9ff" }} elevation={0}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip label={`${selectedDatabase}.${selectedSourceTable}`} color="error" size="small" />
                <ArrowIcon />
                <Chip label={selectedDestTable} color="success" size="small" />
                <Typography variant="body2" sx={{ ml: 1, color: "#697386" }}>
                  ({sourceColumns.length} source cols, {destColumns.length} dest cols)
                </Typography>
              </Box>
            </Paper>
          )}

          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              onClick={() => setActiveStep(1)}
              disabled={!canProceedToStep2}
              endIcon={<ArrowIcon />}
            >
              Next: Map Columns
            </Button>
          </Box>
        </Box>
      )}

      {/* STEP 1: Map Columns */}
      {activeStep === 1 && (
        <Box>
          <Paper sx={{ p: 3, mb: 3, border: "1px solid #e5e7eb" }} elevation={0}>
            <Typography variant="h6" sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
              <MapIcon /> Column Mapping
            </Typography>
            <Typography variant="body2" sx={{ color: "#697386", mb: 2 }}>
              Map source columns (left) to destination columns (right). Unmapped columns will be skipped.
            </Typography>

            <TableContainer sx={{ maxHeight: 500 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: "30%" }}>Source Column</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: "15%" }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: "5%", textAlign: "center" }}></TableCell>
                    <TableCell sx={{ fontWeight: 700, width: "35%" }}>Destination Column</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: "15%" }}>Dest Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sourceColumns.map((col) => {
                    const mappedDests = columnMappings[col.name] || [];
                    return (
                      <TableRow key={col.name} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: 12 }}>
                            {col.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={col.type} size="small" variant="outlined" sx={{ fontSize: 10 }} />
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          <ArrowIcon fontSize="small" color={mappedDests.length > 0 ? "primary" : "disabled"} />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <FormControl fullWidth size="small">
                              <Select
                                multiple
                                value={mappedDests}
                                onChange={(e) => handleMappingChange(col.name, e.target.value)}
                                displayEmpty
                                renderValue={(selected) =>
                                  selected.length === 0 ? (
                                    <em style={{ color: "#999" }}>-- unmapped --</em>
                                  ) : (
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                      {selected.map(val => (
                                        <Chip
                                          key={val}
                                          label={val}
                                          size="small"
                                          sx={{ fontSize: 10, fontFamily: "monospace" }}
                                          onDelete={(e) => {
                                            e.stopPropagation();
                                            handleMappingChange(col.name, mappedDests.filter(d => d !== val));
                                          }}
                                          onMouseDown={(e) => e.stopPropagation()}
                                        />
                                      ))}
                                    </Box>
                                  )
                                }
                                sx={{ fontSize: 12, fontFamily: "monospace" }}
                              >
                                {destColumns.map(dc => (
                                  <MenuItem
                                    key={dc.name}
                                    value={dc.name}
                                    sx={{ fontSize: 12, fontFamily: "monospace" }}
                                  >
                                    {dc.name} ({dc.type})
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            {mappedDests.length > 0 && (
                              <Tooltip title="Clear mapping">
                                <IconButton
                                  size="small"
                                  onClick={() => handleMappingChange(col.name, [])}
                                  sx={{ color: "#999" }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {mappedDests.length > 0 && (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                              {mappedDests.map(d => {
                                const dc = destColumns.find(c => c.name === d);
                                return dc ? (
                                  <Chip key={d} label={dc.type} size="small" variant="outlined" color="success" sx={{ fontSize: 10 }} />
                                ) : null;
                              })}
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 2, display: "flex", gap: 1, alignItems: "center" }}>
              <Chip
                label={`${Object.keys(columnMappings).length} mapped`}
                color="primary"
                size="small"
              />
              <Chip
                label={`${sourceColumns.length - Object.keys(columnMappings).length} unmapped`}
                size="small"
                variant="outlined"
              />
            </Box>
          </Paper>

          {/* Default Values for unmapped destination columns */}
          <Paper sx={{ p: 3, mb: 3, border: "1px solid #e5e7eb" }} elevation={0}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Default Values (for unmapped destination columns)
            </Typography>
            <Typography variant="body2" sx={{ color: "#697386", mb: 2 }}>
              Set default values for destination columns that aren't mapped to any source column.
            </Typography>
            <Grid container spacing={2}>
              {destColumns
                .filter(dc => !mappedDestCols.has(dc.name))
                .slice(0, 20)
                .map(dc => (
                  <Grid item xs={12} sm={6} md={4} key={dc.name}>
                    <TextField
                      label={dc.name}
                      value={defaultValues[dc.name] || ""}
                      onChange={(e) => handleDefaultValueChange(dc.name, e.target.value)}
                      size="small"
                      fullWidth
                      placeholder={dc.nullable === "YES" ? "nullable" : "required"}
                      helperText={`${dc.type}${dc.nullable === "NO" ? " (required)" : ""}`}
                    />
                  </Grid>
                ))}
            </Grid>
          </Paper>

          <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
            <Button onClick={() => setActiveStep(0)}>Back</Button>
            <Button
              variant="contained"
              onClick={() => setActiveStep(2)}
              disabled={!canProceedToStep3}
              endIcon={<ArrowIcon />}
            >
              Next: Filter & Configure
            </Button>
          </Box>
        </Box>
      )}

      {/* STEP 2: Filter & Conflict Resolution */}
      {activeStep === 2 && (
        <Box>
          {/* Filter criteria */}
          <Paper sx={{ p: 3, mb: 3, border: "1px solid #e5e7eb" }} elevation={0}>
            <Typography variant="h6" sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
              <FilterIcon /> Data Filters (Optional)
            </Typography>
            <Typography variant="body2" sx={{ color: "#697386", mb: 2 }}>
              Add one or more filters to control which rows to migrate. All conditions are combined with AND. Leave blank to migrate all rows.
            </Typography>

            {filters.map((filter, idx) => (
              <Grid container spacing={2} alignItems="center" key={idx} sx={{ mb: 1 }}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Column</InputLabel>
                    <Select
                      value={filter.column}
                      label="Column"
                      onChange={(e) => {
                        const updated = [...filters];
                        updated[idx] = { ...updated[idx], column: e.target.value };
                        setFilters(updated);
                      }}
                    >
                      <MenuItem value="">
                        <em>-- none --</em>
                      </MenuItem>
                      {sourceColumns.map(col => (
                        <MenuItem key={col.name} value={col.name}>
                          {col.name} ({col.type})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={2.5}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Operator</InputLabel>
                    <Select
                      value={filter.operator}
                      label="Operator"
                      onChange={(e) => {
                        const updated = [...filters];
                        updated[idx] = { ...updated[idx], operator: e.target.value };
                        setFilters(updated);
                      }}
                      disabled={!filter.column}
                    >
                      <MenuItem value="eq">= (equals)</MenuItem>
                      <MenuItem value="neq">!= (not equals)</MenuItem>
                      <MenuItem value="gt">&gt; (greater than)</MenuItem>
                      <MenuItem value="gte">&gt;= (greater or equal)</MenuItem>
                      <MenuItem value="lt">&lt; (less than)</MenuItem>
                      <MenuItem value="lte">&lt;= (less or equal)</MenuItem>
                      <MenuItem value="like">LIKE (pattern)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3.5}>
                  <TextField
                    label="Value"
                    value={filter.value}
                    onChange={(e) => {
                      const updated = [...filters];
                      updated[idx] = { ...updated[idx], value: e.target.value };
                      setFilters(updated);
                    }}
                    size="small"
                    fullWidth
                    disabled={!filter.column}
                    placeholder="e.g. 2025-01-01"
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    {filters.length > 1 && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setFilters(filters.filter((_, i) => i !== idx))}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                    {idx === filters.length - 1 && (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setFilters([...filters, { column: "", operator: "eq", value: "" }])}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Grid>
              </Grid>
            ))}

            {/* Active filters summary */}
            {getActiveFilters().length > 0 && (
              <Box sx={{ mt: 1, mb: 1, display: "flex", gap: 0.5, flexWrap: "wrap", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#697386", mr: 0.5 }}>Active:</Typography>
                {getActiveFilters().map((f, i) => (
                  <Chip
                    key={i}
                    label={`${f.column} ${f.operator} "${f.value}"`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontFamily: "monospace", fontSize: 11 }}
                  />
                ))}
              </Box>
            )}

            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                onClick={handleFetchSample}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : <PreviewIcon />}
              >
                Preview Source Data
              </Button>
            </Box>
          </Paper>

          {/* Sample data from source */}
          {sampleData && (
            <Paper sx={{ p: 3, mb: 3, border: "1px solid #e5e7eb" }} elevation={0}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Source Data Preview ({sampleData.totalRows?.toLocaleString()} total rows match)
              </Typography>
              <TableContainer sx={{ maxHeight: 300 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {sampleData.sampleRows?.length > 0 &&
                        Object.keys(sampleData.sampleRows[0]).map(col => (
                          <TableCell key={col} sx={{ fontWeight: 700, fontSize: 11, whiteSpace: "nowrap" }}>
                            {col}
                          </TableCell>
                        ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sampleData.sampleRows?.map((row, idx) => (
                      <TableRow key={idx} hover>
                        {Object.values(row).map((val, i) => (
                          <TableCell key={i} sx={{ fontSize: 11, whiteSpace: "nowrap", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                            {val !== null && val !== undefined ? String(val) : <em style={{ color: "#999" }}>null</em>}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* Conflict Resolution */}
          <Paper sx={{ p: 3, mb: 3, border: "1px solid #e5e7eb" }} elevation={0}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Conflict Resolution
            </Typography>
            <Typography variant="body2" sx={{ color: "#697386", mb: 2 }}>
              If a row already exists in the destination (duplicate key), which data should take precedence?
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Source Column</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Destination Column</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>On Conflict, Keep</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {overlappingColumns.map(({ source, dest }) => (
                    <TableRow key={`${source}->${dest}`}>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{source}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{dest}</TableCell>
                      <TableCell>
                        <RadioGroup
                          row
                          value={conflictResolution[dest] || "source"}
                          onChange={(e) => handleConflictChange(dest, e.target.value)}
                        >
                          <FormControlLabel value="source" control={<Radio size="small" />} label="Source (overwrite)" />
                          <FormControlLabel value="destination" control={<Radio size="small" />} label="Destination (keep existing)" />
                        </RadioGroup>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
            <Button onClick={() => setActiveStep(1)}>Back</Button>
            <Button
              variant="contained"
              onClick={() => { setActiveStep(3); handlePreview(); }}
              endIcon={<ArrowIcon />}
            >
              Next: Preview & Migrate
            </Button>
          </Box>
        </Box>
      )}

      {/* STEP 3: Preview & Execute */}
      {activeStep === 3 && (
        <Box>
          {/* Migration Summary */}
          <Paper sx={{ p: 3, mb: 3, border: "1px solid #e5e7eb" }} elevation={0}>
            <Typography variant="h6" sx={{ mb: 2 }}>Migration Summary</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="textSecondary">Source</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedDatabase}.{selectedSourceTable}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="textSecondary">Destination</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedDestTable}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="textSecondary">Columns Mapped</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {Object.keys(columnMappings).length}
                </Typography>
              </Grid>
              {getActiveFilters().length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Filters</Typography>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.5 }}>
                    {getActiveFilters().map((f, i) => (
                      <Chip
                        key={i}
                        label={`${f.column} ${f.operator} "${f.value}"`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontFamily: "monospace", fontSize: 12 }}
                      />
                    ))}
                  </Box>
                </Grid>
              )}
              {previewData?.totalSourceRows !== undefined && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Total Rows to Migrate</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "#1976d2" }}>
                    {Number(previewData.totalSourceRows).toLocaleString()}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Preview rows (transformed) */}
          {previewData?.previewRows && (
            <Paper sx={{ p: 3, mb: 3, border: "1px solid #e5e7eb" }} elevation={0}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Sample Migrated Rows (as they will appear in destination)
              </Typography>
              <TableContainer sx={{ maxHeight: 300 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {previewData.previewRows.length > 0 &&
                        Object.keys(previewData.previewRows[0]).map(col => (
                          <TableCell key={col} sx={{ fontWeight: 700, fontSize: 11, whiteSpace: "nowrap" }}>
                            {col}
                          </TableCell>
                        ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewData.previewRows.map((row, idx) => (
                      <TableRow key={idx} hover>
                        {Object.values(row).map((val, i) => (
                          <TableCell key={i} sx={{ fontSize: 11, whiteSpace: "nowrap" }}>
                            {val !== null && val !== undefined ? String(val) : <em style={{ color: "#999" }}>null</em>}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {loading && (
            <Box sx={{ mb: 3 }}>
              <LinearProgress />
              <Typography variant="body2" sx={{ mt: 1, color: "#697386", textAlign: "center" }}>
                Migration in progress...
              </Typography>
            </Box>
          )}

          {/* Migration Results */}
          {migrationResult && (
            <Paper sx={{ p: 3, mb: 3, border: "1px solid #e5e7eb" }} elevation={0}>
              <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                {migrationResult.status === "SUCCESS" ? (
                  <CheckIcon color="success" />
                ) : migrationResult.status === "PARTIAL" ? (
                  <WarningIcon color="warning" />
                ) : (
                  <ErrorIcon color="error" />
                )}
                Migration {migrationResult.status === "SUCCESS" ? "Completed" : migrationResult.status === "PARTIAL" ? "Completed with Errors" : "Failed"}
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: "center", py: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: "#1976d2" }}>
                        {migrationResult.totalProcessed?.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">Total Processed</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: "center", py: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: "#2ecc71" }}>
                        {migrationResult.successCount?.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">Successful</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: "center", py: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: "#f39c12" }}>
                        {migrationResult.skippedCount?.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">Skipped</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: "center", py: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: "#e74c3c" }}>
                        {migrationResult.errorCount?.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">Errors</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {migrationResult.skippedRows?.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: "#f39c12" }}>
                    Skipped / Duplicate Rows (first {migrationResult.skippedRows.length}):
                  </Typography>
                  <Box sx={{ maxHeight: 200, overflow: "auto", backgroundColor: "#fffbeb", p: 1, borderRadius: 1 }}>
                    {migrationResult.skippedRows.map((row, idx) => (
                      <Typography key={idx} variant="body2" sx={{ fontSize: 11, fontFamily: "monospace", mb: 0.5 }}>
                        {row}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}

              {migrationResult.errors?.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: "#e74c3c" }}>
                    Error Details (first {migrationResult.errors.length}):
                  </Typography>
                  <Box sx={{ maxHeight: 200, overflow: "auto", backgroundColor: "#fef2f2", p: 1, borderRadius: 1 }}>
                    {migrationResult.errors.map((err, idx) => (
                      <Typography key={idx} variant="body2" sx={{ fontSize: 11, fontFamily: "monospace", mb: 0.5 }}>
                        {err}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          )}

          <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
            <Button onClick={() => setActiveStep(2)} disabled={loading}>Back</Button>
            {!migrationResult ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleExecuteMigration}
                disabled={loading || !previewData}
                startIcon={loading ? <CircularProgress size={16} /> : <RunIcon />}
                size="large"
              >
                Execute Migration
              </Button>
            ) : (
              <Button
                variant="outlined"
                onClick={() => {
                  setMigrationResult(null);
                  setPreviewData(null);
                  setSampleData(null);
                  setActiveStep(0);
                }}
                startIcon={<RefreshIcon />}
              >
                Start New Migration
              </Button>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
