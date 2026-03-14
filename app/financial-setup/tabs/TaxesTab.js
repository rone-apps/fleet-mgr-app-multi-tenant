"use client";

import { useState, useEffect } from "react";
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Chip, Card, Alert, FormControl, InputLabel,
  Select, MenuItem, Tabs, Tab, Tooltip,
} from "@mui/material";
import {
  Add as AddIcon, Edit as EditIcon, LinkOff as UnlinkIcon,
  Link as LinkIcon, History as HistoryIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { API_BASE_URL } from "../../lib/api";

const headers = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "X-Tenant-ID": localStorage.getItem("tenantSchema"),
  "Content-Type": "application/json",
});

export default function TaxesTab({ canEdit, setError, setSuccess }) {
  const [subTab, setSubTab] = useState(0);

  // Tax Types
  const [taxTypes, setTaxTypes] = useState([]);
  const [openTypeDialog, setOpenTypeDialog] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeForm, setTypeForm] = useState({ code: "", name: "", description: "" });

  // Tax Rates
  const [selectedType, setSelectedType] = useState(null);
  const [taxRates, setTaxRates] = useState([]);
  const [openRateDialog, setOpenRateDialog] = useState(false);
  const [rateForm, setRateForm] = useState({ rate: "", effectiveFrom: new Date(), notes: "" });

  // Assignments
  const [assignments, setAssignments] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [assignForm, setAssignForm] = useState({ taxTypeId: "", expenseCategoryId: "", notes: "" });

  useEffect(() => { loadTaxTypes(); loadAssignments(); loadExpenseCategories(); }, []);

  const loadTaxTypes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/tax-commissions/tax-types`, { headers: headers() });
      if (res.ok) setTaxTypes(await res.json());
    } catch (err) { setError(err.message); }
  };

  const loadTaxRates = async (typeId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/tax-commissions/tax-types/${typeId}/rates`, { headers: headers() });
      if (res.ok) setTaxRates(await res.json());
    } catch (err) { setError(err.message); }
  };

  const loadAssignments = async () => {
    try {
      const url = showHistory ? `${API_BASE_URL}/tax-commissions/tax-assignments` : `${API_BASE_URL}/tax-commissions/tax-assignments/active`;
      const res = await fetch(url, { headers: headers() });
      if (res.ok) setAssignments(await res.json());
    } catch (err) { setError(err.message); }
  };

  const loadExpenseCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/expense-categories`, { headers: headers() });
      if (res.ok) setExpenseCategories(await res.json());
    } catch (err) { setError(err.message); }
  };

  useEffect(() => { loadAssignments(); }, [showHistory]);

  // --- Tax Type CRUD ---
  const openNewType = () => { setEditingType(null); setTypeForm({ code: "", name: "", description: "" }); setOpenTypeDialog(true); };
  const openEditType = (t) => { setEditingType(t); setTypeForm({ code: t.code, name: t.name, description: t.description || "" }); setOpenTypeDialog(true); };

  const saveType = async () => {
    try {
      if (!typeForm.code || !typeForm.name) { setError("Code and name are required"); return; }
      const url = editingType ? `${API_BASE_URL}/tax-commissions/tax-types/${editingType.id}` : `${API_BASE_URL}/tax-commissions/tax-types`;
      const method = editingType ? "PUT" : "POST";
      const body = editingType
        ? { name: typeForm.name, description: typeForm.description, isActive: editingType.isActive }
        : typeForm;
      const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Failed to save tax type");
      setSuccess(editingType ? "Tax type updated" : "Tax type created");
      setOpenTypeDialog(false);
      loadTaxTypes();
    } catch (err) { setError(err.message); }
  };

  const toggleTypeActive = async (t) => {
    try {
      await fetch(`${API_BASE_URL}/tax-commissions/tax-types/${t.id}`, {
        method: "PUT", headers: headers(),
        body: JSON.stringify({ name: t.name, description: t.description, isActive: !t.isActive }),
      });
      loadTaxTypes();
    } catch (err) { setError(err.message); }
  };

  // --- Tax Rate ---
  const openNewRate = (type) => {
    setSelectedType(type);
    setRateForm({ rate: "", effectiveFrom: new Date(), notes: "" });
    setOpenRateDialog(true);
  };

  const saveRate = async () => {
    try {
      if (!rateForm.rate) { setError("Rate is required"); return; }
      const res = await fetch(`${API_BASE_URL}/tax-commissions/tax-types/${selectedType.id}/rates`, {
        method: "POST", headers: headers(),
        body: JSON.stringify({
          rate: parseFloat(rateForm.rate),
          effectiveFrom: rateForm.effectiveFrom.toISOString().split("T")[0],
          notes: rateForm.notes,
        }),
      });
      if (!res.ok) throw new Error("Failed to create rate");
      setSuccess("Tax rate created (previous rate auto-closed)");
      setOpenRateDialog(false);
      loadTaxTypes();
      if (selectedType) loadTaxRates(selectedType.id);
    } catch (err) { setError(err.message); }
  };

  // --- Assignment ---
  const saveAssignment = async () => {
    try {
      if (!assignForm.taxTypeId || !assignForm.expenseCategoryId) { setError("Tax type and category are required"); return; }
      const res = await fetch(`${API_BASE_URL}/tax-commissions/tax-assignments`, {
        method: "POST", headers: headers(),
        body: JSON.stringify(assignForm),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to assign");
      }
      setSuccess("Tax assigned to category");
      setOpenAssignDialog(false);
      loadAssignments();
    } catch (err) { setError(err.message); }
  };

  const unassign = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/tax-commissions/tax-assignments/${id}/unassign`, { method: "PUT", headers: headers() });
      setSuccess("Tax unassigned from category");
      loadAssignments();
    } catch (err) { setError(err.message); }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>Tax Configuration</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Manage tax types, their rates (with history), and assign taxes to expense categories.
      </Typography>

      <Tabs value={subTab} onChange={(e, v) => setSubTab(v)} sx={{ mb: 2 }}>
        <Tab label="Tax Types & Rates" />
        <Tab label="Category Assignments" />
      </Tabs>

      {/* ===== TAX TYPES & RATES ===== */}
      {subTab === 0 && (
        <Box>
          {canEdit && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openNewType} sx={{ mb: 2 }}>
              Add Tax Type
            </Button>
          )}
          <TableContainer component={Card}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Current Rate</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {taxTypes.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3, color: "text.secondary" }}>No tax types found</TableCell></TableRow>
                ) : taxTypes.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell><Chip label={t.code} size="small" /></TableCell>
                    <TableCell>{t.name}</TableCell>
                    <TableCell>{t.description || "-"}</TableCell>
                    <TableCell>
                      <Chip label={t.currentRate} size="small" color={t.currentRate !== "No active rate" ? "primary" : "default"} variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip label={t.isActive ? "Active" : "Inactive"} size="small"
                        color={t.isActive ? "success" : "default"} variant="outlined"
                        onClick={canEdit ? () => toggleTypeActive(t) : undefined}
                        sx={canEdit ? { cursor: "pointer" } : {}} />
                    </TableCell>
                    <TableCell align="center">
                      {canEdit && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEditType(t)}><EditIcon /></IconButton>
                          </Tooltip>
                          <Tooltip title="Add New Rate">
                            <IconButton size="small" color="primary" onClick={() => openNewRate(t)}><AddIcon /></IconButton>
                          </Tooltip>
                          <Tooltip title="View Rate History">
                            <IconButton size="small" onClick={() => { setSelectedType(t); loadTaxRates(t.id); }}><HistoryIcon /></IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Rate History */}
          {selectedType && taxRates.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                Rate History: {selectedType.name}
              </Typography>
              <TableContainer component={Card}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#e3f2fd" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Rate (%)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Effective From</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Effective To</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {taxRates.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell sx={{ fontWeight: "bold" }}>{r.rate}%</TableCell>
                        <TableCell>{r.effectiveFrom}</TableCell>
                        <TableCell>{r.effectiveTo || "Current"}</TableCell>
                        <TableCell>
                          <Chip label={r.isActive ? "Active" : "Closed"} size="small"
                            color={r.isActive ? "success" : "default"} variant="outlined" />
                        </TableCell>
                        <TableCell>{r.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>
      )}

      {/* ===== CATEGORY ASSIGNMENTS ===== */}
      {subTab === 1 && (
        <Box>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            {canEdit && (
              <Button variant="contained" startIcon={<LinkIcon />} onClick={() => {
                setAssignForm({ taxTypeId: "", expenseCategoryId: "", notes: "" });
                setOpenAssignDialog(true);
              }}>
                Assign Tax to Category
              </Button>
            )}
            <Button variant="outlined" startIcon={<HistoryIcon />} onClick={() => setShowHistory(!showHistory)}>
              {showHistory ? "Show Active Only" : "Show Full History"}
            </Button>
          </Box>

          <TableContainer component={Card}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: 700 }}>Tax Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Expense Category</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Assigned</TableCell>
                  {showHistory && <TableCell sx={{ fontWeight: 700 }}>Unassigned</TableCell>}
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Notes</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments.length === 0 ? (
                  <TableRow><TableCell colSpan={showHistory ? 7 : 6} align="center" sx={{ py: 3, color: "text.secondary" }}>No assignments found</TableCell></TableRow>
                ) : assignments.map((a) => (
                  <TableRow key={a.id} hover sx={!a.isActive ? { opacity: 0.6 } : {}}>
                    <TableCell><Chip label={a.taxTypeName} size="small" color="primary" variant="outlined" /></TableCell>
                    <TableCell>{a.expenseCategoryName}</TableCell>
                    <TableCell>{a.assignedAt}</TableCell>
                    {showHistory && <TableCell>{a.unassignedAt || "-"}</TableCell>}
                    <TableCell>
                      <Chip label={a.isActive ? "Active" : "Unassigned"} size="small"
                        color={a.isActive ? "success" : "default"} variant="outlined" />
                    </TableCell>
                    <TableCell>{a.notes || "-"}</TableCell>
                    <TableCell align="center">
                      {a.isActive && canEdit && (
                        <Tooltip title="Unassign">
                          <IconButton size="small" color="error" onClick={() => unassign(a.id)}><UnlinkIcon /></IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ===== DIALOGS ===== */}

      {/* Tax Type Dialog */}
      <Dialog open={openTypeDialog} onClose={() => setOpenTypeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingType ? "Edit Tax Type" : "Add Tax Type"}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField fullWidth label="Code" value={typeForm.code} disabled={!!editingType}
            onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })}
            placeholder="e.g., HST" sx={{ mb: 2 }} />
          <TextField fullWidth label="Name" value={typeForm.name}
            onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
            placeholder="e.g., Harmonized Sales Tax" sx={{ mb: 2 }} />
          <TextField fullWidth label="Description" multiline rows={2} value={typeForm.description}
            onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTypeDialog(false)}>Cancel</Button>
          <Button onClick={saveType} variant="contained">{editingType ? "Update" : "Create"}</Button>
        </DialogActions>
      </Dialog>

      {/* Tax Rate Dialog */}
      <Dialog open={openRateDialog} onClose={() => setOpenRateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Rate for {selectedType?.name}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Creating a new rate will automatically close the current active rate.
          </Alert>
          <TextField fullWidth label="Rate (%)" type="number"
            inputProps={{ step: "0.01", min: "0" }}
            value={rateForm.rate}
            onChange={(e) => setRateForm({ ...rateForm, rate: e.target.value })}
            placeholder="e.g., 13.00" sx={{ mb: 2 }} />
          <DatePicker label="Effective From" value={rateForm.effectiveFrom}
            onChange={(v) => setRateForm({ ...rateForm, effectiveFrom: v })}
            slotProps={{ textField: { fullWidth: true, sx: { mb: 2 } } }} />
          <TextField fullWidth label="Notes (Optional)" multiline rows={2} value={rateForm.notes}
            onChange={(e) => setRateForm({ ...rateForm, notes: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRateDialog(false)}>Cancel</Button>
          <Button onClick={saveRate} variant="contained">Create Rate</Button>
        </DialogActions>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={openAssignDialog} onClose={() => setOpenAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Tax to Expense Category</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Tax Type</InputLabel>
            <Select value={assignForm.taxTypeId} label="Tax Type"
              onChange={(e) => setAssignForm({ ...assignForm, taxTypeId: e.target.value })}>
              {taxTypes.filter(t => t.isActive).map(t => (
                <MenuItem key={t.id} value={t.id}>{t.name} ({t.currentRate})</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Expense Category</InputLabel>
            <Select value={assignForm.expenseCategoryId} label="Expense Category"
              onChange={(e) => setAssignForm({ ...assignForm, expenseCategoryId: e.target.value })}>
              {expenseCategories.filter(c => c.isActive !== false).map(c => (
                <MenuItem key={c.id} value={c.id}>{c.categoryName} ({c.categoryCode})</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField fullWidth label="Notes (Optional)" multiline rows={2} value={assignForm.notes}
            onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignDialog(false)}>Cancel</Button>
          <Button onClick={saveAssignment} variant="contained">Assign</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
