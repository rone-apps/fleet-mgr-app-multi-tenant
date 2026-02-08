"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Stack,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  FormControlLabel,
  Card,
  CardContent,
  Alert,
} from "@mui/material";
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";

/**
 * BulkExpenseGrid - Component for bulk configuration of expenses with individual amounts per cab
 */
export default function BulkExpenseGrid({
  cabs = [],
  category,
  initialAmounts = {},
  onSave,
  onChange,
  onCancel,
  disabled = false,
}) {
  const [amounts, setAmounts] = useState(initialAmounts);
  const [selectedCabs, setSelectedCabs] = useState(new Set());
  const [filterText, setFilterText] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [validationErrors, setValidationErrors] = useState({});

  /**
   * Filter cabs based on search text
   */
  const filteredCabs = useMemo(() => {
    if (!filterText) return cabs;
    return cabs.filter(
      (cab) =>
        cab.cabNumber.toLowerCase().includes(filterText.toLowerCase()) ||
        (cab.registrationNumber && cab.registrationNumber.toLowerCase().includes(filterText.toLowerCase()))
    );
  }, [cabs, filterText]);

  /**
   * Get cabs for current page
   */
  const paginatedCabs = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredCabs.slice(start, start + rowsPerPage);
  }, [filteredCabs, page, rowsPerPage]);

  /**
   * Toggle cab selection
   */
  const toggleCabSelection = (cabId) => {
    const updated = new Set(selectedCabs);
    if (updated.has(cabId)) {
      updated.delete(cabId);
    } else {
      updated.add(cabId);
    }
    setSelectedCabs(updated);
    // Call onChange callback with updated data
    if (onChange) {
      const cabAmounts = {};
      updated.forEach((id) => {
        if (amounts[id]) {
          cabAmounts[id] = amounts[id];
        }
      });
      onChange(cabAmounts);
    }
  };

  /**
   * Select all cabs on current page
   */
  const selectAllOnPage = () => {
    const updated = new Set(selectedCabs);
    paginatedCabs.forEach((cab) => updated.add(cab.id));
    setSelectedCabs(updated);
  };

  /**
   * Clear all selections
   */
  const clearSelection = () => {
    setSelectedCabs(new Set());
  };

  /**
   * Update amount for a cab
   */
  const updateAmount = (cabId, value) => {
    const updated = { ...amounts };
    if (value === "" || value === null) {
      delete updated[cabId];
      // Remove validation error for this cab
      const errors = { ...validationErrors };
      delete errors[cabId];
      setValidationErrors(errors);
    } else {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        setValidationErrors({
          ...validationErrors,
          [cabId]: "Amount must be a positive number",
        });
        updated[cabId] = value;
      } else {
        updated[cabId] = numValue;
        const errors = { ...validationErrors };
        delete errors[cabId];
        setValidationErrors(errors);
      }
    }
    setAmounts(updated);
    // Call onChange callback with updated data
    if (onChange) {
      const cabAmounts = {};
      selectedCabs.forEach((id) => {
        if (updated[id]) {
          cabAmounts[id] = updated[id];
        }
      });
      onChange(cabAmounts);
    }
  };

  /**
   * Validate configuration
   */
  const validateConfiguration = () => {
    const errors = {};
    let hasErrors = false;

    selectedCabs.forEach((cabId) => {
      const amount = amounts[cabId];
      if (!amount || parseFloat(amount) <= 0) {
        errors[cabId] = "Amount is required and must be positive";
        hasErrors = true;
      }
    });

    setValidationErrors(errors);
    return !hasErrors;
  };

  /**
   * Handle save
   */
  const handleSave = () => {
    if (selectedCabs.size === 0) {
      alert("Please select at least one cab");
      return;
    }

    if (!validateConfiguration()) {
      alert("Please fix validation errors before saving");
      return;
    }

    // Prepare data for save
    const cabAmounts = {};
    selectedCabs.forEach((cabId) => {
      cabAmounts[cabId] = amounts[cabId];
    });

    onSave(cabAmounts);
  };

  /**
   * Calculate totals
   */
  const totalAmount = useMemo(() => {
    let total = 0;
    selectedCabs.forEach((cabId) => {
      const amount = amounts[cabId];
      if (amount && !isNaN(amount)) {
        total += parseFloat(amount);
      }
    });
    return total.toFixed(2);
  }, [selectedCabs, amounts]);

  /**
   * Get display info for shift type
   */
  const getShiftInfo = (cab) => {
    if (category?.appliesTo === "SHIFT") {
      if (cab.cabShiftType === "SINGLE") {
        return "1 expense";
      } else if (cab.cabShiftType === "DOUBLE") {
        const amount = amounts[cab.id];
        if (amount && !isNaN(amount)) {
          return `2 x $${parseFloat(amount).toFixed(2)} = $${(parseFloat(amount) * 2).toFixed(2)}`;
        }
        return "2 expenses";
      }
    }
    return null;
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Info Card */}
      <Card>
        <CardContent>
          <Typography variant="body2" color="textSecondary">
            Configure amounts for {category?.categoryName || "expenses"}. Select cabs and enter
            individual amounts for each.
            {category?.appliesTo === "SHIFT" && (
              <Box sx={{ mt: 1 }}>
                <strong>Note:</strong> Amounts will be applied per shift. Single shift cabs = 1
                expense, Double shift cabs = 2 expenses.
              </Box>
            )}
          </Typography>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
        <TextField
          placeholder="Search cab number..."
          value={filterText}
          onChange={(e) => {
            setFilterText(e.target.value);
            setPage(0);
          }}
          size="small"
          sx={{ flex: 1, minWidth: 200 }}
          disabled={disabled}
        />

        <Button onClick={selectAllOnPage} size="small" disabled={disabled || paginatedCabs.length === 0}>
          Select Page
        </Button>

        <Button onClick={clearSelection} size="small" disabled={disabled || selectedCabs.size === 0}>
          Clear All
        </Button>

        <Typography variant="body2" color="textSecondary">
          {selectedCabs.size} selected
        </Typography>
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={
                    paginatedCabs.length > 0 && paginatedCabs.every((cab) => selectedCabs.has(cab.id))
                  }
                  indeterminate={
                    paginatedCabs.some((cab) => selectedCabs.has(cab.id)) &&
                    !paginatedCabs.every((cab) => selectedCabs.has(cab.id))
                  }
                  onChange={selectAllOnPage}
                  disabled={disabled}
                />
              </TableCell>
              <TableCell>Cab Number</TableCell>
              <TableCell>Share Type</TableCell>
              <TableCell align="center">Airport License</TableCell>
              <TableCell>Shift Type</TableCell>
              <TableCell align="right">Amount</TableCell>
              {category?.appliesTo === "SHIFT" && <TableCell align="right">Breakdown</TableCell>}
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedCabs.length > 0 ? (
              paginatedCabs.map((cab) => (
                <TableRow
                  key={cab.id}
                  sx={{
                    backgroundColor: selectedCabs.has(cab.id) ? "#f0f0f0" : "inherit",
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedCabs.has(cab.id)}
                      onChange={() => toggleCabSelection(cab.id)}
                      disabled={disabled}
                    />
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {cab.cabNumber}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={cab.shareType ? cab.shareType.replace("_", " ") : "N/A"}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>

                  <TableCell align="center">
                    {cab.hasAirportLicense ? (
                      <Chip label="Yes" size="small" color="primary" />
                    ) : (
                      <Chip label="No" size="small" variant="outlined" />
                    )}
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={cab.cabShiftType || "N/A"}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>

                  <TableCell align="right">
                    <TextField
                      value={amounts[cab.id] || ""}
                      onChange={(e) => updateAmount(cab.id, e.target.value)}
                      placeholder="0.00"
                      type="number"
                      inputProps={{ step: "0.01", min: "0" }}
                      size="small"
                      sx={{ width: 100 }}
                      disabled={disabled || !selectedCabs.has(cab.id)}
                      error={!!validationErrors[cab.id]}
                    />
                    {validationErrors[cab.id] && (
                      <Typography variant="caption" sx={{ display: "block", color: "error.main" }}>
                        {validationErrors[cab.id]}
                      </Typography>
                    )}
                  </TableCell>

                  {category?.appliesTo === "SHIFT" && (
                    <TableCell align="right">
                      <Typography variant="body2" color="textSecondary">
                        {getShiftInfo(cab)}
                      </Typography>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={category?.appliesTo === "SHIFT" ? 7 : 6} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No cabs found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredCabs.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />

      {/* Summary */}
      <Card sx={{ backgroundColor: "#f9f9f9" }}>
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="body2">
              <strong>Selected:</strong> {selectedCabs.size} cabs
            </Typography>
            <Typography variant="body2">
              <strong>Total Amount:</strong> ${totalAmount}
            </Typography>
            {category?.appliesTo === "SHIFT" && selectedCabs.size > 0 && (
              <Typography variant="body2">
                <strong>Expenses to Create:</strong> Will create appropriate number of shift-level
                expenses
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
        <Button
          startIcon={<CancelIcon />}
          onClick={onCancel}
          disabled={disabled}
          variant="outlined"
        >
          Cancel
        </Button>

        <Button
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={disabled || selectedCabs.size === 0}
          variant="contained"
        >
          Save All
        </Button>
      </Box>
    </Box>
  );
}
