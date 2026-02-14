"use client";

import { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, FormControl, InputLabel, Select, MenuItem, Card, CardContent, Grid,
  Alert, Chip, CircularProgress, Tabs, Tab, Container,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon, BarChart as BarChartIcon, Person as PersonIcon,
  Assessment, Visibility,
} from "@mui/icons-material";
import GlobalNav from "../components/GlobalNav";
import { getCurrentUser, API_BASE_URL } from "../lib/api";

export default function ReportsAnalyticsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  // Driver/Owner selection
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedPerson, setSelectedPerson] = useState(null);

  // Date range
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Data states
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const [driverMetrics, setDriverMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  const [statement, setStatement] = useState(null);
  const [loadingStatement, setLoadingStatement] = useState(false);

  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !["ADMIN", "MANAGER", "ACCOUNTANT"].includes(user.role)) {
      window.location.href = "/";
      return;
    }
    setCurrentUser(user);
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    setDateFrom(monthStart);
    setDateTo(monthEnd);
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await loadDrivers();
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadDrivers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/drivers`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });
      if (response.ok) {
        setDrivers(await response.json());
      }
    } catch (err) {
      console.error("Error loading drivers:", err);
    }
  };

  const handlePersonSelect = (personId) => {
    setSelectedPersonId(personId);
    const person = drivers.find(d => d.id == personId);
    setSelectedPerson(person);
    // Clear previous data
    setAnalytics(null);
    setDriverMetrics(null);
    setStatement(null);
  };

  const generateAnalytics = async () => {
    if (!selectedPersonId || !dateFrom || !dateTo) {
      setError("Please select a driver/owner and date range");
      return;
    }
    setLoadingAnalytics(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/financial-statements/owner-report/${selectedPersonId}?from=${dateFrom}&to=${dateTo}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }
      );
      if (response.ok) {
        setAnalytics(await response.json());
      } else {
        setError(await response.text() || "Failed to generate analytics");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const generateMetrics = async () => {
    if (!selectedPersonId || !dateFrom || !dateTo) {
      setError("Please select a driver/owner and date range");
      return;
    }
    setLoadingMetrics(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/financial-statements/driver/${selectedPersonId}?from=${dateFrom}&to=${dateTo}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }
      );
      if (response.ok) {
        setDriverMetrics(await response.json());
      } else {
        setError(await response.text() || "Failed to generate metrics");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const generateStatement = async () => {
    if (!selectedPersonId || !dateFrom || !dateTo) {
      setError("Please select a driver/owner and date range");
      return;
    }
    setLoadingStatement(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/financial-statements/owner-report/${selectedPersonId}?from=${dateFrom}&to=${dateTo}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }
      );
      if (response.ok) {
        setStatement(await response.json());
      } else {
        setError(await response.text() || "Failed to generate statement");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingStatement(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <GlobalNav currentUser={currentUser} title="Reports & Analytics" />
        <Box sx={{ p: 3, textAlign: "center" }}><Typography>Loading...</Typography></Box>
      </Box>
    );
  }

  return (
    <Box>
      <GlobalNav currentUser={currentUser} title="Reports & Analytics" />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>Reports & Analytics</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Detailed financial analysis for a specific driver or owner
          </Typography>
        </Box>

        {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}

        {/* Driver/Owner Selection and Date Range */}
        <Paper sx={{ p: 3, mb: 3, backgroundColor: "#f5f5f5" }}>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select Driver or Owner</InputLabel>
                <Select
                  value={selectedPersonId}
                  label="Select Driver or Owner"
                  onChange={(e) => handlePersonSelect(e.target.value)}
                >
                  <MenuItem value="">Choose a driver or owner...</MenuItem>
                  {drivers.map(d => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.firstName} {d.lastName} ({d.driverNumber})
                      {d.isOwner && " - Owner"}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                label="From"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                label="To"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={generateAnalytics}
                  disabled={loadingAnalytics || !selectedPersonId}
                  sx={{ flex: 1 }}
                >
                  {loadingAnalytics ? <CircularProgress size={20} sx={{ mr: 1 }} /> : <BarChartIcon sx={{ mr: 1 }} />}
                  Summary
                </Button>
                <Button
                  variant="contained"
                  onClick={generateStatement}
                  disabled={loadingStatement || !selectedPersonId}
                  sx={{ flex: 1 }}
                >
                  {loadingStatement ? <CircularProgress size={20} sx={{ mr: 1 }} /> : <Visibility sx={{ mr: 1 }} />}
                  Details
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Selected Person Info */}
        {selectedPerson && (
          <Paper sx={{ p: 2, mb: 3, backgroundColor: "#e3f2fd", border: "1px solid #90caf9" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <PersonIcon sx={{ fontSize: 32, color: "#1976d2" }} />
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {selectedPerson.firstName} {selectedPerson.lastName}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedPerson.isOwner ? "Owner" : "Driver"} • Driver #: {selectedPerson.driverNumber}
                </Typography>
              </Box>
            </Box>
          </Paper>
        )}

        {/* Tabs */}
        {selectedPerson && (
          <>
            <Paper sx={{ mb: 3 }}>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{ borderBottom: 1, borderColor: "divider" }}
              >
                <Tab icon={<BarChartIcon />} iconPosition="start" label="Summary" />
                <Tab icon={<TrendingUpIcon />} iconPosition="start" label="Detailed Report" />
              </Tabs>
            </Paper>

            {/* Tab Content */}
            <Box>
              {/* Summary Tab */}
              {activeTab === 0 && (
                <Paper sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <BarChartIcon sx={{ mr: 2, color: "primary.main", fontSize: 28 }} />
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        Financial Summary
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {dateFrom} to {dateTo}
                      </Typography>
                    </Box>
                  </Box>

                  {loadingAnalytics && (
                    <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                      <CircularProgress />
                    </Box>
                  )}

                  {analytics && !loadingAnalytics && (
                    <Grid container spacing={3}>
                      {/* Revenues */}
                      <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ backgroundColor: "#e8f5e9" }}>
                          <CardContent>
                            <Typography color="textSecondary" variant="body2" gutterBottom>
                              Total Revenues
                            </Typography>
                            <Typography variant="h5" sx={{ color: "#388e3c", fontWeight: "bold" }}>
                              ${parseFloat(analytics.totalRevenues || 0).toFixed(2)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Recurring Expenses */}
                      <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ backgroundColor: "#fff3e0" }}>
                          <CardContent>
                            <Typography color="textSecondary" variant="body2" gutterBottom>
                              Recurring Expenses
                            </Typography>
                            <Typography variant="h5" sx={{ color: "#e65100", fontWeight: "bold" }}>
                              ${parseFloat(analytics.totalRecurringExpenses || 0).toFixed(2)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* One-Time Expenses */}
                      <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ backgroundColor: "#fce4ec" }}>
                          <CardContent>
                            <Typography color="textSecondary" variant="body2" gutterBottom>
                              One-Time Expenses
                            </Typography>
                            <Typography variant="h5" sx={{ color: "#c2185b", fontWeight: "bold" }}>
                              ${parseFloat(analytics.totalOneTimeExpenses || 0).toFixed(2)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Total Expenses */}
                      <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ backgroundColor: "#ffebee" }}>
                          <CardContent>
                            <Typography color="textSecondary" variant="body2" gutterBottom>
                              Total Expenses
                            </Typography>
                            <Typography variant="h5" sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                              ${parseFloat((analytics.totalRecurringExpenses || 0) + (analytics.totalOneTimeExpenses || 0)).toFixed(2)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Net Amount */}
                      <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{
                          backgroundColor: analytics.netAmount >= 0 ? "#e8f5e9" : "#ffebee",
                          border: `2px solid ${analytics.netAmount >= 0 ? "#388e3c" : "#d32f2f"}`
                        }}>
                          <CardContent>
                            <Typography color="textSecondary" variant="body2" gutterBottom>
                              Net Amount
                            </Typography>
                            <Typography variant="h5" sx={{
                              color: analytics.netAmount >= 0 ? "#388e3c" : "#d32f2f",
                              fontWeight: "bold"
                            }}>
                              ${parseFloat(analytics.netAmount || 0).toFixed(2)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  )}

                  {!analytics && !loadingAnalytics && (
                    <Box sx={{ p: 4, textAlign: "center" }}>
                      <Assessment sx={{ fontSize: 48, color: "textSecondary", mb: 2 }} />
                      <Typography color="textSecondary" variant="body1">
                        Click "Summary" to generate financial overview
                      </Typography>
                    </Box>
                  )}
                </Paper>
              )}

              {/* Detailed Report Tab */}
              {activeTab === 1 && (
                <Paper sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <TrendingUpIcon sx={{ mr: 2, color: "info.main", fontSize: 28 }} />
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        Detailed Financial Report
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Complete breakdown of all revenues and expenses
                      </Typography>
                    </Box>
                  </Box>

                  {loadingStatement && (
                    <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                      <CircularProgress />
                    </Box>
                  )}

                  {statement && !loadingStatement && (
                    <Box>
                      {/* Header */}
                      <Box sx={{ mb: 4, p: 3, backgroundColor: "#f5f5f5", borderRadius: 2 }}>
                        <Box sx={{ mb: 2, pb: 2, borderBottom: "2px solid #ddd" }}>
                          <Typography variant="h6" fontWeight="bold">
                            {statement.ownerName} ({statement.ownerNumber})
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Period: {statement.periodFrom} to {statement.periodTo}
                          </Typography>
                        </Box>

                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={6} md={2.4}>
                            <Card sx={{ backgroundColor: "#e8f5e9" }}>
                              <CardContent>
                                <Typography color="textSecondary" variant="body2" gutterBottom>
                                  Total Revenues
                                </Typography>
                                <Typography variant="h6" sx={{ color: "#388e3c", fontWeight: "bold" }}>
                                  ${parseFloat(statement.totalRevenues || 0).toFixed(2)}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                          <Grid item xs={12} sm={6} md={2.4}>
                            <Card sx={{ backgroundColor: "#fff3e0" }}>
                              <CardContent>
                                <Typography color="textSecondary" variant="body2" gutterBottom>
                                  Recurring Expenses
                                </Typography>
                                <Typography variant="h6" sx={{ color: "#e65100", fontWeight: "bold" }}>
                                  ${parseFloat(statement.totalRecurringExpenses || 0).toFixed(2)}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                          <Grid item xs={12} sm={6} md={2.4}>
                            <Card sx={{ backgroundColor: "#fce4ec" }}>
                              <CardContent>
                                <Typography color="textSecondary" variant="body2" gutterBottom>
                                  One-Time Expenses
                                </Typography>
                                <Typography variant="h6" sx={{ color: "#c2185b", fontWeight: "bold" }}>
                                  ${parseFloat(statement.totalOneTimeExpenses || 0).toFixed(2)}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                          <Grid item xs={12} sm={6} md={2.4}>
                            <Card sx={{ backgroundColor: "#ffebee" }}>
                              <CardContent>
                                <Typography color="textSecondary" variant="body2" gutterBottom>
                                  Total Expenses
                                </Typography>
                                <Typography variant="h6" sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                                  ${parseFloat((statement.totalRecurringExpenses || 0) + (statement.totalOneTimeExpenses || 0)).toFixed(2)}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                          <Grid item xs={12} sm={6} md={2.4}>
                            <Card sx={{
                              backgroundColor: statement.netAmount >= 0 ? "#e8f5e9" : "#ffebee",
                              border: `2px solid ${statement.netAmount >= 0 ? "#388e3c" : "#d32f2f"}`
                            }}>
                              <CardContent>
                                <Typography color="textSecondary" variant="body2" gutterBottom>
                                  Net Amount
                                </Typography>
                                <Typography variant="h6" sx={{
                                  color: statement.netAmount >= 0 ? "#388e3c" : "#d32f2f",
                                  fontWeight: "bold"
                                }}>
                                  ${parseFloat(statement.netAmount).toFixed(2)}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        </Grid>
                      </Box>

                      {/* Revenues Table */}
                      {statement.revenues && statement.revenues.length > 0 && (
                        <Box sx={{ mb: 4 }}>
                          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: "#388e3c" }}>
                            Revenue Details
                          </Typography>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ backgroundColor: "#e8f5e9" }}>
                                  <TableCell><strong>Category</strong></TableCell>
                                  <TableCell><strong>Description</strong></TableCell>
                                  <TableCell align="right"><strong>Amount</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {statement.revenues.map((rev, idx) => (
                                  <TableRow key={idx} hover>
                                    <TableCell>{rev.categoryName || rev.category}</TableCell>
                                    <TableCell>{rev.description}</TableCell>
                                    <TableCell align="right" sx={{ color: "#388e3c", fontWeight: "bold" }}>
                                      ${parseFloat(rev.amount).toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      )}

                      {/* Recurring Expenses Table */}
                      {statement.recurringExpenses && statement.recurringExpenses.length > 0 && (
                        <Box sx={{ mb: 4 }}>
                          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: "#e65100" }}>
                            Recurring Expenses
                          </Typography>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ backgroundColor: "#fff3e0" }}>
                                  <TableCell><strong>Category</strong></TableCell>
                                  <TableCell><strong>Application Type</strong></TableCell>
                                  <TableCell align="right"><strong>Amount</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {statement.recurringExpenses.map((exp, idx) => (
                                  <TableRow key={idx} hover>
                                    <TableCell>{exp.categoryName || exp.category}</TableCell>
                                    <TableCell>{exp.applicationType}</TableCell>
                                    <TableCell align="right" sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                                      ${parseFloat(exp.amount).toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      )}

                      {/* One-Time Expenses Table */}
                      {statement.oneTimeExpenses && statement.oneTimeExpenses.length > 0 && (
                        <Box sx={{ mb: 4 }}>
                          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: "#c2185b" }}>
                            One-Time Expenses
                          </Typography>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ backgroundColor: "#fce4ec" }}>
                                  <TableCell><strong>Category</strong></TableCell>
                                  <TableCell><strong>Date</strong></TableCell>
                                  <TableCell><strong>Description</strong></TableCell>
                                  <TableCell align="right"><strong>Amount</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {statement.oneTimeExpenses.map((exp, idx) => (
                                  <TableRow key={idx} hover>
                                    <TableCell>{exp.categoryName || exp.category}</TableCell>
                                    <TableCell>{exp.date}</TableCell>
                                    <TableCell>{exp.description}</TableCell>
                                    <TableCell align="right" sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                                      ${parseFloat(exp.amount).toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      )}
                    </Box>
                  )}

                  {!statement && !loadingStatement && (
                    <Box sx={{ p: 4, textAlign: "center" }}>
                      <TrendingUpIcon sx={{ fontSize: 48, color: "textSecondary", mb: 2 }} />
                      <Typography color="textSecondary" variant="body1">
                        Click "Details" to view the complete financial report with all line items
                      </Typography>
                    </Box>
                  )}
                </Paper>
              )}
            </Box>
          </>
        )}

        {!selectedPerson && (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <PersonIcon sx={{ fontSize: 48, color: "textSecondary", mb: 2 }} />
            <Typography color="textSecondary" variant="body1">
              Select a driver or owner to view their financial reports
            </Typography>
          </Paper>
        )}
      </Container>
    </Box>
  );
}
