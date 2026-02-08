"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import { API_BASE_URL } from "../../lib/api";
import AttributeRulesBuilder from "../../financial-setup/components/AttributeRulesBuilder";
import MatchingCabsPreview from "../../financial-setup/components/MatchingCabsPreview";
import BulkExpenseGrid from "../../financial-setup/components/BulkExpenseGrid";

/**
 * RecurringExpenseDialogContent - Handles different configuration modes for recurring expenses
 * Modes:
 * 1. MANUAL - Traditional manual entry (amount per entity)
 * 2. AUTO_MATCH - Auto-apply to matching cabs based on criteria
 * 3. INDIVIDUAL_CONFIG - Bulk grid with individual amounts per cab
 */
export default function RecurringExpenseDialogContent({
  formData,
  setFormData,
  expenseCategories,
  cabs,
  drivers,
  editing,
  error,
}) {
  const [categoryRule, setCategoryRule] = useState(null);
  const [loadingRule, setLoadingRule] = useState(false);
  const [configMode, setConfigMode] = useState("MANUAL"); // MANUAL, AUTO_MATCH, INDIVIDUAL_CONFIG
  const [autoMatchTab, setAutoMatchTab] = useState(0);
  const [matchingCriteria, setMatchingCriteria] = useState({});
  const [cabAmounts, setCabAmounts] = useState({});

  // Load category rule when category changes
  useEffect(() => {
    if (formData.expenseCategoryId) {
      loadCategoryRule(formData.expenseCategoryId);
    } else {
      setCategoryRule(null);
      setConfigMode("MANUAL");
    }
  }, [formData.expenseCategoryId]);

  const loadCategoryRule = async (categoryId) => {
    try {
      setLoadingRule(true);
      const response = await fetch(
        `${API_BASE_URL}/expense-category-rules/${categoryId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }
      );

      if (response.ok) {
        const rule = await response.json();
        setCategoryRule(rule);
        // Detect configuration mode based on category settings
        const category = expenseCategories.find(c => c.id === parseInt(categoryId));
        if (category?.supportsAutoMatching && category.appliesTo === "CAB") {
          setConfigMode("AUTO_MATCH");
          setMatchingCriteria(rule?.matchingCriteria || {});
        } else if (category?.supportsIndividualConfig && category.appliesTo === "CAB") {
          setConfigMode("INDIVIDUAL_CONFIG");
        } else {
          setConfigMode("MANUAL");
        }
      } else {
        // No rule found, default to manual
        const category = expenseCategories.find(c => c.id === parseInt(categoryId));
        if (category?.supportsAutoMatching && category.appliesTo === "CAB") {
          setConfigMode("AUTO_MATCH");
          setMatchingCriteria({});
        } else if (category?.supportsIndividualConfig && category.appliesTo === "CAB") {
          setConfigMode("INDIVIDUAL_CONFIG");
        } else {
          setConfigMode("MANUAL");
        }
      }
    } catch (err) {
      console.error("Error loading category rule:", err);
      setConfigMode("MANUAL");
    } finally {
      setLoadingRule(false);
    }
  };

  const selectedCategory = expenseCategories.find(
    c => c.id === parseInt(formData.expenseCategoryId)
  );

  // Manual entry mode
  if (configMode === "MANUAL") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Category and Billing */}
        <Grid container spacing={2}>
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

          {/* Entity Type */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Entity Type</InputLabel>
              <Select
                value={formData.entityType}
                label="Entity Type"
                onChange={(e) => setFormData({ ...formData, entityType: e.target.value, entityId: "", shiftType: "" })}
                disabled={!!editing}
              >
                <MenuItem value="CAB">Cab</MenuItem>
                <MenuItem value="DRIVER">Driver</MenuItem>
                <MenuItem value="SHIFT">Shift</MenuItem>
                <MenuItem value="COMPANY">Company</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Entity Selection */}
          {formData.entityType === "SHIFT" ? (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Shift Type</InputLabel>
                <Select
                  value={formData.shiftType}
                  label="Shift Type"
                  onChange={(e) => setFormData({ ...formData, shiftType: e.target.value, entityId: e.target.value === "DAY" ? "1" : "2" })}
                  disabled={!!editing}
                >
                  <MenuItem value="DAY">Day Shift</MenuItem>
                  <MenuItem value="NIGHT">Night Shift</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          ) : formData.entityType === "DRIVER" ? (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Driver</InputLabel>
                <Select
                  value={formData.entityId}
                  label="Driver"
                  onChange={(e) => setFormData({ ...formData, entityId: e.target.value })}
                  disabled={!!editing}
                >
                  {drivers.map(driver => (
                    <MenuItem key={driver.id} value={driver.id}>
                      {driver.firstName} {driver.lastName} ({driver.driverNumber})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          ) : formData.entityType === "CAB" ? (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Cab</InputLabel>
                <Select
                  value={formData.entityId}
                  label="Cab"
                  onChange={(e) => setFormData({ ...formData, entityId: e.target.value })}
                  disabled={!!editing}
                >
                  {cabs.map(cab => (
                    <MenuItem key={cab.id} value={cab.id}>
                      Cab {cab.cabNumber}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          ) : (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Entity</InputLabel>
                <Select
                  value={formData.entityId}
                  label="Entity"
                  onChange={(e) => setFormData({ ...formData, entityId: e.target.value })}
                  disabled={!!editing}
                >
                  <MenuItem value="1">Company</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Amount and Dates */}
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
              disabled={!!editing}
            />
          </Grid>

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

          <Grid item xs={12} md={6}>
            <TextField
              label="End Date (Optional)"
              type="date"
              value={formData.effectiveTo}
              onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

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
        </Grid>

        {error && <Alert severity="error">{error}</Alert>}
      </Box>
    );
  }

  // Auto-match mode
  if (configMode === "AUTO_MATCH") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Alert severity="info">
          This expense category uses attribute-based auto-matching. Configure the matching criteria below, then set the amount to apply to all matching cabs.
        </Alert>

        <Tabs value={autoMatchTab} onChange={(e, newVal) => setAutoMatchTab(newVal)}>
          <Tab label="Basic Settings" />
          <Tab label="Matching Criteria" />
        </Tabs>

        {/* Basic Settings Tab */}
        {autoMatchTab === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.expenseCategoryId}
                  label="Category"
                  disabled
                >
                  <MenuItem value={formData.expenseCategoryId}>
                    {selectedCategory?.categoryName}
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Billing Method</InputLabel>
                <Select
                  value={formData.billingMethod}
                  label="Billing Method"
                  onChange={(e) => setFormData({ ...formData, billingMethod: e.target.value })}
                >
                  <MenuItem value="MONTHLY">Monthly</MenuItem>
                  <MenuItem value="DAILY">Daily</MenuItem>
                  <MenuItem value="PER_SHIFT">Per Shift</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Amount per Cab"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                fullWidth
                required
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                inputProps={{ step: "0.01", min: "0" }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Effective From"
                type="date"
                value={formData.effectiveFrom}
                onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="End Date (Optional)"
                type="date"
                value={formData.effectiveTo}
                onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

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
          </Grid>
        )}

        {/* Matching Criteria Tab */}
        {autoMatchTab === 1 && (
          <Box>
            {loadingRule ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2">
                      Note: Matching criteria is configured in the Financial Setup section.
                      Save this expense to apply it to all matching cabs.
                    </Typography>
                  </CardContent>
                </Card>

                <MatchingCabsPreview
                  categoryId={formData.expenseCategoryId}
                  category={selectedCategory}
                  hideIfEmpty={false}
                />
              </Box>
            )}
          </Box>
        )}

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Box>
    );
  }

  // Individual config mode
  if (configMode === "INDIVIDUAL_CONFIG") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Alert severity="info">
          This expense category supports individual cab configuration. Use the grid below to select cabs and enter individual amounts for each.
        </Alert>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select value={formData.expenseCategoryId} label="Category" disabled>
                <MenuItem value={formData.expenseCategoryId}>
                  {selectedCategory?.categoryName}
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Billing Method</InputLabel>
              <Select
                value={formData.billingMethod}
                label="Billing Method"
                onChange={(e) => setFormData({ ...formData, billingMethod: e.target.value })}
              >
                <MenuItem value="MONTHLY">Monthly</MenuItem>
                <MenuItem value="DAILY">Daily</MenuItem>
                <MenuItem value="PER_SHIFT">Per Shift</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Effective From"
              type="date"
              value={formData.effectiveFrom}
              onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="End Date (Optional)"
              type="date"
              value={formData.effectiveTo}
              onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

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
        </Grid>

        {/* Bulk Grid for individual cab configuration */}
        <BulkExpenseGrid
          cabs={cabs}
          category={selectedCategory}
          onChange={(cabIdToAmount) => {
            // Store the selected cabs and amounts
            setCabAmounts(cabIdToAmount);
            // Also sync with form data
            setFormData({ ...formData, cabAmounts: cabIdToAmount });
          }}
        />

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Box>
    );
  }

  return null;
}
