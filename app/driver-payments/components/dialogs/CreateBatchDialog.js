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
  CircularProgress,
} from "@mui/material";

export default function CreateBatchDialog({
  open,
  onClose,
  onSubmit,
  isLoading,
}) {
  const [formData, setFormData] = useState({
    periodFrom: "",
    periodTo: "",
    batchDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.periodFrom || !formData.periodTo) {
      alert("Period From and Period To are required");
      return;
    }

    if (new Date(formData.periodFrom) > new Date(formData.periodTo)) {
      alert("Period From date must be before Period To date");
      return;
    }

    try {
      await onSubmit({
        periodFrom: formData.periodFrom,
        periodTo: formData.periodTo,
        batchDate: formData.batchDate,
        notes: formData.notes,
      });
      setFormData({
        periodFrom: "",
        periodTo: "",
        batchDate: new Date().toISOString().split("T")[0],
        notes: "",
      });
    } catch (error) {
      console.error("Error creating batch:", error);
    }
  };

  const handleClose = () => {
    setFormData({
      periodFrom: "",
      periodTo: "",
      batchDate: new Date().toISOString().split("T")[0],
      notes: "",
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        Create New Payment Batch
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <TextField
            label="Period From"
            name="periodFrom"
            type="date"
            value={formData.periodFrom}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
            disabled={isLoading}
          />
          <TextField
            label="Period To"
            name="periodTo"
            type="date"
            value={formData.periodTo}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
            disabled={isLoading}
          />
          <TextField
            label="Batch Date"
            name="batchDate"
            type="date"
            value={formData.batchDate}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
            disabled={isLoading}
          />
          <TextField
            label="Notes (Optional)"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            multiline
            rows={3}
            fullWidth
            disabled={isLoading}
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
          disabled={isLoading || !formData.periodFrom || !formData.periodTo}
          startIcon={isLoading && <CircularProgress size={20} />}
        >
          {isLoading ? "Creating..." : "Create Batch"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
