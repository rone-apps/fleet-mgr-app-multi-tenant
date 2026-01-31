"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Chip,
  Grid,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  AttachMoney as MoneyIcon,
  Business as BusinessIcon,
} from "@mui/icons-material";
import { calculateTotal } from "../../utils/helpers";
import { API_BASE_URL } from "../../../lib/api";

export default function TripChargesTab({
  customers,
  selectedCustomer,
  charges,
  bulkEditMode,
  bulkEditCharges,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  canEdit,
  canBulkEdit,
  canMarkPaid,
  showAllCustomersInCharges,
  setShowAllCustomersInCharges,
  handleSelectCustomer,
  handleOpenChargeDialog,
  handleMarkChargePaid,
  handleEnterBulkEdit,
  handleCancelBulkEdit,
  handleBulkEditChange,
  handleSaveBulkEdit,
  handleFilterCharges,
}) {
  const [customerSearch, setCustomerSearch] = useState("");
  const [customersWithBalance, setCustomersWithBalance] = useState([]);

  // Calculate totals for displayed charges
  const totalFare = charges.reduce((sum, c) => sum + (parseFloat(c.fareAmount) || 0), 0);
  const totalTip = charges.reduce((sum, c) => sum + (parseFloat(c.tipAmount) || 0), 0);
  const totalAmount = totalFare + totalTip;

  // Load customers based on showAllCustomersInCharges flag
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        let url;
        if (showAllCustomersInCharges) {
          // Load ALL active customers when checkbox is checked
          url = `${API_BASE_URL}/account-customers/active`;
        } else {
          // Load only customers with outstanding balance by default
          url = `${API_BASE_URL}/account-customers/with-outstanding-balance/amount`;
        }

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        });

        if (response.ok) {
          const data = await response.json();
          const customersArray = Array.isArray(data) ? data : (data.content || data.data || []);
          setCustomersWithBalance(customersArray);
        }
      } catch (err) {
        console.error("Error loading customers:", err);
        setCustomersWithBalance([]);
      }
    };
    loadCustomers();
  }, [showAllCustomersInCharges]);

  // Filter customers based on search term (customers are already filtered by backend based on showAllCustomersInCharges)
  const filteredCustomers = customersWithBalance.filter(customer => {
    // Filter by search term
    if (!customerSearch) return true;
    const searchLower = customerSearch.toLowerCase();
    return (
      customer.companyName?.toLowerCase().includes(searchLower) ||
      customer.city?.toLowerCase().includes(searchLower) ||
      customer.province?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Left: Customer Selection */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6">
              Select Customer
            </Typography>
          </Box>

          {/* Outstanding Balance Filter Checkbox */}
          <FormControlLabel
            control={
              <Checkbox
                checked={showAllCustomersInCharges}
                onChange={(e) => setShowAllCustomersInCharges(e.target.checked)}
              />
            }
            label="Show All Customers"
            sx={{ mb: 2, display: "block" }}
          />

          {/* Customer Search Field */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search customers..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ mb: 2 }}
          />
          
          <Paper variant="outlined" sx={{ maxHeight: 600, overflow: "auto" }}>
            <Table size="small">
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    hover
                    selected={selectedCustomer?.id === customer.id}
                    onClick={() => handleSelectCustomer(customer)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={selectedCustomer?.id === customer.id ? "bold" : "normal"}>
                        {customer.companyName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {customer.city}, {customer.province}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          color: "#d32f2f",
                          fontWeight: "bold",
                          mt: 0.5
                        }}
                      >
                        Outstanding: ${(customer.outstandingBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* Right: Charges */}
        <Grid item xs={12} md={8}>
          {selectedCustomer ? (
            <>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6">
                  Charges for {selectedCustomer.companyName}
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  {!bulkEditMode && canEdit && (
                    <>
                      {canBulkEdit && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={handleEnterBulkEdit}
                          disabled={charges.length === 0}
                        >
                          Bulk Edit
                        </Button>
                      )}
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenChargeDialog()}
                      >
                        Add Charge
                      </Button>
                    </>
                  )}
                  {bulkEditMode && (
                    <>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<CloseIcon />}
                        onClick={handleCancelBulkEdit}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        color="success"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveBulkEdit}
                      >
                        Save All
                      </Button>
                    </>
                  )}
                </Box>
              </Box>

              {/* Date Filter */}
              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <TextField
                  label="Start Date"
                  type="date"
                  size="small"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="End Date"
                  type="date"
                  size="small"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SearchIcon />}
                  onClick={handleFilterCharges}
                >
                  Filter
                </Button>
              </Box>

              {/* Charges Table */}
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Job Code</TableCell>
                      <TableCell>Passenger</TableCell>
                      <TableCell>Pickup</TableCell>
                      <TableCell>Dropoff</TableCell>
                      <TableCell align="right">
                        <Box>
                          <Typography variant="body2">Fare</Typography>
                          <Typography variant="h6" display="block" color="primary" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                            ${totalFare.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box>
                          <Typography variant="body2">Tip</Typography>
                          <Typography variant="h6" display="block" color="primary" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                            ${totalTip.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box>
                          <Typography variant="body2">Total</Typography>
                          <Typography variant="h6" display="block" color="success.main" fontWeight="bold" sx={{ fontSize: '1.2rem' }}>
                            ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>Status</TableCell>
                      {!bulkEditMode && canEdit && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {!bulkEditMode && charges.map((charge) => (
                      <TableRow key={charge.id}>
                        <TableCell>{charge.tripDate}</TableCell>
                        <TableCell>{charge.jobCode}</TableCell>
                        <TableCell>{charge.passengerName}</TableCell>
                        <TableCell>{charge.pickupAddress}</TableCell>
                        <TableCell>{charge.dropoffAddress}</TableCell>
                        <TableCell align="right">${charge.fareAmount}</TableCell>
                        <TableCell align="right">${charge.tipAmount || 0}</TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="bold">
                            ${calculateTotal(charge.fareAmount, charge.tipAmount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={charge.paid ? "Paid" : "Unpaid"}
                            color={charge.paid ? "success" : "warning"}
                            size="small"
                          />
                        </TableCell>
                        {canEdit && (
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenChargeDialog(charge)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            {!charge.paid && canMarkPaid && (
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleMarkChargePaid(charge.id)}
                                title="Mark as Paid"
                              >
                                <MoneyIcon fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}

                    {bulkEditMode && bulkEditCharges.map((charge, index) => (
                      <TableRow key={charge.id}>
                        <TableCell>{charge.tripDate}</TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={charge.jobCode || ""}
                            onChange={(e) => handleBulkEditChange(index, "jobCode", e.target.value)}
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={charge.passengerName || ""}
                            onChange={(e) => handleBulkEditChange(index, "passengerName", e.target.value)}
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={charge.pickupAddress || ""}
                            onChange={(e) => handleBulkEditChange(index, "pickupAddress", e.target.value)}
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={charge.dropoffAddress || ""}
                            onChange={(e) => handleBulkEditChange(index, "dropoffAddress", e.target.value)}
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={charge.fareAmount}
                            onChange={(e) => handleBulkEditChange(index, "fareAmount", e.target.value)}
                            InputProps={{ startAdornment: "$" }}
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={charge.tipAmount || 0}
                            onChange={(e) => handleBulkEditChange(index, "tipAmount", e.target.value)}
                            InputProps={{ startAdornment: "$" }}
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="bold">
                            ${calculateTotal(charge.fareAmount, charge.tipAmount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={charge.paid ? "Paid" : "Unpaid"}
                            color={charge.paid ? "success" : "warning"}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Paper sx={{ p: 5, textAlign: "center" }} variant="outlined">
              <BusinessIcon sx={{ fontSize: 60, color: "#ccc", mb: 2 }} />
              <Typography variant="h6" color="textSecondary">
                Select a customer to view their charges
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
