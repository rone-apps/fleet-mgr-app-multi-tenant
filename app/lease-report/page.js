"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Card,
  CardContent,
  Grid,
  TextField,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Description as DescriptionIcon,
} from "@mui/icons-material";
import GlobalNav from "../components/GlobalNav";
import { getCurrentUser, API_BASE_URL } from "../lib/api";
import { useRouter } from "next/navigation";

export default function LeaseReportPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  // Date range state
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 27))
      .toISOString()
      .split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  // Status filter
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Additional filters
  const [cabFilter, setCabFilter] = useState("ALL");
  const [shiftFilter, setShiftFilter] = useState("ALL");
  const [ownerFilter, setOwnerFilter] = useState("ALL");

  // Report data
  const [reportData, setReportData] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Modal state for detail view
  const [selectedCab, setSelectedCab] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signin");
      return;
    }
    setCurrentUser(getCurrentUser());
  }, [router]);

  // Filter data based on status, cab, shift, and owner
  const filteredData = useMemo(() => {
    if (!reportData || !reportData.rows) return [];

    return reportData.rows.filter((row) => {
      // Status filter
      if (statusFilter !== "ALL" && row.status !== statusFilter) {
        return false;
      }

      // Cab filter
      if (cabFilter !== "ALL" && row.cabNumber !== cabFilter) {
        return false;
      }

      // Shift filter
      if (shiftFilter !== "ALL" && row.shiftType !== shiftFilter) {
        return false;
      }

      // Owner filter
      if (ownerFilter !== "ALL" && row.ownerName !== ownerFilter) {
        return false;
      }

      return true;
    });
  }, [reportData, statusFilter, cabFilter, shiftFilter, ownerFilter]);

  // Extract unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    if (!reportData || !reportData.rows) {
      return { cabs: [], shifts: [], owners: [] };
    }

    const cabs = new Set();
    const shifts = new Set();
    const owners = new Set();

    reportData.rows.forEach((row) => {
      cabs.add(row.cabNumber);
      shifts.add(row.shiftType);
      if (row.ownerName) {
        owners.add(row.ownerName);
      }
    });

    return {
      cabs: Array.from(cabs).sort(),
      shifts: Array.from(shifts).sort(),
      owners: Array.from(owners).sort(),
    };
  }, [reportData]);

  // Group data by cab and status to create summary
  const summaryData = useMemo(() => {
    const grouped = {};

    filteredData.forEach((row) => {
      const key = `${row.cabNumber}|${row.status}`;
      if (!grouped[key]) {
        grouped[key] = {
          cabNumber: row.cabNumber,
          status: row.status,
          count: 0,
          totalLease: 0,
          shifts: [],
          ownerNames: new Set(),
          shiftTypes: new Set(),
        };
      }
      grouped[key].count += 1;
      grouped[key].totalLease += row.leaseAmount || 0;
      grouped[key].shifts.push(row);
      if (row.ownerName) {
        grouped[key].ownerNames.add(row.ownerName);
      }
      grouped[key].shiftTypes.add(row.shiftType);
    });

    // Convert Sets to comma-separated strings
    const result = Object.values(grouped).map((item) => ({
      ...item,
      ownerNamesStr:
        item.ownerNames.size === 0
          ? "-"
          : Array.from(item.ownerNames).join(", "),
      shiftTypesStr: Array.from(item.shiftTypes).join(", "),
    }));

    return result.sort((a, b) => {
      if (a.cabNumber !== b.cabNumber) {
        return a.cabNumber.localeCompare(b.cabNumber);
      }
      return a.status.localeCompare(b.status);
    });
  }, [filteredData]);

  // Compute totals for filtered data
  const filteredTotals = useMemo(() => {
    const totalLease = summaryData.reduce((sum, row) => sum + row.totalLease, 0);
    return { totalLease, count: summaryData.length };
  }, [summaryData]);

  // Prepare modal data - group shifts by driver
  const modalData = useMemo(() => {
    const selectedData = summaryData.find(
      (s) => s.cabNumber === selectedCab && s.status === selectedStatus
    );
    if (!selectedData) return null;

    // Group by driver and sort
    const groupedByDriver = {};
    selectedData.shifts.forEach((shift) => {
      const key = shift.driverNumber;
      if (!groupedByDriver[key]) {
        groupedByDriver[key] = {
          driverNumber: shift.driverNumber,
          driverName: shift.driverName,
          shifts: [],
          totalLease: 0,
        };
      }
      groupedByDriver[key].shifts.push(shift);
      groupedByDriver[key].totalLease += shift.leaseAmount || 0;
    });

    const drivers = Object.values(groupedByDriver).sort((a, b) =>
      a.driverNumber.localeCompare(b.driverNumber)
    );

    return drivers;
  }, [selectedCab, selectedStatus, summaryData]);

  const generateReport = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/reports/lease-reconciliation?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setReportData(data);
      setIsDataLoaded(true);
      setStatusFilter("ALL");
      setSuccess(`Report generated successfully. Found ${data.totalShifts} shifts.`);
    } catch (err) {
      console.error("Error generating report:", err);
      setError(`Failed to generate report: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!summaryData || summaryData.length === 0) {
      setError("No data to export");
      return;
    }

    const headers = ["Cab #", "Status", "Shift Count", "Total Lease Amount"];

    const rows = summaryData.map((summary) => [
      summary.cabNumber,
      summary.status,
      summary.count,
      summary.totalLease ? summary.totalLease.toFixed(2) : "0.00",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lease-reconciliation-summary-${startDate}-to-${endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "MATCHED":
        return "success";
      case "NO_OWNER":
        return "error";
      case "SELF_DRIVEN":
        return "warning";
      case "CAB_NOT_FOUND":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      <GlobalNav currentUser={currentUser} title="Lease Reconciliation Report" />

      <Box sx={{ container: true, maxWidth: 1400, mx: "auto", mt: 4, mb: 4, px: 2 }}>
        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold">
            Lease Reconciliation Report
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Shift-by-shift breakdown of driver lease expenses vs. owner lease revenues
          </Typography>
        </Box>

        {/* Error/Success Alerts */}
        {error && (
          <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={() => setSuccess("")} sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Filter Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>

          {/* Date Range Row */}
          <Grid container spacing={2} alignItems="flex-end" sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6} />
          </Grid>

          {/* Status, Cab, Shift, Owner Filters Row */}
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={6} md={2}>
              <Autocomplete
                options={["All Statuses", "Matched", "No Owner", "Self Driven", "Cab Not Found"]}
                value={
                  statusFilter === "ALL"
                    ? "All Statuses"
                    : statusFilter === "MATCHED"
                    ? "Matched"
                    : statusFilter === "NO_OWNER"
                    ? "No Owner"
                    : statusFilter === "SELF_DRIVEN"
                    ? "Self Driven"
                    : "Cab Not Found"
                }
                onChange={(e, value) => {
                  const statusMap = {
                    "All Statuses": "ALL",
                    "Matched": "MATCHED",
                    "No Owner": "NO_OWNER",
                    "Self Driven": "SELF_DRIVEN",
                    "Cab Not Found": "CAB_NOT_FOUND",
                  };
                  setStatusFilter(statusMap[value] || "ALL");
                }}
                renderInput={(params) => <TextField {...params} label="Status" />}
                freeSolo
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Autocomplete
                options={["All Cabs", ...filterOptions.cabs]}
                value={cabFilter === "ALL" ? "All Cabs" : cabFilter}
                onChange={(e, value) => {
                  setCabFilter(value === "All Cabs" ? "ALL" : value || "ALL");
                }}
                renderInput={(params) => <TextField {...params} label="Cab #" />}
                freeSolo
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Autocomplete
                options={["All Shifts", ...filterOptions.shifts]}
                value={shiftFilter === "ALL" ? "All Shifts" : shiftFilter}
                onChange={(e, value) => {
                  setShiftFilter(value === "All Shifts" ? "ALL" : value || "ALL");
                }}
                renderInput={(params) => <TextField {...params} label="Shift" />}
                freeSolo
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                options={["All Owners", ...filterOptions.owners]}
                value={ownerFilter === "ALL" ? "All Owners" : ownerFilter}
                onChange={(e, value) => {
                  setOwnerFilter(value === "All Owners" ? "ALL" : value || "ALL");
                }}
                renderInput={(params) => <TextField {...params} label="Owner" />}
                freeSolo
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                fullWidth
                onClick={generateReport}
                disabled={loading}
                startIcon={<RefreshIcon />}
                sx={{ height: "56px" }}
              >
                {loading ? "Generating..." : "Generate Report"}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Summary Cards */}
        {reportData && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" variant="body2" gutterBottom>
                    Filtered Shifts
                  </Typography>
                  <Typography variant="h5">{filteredData.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" variant="body2" gutterBottom>
                    Total Lease (Filtered)
                  </Typography>
                  <Typography variant="h5">
                    ${filteredTotals.totalLease.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: "error.light" }}>
                <CardContent>
                  <Typography color="textSecondary" variant="body2" gutterBottom>
                    No Owner (Filtered)
                  </Typography>
                  <Typography variant="h5">
                    {filteredData.filter((r) => r.status === "NO_OWNER").length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: "warning.light" }}>
                <CardContent>
                  <Typography color="textSecondary" variant="body2" gutterBottom>
                    Self Driven (Filtered)
                  </Typography>
                  <Typography variant="h5">
                    {filteredData.filter((r) => r.status === "SELF_DRIVEN").length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Summary Table */}
        {isDataLoaded && reportData ? (
          <>
            <Paper sx={{ mb: 3, display: "flex", justifyContent: "flex-end", p: 2 }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<DownloadIcon />}
                onClick={exportToCSV}
                disabled={summaryData.length === 0}
              >
                Export CSV
              </Button>
            </Paper>

            <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.100" }}>
                    <TableCell sx={{ fontWeight: "bold" }}>Cab #</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Shift Type</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Owner Name</TableCell>
                    <TableCell align="center" sx={{ fontWeight: "bold" }}>
                      Count
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      Total Lease
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summaryData.map((summary, idx) => (
                    <TableRow
                      key={idx}
                      hover
                      onClick={() => {
                        setSelectedCab(summary.cabNumber);
                        setSelectedStatus(summary.status);
                      }}
                      sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                    >
                      <TableCell sx={{ fontWeight: "bold" }}>
                        {summary.cabNumber}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={summary.status}
                          color={getStatusColor(summary.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{summary.shiftTypesStr}</TableCell>
                      <TableCell>{summary.ownerNamesStr}</TableCell>
                      <TableCell align="center">{summary.count}</TableCell>
                      <TableCell align="right">
                        ${summary.totalLease.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {summaryData.length > 0 && (
                    <TableRow sx={{ bgcolor: "success.light", fontWeight: "bold" }}>
                      <TableCell colSpan={4}>
                        <Typography fontWeight="bold">TOTAL</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography fontWeight="bold">
                          {summaryData.reduce((sum, s) => sum + s.count, 0)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold">
                          ${filteredTotals.totalLease.toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {summaryData.length === 0 && (
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <Typography color="textSecondary">
                  No data found for the selected status filter.
                </Typography>
              </Paper>
            )}

            {/* Detail Modal */}
            <Dialog
              open={selectedCab !== null}
              onClose={() => {
                setSelectedCab(null);
                setSelectedStatus(null);
              }}
              maxWidth="lg"
              fullWidth
            >
              <DialogTitle>
                Shift Details - Cab {selectedCab} ({selectedStatus})
              </DialogTitle>
              <DialogContent sx={{ mt: 2 }}>
                {selectedCab !== null && selectedStatus !== null && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: "grey.100" }}>
                          <TableCell sx={{ fontWeight: "bold" }}>Driver #</TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>Driver Name</TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>Shift Date</TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>Shift Type</TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>Owner #</TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>Owner Name</TableCell>
                          <TableCell align="right" sx={{ fontWeight: "bold" }}>
                            Lease Amount
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {modalData &&
                          modalData.map((driver, dIdx) => (
                            <>
                              {driver.shifts.map((shift, sIdx) => (
                                <TableRow
                                  key={`${dIdx}-${sIdx}`}
                                  sx={{
                                    borderTop: sIdx === 0 ? "2px solid #bdbdbd" : "none",
                                  }}
                                >
                                  {sIdx === 0 && (
                                    <TableCell
                                      rowSpan={driver.shifts.length + 1}
                                      sx={{
                                        fontWeight: "bold",
                                        bgcolor: "#e3f2fd",
                                        borderRight: "2px solid #bdbdbd",
                                      }}
                                    >
                                      {driver.driverNumber}
                                    </TableCell>
                                  )}
                                  {sIdx === 0 && (
                                    <TableCell
                                      rowSpan={driver.shifts.length + 1}
                                      sx={{
                                        fontWeight: "bold",
                                        bgcolor: "#e3f2fd",
                                        borderRight: "2px solid #bdbdbd",
                                      }}
                                    >
                                      {driver.driverName}
                                    </TableCell>
                                  )}
                                  <TableCell>{shift.shiftDate}</TableCell>
                                  <TableCell>{shift.shiftType}</TableCell>
                                  <TableCell>{shift.ownerNumber || "-"}</TableCell>
                                  <TableCell>{shift.ownerName || "-"}</TableCell>
                                  <TableCell align="right">
                                    ${shift.leaseAmount ? shift.leaseAmount.toFixed(2) : "0.00"}
                                  </TableCell>
                                </TableRow>
                              ))}
                              {/* Subtotal row for driver */}
                              <TableRow
                                key={`${dIdx}-subtotal`}
                                sx={{
                                  bgcolor: "#fff3e0",
                                  fontWeight: "bold",
                                  borderBottom: "2px solid #bdbdbd",
                                }}
                              >
                                <TableCell colSpan={5} align="right" sx={{ fontWeight: "bold" }}>
                                  {driver.driverName} ({driver.shifts.length} shift
                                  {driver.shifts.length > 1 ? "s" : ""})
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                  ${driver.totalLease.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            </>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => {
                    setSelectedCab(null);
                    setSelectedStatus(null);
                  }}
                >
                  Close
                </Button>
              </DialogActions>
            </Dialog>
          </>
        ) : loading ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Generating report...</Typography>
          </Paper>
        ) : (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <DescriptionIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Select date range and click Generate Report
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
