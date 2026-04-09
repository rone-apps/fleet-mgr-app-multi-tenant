"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, CircularProgress, Chip,
  Card, CardContent, Grid, Tab, Tabs, IconButton, FormControl,
  InputLabel, Select, MenuItem,
} from "@mui/material";
import {
  Add as AddIcon, Delete as DeleteIcon, AssignmentTurnedIn as AssignIcon,
  Undo as ReturnIcon, Refresh as RefreshIcon, Edit as EditIcon,
} from "@mui/icons-material";
import GlobalNav from "../components/GlobalNav";
import { getCurrentUser, isAuthenticated, API_BASE_URL, getAuthHeaders } from "../lib/api";
import { useRouter } from "next/navigation";

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function SpareMachinesPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tabValue, setTabValue] = useState(0);

  // Spare Machines
  const [spareMachines, setSpareMachines] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [cabs, setCabs] = useState([]);

  // Create Spare Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ machineName: "", merchantNumber: "" });
  const [nextVirtualCabId, setNextVirtualCabId] = useState(null);
  const [creatingSpare, setCreatingSpare] = useState(false);

  // Assign Spare Dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedSpareId, setSelectedSpareId] = useState(null);
  const [assignForm, setAssignForm] = useState({
    realCabNumber: "",
    shift: "BOTH",
    assignedAtDate: new Date().toISOString().split("T")[0],
    assignedAtTime: "00:00",
    notes: "",
  });
  const [assignDialogError, setAssignDialogError] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Return Spare Dialog
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [returnForm, setReturnForm] = useState({
    returnedAtDate: new Date().toISOString().split("T")[0],
    returnedAtTime: "00:00",
  });
  const [returning, setReturning] = useState(false);

  // Deactivate/Activate Dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedSpareForStatus, setSelectedSpareForStatus] = useState(null);
  const [statusAction, setStatusAction] = useState("deactivate");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/");
      return;
    }
    const user = getCurrentUser();
    if (!user || !["ADMIN", "MANAGER"].includes(user.role)) {
      router.push("/");
      return;
    }
    setCurrentUser(user);
    fetchData();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sparesRes, assignmentsRes, cabsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/payment/spare-machines`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/payment/spare-machines/assignments/current`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/cabs`, { headers: getAuthHeaders() }),
      ]);

      if (sparesRes.ok) {
        const spares = await sparesRes.json();
        setSpareMachines(spares);
        // Calculate next available virtual cab ID
        if (spares.length > 0) {
          const maxVirtualCabId = Math.max(...spares.map(s => s.virtualCabId));
          setNextVirtualCabId(maxVirtualCabId + 1);
        } else {
          setNextVirtualCabId(10000);
        }
      }
      if (assignmentsRes.ok) setAssignments(await assignmentsRes.json());
      if (cabsRes.ok) {
        const cabsData = await cabsRes.json();
        // Sort by cab number
        const sortedCabs = cabsData.sort((a, b) => {
          const numA = parseInt(a.cabNumber, 10);
          const numB = parseInt(b.cabNumber, 10);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return a.cabNumber.localeCompare(b.cabNumber);
        });
        setCabs(sortedCabs);
      }
    } catch (e) {
      setError(`Error loading data: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateSpare = async () => {
    if (!createForm.machineName || !createForm.merchantNumber) {
      setError("Machine name and merchant number are required");
      return;
    }

    setCreatingSpare(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/payment/spare-machines?machineName=${encodeURIComponent(createForm.machineName)}&merchantNumber=${encodeURIComponent(createForm.merchantNumber)}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );

      if (res.ok) {
        const newSpare = await res.json();
        const updatedSpares = [...spareMachines, newSpare];
        setSpareMachines(updatedSpares);
        // Update next virtual cab ID
        const maxVirtualCabId = Math.max(...updatedSpares.map(s => s.virtualCabId));
        setNextVirtualCabId(maxVirtualCabId + 1);
        setSuccess(`Spare machine '${newSpare.machineName}' created with virtual cab ID ${newSpare.virtualCabId}`);
        setCreateDialogOpen(false);
        setCreateForm({ machineName: "", merchantNumber: "" });
      } else {
        const errorData = await res.json();
        setError(`Error creating spare: ${errorData.message || res.statusText}`);
      }
    } catch (e) {
      setError(`Error: ${e.message}`);
    } finally {
      setCreatingSpare(false);
    }
  };

  const handleAssignSpare = async () => {
    setAssignDialogError("");
    if (!assignForm.realCabNumber) {
      setAssignDialogError("Real cab number is required");
      return;
    }

    setAssigning(true);
    try {
      const body = {
        realCabNumber: parseInt(assignForm.realCabNumber),
        shift: assignForm.shift,
        assignedAt: `${assignForm.assignedAtDate}T${assignForm.assignedAtTime}:00`,
        notes: assignForm.notes,
      };

      const res = await fetch(
        `${API_BASE_URL}/payment/spare-machines/${selectedSpareId}/assign`,
        {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (res.ok) {
        const newAssignment = await res.json();
        setAssignments([...assignments, newAssignment]);
        setSuccess("Spare machine assigned successfully");
        setAssignDialogOpen(false);
        setAssignForm({ realCabNumber: "", shift: "BOTH", assignedAtDate: new Date().toISOString().split("T")[0], assignedAtTime: "00:00", notes: "" });
        setAssignDialogError("");
      } else {
        const errorData = await res.json();
        setAssignDialogError(`Error assigning spare: ${errorData.message || res.statusText}`);
      }
    } catch (e) {
      setAssignDialogError(`Error: ${e.message}`);
    } finally {
      setAssigning(false);
    }
  };

  const handleReturnSpare = async () => {
    setReturning(true);
    try {
      const body = {
        returnedAt: `${returnForm.returnedAtDate}T${returnForm.returnedAtTime}:00`,
      };

      const res = await fetch(
        `${API_BASE_URL}/payment/spare-machines/assignments/${selectedAssignmentId}/return`,
        {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (res.ok) {
        const updatedAssignment = await res.json();
        setAssignments(assignments.map(a => a.id === selectedAssignmentId ? updatedAssignment : a));
        setSuccess("Spare machine returned successfully");
        setReturnDialogOpen(false);
        setReturnForm({ returnedAtDate: new Date().toISOString().split("T")[0], returnedAtTime: "00:00" });
      } else {
        const errorData = await res.json();
        setError(`Error returning spare: ${errorData.message || res.statusText}`);
      }
    } catch (e) {
      setError(`Error: ${e.message}`);
    } finally {
      setReturning(false);
    }
  };

  const handleOpenStatusDialog = (spareId, isActive) => {
    if (isActive) {
      // Check if spare has active assignment
      const hasActiveAssignment = assignments.some(a => a.spareMachineId === spareId && !a.returnedAt);
      if (hasActiveAssignment) {
        setError("Cannot deactivate a spare machine with an active assignment. Return it first.");
        return;
      }
    }
    setSelectedSpareForStatus(spareId);
    setStatusAction(isActive ? "deactivate" : "activate");
    setStatusDialogOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    setUpdatingStatus(true);
    try {
      const endpoint = statusAction === "deactivate"
        ? `${API_BASE_URL}/payment/spare-machines/${selectedSpareForStatus}/deactivate`
        : `${API_BASE_URL}/payment/spare-machines/${selectedSpareForStatus}/activate`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const updatedSpare = await res.json();
        setSpareMachines(spareMachines.map(s => s.id === selectedSpareForStatus ? updatedSpare : s));
        setSuccess(`Spare machine ${statusAction === "deactivate" ? "deactivated" : "activated"} successfully`);
        setStatusDialogOpen(false);
      } else {
        const errorData = await res.json();
        setError(`Error ${statusAction === "deactivate" ? "deactivating" : "activating"} spare: ${errorData.message || res.statusText}`);
      }
    } catch (e) {
      setError(`Error: ${e.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const fetchAssignmentHistoryForSpare = async (spareId) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/payment/spare-machines/${spareId}/assignments`,
        { headers: getAuthHeaders() }
      );
      if (res.ok) {
        setAssignmentHistory(await res.json());
      }
    } catch (e) {
      setError(`Error loading assignment history: ${e.message}`);
    }
  };

  const getSpareInfo = (assignment) => {
    const spare = spareMachines.find(s => s.id === assignment.spareMachineId);
    return spare;
  };

  if (!currentUser) return null;

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
      <GlobalNav currentUser={currentUser} title="Spare Credit Card Machines" />

      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: "#1a1a2e" }}>
              Spare Credit Card Machines
            </Typography>
            <Typography variant="body1" sx={{ color: "#697386" }}>
              Manage spare payment terminal machines and their assignments to cabs
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ backgroundColor: "#1976d2" }}
          >
            Create Spare
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
            {success}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid #e5e7eb" }}>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
              <Tab label="Spare Machines Library" id="tab-0" />
              <Tab label="Current Assignments" id="tab-1" />
              <Tab label="Assignment History" id="tab-2" />
            </Tabs>

            {/* Tab 0: Spare Machines Library */}
            <TabPanel value={tabValue} index={0}>
              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Machine Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Virtual Cab ID</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Merchant Number</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {spareMachines.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3, color: "#999" }}>
                          No spare machines created yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      spareMachines.map((spare) => {
                        const isAlreadyAssigned = assignments.some(a => a.spareMachineId === spare.id && !a.returnedAt);
                        return (
                          <TableRow key={spare.id} hover sx={{ opacity: !spare.isActive ? 0.6 : 1 }}>
                            <TableCell>{spare.machineName}</TableCell>
                            <TableCell>
                              <Chip label={spare.virtualCabId} color="primary" variant="outlined" />
                            </TableCell>
                            <TableCell>{spare.merchantNumber}</TableCell>
                            <TableCell>
                              <Chip
                                label={spare.isActive ? "Active" : "Inactive"}
                                color={spare.isActive ? "success" : "default"}
                                variant="outlined"
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{new Date(spare.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell align="right">
                              <Button
                                size="small"
                                startIcon={<AssignIcon />}
                                onClick={() => {
                                  if (isAlreadyAssigned) {
                                    setError("This spare machine is already assigned. Return it first before assigning to another cab.");
                                  } else {
                                    setAssignDialogError("");
                                    setSelectedSpareId(spare.id);
                                    setAssignDialogOpen(true);
                                  }
                                }}
                                disabled={!spare.isActive || isAlreadyAssigned}
                                sx={{ mr: 1 }}
                              >
                                {isAlreadyAssigned ? "Assigned" : "Assign"}
                              </Button>
                              <Button
                                size="small"
                                startIcon={spare.isActive ? <DeleteIcon /> : <RefreshIcon />}
                                color={spare.isActive ? "warning" : "success"}
                                disabled={spare.isActive && isAlreadyAssigned}
                                title={spare.isActive && isAlreadyAssigned ? "Return assignment before deactivating" : ""}
                                onClick={() => handleOpenStatusDialog(spare.id, spare.isActive)}
                              >
                                {spare.isActive ? "Deactivate" : "Activate"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* Tab 1: Current Assignments */}
            <TabPanel value={tabValue} index={1}>
              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Machine</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Virtual Cab ID</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Real Cab #</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Shift</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Assigned At</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assignments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 3, color: "#999" }}>
                          No active assignments
                        </TableCell>
                      </TableRow>
                    ) : (
                      assignments.map((assignment) => {
                        const spare = getSpareInfo(assignment);
                        return (
                          <TableRow key={assignment.id} hover>
                            <TableCell>{spare?.machineName || "Unknown"}</TableCell>
                            <TableCell>
                              <Chip label={spare?.virtualCabId} color="primary" variant="outlined" size="small" />
                            </TableCell>
                            <TableCell>{assignment.realCabNumber}</TableCell>
                            <TableCell>
                              <Chip label={assignment.shift || "BOTH"} variant="outlined" size="small" />
                            </TableCell>
                            <TableCell>{new Date(assignment.assignedAt).toLocaleString()}</TableCell>
                            <TableCell>
                              <Chip
                                label={assignment.returnedAt ? "Returned" : "Active"}
                                color={assignment.returnedAt ? "default" : "success"}
                                variant="outlined"
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{assignment.notes || "-"}</TableCell>
                            <TableCell align="right">
                              {!assignment.returnedAt && (
                                <Button
                                  size="small"
                                  startIcon={<ReturnIcon />}
                                  onClick={() => {
                                    setSelectedAssignmentId(assignment.id);
                                    setReturnDialogOpen(true);
                                  }}
                                >
                                  Return
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* Tab 2: Assignment History */}
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ mb: 2 }}>
                <Grid container spacing={2}>
                  {spareMachines.map((spare) => (
                    <Grid item xs={12} sm={6} md={4} key={spare.id}>
                      <Card
                        sx={{
                          cursor: "pointer",
                          "&:hover": { boxShadow: 2 },
                        }}
                        onClick={() => fetchAssignmentHistoryForSpare(spare.id)}
                      >
                        <CardContent>
                          <Typography variant="h6">{spare.machineName}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            Virtual ID: {spare.virtualCabId}
                          </Typography>
                          <Typography variant="caption">{spare.merchantNumber}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {assignmentHistory.length > 0 && (
                <TableContainer>
                  <Table>
                    <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Real Cab #</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Assigned At</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Returned At</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assignmentHistory.map((assignment) => {
                        const assignedDate = new Date(assignment.assignedAt);
                        const returnedDate = assignment.returnedAt ? new Date(assignment.returnedAt) : null;
                        const duration = returnedDate
                          ? Math.round((returnedDate - assignedDate) / (1000 * 60 * 60)) + " hours"
                          : "Ongoing";

                        return (
                          <TableRow key={assignment.id} hover>
                            <TableCell>{assignment.realCabNumber}</TableCell>
                            <TableCell>{assignedDate.toLocaleString()}</TableCell>
                            <TableCell>{returnedDate ? returnedDate.toLocaleString() : "-"}</TableCell>
                            <TableCell>{duration}</TableCell>
                            <TableCell>{assignment.notes || "-"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>
          </Paper>
        )}
      </Box>

      {/* Create Spare Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Spare Machine</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Machine Name"
            placeholder="e.g., spare1, spare2"
            value={createForm.machineName}
            onChange={(e) => setCreateForm({ ...createForm, machineName: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Merchant Number"
            placeholder="e.g., 30408802563"
            value={createForm.merchantNumber}
            onChange={(e) => setCreateForm({ ...createForm, merchantNumber: e.target.value })}
            margin="normal"
          />
          {nextVirtualCabId && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
              <Typography variant="body2" sx={{ color: "#666" }}>
                Virtual Cab ID (Auto-assigned)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "#1976d2" }}>
                {nextVirtualCabId}
              </Typography>
              <Typography variant="caption" sx={{ color: "#999" }}>
                This virtual cab will be created automatically
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateSpare}
            variant="contained"
            disabled={creatingSpare}
          >
            {creatingSpare ? <CircularProgress size={24} /> : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Spare Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Spare Machine</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {assignDialogError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setAssignDialogError("")}>
              {assignDialogError}
            </Alert>
          )}
          <FormControl fullWidth margin="normal">
            <InputLabel>Real Cab Number</InputLabel>
            <Select
              value={assignForm.realCabNumber}
              label="Real Cab Number"
              onChange={(e) => setAssignForm({ ...assignForm, realCabNumber: e.target.value })}
            >
              <MenuItem value="">
                <em>Select a cab</em>
              </MenuItem>
              {cabs.map((cab) => (
                <MenuItem key={cab.id} value={cab.cabNumber}>
                  {cab.cabNumber}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Shift</InputLabel>
            <Select
              value={assignForm.shift}
              label="Shift"
              onChange={(e) => setAssignForm({ ...assignForm, shift: e.target.value })}
            >
              <MenuItem value="Day">Day</MenuItem>
              <MenuItem value="Night">Night</MenuItem>
              <MenuItem value="BOTH">Both</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              fullWidth
              label="Assigned Date"
              type="date"
              value={assignForm.assignedAtDate}
              onChange={(e) => setAssignForm({ ...assignForm, assignedAtDate: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Time"
              type="time"
              value={assignForm.assignedAtTime}
              onChange={(e) => setAssignForm({ ...assignForm, assignedAtTime: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <TextField
            fullWidth
            label="Notes (optional)"
            multiline
            rows={3}
            value={assignForm.notes}
            onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAssignSpare}
            variant="contained"
            disabled={assigning}
          >
            {assigning ? <CircularProgress size={24} /> : "Assign"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Return Spare Dialog */}
      <Dialog open={returnDialogOpen} onClose={() => setReturnDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Return Spare Machine</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              fullWidth
              label="Return Date"
              type="date"
              value={returnForm.returnedAtDate}
              onChange={(e) => setReturnForm({ ...returnForm, returnedAtDate: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Time"
              type="time"
              value={returnForm.returnedAtTime}
              onChange={(e) => setReturnForm({ ...returnForm, returnedAtTime: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleReturnSpare}
            variant="contained"
            disabled={returning}
          >
            {returning ? <CircularProgress size={24} /> : "Return"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deactivate/Activate Spare Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {statusAction === "deactivate" ? "Deactivate Spare Machine" : "Activate Spare Machine"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography>
            {statusAction === "deactivate"
              ? "Deactivate this spare machine? This action preserves history and cannot be undone."
              : "Activate this spare machine? It will be available for assignment."}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmStatusChange}
            variant="contained"
            color={statusAction === "deactivate" ? "warning" : "success"}
            disabled={updatingStatus}
          >
            {updatingStatus ? <CircularProgress size={24} /> : (statusAction === "deactivate" ? "Deactivate" : "Activate")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
