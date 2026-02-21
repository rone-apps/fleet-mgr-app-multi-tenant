"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Typography,
} from "@mui/material";

export default function RecallStatementDialog({
  open,
  onClose,
  onSubmit,
  statement,
  isLoading,
}) {
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert("Please provide a reason for the recall");
      return;
    }

    try {
      await onSubmit(statement.id, reason);
      setReason("");
    } catch (error) {
      console.error("Error recalling statement:", error);
    }
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  if (!statement) {
    return null;
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        Recall Statement
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Alert severity="warning">
            Recalling this statement will revert it from FINALIZED status and allow
            modifications before re-posting. This action cannot be undone without
            re-finalizing.
          </Alert>

          <Box>
            <Typography variant="caption" color="textSecondary">
              Statement ID
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {statement.id}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="textSecondary">
              Person
            </Typography>
            <Typography variant="body2">
              {statement.personName || statement.personId}
            </Typography>
          </Box>

          <TextField
            label="Reason for Recall"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            multiline
            rows={4}
            fullWidth
            disabled={isLoading}
            placeholder="Explain why this statement is being recalled..."
            variant="outlined"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="warning"
          disabled={isLoading || !reason.trim()}
          startIcon={isLoading && <CircularProgress size={20} />}
        >
          {isLoading ? "Recalling..." : "Recall Statement"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
