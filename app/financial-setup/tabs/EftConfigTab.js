"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  MenuItem,
} from "@mui/material";
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  AccountBalance as BankIcon,
} from "@mui/icons-material";
import { API_BASE_URL } from "../../lib/api";

const BANKS = [
  { code: "001", name: "BMO (Bank of Montreal)" },
  { code: "002", name: "Scotiabank" },
  { code: "003", name: "RBC (Royal Bank)" },
  { code: "004", name: "TD Bank" },
  { code: "006", name: "National Bank" },
  { code: "010", name: "CIBC" },
  { code: "016", name: "HSBC Canada" },
  { code: "030", name: "Canadian Western Bank" },
  { code: "039", name: "Laurentian Bank" },
  { code: "219", name: "ATB Financial" },
];

const TRANSACTION_CODES = [
  { code: "200", label: "200 - Payroll Deposit" },
  { code: "230", label: "230 - Expense Reimbursement" },
  { code: "250", label: "250 - Accounts Payable" },
  { code: "270", label: "270 - Miscellaneous Payment" },
];

export default function EftConfigTab({ canEdit, setError, setSuccess }) {
  const [config, setConfig] = useState({
    originatorId: "",
    originatorShortName: "",
    originatorLongName: "",
    processingCentre: "",
    currencyCode: "CAD",
    transactionCode: "200",
    returnInstitutionId: "",
    returnTransitNumber: "",
    returnAccountNumber: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configId, setConfigId] = useState(null);

  // Bank accounts state
  const [bankAccounts, setBankAccounts] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [addDialog, setAddDialog] = useState(false);
  const [newAccount, setNewAccount] = useState({
    driverId: null,
    accountHolderName: "",
    institutionNumber: "",
    transitNumber: "",
    accountNumber: "",
    accountType: "CHEQUING",
  });

  const getHeaders = () => {
    const token = localStorage.getItem("token");
    const tenant = localStorage.getItem("tenantSchema");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(tenant && { "X-Tenant-ID": tenant }),
    };
  };

  useEffect(() => {
    loadConfig();
    loadBankAccounts();
    loadDrivers();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/eft/config`, {
        headers: getHeaders(),
      });
      if (response.ok && response.status !== 204) {
        const data = await response.json();
        setConfig(data);
        setConfigId(data.id);
      }
    } catch (e) {
      console.error("Error loading EFT config:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadBankAccounts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/eft/bank-accounts`, {
        headers: getHeaders(),
      });
      if (response.ok) setBankAccounts(await response.json());
    } catch (e) {
      console.error("Error loading bank accounts:", e);
    }
  };

  const loadDrivers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/drivers`, {
        headers: getHeaders(),
      });
      if (response.ok) setDrivers(await response.json());
    } catch (e) {
      console.error("Error loading drivers:", e);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const payload = { ...config };
      if (configId) payload.id = configId;

      const response = await fetch(`${API_BASE_URL}/eft/config`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save EFT configuration");

      const saved = await response.json();
      setConfig(saved);
      setConfigId(saved.id);
      setSuccess("EFT configuration saved successfully");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddBankAccount = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/eft/bank-accounts`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(newAccount),
      });

      if (!response.ok) throw new Error("Failed to save bank account");

      setAddDialog(false);
      setNewAccount({
        driverId: null,
        accountHolderName: "",
        institutionNumber: "",
        transitNumber: "",
        accountNumber: "",
        accountType: "CHEQUING",
      });
      loadBankAccounts();
      setSuccess("Bank account added successfully");
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDeleteBankAccount = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/eft/bank-accounts/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      loadBankAccounts();
      setSuccess("Bank account removed");
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const bankName = (code) => BANKS.find((b) => b.code === code)?.name || code;

  return (
    <Box>
      {/* Originator Configuration */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <BankIcon /> EFT Originator Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          These details are provided by your bank when you register for EFT/direct deposit services.
          The originator ID and processing centre are assigned by your bank.
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Originator ID"
              value={config.originatorId || ""}
              onChange={(e) => setConfig({ ...config, originatorId: e.target.value })}
              fullWidth
              size="small"
              helperText="10-digit ID assigned by bank"
              inputProps={{ maxLength: 10 }}
              disabled={!canEdit}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Short Name"
              value={config.originatorShortName || ""}
              onChange={(e) => setConfig({ ...config, originatorShortName: e.target.value })}
              fullWidth
              size="small"
              helperText="Appears on payee bank statement (15 chars)"
              inputProps={{ maxLength: 15 }}
              disabled={!canEdit}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Long Name"
              value={config.originatorLongName || ""}
              onChange={(e) => setConfig({ ...config, originatorLongName: e.target.value })}
              fullWidth
              size="small"
              helperText="Full company name (30 chars)"
              inputProps={{ maxLength: 30 }}
              disabled={!canEdit}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Processing Centre"
              value={config.processingCentre || ""}
              onChange={(e) => setConfig({ ...config, processingCentre: e.target.value })}
              fullWidth
              size="small"
              helperText="Bank-assigned code"
              inputProps={{ maxLength: 5 }}
              disabled={!canEdit}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Currency"
              value={config.currencyCode || "CAD"}
              onChange={(e) => setConfig({ ...config, currencyCode: e.target.value })}
              fullWidth
              size="small"
              select
              disabled={!canEdit}
            >
              <MenuItem value="CAD">CAD</MenuItem>
              <MenuItem value="USD">USD</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Transaction Code"
              value={config.transactionCode || "200"}
              onChange={(e) => setConfig({ ...config, transactionCode: e.target.value })}
              fullWidth
              size="small"
              select
              disabled={!canEdit}
            >
              {TRANSACTION_CODES.map((tc) => (
                <MenuItem key={tc.code} value={tc.code}>{tc.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
          Return Account (for rejected transactions)
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Institution Number"
              value={config.returnInstitutionId || ""}
              onChange={(e) => setConfig({ ...config, returnInstitutionId: e.target.value })}
              fullWidth
              size="small"
              helperText="3-digit bank code"
              inputProps={{ maxLength: 4 }}
              disabled={!canEdit}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Transit Number"
              value={config.returnTransitNumber || ""}
              onChange={(e) => setConfig({ ...config, returnTransitNumber: e.target.value })}
              fullWidth
              size="small"
              helperText="5-digit branch number"
              inputProps={{ maxLength: 5 }}
              disabled={!canEdit}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Account Number"
              value={config.returnAccountNumber || ""}
              onChange={(e) => setConfig({ ...config, returnAccountNumber: e.target.value })}
              fullWidth
              size="small"
              helperText="Company bank account"
              inputProps={{ maxLength: 12 }}
              disabled={!canEdit}
            />
          </Grid>
        </Grid>

        {canEdit && (
          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSaveConfig}
              disabled={saving || !config.originatorId || !config.originatorShortName}
            >
              {saving ? "Saving..." : "Save Configuration"}
            </Button>
          </Box>
        )}
      </Paper>

      {/* Driver/Owner Bank Accounts */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Driver/Owner Bank Accounts
          </Typography>
          {canEdit && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setAddDialog(true)}
              size="small"
            >
              Add Bank Account
            </Button>
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Bank account details for Direct Deposit payments. Only drivers with bank accounts on file
          will be included in EFT file generation.
        </Typography>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: 600 }}>Driver</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Account Holder</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Bank</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Transit</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Account</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                {canEdit && <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {bankAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 8 : 7} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No bank accounts configured yet
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                bankAccounts.map((ba) => (
                  <TableRow key={ba.id}>
                    <TableCell>
                      {ba.driver?.driverNumber} - {ba.driver?.firstName} {ba.driver?.lastName}
                    </TableCell>
                    <TableCell>{ba.accountHolderName}</TableCell>
                    <TableCell>{bankName(ba.institutionNumber)}</TableCell>
                    <TableCell sx={{ fontFamily: "monospace" }}>{ba.transitNumber}</TableCell>
                    <TableCell sx={{ fontFamily: "monospace" }}>{ba.maskedAccountNumber || `****${ba.accountNumber?.slice(-4)}`}</TableCell>
                    <TableCell>{ba.accountType}</TableCell>
                    <TableCell>
                      <Chip
                        label={ba.isVerified ? "Verified" : "Unverified"}
                        size="small"
                        color={ba.isVerified ? "success" : "default"}
                        variant="outlined"
                      />
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteBankAccount(ba.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add Bank Account Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Add Bank Account</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <Autocomplete
              options={drivers.filter((d) => d.status === "ACTIVE")}
              getOptionLabel={(d) => `${d.driverNumber} - ${d.firstName} ${d.lastName}`}
              onChange={(e, v) => {
                setNewAccount({
                  ...newAccount,
                  driverId: v?.id || null,
                  accountHolderName: v ? `${v.firstName} ${v.lastName}` : "",
                });
              }}
              renderInput={(params) => (
                <TextField {...params} label="Driver" size="small" required />
              )}
            />
            <TextField
              label="Account Holder Name"
              value={newAccount.accountHolderName}
              onChange={(e) => setNewAccount({ ...newAccount, accountHolderName: e.target.value })}
              size="small"
              required
              helperText="Name as it appears on the bank account (max 30 chars)"
              inputProps={{ maxLength: 30 }}
            />
            <Autocomplete
              options={BANKS}
              getOptionLabel={(b) => `${b.code} - ${b.name}`}
              onChange={(e, v) => setNewAccount({ ...newAccount, institutionNumber: v?.code || "" })}
              renderInput={(params) => (
                <TextField {...params} label="Bank / Institution" size="small" required />
              )}
            />
            <TextField
              label="Transit / Branch Number"
              value={newAccount.transitNumber}
              onChange={(e) => setNewAccount({ ...newAccount, transitNumber: e.target.value.replace(/\D/g, "") })}
              size="small"
              required
              helperText="5-digit branch number"
              inputProps={{ maxLength: 5 }}
            />
            <TextField
              label="Account Number"
              value={newAccount.accountNumber}
              onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value.replace(/\D/g, "") })}
              size="small"
              required
              helperText="Bank account number (up to 12 digits)"
              inputProps={{ maxLength: 12 }}
            />
            <TextField
              label="Account Type"
              value={newAccount.accountType}
              onChange={(e) => setNewAccount({ ...newAccount, accountType: e.target.value })}
              size="small"
              select
            >
              <MenuItem value="CHEQUING">Chequing</MenuItem>
              <MenuItem value="SAVINGS">Savings</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddBankAccount}
            disabled={
              !newAccount.driverId ||
              !newAccount.accountHolderName ||
              !newAccount.institutionNumber ||
              !newAccount.transitNumber ||
              !newAccount.accountNumber
            }
          >
            Add Account
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
