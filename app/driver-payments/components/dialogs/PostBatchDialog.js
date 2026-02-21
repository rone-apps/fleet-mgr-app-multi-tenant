"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { Warning as WarningIcon } from "@mui/icons-material";
import { formatCurrency, formatDate } from "../../utils/helpers";

export default function PostBatchDialog({
  open,
  onClose,
  onSubmit,
  batch,
  rows,
  isLoading,
}) {
  const [showWarning, setShowWarning] = useState(false);

  if (!batch) {
    return null;
  }

  const totalAmount = rows.reduce((sum, row) => sum + (row.payAmount || 0), 0);

  // Only require method, not amount - allow $0 payments
  const invalidRows = rows.filter((row) => !row.method);

  // Check for warnings: rows with $0 payment
  const zeroPaymentRows = rows.filter((row) => !row.payAmount || row.payAmount === 0);
  const hasWarnings = zeroPaymentRows.length > 0;

  const handleSubmit = async () => {
    if (invalidRows.length > 0) {
      alert(
        `Please fill in payment method for all rows. ${invalidRows.length} row(s) need a payment method.`
      );
      return;
    }

    // If there are zero payments, show warning dialog first
    if (hasWarnings && !showWarning) {
      setShowWarning(true);
      return;
    }

    try {
      await onSubmit(batch);
    } catch (error) {
      console.error("Error posting batch:", error);
    }
  };

  return (
    <>
      <Dialog open={open && !showWarning} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          Post Payment Batch
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Alert severity="info">
              Posting this batch will lock all rows from further editing. You will
              then be able to complete the batch to process all payments.
            </Alert>

            {invalidRows.length > 0 && (
              <Alert severity="error">
                ❌ {invalidRows.length} row(s) missing payment method. Please
                select a payment method for all rows before posting.
              </Alert>
            )}

            {hasWarnings && (
              <Alert severity="warning" icon={<WarningIcon />}>
                ⚠️ <strong>{zeroPaymentRows.length} row(s) with $0 payment:</strong>
                <Box sx={{ mt: 1, ml: 2 }}>
                  {zeroPaymentRows.map((row) => (
                    <Typography key={row.id} variant="body2">
                      • {row.personName} - Will carry forward unpaid balance to next period
                    </Typography>
                  ))}
                </Box>
              </Alert>
            )}

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Batch Summary
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Batch Number
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {batch.batchNumber || `BATCH-${batch.id}`}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Period
                </Typography>
                <Typography variant="body2">
                  {formatDate(batch.periodStart)} to {formatDate(batch.periodEnd)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Number of Payments
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {rows.length}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Total Amount
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatCurrency(totalAmount)}
                </Typography>
              </Box>
            </Box>
          </Box>

          {rows.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Payment Details
              </Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableCell sx={{ fontWeight: 600 }}>Person</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">
                        Amount
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.personName}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(row.payAmount || 0)}
                        </TableCell>
                        <TableCell>{row.method || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading || invalidRows.length > 0 || rows.length === 0}
          startIcon={isLoading && <CircularProgress size={20} />}
        >
          {isLoading ? "Posting..." : "Post Batch"}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Warning Confirmation Dialog for $0 Payments */}
    <Dialog open={showWarning} onClose={() => setShowWarning(false)} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
        <WarningIcon sx={{ color: "#ff9800" }} />
        Confirm Zero Payment(s)
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Alert severity="warning">
            You are posting {zeroPaymentRows.length} payment(s) with $0 amount.
          </Alert>

          <Box sx={{ backgroundColor: "#fff3cd", p: 2, borderRadius: 1, border: "1px solid #ffc107" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              What happens next:
            </Typography>
            <ul style={{ margin: "0 0 0 20px", paddingLeft: 0 }}>
              {zeroPaymentRows.map((row) => (
                <li key={row.id}>
                  <Typography variant="body2">
                    <strong>{row.personName}</strong>: Unpaid balance of {formatCurrency(row.netDue || 0)} will carry to next month
                  </Typography>
                </li>
              ))}
            </ul>
          </Box>

          <Typography variant="body2" color="textSecondary">
            The statement will be marked as finalized but the balance will be owed going forward until paid.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowWarning(false)}>
          Go Back & Edit
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="warning"
          startIcon={isLoading && <CircularProgress size={20} />}
        >
          {isLoading ? "Posting..." : "Post Anyway"}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}
