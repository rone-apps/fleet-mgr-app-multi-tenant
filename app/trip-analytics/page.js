"use client";

import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  Autocomplete,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Analytics,
  Lock as LockIcon,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import GlobalNav from "../components/GlobalNav";
import { getCurrentUser, apiRequest, API_BASE_URL } from "../lib/api";
import dynamic from "next/dynamic";

// Dynamically import map to avoid SSR issues
const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => <Box sx={{ p: 3 }}>Loading map...</Box>,
});

export default function TripAnalyticsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // State: Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [accountNumber, setAccountNumber] = useState(null);
  const [driverId, setDriverId] = useState(null);
  const [hoursRange, setHoursRange] = useState([0, 23]);
  const [selectedDays, setSelectedDays] = useState({
    0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, // Sun-Sat
  });

  // State: Data
  const [analyticsData, setAnalyticsData] = useState(null);
  const [accountOptions, setAccountOptions] = useState([]);
  const [driverOptions, setDriverOptions] = useState([]);
  const [geocodedPoints, setGeocodedPoints] = useState([]);

  // Auth check
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !["ADMIN", "MANAGER", "ACCOUNTANT"].includes(user.role)) {
      window.location.href = "/";
      return;
    }
    setCurrentUser(user);
  }, []);

  // Load account numbers and drivers on mount (but NOT trip data - user must click Apply Filters)
  useEffect(() => {
    if (currentUser) {
      loadAccountNumbers();
      loadDrivers();
    }
  }, [currentUser]);

  const loadAccountNumbers = async () => {
    try {
      const token = localStorage.getItem("token");
      const tenantSchema = localStorage.getItem("tenantSchema");
      const response = await fetch(`${API_BASE_URL}/analytics/trips/account-numbers`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenantSchema,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAccountOptions(data);
      }
    } catch (err) {
      console.error("Error loading account numbers:", err);
    }
  };

  const loadDrivers = async () => {
    try {
      const token = localStorage.getItem("token");
      const tenantSchema = localStorage.getItem("tenantSchema");
      const response = await fetch(`${API_BASE_URL}/drivers`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenantSchema,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const sorted = data.sort((a, b) => {
          const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
          const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setDriverOptions(sorted);
      }
    } catch (err) {
      console.error("Error loading drivers:", err);
    }
  };

  const loadTripAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        ...(accountNumber && { accountNumber }),
        ...(driverId && { driverId }),
        startHour: hoursRange[0],
        endHour: hoursRange[1],
      });

      const response = await fetch(
        `${API_BASE_URL}/analytics/trips?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);

        // Geocode addresses
        if (data.pickupAddresses && data.pickupAddresses.length > 0) {
          await geocodeAddresses(data.pickupAddresses);
        }
      } else {
        setError("Failed to load trip analytics");
      }
    } catch (err) {
      console.error("Error loading trip analytics:", err);
      setError("Error loading analytics data");
    } finally {
      setLoading(false);
    }
  };

  const geocodeAddresses = async (addresses) => {
    const topAddresses = addresses.slice(0, 50);
    const points = [];
    const maxCount = Math.max(...topAddresses.map((a) => a.count));

    setGeocodingProgress({ done: 0, total: topAddresses.length });

    for (let i = 0; i < topAddresses.length; i++) {
      const addr = topAddresses[i];
      const coords = await geocodeAddress(addr.address);

      if (coords) {
        const intensity = addr.count / maxCount;
        points.push({
          lat: coords.lat,
          lng: coords.lng,
          count: addr.count,
          address: addr.address,
          intensity,
        });
      }

      setGeocodingProgress({ done: i + 1, total: topAddresses.length });
    }

    setGeocodedPoints(points);
  };

  const geocodeAddress = async (address) => {
    const cacheKey = `geo_${address}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Rate limit: 1 request per second
    await new Promise((r) => setTimeout(r, 1100));

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          address + ", Vancouver, BC, Canada"
        )}&format=json&limit=1`,
        {
          headers: { "User-Agent": "SmartFleets/1.0" },
        }
      );

      const data = await res.json();
      if (data[0]) {
        const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        localStorage.setItem(cacheKey, JSON.stringify(coords));
        return coords;
      }
    } catch (err) {
      console.error("Geocoding error for", address, err);
    }

    return null;
  };

  const handleUnlock = () => {
    if (password === "Tax-Haven") {
      setUnlocked(true);
      setPasswordError("");
    } else {
      setPasswordError("Incorrect password");
    }
  };

  const applyFilters = () => {
    loadTripAnalytics();
  };

  const clearFilters = () => {
    const d = new Date();
    d.setDate(1);
    setStartDate(d.toISOString().split("T")[0]);
    setEndDate(new Date().toISOString().split("T")[0]);
    setAccountNumber(null);
    setDriverId(null);
    setHoursRange([0, 23]);
    setSelectedDays({
      0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true,
    });
  };

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Format hour data for chart
  const hourChartData = analyticsData?.byHour?.map((h) => ({
    hour: `${String(h.hour).padStart(2, "0")}:00`,
    trips: h.count,
  })) || [];

  // Format day of week data for chart (filter by selected days)
  const dayChartData = analyticsData?.byDayOfWeek
    ?.filter((d) => selectedDays[d.dayOfWeek - 1])
    ?.map((d) => ({
      day: dayLabels[d.dayOfWeek - 1],
      trips: d.count,
    })) || [];

  if (!currentUser) {
    return null;
  }

  // Password protection
  if (!unlocked) {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Dialog open={true} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ textAlign: "center", pt: 4 }}>
            <LockIcon sx={{ fontSize: 48, color: "#667eea", mb: 1 }} />
            <Box component="span" sx={{ display: "block", typography: "h6", fontWeight: 700 }}>
              Business Insights
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              This is a paid section. Please enter the access password to continue.
            </Alert>
            {passwordError && <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>}
            <TextField
              fullWidth
              size="small"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleUnlock(); }}
              autoFocus
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => window.location.href = "/"}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={handleUnlock}
              sx={{ backgroundColor: "#667eea", "&:hover": { backgroundColor: "#5568d3" } }}
            >
              Unlock
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f6f9fc" }}>
      <GlobalNav currentUser={currentUser} title="Trip Analytics & Heatmap" />

      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
            Trip Analytics
          </Typography>
          <Typography variant="body1" sx={{ color: "#697386" }}>
            Analyze pickup locations and trip patterns across Vancouver
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <FilterIcon />
            <Typography variant="h6">Filters</Typography>
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
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

            <Grid item xs={12} sm={6} md={2}>
              <Autocomplete
                options={accountOptions}
                value={accountNumber}
                onChange={(e, val) => setAccountNumber(val)}
                renderInput={(params) => (
                  <TextField {...params} label="Account" size="small" />
                )}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Autocomplete
                options={driverOptions}
                getOptionLabel={(opt) => `${opt.firstName} ${opt.lastName}`}
                getOptionKey={(opt) => opt.id}
                value={driverId ? driverOptions.find((d) => d.id === driverId) : null}
                onChange={(e, val) => setDriverId(val?.id || null)}
                renderInput={(params) => (
                  <TextField {...params} label="Driver" size="small" />
                )}
                isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Hour of Day: {hoursRange[0]}:00 - {hoursRange[1]}:00
              </Typography>
              <Slider
                value={hoursRange}
                onChange={(e, val) => setHoursRange(val)}
                min={0}
                max={23}
                valueLabelDisplay="auto"
                marks={[
                  { value: 0, label: "0" },
                  { value: 23, label: "23" },
                ]}
                size="small"
              />
            </Grid>
          </Grid>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
              Days of Week:
            </Typography>
            <FormGroup row>
              {dayLabels.map((day, idx) => (
                <FormControlLabel
                  key={idx}
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedDays[idx]}
                      onChange={(e) =>
                        setSelectedDays({
                          ...selectedDays,
                          [idx]: e.target.checked,
                        })
                      }
                    />
                  }
                  label={day}
                  sx={{ minWidth: "80px" }}
                />
              ))}
            </FormGroup>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<FilterIcon />}
              onClick={applyFilters}
              disabled={loading}
            >
              Apply Filters
            </Button>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              disabled={loading}
            >
              Clear
            </Button>
          </Box>
        </Paper>

        {/* Stats */}
        {analyticsData && (
          <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
            <Chip
              label={`Total Trips: ${analyticsData.totalTrips}`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: "bold" }}
            />
            <Chip
              label={`Pickup Locations: ${analyticsData.pickupAddresses.length}`}
              color="secondary"
              variant="outlined"
            />
          </Box>
        )}

        {/* Geocoding Progress */}
        {geocodingProgress.total > 0 && geocodingProgress.done < geocodingProgress.total && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Geocoding locations... {geocodingProgress.done}/{geocodingProgress.total}
            <CircularProgress size={20} sx={{ ml: 1 }} />
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Empty State - No Data Loaded */}
        {!loading && !analyticsData && (
          <Paper sx={{ p: 4, textAlign: "center", backgroundColor: "#f5f5f5" }}>
            <Box sx={{ mb: 2 }}>
              <Analytics sx={{ fontSize: 48, color: "#ccc" }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#666", mb: 1 }}>
              Ready to analyze your business
            </Typography>
            <Typography variant="body2" sx={{ color: "#999" }}>
              Set your filters and click "Apply Filters" to load trip analytics. This may take a moment as we geocode addresses.
            </Typography>
          </Paper>
        )}

        {!loading && analyticsData && (
          <>
            {/* Map */}
            {geocodedPoints.length > 0 && (
              <Paper sx={{ mb: 3, overflow: "hidden", height: "400px" }}>
                <MapComponent points={geocodedPoints} />
              </Paper>
            )}

            {/* Charts */}
            <Grid container spacing={3}>
              {/* Hour of Day Chart */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Trips by Hour of Day
                  </Typography>
                  {hourChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={hourChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="trips" fill="#f44336" name="Trips" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Typography color="text.secondary">No data available</Typography>
                  )}
                </Paper>
              </Grid>

              {/* Day of Week Chart */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Trips by Day of Week
                  </Typography>
                  {dayChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={dayChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="trips" fill="#ff7043" name="Trips" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Typography color="text.secondary">No data available</Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>

            {/* Top Pickup Addresses */}
            <Paper sx={{ mt: 3, p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Top Pickup Locations
              </Typography>
              <Box sx={{ maxHeight: "300px", overflowY: "auto" }}>
                {analyticsData.pickupAddresses.slice(0, 20).map((addr, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      py: 1,
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <Typography variant="body2">{addr.address}</Typography>
                    <Chip label={`${addr.count} trips`} size="small" variant="outlined" />
                  </Box>
                ))}
              </Box>
            </Paper>
          </>
        )}
      </Box>
    </Box>
  );
}
