"use client";

import { Box, Grid, FormControl, InputLabel, Select, MenuItem, TextField, InputAdornment, FormControlLabel, Switch } from "@mui/material";

/**
 * RecurringExpenseDialogContent - Simplified form for creating/editing recurring expenses
 * Application type and entity details are determined by the selected expense category
 */
export default function RecurringExpenseDialogContent({
  formData,
  setFormData,
  expenseCategories,
  editing,
  error,
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Grid container spacing={2}>
        {/* Category */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Category</InputLabel>
            <Select
              value={formData.expenseCategoryId}
              label="Category"
              onChange={(e) => setFormData({ ...formData, expenseCategoryId: e.target.value })}
              disabled={!!editing}
            >
              {expenseCategories.map(cat => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.categoryName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Amount */}
        <Grid item xs={12} md={6}>
          <TextField
            label="Amount"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            fullWidth
            required
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            inputProps={{ step: "0.01", min: "0" }}
          />
        </Grid>

        {/* Billing Method */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Billing Method</InputLabel>
            <Select
              value={formData.billingMethod}
              label="Billing Method"
              onChange={(e) => setFormData({ ...formData, billingMethod: e.target.value })}
              disabled={!!editing}
            >
              <MenuItem value="MONTHLY">Monthly</MenuItem>
              <MenuItem value="DAILY">Daily</MenuItem>
              <MenuItem value="PER_SHIFT">Per Shift</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Effective From */}
        <Grid item xs={12} md={6}>
          <TextField
            label="Effective From"
            type="date"
            value={formData.effectiveFrom}
            onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
            disabled={!!editing}
          />
        </Grid>

        {/* Effective To */}
        <Grid item xs={12} md={6}>
          <TextField
            label="Effective To (Optional)"
            type="date"
            value={formData.effectiveTo}
            onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Notes */}
        <Grid item xs={12}>
          <TextField
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            fullWidth
            multiline
            rows={2}
          />
        </Grid>

        {/* Is Active */}
        {editing && (
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive !== undefined ? formData.isActive : true}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </Grid>
        )}
      </Grid>

      {error && <Box sx={{ color: "red", mt: 2 }}>{error}</Box>}
    </Box>
  );
}
