"use client";

import React from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Typography,
  Chip,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { formatCurrency, isPaymentMethodRequired } from "../utils/helpers";

export default function BulkPaymentEntryTable({
  rows,
  paymentMethods,
  onUpdateRow,
  onRemoveRow,
  isReadOnly,
  batchStatus,
}) {
  // Debug: Check if paymentMethods are being passed
  React.useEffect(() => {
    console.log("BulkPaymentEntryTable - paymentMethods:", paymentMethods);
  }, [paymentMethods]);

  const handleInputChange = (rowId, field, value) => {
    onUpdateRow(rowId, { [field]: value });
  };

  if (rows.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          textAlign: "center",
          border: "2px dashed #ccc",
          borderRadius: 2,
          backgroundColor: "#f9f9f9",
        }}
      >
        <Typography variant="h6" color="textSecondary" gutterBottom>
          No statements in this batch
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Click "Add Statements from Period" to populate this table
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} elevation={0} sx={{ overflowX: "auto" }}>
      <Table sx={{ minWidth: 1400 }}>
        <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>
              Person Name
            </TableCell>
            <TableCell sx={{ fontWeight: 600, minWidth: 100 }} align="center">
              Type
            </TableCell>
            <TableCell sx={{ fontWeight: 600, minWidth: 120 }} align="right">
              Net Payable / Due
            </TableCell>
            <TableCell sx={{ fontWeight: 600, minWidth: 120 }} align="right">
              Pay Amount
            </TableCell>
            <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>
              Method
            </TableCell>
            <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>
              Reference #
            </TableCell>
            <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>
              Notes
            </TableCell>
            <TableCell sx={{ fontWeight: 600, minWidth: 100 }} align="center">
              Status
            </TableCell>
            <TableCell sx={{ fontWeight: 600, minWidth: 60 }} align="center">
              Remove
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const requiresReference = isPaymentMethodRequired(row.method);
            const maxPayable = row.netDue > 0 ? row.netDue : 0;
            const exceedsMax = row.netDue > 0 && row.payAmount > maxPayable;
            return (
              <TableRow
                key={row.id}
                sx={{
                  "&:hover": { backgroundColor: "#fafafa" },
                  opacity: isReadOnly ? 0.7 : 1,
                }}
              >
                <TableCell>
                  <Typography variant="body2">{row.personName}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={row.personType}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" sx={{ color: row.netDue >= 0 ? "success.main" : "error.main", fontWeight: 600 }}>
                    {formatCurrency(Math.abs(row.netDue))}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {row.netDue >= 0 ? "Payable" : "Due"}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <TextField
                    type="number"
                    value={row.payAmount || ""}
                    onChange={(e) => {
                      let val = parseFloat(e.target.value) || 0;
                      if (row.netDue > 0 && val > row.netDue) {
                        val = row.netDue;
                      }
                      handleInputChange(row.id, "payAmount", val);
                    }}
                    size="small"
                    disabled={isReadOnly}
                    error={exceedsMax}
                    helperText={exceedsMax ? `Max: ${formatCurrency(maxPayable)}` : ""}
                    inputProps={{
                      step: "0.01",
                      min: "0",
                      max: row.netDue > 0 ? row.netDue : undefined,
                    }}
                    sx={{ width: 140 }}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    select
                    value={row.method || ""}
                    onChange={(e) =>
                      handleInputChange(row.id, "method", e.target.value)
                    }
                    size="small"
                    disabled={isReadOnly}
                    sx={{ width: 120 }}
                    variant="outlined"
                  >
                    <MenuItem value="">Select Method</MenuItem>
                    {paymentMethods.map((method) => (
                      <MenuItem key={method.id} value={method.methodCode || method.code}>
                        {method.methodName || method.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>
                <TableCell>
                  <TextField
                    value={row.referenceNumber || ""}
                    onChange={(e) =>
                      handleInputChange(row.id, "referenceNumber", e.target.value)
                    }
                    placeholder={requiresReference ? "Required" : "Optional"}
                    size="small"
                    disabled={isReadOnly}
                    sx={{
                      width: 150,
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: requiresReference && !row.referenceNumber ? "#fff3e0" : "inherit",
                      },
                    }}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={row.notes || ""}
                    onChange={(e) =>
                      handleInputChange(row.id, "notes", e.target.value)
                    }
                    size="small"
                    disabled={isReadOnly}
                    sx={{ width: 150 }}
                    variant="outlined"
                    multiline
                    rows={1}
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={row.status || "PENDING"}
                    size="small"
                    variant="outlined"
                    color={row.status === "PENDING" ? "default" : "success"}
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip
                    title={isReadOnly ? "Cannot remove after posting" : "Remove row"}
                  >
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => onRemoveRow(row.id)}
                        disabled={isReadOnly}
                        color="error"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
