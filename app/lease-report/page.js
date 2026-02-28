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

  // Report data
  const [reportData, setReportData] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signin");
      return;
    }
    setCurrentUser(getCurrentUser());
  }, [router]);

  // Filter data based on status
  const filteredData = useMemo(() => {
    if (!reportData || !reportData.rows) return [];

    if (statusFilter === "ALL") {
      return reportData.rows;
    }

    return reportData.rows.filter((row) => row.status === statusFilter);
  }, [reportData, statusFilter]);

  // Compute totals for filtered data
  const filteredTotals = useMemo(() => {
    const totalLease = filteredData.reduce(
      (sum, row) => sum + (row.leaseAmount || 0),
      0
    );
    return { totalLease, count: filteredData.length };
  }, [filteredData]);

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
    if (!filteredData || filteredData.length === 0) {
      setError("No data to export");
      return;
    }

    const headers = [
      "Cab #",
      "Shift Date",
      "Shift Type",
      "Driver #",
      "Driver Name",
      "Owner #",
      "Owner Name",
      "Lease Amount",
      "Status",
    ];

    const rows = filteredData.map((row) => [
      row.cabNumber,
      row.shiftDate,
      row.shiftType,
      row.driverNumber,
      row.driverName,
      row.ownerNumber || "-",
      row.ownerName || "-",
      row.leaseAmount ? row.leaseAmount.toFixed(2) : "0.00",
      row.status,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lease-reconciliation-${startDate}-to-${endDate}.csv`;
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
            Report Period
          </Typography>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={3}>
              <TextField
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status Filter"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="ALL">All Statuses</MenuItem>
                  <MenuItem value="MATCHED">Matched Only</MenuItem>
                  <MenuItem value="NO_OWNER">No Owner</MenuItem>
                  <MenuItem value="SELF_DRIVEN">Self Driven</MenuItem>
                  <MenuItem value="CAB_NOT_FOUND">Cab Not Found</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
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
                    Total Shifts
                  </Typography>
                  <Typography variant="h5">{reportData.totalShifts}</Typography>
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
                    No Owner
                  </Typography>
                  <Typography variant="h5">{reportData.noOwnerCount}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: "warning.light" }}>
                <CardContent>
                  <Typography color="textSecondary" variant="body2" gutterBottom>
                    Self Driven
                  </Typography>
                  <Typography variant="h5">{reportData.selfDrivenCount}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Data Table */}
        {isDataLoaded && reportData ? (
          <>
            <Paper sx={{ mb: 3, display: "flex", justifyContent: "flex-end", p: 2 }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<DownloadIcon />}
                onClick={exportToCSV}
                disabled={filteredData.length === 0}
              >
                Export CSV
              </Button>
            </Paper>

            <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.100" }}>
                    <TableCell sx={{ fontWeight: "bold" }}>Cab #</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Shift Date</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Shift Type</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Driver #</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Driver Name</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Owner #</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Owner Name</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      Lease Amount
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{row.cabNumber}</TableCell>
                      <TableCell>{row.shiftDate}</TableCell>
                      <TableCell>{row.shiftType}</TableCell>
                      <TableCell>{row.driverNumber}</TableCell>
                      <TableCell>{row.driverName}</TableCell>
                      <TableCell>{row.ownerNumber || "-"}</TableCell>
                      <TableCell>{row.ownerName || "-"}</TableCell>
                      <TableCell align="right">
                        ${row.leaseAmount ? row.leaseAmount.toFixed(2) : "0.00"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.status}
                          color={getStatusColor(row.status)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredData.length > 0 && (
                    <TableRow sx={{ bgcolor: "success.light", fontWeight: "bold" }}>
                      <TableCell colSpan={7}>
                        <Typography fontWeight="bold">TOTAL</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold">
                          ${filteredTotals.totalLease.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {filteredData.length === 0 && (
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <Typography color="textSecondary">
                  No shifts found for the selected status filter.
                </Typography>
              </Paper>
            )}
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
