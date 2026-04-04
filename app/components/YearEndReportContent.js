"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Button, Alert, Card, CardContent, Grid,
  TextField, CircularProgress, Chip, FormControl, InputLabel, Select,
  MenuItem, Switch, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Collapse, Divider, IconButton, FormControlLabel,
  Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import {
  Settings as SettingsIcon, Print as PrintIcon,
  Download as DownloadIcon, Refresh as RefreshIcon,
  TrendingUp as RevenueIcon, TrendingDown as ExpenseIcon,
  AccountBalance as SummaryIcon, ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon, Sync as SyncIcon,
  CheckCircle as CheckIcon, Email as EmailIcon,
  PictureAsPdf as PdfIcon, Description as T2125Icon,
  ReceiptLong as GstIcon,
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
      </Box>

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
