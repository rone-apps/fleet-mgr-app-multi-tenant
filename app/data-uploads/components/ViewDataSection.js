"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from "@mui/material";
import {
  CreditCard as CreditCardIcon,
  FlightTakeoff as AirportIcon,
  PersonPin as PersonPinIcon,
  Speed as MileageIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { API_BASE_URL } from "../../lib/api";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, subDays } from "date-fns";

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`view-tabpanel-${index}`}
      aria-labelledby={`view-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ViewDataSection({ currentUser }) {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Sub-tabs for data types */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="secondary"
            textColor="inherit"
            variant="fullWidth"
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              "& .MuiTab-root": {
                minHeight: 56,
                fontSize: "0.9rem",
              },
            }}
          >
            <Tab
              icon={<CreditCardIcon />}
              iconPosition="start"
              label="Credit Card Transactions"
              id="view-tab-0"
              aria-controls="view-tabpanel-0"
            />
            <Tab
              icon={<MileageIcon />}
              iconPosition="start"
              label="Mileage Records"
              id="view-tab-1"
              aria-controls="view-tabpanel-1"
            />
            <Tab
              icon={<AirportIcon />}
              iconPosition="start"
              label="Airport Trips"
              id="view-tab-2"
              aria-controls="view-tabpanel-2"
            />
            <Tab
              icon={<PersonPinIcon />}
              iconPosition="start"
              label="Airport Trips (Driver)"
              id="view-tab-3"
              aria-controls="view-tabpanel-3"
            />
          </Tabs>
        </Paper>

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <CreditCardDataView currentUser={currentUser} />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <MileageDataView currentUser={currentUser} />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <AirportTripsDataView currentUser={currentUser} />
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          <AirportTripsDriverDataView currentUser={currentUser} />
        </TabPanel>
      </Box>
    </LocalizationProvider>
  );
}

const UNASSIGNED_DRIVER = { driverNumber: "N/A", firstName: "Unassigned", lastName: "(N/A)" };

// ==================== Credit Card Data View ====================
function CreditCardDataView({ currentUser }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [cabNumber, setCabNumber] = useState("");
  const [driverNumber, setDriverNumber] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editCabNumber, setEditCabNumber] = useState("");
  const [editDriverNumber, setEditDriverNumber] = useState("");

  // Re-enrich state
  const [enriching, setEnriching] = useState(false);
  const [enrichResult, setEnrichResult] = useState(null);

  // Dropdowns
  const [cabs, setCabs] = useState([]);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const handleReEnrich = async () => {
    setEnriching(true);
    setEnrichResult(null);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
      });
      const response = await fetch(`${API_BASE_URL}/data-view/credit-card-transactions/re-enrich?${params}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema") },
      });
      if (!response.ok) throw new Error("Failed to re-enrich");
      const result = await response.json();
      setEnrichResult(result);
      if ((result.cabsSwapped || 0) > 0 || (result.cabsFilled || 0) > 0 || result.driversUpdated > 0) {
        fetchData();
      }
      setTimeout(() => setEnrichResult(null), 8000);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnriching(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const token = localStorage.getItem("token");
      const [cabsRes, driversRes] = await Promise.all([
        fetch(`${API_BASE_URL}/cabs`, { headers: { Authorization: `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"), } }),
        fetch(`${API_BASE_URL}/drivers`, { headers: { Authorization: `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"), } }),
      ]);
      if (cabsRes.ok) setCabs(await cabsRes.json());
      if (driversRes.ok) setDrivers(await driversRes.json());
    } catch (e) {
      console.error("Error fetching dropdowns:", e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        page: page.toString(),
        size: rowsPerPage.toString(),
      });
      if (cabNumber) params.append("cabNumber", cabNumber);
      if (driverNumber) params.append("driverNumber", driverNumber);

      const response = await fetch(`${API_BASE_URL}/data-view/credit-card-transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"), },
      });

      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      setData(result.content || []);
      setTotalCount(result.totalElements || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when page or rowsPerPage changes
  useEffect(() => {
    if (data.length > 0 || totalCount > 0) fetchData();
  }, [page, rowsPerPage]);

  const handleSearch = () => {
    setPage(0);
    fetchData();
  };

  const handleEditSave = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/data-view/credit-card-transactions/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cabNumber: editCabNumber || null, driverNumber: editDriverNumber || null }),
      });

      if (!response.ok) throw new Error("Failed to update");

      setSuccess("Record updated successfully");
      setEditingId(null);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Box>
      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <FilterIcon /> Filters
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Autocomplete
              options={cabs}
              getOptionLabel={(option) => option.cabNumber || ""}
              value={cabs.find((c) => c.cabNumber === cabNumber) || null}
              onChange={(e, v) => setCabNumber(v?.cabNumber || "")}
              renderInput={(params) => <TextField {...params} label="Cab #" size="small" />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Autocomplete
              options={[UNASSIGNED_DRIVER, ...drivers]}
              getOptionLabel={(option) => `${option.driverNumber} - ${option.firstName} ${option.lastName}`}
              value={[UNASSIGNED_DRIVER, ...drivers].find((d) => d.driverNumber === driverNumber) || null}
              onChange={(e, v) => setDriverNumber(v?.driverNumber || "")}
              renderInput={(params) => <TextField {...params} label="Driver" size="small" />}
            />
          </Grid>
          <Grid item xs={12} sm={12} md={4}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => { setCabNumber(""); setDriverNumber(""); }}
              sx={{ ml: 1 }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {enrichResult && (
        <Alert severity={(enrichResult.cabsSwapped || 0) > 0 || (enrichResult.cabsFilled || 0) > 0 || enrichResult.driversUpdated > 0 ? "success" : "info"} sx={{ mb: 2 }}>
          Checked {enrichResult.totalChecked} transactions — swapped {enrichResult.cabsSwapped || 0} virtual cab(s), filled {enrichResult.cabsFilled || 0} missing cab(s), and updated {enrichResult.driversUpdated} driver(s)
        </Alert>
      )}

      {/* Data Table */}
      <Paper>
        <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1.5, borderBottom: "1px solid #e5e7eb" }}>
          <Tooltip title="Re-lookup missing cab numbers and drivers using latest merchant mappings and shift data">
            <span>
              <Button
                variant="outlined"
                size="small"
                startIcon={enriching ? <CircularProgress size={16} /> : <RefreshIcon />}
                onClick={handleReEnrich}
                disabled={enriching || data.length === 0}
              >
                {enriching ? "Refreshing..." : "Refresh Cab/Driver Assignments"}
              </Button>
            </span>
          </Tooltip>
        </Box>
        <TableContainer>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Merchant #</TableCell>
                <TableCell>Cab #</TableCell>
                <TableCell>Driver #</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    No data found. Use filters and click Search.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.transactionDate}</TableCell>
                    <TableCell>{row.transactionTime}</TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                      {row.merchantId || "-"}
                    </TableCell>
                    <TableCell>
                      {editingId === row.id ? (
                        <Autocomplete
                          options={cabs}
                          getOptionLabel={(option) => option.cabNumber || ""}
                          value={cabs.find((c) => c.cabNumber === editCabNumber) || null}
                          onChange={(e, v) => setEditCabNumber(v?.cabNumber || "")}
                          renderInput={(params) => <TextField {...params} size="small" sx={{ minWidth: 100 }} />}
                          size="small"
                        />
                      ) : (
                        <Chip label={row.cabNumber || "-"} size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === row.id ? (
                        <Autocomplete
                          options={drivers}
                          getOptionLabel={(option) => option.driverNumber || ""}
                          value={drivers.find((d) => d.driverNumber === editDriverNumber) || null}
                          onChange={(e, v) => setEditDriverNumber(v?.driverNumber || "")}
                          renderInput={(params) => <TextField {...params} size="small" sx={{ minWidth: 120 }} />}
                          size="small"
                        />
                      ) : (
                        <Chip
                          label={row.driverNumber || "N/A"}
                          size="small"
                          color={row.driverNumber ? "primary" : "default"}
                          variant={row.driverNumber ? "filled" : "outlined"}
                        />
                      )}
                    </TableCell>
                    <TableCell>${row.amount?.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      {editingId === row.id ? (
                        <>
                          <IconButton size="small" color="success" onClick={() => handleEditSave(row.id)}>
                            <SaveIcon />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => setEditingId(null)}>
                            <CancelIcon />
                          </IconButton>
                        </>
                      ) : (
                        <IconButton
                          size="small"
                          onClick={() => { setEditingId(row.id); setEditCabNumber(row.cabNumber || ""); setEditDriverNumber(row.driverNumber || ""); }}
                        >
                          <EditIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Paper>
    </Box>
  );
}

// ==================== Mileage Data View ====================
function MileageDataView({ currentUser }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [cabNumber, setCabNumber] = useState("");
  const [driverNumber, setDriverNumber] = useState("");
  
  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editDriverNumber, setEditDriverNumber] = useState("");
  
  // Dropdowns
  const [cabs, setCabs] = useState([]);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const fetchDropdowns = async () => {
    try {
      const token = localStorage.getItem("token");
      const [cabsRes, driversRes] = await Promise.all([
        fetch(`${API_BASE_URL}/cabs`, { headers: { Authorization: `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"), } }),
        fetch(`${API_BASE_URL}/drivers`, { headers: { Authorization: `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"), } }),
      ]);
      if (cabsRes.ok) setCabs(await cabsRes.json());
      if (driversRes.ok) setDrivers(await driversRes.json());
    } catch (e) {
      console.error("Error fetching dropdowns:", e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        page: page.toString(),
        size: rowsPerPage.toString(),
      });
      if (cabNumber) params.append("cabNumber", cabNumber);
      if (driverNumber) params.append("driverNumber", driverNumber);

      const response = await fetch(`${API_BASE_URL}/data-view/mileage-records?${params}`, {
        headers: { Authorization: `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"), },
      });

      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      setData(result.content || []);
      setTotalCount(result.totalElements || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data.length > 0 || totalCount > 0) fetchData();
  }, [page, rowsPerPage]);

  const handleSearch = () => {
    setPage(0);
    fetchData();
  };

  const handleEditSave = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/data-view/mileage-records/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ driverNumber: editDriverNumber || null }),
      });

      if (!response.ok) throw new Error("Failed to update");

      setSuccess("Record updated successfully");
      setEditingId(null);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Box>
      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <FilterIcon /> Filters
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Autocomplete
              options={cabs}
              getOptionLabel={(option) => option.cabNumber || ""}
              value={cabs.find((c) => c.cabNumber === cabNumber) || null}
              onChange={(e, v) => setCabNumber(v?.cabNumber || "")}
              renderInput={(params) => <TextField {...params} label="Cab #" size="small" />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Autocomplete
              options={[UNASSIGNED_DRIVER, ...drivers]}
              getOptionLabel={(option) => `${option.driverNumber} - ${option.firstName} ${option.lastName}`}
              value={[UNASSIGNED_DRIVER, ...drivers].find((d) => d.driverNumber === driverNumber) || null}
              onChange={(e, v) => setDriverNumber(v?.driverNumber || "")}
              renderInput={(params) => <TextField {...params} label="Driver" size="small" />}
            />
          </Grid>
          <Grid item xs={12} sm={12} md={4}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => { setCabNumber(""); setDriverNumber(""); }}
              sx={{ ml: 1 }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Data Table */}
      <Paper>
        <TableContainer>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Logon Date</TableCell>
                <TableCell>Cab #</TableCell>
                <TableCell>Driver #</TableCell>
                <TableCell>Logon Time</TableCell>
                <TableCell>Logoff Time</TableCell>
                <TableCell align="right">Mileage A</TableCell>
                <TableCell align="right">Mileage B</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    No data found. Use filters and click Search.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.logonTime ? row.logonTime.split('T')[0] : "-"}</TableCell>
                    <TableCell>
                      <Chip label={row.cabNumber || "-"} size="small" />
                    </TableCell>
                    <TableCell>
                      {editingId === row.id ? (
                        <Autocomplete
                          options={drivers}
                          getOptionLabel={(option) => option.driverNumber || ""}
                          value={drivers.find((d) => d.driverNumber === editDriverNumber) || null}
                          onChange={(e, v) => setEditDriverNumber(v?.driverNumber || "")}
                          renderInput={(params) => <TextField {...params} size="small" sx={{ minWidth: 120 }} />}
                          size="small"
                        />
                      ) : (
                        <Chip 
                          label={row.driverNumber || "N/A"} 
                          size="small" 
                          color={row.driverNumber ? "primary" : "default"}
                          variant={row.driverNumber ? "filled" : "outlined"}
                        />
                      )}
                    </TableCell>
                    <TableCell>{row.logonTime ? row.logonTime.split('T')[1]?.substring(0,5) : "-"}</TableCell>
                    <TableCell>{row.logoffTime ? row.logoffTime.split('T')[1]?.substring(0,5) : "-"}</TableCell>
                    <TableCell align="right">{row.mileageA?.toFixed(2) || "0.00"}</TableCell>
                    <TableCell align="right">{row.mileageB?.toFixed(2) || "0.00"}</TableCell>
                    <TableCell align="right">{row.totalMileage?.toFixed(2) || "0.00"}</TableCell>
                    <TableCell align="right">
                      {editingId === row.id ? (
                        <>
                          <IconButton size="small" color="success" onClick={() => handleEditSave(row.id)}>
                            <SaveIcon />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => setEditingId(null)}>
                            <CancelIcon />
                          </IconButton>
                        </>
                      ) : (
                        <IconButton 
                          size="small" 
                          onClick={() => { setEditingId(row.id); setEditDriverNumber(row.driverNumber || ""); }}
                        >
                          <EditIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Paper>
    </Box>
  );
}

