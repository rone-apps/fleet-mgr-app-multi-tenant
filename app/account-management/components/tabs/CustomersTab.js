"use client";

import { useState, useEffect } from "react";
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
  TableFooter,
  TextField,
  IconButton,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Description as InvoiceIcon,
  DashboardCustomize as TotalsIcon,
} from "@mui/icons-material";
import { API_BASE_URL } from "../../../lib/api";

export default function CustomersTab({
  filteredCustomers,
  filterAccountId,
  setFilterAccountId,
  filterCompanyName,
  setFilterCompanyName,
  filterActiveStatus,
  setFilterActiveStatus,
  filterAccountType,
  setFilterAccountType,
  showAllCustomers,
  setShowAllCustomers,
  applyCustomerFilters,
  clearCustomerFilters,
  canEdit,
  handleOpenCustomerDialog,
  handleToggleCustomerActive,
  handleSelectCustomer,
  handleOpenGenerateInvoiceDialog,
  setCurrentTab,
}) {
  const [customersWithBalance, setCustomersWithBalance] = useState([]);

  const handleShowAllChange = (event) => {
    setShowAllCustomers(event.target.checked);
  };

  // Load customers with outstanding balance
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        let url;
        if (showAllCustomers) {
          // Load ALL customers when checkbox is checked
          url = `${API_BASE_URL}/account-customers`;
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
  }, [showAllCustomers]);

  // Apply filters to customersWithBalance
  const getDisplayedCustomers = () => {
    let filtered = customersWithBalance;

    // Filter by Account ID
    if (filterAccountId) {
      filtered = filtered.filter((c) =>
        c.accountId?.toLowerCase().includes(filterAccountId.toLowerCase())
      );
    }

    // Filter by Company Name
    if (filterCompanyName) {
      filtered = filtered.filter((c) =>
        c.companyName?.toLowerCase().includes(filterCompanyName.toLowerCase())
      );
    }

    // Filter by Status
    if (filterActiveStatus !== "ALL") {
      filtered = filtered.filter((c) =>
        filterActiveStatus === "ACTIVE" ? c.active : !c.active
      );
    }

    // Filter by Account Type
    if (filterAccountType !== "ALL") {
      filtered = filtered.filter((c) =>
        c.accountType === filterAccountType || (!c.accountType && filterAccountType === "PERSONAL")
      );
    }

    return filtered;
  };

  // Calculate totals
  const calculateTotals = () => {
    const displayed = getDisplayedCustomers();
    return {
      totalCreditLimit: displayed.reduce((sum, c) => sum + (parseFloat(c.creditLimit) || 0), 0),
      totalOutstandingBalance: displayed.reduce((sum, c) => sum + (parseFloat(c.outstandingBalance) || 0), 0),
    };
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Filters Section */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FilterIcon /> Filters
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ClearIcon />}
            onClick={clearCustomerFilters}
          >
            Clear All
          </Button>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              label="Account ID"
              size="small"
              fullWidth
              value={filterAccountId}
              onChange={(e) => setFilterAccountId(e.target.value)}
              placeholder="Search by account ID..."
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <TextField
              label="Company Name"
              size="small"
              fullWidth
              value={filterCompanyName}
              onChange={(e) => setFilterCompanyName(e.target.value)}
              placeholder="Search by company name..."
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterActiveStatus}
                label="Status"
                onChange={(e) => setFilterActiveStatus(e.target.value)}
              >
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
                <MenuItem value="ALL">All</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl fullWidth size="small">
              <InputLabel>Account Type</InputLabel>
              <Select
                value={filterAccountType}
                label="Account Type"
                onChange={(e) => setFilterAccountType(e.target.value)}
              >
                <MenuItem value="ALL">All Types</MenuItem>
                <MenuItem value="ONE_TIME_USER">One time User</MenuItem>
                <MenuItem value="PARTY_ACCOUNT">Party Account</MenuItem>
                <MenuItem value="CORPORATE">Corporate</MenuItem>
                <MenuItem value="PERSONAL">Personal</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<SearchIcon />}
              onClick={applyCustomerFilters}
              sx={{ height: "40px" }}
            >
              Filter
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Outstanding Balance Filter Checkbox */}
      <FormControlLabel
        control={
          <Checkbox
            checked={showAllCustomers}
            onChange={handleShowAllChange}
          />
        }
        label="Show All Customers"
        sx={{ mb: 2, display: "block" }}
      />

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6">Account Customers ({getDisplayedCustomers().length})</Typography>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenCustomerDialog()}
          >
            Add Customer
          </Button>
        )}
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Account ID</TableCell>
              <TableCell>Company Name</TableCell>
              <TableCell>Account Type</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Credit Limit</TableCell>
              <TableCell>Outstanding Balance</TableCell>
              <TableCell>Status</TableCell>
              {canEdit && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {getDisplayedCustomers().map((customer) => (
              <TableRow
                key={customer.id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => {
                  setCurrentTab(1);
                  handleSelectCustomer(customer);
                }}
              >
                <TableCell>
                  <Chip 
                    label={customer.accountId} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {customer.companyName}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={customer.accountType ? customer.accountType.replace(/_/g, " ") : "Personal"}
                    size="small"
                    variant="outlined"
                    color={
                      customer.accountType === "CORPORATE" ? "primary" :
                      customer.accountType === "PARTY_ACCOUNT" ? "secondary" :
                      customer.accountType === "ONE_TIME_USER" ? "default" :
                      "default"
                    }
                  />
                </TableCell>
                <TableCell>{customer.contactPerson}</TableCell>
                <TableCell>{customer.phoneNumber}</TableCell>
                <TableCell>
                  {customer.creditLimit ? `$${customer.creditLimit}` : "N/A"}
                </TableCell>
                <TableCell>
                  <Typography
                    sx={{
                      color: customer.outstandingBalance > 0 ? "#d32f2f" : "inherit",
                      fontWeight: customer.outstandingBalance > 0 ? "bold" : "normal",
                    }}
                  >
                    ${(customer.outstandingBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={customer.active ? <ActiveIcon /> : <InactiveIcon />}
                    label={customer.active ? "Active" : "Inactive"}
                    color={customer.active ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                {canEdit && (
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenCustomerDialog(customer)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleCustomerActive(customer)}
                      color={customer.active ? "default" : "success"}
                    >
                      {customer.active ? <InactiveIcon fontSize="small" /> : <ActiveIcon fontSize="small" />}
                    </IconButton>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenGenerateInvoiceDialog(customer);
                      }}
                      title="Generate Invoice"
                    >
                      <InvoiceIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
              <TableCell colSpan={5} align="right" sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
                  <TotalsIcon fontSize="small" />
                  TOTALS:
                </Box>
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                ${calculateTotals().totalCreditLimit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", fontSize: "1rem", color: calculateTotals().totalOutstandingBalance > 0 ? "#d32f2f" : "inherit" }}>
                ${calculateTotals().totalOutstandingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </TableCell>
              <TableCell />
              {canEdit && <TableCell />}
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </Box>
  );
}
