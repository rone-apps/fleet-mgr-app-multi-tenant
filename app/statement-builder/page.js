"use client";

import { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, FormControl, InputLabel, Select, MenuItem, TextField,
  Grid, Container, Alert,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import GlobalNav from "../components/GlobalNav";
import { getCurrentUser, API_BASE_URL } from "../lib/api";

export default function StatementBuilderPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [drivers, setDrivers] = useState([]);

  // Statement tab state
  const [statementType, setStatementType] = useState("DRIVER");
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [statementStartDate, setStatementStartDate] = useState("");
  const [statementEndDate, setStatementEndDate] = useState("");
  const [statement, setStatement] = useState(null);
  const [loadingStatement, setLoadingStatement] = useState(false);

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
    setStatementStartDate(monthStart);
    setStatementEndDate(monthEnd);
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/drivers`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });
      const data = await response.json();
      setDrivers(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching drivers:", err);
      setLoading(false);
    }
  };

  const generateStatement = async () => {
    if (!selectedPersonId || !statementStartDate || !statementEndDate) {
      setError("Please fill in all required fields");
      return;
    }

    setLoadingStatement(true);
    try {
      let endpoint = "";
      if (statementType === "DRIVER") {
        endpoint = `${API_BASE_URL}/financial-statements/driver/${selectedPersonId}`;
      } else if (statementType === "OWNER") {
        endpoint = `${API_BASE_URL}/financial-statements/owner/${selectedPersonId}`;
      } else if (statementType === "OWNER_REPORT") {
        endpoint = `${API_BASE_URL}/financial-statements/owner-report/${selectedPersonId}`;
      }

      const response = await fetch(`${endpoint}?from=${statementStartDate}&to=${statementEndDate}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatement(data);
        setError("");
      } else {
        setError(await response.text() || "Failed to generate statement");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingStatement(false);
    }
  };

  if (loading) return <Box sx={{ p: 3 }}>Loading...</Box>;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      <GlobalNav />
      <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 1, color: "#3e5244" }}>
            <TrendingUpIcon sx={{ fontSize: 32 }} />
            Statement Builder
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Generate detailed financial statements for drivers and owners, review revenue & expense breakdown, and settle accounts.
          </Typography>
        </Box>

        {/* Errors/Success */}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Statement Generator Card */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Generate Financial Statement
            </Typography>
          </Box>

          <Box sx={{ p: 3 }}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth required>
                  <InputLabel>Statement Type</InputLabel>
                  <Select value={statementType} label="Statement Type" onChange={(e) => { setStatementType(e.target.value); setSelectedPersonId(""); setStatement(null); }}>
                    <MenuItem value="DRIVER">Driver Statement</MenuItem>
                    <MenuItem value="OWNER">Owner Statement</MenuItem>
                    <MenuItem value="OWNER_REPORT">Owner Financial Report</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth required>
                  <InputLabel>{statementType === "DRIVER" ? "Select Driver" : "Select Owner"}</InputLabel>
                  <Select value={selectedPersonId} label={statementType === "DRIVER" ? "Select Driver" : "Select Owner"} onChange={(e) => setSelectedPersonId(e.target.value)}>
                    <MenuItem value="">Choose...</MenuItem>
                    {drivers
                      .filter(d => statementType === "DRIVER" ? true : Boolean(d.isOwner))
                      .map(d => (
                        <MenuItem key={d.id} value={d.id}>
                          {d.firstName} {d.lastName} ({d.driverNumber})
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  label="From"
                  type="date"
                  value={statementStartDate}
                  onChange={(e) => setStatementStartDate(e.target.value)}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  label="To"
                  type="date"
                  value={statementEndDate}
                  onChange={(e) => setStatementEndDate(e.target.value)}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button variant="contained" onClick={generateStatement} fullWidth disabled={loadingStatement}>
                  {loadingStatement ? "Generating..." : "Generate"}
                </Button>
              </Grid>
            </Grid>

            {statement && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {statementType === "OWNER_REPORT" ? "Financial Report" : "Statement"} for {statement.ownerName || statement.driverName} ({statement.ownerNumber || statement.driverNumber}) - {statement.periodFrom} to {statement.periodTo}
                </Typography>

                {statementType === "OWNER_REPORT" && statement.revenues && statement.revenues.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: "success.main" }}>
                      Revenues
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: "#f0f8f0" }}>
                            <TableCell><strong>Date</strong></TableCell>
                            <TableCell><strong>Category</strong></TableCell>
                            <TableCell><strong>Description</strong></TableCell>
                            <TableCell align="right"><strong>Amount</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {statement.revenues.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{item.revenueDate}</TableCell>
                              <TableCell>{item.categoryName}</TableCell>
                              <TableCell>{item.description}</TableCell>
                              <TableCell align="right"><Typography variant="body2" fontWeight="bold" color="success.main">${parseFloat(item.amount).toFixed(2)}</Typography></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Box sx={{ mt: 1, textAlign: "right" }}>
                      <Typography variant="body2"><strong>Subtotal:</strong> ${parseFloat(statement.totalRevenues).toFixed(2)}</Typography>
                    </Box>
                  </Box>
                )}

                {(statement.recurringCharges || statement.recurringExpenses) && (statement.recurringCharges || statement.recurringExpenses).length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: "error.main" }}>
                      {statementType === "OWNER_REPORT" ? "Recurring Expenses" : "Recurring Charges"}
                    </Typography>
                    <TableContainer>
                      <Table size="small" border="1px solid #ddd">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                            <TableCell><strong>Category</strong></TableCell>
                            <TableCell><strong>Type</strong></TableCell>
                            <TableCell><strong>Billing</strong></TableCell>
                            <TableCell align="right"><strong>Amount</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(statement.recurringCharges || statement.recurringExpenses).map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{item.categoryName}</TableCell>
                              <TableCell>{item.entityDescription}</TableCell>
                              <TableCell>{item.billingMethod}</TableCell>
                              <TableCell align="right">${parseFloat(item.amount).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Box sx={{ mt: 1, textAlign: "right" }}>
                      <Typography variant="body2"><strong>Subtotal:</strong> ${parseFloat(statement.totalRecurringExpenses || statement.recurringTotal).toFixed(2)}</Typography>
                    </Box>
                  </Box>
                )}

                {(statement.oneTimeCharges || statement.oneTimeExpenses) && (statement.oneTimeCharges || statement.oneTimeExpenses).length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: "error.main" }}>
                      {statementType === "OWNER_REPORT" ? "One-Time Expenses" : "One-Time Charges"}
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                            <TableCell><strong>Date</strong></TableCell>
                            <TableCell><strong>Category</strong></TableCell>
                            <TableCell><strong>Description</strong></TableCell>
                            <TableCell align="right"><strong>Amount</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(statement.oneTimeCharges || statement.oneTimeExpenses).map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{item.date}</TableCell>
                              <TableCell>{item.categoryName}</TableCell>
                              <TableCell>{item.description}</TableCell>
                              <TableCell align="right">${parseFloat(item.amount).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Box sx={{ mt: 1, textAlign: "right" }}>
                      <Typography variant="body2"><strong>Subtotal:</strong> ${parseFloat(statement.totalOneTimeExpenses || statement.oneTimeTotal).toFixed(2)}</Typography>
                    </Box>
                  </Box>
                )}

                <Box sx={{ mt: 2, p: 2, backgroundColor: statementType === "OWNER_REPORT" ? "#f0f8f0" : "#f9f9f9", border: "1px solid #ddd", borderRadius: 1 }}>
                  {statementType === "OWNER_REPORT" && (
                    <>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        <strong>Total Revenues:</strong> <span style={{ color: "green" }}>${parseFloat(statement.totalRevenues).toFixed(2)}</span>
                      </Typography>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        <strong>Total Expenses:</strong> <span style={{ color: "red" }}>${parseFloat(statement.totalExpenses).toFixed(2)}</span>
                      </Typography>
                      <Typography variant="h5" sx={{ mt: 2, color: statement.netAmount >= 0 ? "success.main" : "error.main" }}>
                        <strong>NET AMOUNT:</strong> ${parseFloat(statement.netAmount).toFixed(2)}
                      </Typography>
                    </>
                  )}
                  {statementType !== "OWNER_REPORT" && (
                    <>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        <strong>Recurring Total:</strong> ${parseFloat(statement.recurringTotal).toFixed(2)}
                      </Typography>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        <strong>One-Time Total:</strong> ${parseFloat(statement.oneTimeTotal).toFixed(2)}
                      </Typography>
                      <Typography variant="h5" sx={{ mt: 1, color: "primary.main" }}>
                        <strong>GRAND TOTAL:</strong> ${parseFloat(statement.grandTotal).toFixed(2)}
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
