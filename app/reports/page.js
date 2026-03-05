"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GlobalNav from "../components/GlobalNav";
import {
  Box, Container, Typography, Button, Paper, Grid, TextField,
  Tabs, Tab, Card, CardContent, CircularProgress, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, Autocomplete, Chip,
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
  const [success, setSuccess] = useState("");
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

  // Helper function to filter lease expenses from one-time expenses
  const getLeaseExpenses = () => {
    if (!reportData?.oneTimeExpenses) return [];
    return reportData.oneTimeExpenses.filter((exp) => exp.applicationType === "LEASE_RENT");
  };

  // Helper function to filter non-lease, non-airport one-time expenses
  const getOtherOneTimeExpenses = () => {
    if (!reportData?.oneTimeExpenses) return [];
    return reportData.oneTimeExpenses.filter((exp) => exp.applicationType !== "LEASE_RENT" && exp.categoryCode !== "AIRPORT_TRIP");
  };

  // Helper function to filter airport trip expenses from one-time expenses
  const getAirportExpenses = () => {
    if (!reportData?.oneTimeExpenses) return [];
    return reportData.oneTimeExpenses.filter((exp) => exp.categoryCode === "AIRPORT_TRIP");
  };

  // Revenue type filter functions
  const getLeaseRevenues = () => {
    if (!reportData?.revenues) return [];
    return reportData.revenues.filter((rev) => rev.revenueSubType === "LEASE_INCOME");
  };

  const getAccountChargeRevenues = () => {
    if (!reportData?.revenues) return [];
    return reportData.revenues.filter((rev) => rev.revenueSubType === "ACCOUNT_REVENUE");
  };

  const getCreditCardRevenues = () => {
    if (!reportData?.revenues) return [];
    return reportData.revenues.filter((rev) => rev.revenueSubType === "CARD_REVENUE");
  };

  const getOtherRevenues = () => {
    if (!reportData?.revenues) return [];
    return reportData.revenues.filter((rev) => rev.revenueSubType === "OTHER_REVENUE");
  };

  // Helper function to calculate subtotals for revenue/expense sections
  const calculateSubtotal = (items) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  };

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

  // Check if period is multi-month (spans more than one calendar month)
  const isMultiMonthPeriod = () => {
    if (!startDate || !endDate) return false;
    // Parse dates in local timezone (HTML date inputs are YYYY-MM-DD format)
    const [startYear, startMonth] = startDate.split('-').slice(0, 2);
    const [endYear, endMonth] = endDate.split('-').slice(0, 2);
    return !(startYear === endYear && startMonth === endMonth);
  };

  // Check if finalize button should be disabled
  const isFinalizeButtonDisabled = () => {
    if (!reportData) return true;
    // Disable if already finalized or paid
    if (reportData.status === "FINALIZED" || reportData.status === "PAID") return true;
    // Disable if period spans multiple months
    if (isMultiMonthPeriod()) return true;
    return false;
  };

  const generateReport = async () => {
    if (!selectedDriverId || !startDate || !endDate) {
      setError("Please select a driver and date range");
      return;
    }

    // Validate that start date is not later than end date
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setError("Start date cannot be later than end date");
      return;
    }

    // Warn if period is not a full month (optional, for user awareness)
    const isSameMonth = start.getFullYear() === end.getFullYear() &&
                        start.getMonth() === end.getMonth();
    const isMonthStart = start.getDate() === 1;
    const isMonthEnd = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate() === end.getDate();

    const isStandardMonth = isSameMonth && isMonthStart && isMonthEnd;
    if (!isStandardMonth) {
      console.info("Non-standard period selected: this will include all transactions across month boundaries");
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

  const handleSendEmail = async () => {
    if (!emailAddress) {
      setError("Please enter an email address");
      return;
    }

    if (!reportData) {
      setError("Please generate a report first");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/financial-statements/send-report`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toEmail: emailAddress,
          driverName: reportData?.ownerName || "Driver",
          report: reportData,
        }),
      });

      if (response.ok) {
        setSuccess(`Email with detailed PDF report sent successfully to ${emailAddress}`);
        setEmailDialogOpen(false);
        setEmailAddress("");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to send email");
      }
    } catch (err) {
      setError("Error sending email: " + err.message);
    } finally {
      setLoading(false);
    }
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
Per-Unit Expenses: $${parseFloat(reportData.totalPerUnitExpenses || 0).toFixed(2)}
Mileage Expenses: $${reportData?.mileageExpenses?.reduce((sum, exp) => sum + parseFloat(exp.totalLeaseAmount || 0), 0).toFixed(2) || '0.00'}
Insurance Mileage Expenses: $${parseFloat(reportData.totalInsuranceMileageExpenses || 0).toFixed(2)}
Total Expenses: $${parseFloat(reportData.totalExpenses || 0).toFixed(2)}
Previous Balance: $${parseFloat(reportData.previousBalance || 0).toFixed(2)}
Paid Amount: $${parseFloat(paidAmount || 0).toFixed(2)}
${reportData.netDue > 0 ? "Net Payable" : "Net Due"}: ${reportData.netDue > 0 ? '$' + parseFloat(Math.abs(reportData.netDue) || 0).toFixed(2) : '-$' + parseFloat(Math.abs(reportData.netDue) || 0).toFixed(2)}
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

  // Group lease revenue by driver, sorted by date within each driver
  const getGroupedLeaseRevenue = () => {
    const leaseData = getFilteredLeaseRevenue();
    const extractDriver = (rev) => {
      const match = rev.description?.match(/Driver:\s+([^(]+)\s*\(([^)]+)\)/);
      return match ? `${match[1].trim()} (${match[2]})` : "Unknown";
    };
    const grouped = {};
    leaseData.forEach((rev) => {
      const driver = extractDriver(rev);
      if (!grouped[driver]) grouped[driver] = [];
      grouped[driver].push(rev);
    });
    Object.values(grouped).forEach((rows) =>
      rows.sort((a, b) => (a.revenueDate || "").localeCompare(b.revenueDate || ""))
    );
    return { grouped, driverNames: Object.keys(grouped).sort(), leaseData };
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
                    error={startDate && endDate && new Date(startDate) > new Date(endDate)}
                    helperText={startDate && endDate && new Date(startDate) > new Date(endDate) ? "Start date must be before end date" : ""}
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
                    error={startDate && endDate && new Date(startDate) > new Date(endDate)}
                    helperText={startDate && endDate && new Date(startDate) > new Date(endDate) ? "End date must be after start date" : ""}
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
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {selectedDriver.firstName} {selectedDriver.lastName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {selectedDriver.isOwner ? "Owner" : "Driver"} • Driver #: {selectedDriver.driverNumber}
                    </Typography>
                  </Box>
                  {reportData && reportData.status && (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Chip
                        label={reportData.status === "PAID" ? "✓ PAID" : reportData.status === "FINALIZED" ? "FINALIZED" : "DRAFT"}
                        color={reportData.status === "PAID" ? "success" : reportData.status === "FINALIZED" ? "primary" : "default"}
                        variant={reportData.status === "DRAFT" ? "outlined" : "filled"}
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                  )}
                </Box>
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
                          backgroundColor: reportData.netDue > 0 ? "#e8f5e9" : "#ffebee", // ✅ Green if company owes, ❌ Red if driver owes
                          border: `3px solid ${reportData.netDue > 0 ? "#388e3c" : "#d32f2f"}`,
                          cursor: "pointer",
                          transition: "all 0.3s",
                          "&:hover": { boxShadow: 4 },
                        }}
                      >
                        <CardContent>
                          <Typography color="textSecondary" variant="body2" gutterBottom>
                            <strong>{reportData.netDue > 0 ? "Net Payable" : "Net Due"}</strong>
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              color: reportData.netDue > 0 ? "#388e3c" : "#d32f2f", // ✅ Green if company owes, ❌ Red if driver owes
                              fontWeight: "bold",
                            }}
                          >
                            {reportData.netDue > 0 ? '$' : '-$'}{parseFloat(Math.abs(reportData.netDue) || 0).toFixed(2)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Action Buttons - Moved to top */}
                {reportData && (
                  <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
                    {reportData.status === "PAID" ? (
                      <Box sx={{ p: 2, backgroundColor: "#e8f5e9", border: "1px solid #4caf50", borderRadius: 1, flex: 1 }}>
                        <Typography variant="body2" sx={{ color: "#2e7d32", fontWeight: 600 }}>
                          ✓ Statement Finalized & Paid
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#558b2f" }}>
                          This statement has been processed. Re-finalization is not allowed.
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        <Button
                          variant="contained"
                          color="success"
                          onClick={finalizeStatement}
                          disabled={isFinalizeButtonDisabled()}
                          title={isFinalizeButtonDisabled() ?
                            (reportData.status === "FINALIZED" ? "Statement already finalized" :
                             reportData.status === "PAID" ? "Statement already paid" :
                             isMultiMonthPeriod() ? "Cannot finalize multi-month periods. Finalization is limited to single-month periods." :
                             "") : ""}
                        >
                          {reportData.status === "FINALIZED" ? "Statement Finalized" :
                           reportData.status === "PAID" ? "Statement Paid" :
                           "Finalize & Save Statement"}
                        </Button>
                      </>
                    )}
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
                        <Tab label={`Others (${(reportData?.revenues || []).filter(r => !["CARD_REVENUE", "ACCOUNT_REVENUE", "LEASE_INCOME"].includes(r.revenueSubType)).length})`} />
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
                                <TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                                  <TableCell colSpan={3} align="right"><strong>Credit Card Revenue Total:</strong></TableCell>
                                  <TableCell align="right"><strong>${calculateSubtotal(getFilteredCreditCards()).toFixed(2)}</strong></TableCell>
                                </TableRow>
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
                                {[...getFilteredCharges()].sort((a, b) => (a.revenueDate || "").localeCompare(b.revenueDate || "")).map((rev, idx) => {
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
                                <TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                                  <TableCell colSpan={4} align="right"><strong>Account Charges Total:</strong></TableCell>
                                  <TableCell align="right" colSpan={2}></TableCell>
                                  <TableCell align="right"><strong>${getFilteredCharges().reduce((sum, rev) => {
                                    const tip = rev.tipAmount ? parseFloat(rev.tipAmount) : 0;
                                    const amount = rev.fareAmount ? parseFloat(rev.fareAmount) : parseFloat(rev.amount) || 0;
                                    return sum + amount + tip;
                                  }, 0).toFixed(2)}</strong></TableCell>
                                </TableRow>
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
                                  <TableCell><strong>Cab</strong></TableCell>
                                  <TableCell><strong>Date</strong></TableCell>
                                  <TableCell><strong>Description</strong></TableCell>
                                  <TableCell align="right"><strong>Amount</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {(() => {
                                  const leaseData = getFilteredLeaseRevenue();
                                  const grouped = {};
                                  leaseData.forEach((rev) => {
                                    const cabNum = rev.description?.match(/Cab\s+(\d+)/)?.[1] || "Unknown";
                                    if (!grouped[cabNum]) grouped[cabNum] = [];
                                    grouped[cabNum].push(rev);
                                  });
                                  const sortedCabs = Object.keys(grouped).sort((a, b) => (parseInt(a) || 999) - (parseInt(b) || 999));
                                  const rows = [];
                                  sortedCabs.forEach((cab) => {
                                    const items = grouped[cab].sort((a, b) => (a.revenueDate || "").localeCompare(b.revenueDate || ""));
                                    const cabSubtotal = items.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
                                    rows.push(
                                      <TableRow key={`tab-cab-hdr-${cab}`} sx={{ bgcolor: "#c8e6c9" }}>
                                        <TableCell colSpan={4}>
                                          <Typography variant="body2" fontWeight="bold" color="success.main">Cab {cab}</Typography>
                                        </TableCell>
                                      </TableRow>
                                    );
                                    items.forEach((rev, idx) => {
                                      rows.push(
                                        <TableRow key={`tab-cab-${cab}-${idx}`} hover>
                                          <TableCell sx={{ fontWeight: "bold", color: "#388e3c" }}>Cab {cab}</TableCell>
                                          <TableCell>{rev.revenueDate || "-"}</TableCell>
                                          <TableCell>{rev.description || "-"}</TableCell>
                                          <TableCell align="right" sx={{ color: "#388e3c", fontWeight: "bold" }}>
                                            ${parseFloat(rev.amount || 0).toFixed(2)}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    });
                                    rows.push(
                                      <TableRow key={`tab-cab-sub-${cab}`} sx={{ bgcolor: "#e8f5e9", borderTop: "1px solid #4caf50" }}>
                                        <TableCell colSpan={3} align="right">
                                          <Typography variant="caption" fontWeight="bold" color="success.main">Cab {cab} Subtotal:</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                          <Typography variant="caption" fontWeight="bold" color="success.main">${cabSubtotal.toFixed(2)}</Typography>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  });
                                  rows.push(
                                    <TableRow key="tab-lease-total" sx={{ bgcolor: "#c8e6c9", borderTop: "2px solid #4caf50" }}>
                                      <TableCell colSpan={3} align="right"><strong>Lease Revenue Total:</strong></TableCell>
                                      <TableCell align="right"><strong>${calculateSubtotal(leaseData).toFixed(2)}</strong></TableCell>
                                    </TableRow>
                                  );
                                  return rows;
                                })()}
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
                                <TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                                  <TableCell colSpan={3} align="right"><strong>Other Revenues Total:</strong></TableCell>
                                  <TableCell align="right"><strong>${calculateSubtotal(getFilteredOtherRevenues()).toFixed(2)}</strong></TableCell>
                                </TableRow>
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
                {(reportData?.recurringExpenses?.length > 0 || reportData?.oneTimeExpenses?.length > 0 || reportData?.mileageExpenses?.length > 0 || reportData?.insuranceMileageExpenses?.length > 0) && (
                  <Paper sx={{ mb: 3 }}>
                    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                      <Tabs
                        value={expenseTabIndex}
                        onChange={(e, newValue) => setExpenseTabIndex(newValue)}
                      >
                        <Tab label={`Recurring Expenses (${reportData?.recurringExpenses?.length || 0})`} />
                        <Tab label={`Lease Expenses (${getLeaseExpenses().length})`} />
                        <Tab label={`One-Time Expenses (${getOtherOneTimeExpenses().length})`} />
                        <Tab label={`Per-Unit Expenses (${reportData?.perUnitExpenses?.length || 0})`} />
                        <Tab label={`Airport Trips (${getAirportExpenses().length})`} />
                        <Tab label={`Mileage Expenses (${reportData?.mileageExpenses?.length || 0})`} />
                        <Tab label={`Insurance Mileage (${reportData?.insuranceMileageExpenses?.length || 0})`} />
                      </Tabs>
                    </Box>

                    {/* Recurring Expenses Tab - Index 0 */}
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
                                <TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                                  <TableCell colSpan={3} align="right"><strong>Recurring Expenses Total:</strong></TableCell>
                                  <TableCell align="right"><strong>${calculateSubtotal(reportData?.recurringExpenses || []).toFixed(2)}</strong></TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography color="textSecondary">No recurring expenses</Typography>
                        )}
                      </Box>
                    )}

                    {/* Lease Expenses Tab - Index 1 */}
                    {expenseTabIndex === 1 && (
                      <Box sx={{ p: { xs: 1.5, md: 3 } }}>
                        {getLeaseExpenses().length > 0 ? (
                          <TableContainer sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ backgroundColor: "#fff8e1" }}>
                                  <TableCell><strong>Cab</strong></TableCell>
                                  <TableCell><strong>Date</strong></TableCell>
                                  <TableCell><strong>Description</strong></TableCell>
                                  <TableCell align="right"><strong>Amount</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {(() => {
                                  const grouped = {};
                                  getLeaseExpenses().forEach((exp) => {
                                    const cabNum = exp.description?.match(/Cab\s+(\d+)/)?.[1] || exp.cabNumber || "Unknown";
                                    if (!grouped[cabNum]) grouped[cabNum] = [];
                                    grouped[cabNum].push(exp);
                                  });
                                  const sortedCabs = Object.keys(grouped).sort((a, b) => (parseInt(a) || 999) - (parseInt(b) || 999));
                                  const rows = [];
                                  sortedCabs.forEach((cab) => {
                                    const items = grouped[cab].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
                                    const cabSubtotal = items.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
                                    rows.push(
                                      <TableRow key={`tab-exp-cab-hdr-${cab}`} sx={{ bgcolor: "#fff3e0" }}>
                                        <TableCell colSpan={4}>
                                          <Typography variant="body2" fontWeight="bold" color="error.main">Cab {cab}</Typography>
                                        </TableCell>
                                      </TableRow>
                                    );
                                    items.forEach((exp, idx) => {
                                      rows.push(
                                        <TableRow key={`tab-exp-cab-${cab}-${idx}`} hover>
                                          <TableCell sx={{ fontWeight: "bold", color: "#d32f2f" }}>Cab {cab}</TableCell>
                                          <TableCell>{exp.date || "-"}</TableCell>
                                          <TableCell>{exp.description || "-"}</TableCell>
                                          <TableCell align="right" sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                                            ${parseFloat(exp.amount || 0).toFixed(2)}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    });
                                    rows.push(
                                      <TableRow key={`tab-exp-cab-sub-${cab}`} sx={{ bgcolor: "#ffebee", borderTop: "1px solid #e57373" }}>
                                        <TableCell colSpan={3} align="right">
                                          <Typography variant="caption" fontWeight="bold" color="error.main">Cab {cab} Subtotal:</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                          <Typography variant="caption" fontWeight="bold" color="error.main">${cabSubtotal.toFixed(2)}</Typography>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  });
                                  rows.push(
                                    <TableRow key="tab-exp-total" sx={{ bgcolor: "#ffcdd2", borderTop: "2px solid #e57373" }}>
                                      <TableCell colSpan={3} align="right"><strong>Lease Expenses Total:</strong></TableCell>
                                      <TableCell align="right"><strong>${calculateSubtotal(getLeaseExpenses()).toFixed(2)}</strong></TableCell>
                                    </TableRow>
                                  );
                                  return rows;
                                })()}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography color="textSecondary">No lease expenses</Typography>
                        )}
                      </Box>
                    )}

                    {/* One-Time Expenses Tab - Index 2 */}
                    {expenseTabIndex === 2 && (
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

                        {getOtherOneTimeExpenses().length > 0 ? (
                          <TableContainer sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ backgroundColor: "#fce4ec" }}>
                                  <TableCell><strong>Date</strong></TableCell>
                                  <TableCell><strong>Category</strong></TableCell>
                                  <TableCell><strong>Description</strong></TableCell>
                                  <TableCell><strong>Cab #</strong></TableCell>
                                  <TableCell><strong>Shift Type</strong></TableCell>
                                  <TableCell><strong>Details</strong></TableCell>
                                  <TableCell align="right"><strong>Amount</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {getOtherOneTimeExpenses()
                                  .filter((exp) => {
                                    if (expenseFilters.oneTimeDateFrom && exp.date < expenseFilters.oneTimeDateFrom) return false;
                                    if (expenseFilters.oneTimeDateTo && exp.date > expenseFilters.oneTimeDateTo) return false;
                                    if (expenseFilters.oneTimeAmountMin && parseFloat(exp.amount) < parseFloat(expenseFilters.oneTimeAmountMin)) return false;
                                    if (expenseFilters.oneTimeAmountMax && parseFloat(exp.amount) > parseFloat(expenseFilters.oneTimeAmountMax)) return false;
                                    return true;
                                  })
                                  .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
                                  .map((exp, idx) => {
                                    // Use explicit fields from backend (much more reliable)
                                    const cabNumber = exp.cabNumber || "-";
                                    const shiftType = exp.shiftType || "-";
                                    const chargeTarget = exp.chargeTarget || "-";

                                    return (
                                      <TableRow key={idx} hover>
                                        <TableCell>{exp.date || "-"}</TableCell>
                                        <TableCell>{exp.categoryName || "-"}</TableCell>
                                        <TableCell>{exp.description || "-"}</TableCell>
                                        <TableCell><strong>{cabNumber}</strong></TableCell>
                                        <TableCell>{shiftType}</TableCell>
                                        <TableCell sx={{ fontSize: "0.85rem", color: "#666" }}>
                                          {chargeTarget}
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                                          ${parseFloat(exp.amount).toFixed(2)}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                <TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                                  <TableCell colSpan={6} align="right"><strong>One-Time Expenses Total:</strong></TableCell>
                                  <TableCell align="right"><strong>${calculateSubtotal(
                                    getOtherOneTimeExpenses().filter((exp) => {
                                      if (expenseFilters.oneTimeDateFrom && exp.date < expenseFilters.oneTimeDateFrom) return false;
                                      if (expenseFilters.oneTimeDateTo && exp.date > expenseFilters.oneTimeDateTo) return false;
                                      if (expenseFilters.oneTimeAmountMin && parseFloat(exp.amount) < parseFloat(expenseFilters.oneTimeAmountMin)) return false;
                                      if (expenseFilters.oneTimeAmountMax && parseFloat(exp.amount) > parseFloat(expenseFilters.oneTimeAmountMax)) return false;
                                      return true;
                                    })
                                  ).toFixed(2)}</strong></TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography color="textSecondary">No one-time expenses</Typography>
                        )}
                      </Box>
                    )}

                    {/* Per-Unit Expenses Tab - Index 3 */}
                    {expenseTabIndex === 3 && (
                      <Box sx={{ p: { xs: 1.5, md: 3 } }}>
                        {reportData?.perUnitExpenses && reportData.perUnitExpenses.length > 0 ? (
                          <TableContainer sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ backgroundColor: "#e8f5e9" }}>
                                  <TableCell><strong>Name</strong></TableCell>
                                  <TableCell><strong>Unit Type</strong></TableCell>
                                  <TableCell align="right"><strong>Units</strong></TableCell>
                                  <TableCell align="right"><strong>Rate/Unit</strong></TableCell>
                                  <TableCell align="right"><strong>Total</strong></TableCell>
                                  <TableCell><strong>Charged To</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {reportData.perUnitExpenses.map((exp, idx) => (
                                  <TableRow key={idx} hover>
                                    <TableCell>{exp.name || "-"}</TableCell>
                                    <TableCell>{exp.unitTypeDisplay || exp.unitType || "-"}</TableCell>
                                    <TableCell align="right">{parseFloat(exp.totalUnits || 0).toFixed(2)}</TableCell>
                                    <TableCell align="right">${parseFloat(exp.rate || 0).toFixed(2)}</TableCell>
                                    <TableCell align="right" sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                                      ${parseFloat(exp.amount || 0).toFixed(2)}
                                    </TableCell>
                                    <TableCell>{exp.chargedTo || "-"}</TableCell>
                                  </TableRow>
                                ))}
                                <TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                                  <TableCell colSpan={4} align="right"><strong>Per-Unit Expenses Total:</strong></TableCell>
                                  <TableCell align="right"><strong>${calculateSubtotal(reportData?.perUnitExpenses || []).toFixed(2)}</strong></TableCell>
                                  <TableCell></TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography color="textSecondary">No per-unit expenses</Typography>
                        )}
                      </Box>
                    )}

                    {/* Airport Trips Tab - Index 4 */}
                    {expenseTabIndex === 4 && (
                      <Box sx={{ p: { xs: 1.5, md: 3 } }}>
                        {getAirportExpenses().length > 0 ? (
                          <TableContainer sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ backgroundColor: "#e3f2fd" }}>
                                  <TableCell><strong>Date</strong></TableCell>
                                  <TableCell><strong>Cab #</strong></TableCell>
                                  <TableCell align="right"><strong>Trips</strong></TableCell>
                                  <TableCell align="right"><strong>Rate/Trip</strong></TableCell>
                                  <TableCell align="right"><strong>Amount</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {getAirportExpenses()
                                  .sort((a, b) => new Date(b.date || "") - new Date(a.date || ""))
                                  .map((exp, idx) => (
                                  <TableRow key={idx} hover>
                                    <TableCell>{exp.date || "-"}</TableCell>
                                    <TableCell>{exp.cabNumber || "-"}</TableCell>
                                    <TableCell align="right">{exp.tripCount || "-"}</TableCell>
                                    <TableCell align="right">{exp.ratePerUnit ? `$${parseFloat(exp.ratePerUnit).toFixed(2)}` : "-"}</TableCell>
                                    <TableCell align="right" sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                                      ${parseFloat(exp.amount || 0).toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                                <TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                                  <TableCell colSpan={2} align="right">
                                    <strong>Total: {getAirportExpenses().reduce((sum, e) => sum + (e.tripCount || 0), 0)} trips</strong>
                                  </TableCell>
                                  <TableCell colSpan={2} align="right"><strong>Airport Trips Total:</strong></TableCell>
                                  <TableCell align="right"><strong>${calculateSubtotal(getAirportExpenses()).toFixed(2)}</strong></TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography color="textSecondary">No airport trip expenses</Typography>
                        )}
                      </Box>
                    )}

                    {/* Mileage Expenses Tab - Index 5 */}
                    {expenseTabIndex === 5 && (
                      <Box sx={{ p: { xs: 1.5, md: 3 } }}>
                        {reportData?.mileageExpenses?.length > 0 ? (
                          <TableContainer sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ backgroundColor: "#f3e5f5" }}>
                                  <TableCell><strong>Item Rate</strong></TableCell>
                                  <TableCell><strong>Unit Type</strong></TableCell>
                                  <TableCell align="right"><strong>Total Units</strong></TableCell>
                                  <TableCell align="right"><strong>Fixed Lease</strong></TableCell>
                                  <TableCell align="right"><strong>Rate/Unit</strong></TableCell>
                                  <TableCell align="right"><strong>Mileage Lease</strong></TableCell>
                                  <TableCell align="right"><strong>Total Lease</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {reportData.mileageExpenses.map((exp, idx) => (
                                  <TableRow key={idx} hover>
                                    <TableCell>{exp.itemRateName}</TableCell>
                                    <TableCell>{exp.unitType}</TableCell>
                                    <TableCell align="right">{parseFloat(exp.totalUnits || 0).toFixed(2)}</TableCell>
                                    <TableCell align="right">${parseFloat(exp.fixedLeaseAmount || 0).toFixed(2)}</TableCell>
                                    <TableCell align="right">${parseFloat(exp.mileageRate || 0).toFixed(2)}</TableCell>
                                    <TableCell align="right">${parseFloat(exp.mileageLeaseAmount || 0).toFixed(2)}</TableCell>
                                    <TableCell align="right" sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                                      ${parseFloat(exp.totalLeaseAmount || 0).toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                                <TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                                  <TableCell colSpan={6} align="right"><strong>Total Lease Amount:</strong></TableCell>
                                  <TableCell align="right"><strong>${reportData.mileageExpenses.reduce((sum, exp) => sum + parseFloat(exp.totalLeaseAmount || 0), 0).toFixed(2)}</strong></TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography color="textSecondary">No mileage expenses</Typography>
                        )}
                      </Box>
                    )}

                    {/* Insurance Mileage Expenses Tab - Index 6 */}
                    {expenseTabIndex === 6 && (
                      <Box sx={{ p: { xs: 1.5, md: 3 } }}>
                        {reportData?.insuranceMileageExpenses?.length > 0 ? (
                          <TableContainer sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ backgroundColor: "#fce4ec" }}>
                                  <TableCell><strong>Date</strong></TableCell>
                                  <TableCell><strong>Cab #</strong></TableCell>
                                  <TableCell align="right"><strong>Mileage</strong></TableCell>
                                  <TableCell align="right"><strong>Insurance Rate</strong></TableCell>
                                  <TableCell align="right"><strong>Total</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {[...reportData.insuranceMileageExpenses].sort((a, b) => (a.date || "").localeCompare(b.date || "")).map((exp, idx) => {
                                  const miles = exp.miles ? parseFloat(exp.miles) : 0;
                                  const amount = exp.amount ? parseFloat(exp.amount) : 0;
                                  const insuranceRate = miles > 0 ? (amount / miles).toFixed(2) : "0.00";

                                  return (
                                    <TableRow key={idx} hover>
                                      <TableCell>{exp.date || "-"}</TableCell>
                                      <TableCell><strong>{exp.cabNumber || "-"}</strong></TableCell>
                                      <TableCell align="right">{miles.toFixed(2)}</TableCell>
                                      <TableCell align="right">${insuranceRate}</TableCell>
                                      <TableCell align="right" sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                                        ${amount.toFixed(2)}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                                <TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                                  <TableCell colSpan={4} align="right"><strong>Insurance Mileage Expenses Total:</strong></TableCell>
                                  <TableCell align="right"><strong>${calculateSubtotal(reportData.insuranceMileageExpenses).toFixed(2)}</strong></TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography color="textSecondary">No insurance mileage expenses</Typography>
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
                            <TableCell align="right"><strong>Net Payable / Due</strong></TableCell>
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
                              <TableCell align="right" sx={{ fontWeight: "bold", color: stmt.netDue > 0 ? "#388e3c" : "#d32f2f" }}>
                                <div>{stmt.netDue > 0 ? "Net Payable" : "Net Due"}</div>
                                {stmt.netDue > 0 ? '$' : '-$'}{parseFloat(Math.abs(stmt.netDue) || 0).toFixed(2)}
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

              {/* Lease Revenue Section - grouped by cab, natural number sort */}
              {getLeaseRevenues().length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: "#388e3c" }}>
                    Lease Revenue
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: "#e8f5e9" }}>
                          <TableCell><strong>Cab</strong></TableCell>
                          <TableCell><strong>Date</strong></TableCell>
                          <TableCell><strong>Description</strong></TableCell>
                          <TableCell align="right"><strong>Amount</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(() => {
                          const grouped = {};
                          getLeaseRevenues().forEach((rev) => {
                            const cabNum = rev.description?.match(/Cab\s+(\d+)/)?.[1] || "Unknown";
                            if (!grouped[cabNum]) grouped[cabNum] = [];
                            grouped[cabNum].push(rev);
                          });
                          const sortedCabs = Object.keys(grouped).sort((a, b) => (parseInt(a) || 999) - (parseInt(b) || 999));
                          const rows = [];
                          sortedCabs.forEach((cab) => {
                            const items = grouped[cab].sort((a, b) => (a.revenueDate || "").localeCompare(b.revenueDate || ""));
                            const cabSubtotal = items.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
                            rows.push(
                              <TableRow key={`cab-hdr-${cab}`} sx={{ bgcolor: "#c8e6c9" }}>
                                <TableCell colSpan={4}>
                                  <Typography variant="body2" fontWeight="bold" color="success.main">Cab {cab}</Typography>
                                </TableCell>
                              </TableRow>
                            );
                            items.forEach((rev, idx) => {
                              rows.push(
                                <TableRow key={`cab-${cab}-${idx}`} hover>
                                  <TableCell sx={{ fontWeight: "bold", color: "#388e3c" }}>Cab {cab}</TableCell>
                                  <TableCell>{rev.revenueDate || "-"}</TableCell>
                                  <TableCell>{rev.description || "-"}</TableCell>
                                  <TableCell align="right" sx={{ color: "#388e3c", fontWeight: "bold" }}>
                                    ${parseFloat(rev.amount || 0).toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              );
                            });
                            rows.push(
                              <TableRow key={`cab-sub-${cab}`} sx={{ bgcolor: "#e8f5e9", borderTop: "1px solid #4caf50" }}>
                                <TableCell colSpan={3} align="right">
                                  <Typography variant="caption" fontWeight="bold" color="success.main">Cab {cab} Subtotal:</Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="caption" fontWeight="bold" color="success.main">${cabSubtotal.toFixed(2)}</Typography>
                                </TableCell>
                              </TableRow>
                            );
                          });
                          rows.push(
                            <TableRow key="lease-rev-total" sx={{ bgcolor: "#c8e6c9", borderTop: "2px solid #4caf50" }}>
                              <TableCell colSpan={3} align="right"><strong>Lease Revenue Total:</strong></TableCell>
                              <TableCell align="right"><strong>${calculateSubtotal(getLeaseRevenues()).toFixed(2)}</strong></TableCell>
                            </TableRow>
                          );
                          return rows;
                        })()}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Account Charges Section */}
              {getAccountChargeRevenues().length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: "#1976d2" }}>
                    Account Charges
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[...getAccountChargeRevenues()].sort((a, b) => (a.revenueDate || "").localeCompare(b.revenueDate || "")).map((rev, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{rev.revenueDate || "-"}</TableCell>
                            <TableCell>{rev.categoryName || "-"}</TableCell>
                            <TableCell>{rev.description || "-"}</TableCell>
                            <TableCell align="right">${parseFloat(rev.amount).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                          <TableCell colSpan={3} align="right"><strong>Account Charges Subtotal:</strong></TableCell>
                          <TableCell align="right"><strong>${calculateSubtotal(getAccountChargeRevenues()).toFixed(2)}</strong></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Credit Card Revenue Section */}
              {getCreditCardRevenues().length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: "#d32f2f" }}>
                    Credit Card Revenue
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {getCreditCardRevenues().map((rev, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{rev.revenueDate || "-"}</TableCell>
                            <TableCell>{rev.categoryName || "-"}</TableCell>
                            <TableCell>{rev.description || "-"}</TableCell>
                            <TableCell align="right">${parseFloat(rev.amount).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                          <TableCell colSpan={3} align="right"><strong>Credit Card Revenue Subtotal:</strong></TableCell>
                          <TableCell align="right"><strong>${calculateSubtotal(getCreditCardRevenues()).toFixed(2)}</strong></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Other Revenue Section */}
              {getOtherRevenues().length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: "#f57c00" }}>
                    Other Revenues
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {getOtherRevenues().map((rev, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{rev.revenueDate || "-"}</TableCell>
                            <TableCell>{rev.categoryName || "-"}</TableCell>
                            <TableCell>{rev.description || "-"}</TableCell>
                            <TableCell align="right">${parseFloat(rev.amount).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                          <TableCell colSpan={3} align="right"><strong>Other Revenues Subtotal:</strong></TableCell>
                          <TableCell align="right"><strong>${calculateSubtotal(getOtherRevenues()).toFixed(2)}</strong></TableCell>
                        </TableRow>
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
                        <TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                          <TableCell colSpan={2} align="right"><strong>Recurring Expenses Subtotal:</strong></TableCell>
                          <TableCell align="right"><strong>${calculateSubtotal(reportData.recurringExpenses).toFixed(2)}</strong></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Lease Expenses Section - grouped by cab, natural number sort */}
              {getLeaseExpenses().length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: "#f57f17" }}>
                    Lease Expenses
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: "#fff3e0" }}>
                          <TableCell><strong>Cab</strong></TableCell>
                          <TableCell><strong>Date</strong></TableCell>
                          <TableCell><strong>Description</strong></TableCell>
                          <TableCell align="right"><strong>Amount</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(() => {
                          const grouped = {};
                          getLeaseExpenses().forEach((exp) => {
                            const cabNum = exp.description?.match(/Cab\s+(\d+)/)?.[1] || exp.cabNumber || "Unknown";
                            if (!grouped[cabNum]) grouped[cabNum] = [];
                            grouped[cabNum].push(exp);
                          });
                          const sortedCabs = Object.keys(grouped).sort((a, b) => (parseInt(a) || 999) - (parseInt(b) || 999));
                          const rows = [];
                          sortedCabs.forEach((cab) => {
                            const items = grouped[cab].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
                            const cabSubtotal = items.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
                            rows.push(
                              <TableRow key={`exp-cab-hdr-${cab}`} sx={{ bgcolor: "#fff3e0" }}>
                                <TableCell colSpan={4}>
                                  <Typography variant="body2" fontWeight="bold" color="error.main">Cab {cab}</Typography>
                                </TableCell>
                              </TableRow>
                            );
                            items.forEach((exp, idx) => {
                              rows.push(
                                <TableRow key={`exp-cab-${cab}-${idx}`} hover>
                                  <TableCell sx={{ fontWeight: "bold", color: "#d32f2f" }}>Cab {cab}</TableCell>
                                  <TableCell>{exp.date || "-"}</TableCell>
                                  <TableCell>{exp.description || "-"}</TableCell>
                                  <TableCell align="right" sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                                    ${parseFloat(exp.amount || 0).toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              );
                            });
                            rows.push(
                              <TableRow key={`exp-cab-sub-${cab}`} sx={{ bgcolor: "#ffebee", borderTop: "1px solid #e57373" }}>
                                <TableCell colSpan={3} align="right">
                                  <Typography variant="caption" fontWeight="bold" color="error.main">Cab {cab} Subtotal:</Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="caption" fontWeight="bold" color="error.main">${cabSubtotal.toFixed(2)}</Typography>
                                </TableCell>
                              </TableRow>
                            );
                          });
                          rows.push(
                            <TableRow key="lease-exp-total" sx={{ bgcolor: "#ffcdd2", borderTop: "2px solid #e57373" }}>
                              <TableCell colSpan={3} align="right"><strong>Lease Expenses Total:</strong></TableCell>
                              <TableCell align="right"><strong>${calculateSubtotal(getLeaseExpenses()).toFixed(2)}</strong></TableCell>
                            </TableRow>
                          );
                          return rows;
                        })()}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* One-Time Expenses Section */}
              {getOtherOneTimeExpenses().length > 0 && (
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
                          <TableCell>Description</TableCell>
                          <TableCell>Cab #</TableCell>
                          <TableCell>Shift Type</TableCell>
                          <TableCell>Details</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[...getOtherOneTimeExpenses()].sort((a, b) => (a.date || "").localeCompare(b.date || "")).map((exp, idx) => {
                          // Use explicit fields from backend (much more reliable)
                          const cabNumber = exp.cabNumber || "-";
                          const shiftType = exp.shiftType || "-";
                          const chargeTarget = exp.chargeTarget || "-";

                          return (
                            <TableRow key={idx}>
                              <TableCell>{exp.date || "-"}</TableCell>
                              <TableCell>{exp.categoryName || "-"}</TableCell>
                              <TableCell>{exp.description || "-"}</TableCell>
                              <TableCell><strong>{cabNumber}</strong></TableCell>
                              <TableCell>{shiftType}</TableCell>
                              <TableCell sx={{ fontSize: "0.85rem", color: "#666" }}>
                                {chargeTarget}
                              </TableCell>
                              <TableCell align="right">${parseFloat(exp.amount).toFixed(2)}</TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                          <TableCell colSpan={6} align="right"><strong>One-Time Expenses Subtotal:</strong></TableCell>
                          <TableCell align="right"><strong>${calculateSubtotal(getOtherOneTimeExpenses()).toFixed(2)}</strong></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Per-Unit Expenses Section */}
              {reportData.perUnitExpenses && reportData.perUnitExpenses.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: "#558b2f" }}>
                    Per-Unit Expenses
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Unit Type</TableCell>
                          <TableCell align="right">Units</TableCell>
                          <TableCell align="right">Rate/Unit</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportData.perUnitExpenses.map((exp, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{exp.name || "-"}</TableCell>
                            <TableCell>{exp.unitTypeDisplay || exp.unitType || "-"}</TableCell>
                            <TableCell align="right">{parseFloat(exp.totalUnits || 0).toFixed(2)}</TableCell>
                            <TableCell align="right">${parseFloat(exp.rate || 0).toFixed(2)}</TableCell>
                            <TableCell align="right">${parseFloat(exp.amount || 0).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                          <TableCell colSpan={4} align="right"><strong>Per-Unit Expenses Subtotal:</strong></TableCell>
                          <TableCell align="right"><strong>${calculateSubtotal(reportData.perUnitExpenses).toFixed(2)}</strong></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Airport Trip Expenses Section */}
              {getAirportExpenses().length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: "#1565c0" }}>
                    Airport Trip Expenses
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Cab #</TableCell>
                          <TableCell align="right">Trips</TableCell>
                          <TableCell align="right">Rate/Trip</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {getAirportExpenses()
                          .sort((a, b) => new Date(b.date || "") - new Date(a.date || ""))
                          .map((exp, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{exp.date || "-"}</TableCell>
                            <TableCell>{exp.cabNumber || "-"}</TableCell>
                            <TableCell align="right">{exp.tripCount || "-"}</TableCell>
                            <TableCell align="right">{exp.ratePerUnit ? `$${parseFloat(exp.ratePerUnit).toFixed(2)}` : "-"}</TableCell>
                            <TableCell align="right">${parseFloat(exp.amount || 0).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                          <TableCell colSpan={2} align="right">
                            <strong>Total: {getAirportExpenses().reduce((sum, e) => sum + (e.tripCount || 0), 0)} trips</strong>
                          </TableCell>
                          <TableCell colSpan={2} align="right"><strong>Airport Trips Subtotal:</strong></TableCell>
                          <TableCell align="right"><strong>${calculateSubtotal(getAirportExpenses()).toFixed(2)}</strong></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Insurance Mileage Expenses Section */}
              {reportData.insuranceMileageExpenses && reportData.insuranceMileageExpenses.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: "#c2185b" }}>
                    Insurance Mileage Expenses
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Cab #</TableCell>
                          <TableCell align="right">Mileage</TableCell>
                          <TableCell align="right">Insurance Rate</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[...reportData.insuranceMileageExpenses].sort((a, b) => (a.date || "").localeCompare(b.date || "")).map((exp, idx) => {
                          const miles = exp.miles ? parseFloat(exp.miles) : 0;
                          const amount = exp.amount ? parseFloat(exp.amount) : 0;
                          const insuranceRate = miles > 0 ? (amount / miles).toFixed(2) : "0.00";

                          return (
                            <TableRow key={idx}>
                              <TableCell>{exp.date || "-"}</TableCell>
                              <TableCell><strong>{exp.cabNumber || "-"}</strong></TableCell>
                              <TableCell align="right">{miles.toFixed(2)}</TableCell>
                              <TableCell align="right">${insuranceRate}</TableCell>
                              <TableCell align="right">${amount.toFixed(2)}</TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                          <TableCell colSpan={4} align="right"><strong>Insurance Mileage Expenses Subtotal:</strong></TableCell>
                          <TableCell align="right"><strong>${calculateSubtotal(reportData.insuranceMileageExpenses).toFixed(2)}</strong></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Totals Footer */}
              <Box sx={{ pt: 3, borderTop: "3px solid #e0e0e0", backgroundColor: "#f9f9f9", p: 3, borderRadius: 1 }}>
                <Table size="small">
                  <TableBody>
                    {/* Revenue Totals Section */}
                    <TableRow sx={{ backgroundColor: "#e8f5e9" }}>
                      <TableCell><strong>📊 TOTAL REVENUES</strong></TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold", color: "#388e3c", fontSize: "1.1rem" }}>
                        ${parseFloat(reportData.totalRevenues || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>

                    {/* Expense Totals Section */}
                    <TableRow sx={{ backgroundColor: "#ffebee", mt: 2 }}>
                      <TableCell><strong>💰 TOTAL EXPENSES</strong></TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold", color: "#d32f2f", fontSize: "1.1rem" }}>
                        ${parseFloat(reportData.totalExpenses || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>

                    {/* Spacing */}
                    <TableRow sx={{ height: "10px" }} />

                    {/* Previous Balance */}
                    {(reportData.previousBalance && reportData.previousBalance !== 0) ? (
                      <TableRow>
                        <TableCell><strong>Previous Balance</strong></TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          ${parseFloat(reportData.previousBalance || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ) : null}

                    {/* Final Net Payable/Due */}
                    <TableRow sx={{ backgroundColor: reportData.netDue > 0 ? "#c8e6c9" : "#ffcdd2", borderTop: "2px solid #999" }}>
                      <TableCell><strong>✓ {reportData.netDue > 0 ? "NET PAYABLE" : "NET DUE"}</strong></TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold", color: reportData.netDue > 0 ? "#1b5e20" : "#b71c1c", fontSize: "1.15rem" }}>
                        {reportData.netDue > 0 ? '$' : '-$'}{parseFloat(Math.abs(reportData.netDue) || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>

                    {/* Paid Amount */}
                    {(reportData.paidAmount && reportData.paidAmount !== 0) ? (
                      <TableRow>
                        <TableCell><strong>Amount Paid</strong></TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          ${parseFloat(reportData.paidAmount || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ) : null}
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
