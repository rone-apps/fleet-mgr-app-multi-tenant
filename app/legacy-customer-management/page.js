"use client";

import { useState, useEffect, Fragment } from "react";
import {
  Box,
  Typography,
  Paper,
  Alert,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Collapse,
} from "@mui/material";
import {
  MenuBook,
  People,
  Receipt,
  ExpandMore,
  ExpandLess,
  Refresh,
  Warning,
  Info,
} from "@mui/icons-material";
import { Autocomplete, TablePagination, CircularProgress, Backdrop } from "@mui/material";
import GlobalNav from "../components/GlobalNav";
import { getCurrentUser, apiRequest } from "../lib/api";

const legacyCards = [
  { key: "enter", label: "Enter Charges", description: "Add new legacy charges", icon: Receipt, color: "#8b5cf6" },
  { key: "customers", label: "Legacy Customers", description: "View legacy customer accounts", icon: People, color: "#f57c00" },
  { key: "charges", label: "Legacy Charges", description: "View historical charge records", icon: Receipt, color: "#ff6f00" },
];

export default function LegacyCustomerManagementPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTab, setCurrentTab] = useState("enter");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Enter Charges form state
  const [chargeDate, setChargeDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeTip, setChargeTip] = useState('0');
  const [chargeNotes, setChargeNotes] = useState('');
  const [recentCharges, setRecentCharges] = useState([]);

  // Legacy Customers
  const [legacyCustomers, setLegacyCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Legacy Charges
  const [legacyCharges, setLegacyCharges] = useState([]);
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [allCharges, setAllCharges] = useState([]);

  // Filters - default to last 30 days
  const getDefaultDates = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return {
      start: thirtyDaysAgo.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
  };

  const defaultDates = getDefaultDates();
  const [filterCustomer, setFilterCustomer] = useState(null);
  const [filterDriver, setFilterDriver] = useState(null);
  const [filterStartDate, setFilterStartDate] = useState(defaultDates.start);
  const [filterEndDate, setFilterEndDate] = useState(defaultDates.end);

  // Autocomplete options
  const [drivers, setDrivers] = useState([]);
  const [customers, setCustomers] = useState([]); // For charge filters
  const [allCustomers, setAllCustomers] = useState([]); // For charge entry

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCharges, setTotalCharges] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user) {
      fetchLegacyCustomers();
      fetchDrivers();
      fetchCustomersForFilter();
      fetchAllCustomers();
    }
  }, []);

  // Removed automatic charge loading - user must click "Apply" to search

  const fetchDrivers = async () => {
    try {
      const response = await apiRequest('/legacy-customers/drivers');
      if (response.ok) {
        const data = await response.json();
        setDrivers(data);
      }
    } catch (err) {
      console.error('Error fetching drivers:', err);
    }
  };

  const fetchCustomersForFilter = async () => {
    try {
      const response = await apiRequest('/legacy-customers/customers-with-charges');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const fetchAllCustomers = async () => {
    try {
      const response = await apiRequest('/legacy-customers/customers-list');
      if (response.ok) {
        const data = await response.json();
        setAllCustomers(data);
      }
    } catch (err) {
      console.error('Error fetching all customers:', err);
    }
  };

  const fetchLegacyCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest('/legacy-customers');

      if (!response.ok) throw new Error('Failed to fetch legacy customers');

      const data = await response.json();
      setLegacyCustomers(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching legacy customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLegacyCharges = async (customerId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest(`/legacy-customers/${customerId}/charges`);

      if (!response.ok) throw new Error('Failed to fetch legacy charges');

      const data = await response.json();
      setLegacyCharges(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching legacy charges:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCharges = async (pageNum = 0, pageSize = rowsPerPage) => {
    setLoading(true);
    setError(null);
    try {
      // Build query params with pagination
      const params = new URLSearchParams();
      if (filterDriver) params.append('driverNumber', filterDriver.driverNumber);
      if (filterCustomer) params.append('customerDbId', filterCustomer.dbId);
      if (filterStartDate) params.append('startDate', filterStartDate);
      if (filterEndDate) params.append('endDate', filterEndDate);
      params.append('page', pageNum);
      params.append('size', pageSize);

      const queryString = params.toString();
      const url = `/legacy-customers/charges/all?${queryString}`;

      const response = await apiRequest(url);

      if (!response.ok) throw new Error('Failed to fetch all legacy charges');

      const data = await response.json();

      // Server returns paginated data
      setAllCharges(data.content || []);
      setTotalCharges(data.totalElements || 0);

      // Calculate totals from current page data
      const pageTotal = (data.content || []).reduce((sum, charge) => sum + (charge.amount || 0), 0);
      const pagePaid = (data.content || []).reduce((sum, charge) => sum + (charge.payment || 0), 0);
      setTotalAmount(pageTotal);
      setTotalPaid(pagePaid);

      setPage(pageNum);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching all legacy charges:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    fetchAllCharges(newPage, rowsPerPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const newSize = parseInt(event.target.value, 10);
    setRowsPerPage(newSize);
    fetchAllCharges(0, newSize);
  };

  const handleClearFilters = () => {
    const defaults = getDefaultDates();
    setFilterCustomer(null);
    setFilterDriver(null);
    setFilterStartDate(defaults.start);
    setFilterEndDate(defaults.end);
    // Clear displayed charges - user must click Apply to search again
    setAllCharges([]);
    setTotalCharges(0);
    setTotalAmount(0);
    setTotalPaid(0);
    setPage(0);
  };

  const handleCustomerExpand = (customerId) => {
    if (expandedCustomer === customerId) {
      setExpandedCustomer(null);
    } else {
      setExpandedCustomer(customerId);
      fetchLegacyCharges(customerId);
    }
  };

  const handleCreateCharge = async (e) => {
    e?.preventDefault();

    // Validation
    if (!chargeDate) {
      setError('Date is required');
      return;
    }
    if (!selectedAccount) {
      setError('Account is required');
      return;
    }
    if (!selectedDriver) {
      setError('Driver is required');
      return;
    }
    if (!chargeAmount || parseFloat(chargeAmount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        date: chargeDate,
        customerDbId: selectedAccount.dbId,
        driverNumber: selectedDriver.driverNumber,
        amount: parseFloat(chargeAmount),
        tip: parseFloat(chargeTip) || 0,
        notes: chargeNotes || null
      };

      const response = await apiRequest('/legacy-customers/charges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create charge');
        } else {
          throw new Error('Failed to create charge');
        }
      }

      const newCharge = await response.json();

      // Add to recent charges at the top
      setRecentCharges(prev => [newCharge, ...prev]);

      // Clear form (keep date and reset others)
      setSelectedAccount(null);
      setSelectedDriver(null);
      setChargeAmount('');
      setChargeTip('0');
      setChargeNotes('');

      setSuccess('Charge created successfully!');
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      setError(err.message);
      console.error('Error creating charge:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreateCharge();
    }
  };

  const calculateTotal = () => {
    const amount = parseFloat(chargeAmount) || 0;
    const tip = parseFloat(chargeTip) || 0;
    return (amount + tip).toFixed(2);
  };

  const renderCustomersTab = () => (
    <Box>
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
          <Info sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
          Legacy Data - Migration Tool
        </Typography>
        <Typography variant="body2">
          This section displays data from your legacy system. These customers and charges exist in the legacy_customer_charge
          and legacy_account_customer tables. Use this view to verify data before migrating to the modern account_charge system.
        </Typography>
      </Alert>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb' }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Customer ID</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Company Name</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Contact</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>City</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Credit Limit</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {legacyCustomers.map((customer) => (
              <Fragment key={customer.id}>
                <TableRow hover>
                  <TableCell>
                    <Chip label={customer.customerId} size="small" sx={{ backgroundColor: '#f3f4f6' }} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{customer.name}</TableCell>
                  <TableCell>{customer.contact || '-'}</TableCell>
                  <TableCell>{customer.phone || '-'}</TableCell>
                  <TableCell>{customer.city || '-'}</TableCell>
                  <TableCell>
                    {customer.creditLimit ? `$${Number(customer.creditLimit).toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleCustomerExpand(customer.id)}
                      sx={{ color: '#f57c00' }}
                    >
                      {expandedCustomer === customer.id ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={7} sx={{ p: 0, border: 'none' }}>
                    <Collapse in={expandedCustomer === customer.id} timeout="auto" unmountOnExit>
                      <Box sx={{ p: 3, backgroundColor: '#fafafa' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#f57c00' }}>
                          Legacy Charges for {customer.name}
                        </Typography>
                        {loading ? (
                          <Typography>Loading charges...</Typography>
                        ) : legacyCharges.length > 0 ? (
                          <TableContainer component={Paper} elevation={0}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Date</TableCell>
                                  <TableCell>Amount</TableCell>
                                  <TableCell>Payment</TableCell>
                                  <TableCell>Cab</TableCell>
                                  <TableCell>Driver</TableCell>
                                  <TableCell>Type</TableCell>
                                  <TableCell>Notes</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {legacyCharges.map((charge) => (
                                  <TableRow key={charge.id}>
                                    <TableCell>{charge.date || '-'}</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#059669' }}>
                                      ${Number(charge.amount || 0).toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                      {charge.payment ? `$${Number(charge.payment).toFixed(2)}` : '-'}
                                    </TableCell>
                                    <TableCell>{charge.cabId || '-'}</TableCell>
                                    <TableCell>
                                      {charge.driverNumber ? (
                                        <Box>
                                          <Typography variant="body2">{charge.driverNumber}</Typography>
                                          {charge.driverName && (
                                            <Typography variant="caption" color="text.secondary">
                                              {charge.driverName}
                                            </Typography>
                                          )}
                                        </Box>
                                      ) : '-'}
                                    </TableCell>
                                    <TableCell>{charge.type || '-'}</TableCell>
                                    <TableCell>{charge.notes || '-'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography variant="body2" color="text.secondary">No charges found for this customer.</Typography>
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {legacyCustomers.length === 0 && !loading && (
        <Paper sx={{ p: 6, textAlign: 'center', border: '1px solid #e5e7eb' }} elevation={0}>
          <Warning sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
            No Legacy Customers Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Legacy customer data will appear here once migrated from your old system.
          </Typography>
        </Paper>
      )}
    </Box>
  );

  const renderChargesTab = () => (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Legacy Charges Search
        </Typography>
        <Typography variant="body2">
          Define your search criteria below (driver, customer, date range) and click "Apply" to load charges.
        </Typography>
      </Alert>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid #e5e7eb' }} elevation={0}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={2.5}>
            <Autocomplete
              size="small"
              options={drivers}
              getOptionLabel={(option) => `${option.driverNumber} - ${option.driverName}`}
              value={filterDriver}
              onChange={(event, newValue) => setFilterDriver(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Driver" placeholder="Select driver" />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={2.5}>
            <Autocomplete
              size="small"
              options={customers}
              getOptionLabel={(option) => `${option.customerId} - ${option.name}`}
              value={filterCustomer}
              onChange={(event, newValue) => setFilterCustomer(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Customer" placeholder="Select customer" />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Start Date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="End Date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={1.5}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => fetchAllCharges(0, rowsPerPage)}
              sx={{ backgroundColor: '#f57c00', '&:hover': { backgroundColor: '#e65100' } }}
            >
              Apply
            </Button>
          </Grid>
          <Grid item xs={12} sm={1.5}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleClearFilters}
              sx={{ borderColor: '#f57c00', color: '#f57c00' }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Totals Summary */}
      {totalCharges > 0 && (
        <Paper sx={{ p: 2, mb: 3, border: '1px solid #e5e7eb', backgroundColor: '#f8fafc' }} elevation={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Page Totals ({allCharges.length} of {totalCharges} charges)
            </Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">Page Total</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#059669' }}>
                ${totalAmount.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">Page Paid</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2563eb' }}>
                ${totalPaid.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">Page Balance</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#dc2626' }}>
                ${(totalAmount - totalPaid).toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb', position: 'relative' }}>
        {/* Loading Spinner */}
        {loading && (
          <Backdrop
            open={loading}
            sx={{
              position: 'absolute',
              zIndex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            <CircularProgress sx={{ color: '#f57c00' }} />
          </Backdrop>
        )}

        <Table>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Payment</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Cab</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Driver</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allCharges.map((charge) => (
              <TableRow key={charge.id} hover>
                <TableCell>{charge.date || '-'}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  {charge.customerName || '-'}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#059669' }}>
                  ${Number(charge.amount || 0).toFixed(2)}
                </TableCell>
                <TableCell>
                  {charge.payment ? `$${Number(charge.payment).toFixed(2)}` : '-'}
                </TableCell>
                <TableCell>{charge.cabId || '-'}</TableCell>
                <TableCell>
                  {charge.driverNumber ? (
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {charge.driverNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {charge.driverName || ''}
                      </Typography>
                    </Box>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={charge.type || 'N/A'}
                    size="small"
                    sx={{ backgroundColor: '#f3f4f6' }}
                  />
                </TableCell>
                <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {charge.notes || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalCharges > 0 && (
        <TablePagination
          component="div"
          count={totalCharges}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          sx={{ borderTop: '1px solid #e5e7eb' }}
        />
      )}

      {allCharges.length === 0 && !loading && (
        <Paper sx={{ p: 6, textAlign: 'center', border: '1px solid #e5e7eb', mt: 3 }} elevation={0}>
          <Receipt sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
            {totalCharges === 0 && page === 0 ? 'No Charges Loaded' : 'No Legacy Charges Found'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {totalCharges === 0 && page === 0
              ? 'Select your search criteria above and click "Apply" to load legacy charges.'
              : 'No charges found matching the selected criteria.'}
          </Typography>
        </Paper>
      )}
    </Box>
  );

  const renderEnterChargesTab = () => (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Quick Charge Entry
        </Typography>
        <Typography variant="body2">
          Enter charge details and press Enter or click Add to save. The form will reset for quick consecutive entries.
        </Typography>
      </Alert>

      {/* Entry Form */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid #e5e7eb' }} elevation={0}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          New Charge Entry
        </Typography>
        <form onSubmit={handleCreateCharge}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Date"
                value={chargeDate}
                onChange={(e) => setChargeDate(e.target.value)}
                onKeyPress={handleFormKeyPress}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={2.5}>
              <Autocomplete
                size="small"
                options={allCustomers}
                getOptionLabel={(option) => `${option.customerId} - ${option.name}`}
                value={selectedAccount}
                onChange={(event, newValue) => setSelectedAccount(newValue)}
                isOptionEqualToValue={(option, value) => option.dbId === value.dbId}
                renderInput={(params) => (
                  <TextField {...params} label="Account *" placeholder="Select account" required />
                )}
                onKeyPress={handleFormKeyPress}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Autocomplete
                size="small"
                options={drivers}
                getOptionLabel={(option) => `${option.driverNumber} - ${option.driverName}`}
                value={selectedDriver}
                onChange={(event, newValue) => setSelectedDriver(newValue)}
                isOptionEqualToValue={(option, value) => option.driverNumber === value.driverNumber}
                renderInput={(params) => (
                  <TextField {...params} label="Driver *" placeholder="Select driver" required />
                )}
                onKeyPress={handleFormKeyPress}
              />
            </Grid>
            <Grid item xs={12} sm={1.5}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Amount *"
                value={chargeAmount}
                onChange={(e) => setChargeAmount(e.target.value)}
                onKeyPress={handleFormKeyPress}
                inputProps={{ step: '0.01', min: '0' }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={1.5}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Tip"
                value={chargeTip}
                onChange={(e) => setChargeTip(e.target.value)}
                onKeyPress={handleFormKeyPress}
                inputProps={{ step: '0.01', min: '0' }}
              />
            </Grid>
            <Grid item xs={12} sm={1.5}>
              <TextField
                fullWidth
                size="small"
                label="Total"
                value={calculateTotal()}
                InputProps={{ readOnly: true }}
                sx={{ '& input': { fontWeight: 600, color: '#059669' } }}
              />
            </Grid>
            <Grid item xs={12} sm={1}>
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={loading}
                sx={{
                  backgroundColor: '#8b5cf6',
                  '&:hover': { backgroundColor: '#7c3aed' },
                  height: '40px'
                }}
              >
                {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Add'}
              </Button>
            </Grid>
          </Grid>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                label="Notes (Optional)"
                value={chargeNotes}
                onChange={(e) => setChargeNotes(e.target.value)}
                placeholder="Add any additional notes..."
              />
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Recent Charges */}
      {recentCharges.length > 0 && (
        <Paper sx={{ border: '1px solid #e5e7eb' }} elevation={0}>
          <Box sx={{ p: 2, borderBottom: '1px solid #e5e7eb', backgroundColor: '#f8fafc' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Recently Added ({recentCharges.length})
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Account</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Driver</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentCharges.map((charge, index) => (
                  <TableRow key={charge.id || index} hover>
                    <TableCell>{charge.date || '-'}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {charge.customerName || '-'}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {charge.driverNumber || '-'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {charge.driverName || ''}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#059669' }}>
                      ${Number(charge.amount || 0).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {charge.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f6f9fc' }}>
      <GlobalNav currentUser={currentUser} />

      <Box sx={{ maxWidth: 1400, mx: 'auto', p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f57c00 0%, #ff6f00 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MenuBook sx={{ fontSize: 28, color: '#fff' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
                Legacy Customer Management
              </Typography>
              <Typography variant="body2" sx={{ color: '#8792a2' }}>
                View and manage legacy customer accounts & historical charges
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                if (currentTab === 'customers') fetchLegacyCustomers();
                else if (currentTab === 'charges' && totalCharges > 0) fetchAllCharges(page, rowsPerPage);
                else if (currentTab === 'enter') {
                  fetchDrivers();
                  fetchAllCustomers();
                }
              }}
              disabled={currentTab === 'charges' && totalCharges === 0}
              sx={{ borderColor: '#f57c00', color: '#f57c00' }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {/* Category Cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {legacyCards.map((card) => (
            <Grid item xs={12} sm={4} md={4} key={card.key}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: currentTab === card.key ? `2px solid ${card.color}` : '1px solid #e5e7eb',
                  backgroundColor: currentTab === card.key ? `${card.color}08` : '#fff',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)',
                  },
                }}
                onClick={() => setCurrentTab(card.key)}
                elevation={currentTab === card.key ? 2 : 0}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '10px',
                        backgroundColor: `${card.color}14`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <card.icon sx={{ fontSize: 24, color: card.color }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', mb: 0.5 }}>
                        {card.label}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#697386', fontSize: '0.875rem' }}>
                        {card.description}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Tab Content */}
        {currentTab === 'enter' && renderEnterChargesTab()}
        {currentTab === 'customers' && renderCustomersTab()}
        {currentTab === 'charges' && renderChargesTab()}
      </Box>
    </Box>
  );
}
