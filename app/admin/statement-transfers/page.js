'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Alert,
  CircularProgress,
  Autocomplete,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Grid,
  Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CancelIcon from '@mui/icons-material/Cancel';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HistoryIcon from '@mui/icons-material/History';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import GlobalNav from '../../components/GlobalNav';
import { getCurrentUser } from '../../lib/api';

export default function TransferManagementPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tabIndex, setTabIndex] = useState(0); // 0 = Executions, 1 = Configurations

  // ===== EXECUTIONS STATE =====
  const [executions, setExecutions] = useState([]);
  const [pendingExecutions, setPendingExecutions] = useState([]);
  const [loadingExecutions, setLoadingExecutions] = useState(false);
  const [generatingTransfers, setGeneratingTransfers] = useState(false);
  const [generatePeriodFrom, setGeneratePeriodFrom] = useState('');
  const [generatePeriodTo, setGeneratePeriodTo] = useState('');
  const [executionError, setExecutionError] = useState(null);
  const [executionSuccess, setExecutionSuccess] = useState(null);

  // Execution filters
  const [filterPeriodFrom, setFilterPeriodFrom] = useState('');
  const [filterPeriodTo, setFilterPeriodTo] = useState('');
  const [filterDriver, setFilterDriver] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  // Rejection dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [executionToReject, setExecutionToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Error/Success notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = useState('');
  const [errorDialogTitle, setErrorDialogTitle] = useState('Error');

  // ===== CONFIGURATIONS STATE =====
  const [transfers, setTransfers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loadingConfigs, setLoadingConfigs] = useState(true);
  const [configError, setConfigError] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [transferToCancelId, setTransferToCancelId] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [transferHistory, setTransferHistory] = useState([]);
  const [configFilterStatus, setConfigFilterStatus] = useState('');
  const [calculatingBalance, setCalculatingBalance] = useState(false);
  const [calculatedBalance, setCalculatedBalance] = useState(null);

  // Form state for creating transfer configuration
  const [formData, setFormData] = useState({
    sourcePersonId: null,
    targetPersonId: null,
    transferType: 'ONE_TIME',
    balanceDirection: 'POSITIVE_ONLY',
    transferAmount: '',
    transferAll: true,
    startDate: '',
    endDate: '',
    statementPeriodFrom: '',
    statementPeriodTo: '',
    description: '',
    notes: '',
    reason: '',
  });

  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };
    loadUser();
    fetchDrivers();
  }, []);

  // Load data based on active tab
  useEffect(() => {
    if (tabIndex === 0) {
      fetchAllExecutions();
    } else {
      fetchTransferConfigs();
    }
  }, [tabIndex, configFilterStatus]);

  // Refresh executions when filters change
  useEffect(() => {
    if (tabIndex === 0 && (filterPeriodFrom || filterPeriodTo || filterDriver || filterStatus)) {
      fetchFilteredExecutions();
    }
  }, [filterPeriodFrom, filterPeriodTo, filterDriver, filterStatus]);

  // ===== EXECUTION FUNCTIONS =====

  const fetchAllExecutions = async () => {
    try {
      setLoadingExecutions(true);
      const response = await fetch('/api/transfer-executions/all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-ID': localStorage.getItem('tenantSchema'),
        },
      });
      if (!response.ok) throw new Error('Failed to fetch executions');
      const data = await response.json();
      setExecutions(data);
      setPendingExecutions(data.filter(e => e.status === 'PENDING'));
      setExecutionError(null);
    } catch (err) {
      setExecutionError(err.message);
    } finally {
      setLoadingExecutions(false);
    }
  };

  const fetchFilteredExecutions = async () => {
    if (!filterPeriodFrom || !filterPeriodTo) {
      fetchAllExecutions();
      return;
    }

    try {
      setLoadingExecutions(true);
      let url = `/api/transfer-executions?periodFrom=${filterPeriodFrom}&periodTo=${filterPeriodTo}`;
      if (filterStatus) {
        url += `&status=${filterStatus}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-ID': localStorage.getItem('tenantSchema'),
        },
      });
      if (!response.ok) throw new Error('Failed to fetch executions');
      let data = await response.json();

      // Apply driver filter client-side
      if (filterDriver) {
        data = data.filter(e =>
          e.sourcePersonId === filterDriver.id || e.targetPersonId === filterDriver.id
        );
      }

      setExecutions(data);
      setPendingExecutions(data.filter(e => e.status === 'PENDING'));
      setExecutionError(null);
    } catch (err) {
      setExecutionError(err.message);
    } finally {
      setLoadingExecutions(false);
    }
  };

  const handleGenerateTransfers = async () => {
    if (!generatePeriodFrom || !generatePeriodTo) {
      showError('Validation Error', 'Please select both period dates');
      return;
    }

    try {
      setGeneratingTransfers(true);
      setExecutionError(null);
      setExecutionSuccess(null);

      const response = await fetch('/api/transfer-executions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-ID': localStorage.getItem('tenantSchema'),
        },
        body: JSON.stringify({
          periodFrom: generatePeriodFrom,
          periodTo: generatePeriodTo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate transfers');
      }

      const generated = await response.json();
      setExecutionSuccess(`Generated ${generated.length} transfer execution(s) for review`);
      setPendingExecutions(generated);
      fetchAllExecutions();
    } catch (err) {
      setExecutionError(err.message);
    } finally {
      setGeneratingTransfers(false);
    }
  };

  const handleApproveExecution = async (executionId) => {
    try {
      const response = await fetch(`/api/transfer-executions/${executionId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-ID': localStorage.getItem('tenantSchema'),
        },
        body: JSON.stringify({ notes: 'Approved from UI' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve');
      }

      setExecutionSuccess('Execution approved successfully');
      fetchAllExecutions();
    } catch (err) {
      setExecutionError(err.message);
    }
  };

  const handleRejectExecution = (execution) => {
    setExecutionToReject(execution);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleConfirmRejection = async () => {
    if (!rejectionReason.trim()) {
      showError('Validation Error', 'Please provide a rejection reason');
      return;
    }

    try {
      const response = await fetch(`/api/transfer-executions/${executionToReject.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-ID': localStorage.getItem('tenantSchema'),
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reject');
      }

      setExecutionSuccess('Execution rejected successfully');
      setRejectDialogOpen(false);
      setExecutionToReject(null);
      setRejectionReason('');
      fetchAllExecutions();
    } catch (err) {
      setExecutionError(err.message);
    }
  };

  const handleBatchApprove = async () => {
    if (pendingExecutions.length === 0) {
      showError('No Pending Executions', 'There are no pending executions to approve');
      return;
    }

    if (!window.confirm(`Approve all ${pendingExecutions.length} pending executions?`)) {
      return;
    }

    try {
      const response = await fetch('/api/transfer-executions/batch-approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-ID': localStorage.getItem('tenantSchema'),
        },
        body: JSON.stringify({
          executionIds: pendingExecutions.map(e => e.id),
          notes: 'Batch approved from UI',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to batch approve');
      }

      const result = await response.json();
      setExecutionSuccess(`Approved ${result.successCount} out of ${result.total} executions`);
      fetchAllExecutions();
    } catch (err) {
      setExecutionError(err.message);
    }
  };

  const getExecutionStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'info';
      case 'APPLIED': return 'primary';
      case 'FINALIZED': return 'success';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const clearExecutionFilters = () => {
    setFilterPeriodFrom('');
    setFilterPeriodTo('');
    setFilterDriver(null);
    setFilterStatus('');
  };

  // Helper functions for notifications
  const showError = (title, message) => {
    setErrorDialogTitle(title);
    setErrorDialogMessage(message);
    setErrorDialogOpen(true);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // ===== CONFIGURATION FUNCTIONS =====

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/drivers/active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-ID': localStorage.getItem('tenantSchema'),
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Driver fetch failed:', response.status, errorText);
        throw new Error(`Failed to fetch drivers: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      setDrivers(data);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setDrivers([]);
    }
  };

  const fetchTransferConfigs = async () => {
    try {
      setLoadingConfigs(true);
      const response = await fetch('/api/statement-balance-transfers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-ID': localStorage.getItem('tenantSchema'),
        },
      });
      if (!response.ok) throw new Error('Failed to fetch transfer configs');
      const data = await response.json();

      const filteredData = configFilterStatus
        ? data.filter(t => t.status === configFilterStatus)
        : data;

      setTransfers(filteredData);
      setConfigError(null);
    } catch (err) {
      setConfigError(err.message);
    } finally {
      setLoadingConfigs(false);
    }
  };

  const fetchTransferHistory = async (transferId) => {
    try {
      const response = await fetch(`/api/statement-balance-transfers/${transferId}/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-ID': localStorage.getItem('tenantSchema'),
        },
      });
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setTransferHistory(data);
    } catch (err) {
      console.error('Error fetching transfer history:', err);
    }
  };

  const handleCalculateBalance = async () => {
    if (!formData.sourcePersonId) {
      showError('Validation Error', 'Please select a source person first');
      return;
    }

    try {
      setCalculatingBalance(true);
      const response = await fetch(`/api/statement-balance-transfers/calculate-balance/${formData.sourcePersonId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-ID': localStorage.getItem('tenantSchema'),
        },
      });

      if (!response.ok) throw new Error('Failed to calculate balance');

      const data = await response.json();
      setCalculatedBalance(data);

      setFormData({
        ...formData,
        transferAmount: Math.abs(parseFloat(data.balance)).toFixed(2),
      });

      showSnackbar(
        `Balance calculated: $${parseFloat(data.balance).toFixed(2)} for ${data.personName}. Amount set to $${Math.abs(parseFloat(data.balance)).toFixed(2)}`,
        'info'
      );
    } catch (err) {
      showError('Calculation Error', 'Failed to calculate balance: ' + err.message);
    } finally {
      setCalculatingBalance(false);
    }
  };

  const handleCreateTransfer = async () => {
    try {
      if (!formData.sourcePersonId || !formData.targetPersonId) {
        showError('Validation Error', 'Please select source and target persons');
        return;
      }

      // Validate dates based on transfer type
      if (formData.transferType === 'ONE_TIME') {
        if (!formData.statementPeriodFrom || !formData.statementPeriodTo) {
          showError('Validation Error', 'Statement period dates are required for one-time transfers');
          return;
        }
      } else {
        // RECURRING
        if (!formData.startDate) {
          showError('Validation Error', 'Start date is required for recurring transfers');
          return;
        }
      }

      // Prepare request data with proper transfer amount and dates
      let requestData = { ...formData };

      // For "Transfer All", use 0.01 as placeholder (backend treats < $1 as "transfer all")
      if (formData.transferAll) {
        requestData.transferAmount = '0.01';
      } else {
        // For "Up to Max Amount", validate the maximum amount
        if (!formData.transferAmount || parseFloat(formData.transferAmount) <= 0) {
          showError('Validation Error', 'Please enter a maximum transfer amount greater than zero');
          return;
        }
      }

      // Ensure startDate is always set (required by backend)
      if (formData.transferType === 'ONE_TIME') {
        // For ONE_TIME, use statement period dates for start/end
        requestData.startDate = formData.statementPeriodFrom;
        requestData.endDate = formData.statementPeriodTo;
      } else {
        // For RECURRING, startDate/endDate should already be set
        if (!requestData.startDate) {
          showError('Validation Error', 'Start date is required for recurring transfers');
          return;
        }
      }

      const response = await fetch('/api/statement-balance-transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-ID': localStorage.getItem('tenantSchema'),
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        // Clone response to read it safely
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Failed to create transfer';

        try {
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
          errorMessage = `Server error (${response.status})`;
        }

        showError('Failed to Create Transfer', errorMessage);
        return;
      }

      setCreateDialogOpen(false);
      resetForm();
      setCalculatedBalance(null);
      showSnackbar('Transfer configuration created successfully');
      fetchTransferConfigs();
    } catch (err) {
      console.error('Error creating transfer:', err);
      showError('Error', 'An unexpected error occurred: ' + err.message);
    }
  };

  const handleCancelTransfer = (transferId) => {
    setTransferToCancelId(transferId);
    setCancellationReason('');
    setCancelDialogOpen(true);
  };

  const handleConfirmCancellation = async () => {
    if (!cancellationReason.trim()) {
      showError('Validation Error', 'Please provide a reason for cancellation');
      return;
    }

    try {
      const response = await fetch(`/api/statement-balance-transfers/${transferToCancelId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-ID': localStorage.getItem('tenantSchema'),
        },
        body: JSON.stringify({ reason: cancellationReason }),
      });

      if (!response.ok) throw new Error('Failed to cancel transfer');

      setCancelDialogOpen(false);
      setTransferToCancelId(null);
      setCancellationReason('');
      showSnackbar('Transfer configuration cancelled successfully');
      fetchTransferConfigs();
    } catch (err) {
      showError('Error', 'Failed to cancel transfer: ' + err.message);
    }
  };

  const handleSuspendTransfer = async (transferId) => {
    try {
      const response = await fetch(`/api/statement-balance-transfers/${transferId}/suspend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-ID': localStorage.getItem('tenantSchema'),
        },
      });

      if (!response.ok) throw new Error('Failed to suspend transfer');
      showSnackbar('Transfer configuration suspended successfully');
      fetchTransferConfigs();
    } catch (err) {
      showError('Error', 'Failed to suspend transfer: ' + err.message);
    }
  };

  const handleResumeTransfer = async (transferId) => {
    try {
      const response = await fetch(`/api/statement-balance-transfers/${transferId}/resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-ID': localStorage.getItem('tenantSchema'),
        },
      });

      if (!response.ok) throw new Error('Failed to resume transfer');
      showSnackbar('Transfer configuration resumed successfully');
      fetchTransferConfigs();
    } catch (err) {
      showError('Error', 'Failed to resume transfer: ' + err.message);
    }
  };

  const handleViewDetails = (transfer) => {
    setSelectedTransfer(transfer);
    fetchTransferHistory(transfer.id);
    setDetailDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      sourcePersonId: null,
      targetPersonId: null,
      transferType: 'ONE_TIME',
      balanceDirection: 'POSITIVE_ONLY',
      transferAmount: '',
      transferAll: true,
      startDate: '',
      endDate: '',
      statementPeriodFrom: '',
      statementPeriodTo: '',
      description: '',
      notes: '',
      reason: '',
    });
  };

  const getConfigStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'COMPLETED': return 'info';
      case 'CANCELLED': return 'error';
      case 'SUSPENDED': return 'warning';
      default: return 'default';
    }
  };

  // ===== RENDER =====

  return (
    <Box>
      <GlobalNav currentUser={currentUser} title="Transfer Management" />
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>Statement Balance Transfers</Typography>

        <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} sx={{ mb: 3 }}>
          <Tab label="Transfer Executions" />
          <Tab label="Transfer Configurations" />
        </Tabs>

        {/* TAB 1: TRANSFER EXECUTIONS */}
        {tabIndex === 0 && (
          <Box>
            {executionError && <Alert severity="error" sx={{ mb: 2 }}>{executionError}</Alert>}
            {executionSuccess && <Alert severity="success" sx={{ mb: 2 }}>{executionSuccess}</Alert>}

            {/* Generate Section */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Generate Transfers for Period</Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Period From"
                      value={generatePeriodFrom}
                      onChange={(e) => setGeneratePeriodFrom(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Period To"
                      value={generatePeriodTo}
                      onChange={(e) => setGeneratePeriodTo(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleGenerateTransfers}
                      disabled={generatingTransfers || !generatePeriodFrom || !generatePeriodTo}
                      startIcon={generatingTransfers ? <CircularProgress size={20} /> : <SwapHorizIcon />}
                    >
                      {generatingTransfers ? 'Generating...' : 'Generate Transfers'}
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Review Pending Executions */}
            {pendingExecutions.length > 0 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Review Generated Transfers ({pendingExecutions.length})
                    </Typography>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleBatchApprove}
                      startIcon={<CheckIcon />}
                    >
                      Approve All
                    </Button>
                  </Box>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Exec #</TableCell>
                          <TableCell>Source → Target</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell align="right">Source Balance</TableCell>
                          <TableCell>Period</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pendingExecutions.map((exec) => (
                          <TableRow key={exec.id}>
                            <TableCell>{exec.executionNumber}</TableCell>
                            <TableCell>
                              {exec.sourcePersonName} → {exec.targetPersonName}
                            </TableCell>
                            <TableCell align="right">
                              ${exec.calculatedAmount?.toFixed(2)}
                            </TableCell>
                            <TableCell align="right">
                              ${exec.sourceBalanceSnapshot?.toFixed(2) || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {exec.periodFrom} to {exec.periodTo}
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Approve">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleApproveExecution(exec.id)}
                                >
                                  <CheckIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRejectExecution(exec)}
                                >
                                  <CloseIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            )}

            {/* Historical Executions */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Execution History</Typography>
                  <Button
                    startIcon={<RefreshIcon />}
                    onClick={fetchAllExecutions}
                    disabled={loadingExecutions}
                  >
                    Refresh
                  </Button>
                </Box>

                {/* Filters */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Period From"
                      value={filterPeriodFrom}
                      onChange={(e) => setFilterPeriodFrom(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Period To"
                      value={filterPeriodTo}
                      onChange={(e) => setFilterPeriodTo(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Autocomplete
                      size="small"
                      options={drivers}
                      getOptionLabel={(option) => `${option.firstName} ${option.lastName} (#${option.driverNumber || option.id})`}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      value={filterDriver}
                      onChange={(e, newValue) => setFilterDriver(newValue)}
                      renderInput={(params) => <TextField {...params} label="Filter by Driver" />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={filterStatus}
                        label="Status"
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="PENDING">Pending</MenuItem>
                        <MenuItem value="APPROVED">Approved</MenuItem>
                        <MenuItem value="APPLIED">Applied</MenuItem>
                        <MenuItem value="FINALIZED">Finalized</MenuItem>
                        <MenuItem value="REJECTED">Rejected</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={clearExecutionFilters}
                      size="small"
                    >
                      Clear
                    </Button>
                  </Grid>
                </Grid>

                {loadingExecutions ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Exec #</TableCell>
                          <TableCell>Period</TableCell>
                          <TableCell>Source → Target</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Timeline</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {executions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center">
                              <Typography color="text.secondary">
                                No executions found. Generate transfers for a period to get started.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          executions.map((exec) => (
                            <TableRow key={exec.id}>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                  {exec.executionNumber}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {exec.periodFrom} to {exec.periodTo}
                              </TableCell>
                              <TableCell>
                                {exec.sourcePersonName} → {exec.targetPersonName}
                              </TableCell>
                              <TableCell align="right">
                                ${exec.calculatedAmount?.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={exec.status}
                                  color={getExecutionStatusColor(exec.status)}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" component="div">
                                  Calculated: {exec.calculationDate ? new Date(exec.calculationDate).toLocaleDateString() : 'N/A'}
                                </Typography>
                                {exec.approvedDate && (
                                  <Typography variant="caption" component="div">
                                    Approved: {new Date(exec.approvedDate).toLocaleDateString()}
                                  </Typography>
                                )}
                                {exec.appliedDate && (
                                  <Typography variant="caption" component="div">
                                    Applied: {new Date(exec.appliedDate).toLocaleDateString()}
                                  </Typography>
                                )}
                                {exec.finalizedDate && (
                                  <Typography variant="caption" component="div">
                                    Finalized: {new Date(exec.finalizedDate).toLocaleDateString()}
                                  </Typography>
                                )}
                                {exec.rejectedDate && (
                                  <Typography variant="caption" component="div" color="error">
                                    Rejected: {new Date(exec.rejectedDate).toLocaleDateString()}
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Box>
        )}

        {/* TAB 2: TRANSFER CONFIGURATIONS */}
        {tabIndex === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h5">Transfer Configurations</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
              >
                Create Configuration
              </Button>
            </Box>

            {configError && <Alert severity="error" sx={{ mb: 2 }}>{configError}</Alert>}

            <Card>
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Filter by Status</InputLabel>
                    <Select
                      value={configFilterStatus}
                      label="Filter by Status"
                      onChange={(e) => setConfigFilterStatus(e.target.value)}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="ACTIVE">Active</MenuItem>
                      <MenuItem value="COMPLETED">Completed</MenuItem>
                      <MenuItem value="CANCELLED">Cancelled</MenuItem>
                      <MenuItem value="SUSPENDED">Suspended</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {loadingConfigs ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Transfer #</TableCell>
                          <TableCell>Source → Target</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell align="right">Max Amount</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Period</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {transfers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} align="center">
                              <Typography color="text.secondary">No transfer configurations found</Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          transfers.map((transfer) => (
                            <TableRow key={transfer.id}>
                              <TableCell>{transfer.transferNumber}</TableCell>
                              <TableCell>
                                {transfer.sourcePersonName} → {transfer.targetPersonName}
                              </TableCell>
                              <TableCell>
                                <Chip label={transfer.transferType} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell align="right">
                                {transfer.transferAmount && transfer.transferAmount >= 1
                                  ? `Up to $${transfer.transferAmount.toFixed(2)}`
                                  : 'All Balance'}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={transfer.status}
                                  color={getConfigStatusColor(transfer.status)}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                {transfer.transferType === 'ONE_TIME'
                                  ? `${transfer.statementPeriodFrom} to ${transfer.statementPeriodTo}`
                                  : `${transfer.startDate} to ${transfer.endDate || 'Ongoing'}`
                                }
                              </TableCell>
                              <TableCell align="center">
                                <Tooltip title="View Details">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleViewDetails(transfer)}
                                  >
                                    <HistoryIcon />
                                  </IconButton>
                                </Tooltip>
                                {transfer.status === 'ACTIVE' && (
                                  <>
                                    <Tooltip title="Suspend">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleSuspendTransfer(transfer.id)}
                                      >
                                        <PauseIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Cancel">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleCancelTransfer(transfer.id)}
                                      >
                                        <CancelIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
                                {transfer.status === 'SUSPENDED' && (
                                  <Tooltip title="Resume">
                                    <IconButton
                                      size="small"
                                      color="success"
                                      onClick={() => handleResumeTransfer(transfer.id)}
                                    >
                                      <PlayArrowIcon />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Box>
        )}

        {/* DIALOGS */}

        {/* Reject Execution Dialog */}
        <Dialog
          open={rejectDialogOpen}
          onClose={() => setRejectDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Reject Transfer Execution</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Please provide a reason for rejecting this transfer execution.
            </Typography>
            <TextField
              autoFocus
              fullWidth
              multiline
              rows={4}
              label="Rejection Reason"
              placeholder="Enter the reason for rejecting this execution..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleConfirmRejection}
              variant="contained"
              color="error"
              disabled={!rejectionReason.trim()}
            >
              Reject Execution
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Transfer Configuration Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={() => {
            setCreateDialogOpen(false);
            resetForm();
            setCalculatedBalance(null);
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Create Transfer Configuration</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Autocomplete
                options={drivers}
                getOptionLabel={(option) => `${option.firstName} ${option.lastName} (#${option.driverNumber || option.id})`}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={drivers.find(d => d.id === formData.sourcePersonId) || null}
                onChange={(e, newValue) => {
                  setFormData({ ...formData, sourcePersonId: newValue?.id || null });
                  setCalculatedBalance(null);
                }}
                renderInput={(params) => <TextField {...params} label="Source Person *" />}
              />

              <Autocomplete
                options={drivers}
                getOptionLabel={(option) => `${option.firstName} ${option.lastName} (#${option.driverNumber || option.id})`}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={drivers.find(d => d.id === formData.targetPersonId) || null}
                onChange={(e, newValue) =>
                  setFormData({ ...formData, targetPersonId: newValue?.id || null })
                }
                renderInput={(params) => <TextField {...params} label="Target Person *" />}
              />

              <FormControl>
                <FormLabel>Transfer Type</FormLabel>
                <RadioGroup
                  row
                  value={formData.transferType}
                  onChange={(e) => setFormData({ ...formData, transferType: e.target.value })}
                >
                  <FormControlLabel value="ONE_TIME" control={<Radio />} label="One-Time" />
                  <FormControlLabel value="RECURRING" control={<Radio />} label="Recurring" />
                </RadioGroup>
              </FormControl>

              <FormControl>
                <FormLabel>Balance Direction</FormLabel>
                <RadioGroup
                  row
                  value={formData.balanceDirection}
                  onChange={(e) => setFormData({ ...formData, balanceDirection: e.target.value })}
                >
                  <FormControlLabel value="POSITIVE_ONLY" control={<Radio />} label="Positive Only" />
                  <FormControlLabel value="BOTH" control={<Radio />} label="Both" />
                </RadioGroup>
              </FormControl>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl>
                  <FormLabel>Transfer Amount</FormLabel>
                  <RadioGroup
                    value={formData.transferAll ? 'all' : 'max'}
                    onChange={(e) => setFormData({ ...formData, transferAll: e.target.value === 'all' })}
                  >
                    <FormControlLabel
                      value="all"
                      control={<Radio />}
                      label="Transfer All Balance"
                    />
                    <FormControlLabel
                      value="max"
                      control={<Radio />}
                      label="Up to Maximum Amount"
                    />
                  </RadioGroup>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    {formData.transferAll
                      ? "Transfers the entire balance, regardless of amount"
                      : "Transfers up to the max amount, or less if balance is lower"}
                  </Typography>
                </FormControl>

                {!formData.transferAll && (
                  <TextField
                    type="number"
                    label="Maximum Transfer Amount"
                    value={formData.transferAmount}
                    onChange={(e) => setFormData({ ...formData, transferAmount: e.target.value })}
                    InputProps={{ startAdornment: '$' }}
                    helperText="Transfer will not exceed this amount (e.g., max $500, but if balance is $300, only $300 is transferred)"
                    required
                  />
                )}
              </Box>

              {formData.transferType === 'ONE_TIME' && (
                <>
                  <TextField
                    type="date"
                    label="Statement Period From"
                    value={formData.statementPeriodFrom}
                    onChange={(e) => setFormData({ ...formData, statementPeriodFrom: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                  <TextField
                    type="date"
                    label="Statement Period To"
                    value={formData.statementPeriodTo}
                    onChange={(e) => setFormData({ ...formData, statementPeriodTo: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </>
              )}

              {formData.transferType === 'RECURRING' && (
                <>
                  <TextField
                    type="date"
                    label="Start Date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                  <TextField
                    type="date"
                    label="End Date (Optional)"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </>
              )}

              <TextField
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <TextField
                multiline
                rows={2}
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />

              <TextField
                multiline
                rows={2}
                label="Reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setCreateDialogOpen(false);
              resetForm();
              setCalculatedBalance(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateTransfer} variant="contained">
              Create Configuration
            </Button>
          </DialogActions>
        </Dialog>

        {/* Transfer Detail & History Dialog */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Transfer Details: {selectedTransfer?.transferNumber}
          </DialogTitle>
          <DialogContent>
            {selectedTransfer && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">Transfer Information</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">From</Typography>
                    <Typography>{selectedTransfer.sourcePersonName}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">To</Typography>
                    <Typography>{selectedTransfer.targetPersonName}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Amount</Typography>
                    <Typography>${selectedTransfer.transferAmount?.toFixed(2)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip label={selectedTransfer.status} color={getConfigStatusColor(selectedTransfer.status)} size="small" />
                  </Box>
                </Box>
              </Box>
            )}

            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 3, mb: 1 }}>
              Application History
            </Typography>
            {transferHistory.length === 0 ? (
              <Alert severity="info">No history records yet</Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {transferHistory.map((history) => (
                  <Card key={history.id} variant="outlined">
                    <CardContent>
                      <Typography variant="body2">{history.description}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Period: {history.appliedPeriodFrom} to {history.appliedPeriodTo}
                      </Typography>
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        Amount: ${history.transferAmount?.toFixed(2)}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Cancel Transfer Configuration Dialog */}
        <Dialog
          open={cancelDialogOpen}
          onClose={() => setCancelDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Cancel Transfer Configuration</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Please provide a reason for cancelling this transfer configuration. This action cannot be undone.
            </Typography>
            <TextField
              autoFocus
              fullWidth
              multiline
              rows={4}
              label="Cancellation Reason"
              placeholder="Enter the reason for cancelling this configuration..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              required
              helperText="This reason will be saved in the transfer history"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmCancellation}
              variant="contained"
              color="error"
              disabled={!cancellationReason.trim()}
            >
              Confirm Cancellation
            </Button>
          </DialogActions>
        </Dialog>

        {/* Error Dialog */}
        <Dialog
          open={errorDialogOpen}
          onClose={() => setErrorDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ color: 'error.main' }}>{errorDialogTitle}</DialogTitle>
          <DialogContent>
            <Typography>{errorDialogMessage}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setErrorDialogOpen(false)} variant="contained">
              OK
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success/Info Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}
