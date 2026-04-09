"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Button, Alert, Card, CardContent, Grid,
  TextField, CircularProgress, Chip, FormControl, InputLabel, Select,
  MenuItem, Switch, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Collapse, Divider, IconButton, FormControlLabel,
  Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions, Checkbox,
} from "@mui/material";
import {
  Settings as SettingsIcon, Print as PrintIcon,
  Download as DownloadIcon, Refresh as RefreshIcon,
  TrendingUp as RevenueIcon, TrendingDown as ExpenseIcon,
  AccountBalance as SummaryIcon, ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon, Sync as SyncIcon,
  CheckCircle as CheckIcon, Email as EmailIcon,
  PictureAsPdf as PdfIcon, Description as T2125Icon,
  ReceiptLong as GstIcon, Delete as DeleteIcon, Edit as EditIcon,
} from "@mui/icons-material";
import GlobalNav from "./GlobalNav";
import { getCurrentUser, isAuthenticated, API_BASE_URL, getAuthHeaders } from "../lib/api";
import { useRouter } from "next/navigation";

const SECTION_LABELS = {
  REVENUE: "Revenue", EXPENSE: "Expense",
  TAX: "Tax", COMMISSION: "Commission", SUMMARY: "Summary",
};
const SECTION_COLORS = {
  REVENUE: "#43a047", EXPENSE: "#e53935",
  TAX: "#6a1b9a", COMMISSION: "#00695c", SUMMARY: "#1e88e5",
};

