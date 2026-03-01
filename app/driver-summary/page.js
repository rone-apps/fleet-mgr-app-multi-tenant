"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import GlobalNav from "../components/GlobalNav";
import {
  Box, Container, Typography, Paper, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, CircularProgress, Alert, Grid, Pagination,
  Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Assessment, Download, Close, FileDownload } from "@mui/icons-material";
import axios from "axios";
import { API_BASE_URL } from "../lib/api";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

// ✅ FIXED: Proper date formatting function that handles timezones correctly
const formatDateForAPI = (date) => {
  if (!date || !(date instanceof Date)) return null;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

export default function DriverSummaryPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState("");
  
  // Date filters
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());
  
  // Local Pagination state - all records cached locally
  const [page, setPage] = useState(1); // UI page is 1-indexed
  const [pageSize] = useState(50);
  const [allRecords, setAllRecords] = useState([]);  // ✅ Cache all records locally
  const [isAllRecordsLoaded, setIsAllRecordsLoaded] = useState(false);  // ✅ Track if fully loaded
  const [loadingProgress, setLoadingProgress] = useState(0);  // ✅ Progress for loading all records

  // Search/filter state
  const [searchDriverNumber, setSearchDriverNumber] = useState("");
  const [searchDriverName, setSearchDriverName] = useState("");
  const [driverTypeFilter, setDriverTypeFilter] = useState("ALL"); // ALL, DRIVERS_ONLY, OWNERS_ONLY

  // Sort state
  const [orderBy, setOrderBy] = useState("driverName");
  const [order, setOrder] = useState("asc");

  // Report data
  const [reportData, setReportData] = useState(null);

  // Driver detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverDetailReport, setDriverDetailReport] = useState(null);
  const [detailLoadingMessage, setDetailLoadingMessage] = useState("");
  const [revenueTabIndex, setRevenueTabIndex] = useState(0);
  const [expenseTabIndex, setExpenseTabIndex] = useState(0);

  const getCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { 
          Authorization: `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/signin");
        return;
      }
      const user = await getCurrentUser();
      if (!user) {
        router.push("/signin");
        return;
      }
      setCurrentUser(user);
    };
    checkAuth();
  }, [router]);

  // ✅ Load ALL records with pagination, cache locally, then handle pagination locally
  const fetchAllRecords = async (sortField = "lastName", sortDirection = "asc") => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }

    // ✅ VALIDATE 1-MONTH PERIOD
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    if (daysDiff > 31) {
      setError("Report period cannot exceed 31 days. Please select a shorter date range.");
      return;
    }

    setLoading(true);
    setLoadingMessage("Loading all driver records...");
    setError("");
    setAllRecords([]);
    setIsAllRecordsLoaded(false);
    setLoadingProgress(0);

    try {
      const token = localStorage.getItem("token");
      const formattedStart = formatDateForAPI(startDate);
      const formattedEnd = formatDateForAPI(endDate);

      let allData = [];
      let pageNum = 0;
      let totalPages = 1;

      // ✅ Fetch ALL pages and cache locally
      while (pageNum < totalPages) {
        setLoadingMessage(`Loading all driver records... (Page ${pageNum + 1})`);

        const response = await axios.get(
          `${API_BASE_URL}/reports/driver-summary`,
          {
            params: {
              startDate: formattedStart,
              endDate: formattedEnd,
              page: pageNum,
              size: 25, // Fetch 25 at a time to be efficient
              sort: sortField,
              direction: sortDirection,
            },
            headers: {
              Authorization: `Bearer ${token}`,
              "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            },
            timeout: 900000, // 5 minutes to allow large report calculations
          }
        );

        const pageData = response.data.driverSummaries || [];
        allData = [...allData, ...pageData];
        totalPages = response.data.totalPages;
        pageNum++;

        // ✅ Update progress
        const progress = Math.round((pageNum / totalPages) * 100);
        setLoadingProgress(progress);

        // Store report data from last page (has grand totals)
        if (pageNum === totalPages) {
          setReportData(response.data);
        }
      }

      console.log(`✅ Loaded ${allData.length} total driver records from ${totalPages} pages`);

      // ✅ Cache all records locally
      setAllRecords(allData);
      setIsAllRecordsLoaded(true);
      setPage(1); // Reset to page 1
      setLoadingMessage("");

    } catch (err) {
      console.error("Error loading all records:", err);
      if (err.code === "ECONNABORTED") {
        setError("Request timed out. Please try a shorter date range.");
      } else if (err.response?.status === 403) {
        setError("Access denied.");
      } else if (err.response?.status === 401) {
        setError("Session expired. Please sign in again.");
        setTimeout(() => router.push("/signin"), 2000);
      } else {
        setError(err.response?.data?.message || "Failed to load driver summary report");
      }
      setLoadingMessage("");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle page change - LOCAL pagination (no API call)
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
    window.scrollTo(0, 0); // Scroll to top
  };

  // ✅ Handle sort change - reload all records with new sort
  const handleSortChange = (property) => {
    const isAsc = orderBy === property && order === "asc";
    const newOrder = isAsc ? "desc" : "asc";
    setOrder(newOrder);
    setOrderBy(property);

    // Map frontend property names to backend sort fields
    let sortField = property;
    if (property === "driverName") {
      sortField = "lastName";
    }

    // Refetch with new sort order
    fetchAllRecords(sortField, newOrder);
  };



  // ✅ Filter data based on search terms (from cached records on current page)
  // ✅ Calculate pagination from cached records FIRST (before useEffect)
  const totalPages = allRecords.length > 0 ? Math.ceil(allRecords.length / pageSize) : 0;

  // ✅ Memoize currentPageData to prevent infinite loop
  const currentPageData = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return allRecords.slice(startIndex, endIndex);
  }, [page, pageSize, allRecords]);

  // ✅ DYNAMIC COLUMN SCHEMA - Compute from all records
  const revenueColumns = useMemo(() => {
    const keys = new Map(); // key → displayName
    allRecords.forEach(d => {
      (d.revenueBreakdown || []).forEach(item => {
        if (!keys.has(item.key)) {
          keys.set(item.key, item.displayName);
        }
      });
    });
    // Return in consistent order: CC, CHARGES, LEASE_INC, then OTHER items
    const ordered = new Map();
    const otherItems = new Map();
    keys.forEach((displayName, key) => {
      if (key === "CC") ordered.set(key, displayName);
      else if (key === "CHARGES") ordered.set(key, displayName);
      else if (key === "LEASE_INC") ordered.set(key, displayName);
      else otherItems.set(key, displayName);
    });
    otherItems.forEach((displayName, key) => ordered.set(key, displayName));
    return Array.from(ordered.entries()).map(([key, displayName]) => ({ key, displayName }));
  }, [allRecords]);

  const expenseColumns = useMemo(() => {
    const keys = new Map();
    allRecords.forEach(d => {
      (d.expenseBreakdown || []).forEach(item => {
        if (!keys.has(item.key)) {
          keys.set(item.key, item.displayName);
        }
      });
    });
    // Return in consistent order: RECURRING items, LEASE_EXP, ONETIME items, INSURANCE
    const ordered = new Map();
    const recurringItems = new Map();
    const ontimeItems = new Map();
    keys.forEach((displayName, key) => {
      if (key === "LEASE_EXP") ordered.set(key, displayName);
      else if (key === "INSURANCE") ordered.set(key, displayName);
      else if (key.startsWith("RECURRING:")) recurringItems.set(key, displayName);
      else if (key.startsWith("ONETIME:")) ontimeItems.set(key, displayName);
    });
    recurringItems.forEach((displayName, key) => ordered.set(key, displayName));
    ontimeItems.forEach((displayName, key) => ordered.set(key, displayName));
    if (keys.has("INSURANCE")) {
      const insurance = keys.get("INSURANCE");
      ordered.delete("INSURANCE");
      ordered.set("INSURANCE", insurance);
    }
    return Array.from(ordered.entries()).map(([key, displayName]) => ({ key, displayName }));
  }, [allRecords]);

  // ✅ AGGREGATE ITEMIZED REVENUE & EXPENSE TOTALS FOR SUMMARY REPORT
  const aggregatedSummary = useMemo(() => {
    const revenueTotals = {};
    const expenseTotals = {};

    allRecords.forEach(driver => {
      // Aggregate revenues
      (driver.revenueBreakdown || []).forEach(item => {
        if (!revenueTotals[item.key]) {
          revenueTotals[item.key] = { displayName: item.displayName, total: 0 };
        }
        revenueTotals[item.key].total += (item.amount || 0);
      });

      // Aggregate expenses
      (driver.expenseBreakdown || []).forEach(item => {
        if (!expenseTotals[item.key]) {
          expenseTotals[item.key] = { displayName: item.displayName, total: 0 };
        }
        expenseTotals[item.key].total += (item.amount || 0);
      });
    });

    return {
      revenues: Object.entries(revenueTotals).map(([key, val]) => ({ key, ...val })),
      expenses: Object.entries(expenseTotals).map(([key, val]) => ({ key, ...val })),
    };
  }, [allRecords]);

  // ✅ HELPER FUNCTIONS FOR DYNAMIC COLUMN LOOKUP
  const getRevAmount = (driver, key) =>
    (driver.revenueBreakdown || []).find(i => i.key === key)?.amount || 0;

  const getExpAmount = (driver, key) =>
    (driver.expenseBreakdown || []).find(i => i.key === key)?.amount || 0;

  // ✅ Get display totals from grand totals (all records cached)
  const getDisplayTotals = () => {
    if (!isAllRecordsLoaded || !reportData) {
      return {
        revenue: 0,
        expense: 0,
        netOwed: 0,
        paid: 0,
        driverCount: 0,
        leaseRevenue: 0,
        creditCardRevenue: 0,
        chargesRevenue: 0,
        otherRevenue: 0,
        fixedExpense: 0,
        leaseExpense: 0,
        variableExpense: 0,
        otherExpense: 0
      };
    }

    // ✅ Use grand totals from reportData (all records)
    return {
      revenue: reportData.grandTotalRevenue || 0,
      expense: reportData.grandTotalExpense || 0,
      netOwed: reportData.grandNetOwed || 0,
      paid: reportData.grandTotalPaid || 0,
      driverCount: reportData.totalElements || 0,
      leaseRevenue: reportData.grandTotalLeaseRevenue || 0,
      creditCardRevenue: reportData.grandTotalCreditCardRevenue || 0,
      chargesRevenue: reportData.grandTotalChargesRevenue || 0,
      otherRevenue: reportData.grandTotalOtherRevenue || 0,
      fixedExpense: reportData.grandTotalFixedExpense || 0,
      leaseExpense: reportData.grandTotalLeaseExpense || 0,
      variableExpense: reportData.grandTotalVariableExpense || 0,
      otherExpense: reportData.grandTotalOtherExpense || 0
    };
  };

  const displayTotals = getDisplayTotals();

  // ✅ Calculate filtered totals based on Driver Type filter
  const getFilteredTotals = () => {
    const filterByType = (records) => {
      if (driverTypeFilter === "DRIVERS_ONLY") {
        return records.filter(d => !d.isOwner);
      } else if (driverTypeFilter === "OWNERS_ONLY") {
        return records.filter(d => d.isOwner);
      }
      return records; // ALL
    };

    const filtered = filterByType(allRecords);
    return {
      revenue: filtered.reduce((sum, d) => sum + (d.totalRevenue || 0), 0),
      expense: filtered.reduce((sum, d) => sum + (d.totalExpense || 0), 0),
      netOwed: filtered.reduce((sum, d) => sum + (d.totalRevenue || 0), 0) -
               filtered.reduce((sum, d) => sum + (d.totalExpense || 0), 0),
      paid: filtered.reduce((sum, d) => sum + (d.paid || 0), 0),
      count: filtered.length,
      filtered: filtered,
    };
  };

  const filteredTotals = getFilteredTotals();

  // ✅ Compute filtered data directly (no useEffect to avoid infinite loop)
  const filteredDataComputed = useMemo(() => {
    // Use allRecords if fully loaded, otherwise use currentPageData
    const dataToFilter = isAllRecordsLoaded ? allRecords : currentPageData;

    if (dataToFilter.length === 0) {
      return [];
    }

    let filtered = [...dataToFilter];

    // Filter by driver type
    if (driverTypeFilter === "DRIVERS_ONLY") {
      filtered = filtered.filter((driver) => !driver.isOwner);
    } else if (driverTypeFilter === "OWNERS_ONLY") {
      filtered = filtered.filter((driver) => driver.isOwner);
    }

    if (searchDriverNumber) {
      filtered = filtered.filter((driver) =>
        driver.driverNumber.toLowerCase().includes(searchDriverNumber.toLowerCase())
      );
    }

    if (searchDriverName) {
      filtered = filtered.filter((driver) =>
        driver.driverName.toLowerCase().includes(searchDriverName.toLowerCase())
      );
    }

    return filtered;
  }, [searchDriverNumber, searchDriverName, currentPageData, allRecords, isAllRecordsLoaded, driverTypeFilter]);

  // Format currency
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  // ✅ Fetch detailed driver report for modal
  const openDriverDetailModal = async (driver) => {
    setSelectedDriver(driver);
    setDetailModalOpen(true);
    setDetailLoadingMessage("Loading driver details...");

    try {
      const token = localStorage.getItem("token");
      const tenantId = localStorage.getItem("tenantSchema");

      // ✅ Fetch the detailed report using driver number
      const response = await axios.get(
        `${API_BASE_URL}/financial-statements/owner-report/by-number/${driver.driverNumber}`,
        {
          params: {
            from: formatDateForAPI(startDate),
            to: formatDateForAPI(endDate),
          },
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": tenantId,
          },
        }
      );
      setDriverDetailReport(response.data);
      setDetailLoadingMessage("");
    } catch (err) {
      console.error("Error fetching driver details:", err);
      setDetailLoadingMessage(`Error loading driver details: ${err.response?.status === 403 ? "Access denied" : err.message}`);
    }
  };

  // ✅ Export ALL cached records to Excel (not just current page)
  const exportToExcel = () => {
    if (!isAllRecordsLoaded || allRecords.length === 0) {
      setError("No data to export. Please load all records first.");
      return;
    }

    try {
      // Build headers: Driver #, Name, [dynamic revenue columns], Total Rev, [dynamic expense columns], Total Exp, Net Owed, Paid, Outstanding
      const headers = ["Driver #", "Name"];
      revenueColumns.forEach(col => headers.push(col.displayName));
      headers.push("Total Rev");
      expenseColumns.forEach(col => headers.push(col.displayName));
      headers.push("Total Exp", "Net Owed", "Paid", "Outstanding");

      // Build rows
      const rows = allRecords.map((driver) => {
        const row = [driver.driverNumber, driver.driverName];

        // Revenue columns
        revenueColumns.forEach(col => {
          row.push(getRevAmount(driver, col.key));
        });
        row.push(driver.totalRevenue || 0);

        // Expense columns
        expenseColumns.forEach(col => {
          row.push(getExpAmount(driver, col.key));
        });
        row.push(driver.totalExpense || 0, driver.netOwed || 0, driver.paid || 0, driver.outstanding || 0);

        return row;
      });

      // Add grand totals row
      const totalsRow = ["TOTALS", ""];
      revenueColumns.forEach(col => {
        const revTotal = allRecords.reduce((sum, d) => sum + (getRevAmount(d, col.key) || 0), 0);
        totalsRow.push(revTotal);
      });
      totalsRow.push(displayTotals.revenue);
      expenseColumns.forEach(col => {
        const expTotal = allRecords.reduce((sum, d) => sum + (getExpAmount(d, col.key) || 0), 0);
        totalsRow.push(expTotal);
      });
      totalsRow.push(displayTotals.expense, displayTotals.netOwed, displayTotals.paid, displayTotals.netOwed - displayTotals.paid);
      rows.push(totalsRow);

      // Create workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

      // Set column widths
      const colWidths = [];
      headers.forEach(() => colWidths.push({ wch: 15 }));
      worksheet["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, "Driver Summary");
      XLSX.writeFile(workbook, `driver-summary-${formatDateForAPI(startDate)}-to-${formatDateForAPI(endDate)}.xlsx`);

      setError(""); // Clear any previous errors
    } catch (err) {
      console.error("Error exporting to Excel:", err);
      setError(`Failed to export Excel: ${err.message}`);
    }
  };

  // ✅ Export ALL cached records to PDF (not just current page)
  const exportToPDF = () => {
    if (!isAllRecordsLoaded || allRecords.length === 0) {
      setError("No data to export. Please load all records first.");
      return;
    }

    try {
      // Create PDF in landscape A3 for wide table
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a3"
      });

      // Add title
      pdf.setFontSize(16);
      pdf.text("Driver Financial Summary Report", 15, 20);
      pdf.setFontSize(10);
      pdf.text(`Period: ${formatDateForAPI(startDate)} to ${formatDateForAPI(endDate)}`, 15, 28);

      // Build headers and rows
      const headers = ["Driver #", "Name"];
      revenueColumns.forEach(col => headers.push(col.displayName));
      headers.push("Total Rev");
      expenseColumns.forEach(col => headers.push(col.displayName));
      headers.push("Total Exp", "Net Owed", "Paid", "Outstanding");

      const rows = allRecords.map((driver) => {
        const row = [driver.driverNumber, driver.driverName];

        revenueColumns.forEach(col => {
          row.push(formatCurrency(getRevAmount(driver, col.key)));
        });
        row.push(formatCurrency(driver.totalRevenue || 0));

        expenseColumns.forEach(col => {
          row.push(formatCurrency(getExpAmount(driver, col.key)));
        });
        row.push(
          formatCurrency(driver.totalExpense || 0),
          formatCurrency(driver.netOwed || 0),
          formatCurrency(driver.paid || 0),
          formatCurrency(driver.outstanding || 0)
        );

        return row;
      });

      // Add totals row
      const totalsRow = ["TOTALS", ""];
      revenueColumns.forEach(col => {
        const revTotal = allRecords.reduce((sum, d) => sum + (getRevAmount(d, col.key) || 0), 0);
        totalsRow.push(formatCurrency(revTotal));
      });
      totalsRow.push(formatCurrency(displayTotals.revenue));
      expenseColumns.forEach(col => {
        const expTotal = allRecords.reduce((sum, d) => sum + (getExpAmount(d, col.key) || 0), 0);
        totalsRow.push(formatCurrency(expTotal));
      });
      totalsRow.push(
        formatCurrency(displayTotals.expense),
        formatCurrency(displayTotals.netOwed),
        formatCurrency(displayTotals.paid),
        formatCurrency(displayTotals.netOwed - displayTotals.paid)
      );
      rows.push(totalsRow);

      // Add table
      pdf.autoTable({
        head: [headers],
        body: rows,
        startY: 35,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [70, 130, 180], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        margin: { left: 10, right: 10 }
      });

      pdf.save(`driver-summary-${formatDateForAPI(startDate)}-to-${formatDateForAPI(endDate)}.pdf`);

      setError(""); // Clear any previous errors
    } catch (err) {
      console.error("Error exporting to PDF:", err);
      setError(`Failed to export PDF: ${err.message}`);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
        <GlobalNav currentUser={currentUser} />
        
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Assessment sx={{ fontSize: 40, mr: 2, color: "primary.main" }} />
              <Typography variant="h4" component="h1" fontWeight="bold">
                Driver Financial Summary
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary">
              Comprehensive financial summary for all active drivers including revenue and expenses
            </Typography>
          </Box>

            {/* Date Range Selection */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Report Period
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={setStartDate}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={setEndDate}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      // ✅ Load ALL records with current sort
                      let sortField = orderBy;
                      if (orderBy === "driverName") {
                        sortField = "lastName";
                      }
                      fetchAllRecords(sortField, order);
                    }}
                    disabled={loading}
                    fullWidth
                    size="large"
                  >
                    {loading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : "Generate Report"}
                    {loadingProgress > 0 && !loading && <Typography variant="caption" sx={{ ml: 1 }}>({loadingProgress}%)</Typography>}
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Filters */}
            {reportData && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Filters & Search
                </Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Search Driver Number"
                      value={searchDriverNumber}
                      onChange={(e) => setSearchDriverNumber(e.target.value)}
                      fullWidth
                      size="small"
                      helperText={isAllRecordsLoaded ? "Searching all cached records" : "Searching current page only"}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Search Driver Name"
                      value={searchDriverName}
                      onChange={(e) => setSearchDriverName(e.target.value)}
                      fullWidth
                      size="small"
                      helperText={isAllRecordsLoaded ? "Searching all cached records" : "Searching current page only"}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Driver Type</InputLabel>
                      <Select
                        value={driverTypeFilter}
                        label="Driver Type"
                        onChange={(e) => setDriverTypeFilter(e.target.value)}
                      >
                        <MenuItem value="ALL">All (Drivers & Owners)</MenuItem>
                        <MenuItem value="DRIVERS_ONLY">Drivers Only</MenuItem>
                        <MenuItem value="OWNERS_ONLY">Owners Only</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<Download />}
                      onClick={exportToExcel}
                      fullWidth
                      disabled={!isAllRecordsLoaded}
                      title={isAllRecordsLoaded ? `Export all ${allRecords.length} records to Excel` : "Generate report and load all records first"}
                    >
                      Export Excel
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<Download />}
                      onClick={exportToPDF}
                      fullWidth
                      disabled={!isAllRecordsLoaded}
                      title={isAllRecordsLoaded ? `Export all ${allRecords.length} records to PDF` : "Generate report and load all records first"}
                    >
                      Export PDF
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* Error Display */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Report Table */}
            {reportData && (
              <>
                {/* Summary Cards - Overview */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {isAllRecordsLoaded
                          ? "Total Drivers with Activity"
                          : "Drivers Loaded So Far"}
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {displayTotals.driverCount}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {isAllRecordsLoaded
                          ? "✓ All records cached"
                          : `Page ${page} of ${totalPages} (${currentPageData.length} on this page)`}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {isAllRecordsLoaded
                          ? "Grand Total Revenue"
                          : "Revenue (All Loaded)"}
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color="success.main">
                        {formatCurrency(displayTotals.revenue)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {isAllRecordsLoaded
                          ? "✓ All drivers"
                          : `Cached locally`}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {isAllRecordsLoaded
                          ? "Grand Total Expense"
                          : "Expense (All Loaded)"}
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color="error.main">
                        {formatCurrency(displayTotals.expense)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {isAllRecordsLoaded
                          ? "✓ All drivers"
                          : `Cached locally`}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {isAllRecordsLoaded
                          ? "Grand Net Owed"
                          : "Net Owed (All Loaded)"}
                      </Typography>
                      <Typography
                        variant="h5"
                        fontWeight="bold"
                        color={
                          displayTotals.netOwed > 0
                            ? "error.main" // ❌ Red: Driver owes company money
                            : displayTotals.netOwed < 0
                            ? "success.main" // ✅ Green: Company owes driver money
                            : "text.primary" // Neutral: Zero balance
                        }
                      >
                        {formatCurrency(-displayTotals.netOwed)} {/* Negate: show driver's perspective */}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {isAllRecordsLoaded
                          ? "✓ Final totals"
                          : `Running total`}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* ✅ COMPREHENSIVE SUMMARY REPORT */}
                <Paper sx={{ p: 3, mb: 3, bgcolor: "#f5f5f5", border: "2px solid #1976d2" }}>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                    📊 Summary Report - {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()}
                  </Typography>

                  <Grid container spacing={3}>
                    {/* REVENUES SECTION - ALL ITEMIZED */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: "success.main" }}>
                        Revenues
                      </Typography>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {aggregatedSummary.revenues.length > 0 ? (
                          <>
                            {aggregatedSummary.revenues.map((item, idx) => (
                              <Box
                                key={item.key}
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  py: 0.5,
                                  borderBottom: idx === aggregatedSummary.revenues.length - 1 ? "2px solid #333" : "1px solid #ddd",
                                }}
                              >
                                <Typography variant="body2">{item.displayName}</Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {formatCurrency(item.total)}
                                </Typography>
                              </Box>
                            ))}
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary">No revenue data</Typography>
                        )}
                        <Box sx={{ display: "flex", justifyContent: "space-between", py: 1, bgcolor: "success.light", px: 1, borderRadius: 1, mt: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold">Total Revenues</Typography>
                          <Typography variant="subtitle2" fontWeight="bold" color="success.main">
                            {formatCurrency(displayTotals.revenue)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    {/* EXPENSES SECTION - ALL ITEMIZED */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: "error.main" }}>
                        Expenses
                      </Typography>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {aggregatedSummary.expenses.length > 0 ? (
                          <>
                            {aggregatedSummary.expenses.map((item, idx) => (
                              <Box
                                key={item.key}
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  py: 0.5,
                                  borderBottom: idx === aggregatedSummary.expenses.length - 1 ? "2px solid #333" : "1px solid #ddd",
                                }}
                              >
                                <Typography variant="body2">{item.displayName}</Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {formatCurrency(item.total)}
                                </Typography>
                              </Box>
                            ))}
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary">No expense data</Typography>
                        )}
                        <Box sx={{ display: "flex", justifyContent: "space-between", py: 1, bgcolor: "error.light", px: 1, borderRadius: 1, mt: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold">Total Expenses</Typography>
                          <Typography variant="subtitle2" fontWeight="bold" color="error.main">
                            {formatCurrency(displayTotals.expense)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    {/* NET SUMMARY */}
                    <Grid item xs={12}>
                      <Box sx={{
                        display: "flex",
                        justifyContent: "space-around",
                        bgcolor: "#fff3e0",
                        p: 2,
                        borderRadius: 1,
                        border: "2px solid #ff9800"
                      }}>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography variant="caption" color="text.secondary" display="block">Net (Revenue - Expenses)</Typography>
                          <Typography
                            variant="h6"
                            fontWeight="bold"
                            color={displayTotals.revenue - displayTotals.expense >= 0 ? "success.main" : "error.main"}
                          >
                            {formatCurrency(displayTotals.revenue - displayTotals.expense)}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography variant="caption" color="text.secondary" display="block">Total Drivers</Typography>
                          <Typography variant="h6" fontWeight="bold">{displayTotals.driverCount}</Typography>
                        </Box>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography variant="caption" color="text.secondary" display="block">Period</Typography>
                          <Typography variant="body2" fontWeight="bold">{isAllRecordsLoaded ? "All Records" : "Loaded Pages"}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Detailed Revenue Breakdown */}
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    Revenue Breakdown {isAllRecordsLoaded ? "(Grand Total)" : "(Loaded Pages)"}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: "center", p: 1, bgcolor: "success.lighter", borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Lease Revenue
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          {formatCurrency(displayTotals.leaseRevenue)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: "center", p: 1, bgcolor: "success.lighter", borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Credit Card
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          {formatCurrency(displayTotals.creditCardRevenue)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: "center", p: 1, bgcolor: "success.lighter", borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Charges
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          {formatCurrency(displayTotals.chargesRevenue)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: "center", p: 1, bgcolor: "success.lighter", borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Other Revenue
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          {formatCurrency(displayTotals.otherRevenue)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Detailed Expense Breakdown */}
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    Expense Breakdown {isAllRecordsLoaded ? "(Grand Total)" : "(Loaded Pages)"}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: "center", p: 1, bgcolor: "error.lighter", borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Fixed Expense
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="error.main">
                          {formatCurrency(displayTotals.fixedExpense)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: "center", p: 1, bgcolor: "error.lighter", borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Lease Expense
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="error.main">
                          {formatCurrency(displayTotals.leaseExpense)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: "center", p: 1, bgcolor: "error.lighter", borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Variable Expense
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="error.main">
                          {formatCurrency(displayTotals.variableExpense)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: "center", p: 1, bgcolor: "error.lighter", borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Other Expense
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="error.main">
                          {formatCurrency(displayTotals.otherExpense)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Driver Summary Table - Dynamic Columns */}
                <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 1600 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "grey.100" }}>
                        <TableCell sx={{ minWidth: 70 }}>
                          <TableSortLabel
                            active={orderBy === "driverNumber"}
                            direction={orderBy === "driverNumber" ? order : "asc"}
                            onClick={() => handleSortChange("driverNumber")}
                          >
                            <Typography variant="caption" fontWeight="bold">Driver #</Typography>
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={{ minWidth: 120 }}>
                          <TableSortLabel
                            active={orderBy === "driverName"}
                            direction={orderBy === "driverName" ? order : "asc"}
                            onClick={() => handleSortChange("driverName")}
                          >
                            <Typography variant="caption" fontWeight="bold">Name</Typography>
                          </TableSortLabel>
                        </TableCell>

                        {/* ✅ Dynamic Revenue Columns */}
                        {revenueColumns.map(col => (
                          <TableCell key={col.key} align="right" sx={{ minWidth: 75, bgcolor: "#f5f5f5" }}>
                            <Typography variant="caption" fontWeight="bold">{col.displayName}</Typography>
                          </TableCell>
                        ))}

                        {/* Total Revenue */}
                        <TableCell align="right" sx={{ minWidth: 75, bgcolor: "#e8f5e9" }}>
                          <TableSortLabel
                            active={orderBy === "totalRevenue"}
                            direction={orderBy === "totalRevenue" ? order : "asc"}
                            onClick={() => handleSortChange("totalRevenue")}
                          >
                            <Typography variant="caption" fontWeight="bold" color="success.main">Total Rev</Typography>
                          </TableSortLabel>
                        </TableCell>

                        {/* ✅ Dynamic Expense Columns */}
                        {expenseColumns.map(col => (
                          <TableCell key={col.key} align="right" sx={{ minWidth: 75, bgcolor: "#f5f5f5" }}>
                            <Typography variant="caption" fontWeight="bold">{col.displayName}</Typography>
                          </TableCell>
                        ))}

                        {/* Total Expense */}
                        <TableCell align="right" sx={{ minWidth: 75, bgcolor: "#ffebee" }}>
                          <TableSortLabel
                            active={orderBy === "totalExpense"}
                            direction={orderBy === "totalExpense" ? order : "asc"}
                            onClick={() => handleSortChange("totalExpense")}
                          >
                            <Typography variant="caption" fontWeight="bold" color="error.main">Total Exp</Typography>
                          </TableSortLabel>
                        </TableCell>

                        {/* Summary Section */}
                        <TableCell align="right" sx={{ minWidth: 80, bgcolor: "#fff3e0" }}>
                          <TableSortLabel
                            active={orderBy === "netOwed"}
                            direction={orderBy === "netOwed" ? order : "asc"}
                            onClick={() => handleSortChange("netOwed")}
                          >
                            <Typography variant="caption" fontWeight="bold">Net Owed</Typography>
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right" sx={{ minWidth: 70, bgcolor: "#fff3e0" }}>
                          <Typography variant="caption" fontWeight="bold">Paid</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ minWidth: 85, bgcolor: "#fff3e0" }}>
                          <TableSortLabel
                            active={orderBy === "outstanding"}
                            direction={orderBy === "outstanding" ? order : "asc"}
                            onClick={() => handleSortChange("outstanding")}
                          >
                            <Typography variant="caption" fontWeight="bold">Outstanding</Typography>
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right" sx={{ minWidth: 85, bgcolor: "#fff3e0" }}>
                          <Typography variant="caption" fontWeight="bold">Due/Owed</Typography>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredDataComputed.map((driver) => {
                        const totalRevenue = driver.totalRevenue || 0;
                        const totalExpense = driver.totalExpense || 0;

                        return (
                          <TableRow
                            key={driver.driverNumber}
                            hover
                            onClick={() => openDriverDetailModal(driver)}
                            sx={{
                              "&:hover": { bgcolor: "action.hover", cursor: "pointer" },
                              bgcolor: driver.isOwner ? "info.light" : "inherit",
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {driver.driverNumber}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {driver.driverName}
                                {driver.isOwner && (
                                  <Typography
                                    component="span"
                                    variant="caption"
                                    sx={{ ml: 1, color: "primary.main" }}
                                  >
                                    (Owner)
                                  </Typography>
                                )}
                              </Typography>
                            </TableCell>

                            {/* ✅ Dynamic Revenue Columns */}
                            {revenueColumns.map(col => (
                              <TableCell key={col.key} align="right" sx={{ bgcolor: "#f9f9f9" }}>
                                {formatCurrency(getRevAmount(driver, col.key))}
                              </TableCell>
                            ))}

                            {/* Total Revenue */}
                            <TableCell align="right" sx={{ bgcolor: "#e8f5e9", fontWeight: "bold" }}>
                              <Typography variant="body2" fontWeight="bold" color="success.main">
                                {formatCurrency(totalRevenue)}
                              </Typography>
                            </TableCell>

                            {/* ✅ Dynamic Expense Columns */}
                            {expenseColumns.map(col => (
                              <TableCell key={col.key} align="right" sx={{ bgcolor: "#f9f9f9" }}>
                                {formatCurrency(getExpAmount(driver, col.key))}
                              </TableCell>
                            ))}

                            {/* Total Expense */}
                            <TableCell align="right" sx={{ bgcolor: "#ffebee", fontWeight: "bold" }}>
                              <Typography variant="body2" fontWeight="bold" color="error.main">
                                {formatCurrency(totalExpense)}
                              </Typography>
                            </TableCell>

                            {/* Summary Columns */}
                            <TableCell align="right" sx={{ bgcolor: "#fff9e6" }}>
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                color={
                                  driver.netOwed > 0
                                    ? "success.main" // ✅ Green: Company owes driver money
                                    : driver.netOwed < 0
                                    ? "error.main" // ❌ Red: Driver owes company money
                                    : "text.primary" // Neutral: Zero balance
                                }
                              >
                                {formatCurrency(driver.netOwed)} {/* Show as-is: positive = company owes, negative = driver owes */}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ bgcolor: "#fff9e6" }}>
                              {formatCurrency(driver.paid)}
                            </TableCell>
                            <TableCell align="right" sx={{ bgcolor: "#fff9e6" }}>
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                color={
                                  driver.outstanding > 0
                                    ? "success.main" // ✅ Green: Company owes driver money
                                    : driver.outstanding < 0
                                    ? "error.main" // ❌ Red: Driver owes company money
                                    : "text.primary" // Neutral: Zero balance
                                }
                              >
                                {formatCurrency(driver.outstanding)} {/* Show as-is: positive = company owes, negative = driver owes */}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ bgcolor: "#fff9e6" }}>
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                color={
                                  driver.netOwed - driver.paid > 0
                                    ? "success.main" // ✅ Green: Company owes driver money
                                    : driver.netOwed - driver.paid < 0
                                    ? "error.main" // ❌ Red: Driver owes company money
                                    : "text.primary" // Neutral: Zero balance
                                }
                              >
                                {formatCurrency(driver.netOwed - driver.paid)} {/* Due: netOwed - paid, show as-is */}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {/* Revenue Subtotals Row */}
                      <TableRow sx={{ bgcolor: "#e8f5e9", borderTop: "2px solid #4caf50" }}>
                        <TableCell colSpan={2}>
                          <Typography variant="body2" fontWeight="bold" color="success.main">
                            REVENUE SUBTOTALS BY CATEGORY
                          </Typography>
                        </TableCell>
                        {/* ✅ Dynamic Revenue Subtotals */}
                        {revenueColumns.map(col => {
                          const revTotal = filteredDataComputed.reduce((sum, d) => sum + (getRevAmount(d, col.key) || 0), 0);
                          return (
                            <TableCell key={col.key} align="right" sx={{ bgcolor: "#f0f9f6", fontWeight: "bold" }}>
                              <Typography variant="body2" fontWeight="bold" color="success.main">
                                {formatCurrency(revTotal)}
                              </Typography>
                            </TableCell>
                          );
                        })}
                        {/* Total Revenue Subtotal */}
                        <TableCell align="right" sx={{ bgcolor: "#c8e6c9", fontWeight: "bold" }}>
                          <Typography variant="body2" fontWeight="bold" color="success.main" sx={{ fontSize: "1.05em" }}>
                            {formatCurrency(filteredDataComputed.reduce((sum, d) => sum + (d.totalRevenue || 0), 0))}
                          </Typography>
                        </TableCell>
                        <TableCell colSpan={expenseColumns.length + 5} />
                      </TableRow>

                      {/* Expense Subtotals Row */}
                      <TableRow sx={{ bgcolor: "#ffebee", borderTop: "2px solid #f44336" }}>
                        <TableCell colSpan={2}>
                          <Typography variant="body2" fontWeight="bold" color="error.main">
                            EXPENSE SUBTOTALS BY CATEGORY
                          </Typography>
                        </TableCell>
                        {revenueColumns.map(col => (
                          <TableCell key={col.key} sx={{ bgcolor: "#f9f9f9" }} />
                        ))}
                        <TableCell sx={{ bgcolor: "#e8f5e9" }} />
                        {/* ✅ Dynamic Expense Subtotals */}
                        {expenseColumns.map(col => {
                          const expTotal = filteredDataComputed.reduce((sum, d) => sum + (getExpAmount(d, col.key) || 0), 0);
                          return (
                            <TableCell key={col.key} align="right" sx={{ bgcolor: "#f0f6f9", fontWeight: "bold" }}>
                              <Typography variant="body2" fontWeight="bold" color="error.main">
                                {formatCurrency(expTotal)}
                              </Typography>
                            </TableCell>
                          );
                        })}
                        {/* Total Expense Subtotal */}
                        <TableCell align="right" sx={{ bgcolor: "#ffcdd2", fontWeight: "bold" }}>
                          <Typography variant="body2" fontWeight="bold" color="error.main" sx={{ fontSize: "1.05em" }}>
                            {formatCurrency(filteredDataComputed.reduce((sum, d) => sum + (d.totalExpense || 0), 0))}
                          </Typography>
                        </TableCell>
                        <TableCell colSpan={4} />
                      </TableRow>

                      {/* Grand Totals Row - Dynamic based on Driver Type Filter */}
                      {(() => {
                        const typeLabel =
                          driverTypeFilter === "DRIVERS_ONLY" ? "DRIVERS" :
                          driverTypeFilter === "OWNERS_ONLY" ? "OWNERS" :
                          "ALL DRIVERS";
                        const outstanding = filteredTotals.netOwed - filteredTotals.paid;

                        return (
                          <TableRow sx={{ bgcolor: isAllRecordsLoaded ? "success.light" : "info.light", fontWeight: "bold", borderTop: "3px solid #ff9800" }}>
                            <TableCell colSpan={2}>
                              <Typography variant="body2" fontWeight="bold">
                                {isAllRecordsLoaded
                                  ? `GRAND TOTALS (${typeLabel})`
                                  : `TOTALS (${filteredTotals.count} ${typeLabel.toLowerCase()} cached)`}
                              </Typography>
                            </TableCell>
                            {/* ✅ Dynamic Revenue Totals */}
                            {revenueColumns.map(col => {
                              const revTotal = filteredTotals.filtered.reduce((sum, d) => sum + (getRevAmount(d, col.key) || 0), 0);
                              return (
                                <TableCell key={col.key} align="right" sx={{ bgcolor: "#f5f5f5", fontWeight: "bold" }}>
                                  <Typography variant="body2" fontWeight="bold">
                                    {formatCurrency(revTotal)}
                                  </Typography>
                                </TableCell>
                              );
                            })}
                            {/* Total Revenue Grand Total */}
                            <TableCell align="right" sx={{ bgcolor: "#e8f5e9", fontWeight: "bold" }}>
                              <Typography variant="body2" fontWeight="bold" color="success.main" sx={{ fontSize: "1.1em" }}>
                                {formatCurrency(filteredTotals.revenue)}
                              </Typography>
                            </TableCell>
                            {/* ✅ Dynamic Expense Totals */}
                            {expenseColumns.map(col => {
                              const expTotal = filteredTotals.filtered.reduce((sum, d) => sum + (getExpAmount(d, col.key) || 0), 0);
                              return (
                                <TableCell key={col.key} align="right" sx={{ bgcolor: "#f5f5f5", fontWeight: "bold" }}>
                                  <Typography variant="body2" fontWeight="bold">
                                    {formatCurrency(expTotal)}
                                  </Typography>
                                </TableCell>
                              );
                            })}
                            {/* Total Expense Grand Total */}
                            <TableCell align="right" sx={{ bgcolor: "#ffebee", fontWeight: "bold" }}>
                              <Typography variant="body2" fontWeight="bold" color="error.main" sx={{ fontSize: "1.1em" }}>
                                {formatCurrency(filteredTotals.expense)}
                              </Typography>
                            </TableCell>
                            {/* Summary Totals */}
                            <TableCell align="right" sx={{ bgcolor: "#fff9e6", fontWeight: "bold" }}>
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                color={
                                  filteredTotals.netOwed > 0
                                    ? "success.main"
                                    : filteredTotals.netOwed < 0
                                    ? "error.main"
                                    : "text.primary"
                                }
                                sx={{ fontSize: "1.1em" }}
                              >
                                {formatCurrency(filteredTotals.netOwed)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ bgcolor: "#fff9e6" }}>
                              <Typography variant="caption" fontWeight="bold">
                                {formatCurrency(filteredTotals.paid)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ bgcolor: "#fff9e6" }}>
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                color={
                                  outstanding > 0
                                    ? "success.main"
                                    : outstanding < 0
                                    ? "error.main"
                                    : "text.primary"
                                }
                                sx={{ fontSize: "1.1em" }}
                              >
                                {formatCurrency(outstanding)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })()}


                      {/* Revenue Subtotal Row */}
                      <TableRow sx={{ bgcolor: "#e8f5e9", borderTop: "3px solid #4caf50" }}>
                        <TableCell colSpan={2}>
                          <Typography variant="body2" fontWeight="bold" color="success.main">
                            TOTAL REVENUES
                          </Typography>
                        </TableCell>
                        {revenueColumns.map(col => (
                          <TableCell key={col.key} align="right" sx={{ bgcolor: "#f5f5f5" }}>
                            {/* Empty cells under individual revenue columns */}
                          </TableCell>
                        ))}
                        <TableCell align="right" sx={{ bgcolor: "#e8f5e9" }}>
                          <Typography variant="body2" fontWeight="bold" color="success.main" sx={{ fontSize: "1.1em" }}>
                            {formatCurrency(displayTotals.revenue)}
                          </Typography>
                        </TableCell>
                        {expenseColumns.map(col => (
                          <TableCell key={col.key} align="right" sx={{ bgcolor: "#f5f5f5" }}>
                            {/* Empty cells under expense columns */}
                          </TableCell>
                        ))}
                        <TableCell colSpan={4} />
                      </TableRow>

                      {/* Expense Subtotal Row */}
                      <TableRow sx={{ bgcolor: "#ffebee", borderTop: "3px solid #f44336" }}>
                        <TableCell colSpan={2}>
                          <Typography variant="body2" fontWeight="bold" color="error.main">
                            TOTAL EXPENSES
                          </Typography>
                        </TableCell>
                        {revenueColumns.map(col => (
                          <TableCell key={col.key} align="right" sx={{ bgcolor: "#f5f5f5" }}>
                            {/* Empty cells under revenue columns */}
                          </TableCell>
                        ))}
                        <TableCell align="right" sx={{ bgcolor: "#e8f5e9" }}>
                          {/* Empty cell under Total Revenue */}
                        </TableCell>
                        {expenseColumns.map(col => (
                          <TableCell key={col.key} align="right" sx={{ bgcolor: "#f5f5f5" }}>
                            {/* Empty cells under individual expense columns */}
                          </TableCell>
                        ))}
                        <TableCell align="right" sx={{ bgcolor: "#ffebee" }}>
                          <Typography variant="body2" fontWeight="bold" color="error.main" sx={{ fontSize: "1.1em" }}>
                            {formatCurrency(displayTotals.expense)}
                          </Typography>
                        </TableCell>
                        <TableCell colSpan={3} />
                      </TableRow>

                      {/* Net Summary Row */}
                      <TableRow sx={{ bgcolor: "#fff3e0", borderTop: "3px solid #ff9800", borderBottom: "3px solid #ff9800" }}>
                        <TableCell colSpan={2}>
                          <Typography variant="body2" fontWeight="bold">
                            NET SUMMARY
                          </Typography>
                        </TableCell>
                        {revenueColumns.map(col => (
                          <TableCell key={col.key} align="right" sx={{ bgcolor: "#f5f5f5" }}>
                            {/* Empty cells */}
                          </TableCell>
                        ))}
                        <TableCell align="right" sx={{ bgcolor: "#e8f5e9" }}>
                          {/* Empty cell under Total Revenue */}
                        </TableCell>
                        {expenseColumns.map(col => (
                          <TableCell key={col.key} align="right" sx={{ bgcolor: "#f5f5f5" }}>
                            {/* Empty cells */}
                          </TableCell>
                        ))}
                        <TableCell align="right" sx={{ bgcolor: "#ffebee" }}>
                          {/* Empty cell under Total Expense */}
                        </TableCell>
                        <TableCell align="right" sx={{ bgcolor: "#fff9e6", fontWeight: "bold" }}>
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color={
                              displayTotals.netOwed > 0
                                ? "success.main"
                                : displayTotals.netOwed < 0
                                ? "error.main"
                                : "text.primary"
                            }
                            sx={{ fontSize: "1.1em" }}
                          >
                            {formatCurrency(displayTotals.netOwed)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ bgcolor: "#fff9e6" }}>
                          <Typography variant="caption" fontWeight="bold">
                            {formatCurrency(displayTotals.paid)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ bgcolor: "#fff9e6" }}>
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color={
                              (displayTotals.netOwed - displayTotals.paid) > 0
                                ? "success.main"
                                : (displayTotals.netOwed - displayTotals.paid) < 0
                                ? "error.main"
                                : "text.primary"
                            }
                            sx={{ fontSize: "1.1em" }}
                          >
                            {formatCurrency(displayTotals.netOwed - displayTotals.paid)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ bgcolor: "#fff9e6" }} />
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination Controls - ✅ LOCAL pagination (no API calls) */}
                {isAllRecordsLoaded && totalPages > 1 && (
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={handlePageChange}
                      color="primary"
                      size="large"
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                )}
              </>
            )}

            {/* No Data Message */}
            {!loading && !reportData && (
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <Assessment sx={{ fontSize: 80, color: "grey.400", mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Select a date range and click "Generate Report" to view driver summaries
                </Typography>
              </Paper>
            )}

            {/* Loading Indicator */}
            {loading && (
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {loadingMessage || "Generating report..."}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This may take up to 15 minutes for large date ranges
                </Typography>
              </Paper>
            )}

            {/* Driver Detail Modal */}
            <Dialog
              open={detailModalOpen}
              onClose={() => setDetailModalOpen(false)}
              maxWidth="lg"
              fullWidth
              PaperProps={{
                sx: { maxHeight: "90vh", borderRadius: 2 }
              }}
            >
              <DialogTitle sx={{ fontSize: "1.3rem", fontWeight: "bold" }}>
                {selectedDriver?.driverName} - Financial Details
                <Button
                  onClick={() => setDetailModalOpen(false)}
                  sx={{ position: "absolute", right: 8, top: 8 }}
                  size="small"
                >
                  <Close />
                </Button>
              </DialogTitle>

              <DialogContent dividers sx={{ p: 3 }}>
                {detailLoadingMessage ? (
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 4 }}>
                    <CircularProgress size={50} sx={{ mb: 2 }} />
                    <Typography variant="body1">{detailLoadingMessage}</Typography>
                  </Box>
                ) : driverDetailReport ? (
                  <Box>
                    {/* Period and Summary Info */}
                    <Box sx={{ mb: 3, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Period</Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {driverDetailReport.periodFrom} to {driverDetailReport.periodTo}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Type</Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {driverDetailReport.personType || (driverDetailReport.isOwner ? "OWNER" : "DRIVER")}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>

                    {/* Revenue Tabs */}
                    <Typography variant="h6" gutterBottom sx={{ mt: 3, fontWeight: "bold" }}>Revenue Details</Typography>
                    <Tabs value={revenueTabIndex} onChange={(e, val) => setRevenueTabIndex(val)} sx={{ mb: 2 }}>
                      <Tab label="All Revenues" />
                      <Tab label="Lease Income" />
                      <Tab label="Card Revenue" />
                      <Tab label="Account Charges" />
                      <Tab label="Other Revenue" />
                    </Tabs>

                    {revenueTabIndex === 0 && (
                      <Box sx={{ mb: 3 }}>
                        {driverDetailReport.revenues && driverDetailReport.revenues.length > 0 ? (
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: "#e8f5e9" }}>
                                  <TableCell><strong>Date</strong></TableCell>
                                  <TableCell><strong>Category</strong></TableCell>
                                  <TableCell><strong>Description</strong></TableCell>
                                  <TableCell align="right"><strong>Amount</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {[...driverDetailReport.revenues].sort((a, b) => {
                                  const dateA = new Date(a.revenueDate || "");
                                  const dateB = new Date(b.revenueDate || "");
                                  return dateB - dateA;
                                }).map((rev, idx) => (
                                  <TableRow key={idx} hover>
                                    <TableCell>{rev.revenueDate || "-"}</TableCell>
                                    <TableCell>{rev.categoryName || "-"}</TableCell>
                                    <TableCell>{rev.description || "-"}</TableCell>
                                    <TableCell align="right" sx={{ color: "#388e3c", fontWeight: "bold" }}>
                                      {formatCurrency(rev.amount)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                                {/* Revenue Subtotal Row */}
                                <TableRow sx={{ bgcolor: "#c8e6c9", borderTop: "2px solid #4caf50" }}>
                                  <TableCell colSpan={3} align="right">
                                    <Typography variant="body2" fontWeight="bold" color="success.main">
                                      TOTAL REVENUE
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2" fontWeight="bold" color="success.main" sx={{ fontSize: "1.1em" }}>
                                      {formatCurrency(driverDetailReport.revenues.reduce((sum, r) => sum + (r.amount || 0), 0))}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography color="textSecondary">No revenues found</Typography>
                        )}
                      </Box>
                    )}

                    {revenueTabIndex === 1 && (
                      <Box sx={{ mb: 3 }}>
                        {driverDetailReport.revenues && driverDetailReport.revenues.filter(r => r.revenueSubType === "LEASE_INCOME").length > 0 ? (
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
                                {useMemo(() => {
                                  // Group by cab number
                                  const grouped = {};
                                  driverDetailReport.revenues.filter(r => r.revenueSubType === "LEASE_INCOME").forEach((rev) => {
                                    const cabNum = rev.description?.match(/Cab\s+(\d+)/)?.[1] || rev.cabNumber || "Unknown";
                                    if (!grouped[cabNum]) {
                                      grouped[cabNum] = [];
                                    }
                                    grouped[cabNum].push(rev);
                                  });

                                  // Sort cabs numerically, then sort items within each cab by date
                                  const sortedCabs = Object.keys(grouped).sort((a, b) => {
                                    const numA = parseInt(a) || 999;
                                    const numB = parseInt(b) || 999;
                                    return numA - numB;
                                  });

                                  let rows = [];
                                  let totalByTab = 0;

                                  sortedCabs.forEach((cab, cabIdx) => {
                                    const items = grouped[cab].sort((a, b) => {
                                      const dateA = new Date(a.revenueDate || "");
                                      const dateB = new Date(b.revenueDate || "");
                                      return dateB - dateA;
                                    });

                                    const cabSubtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
                                    totalByTab += cabSubtotal;

                                    // Add cab header row
                                    rows.push(
                                      <TableRow key={`cab-header-${cab}`} sx={{ bgcolor: "#c8e6c9", fontWeight: "bold" }}>
                                        <TableCell colSpan={4}>
                                          <Typography variant="body2" fontWeight="bold" color="success.main">
                                            Cab {cab}
                                          </Typography>
                                        </TableCell>
                                      </TableRow>
                                    );

                                    // Add items for this cab
                                    items.forEach((rev, itemIdx) => {
                                      rows.push(
                                        <TableRow key={`${cab}-${itemIdx}`} hover>
                                          <TableCell sx={{ fontWeight: "bold", color: "#388e3c" }}>Cab {cab}</TableCell>
                                          <TableCell>{rev.revenueDate || "-"}</TableCell>
                                          <TableCell>{rev.description || "-"}</TableCell>
                                          <TableCell align="right" sx={{ color: "#388e3c", fontWeight: "bold" }}>
                                            {formatCurrency(rev.amount)}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    });

                                    // Add subtotal for this cab
                                    rows.push(
                                      <TableRow key={`cab-subtotal-${cab}`} sx={{ bgcolor: "#e8f5e9", borderTop: "1px solid #4caf50" }}>
                                        <TableCell colSpan={3} align="right">
                                          <Typography variant="caption" fontWeight="bold" color="success.main">
                                            Cab {cab} Subtotal:
                                          </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                          <Typography variant="caption" fontWeight="bold" color="success.main">
                                            {formatCurrency(cabSubtotal)}
                                          </Typography>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  });

                                  // Add total row
                                  rows.push(
                                    <TableRow key="total" sx={{ bgcolor: "#c8e6c9", borderTop: "2px solid #4caf50" }}>
                                      <TableCell colSpan={3} align="right">
                                        <Typography variant="body2" fontWeight="bold" color="success.main">
                                          TOTAL LEASE INCOME
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="right">
                                        <Typography variant="body2" fontWeight="bold" color="success.main" sx={{ fontSize: "1.1em" }}>
                                          {formatCurrency(totalByTab)}
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  );

                                  return rows;
                                }, [driverDetailReport])}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography color="textSecondary">No lease income found</Typography>
                        )}
                      </Box>
                    )}

                    {revenueTabIndex === 2 && (
                      <Box sx={{ mb: 3 }}>
                        {driverDetailReport.revenues && driverDetailReport.revenues.filter(r => r.revenueSubType === "CARD_REVENUE").length > 0 ? (
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: "#e8f5e9" }}>
                                  <TableCell><strong>Date</strong></TableCell>
                                  <TableCell><strong>Description</strong></TableCell>
                                  <TableCell align="right"><strong>Amount</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {[...driverDetailReport.revenues.filter(r => r.revenueSubType === "CARD_REVENUE")].sort((a, b) => {
                                  const dateA = new Date(a.revenueDate || "");
                                  const dateB = new Date(b.revenueDate || "");
                                  return dateB - dateA;
                                }).map((rev, idx) => (
                                  <TableRow key={idx} hover>
                                    <TableCell>{rev.revenueDate || "-"}</TableCell>
                                    <TableCell>{rev.description || "-"}</TableCell>
                                    <TableCell align="right" sx={{ color: "#388e3c", fontWeight: "bold" }}>
                                      {formatCurrency(rev.amount)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                                {/* Card Revenue Subtotal */}
                                <TableRow sx={{ bgcolor: "#c8e6c9", borderTop: "2px solid #4caf50" }}>
                                  <TableCell colSpan={2} align="right">
                                    <Typography variant="body2" fontWeight="bold" color="success.main">
                                      TOTAL CARD REVENUE
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2" fontWeight="bold" color="success.main" sx={{ fontSize: "1.1em" }}>
                                      {formatCurrency(driverDetailReport.revenues.filter(r => r.revenueSubType === "CARD_REVENUE").reduce((sum, r) => sum + (r.amount || 0), 0))}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography color="textSecondary">No card revenue found</Typography>
                        )}
                      </Box>
                    )}

                    {revenueTabIndex === 3 && (
                      <Box sx={{ mb: 3 }}>
                        {driverDetailReport.revenues && driverDetailReport.revenues.filter(r => r.revenueSubType === "ACCOUNT_REVENUE").length > 0 ? (
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: "#e8f5e9" }}>
                                  <TableCell><strong>Date</strong></TableCell>
                                  <TableCell><strong>Account</strong></TableCell>
                                  <TableCell><strong>Description</strong></TableCell>
                                  <TableCell align="right"><strong>Amount</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {[...driverDetailReport.revenues.filter(r => r.revenueSubType === "ACCOUNT_REVENUE")].sort((a, b) => {
                                  const dateA = new Date(a.revenueDate || "");
                                  const dateB = new Date(b.revenueDate || "");
                                  return dateB - dateA;
                                }).map((rev, idx) => (
                                  <TableRow key={idx} hover>
                                    <TableCell>{rev.revenueDate || "-"}</TableCell>
                                    <TableCell>{rev.accountName || "-"}</TableCell>
                                    <TableCell>{rev.description || "-"}</TableCell>
                                    <TableCell align="right" sx={{ color: "#388e3c", fontWeight: "bold" }}>
                                      {formatCurrency(rev.amount)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                                {/* Account Charges Subtotal */}
                                <TableRow sx={{ bgcolor: "#c8e6c9", borderTop: "2px solid #4caf50" }}>
                                  <TableCell colSpan={3} align="right">
                                    <Typography variant="body2" fontWeight="bold" color="success.main">
                                      TOTAL ACCOUNT CHARGES
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2" fontWeight="bold" color="success.main" sx={{ fontSize: "1.1em" }}>
                                      {formatCurrency(driverDetailReport.revenues.filter(r => r.revenueSubType === "ACCOUNT_REVENUE").reduce((sum, r) => sum + (r.amount || 0), 0))}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography color="textSecondary">No account charges found</Typography>
                        )}
                      </Box>
                    )}

                    {revenueTabIndex === 4 && (
                      <Box sx={{ mb: 3 }}>
                        {driverDetailReport.revenues && driverDetailReport.revenues.filter(r => r.revenueSubType === "OTHER_REVENUE").length > 0 ? (
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: "#e8f5e9" }}>
                                  <TableCell><strong>Date</strong></TableCell>
                                  <TableCell><strong>Description</strong></TableCell>
                                  <TableCell align="right"><strong>Amount</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {[...driverDetailReport.revenues.filter(r => r.revenueSubType === "OTHER_REVENUE")].sort((a, b) => {
                                  const dateA = new Date(a.revenueDate || "");
                                  const dateB = new Date(b.revenueDate || "");
                                  return dateB - dateA;
                                }).map((rev, idx) => (
                                  <TableRow key={idx} hover>
                                    <TableCell>{rev.revenueDate || "-"}</TableCell>
                                    <TableCell>{rev.description || "-"}</TableCell>
                                    <TableCell align="right" sx={{ color: "#388e3c", fontWeight: "bold" }}>
                                      {formatCurrency(rev.amount)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                                {/* Other Revenue Subtotal */}
                                <TableRow sx={{ bgcolor: "#c8e6c9", borderTop: "2px solid #4caf50" }}>
                                  <TableCell colSpan={2} align="right">
                                    <Typography variant="body2" fontWeight="bold" color="success.main">
                                      TOTAL OTHER REVENUE
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2" fontWeight="bold" color="success.main" sx={{ fontSize: "1.1em" }}>
                                      {formatCurrency(driverDetailReport.revenues.filter(r => r.revenueSubType === "OTHER_REVENUE").reduce((sum, r) => sum + (r.amount || 0), 0))}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography color="textSecondary">No other revenue found</Typography>
                        )}
                      </Box>
                    )}

                    {/* Expense Tabs */}
                    <Typography variant="h6" gutterBottom sx={{ mt: 3, fontWeight: "bold" }}>Expense Details</Typography>
                    <Tabs value={expenseTabIndex} onChange={(e, val) => setExpenseTabIndex(val)} sx={{ mb: 2 }}>
                      <Tab label="All Expenses" />
                      <Tab label="Recurring Expenses" />
                      <Tab label="One-Time Expenses" />
                    </Tabs>

                    {expenseTabIndex === 0 && (
                      <Box sx={{ mb: 3 }}>
                        {driverDetailReport.recurringExpenses && driverDetailReport.recurringExpenses.length > 0 ? (
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Recurring Expenses</Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ bgcolor: "#ffebee" }}>
                                    <TableCell><strong>Category</strong></TableCell>
                                    <TableCell><strong>Description</strong></TableCell>
                                    <TableCell align="right"><strong>Amount</strong></TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {driverDetailReport.recurringExpenses.map((exp, idx) => (
                                    <TableRow key={idx} hover>
                                      <TableCell>{exp.categoryName || "-"}</TableCell>
                                      <TableCell>{exp.description || exp.entityDescription || "-"}</TableCell>
                                      <TableCell align="right" sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                                        {formatCurrency(exp.amount)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                  {/* Recurring Expenses Subtotal */}
                                  <TableRow sx={{ bgcolor: "#ffcdd2", borderTop: "2px solid #f44336" }}>
                                    <TableCell colSpan={2} align="right">
                                      <Typography variant="body2" fontWeight="bold" color="error.main">
                                        RECURRING SUBTOTAL
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Typography variant="body2" fontWeight="bold" color="error.main" sx={{ fontSize: "1.05em" }}>
                                        {formatCurrency(driverDetailReport.recurringExpenses.reduce((sum, e) => sum + (e.amount || 0), 0))}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        ) : null}

                        {driverDetailReport.oneTimeExpenses && driverDetailReport.oneTimeExpenses.length > 0 ? (
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>One-Time Expenses</Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ bgcolor: "#ffebee" }}>
                                    <TableCell><strong>Date</strong></TableCell>
                                    <TableCell><strong>Category</strong></TableCell>
                                    <TableCell><strong>Description</strong></TableCell>
                                    <TableCell align="right"><strong>Amount</strong></TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {[...driverDetailReport.oneTimeExpenses].sort((a, b) => {
                                    const dateA = new Date(a.date || "");
                                    const dateB = new Date(b.date || "");
                                    return dateB - dateA;
                                  }).map((exp, idx) => (
                                    <TableRow key={idx} hover>
                                      <TableCell>{exp.date || "-"}</TableCell>
                                      <TableCell>{exp.categoryName || "-"}</TableCell>
                                      <TableCell>{exp.description || "-"}</TableCell>
                                      <TableCell align="right" sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                                        {formatCurrency(exp.amount)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                  {/* One-Time Expenses Subtotal */}
                                  <TableRow sx={{ bgcolor: "#ffcdd2", borderTop: "2px solid #f44336" }}>
                                    <TableCell colSpan={3} align="right">
                                      <Typography variant="body2" fontWeight="bold" color="error.main">
                                        ONE-TIME SUBTOTAL
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Typography variant="body2" fontWeight="bold" color="error.main" sx={{ fontSize: "1.05em" }}>
                                        {formatCurrency(driverDetailReport.oneTimeExpenses.reduce((sum, e) => sum + (e.amount || 0), 0))}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        ) : null}

                        {(!driverDetailReport.recurringExpenses || driverDetailReport.recurringExpenses.length === 0) &&
                         (!driverDetailReport.oneTimeExpenses || driverDetailReport.oneTimeExpenses.length === 0) && (
                          <Typography color="textSecondary">No expenses found</Typography>
                        )}
                      </Box>
                    )}

                    {expenseTabIndex === 1 && (
                      <Box sx={{ mb: 3 }}>
                        {driverDetailReport.recurringExpenses && driverDetailReport.recurringExpenses.length > 0 ? (
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: "#ffebee" }}>
                                  <TableCell><strong>Category</strong></TableCell>
                                  <TableCell><strong>Description</strong></TableCell>
                                  <TableCell align="right"><strong>Amount</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {driverDetailReport.recurringExpenses.map((exp, idx) => (
                                  <TableRow key={idx} hover>
                                    <TableCell>{exp.categoryName || "-"}</TableCell>
                                    <TableCell>{exp.description || exp.entityDescription || "-"}</TableCell>
                                    <TableCell align="right" sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                                      {formatCurrency(exp.amount)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                                {/* Recurring Expenses Subtotal */}
                                <TableRow sx={{ bgcolor: "#ffcdd2", borderTop: "2px solid #f44336" }}>
                                  <TableCell colSpan={2} align="right">
                                    <Typography variant="body2" fontWeight="bold" color="error.main">
                                      TOTAL RECURRING EXPENSES
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2" fontWeight="bold" color="error.main" sx={{ fontSize: "1.1em" }}>
                                      {formatCurrency(driverDetailReport.recurringExpenses.reduce((sum, e) => sum + (e.amount || 0), 0))}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography color="textSecondary">No recurring expenses found</Typography>
                        )}
                      </Box>
                    )}

                    {expenseTabIndex === 2 && (
                      <Box sx={{ mb: 3 }}>
                        {driverDetailReport.oneTimeExpenses && driverDetailReport.oneTimeExpenses.length > 0 ? (
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: "#ffebee" }}>
                                  <TableCell><strong>Date</strong></TableCell>
                                  <TableCell><strong>Category</strong></TableCell>
                                  <TableCell><strong>Description</strong></TableCell>
                                  <TableCell align="right"><strong>Amount</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {[...driverDetailReport.oneTimeExpenses].sort((a, b) => {
                                  const dateA = new Date(a.date || "");
                                  const dateB = new Date(b.date || "");
                                  return dateB - dateA;
                                }).map((exp, idx) => (
                                  <TableRow key={idx} hover>
                                    <TableCell>{exp.date || "-"}</TableCell>
                                    <TableCell>{exp.categoryName || "-"}</TableCell>
                                    <TableCell>{exp.description || "-"}</TableCell>
                                    <TableCell align="right" sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                                      {formatCurrency(exp.amount)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                                {/* One-Time Expenses Subtotal */}
                                <TableRow sx={{ bgcolor: "#ffcdd2", borderTop: "2px solid #f44336" }}>
                                  <TableCell colSpan={3} align="right">
                                    <Typography variant="body2" fontWeight="bold" color="error.main">
                                      TOTAL ONE-TIME EXPENSES
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2" fontWeight="bold" color="error.main" sx={{ fontSize: "1.1em" }}>
                                      {formatCurrency(driverDetailReport.oneTimeExpenses.reduce((sum, e) => sum + (e.amount || 0), 0))}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography color="textSecondary">No one-time expenses found</Typography>
                        )}
                      </Box>
                    )}

                    {/* Summary Footer */}
                    {driverDetailReport && (
                      <Box sx={{ mt: 3, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">Total Revenue</Typography>
                            <Typography variant="body2" fontWeight="bold" sx={{ color: "#388e3c" }}>
                              {formatCurrency(driverDetailReport.totalRevenues)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">Total Expenses</Typography>
                            <Typography variant="body2" fontWeight="bold" sx={{ color: "#d32f2f" }}>
                              {formatCurrency(driverDetailReport.totalExpenses)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">Net Due</Typography>
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              sx={{ color: driverDetailReport.netDue > 0 ? "#d32f2f" : "#388e3c" }}
                            >
                              {formatCurrency(-driverDetailReport.netDue)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">Paid</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {formatCurrency(driverDetailReport.paidAmount)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Typography color="textSecondary">No data available</Typography>
                )}
              </DialogContent>

              <DialogActions sx={{ p: 2 }}>
                <Button onClick={() => setDetailModalOpen(false)} variant="outlined">Close</Button>
              </DialogActions>
            </Dialog>
        </Container>
      </Box>
    </LocalizationProvider>
  );
}