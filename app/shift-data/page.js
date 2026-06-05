"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TableSortLabel, TextField, Grid, Autocomplete,
  Chip, IconButton, Collapse, Alert, CircularProgress,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import GlobalNav from "../components/GlobalNav";
import { API_BASE_URL, getCurrentUser, apiRequest } from "../lib/api";

export default function ShiftDataPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [driverNameFilter, setDriverNameFilter] = useState(null);
  const [cabFilter, setCabFilter] = useState(null);
  const [driverNumberFilter, setDriverNumberFilter] = useState(null);

  // Sorting
  const [orderBy, setOrderBy] = useState("logonTime");
  const [order, setOrder] = useState("asc");

  // Expanded rows for session detail
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !["ADMIN", "MANAGER", "ACCOUNTANT"].includes(user.role)) {
      window.location.href = "/";
      return;
    }
    setCurrentUser(user);
  }, []);

  // Fetch shifts when dates change
  useEffect(() => {
    if (currentUser && startDate && endDate) {
      fetchShifts();
    }
  }, [currentUser, startDate, endDate]);

  // Derive unique options from loaded shifts
  const driverNameOptions = useMemo(() => {
    const map = new Map();
    shifts.forEach(s => {
      const name = (s.driverFirstName || s.driverLastName)
        ? `${s.driverFirstName || ""} ${s.driverLastName || ""}`.trim()
        : s.driverName;
      if (name && !map.has(s.driverNumber)) {
        map.set(s.driverNumber, { label: `${name} (${s.driverNumber})`, driverNumber: s.driverNumber });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [shifts]);

  const driverNumberOptions = useMemo(() => {
    const unique = [...new Set(shifts.map(s => s.driverNumber).filter(Boolean))];
    return unique.sort();
  }, [shifts]);

  const cabNumberOptions = useMemo(() => {
    const unique = [...new Set(shifts.map(s => s.cabNumber).filter(Boolean))];
    return unique.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [shifts]);

  const fetchShifts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest(`/driver-shifts/range?startDate=${startDate}&endDate=${endDate}`);
      if (res.ok) {
        const data = await res.json();
        setShifts(data.data || []);
      } else {
        setError("Failed to fetch shift data");
      }
    } catch (e) {
      setError("Error fetching shifts: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column) => {
    const isAsc = orderBy === column && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(column);
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter and sort
  const filteredShifts = useMemo(() => {
    let result = [...shifts];

    if (driverNameFilter) {
      result = result.filter(s => s.driverNumber === driverNameFilter.driverNumber);
    }
    if (driverNumberFilter) {
      result = result.filter(s => s.driverNumber === driverNumberFilter);
    }
    if (cabFilter) {
      result = result.filter(s => s.cabNumber === cabFilter);
    }

    result.sort((a, b) => {
      let aVal = a[orderBy];
      let bVal = b[orderBy];
      if (aVal == null) aVal = "";
      if (bVal == null) bVal = "";
      if (typeof aVal === "string") {
        return order === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return order === "asc" ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [shifts, driverNameFilter, cabFilter, driverNumberFilter, orderBy, order]);

  const formatDateTime = (dt) => {
    if (!dt) return "-";
    const d = new Date(dt);
    return d.toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
  };

  const formatDate = (dt) => {
    if (!dt) return "-";
    const d = new Date(dt);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatHours = (h) => {
    if (h == null) return "-";
    return parseFloat(h).toFixed(2);
  };

  const parseSessions = (json) => {
    try {
      return JSON.parse(json || "[]");
    } catch {
      return [];
    }
  };

  if (!currentUser) return null;

  const sortableHeader = (label, key) => (
    <TableSortLabel active={orderBy === key} direction={orderBy === key ? order : "asc"} onClick={() => handleSort(key)}>
      <strong>{label}</strong>
    </TableSortLabel>
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f6f9fc" }}>
      <GlobalNav currentUser={currentUser} title="Smart Fleets - Driver Shift Data" />

      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
          Driver Shift Data
        </Typography>
        <Typography variant="body1" sx={{ color: "#697386", mb: 3 }}>
          View and audit driver shift sessions, logon/logoff times, and consolidation details.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>
        )}

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                options={driverNameOptions}
                value={driverNameFilter}
                onChange={(e, val) => setDriverNameFilter(val)}
                getOptionLabel={(opt) => opt.label || ""}
                isOptionEqualToValue={(opt, val) => opt.driverNumber === val.driverNumber}
                renderInput={(params) => (
                  <TextField {...params} label="Driver Name" size="small" placeholder="Select driver..." />
                )}
                size="small"
                clearOnEscape
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Autocomplete
                options={driverNumberOptions}
                value={driverNumberFilter}
                onChange={(e, val) => setDriverNumberFilter(val)}
                renderInput={(params) => (
                  <TextField {...params} label="Driver Number" size="small" placeholder="Select..." />
                )}
                size="small"
                clearOnEscape
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Autocomplete
                options={cabNumberOptions}
                value={cabFilter}
                onChange={(e, val) => setCabFilter(val)}
                renderInput={(params) => (
                  <TextField {...params} label="Cab Number" size="small" placeholder="Select..." />
                )}
                size="small"
                clearOnEscape
              />
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <Chip
                label={`${filteredShifts.length} shifts`}
                color="primary"
                variant="outlined"
                sx={{ fontWeight: "bold" }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Data Table */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: "70vh" }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow sx={{ "& th": { bgcolor: "#f5f5f5" } }}>
                  <TableCell width={30} />
                  <TableCell>{sortableHeader("Date", "logonTime")}</TableCell>
                  <TableCell>{sortableHeader("Driver #", "driverNumber")}</TableCell>
                  <TableCell>{sortableHeader("Cab #", "cabNumber")}</TableCell>
                  <TableCell>{sortableHeader("Driver Name", "driverFirstName")}</TableCell>
                  <TableCell>{sortableHeader("Logon", "logonTime")}</TableCell>
                  <TableCell>{sortableHeader("Logoff", "logoffTime")}</TableCell>
                  <TableCell align="right">{sortableHeader("Hours", "totalHours")}</TableCell>
                  <TableCell>{sortableHeader("Shift", "primaryShiftType")}</TableCell>
                  <TableCell align="center">{sortableHeader("Sessions", "sessionCount")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredShifts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No shift data found for the selected period</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredShifts.map((shift) => {
                    const sessions = parseSessions(shift.sessionHistory);
                    const hasMultipleSessions = sessions.length > 1;
                    const isExpanded = expandedRows[shift.id];

                    return (
                      <React.Fragment key={shift.id}>
                        <TableRow
                          hover
                          sx={{
                            cursor: hasMultipleSessions ? "pointer" : "default",
                            bgcolor: hasMultipleSessions ? "#fffde7" : "inherit",
                          }}
                          onClick={() => hasMultipleSessions && toggleRow(shift.id)}
                        >
                          <TableCell>
                            {hasMultipleSessions && (
                              <IconButton size="small">
                                {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                              </IconButton>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(shift.logonTime)}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: "bold" }}>
                              {shift.driverNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                              {shift.cabNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {shift.driverFirstName || shift.driverLastName
                              ? `${shift.driverFirstName || ""} ${shift.driverLastName || ""}`.trim()
                              : shift.driverName || "-"}
                          </TableCell>
                          <TableCell>{formatDateTime(shift.logonTime)}</TableCell>
                          <TableCell>{formatDateTime(shift.logoffTime)}</TableCell>
                          <TableCell align="right">{formatHours(shift.totalHours)}</TableCell>
                          <TableCell>
                            <Chip
                              label={shift.primaryShiftType || "-"}
                              size="small"
                              color={shift.primaryShiftType === "DAY" ? "warning" : "info"}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">
                            {hasMultipleSessions ? (
                              <Chip
                                label={`${shift.sessionCount || sessions.length} sessions`}
                                size="small"
                                color="warning"
                                sx={{ fontWeight: "bold" }}
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">1</Typography>
                            )}
                          </TableCell>
                        </TableRow>

                        {/* Expanded session detail */}
                        {hasMultipleSessions && (
                          <TableRow>
                            <TableCell colSpan={10} sx={{ p: 0, borderBottom: isExpanded ? undefined : "none" }}>
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <Box sx={{ m: 2, bgcolor: "#f9fbe7", borderRadius: 1, p: 2 }}>
                                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
                                    Consolidated Sessions ({sessions.length} logon/logoff pairs)
                                  </Typography>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell><strong>#</strong></TableCell>
                                        <TableCell><strong>Logon</strong></TableCell>
                                        <TableCell><strong>Logoff</strong></TableCell>
                                        <TableCell align="right"><strong>Hours</strong></TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {sessions.map((sess, idx) => (
                                        <TableRow key={idx}>
                                          <TableCell>{idx + 1}</TableCell>
                                          <TableCell>{formatDateTime(sess.logon)}</TableCell>
                                          <TableCell>{formatDateTime(sess.logoff)}</TableCell>
                                          <TableCell align="right">{sess.hours != null ? parseFloat(sess.hours).toFixed(2) : "-"}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
}
