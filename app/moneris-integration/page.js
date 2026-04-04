"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Alert, Card, CardContent,
  Grid, TextField, CircularProgress, Chip, FormControl, InputLabel,
  Select, MenuItem, IconButton, TablePagination, Collapse, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import {
  Download as DownloadIcon, Refresh as RefreshIcon,
  FilterList as FilterIcon, Clear as ClearIcon,
  ArrowUpward as ArrowUpwardIcon, ArrowDownward as ArrowDownwardIcon,
  CreditCard as CreditCardIcon, Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon, People as PeopleIcon,
  Search as SearchIcon, Settings as SettingsIcon,
  Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon,
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon, Error as ErrorIcon,
  Sync as SyncIcon, CloudDownload as CloudDownloadIcon,
} from "@mui/icons-material";
import GlobalNav from "../components/GlobalNav";
import { getCurrentUser, isAuthenticated, API_BASE_URL, getAuthHeaders } from "../lib/api";
import { useRouter } from "next/navigation";

export default function MonerisIntegrationPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  // Date range - default last 30 days
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    merchantId: "", terminalId: "", cardType: "", cabNumber: "",
    driverNumber: "", authorizationCode: "", transactionStatus: "",
    minAmount: "", maxAmount: "", jobId: "",
  });
  const [filterOptions, setFilterOptions] = useState({
    merchantIds: [], terminalIds: [], cardTypes: [],
    cabNumbers: [], driverNumbers: [], statuses: [],
  });

  // Data state
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [sortBy, setSortBy] = useState("transactionDate");
  const [sortDir, setSortDir] = useState("desc");

  // Moneris config state
  const [showConfig, setShowConfig] = useState(false);
  const [configs, setConfigs] = useState([]);
  const [configDialog, setConfigDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [configForm, setConfigForm] = useState({
    cabNumber: "", shift: "BOTH", merchantNumber: "",
    monerisStoreId: "", monerisApiToken: "", monerisEnvironment: "PROD",
  });
  const [showApiToken, setShowApiToken] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [syncStartDate, setSyncStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split("T")[0]
  );
  const [syncEndDate, setSyncEndDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/"); return; }
    const user = getCurrentUser();
    if (!user || !["ADMIN", "MANAGER", "ACCOUNTANT"].includes(user.role)) {
      router.push("/"); return;
    }
    setCurrentUser(user);
  }, [router]);

  // Load Moneris configs
  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/moneris/configs`, { headers: getAuthHeaders() });
      if (res.ok) setConfigs(await res.json());
    } catch (e) { console.error("Error loading configs", e); }
  }, []);

  useEffect(() => {
    if (currentUser) fetchConfigs();
  }, [currentUser, fetchConfigs]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/moneris/transactions/filters?startDate=${startDate}&endDate=${endDate}`,
        { headers: getAuthHeaders() }
      );
      if (res.ok) setFilterOptions(await res.json());
    } catch (e) { console.error("Error fetching filter options", e); }
  }, [startDate, endDate]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/moneris/transactions/summary?startDate=${startDate}&endDate=${endDate}`,
        { headers: getAuthHeaders() }
      );
      if (res.ok) setSummary(await res.json());
    } catch (e) { console.error("Error fetching summary", e); }
  }, [startDate, endDate]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({
        startDate, endDate, sortBy, sortDir,
        page: page.toString(), size: rowsPerPage.toString(),
      });
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) params.append(k, v);
      });
      const res = await fetch(`${API_BASE_URL}/moneris/transactions?${params}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTransactions(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (e) {
      setError("Failed to load transactions: " + e.message);
    } finally { setLoading(false); }
  }, [startDate, endDate, sortBy, sortDir, page, rowsPerPage, filters]);

  useEffect(() => {
    if (currentUser) { fetchTransactions(); fetchSummary(); fetchFilterOptions(); }
  }, [currentUser, fetchTransactions, fetchSummary, fetchFilterOptions]);

  // Config CRUD
  const handleSaveConfig = async () => {
    setError("");
    try {
      const url = editingConfig
        ? `${API_BASE_URL}/moneris/configs/${editingConfig.id}`
        : `${API_BASE_URL}/moneris/configs`;
      const method = editingConfig ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(configForm),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save");
      setSuccess(editingConfig ? "Config updated" : "Config created");
      setConfigDialog(false);
      setEditingConfig(null);
      fetchConfigs();
    } catch (e) { setError(e.message); }
  };

  const handleDeleteConfig = async (id) => {
    if (!confirm("Delete this Moneris configuration?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/moneris/configs/${id}`, {
        method: "DELETE", headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete");
      setSuccess("Config deleted");
      fetchConfigs();
    } catch (e) { setError(e.message); }
  };

  const handleTestConnection = async (id) => {
    setTestingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/moneris/configs/${id}/test`, {
        method: "POST", headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.connected) {
        setSuccess(`Cab connected! Response: ${data.responseCode} - ${data.message || "OK"}`);
      } else {
        setError(`Connection failed: ${data.error || data.message || "Unknown error"}`);
      }
    } catch (e) { setError("Test failed: " + e.message); }
    finally { setTestingId(null); }
  };

  const handleSyncAll = async () => {
    setSyncing(true); setSyncResult(null); setError("");
    try {
      const res = await fetch(
        `${API_BASE_URL}/moneris/sync?startDate=${syncStartDate}&endDate=${syncEndDate}`,
        { method: "POST", headers: getAuthHeaders() }
      );
      const data = await res.json();
      setSyncResult(data);
      if (data.totalNewTransactions > 0) {
        setSuccess(`Downloaded ${data.totalNewTransactions} new transactions`);
        fetchTransactions(); fetchSummary(); fetchFilterOptions();
      } else {
        setSuccess("Sync complete. See results below.");
      }
    } catch (e) { setError("Sync failed: " + e.message); }
    finally { setSyncing(false); }
  };

  const openAddDialog = () => {
    setEditingConfig(null);
    setConfigForm({ cabNumber: "", shift: "BOTH", merchantNumber: "",
      monerisStoreId: "", monerisApiToken: "", monerisEnvironment: "PROD" });
    setShowApiToken(false);
    setConfigDialog(true);
  };

  const openEditDialog = (cfg) => {
    setEditingConfig(cfg);
    setConfigForm({
      cabNumber: cfg.cabNumber, shift: cfg.shift, merchantNumber: cfg.merchantNumber,
      monerisStoreId: cfg.monerisStoreId, monerisApiToken: "", monerisEnvironment: cfg.monerisEnvironment,
    });
    setShowApiToken(false);
    setConfigDialog(true);
  };

  const handleSort = (field) => {
    if (sortBy === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortDir("desc"); }
    setPage(0);
  };

  const handleFilterChange = (field, value) => { setFilters(prev => ({ ...prev, [field]: value })); setPage(0); };
  const clearFilters = () => {
    setFilters({ merchantId: "", terminalId: "", cardType: "", cabNumber: "",
      driverNumber: "", authorizationCode: "", transactionStatus: "",
      minAmount: "", maxAmount: "", jobId: "" });
    setPage(0);
  };
  const activeFilterCount = Object.values(filters).filter(v => v !== "").length;

  const handleExportCSV = () => {
    if (!transactions.length) return;
    const hdrs = ["Date","Time","Merchant","Terminal","Auth Code","Card Type","Card Last 4","Amount","Tip","Total","Fee","Net","Status","Cab","Driver","Job ID","Batch","Settled"];
    const rows = transactions.map(t => [t.transactionDate,t.transactionTime,t.merchantId,t.terminalId,t.authorizationCode,t.cardType,t.cardLastFour,t.amount,t.tipAmount,t.totalAmount,t.processingFee,t.netAmount,t.transactionStatus,t.cabNumber,t.driverNumber,t.jobId,t.batchNumber,t.isSettled?"Yes":"No"]);
    const csv = [hdrs.join(","), ...rows.map(r => r.map(v => `"${v ?? ""}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `moneris_transactions_${startDate}_${endDate}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const fmt = (val) => val != null ? `$${Number(val).toFixed(2)}` : "-";

  const SortHeader = ({ field, label }) => (
    <TableCell sx={{ fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", userSelect: "none" }}
      onClick={() => handleSort(field)}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        {label}
        {sortBy === field && (sortDir === "asc" ? <ArrowUpwardIcon sx={{ fontSize: 16 }} /> : <ArrowDownwardIcon sx={{ fontSize: 16 }} />)}
      </Box>
    </TableCell>
  );

  if (!currentUser) return null;
  const isAdmin = currentUser.role === "ADMIN";

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
      <GlobalNav currentUser={currentUser} />
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#3e5244" }}>Moneris Transactions</Typography>
            <Typography variant="body2" color="text.secondary">Browse credit card transactions &bull; Manage Moneris terminal connections per cab</Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            {isAdmin && (
              <Button variant={showConfig ? "contained" : "outlined"} startIcon={<SettingsIcon />}
                onClick={() => setShowConfig(!showConfig)} size="small"
                sx={showConfig ? { backgroundColor: "#7B1FA2", "&:hover": { backgroundColor: "#6A1B9A" } } : {}}>
                Moneris Config {configs.length > 0 && `(${configs.length})`}
              </Button>
            )}
            <Button variant="outlined" startIcon={<DownloadIcon />}
              onClick={handleExportCSV} disabled={!transactions.length} size="small">Export CSV</Button>
            <Button variant="contained" startIcon={<RefreshIcon />}
              onClick={() => { fetchTransactions(); fetchSummary(); }} size="small"
              sx={{ backgroundColor: "#3e5244", "&:hover": { backgroundColor: "#2d3d32" } }}>Refresh</Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}

        {/* Moneris Config Panel */}
        <Collapse in={showConfig}>
          <Paper elevation={0} sx={{ p: 3, mb: 3, border: "2px solid #CE93D8", borderRadius: 2, backgroundColor: "#faf5fc" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#7B1FA2" }}>
                Moneris Terminal Configurations
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog} size="small"
                sx={{ backgroundColor: "#7B1FA2", "&:hover": { backgroundColor: "#6A1B9A" } }}>
                Add Terminal
              </Button>
            </Box>

            {configs.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                No Moneris terminals configured. Click "Add Terminal" to connect a cab's Moneris terminal.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ "& th": { fontWeight: 700, backgroundColor: "#f3e5f5" } }}>
                      <TableCell>Cab #</TableCell>
                      <TableCell>Shift</TableCell>
                      <TableCell>Merchant #</TableCell>
                      <TableCell>Store ID</TableCell>
                      <TableCell>Environment</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {configs.map(cfg => (
                      <TableRow key={cfg.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{cfg.cabNumber}</TableCell>
                        <TableCell><Chip label={cfg.shift} size="small" variant="outlined" /></TableCell>
                        <TableCell sx={{ fontFamily: "monospace" }}>{cfg.merchantNumber}</TableCell>
                        <TableCell sx={{ fontFamily: "monospace" }}>{cfg.monerisStoreId}</TableCell>
                        <TableCell>
                          <Chip label={cfg.monerisEnvironment} size="small"
                            color={cfg.monerisEnvironment === "PROD" ? "success" : "warning"} variant="outlined" />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                            <Button size="small" variant="outlined"
                              onClick={() => handleTestConnection(cfg.id)}
                              disabled={testingId === cfg.id}
                              startIcon={testingId === cfg.id ? <CircularProgress size={14} /> : <SyncIcon />}
                              sx={{ fontSize: 11, minWidth: 0, px: 1 }}>
                              Test
                            </Button>
                            <IconButton size="small" onClick={() => openEditDialog(cfg)}><EditIcon fontSize="small" /></IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteConfig(cfg.id)}><DeleteIcon fontSize="small" /></IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Sync Section */}
            {configs.length > 0 && (
              <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid #e0d0e8" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#7B1FA2", mb: 1.5 }}>
                  Download Transactions from Moneris
                </Typography>
                <Grid container spacing={2} alignItems="flex-end">
                  <Grid item xs={12} sm={3}>
                    <TextField fullWidth size="small" label="From Date" type="date" value={syncStartDate}
                      onChange={(e) => setSyncStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField fullWidth size="small" label="To Date" type="date" value={syncEndDate}
                      onChange={(e) => setSyncEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Button variant="contained" fullWidth
                      startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <CloudDownloadIcon />}
                      onClick={handleSyncAll} disabled={syncing}
                      sx={{ backgroundColor: "#7B1FA2", "&:hover": { backgroundColor: "#6A1B9A" }, height: 40 }}>
                      {syncing ? "Syncing..." : "Sync All Terminals"}
                    </Button>
                  </Grid>
                </Grid>
                {syncResult && (
                  <Box sx={{ mt: 2 }}>
                    {syncResult.perCabResults?.map((r, i) => (
                      <Alert key={i} severity={r.connected ? "info" : "warning"} sx={{ mb: 1 }}>
                        <strong>Cab {r.cabNumber}</strong> (Store: {r.storeId}) &mdash; {r.message || r.error || "No response"}
                      </Alert>
                    ))}
                  </Box>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  Note: The Moneris Gateway API provides batch totals only. For individual transactions, export CSV from the Moneris Go Portal and upload via Data Import.
                </Typography>
              </Box>
            )}
          </Paper>
        </Collapse>

        {/* Summary Cards */}
        {summary && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Card elevation={0} sx={{ border: "1px solid #e5e7eb" }}>
                <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <ReceiptIcon sx={{ color: "#1e88e5", fontSize: 28 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Transactions</Typography>
                      <Typography variant="h6" fontWeight={700}>{summary.totalTransactions?.toLocaleString()}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card elevation={0} sx={{ border: "1px solid #e5e7eb" }}>
                <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <MoneyIcon sx={{ color: "#43a047", fontSize: 28 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Total Amount</Typography>
                      <Typography variant="h6" fontWeight={700}>{fmt(summary.totalAmount)}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card elevation={0} sx={{ border: "1px solid #e5e7eb" }}>
                <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CreditCardIcon sx={{ color: "#8e24aa", fontSize: 28 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Net Amount</Typography>
                      <Typography variant="h6" fontWeight={700}>{fmt(summary.netAmount)}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card elevation={0} sx={{ border: "1px solid #e5e7eb" }}>
                <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PeopleIcon sx={{ color: "#fb8c00", fontSize: 28 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Assigned / Unassigned</Typography>
                      <Typography variant="h6" fontWeight={700}>{summary.withCabAssigned} / {summary.unassignedCount}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Date Range + Filter Toggle */}
        <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e5e7eb" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <TextField label="Start Date" type="date" size="small" value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
              InputLabelProps={{ shrink: true }} sx={{ width: 170 }} />
            <TextField label="End Date" type="date" size="small" value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
              InputLabelProps={{ shrink: true }} sx={{ width: 170 }} />
            <Button variant={showFilters ? "contained" : "outlined"} startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)} size="small"
              sx={showFilters ? { backgroundColor: "#3e5244", "&:hover": { backgroundColor: "#2d3d32" } } : {}}>
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
            {activeFilterCount > 0 && (
              <Button variant="text" startIcon={<ClearIcon />} onClick={clearFilters} size="small" color="error">Clear All</Button>
            )}
            <Box sx={{ flex: 1 }} />
            <Typography variant="body2" color="text.secondary">{totalElements.toLocaleString()} results</Typography>
          </Box>

          <Collapse in={showFilters}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small"><InputLabel>Merchant</InputLabel>
                  <Select value={filters.merchantId} label="Merchant" onChange={(e) => handleFilterChange("merchantId", e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    {filterOptions.merchantIds?.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small"><InputLabel>Terminal</InputLabel>
                  <Select value={filters.terminalId} label="Terminal" onChange={(e) => handleFilterChange("terminalId", e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    {filterOptions.terminalIds?.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small"><InputLabel>Card Type</InputLabel>
                  <Select value={filters.cardType} label="Card Type" onChange={(e) => handleFilterChange("cardType", e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    {filterOptions.cardTypes?.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small"><InputLabel>Status</InputLabel>
                  <Select value={filters.transactionStatus} label="Status" onChange={(e) => handleFilterChange("transactionStatus", e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    {filterOptions.statuses?.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small"><InputLabel>Cab #</InputLabel>
                  <Select value={filters.cabNumber} label="Cab #" onChange={(e) => handleFilterChange("cabNumber", e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    {filterOptions.cabNumbers?.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small"><InputLabel>Driver #</InputLabel>
                  <Select value={filters.driverNumber} label="Driver #" onChange={(e) => handleFilterChange("driverNumber", e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    {filterOptions.driverNumbers?.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField fullWidth size="small" label="Min Amount" type="number" value={filters.minAmount}
                  onChange={(e) => handleFilterChange("minAmount", e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField fullWidth size="small" label="Max Amount" type="number" value={filters.maxAmount}
                  onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField fullWidth size="small" label="Auth Code" value={filters.authorizationCode}
                  onChange={(e) => handleFilterChange("authorizationCode", e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField fullWidth size="small" label="Job / Order ID" value={filters.jobId}
                  onChange={(e) => handleFilterChange("jobId", e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment> }} />
              </Grid>
            </Grid>
          </Collapse>
        </Paper>

        {/* Transactions Table */}
        <Paper elevation={0} sx={{ border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <TableContainer sx={{ maxHeight: "calc(100vh - 480px)" }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow sx={{ "& th": { backgroundColor: "#f8fafb" } }}>
                  <SortHeader field="transactionDate" label="Date" />
                  <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                  <SortHeader field="merchantId" label="Merchant" />
                  <TableCell sx={{ fontWeight: 700 }}>Terminal</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Auth Code</TableCell>
                  <SortHeader field="cardType" label="Card" />
                  <TableCell sx={{ fontWeight: 700 }}>Last 4</TableCell>
                  <SortHeader field="amount" label="Amount" />
                  <TableCell sx={{ fontWeight: 700 }}>Tip</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fee</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Net</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <SortHeader field="cabNumber" label="Cab" />
                  <SortHeader field="driverNumber" label="Driver" />
                  <TableCell sx={{ fontWeight: 700 }}>Job ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Settled</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={17} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Loading transactions...</Typography>
                  </TableCell></TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow><TableCell colSpan={17} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">No transactions found for the selected criteria</Typography>
                  </TableCell></TableRow>
                ) : (
                  transactions.map((t, i) => (
                    <TableRow key={t.id || i} hover sx={{ "&:nth-of-type(even)": { backgroundColor: "#fafbfc" } }}>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{t.transactionDate}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap", fontSize: 12 }}>{t.transactionTime || "-"}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{t.merchantId || "-"}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{t.terminalId || "-"}</TableCell>
                      <TableCell sx={{ fontSize: 12, fontFamily: "monospace" }}>{t.authorizationCode || "-"}</TableCell>
                      <TableCell>
                        {t.cardType ? (
                          <Chip label={t.cardType} size="small" variant="outlined"
                            sx={{ fontSize: 11, height: 22,
                              borderColor: t.cardType === "VISA" ? "#1a73e8" : t.cardType === "MC" || t.cardType === "MASTERCARD" ? "#eb5b1d" : t.cardType === "AMEX" ? "#006fcf" : t.cardType === "DEBIT" ? "#43a047" : "#999",
                              color: t.cardType === "VISA" ? "#1a73e8" : t.cardType === "MC" || t.cardType === "MASTERCARD" ? "#eb5b1d" : t.cardType === "AMEX" ? "#006fcf" : t.cardType === "DEBIT" ? "#43a047" : "#999",
                            }} />
                        ) : "-"}
                      </TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{t.cardLastFour || "-"}</TableCell>
                      <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(t.amount)}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap", color: "#43a047" }}>{t.tipAmount ? fmt(t.tipAmount) : "-"}</TableCell>
                      <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(t.totalAmount)}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap", color: "#e53935", fontSize: 12 }}>{t.processingFee ? fmt(t.processingFee) : "-"}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 600 }}>{fmt(t.netAmount)}</TableCell>
                      <TableCell>
                        {t.transactionStatus ? (
                          <Chip label={t.transactionStatus} size="small"
                            color={t.transactionStatus === "APPROVED" || t.transactionStatus === "SETTLED" ? "success" : t.transactionStatus === "DECLINED" ? "error" : t.transactionStatus === "PENDING" ? "warning" : "default"}
                            sx={{ fontSize: 10, height: 20 }} />
                        ) : "-"}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{t.cabNumber || "-"}</TableCell>
                      <TableCell>{t.driverNumber || "-"}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{t.jobId || "-"}</TableCell>
                      <TableCell>
                        {t.isSettled != null ? (
                          <Chip label={t.isSettled ? "Yes" : "No"} size="small"
                            color={t.isSettled ? "success" : "default"} variant="outlined" sx={{ fontSize: 10, height: 20 }} />
                        ) : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={totalElements} page={page}
            onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[25, 50, 100, 250]} />
        </Paper>
      </Box>

      {/* Add/Edit Config Dialog */}
      <Dialog open={configDialog} onClose={() => setConfigDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingConfig ? "Edit Moneris Terminal" : "Add Moneris Terminal"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Cab Number" required
                value={configForm.cabNumber} onChange={(e) => setConfigForm(p => ({ ...p, cabNumber: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Shift</InputLabel>
                <Select value={configForm.shift} label="Shift"
                  onChange={(e) => setConfigForm(p => ({ ...p, shift: e.target.value }))}>
                  <MenuItem value="BOTH">Both</MenuItem>
                  <MenuItem value="DAY">Day</MenuItem>
                  <MenuItem value="NIGHT">Night</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Merchant Number" required
                value={configForm.merchantNumber} onChange={(e) => setConfigForm(p => ({ ...p, merchantNumber: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Moneris Store ID" required placeholder="e.g. mogo101222"
                value={configForm.monerisStoreId} onChange={(e) => setConfigForm(p => ({ ...p, monerisStoreId: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="API Token" required
                type={showApiToken ? "text" : "password"}
                value={configForm.monerisApiToken}
                placeholder={editingConfig ? "Leave blank to keep current" : ""}
                onChange={(e) => setConfigForm(p => ({ ...p, monerisApiToken: e.target.value }))}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowApiToken(!showApiToken)}>
                        {showApiToken ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Environment</InputLabel>
                <Select value={configForm.monerisEnvironment} label="Environment"
                  onChange={(e) => setConfigForm(p => ({ ...p, monerisEnvironment: e.target.value }))}>
                  <MenuItem value="PROD">Production</MenuItem>
                  <MenuItem value="TEST">Test/QA</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveConfig}
            sx={{ backgroundColor: "#7B1FA2", "&:hover": { backgroundColor: "#6A1B9A" } }}>
            {editingConfig ? "Update" : "Add Terminal"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