export default function YearEndReportContent({ showTaxButtons = true }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  // Report params — date range
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);
  const [driverNumber, setDriverNumber] = useState("");
  const [drivers, setDrivers] = useState([]);
  const [report, setReport] = useState(null);
  const [allReports, setAllReports] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState("single"); // "single" | "all"

  // Download / Email / T2125 / GST
  const [downloading, setDownloading] = useState(false);
  const [downloadingT2125, setDownloadingT2125] = useState(false);
  const [downloadingGst, setDownloadingGst] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");

  // Config
  const [showConfig, setShowConfig] = useState(false);
  const [configItems, setConfigItems] = useState([]);
  const [configDirty, setConfigDirty] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // Tax Deductions Card
  const [taxCardOpen, setTaxCardOpen] = useState(false);
  const [selectedDriverForTax, setSelectedDriverForTax] = useState(null);
  const [taxYear, setTaxYear] = useState(currentYear);
  const [taxEntries, setTaxEntries] = useState([]);
  const [taxLoading, setTaxLoading] = useState(false);
  const [taxTabIndex, setTaxTabIndex] = useState(0);
  const [taxDialogOpen, setTaxDialogOpen] = useState(false);
  const [editingTaxEntry, setEditingTaxEntry] = useState(null);
  const [taxFormData, setTaxFormData] = useState({
    entryType: "T_SLIP",
    slipType: "T4",
    issuerName: "",
    boxLabel: "",
    amount: "",
    notes: "",
  });

  // Tax Profile & Calculation
  const [taxProfile, setTaxProfile] = useState({
    province: "ON",
    language: "EN",
    maritalStatus: "SINGLE",
    numDependents: 0,
    birthYear: new Date().getFullYear() - 40,
    hasDisability: false,
    spouseDisability: false,
  });
  const [taxProfileLoading, setTaxProfileLoading] = useState(false);
  const [taxCalculationResult, setTaxCalculationResult] = useState(null);
  const [taxCalculationLoading, setTaxCalculationLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/"); return; }
    const user = getCurrentUser();
    if (!user || !["ADMIN", "MANAGER", "ACCOUNTANT", "DISPATCHER"].includes(user.role)) {
      router.push("/"); return;
    }
    setCurrentUser(user);
  }, [router]);

  // Load drivers
  useEffect(() => {
    if (!currentUser) return;
    fetch(`${API_BASE_URL}/drivers`, { headers: getAuthHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list = (Array.isArray(data) ? data : data.content || [])
          .map(d => ({ number: d.driverNumber, name: `${d.firstName || ""} ${d.lastName || ""}`.trim(), isOwner: d.isOwner }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setDrivers(list);
      })
      .catch(() => {});
  }, [currentUser]);

  // Load config
  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/year-end-report/config`, { headers: getAuthHeaders() });
      if (res.ok) setConfigItems(await res.json());
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { if (currentUser) fetchConfig(); }, [currentUser, fetchConfig]);

  const handleToggleVisibility = (id) => {
    setConfigItems(prev => prev.map(c => c.id === id ? { ...c, isVisible: !c.isVisible } : c));
    setConfigDirty(true);
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const updates = configItems.map(c => ({ id: c.id, isVisible: c.isVisible, displayOrder: c.displayOrder }));
      const res = await fetch(`${API_BASE_URL}/year-end-report/config`, {
        method: "PUT",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSuccess("Report configuration saved");
      setConfigDirty(false);
    } catch (e) { setError(e.message); }
    finally { setSavingConfig(false); }
  };

  const handleSyncCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/year-end-report/config/sync-categories`, {
        method: "POST", headers: getAuthHeaders(),
      });
      const data = await res.json();
      setSuccess(`Synced: ${data.added} new categories added (${data.total} total items)`);
      fetchConfig();
    } catch (e) { setError(e.message); }
  };

  // Generate report
  const handleGenerate = async () => {
    setGenerating(true); setError(""); setReport(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/year-end-report/generate?driverNumber=${encodeURIComponent(driverNumber)}&startDate=${startDate}&endDate=${endDate}`,
        { headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error("Failed to generate report");
      const data = await res.json();
      if (data.error) { setError(data.error); }
      else { setReport(data); }
    } catch (e) { setError(e.message); }
    finally { setGenerating(false); }
  };

  const handleGenerateAll = async () => {
    setGenerating(true); setError(""); setAllReports(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 min timeout
      const res = await fetch(
        `${API_BASE_URL}/year-end-report/generate-all?startDate=${startDate}&endDate=${endDate}`,
        { headers: getAuthHeaders(), signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error("Failed to generate reports");
      setAllReports(await res.json());
    } catch (e) {
      setError(e.name === "AbortError" ? "Request timed out — try a shorter date range or generate one driver at a time" : e.message);
    }
    finally { setGenerating(false); }
  };

  const handlePrint = () => window.print();

  const handleDownload = async () => {
    setDownloading(true); setError("");
    try {
      const isAll = viewMode === "all" && allReports;
      const url = isAll
        ? `${API_BASE_URL}/year-end-report/download-all`
        : `${API_BASE_URL}/year-end-report/download`;
      const payload = isAll ? allReports : report;
      const res = await fetch(url, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to download PDF");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = isAll
        ? `all_reports_${startDate}_${endDate}.pdf`
        : `report_${report?.driverNumber || driverNumber}_${startDate}_${endDate}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) { setError(e.message); }
    finally { setDownloading(false); }
  };

  const handleEmailSend = async () => {
    setEmailing(true); setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/year-end-report/email`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          reportData: report,
          toEmail: emailAddress || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send email");
      setSuccess(data.message);
      setEmailDialogOpen(false);
      setEmailAddress("");
    } catch (e) { setError(e.message); }
    finally { setEmailing(false); }
  };

  const handleDownloadT2125 = async () => {
    setDownloadingT2125(true); setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/year-end-report/t2125`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });
      if (!res.ok) throw new Error("Failed to generate T2125");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `T2125_${report?.driverNumber || driverNumber}_${startDate}_${endDate}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) { setError(e.message); }
    finally { setDownloadingT2125(false); }
  };

  const handleDownloadGst = async () => {
    setDownloadingGst(true); setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/year-end-report/gst-return`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });
      if (!res.ok) throw new Error("Failed to generate GST/HST return");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `GST_HST_Return_${report?.driverNumber || driverNumber}_${startDate}_${endDate}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) { setError(e.message); }
    finally { setDownloadingGst(false); }
  };

  // Tax Deductions Functions
  const loadTaxEntries = async () => {
    if (!selectedDriverForTax) { setError("Please select a driver"); return; }
    setTaxLoading(true);
    try {
      const driverId = typeof selectedDriverForTax === 'object' ? selectedDriverForTax.number : selectedDriverForTax;
      const res = await fetch(`${API_BASE_URL}/driver-tax-entries?driverId=${driverId}&taxYear=${taxYear}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load tax entries");
      const data = await res.json();
      setTaxEntries(data || []);
    } catch (e) { setError(e.message); }
    finally { setTaxLoading(false); }
  };

  const saveTaxEntry = async () => {
    if (!selectedDriverForTax) { setError("Please select a driver"); return; }
    if (!taxFormData.amount || parseFloat(taxFormData.amount) <= 0) { setError("Amount must be greater than 0"); return; }

    try {
      const driverId = typeof selectedDriverForTax === 'object' ? selectedDriverForTax.number : selectedDriverForTax;
      const driverName = typeof selectedDriverForTax === 'object' ? selectedDriverForTax.name : "";
      const payload = {
        ...taxFormData,
        driverId,
        driverName,
        taxYear,
        amount: parseFloat(taxFormData.amount),
      };

      const method = editingTaxEntry ? "PUT" : "POST";
      const url = editingTaxEntry ? `${API_BASE_URL}/driver-tax-entries/${editingTaxEntry.id}` : `${API_BASE_URL}/driver-tax-entries`;

      const res = await fetch(url, {
        method,
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(editingTaxEntry ? "Failed to update entry" : "Failed to create entry");

      setSuccess(editingTaxEntry ? "Entry updated" : "Entry created");
      setTaxDialogOpen(false);
      setEditingTaxEntry(null);
      setTaxFormData({ entryType: "T_SLIP", slipType: "T4", issuerName: "", boxLabel: "", amount: "", notes: "" });
      await loadTaxEntries();
    } catch (e) { setError(e.message); }
  };

  const deleteTaxEntry = async (id) => {
    if (!confirm("Delete this entry?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/driver-tax-entries/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete entry");
      setSuccess("Entry deleted");
      await loadTaxEntries();
    } catch (e) { setError(e.message); }
  };

  const openTaxDialog = (entry = null) => {
    if (entry) {
      setEditingTaxEntry(entry);
      setTaxFormData({
        entryType: entry.entryType,
        slipType: entry.slipType || "T4",
        boxLabel: entry.boxLabel || "",
        issuerName: entry.issuerName || "",
        amount: entry.amount.toString(),
        notes: entry.notes || "",
      });
    } else {
      setEditingTaxEntry(null);
      setTaxFormData({ entryType: "T_SLIP", slipType: "T4", issuerName: "", boxLabel: "", amount: "", notes: "" });
    }
    setTaxDialogOpen(true);
  };

  const TAX_ENTRY_TYPES = [
    { value: "T_SLIP", label: "T Slip" },
    { value: "RRSP", label: "RRSP Contribution" },
    { value: "DONATION", label: "Charitable Donation" },
    { value: "OTHER_DEDUCTION", label: "Other Deduction" },
  ];

  const SLIP_TYPES = ["T4", "T4A", "T4A-OAS", "T5", "T3", "T4E", "RL-1", "RL-3"];

  const TAX_TABS = ["T Slips", "RRSP Contributions", "Donations", "Other Deductions"];
  const TAX_TAB_TYPES = ["T_SLIP", "RRSP", "DONATION", "OTHER_DEDUCTION"];

  const getTabEntries = () => taxEntries.filter(e => e.entryType === TAX_TAB_TYPES[taxTabIndex]);
  const getTabTotal = () => getTabEntries().reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const getTotalAll = () => taxEntries.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

  // Tax Profile & Calculation Functions
  const loadTaxProfile = async () => {
    if (!selectedDriverForTax) { setError("Please select a driver"); return; }
    setTaxProfileLoading(true);
    try {
      const driverId = typeof selectedDriverForTax === 'object' ? selectedDriverForTax.number : selectedDriverForTax;
      const res = await fetch(`${API_BASE_URL}/driver-tax-profiles?driverId=${driverId}&taxYear=${taxYear}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();
      setTaxProfile({ ...data, birthYear: data.birthYear || new Date().getFullYear() - 40 });
      setSuccess("Profile loaded");
    } catch (e) { setError(e.message); }
    finally { setTaxProfileLoading(false); }
  };

  const saveTaxProfile = async () => {
    if (!selectedDriverForTax) { setError("Please select a driver"); return; }
    setTaxProfileLoading(true);
    try {
      const driverId = typeof selectedDriverForTax === 'object' ? selectedDriverForTax.number : selectedDriverForTax;
      const driverName = typeof selectedDriverForTax === 'object' ? selectedDriverForTax.name : "";
      const payload = { ...taxProfile, driverId, driverName, taxYear };
      const res = await fetch(`${API_BASE_URL}/driver-tax-profiles`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      setSuccess("Profile saved");
    } catch (e) { setError(e.message); }
    finally { setTaxProfileLoading(false); }
  };

  const calculateTax = async () => {
    if (!selectedDriverForTax) { setError("Please select a driver"); return; }
    if (!taxProfile.province) { setError("Please set province in profile"); return; }
    setTaxCalculationLoading(true);
    try {
      const driverId = typeof selectedDriverForTax === 'object' ? selectedDriverForTax.number : selectedDriverForTax;
      const res = await fetch(`${API_BASE_URL}/tax-calculations/calculate?driverId=${driverId}&taxYear=${taxYear}`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to calculate tax");
      const data = await res.json();
      setTaxCalculationResult(data);
      if (data.error) setError(data.error);
      else setSuccess("Tax calculated");
    } catch (e) { setError(e.message); }
    finally { setTaxCalculationLoading(false); }
  };

  const fmt = (val) => {
    if (val == null) return "$0.00";
    const n = Number(val);
    return n < 0 ? `-$${Math.abs(n).toFixed(2)}` : `$${n.toFixed(2)}`;
  };

  const formatDateRange = (sd, ed) => {
    if (!sd || !ed) return "";
    const s = new Date(sd + "T00:00:00");
    const e = new Date(ed + "T00:00:00");
    const opts = { year: "numeric", month: "short", day: "numeric" };
    return `${s.toLocaleDateString("en-US", opts)} — ${e.toLocaleDateString("en-US", opts)}`;
  };

  const ReportCard = ({ data }) => {
    if (!data || data.error) return null;
    const revenues = data.revenues || [];
    const expenses = data.expenses || [];
    const summary = data.summary || {};

    return (
      <Paper elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 2, mb: 3, overflow: "hidden" }} className="print-report">
        {/* Header */}
        <Box sx={{ backgroundColor: "#3e5244", color: "#fff", p: 3, textAlign: "center" }}>
          <Typography variant="h5" fontWeight={700}>Financial Report</Typography>
          <Typography variant="h6" sx={{ mt: 0.5, color: "#a8d5ba" }}>
            {formatDateRange(data.startDate, data.endDate)}
          </Typography>
          <Box component="span" sx={{ mt: 1, display: "block", typography: "body1" }}>
            {data.driverName} ({data.driverNumber})
            {data.isOwner && <Chip label="Owner" size="small" sx={{ ml: 1, backgroundColor: "#2d7d5f", color: "#fff", height: 22 }} />}
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Revenue Section */}
          {revenues.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#43a047", mb: 1, borderBottom: "2px solid #e8f5e9", pb: 0.5 }}>
                <RevenueIcon sx={{ fontSize: 20, mr: 1, verticalAlign: "middle" }} />Revenue
              </Typography>
              <Table size="small">
                <TableBody>
                  {revenues.map((r, i) => (
                    <TableRow key={i} sx={{ "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell sx={{ pl: 3 }}>{r.label}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: "#43a047", whiteSpace: "nowrap" }}>{fmt(r.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {/* Expense Section */}
          {expenses.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#e53935", mb: 1, borderBottom: "2px solid #ffebee", pb: 0.5 }}>
                <ExpenseIcon sx={{ fontSize: 20, mr: 1, verticalAlign: "middle" }} />Expenses
              </Typography>
              <Table size="small">
                <TableBody>
                  {expenses.map((e, i) => (
                    <TableRow key={i} sx={{ "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell sx={{ pl: e.indent ? 6 : 3, color: e.indent ? "text.secondary" : "text.primary", fontSize: e.indent ? 13 : 14 }}>
                        {e.label}
                      </TableCell>
                      <TableCell align="right" sx={{
                        fontWeight: e.indent ? 400 : 600,
                        color: e.indent ? "text.secondary" : "#e53935",
                        whiteSpace: "nowrap",
                        fontSize: e.indent ? 13 : 14,
                      }}>
                        {fmt(e.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {/* Summary */}
          {Object.keys(summary).length > 0 && (
            <Box sx={{ backgroundColor: "#f8fafb", borderRadius: 2, p: 2, border: "1px solid #e5e7eb" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1e88e5", mb: 1 }}>
                <SummaryIcon sx={{ fontSize: 20, mr: 1, verticalAlign: "middle" }} />Summary
              </Typography>
              <Table size="small">
                <TableBody>
                  {summary.totalRevenue !== undefined && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Total Revenue</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: "#43a047", fontSize: 16 }}>{fmt(summary.totalRevenue)}</TableCell>
                    </TableRow>
                  )}
                  {summary.totalExpenses !== undefined && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Total Expenses</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: "#e53935", fontSize: 16 }}>{fmt(summary.totalExpenses)}</TableCell>
                    </TableRow>
                  )}
                  {summary.netIncome !== undefined && (
                    <TableRow sx={{ "& td": { borderBottom: "2px solid #1e88e5" } }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: 16 }}>Net Income</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: 18, color: Number(summary.netIncome) >= 0 ? "#43a047" : "#e53935" }}>
                        {fmt(summary.netIncome)}
                      </TableCell>
                    </TableRow>
                  )}
                  {summary.previousBalance !== undefined && Number(summary.previousBalance) !== 0 && (
                    <TableRow>
                      <TableCell>Previous Balance</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(summary.previousBalance)}</TableCell>
                    </TableRow>
                  )}
                  {summary.paymentsMade !== undefined && Number(summary.paymentsMade) !== 0 && (
                    <TableRow>
                      <TableCell>Payments Made</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(summary.paymentsMade)}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
        </Box>
      </Paper>
    );
  };

  if (!currentUser) return null;
  const isAdmin = currentUser.role === "ADMIN";

  // Group config by section for display
  const configBySection = configItems.reduce((acc, c) => {
    if (!acc[c.section]) acc[c.section] = [];
    acc[c.section].push(c);
    return acc;
  }, {});

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
      <GlobalNav currentUser={currentUser} />
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#3e5244" }}>Financial Report</Typography>
            <Typography variant="body2" color="text.secondary">Financial summary for drivers and owners over a custom date range</Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            {isAdmin && (
              <Button variant={showConfig ? "contained" : "outlined"} startIcon={<SettingsIcon />}
                onClick={() => setShowConfig(!showConfig)} size="small"
                sx={showConfig ? { backgroundColor: "#6a1b9a", "&:hover": { backgroundColor: "#4a148c" } } : {}}>
                Report Config
              </Button>
            )}
            {(report || allReports) && (
              <>
                <Button variant="outlined" startIcon={downloading ? <CircularProgress size={14} /> : <PdfIcon />}
                  onClick={handleDownload} size="small" disabled={downloading}>
                  {downloading ? "Generating..." : "Download PDF"}
                </Button>
                {report && viewMode === "single" && (
                  <>
                    {showTaxButtons && (
                      <>
                        <Button variant="outlined" startIcon={downloadingT2125 ? <CircularProgress size={14} /> : <T2125Icon />}
                          onClick={handleDownloadT2125} size="small" disabled={downloadingT2125}
                          sx={{ borderColor: "#b91c1c", color: "#b91c1c", "&:hover": { borderColor: "#991b1b", backgroundColor: "#fef2f2" } }}>
                          {downloadingT2125 ? "Generating..." : "T2125"}
                        </Button>
                        <Button variant="outlined" startIcon={downloadingGst ? <CircularProgress size={14} /> : <GstIcon />}
                          onClick={handleDownloadGst} size="small" disabled={downloadingGst}
                          sx={{ borderColor: "#003366", color: "#003366", "&:hover": { borderColor: "#002244", backgroundColor: "#f0f4f8" } }}>
                          {downloadingGst ? "Generating..." : "GST/HST"}
                        </Button>
                      </>
                    )}
                    <Button variant="outlined" startIcon={<EmailIcon />}
                      onClick={() => setEmailDialogOpen(true)} size="small" color="primary">
                      Email
                    </Button>
                  </>
                )}
                <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint} size="small">Print</Button>
              </>
            )}
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}

        {/* Config Panel */}
        <Collapse in={showConfig}>
          <Paper elevation={0} sx={{ p: 3, mb: 3, border: "2px solid #CE93D8", borderRadius: 2, backgroundColor: "#faf5fc" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#6a1b9a" }}>
                Report Configuration
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button variant="outlined" size="small" startIcon={<SyncIcon />} onClick={handleSyncCategories}>
                  Sync Categories
                </Button>
                <Button variant="contained" size="small" startIcon={savingConfig ? <CircularProgress size={14} color="inherit" /> : <CheckIcon />}
                  onClick={handleSaveConfig} disabled={!configDirty || savingConfig}
                  sx={{ backgroundColor: "#6a1b9a", "&:hover": { backgroundColor: "#4a148c" } }}>
                  Save Config
                </Button>
              </Box>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Toggle which line items appear in the report. Changes apply to all generated reports.
            </Typography>

            <Grid container spacing={3}>
              {["REVENUE", "EXPENSE", "TAX", "COMMISSION", "SUMMARY"].map(section => (
                configBySection[section] && (
                  <Grid item xs={12} sm={6} md={4} key={section}>
                    <Paper variant="outlined" sx={{ p: 2, borderColor: SECTION_COLORS[section] + "40" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: SECTION_COLORS[section], mb: 1 }}>
                        {SECTION_LABELS[section]}
                      </Typography>
                      {configBySection[section].map(item => (
                        <Box key={item.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.3 }}>
                          <Typography variant="body2" sx={{ color: item.isVisible ? "text.primary" : "text.disabled" }}>
                            {item.itemLabel}
                          </Typography>
                          <Switch size="small" checked={item.isVisible}
                            onChange={() => handleToggleVisibility(item.id)}
                            sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: SECTION_COLORS[section] },
                                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: SECTION_COLORS[section] } }} />
                        </Box>
                      ))}
                    </Paper>
                  </Grid>
                )
              ))}
            </Grid>
          </Paper>
        </Collapse>

        {/* Report Controls */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: "1px solid #e5e7eb" }}>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={6} sm={2}>
              <TextField fullWidth size="small" type="date" label="Start Date" value={startDate}
                onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField fullWidth size="small" type="date" label="End Date" value={endDate}
                onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete
                size="small"
                options={drivers}
                getOptionLabel={(option) => `${option.name} (${option.number})${option.isOwner ? " [Owner]" : ""}`}
                value={drivers.find(d => d.number === driverNumber) || null}
                onChange={(_, newVal) => { setDriverNumber(newVal ? newVal.number : ""); setViewMode("single"); }}
                isOptionEqualToValue={(option, value) => option.number === value.number}
                renderInput={(params) => <TextField {...params} label="Driver / Owner" />}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button variant="contained" fullWidth disabled={generating || !driverNumber}
                onClick={() => { setViewMode("single"); handleGenerate(); }}
                startIcon={generating && viewMode === "single" ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
                sx={{ backgroundColor: "#3e5244", "&:hover": { backgroundColor: "#2d3d32" }, height: 40 }}>
                Generate
              </Button>
            </Grid>
            <Grid item xs={12} sm={3}>
              {isAdmin && (
                <Button variant="outlined" fullWidth disabled
                  startIcon={<DownloadIcon />}
                  sx={{ height: 40 }}>
                  Generate All Drivers
                </Button>
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* Single Report */}
        {viewMode === "single" && report && <ReportCard data={report} />}

        {/* All Reports */}
        {viewMode === "all" && allReports && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              {allReports.driverCount} drivers — {formatDateRange(allReports.startDate, allReports.endDate)}
            </Typography>
            {allReports.reports?.map((r, i) => <ReportCard key={i} data={r} />)}
          </Box>
        )}

        {/* Empty state */}
        {!report && !allReports && !generating && (
          <Paper elevation={0} sx={{ p: 6, textAlign: "center", border: "1px solid #e5e7eb" }}>
            <Typography variant="h6" color="text.secondary">Select a date range and driver to generate a report</Typography>
          </Paper>
        )}

        {generating && (
          <Paper elevation={0} sx={{ p: 6, textAlign: "center", border: "1px solid #e5e7eb" }}>
            <CircularProgress size={40} />
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              Generating report{viewMode === "all" ? "s for all drivers" : ""}...
            </Typography>
            <Typography variant="caption" color="text.secondary">This may take a moment for large date ranges</Typography>
          </Paper>
        )}

        {/* Tax Deductions Card */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, border: "2px solid #b91c1c", borderRadius: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: taxCardOpen ? 2 : 0, cursor: "pointer" }}
            onClick={() => setTaxCardOpen(!taxCardOpen)}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#b91c1c" }}>Personal Tax Deductions</Typography>
            {taxCardOpen ? <ExpandLessIcon sx={{ color: "#b91c1c" }} /> : <ExpandMoreIcon sx={{ color: "#b91c1c" }} />}
          </Box>

          <Collapse in={taxCardOpen}>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Autocomplete
                  size="small"
                  options={drivers}
                  getOptionLabel={(option) => `${option.name} (${option.number})${option.isOwner ? " [Owner]" : ""}`}
                  value={selectedDriverForTax}
                  onChange={(_, val) => { setSelectedDriverForTax(val); setTaxEntries([]); }}
                  isOptionEqualToValue={(option, value) => option.number === value.number}
                  renderInput={(params) => <TextField {...params} label="Driver / Owner" />}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth size="small" type="number" label="Tax Year" value={taxYear}
                  onChange={(e) => setTaxYear(parseInt(e.target.value) || currentYear)} />
              </Grid>
              <Grid item xs={12} sm={5}>
                <Button variant="contained" fullWidth disabled={!selectedDriverForTax || taxLoading}
                  onClick={loadTaxEntries} startIcon={taxLoading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
                  sx={{ backgroundColor: "#b91c1c", "&:hover": { backgroundColor: "#991b1b" }, height: 40 }}>
                  {taxLoading ? "Loading..." : "Load Entries"}
                </Button>
              </Grid>
            </Grid>

            {selectedDriverForTax && (
              <>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Category</InputLabel>
                  <Select value={taxTabIndex} label="Category" onChange={(e) => setTaxTabIndex(e.target.value)}>
                    {TAX_TABS.map((tab, idx) => <MenuItem key={idx} value={idx}>{tab}</MenuItem>)}
                  </Select>
                </FormControl>

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {TAX_TABS[taxTabIndex]} ({getTabEntries().length} {getTabEntries().length === 1 ? "entry" : "entries"})
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Chip label={`Total: ${fmt(getTabTotal())}`} variant="outlined" sx={{ color: "#b91c1c", borderColor: "#b91c1c" }} />
                    <Button variant="outlined" size="small" onClick={() => openTaxDialog()}>Add Entry</Button>
                  </Box>
                </Box>

                <TableContainer component={Paper} sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                        {taxTabIndex === 0 && (
                          <>
                            <TableCell><strong>Slip Type</strong></TableCell>
                            <TableCell><strong>Box Label</strong></TableCell>
                            <TableCell><strong>Issuer</strong></TableCell>
                          </>
                        )}
                        {taxTabIndex === 1 && (
                          <>
                            <TableCell><strong>Institution</strong></TableCell>
                            <TableCell><strong>Notes</strong></TableCell>
                          </>
                        )}
                        {taxTabIndex === 2 && (
                          <>
                            <TableCell><strong>Organization</strong></TableCell>
                            <TableCell><strong>Notes</strong></TableCell>
                          </>
                        )}
                        {taxTabIndex === 3 && (
                          <>
                            <TableCell><strong>Description</strong></TableCell>
                            <TableCell><strong>Notes</strong></TableCell>
                          </>
                        )}
                        <TableCell align="right"><strong>Amount</strong></TableCell>
                        <TableCell align="center"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getTabEntries().length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={taxTabIndex === 0 ? 5 : 4} align="center" sx={{ py: 3, color: "#999" }}>
                            No entries yet. Click "Add Entry" to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        getTabEntries().map(entry => (
                          <TableRow key={entry.id} hover>
                            {taxTabIndex === 0 && (
                              <>
                                <TableCell>{entry.slipType}</TableCell>
                                <TableCell>{entry.boxLabel || "—"}</TableCell>
                                <TableCell>{entry.issuerName || "—"}</TableCell>
                              </>
                            )}
                            {taxTabIndex === 1 && (
                              <>
                                <TableCell>{entry.issuerName || "—"}</TableCell>
                                <TableCell>{entry.notes || "—"}</TableCell>
                              </>
                            )}
                            {taxTabIndex === 2 && (
                              <>
                                <TableCell>{entry.issuerName || "—"}</TableCell>
                                <TableCell>{entry.notes || "—"}</TableCell>
                              </>
                            )}
                            {taxTabIndex === 3 && (
                              <>
                                <TableCell>{entry.notes || "—"}</TableCell>
                                <TableCell>{entry.boxLabel || "—"}</TableCell>
                              </>
                            )}
                            <TableCell align="right">{fmt(entry.amount)}</TableCell>
                            <TableCell align="center">
                              <IconButton size="small" onClick={() => openTaxDialog(entry)}><EditIcon fontSize="small" /></IconButton>
                              <IconButton size="small" color="error" onClick={() => deleteTaxEntry(entry.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {taxEntries.length > 0 && (
                  <Box sx={{ p: 2, backgroundColor: "#f9f9f9", borderRadius: 1, textAlign: "right" }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#b91c1c" }}>
                      Grand Total (All Categories): {fmt(getTotalAll())}
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ my: 3 }} />

                {/* Tax Profile Section */}
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#b91c1c", mb: 2 }}>Tax Profile</Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Province</InputLabel>
                      <Select label="Province" value={taxProfile.province}
                        onChange={(e) => setTaxProfile({ ...taxProfile, province: e.target.value })}>
                        {["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"].map(p =>
                          <MenuItem key={p} value={p}>{p}</MenuItem>
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Language</InputLabel>
                      <Select label="Language" value={taxProfile.language}
                        onChange={(e) => setTaxProfile({ ...taxProfile, language: e.target.value })}>
                        <MenuItem value="EN">English</MenuItem>
                        <MenuItem value="FR">Français</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Marital Status</InputLabel>
                      <Select label="Marital Status" value={taxProfile.maritalStatus}
                        onChange={(e) => setTaxProfile({ ...taxProfile, maritalStatus: e.target.value })}>
                        <MenuItem value="SINGLE">Single</MenuItem>
                        <MenuItem value="MARRIED">Married</MenuItem>
                        <MenuItem value="COMMON_LAW">Common-law</MenuItem>
                        <MenuItem value="DIVORCED">Divorced</MenuItem>
                        <MenuItem value="WIDOWED">Widowed</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField fullWidth size="small" type="number" label="# Dependents"
                      value={taxProfile.numDependents}
                      onChange={(e) => setTaxProfile({ ...taxProfile, numDependents: parseInt(e.target.value) || 0 })} />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField fullWidth size="small" type="number" label="Birth Year"
                      value={taxProfile.birthYear}
                      onChange={(e) => setTaxProfile({ ...taxProfile, birthYear: parseInt(e.target.value) || 1980 })} />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <FormControlLabel
                      control={<Checkbox checked={taxProfile.hasDisability}
                        onChange={(e) => setTaxProfile({ ...taxProfile, hasDisability: e.target.checked })} />}
                      label="Self Disabled" />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <FormControlLabel
                      control={<Checkbox checked={taxProfile.spouseDisability}
                        onChange={(e) => setTaxProfile({ ...taxProfile, spouseDisability: e.target.checked })} />}
                      label="Spouse Disabled" />
                  </Grid>
                  <Grid item xs={12}>
                    <Button variant="contained" onClick={saveTaxProfile} disabled={taxProfileLoading}
                      sx={{ backgroundColor: "#b91c1c", "&:hover": { backgroundColor: "#991b1b" } }}>
                      {taxProfileLoading ? "Saving..." : "Save Profile"}
                    </Button>
                  </Grid>
                </Grid>

                {/* Tax Calculation Results */}
                {taxCalculationResult && !taxCalculationResult.error && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Button variant="contained" onClick={calculateTax} disabled={taxCalculationLoading}
                      sx={{ mb: 2, backgroundColor: "#b91c1c", "&:hover": { backgroundColor: "#991b1b" } }}>
                      {taxCalculationLoading ? "Calculating..." : "Recalculate 2024 Tax"}
                    </Button>

                    <Paper sx={{ p: 3, backgroundColor: "#fafafa", border: "1px solid #e0e0e0" }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                        2024 Tax Summary — {taxProfile.province}
                      </Typography>

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6}><Typography>Employment Income</Typography></Grid>
                        <Grid item xs={6} align="right"><strong>{fmt(taxCalculationResult.totalEmploymentIncome)}</strong></Grid>

                        <Grid item xs={6}><Typography>- RRSP Deduction</Typography></Grid>
                        <Grid item xs={6} align="right"><strong>({fmt(taxCalculationResult.rrspDeduction)})</strong></Grid>

                        <Grid item xs={6}><Typography>- Donations</Typography></Grid>
                        <Grid item xs={6} align="right"><strong>({fmt(taxCalculationResult.donationDeduction)})</strong></Grid>

                        <Grid item xs={6}><Typography>- Other Deductions</Typography></Grid>
                        <Grid item xs={6} align="right"><strong>({fmt(taxCalculationResult.otherDeductions)})</strong></Grid>

                        <Grid item xs={6} sx={{ pt: 2, borderTop: "1px solid #ddd" }}><Typography sx={{ fontWeight: 600 }}>Taxable Income</Typography></Grid>
                        <Grid item xs={6} align="right" sx={{ pt: 2, borderTop: "1px solid #ddd" }}><strong>{fmt(taxCalculationResult.taxableIncome)}</strong></Grid>

                        <Grid item xs={6} sx={{ pt: 1 }}><Typography>Federal Tax</Typography></Grid>
                        <Grid item xs={6} align="right" sx={{ pt: 1 }}><Typography>{fmt(taxCalculationResult.netFederalTax)}</Typography></Grid>

                        <Grid item xs={6}><Typography>Provincial Tax ({taxProfile.province})</Typography></Grid>
                        <Grid item xs={6} align="right"><Typography>{fmt(taxCalculationResult.netProvincialTax)}</Typography></Grid>

                        <Grid item xs={6}><Typography>CPP Contributions</Typography></Grid>
                        <Grid item xs={6} align="right"><Typography>{fmt(taxCalculationResult.cppContributions)}</Typography></Grid>

                        <Grid item xs={6}><Typography>EI Premiums</Typography></Grid>
                        <Grid item xs={6} align="right"><Typography>{fmt(taxCalculationResult.eiPremiums)}</Typography></Grid>

                        <Grid item xs={6} sx={{ pt: 2, borderTop: "2px solid #b91c1c" }}><Typography variant="h6" sx={{ fontWeight: 700, color: "#b91c1c" }}>Total Tax Payable</Typography></Grid>
                        <Grid item xs={6} align="right" sx={{ pt: 2, borderTop: "2px solid #b91c1c" }}><Typography variant="h6" sx={{ fontWeight: 700, color: "#b91c1c" }}>{fmt(taxCalculationResult.totalTaxPayable)}</Typography></Grid>
                      </Grid>
                    </Paper>
                  </>
                )}

                {!taxCalculationResult && (
                  <Button variant="outlined" onClick={calculateTax} disabled={taxCalculationLoading}
                    sx={{ mt: 2, borderColor: "#b91c1c", color: "#b91c1c", "&:hover": { backgroundColor: "#fef2f2" } }}>
                    {taxCalculationLoading ? "Calculating..." : "Calculate 2024 Tax Estimate"}
                  </Button>
                )}
              </>
            )}
          </Collapse>
        </Paper>
      </Box>

      {/* Tax Entry Dialog */}
      <Dialog open={taxDialogOpen} onClose={() => setTaxDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTaxEntry ? "Edit Tax Entry" : "Add Tax Entry"}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Entry Type</InputLabel>
                <Select label="Entry Type" value={taxFormData.entryType}
                  onChange={(e) => { setTaxFormData({ ...taxFormData, entryType: e.target.value, slipType: e.target.value === "T_SLIP" ? "T4" : "" }); }}>
                  {TAX_ENTRY_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            {taxFormData.entryType === "T_SLIP" && (
              <>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Slip Type</InputLabel>
                    <Select label="Slip Type" value={taxFormData.slipType}
                      onChange={(e) => setTaxFormData({ ...taxFormData, slipType: e.target.value })}>
                      {SLIP_TYPES.map(st => <MenuItem key={st} value={st}>{st}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Box Label" value={taxFormData.boxLabel}
                    onChange={(e) => setTaxFormData({ ...taxFormData, boxLabel: e.target.value })}
                    placeholder="e.g., Box 14" />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <TextField fullWidth size="small" label={taxFormData.entryType === "T_SLIP" ? "Employer Name" : taxFormData.entryType === "RRSP" ? "Institution" : taxFormData.entryType === "DONATION" ? "Organization" : "Description"}
                value={taxFormData.issuerName}
                onChange={(e) => setTaxFormData({ ...taxFormData, issuerName: e.target.value })} />
            </Grid>

            <Grid item xs={6}>
              <TextField fullWidth size="small" type="number" label="Amount" value={taxFormData.amount}
                onChange={(e) => setTaxFormData({ ...taxFormData, amount: e.target.value })}
                inputProps={{ step: "0.01", min: "0" }} />
            </Grid>

            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Notes" value={taxFormData.notes}
                onChange={(e) => setTaxFormData({ ...taxFormData, notes: e.target.value })}
                placeholder="Optional notes" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaxDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveTaxEntry}
            sx={{ backgroundColor: "#b91c1c", "&:hover": { backgroundColor: "#991b1b" } }}>
            {editingTaxEntry ? "Update" : "Add"} Entry
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Email Report</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Send the report for <strong>{report?.driverName}</strong> ({report?.driverNumber}) as a PDF attachment.
          </Typography>
          <TextField
            fullWidth size="small" label="Email Address" type="email"
            value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)}
            placeholder="Leave blank to use driver's email on file"
            helperText="Leave blank to send to the driver's email on file"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEmailSend} disabled={emailing}
            startIcon={emailing ? <CircularProgress size={14} color="inherit" /> : <EmailIcon />}
            sx={{ backgroundColor: "#3e5244", "&:hover": { backgroundColor: "#2d3d32" } }}>
            {emailing ? "Sending..." : "Send Email"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body > *:not(.print-report) { display: none !important; }
          .MuiAppBar-root, nav, .no-print { display: none !important; }
          .print-report { box-shadow: none !important; border: none !important; }
        }
      `}</style>
    </Box>
  );
}