// ==================== Airport Trips Data View ====================
function AirportTripsDataView({ currentUser }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [cabNumber, setCabNumber] = useState("");
  const [driverNumber, setDriverNumber] = useState("");
  const [shift, setShift] = useState("");
  
  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editDriverNumber, setEditDriverNumber] = useState("");
  const [editShift, setEditShift] = useState("");
  
  // Dropdowns
  const [cabs, setCabs] = useState([]);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const fetchDropdowns = async () => {
    try {
      const token = localStorage.getItem("token");
      const [cabsRes, driversRes] = await Promise.all([
        fetch(`${API_BASE_URL}/cabs`, { headers: { Authorization: `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"), } }),
        fetch(`${API_BASE_URL}/drivers`, { headers: { Authorization: `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"), } }),
      ]);
      if (cabsRes.ok) setCabs(await cabsRes.json());
      if (driversRes.ok) setDrivers(await driversRes.json());
    } catch (e) {
      console.error("Error fetching dropdowns:", e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        page: page.toString(),
        size: rowsPerPage.toString(),
      });
      if (cabNumber) params.append("cabNumber", cabNumber);
      if (driverNumber) params.append("driverNumber", driverNumber);
      if (shift) params.append("shift", shift);

      const response = await fetch(`${API_BASE_URL}/data-view/airport-trips?${params}`, {
        headers: { Authorization: `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"), },
      });

      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      setData(result.content || []);
      setTotalCount(result.totalElements || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data.length > 0 || totalCount > 0) fetchData();
  }, [page, rowsPerPage]);

  const handleSearch = () => {
    setPage(0);
    fetchData();
  };

  const handleEditSave = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/data-view/airport-trips/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          driverNumber: editDriverNumber || null,
          shift: editShift,
        }),
      });

      if (!response.ok) throw new Error("Failed to update");

      setSuccess("Record updated successfully");
      setEditingId(null);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Box>
      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <FilterIcon /> Filters
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Autocomplete
              options={cabs}
              getOptionLabel={(option) => option.cabNumber || ""}
              value={cabs.find((c) => c.cabNumber === cabNumber) || null}
              onChange={(e, v) => setCabNumber(v?.cabNumber || "")}
              renderInput={(params) => <TextField {...params} label="Cab #" size="small" />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Autocomplete
              options={[UNASSIGNED_DRIVER, ...drivers]}
              getOptionLabel={(option) => `${option.driverNumber} - ${option.firstName} ${option.lastName}`}
              value={[UNASSIGNED_DRIVER, ...drivers].find((d) => d.driverNumber === driverNumber) || null}
              onChange={(e, v) => setDriverNumber(v?.driverNumber || "")}
              renderInput={(params) => <TextField {...params} label="Driver" size="small" />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Shift</InputLabel>
              <Select
                value={shift}
                label="Shift"
                onChange={(e) => setShift(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="DAY">Day</MenuItem>
                <MenuItem value="NIGHT">Night</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => { setCabNumber(""); setDriverNumber(""); setShift(""); }}
              sx={{ ml: 1 }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Data Table */}
      <Paper>
        <TableContainer>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Trip Date</TableCell>
                <TableCell>Cab #</TableCell>
                <TableCell>Shift</TableCell>
                <TableCell>Driver #</TableCell>
                <TableCell align="center">Total Trips</TableCell>
                <TableCell>Hours with Trips</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    No data found. Use filters and click Search.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => {
                  // Build hours string from hour_00 to hour_23
                  const hoursWithTrips = [];
                  for (let h = 0; h <= 23; h++) {
                    const key = `hour${h.toString().padStart(2, '0')}`;
                    if (row[key] > 0) {
                      hoursWithTrips.push(`${h}:00(${row[key]})`);
                    }
                  }
                  
                  return (
                    <TableRow key={row.id}>
                      <TableCell>{row.tripDate}</TableCell>
                      <TableCell>
                        <Chip label={row.cabNumber || "-"} size="small" />
                      </TableCell>
                      <TableCell>
                        {editingId === row.id ? (
                          <FormControl size="small" sx={{ minWidth: 100 }}>
                            <Select
                              value={editShift}
                              onChange={(e) => setEditShift(e.target.value)}
                            >
                              <MenuItem value="DAY">Day</MenuItem>
                              <MenuItem value="NIGHT">Night</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          <Chip 
                            label={row.shift || "N/A"} 
                            size="small" 
                            color={row.shift === "DAY" ? "warning" : "primary"}
                            variant="filled"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === row.id ? (
                          <Autocomplete
                            options={drivers}
                            getOptionLabel={(option) => option.driverNumber || ""}
                            value={drivers.find((d) => d.driverNumber === editDriverNumber) || null}
                            onChange={(e, v) => setEditDriverNumber(v?.driverNumber || "")}
                            renderInput={(params) => <TextField {...params} size="small" sx={{ minWidth: 120 }} />}
                            size="small"
                          />
                        ) : (
                          <Chip 
                            label={row.driverNumber || "N/A"} 
                            size="small" 
                            color={row.driverNumber ? "secondary" : "default"}
                            variant={row.driverNumber ? "filled" : "outlined"}
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {row.grandTotal || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {hoursWithTrips.slice(0, 5).join(", ")}
                          {hoursWithTrips.length > 5 && "..."}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {editingId === row.id ? (
                          <>
                            <IconButton size="small" color="success" onClick={() => handleEditSave(row.id)}>
                              <SaveIcon />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => setEditingId(null)}>
                              <CancelIcon />
                            </IconButton>
                          </>
                        ) : (
                          <IconButton 
                            size="small" 
                            onClick={() => { 
                              setEditingId(row.id); 
                              setEditDriverNumber(row.driverNumber || ""); 
                              setEditShift(row.shift || "DAY");
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Paper>
    </Box>
  );
}

// ==================== Airport Trips (Driver) Data View ====================
function AirportTripsDriverDataView({ currentUser }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [cabNumber, setCabNumber] = useState("");
  const [driverNumber, setDriverNumber] = useState("");

  // Dropdowns
  const [cabs, setCabs] = useState([]);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const fetchDropdowns = async () => {
    try {
      const token = localStorage.getItem("token");
      const [cabsRes, driversRes] = await Promise.all([
        fetch(`${API_BASE_URL}/cabs`, { headers: { Authorization: `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema") } }),
        fetch(`${API_BASE_URL}/drivers`, { headers: { Authorization: `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema") } }),
      ]);
      if (cabsRes.ok) setCabs(await cabsRes.json());
      if (driversRes.ok) setDrivers(await driversRes.json());
    } catch (e) {
      console.error("Error fetching dropdowns:", e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        page: page.toString(),
        size: rowsPerPage.toString(),
      });
      if (cabNumber) params.append("cabNumber", cabNumber);
      if (driverNumber) params.append("driverNumber", driverNumber);

      const response = await fetch(`${API_BASE_URL}/data-view/airport-trip-drivers?${params}`, {
        headers: { Authorization: `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema") },
      });

      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      setData(result.content || []);
      setTotalCount(result.totalElements || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data.length > 0 || totalCount > 0) fetchData();
  }, [page, rowsPerPage]);

  const handleSearch = () => {
    setPage(0);
    fetchData();
  };

  const getMethodColor = (method) => {
    switch (method) {
      case "MIDPOINT": return "success";
      case "CLOSEST": return "warning";
      case "OWNER_FALLBACK": return "info";
      default: return "default";
    }
  };

  const getMethodLabel = (method) => {
    switch (method) {
      case "MIDPOINT": return "Midpoint";
      case "CLOSEST": return "Closest";
      case "OWNER_FALLBACK": return "Owner";
      default: return method || "-";
    }
  };

  const getDriverName = (driverNum) => {
    const driver = drivers.find((d) => d.driverNumber === driverNum);
    return driver ? `${driver.firstName} ${driver.lastName}` : "";
  };

  return (
    <Box>
      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <FilterIcon /> Filters
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Autocomplete
              options={cabs}
              getOptionLabel={(option) => option.cabNumber || ""}
              value={cabs.find((c) => c.cabNumber === cabNumber) || null}
              onChange={(e, v) => setCabNumber(v?.cabNumber || "")}
              renderInput={(params) => <TextField {...params} label="Cab #" size="small" />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Autocomplete
              options={drivers}
              getOptionLabel={(option) => `${option.driverNumber} - ${option.firstName} ${option.lastName}`}
              value={drivers.find((d) => d.driverNumber === driverNumber) || null}
              onChange={(e, v) => setDriverNumber(v?.driverNumber || "")}
              renderInput={(params) => <TextField {...params} label="Driver" size="small" />}
            />
          </Grid>
          <Grid item xs={12} sm={12} md={4}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => { setCabNumber(""); setDriverNumber(""); }}
              sx={{ ml: 1 }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Data Table */}
      <Paper>
        <TableContainer>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Trip Date</TableCell>
                <TableCell>Cab #</TableCell>
                <TableCell>Driver #</TableCell>
                <TableCell>Driver Name</TableCell>
                <TableCell align="center">Hour</TableCell>
                <TableCell align="center">Trip Count</TableCell>
                <TableCell align="center">Daily Total</TableCell>
                <TableCell align="center">Assignment</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    No data found. Use filters and click Search.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.tripDate}</TableCell>
                    <TableCell>
                      <Chip label={row.cabNumber || "-"} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.driverNumber || "N/A"}
                        size="small"
                        color="primary"
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {getDriverName(row.driverNumber)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${row.hour}:00 - ${row.hour}:59`}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {row.tripCount || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="text.secondary">
                        {row.totalDailyTrips || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={row.assignmentMethod || ""}>
                        <Chip
                          label={getMethodLabel(row.assignmentMethod)}
                          size="small"
                          color={getMethodColor(row.assignmentMethod)}
                          variant="filled"
                        />
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Paper>
    </Box>
  );
}
