"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import GlobalNav from "../components/GlobalNav";
import {
  Box, Typography, Paper, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, CircularProgress, Alert, Grid, Pagination,
  Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch, Stack,
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
  const [allRecords, setAllRecords] = useState([]);  // Cache all records locally
  const [isAllRecordsLoaded, setIsAllRecordsLoaded] = useState(false);  // Track if fully loaded
  const [loadingProgress, setLoadingProgress] = useState(0);  // Progress for loading all records
  const [runningTotals, setRunningTotals] = useState(null);  // Accumulate page totals as pages arrive
  const [nextPageToFetch, setNextPageToFetch] = useState(0);  // Next cached page to fetch (0-indexed)
  const [totalPagesFromApi, setTotalPagesFromApi] = useState(0);  // Total pages reported by backend

  // Async job state
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null); // { status, pagesReady, totalPages, processedDrivers, totalDrivers, progressPercent }
  const [pollingRef] = useState({ current: null }); // polling interval ref
  const [hasRunOnce, setHasRunOnce] = useState(false); // enables "Refresh Report" button

  // Search/filter state
  const [searchDriverNumber, setSearchDriverNumber] = useState("");
  const [searchDriverName, setSearchDriverName] = useState("");
  const [driverTypeFilter, setDriverTypeFilter] = useState("ALL"); // ALL, DRIVER, OWNER
  const [quickMode, setQuickMode] = useState(false); // Quick mode: skip detailed breakdowns

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

  // Fetch a cached page from the BE and append to local state
  const fetchCachedPage = async (activeJobId, pageNum, isFirstPage = false) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(
      `${API_BASE_URL}/reports/driver-summary/jobs/${activeJobId}/page/${pageNum}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
        timeout: 30000,
      }
    );

    const pageData = response.data.driverSummaries || [];
    const fetchedPage = pageNum + 1;

    setNextPageToFetch(fetchedPage);

    // Append records to local cache
    setAllRecords(prev => [...prev, ...pageData]);

    // Accumulate running totals from this page
    setRunningTotals(prev => ({
      revenue: (prev?.revenue || 0) + (response.data.pageTotalRevenue || 0),
      expense: (prev?.expense || 0) + (response.data.pageTotalExpense || 0),
      netOwed: (prev?.netOwed || 0) + (response.data.pageNetOwed || 0),
      previousBalance: (prev?.previousBalance || 0) + (response.data.pagePreviousBalance || 0),
      paid: (prev?.paid || 0) + (response.data.pageTotalPaid || 0),
      outstanding: (prev?.outstanding || 0) + (response.data.pageTotalOutstanding || 0),
      leaseRevenue: (prev?.leaseRevenue || 0) + (response.data.pageLeaseRevenue || 0),
      creditCardRevenue: (prev?.creditCardRevenue || 0) + (response.data.pageCreditCardRevenue || 0),
      chargesRevenue: (prev?.chargesRevenue || 0) + (response.data.pageChargesRevenue || 0),
      otherRevenue: (prev?.otherRevenue || 0) + (response.data.pageOtherRevenue || 0),
      fixedExpense: (prev?.fixedExpense || 0) + (response.data.pageFixedExpense || 0),
      leaseExpense: (prev?.leaseExpense || 0) + (response.data.pageLeaseExpense || 0),
      variableExpense: (prev?.variableExpense || 0) + (response.data.pageVariableExpense || 0),
      otherExpense: (prev?.otherExpense || 0) + (response.data.pageOtherExpense || 0),
      driverCount: response.data.totalElements || 0,
    }));

    if (isFirstPage) {
      setReportData(response.data);
      setPage(1);
    }

    // If grand totals are present (job completed), use them
    if (response.data.grandTotalRevenue != null) {
      setRunningTotals(prev => ({
        ...prev,
        revenue: response.data.grandTotalRevenue,
        expense: response.data.grandTotalExpense,
        netOwed: response.data.grandNetOwed,
        previousBalance: response.data.grandPreviousBalance,
        paid: response.data.grandTotalPaid,
        leaseRevenue: response.data.grandTotalLeaseRevenue,
        creditCardRevenue: response.data.grandTotalCreditCardRevenue,
        chargesRevenue: response.data.grandTotalChargesRevenue,
        otherRevenue: response.data.grandTotalOtherRevenue,
        fixedExpense: response.data.grandTotalFixedExpense,
        leaseExpense: response.data.grandTotalLeaseExpense,
        variableExpense: response.data.grandTotalVariableExpense,
        otherExpense: response.data.grandTotalOtherExpense,
        driverCount: response.data.totalElements || prev?.driverCount || 0,
      }));
    }

    return response.data;
  };

  // Poll job status — keeps running until COMPLETED/FAILED
  // Updates jobStatus so the "Next 25" button area always shows live BE progress
  const startPolling = (activeJobId) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    let firstPageFetched = false;

    pollingRef.current = setInterval(async () => {
      try {
        const token = localStorage.getItem("token");
        const resp = await axios.get(
          `${API_BASE_URL}/reports/driver-summary/jobs/${activeJobId}/status`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            },
            timeout: 10000,
          }
        );

        const status = resp.data;
        setJobStatus(status);

        // Keep totalPagesFromApi in sync with what BE reports
        if (status.totalPages > 0) {
          setTotalPagesFromApi(status.totalPages);
        }

        if (status.status === "PROCESSING" && !firstPageFetched) {
          setLoadingMessage(
            `Processing drivers... ${status.processedDrivers} of ${status.totalDrivers} (${status.progressPercent}%)`
          );
        }

        // Auto-fetch the first page as soon as it's ready
        if (status.pagesReady > 0 && !firstPageFetched) {
          firstPageFetched = true;
          try {
            await fetchCachedPage(activeJobId, 0, true);
          } catch (err) {
            console.error("Error auto-fetching first page:", err);
          }
          setLoading(false);
          setLoadingMessage("");
        }

        // Stop polling when done
        if (status.status === "COMPLETED" || status.status === "FAILED") {
          clearInterval(pollingRef.current);
          pollingRef.current = null;

          if (status.status === "COMPLETED") {
            setTotalPagesFromApi(status.totalPages);
          }

          if (status.status === "FAILED") {
            setError(status.message || "Report generation failed");
            setLoading(false);
            setLoadingMessage("");
          } else if (!firstPageFetched) {
            try {
              await fetchCachedPage(activeJobId, 0, true);
            } catch (err) {
              console.error("Error fetching first page:", err);
            }
            setLoading(false);
            setLoadingMessage("");
          }
        }
      } catch (err) {
        console.error("Error polling job status:", err);
      }
    }, 2000);
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Generate Report: kick off async BE generation, poll for first page
  const generateReport = async (sortField = "lastName", sortDirection = "asc") => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    if (daysDiff > 31) {
      setError("Report period cannot exceed 31 days. Please select a shorter date range.");
      return;
    }

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    // Reset state
    setAllRecords([]);
    setReportData(null);
    setIsAllRecordsLoaded(false);
    setLoadingProgress(0);
    setRunningTotals(null);
    setNextPageToFetch(0);
    setTotalPagesFromApi(0);
    setJobId(null);
    setJobStatus(null);
    setLoading(true);
    setLoadingMessage("Starting report generation...");
    setError("");

    try {
      const token = localStorage.getItem("token");
      const formattedStart = formatDateForAPI(startDate);
      const formattedEnd = formatDateForAPI(endDate);

      const response = await axios.post(
        `${API_BASE_URL}/reports/driver-summary/generate`,
        null,
        {
          params: {
            startDate: formattedStart,
            endDate: formattedEnd,
            personType: driverTypeFilter,
            quickMode: quickMode,
            sort: sortField,
            direction: sortDirection,
          },
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
          timeout: 30000,
        }
      );

      const newJobId = response.data.jobId;
      setJobId(newJobId);
      setHasRunOnce(true);
      setLoadingMessage("Report generation started. Waiting for first page...");
      startPolling(newJobId);

    } catch (err) {
      console.error("Error starting report generation:", err);
      setLoading(false);
      setLoadingMessage("");
      if (err.response?.status === 401) {
        setError("Session expired. Please sign in again.");
        setTimeout(() => router.push("/signin"), 2000);
      } else {
        setError(err.response?.data?.message || "Failed to start report generation");
      }
    }
  };

  // Refresh Report: invalidate cache and regenerate
  const refreshReport = async () => {
    // Invalidate old job cache if exists
    if (jobId) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(
          `${API_BASE_URL}/reports/driver-summary/jobs/${jobId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            },
          }
        );
      } catch (err) {
        // Ignore — cache may already be expired
      }
    }

    let sortField = orderBy;
    if (orderBy === "driverName") sortField = "lastName";
    generateReport(sortField, order);
  };

  // Load More: user clicks to fetch the next 25 from BE cache
  const loadMoreRecords = async () => {
    if (!jobId) return;
    setLoading(true);
    setLoadingMessage(`Loading page ${nextPageToFetch + 1}...`);
    try {
      await fetchCachedPage(jobId, nextPageToFetch, false);

      // Check if we've now fetched all pages (job done + all pages fetched)
      const newNextPage = nextPageToFetch + 1;
      if (jobStatus?.status === "COMPLETED" && newNextPage >= (jobStatus.totalPages || 0)) {
        setIsAllRecordsLoaded(true);
      }
    } catch (err) {
      console.error("Error loading more records:", err);
      if (err.response?.status === 404) {
        setError("Page not ready yet. The backend is still generating. Try again in a moment.");
      } else if (err.response?.status === 401) {
        setError("Session expired. Please sign in again.");
        setTimeout(() => router.push("/signin"), 2000);
      } else {
        setError("Failed to load next page.");
      }
    } finally {
      setLoading(false);
      setLoadingMessage("");
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
    generateReport(sortField, newOrder);
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
  // ✅ FIXED + DYNAMIC REVENUE COLUMNS
  // Fixed columns read directly from DTO fields (always present, correct order)
  // Dynamic columns come from breakdown array for any "other" revenue items
  const revenueColumns = useMemo(() => {
    const fixed = [
      { key: "CHARGES", displayName: "Charges", getAmount: (d) => d.chargesRevenue || 0 },
      { key: "CC", displayName: "Credit Cards", getAmount: (d) => d.creditCardRevenue || 0 },
      { key: "LEASE_INC", displayName: "Lease Income", getAmount: (d) => d.leaseRevenue || 0 },
    ];

    // Collect any other revenue items from breakdown (excluding fixed ones)
    const fixedKeys = new Set(["CC", "CHARGES", "LEASE_INC"]);
    const otherKeys = new Map();
    allRecords.forEach(d => {
      (d.revenueBreakdown || []).forEach(item => {
        if (!fixedKeys.has(item.key) && !otherKeys.has(item.key)) {
          otherKeys.set(item.key, item.displayName);
        }
      });
    });

    const dynamic = Array.from(otherKeys.entries()).map(([key, displayName]) => ({
      key,
      displayName,
      getAmount: (d) => (d.revenueBreakdown || []).find(i => i.key === key)?.amount || 0,
    }));

    return [...fixed, ...dynamic];
  }, [allRecords]);

  // ✅ FIXED + DYNAMIC EXPENSE COLUMNS
  // Fixed columns: Lease Expense, Insurance Mileage, Airport Trips (always present)
  // Dynamic columns: Dispatch, other recurring/onetime items from breakdown
  const expenseColumns = useMemo(() => {
    const fixed = [
      { key: "LEASE_EXP", displayName: "Lease Expense", getAmount: (d) => d.leaseExpense || 0 },
      { key: "INSURANCE", displayName: "Insurance Mileage", getAmount: (d) => d.insuranceMileageExpense || 0 },
      { key: "AIRPORT", displayName: "Airport Trips", getAmount: (d) => d.airportTripCost || 0 },
    ];

    // Collect dynamic expense items from breakdown (excluding fixed ones)
    const fixedKeys = new Set(["LEASE_EXP", "INSURANCE", "AIRPORT"]);
    const otherKeys = new Map();
    allRecords.forEach(d => {
      (d.expenseBreakdown || []).forEach(item => {
        if (!fixedKeys.has(item.key) && !otherKeys.has(item.key)) {
          otherKeys.set(item.key, item.displayName);
        }
      });
    });

    const dynamic = Array.from(otherKeys.entries()).map(([key, displayName]) => ({
      key,
      displayName,
      getAmount: (d) => (d.expenseBreakdown || []).find(i => i.key === key)?.amount || 0,
    }));

    return [...fixed, ...dynamic];
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

  // ✅ HELPER FUNCTIONS - use column's getAmount for fixed cols, breakdown lookup for dynamic
  const getRevAmount = (driver, key) => {
    const col = revenueColumns.find(c => c.key === key);
    return col ? col.getAmount(driver) : 0;
  };

  const getExpAmount = (driver, key) => {
    const col = expenseColumns.find(c => c.key === key);
    return col ? col.getAmount(driver) : 0;
  };

  // ✅ Get display totals - use running totals while loading, grand totals when complete
  const getDisplayTotals = () => {
    // ✅ All pages loaded: use backend grand totals (authoritative)
    if (isAllRecordsLoaded && reportData) {
      return {
        revenue: reportData.grandTotalRevenue || 0,
        expense: reportData.grandTotalExpense || 0,
        netOwed: reportData.grandNetOwed || 0,
        previousBalance: reportData.grandPreviousBalance || 0,
        paid: reportData.grandTotalPaid || 0,
        driverCount: reportData.totalElements || 0,
        leaseRevenue: reportData.grandTotalLeaseRevenue || 0,
        creditCardRevenue: reportData.grandTotalCreditCardRevenue || 0,
        chargesRevenue: reportData.grandTotalChargesRevenue || 0,
        otherRevenue: reportData.grandTotalOtherRevenue || 0,
        fixedExpense: reportData.grandTotalFixedExpense || 0,
        leaseExpense: reportData.grandTotalLeaseExpense || 0,
        variableExpense: reportData.grandTotalVariableExpense || 0,
        otherExpense: reportData.grandTotalOtherExpense || 0,
      };
    }

    // ✅ Still loading: use accumulated running totals from pages fetched so far
    if (runningTotals) {
      return {
        revenue: runningTotals.revenue || 0,
        expense: runningTotals.expense || 0,
        netOwed: runningTotals.netOwed || 0,
        previousBalance: runningTotals.previousBalance || 0,
        paid: runningTotals.paid || 0,
        driverCount: runningTotals.driverCount || 0,
        leaseRevenue: runningTotals.leaseRevenue || 0,
        creditCardRevenue: runningTotals.creditCardRevenue || 0,
        chargesRevenue: runningTotals.chargesRevenue || 0,
        otherRevenue: runningTotals.otherRevenue || 0,
        fixedExpense: runningTotals.fixedExpense || 0,
        leaseExpense: runningTotals.leaseExpense || 0,
        variableExpense: runningTotals.variableExpense || 0,
        otherExpense: runningTotals.otherExpense || 0,
      };
    }

    // No data yet
    return {
      revenue: 0, expense: 0, netOwed: 0, previousBalance: 0, paid: 0, driverCount: 0,
      leaseRevenue: 0, creditCardRevenue: 0, chargesRevenue: 0, otherRevenue: 0,
      fixedExpense: 0, leaseExpense: 0, variableExpense: 0, otherExpense: 0,
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
          timeout: 600000, // 10 minutes for detailed individual driver reports
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
      // Build headers: Driver #, Name, [dynamic revenue columns], Total Rev, [dynamic expense columns], Total Exp, Prev Due, Net Payable/Due, Paid, Outstanding
      const headers = ["Driver #", "Name"];
      revenueColumns.forEach(col => headers.push(col.displayName));
      headers.push("Total Rev");
      expenseColumns.forEach(col => headers.push(col.displayName));
      headers.push("Total Exp", "Prev Due", "Net Payable / Due", "Paid", "Outstanding");

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
        row.push(driver.totalExpense || 0, driver.previousBalance || 0, driver.netOwed || 0, driver.paid || 0, driver.outstanding || 0);

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
      headers.push("Total Exp", "Prev Due", "Net Payable / Due", "Paid", "Outstanding");

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
          formatCurrency(driver.previousBalance || 0),
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
        
        <Box sx={{ mt: 4, mb: 4, px: 3 }}>
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
              </Grid>
            </Paper>

            {/* Report Options */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Report Options
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Driver Type</InputLabel>
                    <Select
                      value={driverTypeFilter}
                      label="Driver Type"
                      onChange={(e) => {
                        setDriverTypeFilter(e.target.value);
                      }}
                    >
                      <MenuItem value="ALL">All (Drivers & Owners)</MenuItem>
                      <MenuItem value="DRIVER">Drivers Only</MenuItem>
                      <MenuItem value="OWNER">Owners Only</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={quickMode}
                        onChange={(e) => {
                          setQuickMode(e.target.checked);
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2">Quick Mode</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {quickMode ? "Fast (summary only)" : "Detailed (full breakdown)"}
                        </Typography>
                      </Box>
                    }
                  />
                </Grid>
              </Grid>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={() => {
                    let sortField = orderBy;
                    if (orderBy === "driverName") {
                      sortField = "lastName";
                    }
                    generateReport(sortField, order);
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={24} sx={{ mr: 1 }} />
                      {loadingProgress > 0 ? `Loading... ${loadingProgress}%` : "Loading..."}
                    </>
                  ) : "Generate Report"}
                </Button>
                {hasRunOnce && (
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={refreshReport}
                    disabled={loading}
                    sx={{ minWidth: 180 }}
                  >
                    Refresh Report
                  </Button>
                )}
              </Stack>
            </Paper>

            {/* Search Filters */}
            {(reportData || allRecords.length > 0) && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Search Filters
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
            {(reportData || allRecords.length > 0) && (
              <>
                {/* Status banner */}
                {!isAllRecordsLoaded && allRecords.length > 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {allRecords.length} drivers loaded.
                    {jobStatus?.status === "PROCESSING"
                      ? ` Backend still generating (${jobStatus.processedDrivers}/${jobStatus.totalDrivers} drivers, ${jobStatus.pagesReady} pages ready). `
                      : jobStatus?.status === "COMPLETED"
                        ? ` All ${jobStatus.totalPages} pages cached on server. `
                        : " "}
                    Totals shown are running totals. Use "Load Next 25" below for more.
                  </Alert>
                )}

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
                        {isAllRecordsLoaded ? displayTotals.driverCount : allRecords.length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {isAllRecordsLoaded
                          ? "All records cached"
                          : `Loading... ${loadingProgress}%`}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {isAllRecordsLoaded ? "Grand Total Revenue" : "Revenue (running)"}
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color="success.main" sx={{ opacity: isAllRecordsLoaded ? 1 : 0.7 }}>
                        {!isAllRecordsLoaded && "~"}{formatCurrency(displayTotals.revenue)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {isAllRecordsLoaded ? "All drivers" : `${loadingProgress}% loaded`}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {isAllRecordsLoaded ? "Grand Total Expense" : "Expense (running)"}
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color="error.main" sx={{ opacity: isAllRecordsLoaded ? 1 : 0.7 }}>
                        {!isAllRecordsLoaded && "~"}{formatCurrency(displayTotals.expense)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {isAllRecordsLoaded ? "All drivers" : `${loadingProgress}% loaded`}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {isAllRecordsLoaded ? "Grand Net Payable / Due" : "Net Payable / Due (running)"}
                      </Typography>
                      <Typography
                        variant="h5"
                        fontWeight="bold"
                        sx={{ opacity: isAllRecordsLoaded ? 1 : 0.7 }}
                        color={
                          displayTotals.netOwed > 0
                            ? "success.main"
                            : displayTotals.netOwed < 0
                            ? "error.main"
                            : "text.primary"
                        }
                      >
                        {!isAllRecordsLoaded && "~"}{formatCurrency(displayTotals.netOwed)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {isAllRecordsLoaded ? "Final totals" : "Partial — loading..."}
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
                          <Typography variant="caption" fontWeight="bold">Prev Due</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ minWidth: 100, bgcolor: "#fff3e0" }}>
                          <TableSortLabel
                            active={orderBy === "netOwed"}
                            direction={orderBy === "netOwed" ? order : "asc"}
                            onClick={() => handleSortChange("netOwed")}
                          >
                            <Typography variant="caption" fontWeight="bold">Net Payable / Due</Typography>
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
                                  (driver.previousBalance || 0) > 0
                                    ? "success.main"
                                    : (driver.previousBalance || 0) < 0
                                    ? "error.main"
                                    : "text.secondary"
                                }
                              >
                                {formatCurrency(driver.previousBalance || 0)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ bgcolor: "#fff9e6" }}>
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                color={
                                  driver.netOwed > 0
                                    ? "success.main"
                                    : driver.netOwed < 0
                                    ? "error.main"
                                    : "text.primary"
                                }
                              >
                                {formatCurrency(driver.netOwed)}
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
                        <TableCell colSpan={expenseColumns.length + 6} />
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
                        <TableCell colSpan={5} />
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
                              <Typography variant="body2" fontWeight="bold" sx={{ fontSize: "1.1em" }}>
                                {formatCurrency(filteredTotals.filtered.reduce((sum, d) => sum + (d.previousBalance || 0), 0))}
                              </Typography>
                            </TableCell>
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

                {/* Load More / Pagination Controls */}
                <Box sx={{ mt: 3 }}>
                  {/* Load Next 25 button — visible whenever there are more pages to fetch */}
                  {!isAllRecordsLoaded && allRecords.length > 0 && (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, mb: 2 }}>
                      {(() => {
                        const pagesReady = jobStatus?.pagesReady || 0;
                        const jobDone = jobStatus?.status === "COMPLETED";
                        const nextPageIsReady = nextPageToFetch < pagesReady;
                        const canLoad = nextPageIsReady || jobDone;
                        const totalPgs = jobDone ? (jobStatus?.totalPages || totalPagesFromApi) : pagesReady;
                        return (
                          <>
                            <Button
                              variant="contained"
                              size="large"
                              onClick={loadMoreRecords}
                              sx={{ minWidth: 350 }}
                              disabled={loading || !canLoad}
                            >
                              {loading
                                ? "Loading..."
                                : canLoad
                                  ? `Load Next 25 Drivers (Page ${nextPageToFetch + 1}${totalPgs > 0 ? ` of ${totalPgs}` : ""})`
                                  : `Waiting for page ${nextPageToFetch + 1}...`
                              }
                            </Button>

                            {/* Live BE progress bar */}
                            {jobStatus?.status === "PROCESSING" && (
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <CircularProgress size={16} />
                                <Typography variant="body2" color="text.secondary">
                                  Backend generating: {jobStatus.processedDrivers} of {jobStatus.totalDrivers} drivers processed ({jobStatus.progressPercent}%) — {pagesReady} page{pagesReady !== 1 ? "s" : ""} ready
                                </Typography>
                              </Box>
                            )}

                            {jobDone && !isAllRecordsLoaded && (
                              <Typography variant="body2" color="info.main">
                                All {jobStatus.totalPages} pages cached on server — click to load more
                              </Typography>
                            )}

                            <Typography variant="caption" color="text.secondary">
                              {allRecords.length} drivers loaded locally so far
                            </Typography>
                          </>
                        );
                      })()}
                    </Box>
                  )}

                  {/* Loading indicator when fetching a page */}
                  {loading && allRecords.length > 0 && (
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, mb: 2 }}>
                      <CircularProgress size={24} />
                      <Typography variant="body2" color="text.secondary">
                        {loadingMessage}
                      </Typography>
                    </Box>
                  )}

                  {/* All pages loaded locally */}
                  {isAllRecordsLoaded && (
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        All {allRecords.length} drivers loaded — browsing locally
                      </Typography>
                    </Box>
                  )}

                  {/* Local pagination (always shown when we have data) */}
                  {totalPages > 1 && (
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
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
                </Box>
              </>
            )}

            {/* No Data Message */}
            {!loading && !reportData && allRecords.length === 0 && (
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <Assessment sx={{ fontSize: 80, color: "grey.400", mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Select a date range and click "Generate Report" to view driver summaries
                </Typography>
              </Paper>
            )}

            {/* Loading Indicator - only show when no data yet (before first page arrives) */}
            {loading && allRecords.length === 0 && (
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {loadingMessage || "Generating report..."}
                </Typography>
                {jobStatus && jobStatus.status === "PROCESSING" && (
                  <Typography variant="body2" color="text.secondary">
                    Processing {jobStatus.processedDrivers} of {jobStatus.totalDrivers} drivers ({jobStatus.progressPercent}%)
                    — {jobStatus.pagesReady} pages ready
                  </Typography>
                )}
                {!jobStatus && (
                  <Typography variant="body2" color="text.secondary">
                    Report is being generated in the background. First results will appear shortly.
                  </Typography>
                )}
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
                                {(() => {
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
                                })()}
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
                    <Tabs value={expenseTabIndex} onChange={(e, val) => setExpenseTabIndex(val)} sx={{ mb: 2 }} variant="scrollable" scrollButtons="auto">
                      <Tab label="All Expenses" />
                      <Tab label="Recurring Expenses" />
                      <Tab label="Lease Expense" />
                      <Tab label="One-Time Expenses" />
                      <Tab label="Airport Trips" />
                    </Tabs>

                    {expenseTabIndex === 0 && (
                      <Box sx={{ mb: 3 }}>
                        {/* All Expenses - Summary view */}
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
                                  <TableRow sx={{ bgcolor: "#ffcdd2", borderTop: "2px solid #f44336" }}>
                                    <TableCell colSpan={2} align="right">
                                      <Typography variant="body2" fontWeight="bold" color="error.main">RECURRING SUBTOTAL</Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Typography variant="body2" fontWeight="bold" color="error.main" sx={{ fontSize: "1.05em" }}>
                                        {formatCurrency(driverDetailReport.totalRecurringExpenses || driverDetailReport.recurringExpenses.reduce((sum, e) => sum + (e.amount || 0), 0))}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        ) : null}

                        {/* Lease Expenses (from oneTimeExpenses with categoryCode LEASE_EXP) */}
                        {(() => {
                          const leaseItems = (driverDetailReport.oneTimeExpenses || []).filter(e => e.categoryCode === "LEASE_EXP");
                          if (leaseItems.length === 0) return null;
                          return (
                            <Box sx={{ mb: 3 }}>
                              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Lease Expenses</Typography>
                              <TableContainer>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow sx={{ bgcolor: "#ffebee" }}>
                                      <TableCell><strong>Date</strong></TableCell>
                                      <TableCell><strong>Description</strong></TableCell>
                                      <TableCell align="right"><strong>Fixed</strong></TableCell>
                                      <TableCell align="right"><strong>Mileage</strong></TableCell>
                                      <TableCell align="right"><strong>Total</strong></TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {leaseItems.sort((a, b) => new Date(b.date || "") - new Date(a.date || "")).map((exp, idx) => (
                                      <TableRow key={idx} hover>
                                        <TableCell>{exp.date || "-"}</TableCell>
                                        <TableCell>{exp.description || "-"}</TableCell>
                                        <TableCell align="right">{formatCurrency(exp.leaseBreakdown?.fixedLeaseAmount)}</TableCell>
                                        <TableCell align="right">{formatCurrency(exp.leaseBreakdown?.mileageLeaseAmount)}</TableCell>
                                        <TableCell align="right" sx={{ color: "#d32f2f", fontWeight: "bold" }}>{formatCurrency(exp.amount)}</TableCell>
                                      </TableRow>
                                    ))}
                                    <TableRow sx={{ bgcolor: "#ffcdd2", borderTop: "2px solid #f44336" }}>
                                      <TableCell colSpan={4} align="right">
                                        <Typography variant="body2" fontWeight="bold" color="error.main">LEASE SUBTOTAL</Typography>
                                      </TableCell>
                                      <TableCell align="right">
                                        <Typography variant="body2" fontWeight="bold" color="error.main" sx={{ fontSize: "1.05em" }}>
                                          {formatCurrency(leaseItems.reduce((sum, e) => sum + (e.amount || 0), 0))}
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Box>
                          );
                        })()}

                        {/* One-Time Expenses (excluding lease and airport) */}
                        {(() => {
                          const otherItems = (driverDetailReport.oneTimeExpenses || []).filter(e => e.categoryCode !== "LEASE_EXP" && e.categoryCode !== "AIRPORT_TRIP");
                          if (otherItems.length === 0) return null;
                          return (
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
                                    {otherItems.sort((a, b) => new Date(b.date || "") - new Date(a.date || "")).map((exp, idx) => (
                                      <TableRow key={idx} hover>
                                        <TableCell>{exp.date || "-"}</TableCell>
                                        <TableCell>{exp.categoryName || "-"}</TableCell>
                                        <TableCell>{exp.description || "-"}</TableCell>
                                        <TableCell align="right" sx={{ color: "#d32f2f", fontWeight: "bold" }}>{formatCurrency(exp.amount)}</TableCell>
                                      </TableRow>
                                    ))}
                                    <TableRow sx={{ bgcolor: "#ffcdd2", borderTop: "2px solid #f44336" }}>
                                      <TableCell colSpan={3} align="right">
                                        <Typography variant="body2" fontWeight="bold" color="error.main">ONE-TIME SUBTOTAL</Typography>
                                      </TableCell>
                                      <TableCell align="right">
                                        <Typography variant="body2" fontWeight="bold" color="error.main" sx={{ fontSize: "1.05em" }}>
                                          {formatCurrency(otherItems.reduce((sum, e) => sum + (e.amount || 0), 0))}
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Box>
                          );
                        })()}

                        {/* Airport Trip Expenses (filtered from oneTimeExpenses by categoryCode) */}
                        {(() => {
                          const airportItems = (driverDetailReport.oneTimeExpenses || []).filter(e => e.categoryCode === "AIRPORT_TRIP");
                          if (airportItems.length === 0) return null;
                          return (
                            <Box sx={{ mb: 3 }}>
                              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Airport Trip Expenses</Typography>
                              <TableContainer>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow sx={{ bgcolor: "#ffebee" }}>
                                      <TableCell><strong>Date</strong></TableCell>
                                      <TableCell><strong>Cab</strong></TableCell>
                                      <TableCell align="right"><strong>Trips</strong></TableCell>
                                      <TableCell align="right"><strong>Rate/Trip</strong></TableCell>
                                      <TableCell align="right"><strong>Amount</strong></TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {airportItems.sort((a, b) => new Date(b.date || "") - new Date(a.date || "")).map((exp, idx) => (
                                      <TableRow key={idx} hover>
                                        <TableCell>{exp.date || "-"}</TableCell>
                                        <TableCell>{exp.cabNumber || "-"}</TableCell>
                                        <TableCell align="right">{exp.tripCount || "-"}</TableCell>
                                        <TableCell align="right">{exp.ratePerUnit ? formatCurrency(exp.ratePerUnit) : "-"}</TableCell>
                                        <TableCell align="right" sx={{ color: "#d32f2f", fontWeight: "bold" }}>{formatCurrency(exp.amount)}</TableCell>
                                      </TableRow>
                                    ))}
                                    <TableRow sx={{ bgcolor: "#ffcdd2", borderTop: "2px solid #f44336" }}>
                                      <TableCell colSpan={4} align="right">
                                        <Typography variant="body2" fontWeight="bold" color="error.main">AIRPORT SUBTOTAL</Typography>
                                      </TableCell>
                                      <TableCell align="right">
                                        <Typography variant="body2" fontWeight="bold" color="error.main" sx={{ fontSize: "1.05em" }}>
                                          {formatCurrency(airportItems.reduce((sum, e) => sum + (e.amount || 0), 0))}
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Box>
                          );
                        })()}

                        {(!driverDetailReport.recurringExpenses || driverDetailReport.recurringExpenses.length === 0) &&
                         (!driverDetailReport.oneTimeExpenses || driverDetailReport.oneTimeExpenses.length === 0) && (
                          <Typography color="textSecondary">No expenses found</Typography>
                        )}
                      </Box>
                    )}

                    {/* Tab 1: Recurring Expenses */}
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
                                <TableRow sx={{ bgcolor: "#ffcdd2", borderTop: "2px solid #f44336" }}>
                                  <TableCell colSpan={2} align="right">
                                    <Typography variant="body2" fontWeight="bold" color="error.main">TOTAL RECURRING EXPENSES</Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2" fontWeight="bold" color="error.main" sx={{ fontSize: "1.1em" }}>
                                      {formatCurrency(driverDetailReport.totalRecurringExpenses || driverDetailReport.recurringExpenses.reduce((sum, e) => sum + (e.amount || 0), 0))}
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

                    {/* Tab 2: Lease Expense */}
                    {expenseTabIndex === 2 && (
                      <Box sx={{ mb: 3 }}>
                        {(() => {
                          const leaseItems = (driverDetailReport.oneTimeExpenses || []).filter(e => e.categoryCode === "LEASE_EXP");
                          if (leaseItems.length === 0) return <Typography color="textSecondary">No lease expenses found</Typography>;

                          // Group by cab number
                          const grouped = {};
                          leaseItems.forEach((exp) => {
                            const cabNum = exp.description?.match(/Cab\s+(\d+)/)?.[1] || exp.cabNumber || "Unknown";
                            if (!grouped[cabNum]) grouped[cabNum] = [];
                            grouped[cabNum].push(exp);
                          });
                          const sortedCabs = Object.keys(grouped).sort((a, b) => (parseInt(a) || 999) - (parseInt(b) || 999));

                          return (
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ bgcolor: "#ffebee" }}>
                                    <TableCell><strong>Cab</strong></TableCell>
                                    <TableCell><strong>Date</strong></TableCell>
                                    <TableCell><strong>Description</strong></TableCell>
                                    <TableCell align="right"><strong>Fixed Lease</strong></TableCell>
                                    <TableCell align="right"><strong>Mileage Lease</strong></TableCell>
                                    <TableCell align="right"><strong>Total</strong></TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {sortedCabs.map((cab) => {
                                    const items = grouped[cab].sort((a, b) => new Date(b.date || "") - new Date(a.date || ""));
                                    const cabSubtotal = items.reduce((sum, e) => sum + (e.amount || 0), 0);
                                    return [
                                      <TableRow key={`cab-header-${cab}`} sx={{ bgcolor: "#ffcdd2" }}>
                                        <TableCell colSpan={6}>
                                          <Typography variant="body2" fontWeight="bold" color="error.main">Cab {cab}</Typography>
                                        </TableCell>
                                      </TableRow>,
                                      ...items.map((exp, idx) => (
                                        <TableRow key={`${cab}-${idx}`} hover>
                                          <TableCell>Cab {cab}</TableCell>
                                          <TableCell>{exp.date || "-"}</TableCell>
                                          <TableCell>{exp.description || "-"}</TableCell>
                                          <TableCell align="right">{formatCurrency(exp.leaseBreakdown?.fixedLeaseAmount)}</TableCell>
                                          <TableCell align="right">{formatCurrency(exp.leaseBreakdown?.mileageLeaseAmount)}</TableCell>
                                          <TableCell align="right" sx={{ color: "#d32f2f", fontWeight: "bold" }}>{formatCurrency(exp.amount)}</TableCell>
                                        </TableRow>
                                      )),
                                      <TableRow key={`cab-sub-${cab}`} sx={{ bgcolor: "#ffebee", borderTop: "1px solid #f44336" }}>
                                        <TableCell colSpan={5} align="right">
                                          <Typography variant="caption" fontWeight="bold" color="error.main">Cab {cab} Subtotal:</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                          <Typography variant="caption" fontWeight="bold" color="error.main">{formatCurrency(cabSubtotal)}</Typography>
                                        </TableCell>
                                      </TableRow>
                                    ];
                                  })}
                                  <TableRow sx={{ bgcolor: "#ffcdd2", borderTop: "2px solid #f44336" }}>
                                    <TableCell colSpan={5} align="right">
                                      <Typography variant="body2" fontWeight="bold" color="error.main">TOTAL LEASE EXPENSE</Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Typography variant="body2" fontWeight="bold" color="error.main" sx={{ fontSize: "1.1em" }}>
                                        {formatCurrency(leaseItems.reduce((sum, e) => sum + (e.amount || 0), 0))}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          );
                        })()}
                      </Box>
                    )}

                    {/* Tab 3: One-Time Expenses (excluding lease and airport) */}
                    {expenseTabIndex === 3 && (
                      <Box sx={{ mb: 3 }}>
                        {(() => {
                          const otherItems = (driverDetailReport.oneTimeExpenses || []).filter(e => e.categoryCode !== "LEASE_EXP" && e.categoryCode !== "AIRPORT_TRIP");
                          if (otherItems.length === 0) return <Typography color="textSecondary">No one-time expenses found</Typography>;
                          return (
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
                                  {otherItems.sort((a, b) => new Date(b.date || "") - new Date(a.date || "")).map((exp, idx) => (
                                    <TableRow key={idx} hover>
                                      <TableCell>{exp.date || "-"}</TableCell>
                                      <TableCell>{exp.categoryName || "-"}</TableCell>
                                      <TableCell>{exp.description || "-"}</TableCell>
                                      <TableCell align="right" sx={{ color: "#d32f2f", fontWeight: "bold" }}>{formatCurrency(exp.amount)}</TableCell>
                                    </TableRow>
                                  ))}
                                  <TableRow sx={{ bgcolor: "#ffcdd2", borderTop: "2px solid #f44336" }}>
                                    <TableCell colSpan={3} align="right">
                                      <Typography variant="body2" fontWeight="bold" color="error.main">TOTAL ONE-TIME EXPENSES</Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Typography variant="body2" fontWeight="bold" color="error.main" sx={{ fontSize: "1.1em" }}>
                                        {formatCurrency(otherItems.reduce((sum, e) => sum + (e.amount || 0), 0))}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          );
                        })()}
                      </Box>
                    )}

                    {/* Tab 4: Airport Trips (filtered from oneTimeExpenses by categoryCode) */}
                    {expenseTabIndex === 4 && (
                      <Box sx={{ mb: 3 }}>
                        {(() => {
                          const airportItems = (driverDetailReport.oneTimeExpenses || []).filter(e => e.categoryCode === "AIRPORT_TRIP");
                          if (airportItems.length === 0) return <Typography color="textSecondary">No airport trip expenses found</Typography>;

                          // Group by cab number
                          const grouped = {};
                          airportItems.forEach((exp) => {
                            const cabNum = exp.cabNumber || "Unknown";
                            if (!grouped[cabNum]) grouped[cabNum] = [];
                            grouped[cabNum].push(exp);
                          });
                          const sortedCabs = Object.keys(grouped).sort((a, b) => (parseInt(a) || 999) - (parseInt(b) || 999));
                          const totalTrips = airportItems.reduce((sum, e) => sum + (e.tripCount || 0), 0);

                          return (
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ bgcolor: "#ffebee" }}>
                                    <TableCell><strong>Date</strong></TableCell>
                                    <TableCell><strong>Cab</strong></TableCell>
                                    <TableCell align="right"><strong>Trips</strong></TableCell>
                                    <TableCell align="right"><strong>Rate/Trip</strong></TableCell>
                                    <TableCell align="right"><strong>Amount</strong></TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {sortedCabs.map((cab) => {
                                    const items = grouped[cab].sort((a, b) => new Date(b.date || "") - new Date(a.date || ""));
                                    const cabTrips = items.reduce((sum, e) => sum + (e.tripCount || 0), 0);
                                    const cabTotal = items.reduce((sum, e) => sum + (e.amount || 0), 0);
                                    return [
                                      <TableRow key={`cab-header-${cab}`} sx={{ bgcolor: "#ffcdd2" }}>
                                        <TableCell colSpan={5}>
                                          <Typography variant="body2" fontWeight="bold" color="error.main">Cab {cab}</Typography>
                                        </TableCell>
                                      </TableRow>,
                                      ...items.map((exp, idx) => (
                                        <TableRow key={`${cab}-${idx}`} hover>
                                          <TableCell>{exp.date || "-"}</TableCell>
                                          <TableCell>Cab {cab}</TableCell>
                                          <TableCell align="right">{exp.tripCount || 0}</TableCell>
                                          <TableCell align="right">{exp.ratePerUnit ? formatCurrency(exp.ratePerUnit) : "-"}</TableCell>
                                          <TableCell align="right" sx={{ color: "#d32f2f", fontWeight: "bold" }}>{formatCurrency(exp.amount)}</TableCell>
                                        </TableRow>
                                      )),
                                      <TableRow key={`cab-sub-${cab}`} sx={{ bgcolor: "#ffebee", borderTop: "1px solid #f44336" }}>
                                        <TableCell colSpan={2} align="right">
                                          <Typography variant="caption" fontWeight="bold" color="error.main">Cab {cab}: {cabTrips} trips</Typography>
                                        </TableCell>
                                        <TableCell colSpan={2} align="right">
                                          <Typography variant="caption" fontWeight="bold" color="error.main">Subtotal:</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                          <Typography variant="caption" fontWeight="bold" color="error.main">{formatCurrency(cabTotal)}</Typography>
                                        </TableCell>
                                      </TableRow>
                                    ];
                                  })}
                                  <TableRow sx={{ bgcolor: "#ffcdd2", borderTop: "2px solid #f44336" }}>
                                    <TableCell colSpan={2} align="right">
                                      <Typography variant="body2" fontWeight="bold" color="error.main">TOTAL: {totalTrips} trips</Typography>
                                    </TableCell>
                                    <TableCell colSpan={2} align="right">
                                      <Typography variant="body2" fontWeight="bold" color="error.main">TOTAL AIRPORT EXPENSE</Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Typography variant="body2" fontWeight="bold" color="error.main" sx={{ fontSize: "1.1em" }}>
                                        {formatCurrency(airportItems.reduce((sum, e) => sum + (e.amount || 0), 0))}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          );
                        })()}
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
                          {(driverDetailReport.previousBalance || 0) !== 0 && (
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="text.secondary">Prev Due</Typography>
                              <Typography variant="body2" fontWeight="bold" sx={{ color: "#d32f2f" }}>
                                {formatCurrency(driverDetailReport.previousBalance)}
                              </Typography>
                            </Grid>
                          )}
                          <Grid item xs={6} sm={3}>
                            {(() => {
                              const netBeforePaid = (driverDetailReport.totalRevenues || 0) - (driverDetailReport.totalExpenses || 0) + (driverDetailReport.previousBalance || 0);
                              return (
                                <>
                                  <Typography variant="caption" color="text.secondary">Net Payable / Due</Typography>
                                  <Typography
                                    variant="body2"
                                    fontWeight="bold"
                                    sx={{ color: netBeforePaid >= 0 ? "#388e3c" : "#d32f2f" }}
                                  >
                                    {formatCurrency(netBeforePaid)}
                                  </Typography>
                                </>
                              );
                            })()}
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">Paid</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {formatCurrency(driverDetailReport.paidAmount)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            {(() => {
                              const netBeforePaid = (driverDetailReport.totalRevenues || 0) - (driverDetailReport.totalExpenses || 0) + (driverDetailReport.previousBalance || 0);
                              const outstanding = netBeforePaid - (driverDetailReport.paidAmount || 0);
                              return (
                                <>
                                  <Typography variant="caption" color="text.secondary">Outstanding</Typography>
                                  <Typography
                                    variant="body2"
                                    fontWeight="bold"
                                    sx={{ color: outstanding >= 0 ? "#388e3c" : "#d32f2f" }}
                                  >
                                    {formatCurrency(outstanding)}
                                  </Typography>
                                </>
                              );
                            })()}
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
        </Box>
      </Box>
    </LocalizationProvider>
  );
}