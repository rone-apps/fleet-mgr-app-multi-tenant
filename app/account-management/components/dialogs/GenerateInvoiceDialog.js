"use client";

import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Alert,
  Grid,
} from "@mui/material";
import { Description as InvoiceIcon } from "@mui/icons-material";

export default function GenerateInvoiceDialog({
  open,
  onClose,
  customers,
  generateInvoiceFormData,
  setGenerateInvoiceFormData,
  handleGenerateInvoice,
  error,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Generate Invoice</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <Autocomplete
            options={customers.filter(c => c.active)}
            getOptionLabel={(option) => option.companyName || ""}
            value={customers.find(c => c.id === generateInvoiceFormData.customerId) || null}
            onChange={(e, newValue) => setGenerateInvoiceFormData({ ...generateInvoiceFormData, customerId: newValue ? newValue.id : "" })}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField {...params} label="Customer" required fullWidth />
            )}
          />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Period Start"
                type="date"
                value={generateInvoiceFormData.periodStart}
                onChange={(e) => setGenerateInvoiceFormData({ ...generateInvoiceFormData, periodStart: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Period End"
                type="date"
                value={generateInvoiceFormData.periodEnd}
                onChange={(e) => setGenerateInvoiceFormData({ ...generateInvoiceFormData, periodEnd: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <TextField
            label="Tax Rate (%)"
            type="number"
            value={generateInvoiceFormData.taxRate}
            onChange={(e) => setGenerateInvoiceFormData({ ...generateInvoiceFormData, taxRate: e.target.value })}
            fullWidth
            inputProps={{ step: "0.1", min: "0", max: "100" }}
            helperText="e.g., 5.0 for 5% GST, 13.0 for 13% HST"
          />

          <TextField
            label="Terms"
            value={generateInvoiceFormData.terms}
            onChange={(e) => setGenerateInvoiceFormData({ ...generateInvoiceFormData, terms: e.target.value })}
            fullWidth
            multiline
            rows={3}
            helperText="Payment terms and conditions"
          />

          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleGenerateInvoice} variant="contained" startIcon={<InvoiceIcon />}>
          Generate
        </Button>
      </DialogActions>
    </Dialog>
  );
}
