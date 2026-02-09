import { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Alert, Grid, CircularProgress, Chip,
} from "@mui/material";
import { Calculate as CalculateIcon, Close as CloseIcon } from "@mui/icons-material";
import { API_BASE_URL } from "../../lib/api";

export default function ShiftChargesCalculator({ open, onClose }) {
  const [shifts, setShifts] = useState([]);
  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chargeResult, setChargeResult] = useState(null);

  useEffect(() => {
    if (open) {
      loadShifts();
    }
  }, [open]);

  const loadShifts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/shifts`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setShifts(data);
      }
    } catch (err) {
      console.error("Error loading shifts:", err);
      setError("Failed to load shifts");
    }
  };

  const handleCalculate = async () => {
    if (!selectedShiftId || !startDate || !endDate) {
      setError("Please fill in all required fields");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date must be before end date");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/attribute-costs/shift/${selectedShiftId}/charges?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setChargeResult(data.chargeCalculation);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to calculate charges");
      }
    } catch (err) {
      console.error("Error calculating charges:", err);
      setError("Failed to calculate shift charges");
    } finally {
      setLoading(false);
    }
  };

  const selectedShift = shifts.find(s => s.id === parseInt(selectedShiftId));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CalculateIcon />
          <Typography variant="h6">Calculate Shift Charges</Typography>
        </Box>
        <CloseIcon
          sx={{ cursor: "pointer" }}
          onClick={onClose}
        />
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Shift</InputLabel>
              <Select
                value={selectedShiftId}
                onChange={(e) => {
                  setSelectedShiftId(e.target.value);
                  setChargeResult(null);
                }}
                label="Shift"
              >
                {shifts.map((shift) => (
                  <MenuItem key={shift.id} value={shift.id}>
                    {shift.cabNumber} - {shift.shiftTypeDisplay} ({shift.currentOwnerName})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {selectedShift && (
            <Grid item xs={12} md={6}>
              <Alert severity="info">
                Selected: {selectedShift.cabNumber} - {selectedShift.shiftTypeDisplay}
                <br />
                Owner: {selectedShift.currentOwnerName}
              </Alert>
            </Grid>
          )}

          <Grid item xs={12} md={4}>
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setChargeResult(null);
              }}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setChargeResult(null);
              }}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleCalculate}
              disabled={!selectedShiftId || !startDate || !endDate || loading}
              sx={{ height: "100%" }}
            >
              {loading ? <CircularProgress size={24} /> : "Calculate"}
            </Button>
          </Grid>
        </Grid>

        {/* Charge Result */}
        {chargeResult && (
          <Box>
            <Paper sx={{ p: 2, mb: 2, backgroundColor: "#f0f7ff" }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Shift
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                <Chip label={chargeResult.shiftNumber} />
                <Chip label={chargeResult.shiftType} variant="outlined" />
              </Box>

              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Period
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {chargeResult.periodStartDate} to {chargeResult.periodEndDate}
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: "bold", color: "error.main" }}>
                Total Charges: ${parseFloat(chargeResult.totalCharges).toFixed(2)}
              </Typography>
            </Paper>

            {chargeResult.lineItems && chargeResult.lineItems.length > 0 ? (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
                  Charge Breakdown ({chargeResult.lineItems.length} items)
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                        <TableCell>Attribute</TableCell>
                        <TableCell>Value</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Unit</TableCell>
                        <TableCell>Period</TableCell>
                        <TableCell align="center">Days</TableCell>
                        <TableCell align="right">Charge</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {chargeResult.lineItems.map((item, idx) => (
                        <TableRow key={idx} sx={{ "&:hover": { backgroundColor: "#f9f9f9" } }}>
                          <TableCell>
                            <Chip label={item.attributeCode} size="small" />
                          </TableCell>
                          <TableCell>{item.attributeValue || "-"}</TableCell>
                          <TableCell>${parseFloat(item.price).toFixed(2)}</TableCell>
                          <TableCell>{item.billingUnit}</TableCell>
                          <TableCell>
                            {item.chargeStartDate} to {item.chargeEndDate}
                          </TableCell>
                          <TableCell align="center">{item.daysActive}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold">
                              ${parseFloat(item.charge).toFixed(2)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ) : (
              <Alert severity="info">
                No charges for this shift during the selected period
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
