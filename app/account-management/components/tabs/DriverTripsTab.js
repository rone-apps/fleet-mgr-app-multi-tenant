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
  Grid,
  TablePagination,
  TableSortLabel,
  Alert,
  Autocomplete,
  Chip,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  Edit as EditIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  AccountBalance as AccountIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { API_BASE_URL } from "../../../lib/api";

export default function DriverTripsTab({ cabs, drivers, customers, canEdit }) {
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalItems, setTotalItems] = useState(0);

  // Sorting
  const [orderBy, setOrderBy] = useState("tripDate");
  const [order, setOrder] = useState("desc");

  // Data
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Date range (mandatory)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);

  // Filter inputs
  const [filterCabId, setFilterCabId] = useState("");
  const [filterDriverName, setFilterDriverName] = useState("");
  const [filterDriverUsername, setFilterDriverUsername] = useState("");

  // Applied date range (set on "Load Trips" click)
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");

  // Debounced filter values for text inputs
  const [debouncedDriverName, setDebouncedDriverName] = useState("");
  const [debouncedDriverUsername, setDebouncedDriverUsername] = useState("");

  // Inline edit state: tripId -> { accountId, customerName }
  const [editingRowId, setEditingRowId] = useState(null);
  const [editAccountId, setEditAccountId] = useState("");
  const [editCustomerName, setEditCustomerName] = useState("");

  // Build customer lookup maps
  const customerList = customers || [];
  const customersByAccountId = {};
  const customersByName = {};
  customerList.forEach((c) => {
    if (c.accountId) customersByAccountId[c.accountId] = c;
    if (c.companyName) customersByName[c.companyName] = c;
  });

  // Natural sort for cab numbers
  const naturalSort = (a, b) => {
    const ax = [];
    const bx = [];
    a.replace(/(\d+)|(\D+)/g, (_, num, str) => {
      ax.push([num || Infinity, str || ""]);
    });
    b.replace(/(\d+)|(\D+)/g, (_, num, str) => {
      bx.push([num || Infinity, str || ""]);
    });
    while (ax.length && bx.length) {
      const an = ax.shift();
      const bn = bx.shift();
      const nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
      if (nn) return nn;
    }
    return ax.length - bx.length;
  };

  const sortedCabs = cabs
    ? [...cabs].sort((a, b) => naturalSort(a.cabNumber, b.cabNumber))
    : [];

  // Debounce text filter inputs (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedDriverName(filterDriverName), 300);
    return () => clearTimeout(timer);
  }, [filterDriverName]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedDriverUsername(filterDriverUsername), 300);
    return () => clearTimeout(timer);
  }, [filterDriverUsername]);

  // Load trips
  const loadTrips = useCallback(async () => {
    if (!appliedStartDate || !appliedEndDate) return;

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");

      const params = new URLSearchParams({
        page: page.toString(),
        size: rowsPerPage.toString(),
        sortBy: orderBy,
        sortDir: order,
        startDate: appliedStartDate,
        endDate: appliedEndDate,
      });

      if (filterCabId) params.append("cabId", filterCabId);
      if (debouncedDriverName) params.append("driverName", debouncedDriverName);
      if (debouncedDriverUsername) params.append("driverUsername", debouncedDriverUsername);

      const response = await fetch(
        `${API_BASE_URL}/driver-trips?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTrips(data.content || []);
        setTotalItems(data.totalItems || 0);
        setHasLoaded(true);
      } else {
        setError(`Failed to load driver trips (${response.status})`);
      }
    } catch (err) {
      setError("Failed to load driver trips. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, orderBy, order, filterCabId, debouncedDriverName, debouncedDriverUsername, appliedStartDate, appliedEndDate]);

  // Reload when pagination/sort/filters change (after initial load)
  useEffect(() => {
    if (appliedStartDate && appliedEndDate) {
      loadTrips();
    }
  }, [loadTrips]);

  // Reset to page 0 when filters change (after initial load)
  useEffect(() => {
    if (hasLoaded && page !== 0) {
      setPage(0);
    }
  }, [filterCabId, debouncedDriverName, debouncedDriverUsername]);

  const handleLoadTrips = () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setPage(0);
  };

  const clearFilters = () => {
    setFilterCabId("");
    setFilterDriverName("");
    setFilterDriverUsername("");
    // Keep dates, just clear extra filters
  };

  const handleSort = (field) => {
    const isAsc = orderBy === field && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(field);
  };

  // --- Inline edit: Account Number / Account Name with auto-fill ---

  const handleStartEdit = (trip) => {
    setEditingRowId(trip.id);
    setEditAccountId(trip.accountNumber || "");
    // Try to resolve the name from existing customers
    const cust = trip.accountNumber ? customersByAccountId[trip.accountNumber] : null;
    setEditCustomerName(cust ? cust.companyName : "");
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditAccountId("");
    setEditCustomerName("");
  };

  // When user selects/types account number, auto-fill account name
  const handleAccountIdChange = (accountId) => {
    setEditAccountId(accountId || "");
    const cust = accountId ? customersByAccountId[accountId] : null;
    setEditCustomerName(cust ? cust.companyName : "");
  };

  // When user selects/types account name, auto-fill account number
  const handleCustomerNameChange = (companyName) => {
    setEditCustomerName(companyName || "");
    const cust = companyName ? customersByName[companyName] : null;
    setEditAccountId(cust ? cust.accountId : "");
  };

  const handleSaveAccount = async (tripId) => {
    if (!editAccountId) {
      setError("Please select or enter an account number");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/driver-trips/${tripId}/account-number`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
          body: JSON.stringify({ accountNumber: editAccountId }),
        }
      );

      if (response.ok) {
        setTrips((prev) =>
          prev.map((t) =>
            t.id === tripId ? { ...t, accountNumber: editAccountId } : t
          )
        );
        setEditingRowId(null);
        setEditAccountId("");
        setEditCustomerName("");
        setSuccess("Account number updated & charge created");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to update account number");
      }
    } catch (err) {
      setError("Failed to update account number");
    }
  };

  const handleConvertToCharge = async (tripId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/driver-trips/${tripId}/convert-to-charge`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setSuccess(data.message || "Trip saved as account charge");
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.message || "Failed to convert trip to account charge");
      }
    } catch (err) {
      setError("Failed to convert trip to account charge");
    }
  };

  // Resolve account name for display (non-editing rows)
  const getAccountName = (accountNumber) => {
    if (!accountNumber) return "";
    const cust = customersByAccountId[accountNumber];
    return cust ? cust.companyName : "";
  };

  // Page totals
  const pageTotalFare = trips.reduce(
    (sum, t) => sum + (parseFloat(t.fareAmount) || 0),
    0
  );
  const pageTotalTip = trips.reduce(
    (sum, t) => sum + (parseFloat(t.tipAmount) || 0),
    0
  );
  const pageTotalAmount = pageTotalFare + pageTotalTip;

  const sortableHeader = (field, label) => (
    <TableSortLabel
      active={orderBy === field}
      direction={orderBy === field ? order : "asc"}
      onClick={() => handleSort(field)}
    >
      {label}
    </TableSortLabel>
  );

  // Autocomplete options
  const accountIdOptions = [...new Set(customerList
    .filter((c) => c.accountId)
    .map((c) => c.accountId))]
    .sort();
  const accountNameOptions = [...new Set(customerList
    .filter((c) => c.companyName)
    .map((c) => c.companyName))]
    .sort();

  return (
    <Box sx={{ p: 3 }}>
      {/* Messages */}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Date Range + Filters */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, backgroundColor: "#f8f9fa" }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="Start Date"
              type="date"
              size="small"
              fullWidth
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="End Date"
              type="date"
              size="small"
              fullWidth
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Autocomplete
              size="small"
              options={sortedCabs}
              getOptionLabel={(opt) => opt.cabNumber || ""}
              value={
                sortedCabs.find(
                  (c) => String(c.id) === String(filterCabId)
                ) || null
              }
              onChange={(_, val) => setFilterCabId(val ? val.id : "")}
              renderInput={(params) => <TextField {...params} label="Cab" />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="Driver Name"
              size="small"
              fullWidth
              value={filterDriverName}
              onChange={(e) => setFilterDriverName(e.target.value)}
              placeholder="Search name..."
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="Driver ID"
              size="small"
              fullWidth
              value={filterDriverUsername}
              onChange={(e) => setFilterDriverUsername(e.target.value)}
              placeholder="Driver username..."
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                onClick={handleLoadTrips}
                fullWidth
                disabled={loading}
              >
                Load Trips
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={clearFilters}
                startIcon={<ClearIcon />}
              >
                Clear
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary line */}
      {hasLoaded && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="body2" color="textSecondary">
            {totalItems} trip{totalItems !== 1 ? "s" : ""} found
            {appliedStartDate &&
              appliedEndDate &&
              ` | ${appliedStartDate} to ${appliedEndDate}`}
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Chip
              label={`Fare: $${pageTotalFare.toFixed(2)}`}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`Tip: $${pageTotalTip.toFixed(2)}`}
              size="small"
              color="secondary"
              variant="outlined"
            />
            <Chip
              label={`Total: $${pageTotalAmount.toFixed(2)}`}
              size="small"
              color="success"
            />
          </Box>
        </Box>
      )}

      {/* Prompt before first load */}
      {!hasLoaded && !loading && (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Select a date range and click "Load Trips"
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Driver trips will be displayed here. You can then associate account
            numbers to trips.
          </Typography>
        </Box>
      )}

      {/* Table */}
      {loading ? (
        <Box sx={{ textAlign: "center", py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        hasLoaded && (
          <>
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ maxHeight: 600 }}
            >
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{sortableHeader("tripDate", "Date")}</TableCell>
                    <TableCell>Job Code</TableCell>
                    <TableCell>
                      {sortableHeader("driverName", "Driver")}
                    </TableCell>
                    <TableCell>Driver ID</TableCell>
                    <TableCell>Cab</TableCell>
                    <TableCell>Pickup</TableCell>
                    <TableCell>Dropoff</TableCell>
                    <TableCell>Passenger</TableCell>
                    <TableCell align="right">
                      {sortableHeader("fareAmount", "Fare")}
                    </TableCell>
                    <TableCell align="right">Tip</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>Account #</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>Account Name</TableCell>
                    {canEdit && (
                      <TableCell align="center">Actions</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trips.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={canEdit ? 14 : 13}
                        align="center"
                        sx={{ py: 4 }}
                      >
                        <Typography color="textSecondary">
                          No driver trips found for this date range.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    trips.map((trip) => {
                      const isEditing = editingRowId === trip.id;
                      const fare = parseFloat(trip.fareAmount) || 0;
                      const tip = parseFloat(trip.tipAmount) || 0;
                      const total = fare + tip;
                      const hasAccount =
                        trip.accountNumber &&
                        trip.accountNumber.trim() !== "";
                      const accountName = getAccountName(trip.accountNumber);

                      return (
                        <TableRow
                          key={trip.id}
                          hover
                          sx={{
                            backgroundColor: hasAccount
                              ? "#f0faf0"
                              : "inherit",
                          }}
                        >
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {trip.tripDate}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.8rem" }}>
                            {trip.jobCode}
                          </TableCell>
                          <TableCell>{trip.driverName}</TableCell>
                          <TableCell>{trip.driverUsername}</TableCell>
                          <TableCell>
                            {trip.cab?.cabNumber || "-"}
                          </TableCell>
                          <TableCell
                            sx={{
                              maxWidth: 130,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <Tooltip title={trip.pickupAddress || ""}>
                              <span>{trip.pickupAddress || "-"}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell
                            sx={{
                              maxWidth: 130,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <Tooltip title={trip.dropoffAddress || ""}>
                              <span>{trip.dropoffAddress || "-"}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell>{trip.passengerName || "-"}</TableCell>
                          <TableCell align="right">
                            ${fare.toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            ${tip.toFixed(2)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            ${total.toFixed(2)}
                          </TableCell>

                          {/* Account # column */}
                          <TableCell>
                            {isEditing ? (
                              <Autocomplete
                                size="small"
                                freeSolo
                                options={accountIdOptions}
                                value={editAccountId}
                                onChange={(_, val) =>
                                  handleAccountIdChange(val)
                                }
                                onInputChange={(_, val, reason) => {
                                  if (reason === "input")
                                    handleAccountIdChange(val);
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    placeholder="Account #"
                                    sx={{ minWidth: 120 }}
                                  />
                                )}
                              />
                            ) : (
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: hasAccount ? 600 : 400,
                                  color: hasAccount
                                    ? "#2e7d32"
                                    : "text.secondary",
                                }}
                              >
                                {trip.accountNumber || "-"}
                              </Typography>
                            )}
                          </TableCell>

                          {/* Account Name column */}
                          <TableCell>
                            {isEditing ? (
                              <Autocomplete
                                size="small"
                                freeSolo
                                options={accountNameOptions}
                                value={editCustomerName}
                                onChange={(_, val) =>
                                  handleCustomerNameChange(val)
                                }
                                onInputChange={(_, val, reason) => {
                                  if (reason === "input")
                                    handleCustomerNameChange(val);
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    placeholder="Account Name"
                                    sx={{ minWidth: 150 }}
                                  />
                                )}
                              />
                            ) : (
                              <Typography
                                variant="body2"
                                sx={{
                                  color: accountName
                                    ? "text.primary"
                                    : "text.secondary",
                                }}
                              >
                                {accountName || "-"}
                              </Typography>
                            )}
                          </TableCell>

                          {/* Actions */}
                          {canEdit && (
                            <TableCell
                              align="center"
                              sx={{ whiteSpace: "nowrap" }}
                            >
                              {isEditing ? (
                                <>
                                  <Tooltip title="Save">
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() =>
                                        handleSaveAccount(trip.id)
                                      }
                                    >
                                      <CheckIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Cancel">
                                    <IconButton
                                      size="small"
                                      onClick={handleCancelEdit}
                                    >
                                      <CloseIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              ) : (
                                <>
                                  <Tooltip title="Edit Account">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleStartEdit(trip)}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalItems}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[25, 50, 100]}
            />
          </>
        )
      )}
    </Box>
  );
}
