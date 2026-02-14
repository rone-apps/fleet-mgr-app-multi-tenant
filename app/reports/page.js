"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GlobalNav from "../components/GlobalNav";
import {
  Box, Container, Typography, Button, Paper, Grid, TextField,
  Tabs, Tab, Card, CardContent, CircularProgress, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, Autocomplete,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControl, InputLabel, Select, MenuItem,
} from "@mui/material";
import {
  Assessment, TrendingUp, Download, Print, Close,
} from "@mui/icons-material";
import { API_BASE_URL, getCurrentUser } from "../lib/api";

export default function ReportsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState("");
  const [reportData, setReportData] = useState(null);

  // New state for banner/statement functionality
  const [paidAmount, setPaidAmount] = useState("0");
  const [activeBanner, setActiveBanner] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [savedStatements, setSavedStatements] = useState([]);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [loadingSavedStatements, setLoadingSavedStatements] = useState(false);

  // Revenue and Expense Tabs
  const [revenueTabIndex, setRevenueTabIndex] = useState(0);
  const [expenseTabIndex, setExpenseTabIndex] = useState(0);

  // Filters for revenue details
  const [revenueFilters, setRevenueFilters] = useState({
    creditCardDateFrom: "",
    creditCardDateTo: "",
    creditCardAmountMin: "",
    creditCardAmountMax: "",
    chargesDateFrom: "",
    chargesDateTo: "",
    chargesAmountMin: "",
    chargesAmountMax: "",
    chargesAccountName: "",
    leaseRevenueDriverName: "",
    leaseRevenueDateFrom: "",
    leaseRevenueDateTo: "",
    leaseRevenueAmountMin: "",
    leaseRevenueAmountMax: "",
    othersDateFrom: "",
    othersDateTo: "",
    othersAmountMin: "",
    othersAmountMax: "",
  });

  // Filters for expense details
  const [expenseFilters, setExpenseFilters] = useState({
    recurringCategoryFilter: "",
    oneTimeDateFrom: "",
    oneTimeDateTo: "",
    oneTimeAmountMin: "",
    oneTimeAmountMax: "",
  });

  useEffect(() => {
    const initializeUser = async () => {
      const user = getCurrentUser();
      if (!user) {
        router.push("/signin");
        return;
      }
      setCurrentUser(user);

      // Set default date range to current month
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];
      setStartDate(monthStart);
      setEndDate(monthEnd);

      // Load drivers
      await fetchDrivers();

      // If user is a driver, auto-select them and generate report
      if (user.role === "DRIVER" && user.driverId) {
        try {
          const response = await fetch(`${API_BASE_URL}/drivers/${user.driverId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            },
          });
          if (response.ok) {
            const driver = await response.json();
            setSelectedDriverId(driver.id);
            setSelectedDriver(driver);
          }
        } catch (err) {
          console.error("Error fetching driver:", err);
        }
      }

      setLoading(false);
    };

    initializeUser();
  }, [router]);

  // Auto-generate report for drivers on load
  useEffect(() => {
    const autoGenerateForDriver = async () => {
      if (currentUser?.role === "DRIVER" && selectedDriverId && startDate && endDate && !reportData) {
        const url = `${API_BASE_URL}/financial-statements/owner-report/${selectedDriverId}?from=${startDate}&to=${endDate}`;
        console.log("Auto-generating report for driver:", {
          driverId: selectedDriverId,
          startDate,
          endDate,
          url,
          token: !!localStorage.getItem("token"),
          tenantId: localStorage.getItem("tenantSchema")
        });
        setLoadingReport(true);
        setError("");
        try {
          const response = await fetch(url, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "X-Tenant-ID": localStorage.getItem("tenantSchema"),
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            setReportData(data);
            setPaidAmount(data.paidAmount ? data.paidAmount.toString() : "0");
            console.log("Report auto-generated successfully:", data);
          } else {
            const errorText = await response.text();
            console.error(`Failed to auto-generate report. Status: ${response.status}`, errorText);
            setError(`Error ${response.status}: ${errorText || "Failed to generate report"}`);
          }
        } catch (err) {
          console.error("Error auto-generating report:", err);
          setError(`Error: ${err.message}`);
        } finally {
          setLoadingReport(false);
        }
      }
    };

    autoGenerateForDriver();
  }, [selectedDriverId, startDate, endDate, currentUser?.role]);

  const fetchDrivers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/drivers`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });
      if (response.ok) {
        const data = await response.json();
        const sorted = data.sort((a, b) => {
          const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
          const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setDrivers(sorted);
      }
    } catch (err) {
      console.error("Error fetching drivers:", err);
      setError("Failed to fetch drivers");
    }
  };

  const handleSelectDriver = (driverId) => {
    setSelectedDriverId(driverId);
    const driver = drivers.find((d) => d.id == driverId);
    setSelectedDriver(driver);
    setReportData(null); // Clear previous report
    setPaidAmount("0");
    setActiveBanner(null);
  };

  const generateReport = async () => {
    if (!selectedDriverId || !startDate || !endDate) {
      setError("Please select a driver and date range");
      return;
    }

    setLoadingReport(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/financial-statements/owner-report/${selectedDriverId}?from=${startDate}&to=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReportData(data);
        setPaidAmount(data.paidAmount ? data.paidAmount.toString() : "0");
        console.log("Report generated:", data);
      } else {
        const errorText = await response.text();
        setError(errorText || "Failed to generate report");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error generating report:", err);
    } finally {
      setLoadingReport(false);
    }
  };

  const finalizeStatement = async () => {
    if (!reportData) {
      setError("No report data to finalize");
      return;
    }

    try {
      const reportWithPaidAmount = {
        ...reportData,
        paidAmount: parseFloat(paidAmount),
      };

      const response = await fetch(
        `${API_BASE_URL}/financial-statements/owner-report/${selectedDriverId}/finalize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
          body: JSON.stringify(reportWithPaidAmount),
        }
      );

      if (response.ok) {
        const statement = await response.json();
        setError("");
        alert(`Statement finalized successfully! Statement ID: ${statement.id}`);
        setReportData(null); // Clear report
        await fetchSavedStatements(selectedDriverId); // Refresh saved statements
      } else {
        const errorText = await response.text();
        setError(errorText || "Failed to finalize statement");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error finalizing statement:", err);
    }
  };

  const fetchSavedStatements = async (personId) => {
    if (!personId) return;
    setLoadingSavedStatements(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/financial-statements/statements/${personId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSavedStatements(data);
      }
    } catch (err) {
      console.error("Error fetching saved statements:", err);
    } finally {
      setLoadingSavedStatements(false);
    }
  };

  const handleEmailClick = () => {
    setEmailDialogOpen(true);
  };

  const handleSendEmail = () => {
    if (!emailAddress) {
      setError("Please enter an email address");
      return;
    }
    const subject = `Financial Statement ${reportData?.periodFrom} to ${reportData?.periodTo}`;
    const body = generateEmailBody();
    window.location.href = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setEmailDialogOpen(false);
    setEmailAddress("");
  };

  const generateEmailBody = () => {
    if (!reportData) return "";
    return `
Financial Statement
${reportData.ownerName}
Period: ${reportData.periodFrom} to ${reportData.periodTo}

Revenues: $${parseFloat(reportData.totalRevenues || 0).toFixed(2)}
Recurring Expenses: $${parseFloat(reportData.totalRecurringExpenses || 0).toFixed(2)}
One-Time Expenses: $${parseFloat(reportData.totalOneTimeExpenses || 0).toFixed(2)}
Total Expenses: $${parseFloat(reportData.totalExpenses || 0).toFixed(2)}
Previous Balance: $${parseFloat(reportData.previousBalance || 0).toFixed(2)}
Paid Amount: $${parseFloat(paidAmount || 0).toFixed(2)}
Net Due: $${parseFloat(-reportData.netDue || 0).toFixed(2)}
    `.trim();
  };

  // Helper functions to filter revenue data by type
  const getRevenuesByType = (type) => {
    if (!reportData?.revenues) return [];
    return reportData.revenues.filter((rev) => rev.revenueSubType === type);
  };

  // Filter credit card revenues
  const getFilteredCreditCards = () => {
    let filtered = getRevenuesByType("CARD_REVENUE");
    const f = revenueFilters;
    if (f.creditCardDateFrom) {
      filtered = filtered.filter((r) => r.revenueDate >= f.creditCardDateFrom);
    }
    if (f.creditCardDateTo) {
      filtered = filtered.filter((r) => r.revenueDate <= f.creditCardDateTo);
    }
    if (f.creditCardAmountMin) {
      filtered = filtered.filter((r) => parseFloat(r.amount) >= parseFloat(f.creditCardAmountMin));
    }
    if (f.creditCardAmountMax) {
      filtered = filtered.filter((r) => parseFloat(r.amount) <= parseFloat(f.creditCardAmountMax));
    }
    return filtered;
  };

  // Filter charge revenues
  const getFilteredCharges = () => {
    let filtered = getRevenuesByType("ACCOUNT_REVENUE");
    const f = revenueFilters;
    if (f.chargesDateFrom) {
      filtered = filtered.filter((r) => r.revenueDate >= f.chargesDateFrom);
    }
    if (f.chargesDateTo) {
      filtered = filtered.filter((r) => r.revenueDate <= f.chargesDateTo);
    }
    if (f.chargesAmountMin) {
      filtered = filtered.filter((r) => parseFloat(r.amount) >= parseFloat(f.chargesAmountMin));
    }
    if (f.chargesAmountMax) {
      filtered = filtered.filter((r) => parseFloat(r.amount) <= parseFloat(f.chargesAmountMax));
    }
    if (f.chargesAccountName) {
      filtered = filtered.filter((r) =>
        (r.categoryName || "").toLowerCase().includes(f.chargesAccountName.toLowerCase())
      );
    }
    return filtered;
  };

  // Filter lease revenue
  const getFilteredLeaseRevenue = () => {
    let filtered = getRevenuesByType("LEASE_INCOME");
    const f = revenueFilters;
    if (f.leaseRevenueDateFrom) {
      filtered = filtered.filter((r) => r.revenueDate >= f.leaseRevenueDateFrom);
    }
    if (f.leaseRevenueDateTo) {
      filtered = filtered.filter((r) => r.revenueDate <= f.leaseRevenueDateTo);
    }
    if (f.leaseRevenueAmountMin) {
      filtered = filtered.filter((r) => parseFloat(r.amount) >= parseFloat(f.leaseRevenueAmountMin));
    }
    if (f.leaseRevenueAmountMax) {
      filtered = filtered.filter((r) => parseFloat(r.amount) <= parseFloat(f.leaseRevenueAmountMax));
    }
    if (f.leaseRevenueDriverName) {
      filtered = filtered.filter((r) =>
        (r.description || "").toLowerCase().includes(f.leaseRevenueDriverName.toLowerCase())
      );
    }
    return filtered;
  };

  // Filter other revenues
  const getFilteredOtherRevenues = () => {
    let filtered = reportData?.revenues?.filter(
      (r) => !["CARD_REVENUE", "ACCOUNT_REVENUE", "LEASE_INCOME"].includes(r.revenueSubType)
    ) || [];
    const f = revenueFilters;
    if (f.othersDateFrom) {
      filtered = filtered.filter((r) => r.revenueDate >= f.othersDateFrom);
    }
    if (f.othersDateTo) {
      filtered = filtered.filter((r) => r.revenueDate <= f.othersDateTo);
    }
    if (f.othersAmountMin) {
      filtered = filtered.filter((r) => parseFloat(r.amount) >= parseFloat(f.othersAmountMin));
    }
    if (f.othersAmountMax) {
      filtered = filtered.filter((r) => parseFloat(r.amount) <= parseFloat(f.othersAmountMax));
    }
    return filtered;
  };

  if (loading) {
    return (
      <Box>
        <GlobalNav currentUser={currentUser} title="Reports" />
        <Box sx={{ p: 3, textAlign: "center" }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <GlobalNav currentUser={currentUser} title="Reports" />
      <Container maxWidth="xl" sx={{ mt: 2, mb: 2, px: { xs: 1, sm: 2, md: 3 } }}>
        <Box sx={{ mb: { xs: 2, md: 4 } }}>
          <Typography variant={{ xs: 'h5', md: 'h4' }} fontWeight="bold" gutterBottom>
            Financial Reports
          </Typography>
          <Typography variant={{ xs: 'caption', md: 'body2' }} color="textSecondary">
            Generate and manage financial statements for drivers and owners
          </Typography>
        </Box>

        {/* Debug Info */}
        {process.env.NODE_ENV === "development" && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="caption">
              DEBUG: Role={currentUser?.role}, SelectedDriver={selectedDriver?.firstName}, Loading={loadingReport}, HasReport={!!reportData}
            </Typography>
          </Alert>
        )}

        {error && (
          <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Tabs for Generate vs History */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => {
              setActiveTab(newValue);
              if (newValue === 1 && selectedDriverId) {
                fetchSavedStatements(selectedDriverId);
              }
            }}
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab icon={<Assessment />} iconPosition="start" label="Generate Draft" />
            <Tab icon={<Download />} iconPosition="start" label="History" />
          </Tabs>
        </Paper>

        {/* Tab 0: Generate Draft */}
        {activeTab === 0 && (
          <>
            {/* Selection and Date Range */}
            <Paper sx={{ p: { xs: 1.5, md: 3 }, mb: 3, backgroundColor: "#f5f5f5" }}>
              <Grid container spacing={{ xs: 1, md: 2 }} alignItems="flex-end">
                <Grid item xs={12} md={4}>
                  {currentUser?.role === "DRIVER" ? (
                    <TextField
                      fullWidth
                      disabled
                      label="Your Reports"
                      value={selectedDriver ? `${selectedDriver.firstName} ${selectedDriver.lastName} (${selectedDriver.driverNumber})` : "Loading your information..."}
                      variant="outlined"
                    />
                  ) : (
                    <Autocomplete
                      fullWidth
                      disabled={currentUser?.role === "DRIVER"}
                      options={drivers}
                      getOptionLabel={(option) => {
                        if (!option || typeof option === 'string') return '';
                        return `${option.firstName} ${option.lastName} (${option.driverNumber})${option.isOwner ? ' - Owner' : ''}`;
                      }}
                      isOptionEqualToValue={(option, value) => option?.id === value?.id}
                      value={selectedDriver || null}
                      onChange={(event, newValue) => {
                        if (newValue) {
                          handleSelectDriver(newValue.id);
                        } else {
                          setSelectedDriverId("");
                          setSelectedDriver(null);
                          setReportData(null);
                          setPaidAmount("0");
                          setActiveBanner(null);
                        }
                      }}
                      filterOptions={(options, state) => {
                        const inputValue = state.inputValue.toLowerCase();
                        return options.filter((option) => {
                          const fullName = `${option.firstName} ${option.lastName}`.toLowerCase();
                          const firstName = option.firstName.toLowerCase();
                          const lastName = option.lastName.toLowerCase();
                          const driverNumber = option.driverNumber.toLowerCase();
                          return (
                            firstName.includes(inputValue) ||
                            lastName.includes(inputValue) ||
                            fullName.includes(inputValue) ||
                            driverNumber.includes(inputValue)
                          );
                        });
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Search Driver or Owner"
                          placeholder="Type name or ID..."
                        />
                      )}
                    />
                  )}
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    label="From"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    label="To"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={12} md={4}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={generateReport}
                    disabled={loadingReport || !selectedDriverId}
                    sx={{ height: "56px" }}
                  >
                    {loadingReport ? (
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                    ) : (
                      <Assessment sx={{ mr: 1 }} />
                    )}
                    Generate Report
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Selected Driver Info */}
            {selectedDriver && (
              <Paper sx={{ p: 2, mb: 3, backgroundColor: "#e3f2fd", border: "1px solid #90caf9" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {selectedDriver.firstName} {selectedDriver.lastName}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedDriver.isOwner ? "Owner" : "Driver"} • Driver #: {selectedDriver.driverNumber}
                </Typography>
              </Paper>
            )}

            {/* Loading Report Indicator */}
            {selectedDriverId && loadingReport && !reportData && (
              <Paper sx={{ p: 3, textAlign: "center", mb: 3, backgroundColor: "#f5f5f5" }}>
                <CircularProgress sx={{ mr: 2 }} />
                <Typography variant="body2" display="inline">
                  Generating report...
                </Typography>
              </Paper>
            )}

            {/* Draft Report with Banner Row */}
            {reportData && (
              <>
                {/* Banner Row - 5 Clickable Cards */}
                <Paper sx={{ p: { xs: 1.5, md: 3 }, mb: 3 }}>
                  <Grid container spacing={{ xs: 1, md: 2 }}>
                    {/* Revenues Banner */}
                    <Grid item xs={6} sm={6} md={2.4}>
                      <Card
                        onClick={() => setActiveBanner(activeBanner === "revenues" ? null : "revenues")}
                        sx={{
                          backgroundColor: "#e8f5e9",
                          cursor: "pointer",
                          border: activeBanner === "revenues" ? "3px solid #388e3c" : "1px solid #c8e6c9",
                          transition: "all 0.3s",
                          "&:hover": { boxShadow: 3 },
                        }}
                      >
                        <CardContent>
                          <Typography color="textSecondary" variant="body2" gutterBottom>
                            Revenues
                          </Typography>
                          <Typography variant="h6" sx={{ color: "#388e3c", fontWeight: "bold" }}>
                            ${parseFloat(reportData.totalRevenues || 0).toFixed(2)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Expenses Banner */}
                    <Grid item xs={6} sm={6} md={2.4}>
                      <Card
                        onClick={() => setActiveBanner(activeBanner === "expenses" ? null : "expenses")}
                        sx={{
                          backgroundColor: "#ffebee",
                          cursor: "pointer",
                          border: activeBanner === "expenses" ? "3px solid #d32f2f" : "1px solid #ffcdd2",
                          transition: "all 0.3s",
                          "&:hover": { boxShadow: 3 },
                        }}
                      >
                        <CardContent>
                          <Typography color="textSecondary" variant="body2" gutterBottom>
                            Expenses
                          </Typography>
                          <Typography variant="h6" sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                            ${parseFloat(reportData.totalExpenses || 0).toFixed(2)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Previous Owed Banner */}
                    <Grid item xs={6} sm={6} md={2.4}>
                      <Card
                        onClick={() => setActiveBanner(activeBanner === "prevOwed" ? null : "prevOwed")}
                        sx={{
                          backgroundColor: "#fff3e0",
                          cursor: "pointer",
                          border: activeBanner === "prevOwed" ? "3px solid #e65100" : "1px solid #ffe0b2",
                          transition: "all 0.3s",
                          "&:hover": { boxShadow: 3 },
                        }}
                      >
                        <CardContent>
                          <Typography color="textSecondary" variant="body2" gutterBottom>
                            Prev Owed
                          </Typography>
                          <Typography variant="h6" sx={{ color: "#e65100", fontWeight: "bold" }}>
                            ${parseFloat(reportData.previousBalance || 0).toFixed(2)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Paid Banner */}
                    <Grid item xs={6} sm={6} md={2.4}>
                      <Card
                        onClick={() => setActiveBanner(activeBanner === "paid" ? null : "paid")}
                        sx={{
                          backgroundColor: "#e3f2fd",
                          cursor: "pointer",
                          border: activeBanner === "paid" ? "3px solid #1976d2" : "1px solid #bbdefb",
                          transition: "all 0.3s",
                          "&:hover": { boxShadow: 3 },
                        }}
                      >
                        <CardContent>
                          <Typography color="textSecondary" variant="body2" gutterBottom>
                            Paid
                          </Typography>
                          <Typography variant="h6" sx={{ color: "#1976d2", fontWeight: "bold" }}>
                            ${parseFloat(paidAmount || 0).toFixed(2)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Net Due Banner (Bold/Highlighted) */}
                    <Grid item xs={6} sm={6} md={2.4}>
                      <Card
                        onClick={() => setActiveBanner(activeBanner === "netDue" ? null : "netDue")}
                        sx={{
                          backgroundColor: reportData.netDue > 0 ? "#ffebee" : "#e8f5e9", // ❌ Red if driver owes, ✅ Green if company owes
                          border: `3px solid ${reportData.netDue > 0 ? "#d32f2f" : "#388e3c"}`,
                          cursor: "pointer",
                          transition: "all 0.3s",
                          "&:hover": { boxShadow: 4 },
                        }}
                      >
                        <CardContent>
                          <Typography color="textSecondary" variant="body2" gutterBottom>
                            <strong>Net Due</strong>
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              color: reportData.netDue > 0 ? "#d32f2f" : "#388e3c", // ❌ Red if driver owes, ✅ Green if company owes
                              fontWeight: "bold",
                            }}
                          >
                            ${parseFloat(-reportData.netDue || 0).toFixed(2)} {/* Negate to show from driver's perspective */}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Action Buttons - Moved to top */}
                {reportData && (
                  <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={finalizeStatement}
                    >
                      Finalize & Save Statement
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Print />}
                      onClick={() => setDetailModalOpen(true)}
                    >
                      Open Detail Modal
                    </Button>
                  </Box>
                )}

                {/* Revenue Details - Tabbed View */}
                {reportData?.revenues && reportData.revenues.length > 0 && (
                  <Paper sx={{ mb: 3 }}>
                    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                      <Tabs
                        value={revenueTabIndex}
                        onChange={(e, newValue) => setRevenueTabIndex(newValue)}
                      >
                        <Tab label={`Credit Cards (${getRevenuesByType("CARD_REVENUE").length})`} />
                        <Tab label={`Charges (${getRevenuesByType("ACCOUNT_REVENUE").length})`} />
                        <Tab label={`Lease Revenue (${getRevenuesByType("LEASE_INCOME").length})`} />
                        <Tab label={`Others (${reportData.revenues.filter(r => !["CARD_REVENUE", "ACCOUNT_REVENUE", "LEASE_INCOME"].includes(r.revenueSubType)).length})`} />
                      </Tabs>
                    </Box>

                    {/* Credit Cards Tab */}
                    {revenueTabIndex === 0 && (
                      <Box sx={{ p: { xs: 1.5, md: 3 } }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: "#388e3c" }}>
                          Filters
                        </Typography>
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              label="From"
                              type="date"
                              value={revenueFilters.creditCardDateFrom}
                              onChange={(e) => setRevenueFilters({ ...revenueFilters, creditCardDateFrom: e.target.value })}
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              label="To"
                              type="date"
                              value={revenueFilters.creditCardDateTo}
                              onChange={(e) => setRevenueFilters({ ...revenueFilters, creditCardDateTo: e.target.value })}
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              label="Min Amount"
                              type="number"
                              value={revenueFilters.creditCardAmountMin}
                              onChange={(e) => setRevenueFilters({ ...revenueFilters, creditCardAmountMin: e.target.value })}
                              fullWidth
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              label="Max Amount"
                              type="number"
                              value={revenueFilters.creditCardAmountMax}
                              onChange={(e) => setRevenueFilters({ ...revenueFilters, creditCardAmountMax: e.target.value })}
                              fullWidth
                              size="small"
                            />
                          </Grid>
                        </Grid>

                        {getFilteredCreditCards().length > 0 ? (
                          <TableContainer sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ backgroundColor: "#e8f5e9" }}>
                                  <TableCell><strong>Transaction Date</strong></TableCell>
                                  <TableCell><strong>Card Type</strong></TableCell>
                                  <TableCell><strong>Description</strong></TableCell>
                                  <TableCell align="right"><strong>Amount</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {getFilteredCreditCards().map((rev, idx) => (
                                  <TableRow key={idx} hover>
                                    <TableCell>{rev.revenueDate || "-"}</TableCell>
                                    <TableCell>{rev.categoryName || "-"}</TableCell>
                                    <TableCell>{rev.description || "-"}</TableCell>
                                    <TableCell align="right" sx={{ color: "#388e3c", fontWeight: "bold" }}>
                                      ${parseFloat(rev.amount).toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography color="textSecondary">No credit card revenues match the filters</Typography>
                        )}
                      </Box>
                    )}

                    {/* Charges Tab */}
                    {revenueTabIndex === 1 && (
                      <Box sx={{ p: { xs: 1.5, md: 3 } }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: "#388e3c" }}>
                          Filters
                        </Typography>
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          <Grid item xs={6} sm={2.4}>
                            <TextField
                              label="From"
                              type="date"
                              value={revenueFilters.chargesDateFrom}
                              onChange={(e) => setRevenueFilters({ ...revenueFilters, chargesDateFrom: e.target.value })}
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={6} sm={2.4}>
                            <TextField
                              label="To"
                              type="date"
                              value={revenueFilters.chargesDateTo}
                              onChange={(e) => setRevenueFilters({ ...revenueFilters, chargesDateTo: e.target.value })}
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={6} sm={2.4}>
                            <TextField
                              label="Min Amount"
                              type="number"
                              value={revenueFilters.chargesAmountMin}
                              onChange={(e) => setRevenueFilters({ ...revenueFilters, chargesAmountMin: e.target.value })}
                              fullWidth
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={6} sm={2.4}>
                            <TextField
                              label="Max Amount"
                              type="number"
                              value={revenueFilters.chargesAmountMax}
                              onChange={(e) => setRevenueFilters({ ...revenueFilters, chargesAmountMax: e.target.value })}
                              fullWidth
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={6} sm={2.4}>
                            <TextField
                              label="Account Name"
                              value={revenueFilters.chargesAccountName}
                              onChange={(e) => setRevenueFilters({ ...revenueFilters, chargesAccountName: e.target.value })}
                              fullWidth
                              size="small"
                            />
                          </Grid>
                        </Grid>

                        {getFilteredCharges().length > 0 ? (
                          <TableContainer sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ backgroundColor: "#e8f5e9" }}>
                                  <TableCell><strong>Date</strong></TableCell>
                                  <TableCell><strong>Account Name</strong></TableCell>
                                  <TableCell><strong>From</strong></TableCell>
                                  <TableCell><strong>To</strong></TableCell>
                                  <TableCell align="right"><strong>Amount</strong></TableCell>
                                  <TableCell align="right"><strong>Tip</strong></TableCell>
                                  <TableCell align="right"><strong>Total</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {getFilteredCharges().map((rev, idx) => {
                                  const tip = rev.tipAmount ? parseFloat(rev.tipAmount) : 0;
                                  const amount = rev.fareAmount ? parseFloat(rev.fareAmount) : parseFloat(rev.amount) || 0;
                                  const total = amount + tip;
                                  return (
                                    <TableRow key={idx} hover>
                                      <TableCell>{rev.revenueDate || "-"}</TableCell>
                                      <TableCell><strong>{rev.accountName || "-"}</strong></TableCell>
                                      <TableCell>{rev.pickupAddress || "-"}</TableCell>
                                      <TableCell>{rev.dropoffAddress || "-"}</TableCell>
                                      <TableCell align="right" sx={{ color: "#388e3c", fontWeight: "bold" }}>
                                        ${amount.toFixed(2)}
                                      </TableCell>
                                      <TableCell align="right">
                                        ${tip.toFixed(2)}
                                      </TableCell>
                                      <TableCell align="right" sx={{ fontWeight: "bold", color: "#1976d2" }}>
                                        ${total.toFixed(2)}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography color="textSecondary">No charge revenues match the filters</Typography>
                        )}
                      </Box>
                    )}

                    {/* Lease Revenue Tab */}
                    {revenueTabIndex === 2 && (
                      <Box sx={{ p: { xs: 1.5, md: 3 } }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: "#388e3c" }}>
                          Filters
                        </Typography>
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              label="From"
                              type="date"
                              value={revenueFilters.leaseRevenueDateFrom}
                              onChange={(e) => setRevenueFilters({ ...revenueFilters, leaseRevenueDateFrom: e.target.value })}
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              label="To"
                              type="date"
                              value={revenueFilters.leaseRevenueDateTo}
                              onChange={(e) => setRevenueFilters({ ...revenueFilters, leaseRevenueDateTo: e.target.value })}
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              label="Min Amount"
                              type="number"
                              value={revenueFilters.leaseRevenueAmountMin}
                              onChange={(e) => setRevenueFilters({ ...revenueFilters, leaseRevenueAmountMin: e.target.value })}
                              fullWidth
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              label="Max Amount"
                              type="number"
                              value={revenueFilters.leaseRevenueAmountMax}
                              onChange={(e) => setRevenueFilters({ ...revenueFilters, leaseRevenueAmountMax: e.target.value })}
                              fullWidth
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              label="Driver Name"
                              value={revenueFilters.leaseRevenueDriverName}
                              onChange={(e) => setRevenueFilters({ ...revenueFilters, leaseRevenueDriverName: e.target.value })}
                              fullWidth
                              size="small"
                            />
                          </Grid>
                        </Grid>

                        {getFilteredLeaseRevenue().length > 0 ? (
                          <TableContainer sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ backgroundColor: "#e8f5e9" }}>
                                  <TableCell><strong>Shift Date</strong></TableCell>
                                  <TableCell><strong>Driver Name</strong></TableCell>
                                  <TableCell><strong>Description</strong></TableCell>
                                  <TableCell align="right"><strong>Amount</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {getFilteredLeaseRevenue().map((rev, idx) => (
                                  <TableRow key={idx} hover>
                                    <TableCell>{rev.revenueDate || "-"}</TableCell>
                                    <TableCell>{rev.description || "-"}</TableCell>
                                    <TableCell>{rev.categoryName || "-"}</TableCell>
                                    <TableCell align="right" sx={{ color: "#388e3c", fontWeight: "bold" }}>
                                      ${parseFloat(rev.amount).toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography color="textSecondary">No lease revenue match the filters</Typography>
                        )}
                      </Box>
                    )}

                    {/* Others Tab */}
                    {revenueTabIndex === 3 && (
                      <Box sx={{ p: { xs: 1.5, md: 3 } }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: "#388e3c" }}>
                          Filters
                        </Typography>
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              label="From"
                              type="date"
                              value={revenueFilters.othersDateFrom}
                              onChange={(e) => setRevenueFilters({ ...revenueFilters, othersDateFrom: e.target.value })}
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              label="To"
                              type="date"
                              value={revenueFilters.othersDateTo}
                              onChange={(e) => setRevenueFilters({ ...revenueFilters, othersDateTo: e.target.value })}
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              label="Min Amount"
                              type="number"
                              value={revenueFilters.othersAmountMin}
                              onChange={(e) => setRevenueFilters({ ...revenueFilters, othersAmountMin: e.target.value })}
                              fullWidth
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              label="Max Amount"
                              type="number"
                              value={revenueFilters.othersAmountMax}
                              onChange={(e) => setRevenueFilters({ ...revenueFilters, othersAmountMax: e.target.value })}
                              fullWidth
                              size="small"
                            />
                          </Grid>
                        </Grid>

                        {getFilteredOtherRevenues().length > 0 ? (
                          <TableContainer sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ backgroundColor: "#e8f5e9" }}>
                                  <TableCell><strong>Date</strong></TableCell>
                                  <TableCell><strong>Category</strong></TableCell>
                                  <TableCell><strong>Description</strong></TableCell>
                                  <TableCell align="right"><strong>Amount</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {getFilteredOtherRevenues().map((rev, idx) => (
                                  <TableRow key={idx} hover>
                                    <TableCell>{rev.revenueDate || "-"}</TableCell>
                                    <TableCell>{rev.categoryName || "-"}</TableCell>
                                    <TableCell>{rev.description || "-"}</TableCell>
                                    <TableCell align="right" sx={{ color: "#388e3c", fontWeight: "bold" }}>
                                      ${parseFloat(rev.amount).toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography color="textSecondary">No other revenues match the filters</Typography>
                        )}
                      </Box>
                    )}
                  </Paper>
                )}

                {/* Expense Details - Tabbed View */}
                {(reportData?.recurringExpenses?.length > 0 || reportData?.oneTimeExpenses?.length > 0) && (
                  <Paper sx={{ mb: 3 }}>
                    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                      <Tabs
                        value={expenseTabIndex}
                        onChange={(e, newValue) => setExpenseTabIndex(newValue)}
                      >
                        <Tab label={`Recurring Expenses (${reportData?.recurringExpenses?.length || 0})`} />
                        <Tab label={`One-Time Expenses (${reportData?.oneTimeExpenses?.length || 0})`} />
                      </Tabs>
                    </Box>

                    {/* Recurring Expenses Tab */}
                    {expenseTabIndex === 0 && (
                      <Box sx={{ p: { xs: 1.5, md: 3 } }}>
                        {reportData?.recurringExpenses?.length > 0 ? (
                          <TableContainer sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ backgroundColor: "#fff3e0" }}>
                                  <TableCell><strong>Category</strong></TableCell>
                                  <TableCell><strong>Target</strong></TableCell>
                                  <TableCell><strong>Billing Method</strong></TableCell>
                                  <TableCell align="right"><strong>Amount</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {reportData.recurringExpenses.map((exp, idx) => (
                                  <TableRow key={idx} hover>
                                    <TableCell>{exp.categoryName || "-"}</TableCell>
                                    <TableCell>{exp.entityDescription || "-"}</TableCell>
                                    <TableCell>{exp.billingMethod || "-"}</TableCell>
                                    <TableCell align="right" sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                                      ${parseFloat(exp.amount).toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography color="textSecondary">No recurring expenses</Typography>
                        )}
                      </Box>
                    )}

                    {/* One-Time Expenses Tab */}
                    {expenseTabIndex === 1 && (
                      <Box sx={{ p: { xs: 1.5, md: 3 } }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: "#d32f2f" }}>
                          Filters
                        </Typography>
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              label="From"
                              type="date"
                              value={expenseFilters.oneTimeDateFrom}
                              onChange={(e) => setExpenseFilters({ ...expenseFilters, oneTimeDateFrom: e.target.value })}
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              label="To"
                              type="date"
                              value={expenseFilters.oneTimeDateTo}
                              onChange={(e) => setExpenseFilters({ ...expenseFilters, oneTimeDateTo: e.target.value })}
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              label="Min Amount"
                              type="number"
                              value={expenseFilters.oneTimeAmountMin}
                              onChange={(e) => setExpenseFilters({ ...expenseFilters, oneTimeAmountMin: e.target.value })}
                              fullWidth
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              label="Max Amount"
                              type="number"
                              value={expenseFilters.oneTimeAmountMax}
                              onChange={(e) => setExpenseFilters({ ...expenseFilters, oneTimeAmountMax: e.target.value })}
                              fullWidth
                              size="small"
                            />
                          </Grid>
                        </Grid>

                        {reportData?.oneTimeExpenses?.length > 0 ? (
                          <TableContainer sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ backgroundColor: "#fce4ec" }}>
                                  <TableCell><strong>Date</strong></TableCell>
                                  <TableCell><strong>Category</strong></TableCell>
                                  <TableCell><strong>Description</strong></TableCell>
                                  <TableCell align="right"><strong>Amount</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {reportData.oneTimeExpenses
                                  .filter((exp) => {
                                    if (expenseFilters.oneTimeDateFrom && exp.date < expenseFilters.oneTimeDateFrom) return false;
                                    if (expenseFilters.oneTimeDateTo && exp.date > expenseFilters.oneTimeDateTo) return false;
                                    if (expenseFilters.oneTimeAmountMin && parseFloat(exp.amount) < parseFloat(expenseFilters.oneTimeAmountMin)) return false;
                                    if (expenseFilters.oneTimeAmountMax && parseFloat(exp.amount) > parseFloat(expenseFilters.oneTimeAmountMax)) return false;
                                    return true;
                                  })
                                  .map((exp, idx) => (
                                    <TableRow key={idx} hover>
                                      <TableCell>{exp.date || "-"}</TableCell>
                                      <TableCell>{exp.categoryName || "-"}</TableCell>
                                      <TableCell>{exp.description || "-"}</TableCell>
                                      <TableCell align="right" sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                                        ${parseFloat(exp.amount).toFixed(2)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography color="textSecondary">No one-time expenses</Typography>
                        )}
                      </Box>
                    )}
                  </Paper>
                )}
              </>
            )}

            {!reportData && selectedDriver && !loadingReport && (
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <Assessment sx={{ fontSize: 48, color: "textSecondary", mb: 2 }} />
                <Typography color="textSecondary">
                  Click "Generate Report" to view financial details
                </Typography>
              </Paper>
            )}
          </>
        )}

        {/* Tab 1: History */}
        {activeTab === 1 && (
          <>
            {!selectedDriverId ? (
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <Typography color="textSecondary">
                  Please select a driver or owner from the Generate Draft tab to view history.
                </Typography>
              </Paper>
            ) : (
              <>
                {loadingSavedStatements ? (
                  <Box sx={{ textAlign: "center", p: { xs: 2, md: 4 } }}>
                    <CircularProgress />
                  </Box>
                ) : savedStatements.length > 0 ? (
                  <Paper sx={{ p: { xs: 1.5, md: 3 } }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                      Finalized Statements
                    </Typography>
                    <TableContainer sx={{ overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                            <TableCell><strong>Period</strong></TableCell>
                            <TableCell align="right"><strong>Total Revenues</strong></TableCell>
                            <TableCell align="right"><strong>Total Expenses</strong></TableCell>
                            <TableCell align="right"><strong>Net Due</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell align="center"><strong>Actions</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {savedStatements.map((stmt) => (
                            <TableRow key={stmt.id} hover>
                              <TableCell>
                                {stmt.periodFrom} to {stmt.periodTo}
                              </TableCell>
                              <TableCell align="right">
                                ${parseFloat(stmt.totalRevenues || 0).toFixed(2)}
                              </TableCell>
                              <TableCell align="right">
                                ${parseFloat(stmt.totalExpenses || 0).toFixed(2)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: "bold", color: stmt.netDue > 0 ? "#d32f2f" : "#388e3c" }}>
                                ${parseFloat(-stmt.netDue || 0).toFixed(2)} {/* Negate to show from driver's perspective */}
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: "inline-block", px: 1.5, py: 0.5, backgroundColor: "#e0e0e0", borderRadius: 1, fontSize: "0.85rem" }}>
                                  {stmt.status}
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Button size="small" variant="outlined">
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                ) : (
                  <Paper sx={{ p: { xs: 2, md: 4 }, textAlign: "center" }}>
                    <Typography color="textSecondary">
                      No finalized statements found for this person.
                    </Typography>
                  </Paper>
                )}
              </>
            )}
          </>
        )}
      </Container>

      {/* Detail Modal Dialog */}
      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { m: { xs: 1, sm: 2 } } }}
      >
        <DialogTitle sx={{ pb: { xs: 1, md: 2 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant={{ xs: 'subtitle1', md: 'h6' }} fontWeight="bold">
              Statement Details
            </Typography>
            <Button
              onClick={() => setDetailModalOpen(false)}
              sx={{ minWidth: "auto", p: 0 }}
            >
              <Close />
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {reportData && (
            <Box>
              {/* Header */}
              <Box sx={{ mb: 3, pb: 2, borderBottom: "1px solid #e0e0e0" }}>
                <Typography variant="h6" fontWeight="bold">
                  {reportData.ownerName}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {reportData.periodFrom} to {reportData.periodTo}
                </Typography>
                <Box sx={{ display: "inline-block", mt: 1, px: 1.5, py: 0.5, backgroundColor: "#e0e0e0", borderRadius: 1, fontSize: "0.85rem" }}>
                  {reportData.status || "DRAFT"}
                </Box>
              </Box>

              {/* Revenues Section */}
              {reportData.revenues && reportData.revenues.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: "#388e3c" }}>
                    Revenues
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportData.revenues.map((rev, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{rev.revenueDate || "-"}</TableCell>
                            <TableCell>{rev.categoryName || "-"}</TableCell>
                            <TableCell align="right">${parseFloat(rev.amount).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Recurring Expenses Section */}
              {reportData.recurringExpenses && reportData.recurringExpenses.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: "#e65100" }}>
                    Recurring Expenses
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Category</TableCell>
                          <TableCell>Target</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportData.recurringExpenses.map((exp, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{exp.categoryName || "-"}</TableCell>
                            <TableCell>{exp.entityDescription || "-"}</TableCell>
                            <TableCell align="right">${parseFloat(exp.amount).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* One-Time Expenses Section */}
              {reportData.oneTimeExpenses && reportData.oneTimeExpenses.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: "#c2185b" }}>
                    One-Time Expenses
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportData.oneTimeExpenses.map((exp, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{exp.date || "-"}</TableCell>
                            <TableCell>{exp.categoryName || "-"}</TableCell>
                            <TableCell align="right">${parseFloat(exp.amount).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Totals Footer */}
              <Box sx={{ pt: 2, borderTop: "2px solid #e0e0e0", backgroundColor: "#f9f9f9", p: 2, borderRadius: 1 }}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>Total Revenues</strong></TableCell>
                      <TableCell align="right">${parseFloat(reportData.totalRevenues || 0).toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Recurring Expenses</strong></TableCell>
                      <TableCell align="right">${parseFloat(reportData.totalRecurringExpenses || 0).toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>One-Time Expenses</strong></TableCell>
                      <TableCell align="right">${parseFloat(reportData.totalOneTimeExpenses || 0).toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow sx={{ backgroundColor: "#fff3e0" }}>
                      <TableCell><strong>Net Due</strong></TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold", color: reportData.netDue > 0 ? "#d32f2f" : "#388e3c" }}>
                        ${parseFloat(-reportData.netDue || 0).toFixed(2)} {/* Negate to show from driver's perspective */}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => window.print()}>
            <Print sx={{ mr: 1 }} /> Print
          </Button>
          <Button onClick={handleEmailClick}>
            Email
          </Button>
          <Button onClick={() => setDetailModalOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)}>
        <DialogTitle>Send via Email</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            type="email"
            label="Email Address"
            fullWidth
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSendEmail} variant="contained">
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
