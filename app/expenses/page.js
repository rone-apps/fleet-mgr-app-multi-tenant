"use client";

import { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, FormControl, InputLabel, Select, IconButton, Chip,
  Alert, AlertTitle, Card, CardContent, Grid, Tabs, Tab, InputAdornment,
  Switch, FormControlLabel, Autocomplete,
} from "@mui/material";
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon, Search as SearchIcon,
  Repeat as RecurringIcon, EventNote as OneTimeIcon, CheckCircle as ActiveIcon,
  Cancel as InactiveIcon, Block as BlockIcon, AccountBalance as RevenueIcon,
} from "@mui/icons-material";
import GlobalNav from "../components/GlobalNav";
import { getCurrentUser, API_BASE_URL } from "../lib/api";
import RecurringExpenseDialogContent from "./components/RecurringExpenseDialogContent";
import AttributeCostsTab from "./components/AttributeCostsTab";
import { autoApplyExpenses, bulkCreateExpenses } from "../lib/expenseCategoryRuleService";

export default function ExpensesRevenuesPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [oneTimeExpenses, setOneTimeExpenses] = useState([]);
  const [otherRevenues, setOtherRevenues] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [revenueCategories, setRevenueCategories] = useState([]);
  const [cabs, setCabs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [shiftProfiles, setShiftProfiles] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [attributeTypes, setAttributeTypes] = useState([]);

  // Statement tab state
  const [statementType, setStatementType] = useState("DRIVER");
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [statementStartDate, setStatementStartDate] = useState("");
  const [statementEndDate, setStatementEndDate] = useState("");
  const [statement, setStatement] = useState(null);
  const [loadingStatement, setLoadingStatement] = useState(false);

  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterEntityType, setFilterEntityType] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [searchText, setSearchText] = useState("");

  const [openRecurringDialog, setOpenRecurringDialog] = useState(false);
  const [openOneTimeDialog, setOpenOneTimeDialog] = useState(false);
  const [openRevenueDialog, setOpenRevenueDialog] = useState(false);
  const [openEditWarningDialog, setOpenEditWarningDialog] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState(null);
  const [editingOneTime, setEditingOneTime] = useState(null);
  const [editingRevenue, setEditingRevenue] = useState(null);

  const [recurringFormData, setRecurringFormData] = useState({
    expenseCategoryId: "", amount: "",
    billingMethod: "MONTHLY", effectiveFrom: "", effectiveTo: "", notes: "", isActive: true,
  });
  
  const [oneTimeFormData, setOneTimeFormData] = useState({
    expenseCategoryId: "", name: "", amount: "",
    expenseDate: new Date().toISOString().split('T')[0], paidBy: "COMPANY",
    responsibleParty: "COMPANY", description: "", vendor: "", receiptUrl: "",
    invoiceNumber: "", isReimbursable: false, notes: "",
    applicationType: "", shiftProfileId: null,
    specificShiftId: null, specificPersonId: null,
    attributeTypeId: null,
  });

  const [revenueFormData, setRevenueFormData] = useState({
    revenueCategoryId: null, amount: "",
    revenueDate: new Date().toISOString().split('T')[0], revenueType: "CREDIT",
    description: "", referenceNumber: "", paymentStatus: "PENDING",
    // ✅ NEW: Application Type System
    applicationType: null,
    shiftProfileId: null,
    specificShiftId: null,
    specificPersonId: null,
    attributeTypeId: null,
  });

  const canEdit = ["ADMIN", "MANAGER", "ACCOUNTANT"].includes(currentUser?.role);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !["ADMIN", "MANAGER", "ACCOUNTANT", "DISPATCHER"].includes(user.role)) {
      window.location.href = "/";
      return;
    }
    setCurrentUser(user);
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    setFilterStartDate(monthStart);
    setFilterEndDate(monthEnd);
    setStatementStartDate(monthStart);
    setStatementEndDate(monthEnd);
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadExpenseCategories(),
        loadRevenueCategories(),
        loadCabs(),
        loadDrivers(),
        loadShiftProfiles(),
        loadShifts(),
        loadRecurringExpenses(),
        loadAttributeTypes()
      ]);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTab === 1 && filterStartDate && filterEndDate) {
      loadOneTimeExpenses();
    } else if (currentTab === 2 && filterStartDate && filterEndDate) {
      loadOtherRevenues();
    }
  }, [currentTab, filterStartDate, filterEndDate]);

  const loadExpenseCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/expense-categories?active=true`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"), },
      });
      if (response.ok) setExpenseCategories(await response.json());
    } catch (err) { console.error(err); }
  };

  const loadRevenueCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/revenue-categories/active`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"), },
      });
      if (response.ok) setRevenueCategories(await response.json());
    } catch (err) { console.error(err); }
  };

  const loadCabs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cabs`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"), },
      });
      if (response.ok) {
        const data = await response.json();
        setCabs(data.sort((a, b) => parseInt(a.cabNumber) - parseInt(b.cabNumber)));
      }
    } catch (err) { console.error(err); }
  };

  const loadDrivers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/drivers`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"), },
      });
      if (response.ok) setDrivers(await response.json());
    } catch (err) { console.error(err); }
  };

  const loadShiftProfiles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/shift-profiles`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"), },
      });
      if (response.ok) setShiftProfiles(await response.json());
    } catch (err) { console.error(err); }
  };

  const loadShifts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/shifts`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"), },
      });
      if (response.ok) setShifts(await response.json());
    } catch (err) { console.error(err); }
  };

  const loadAttributeTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cab-attribute-types/active`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"), },
      });
      if (response.ok) setAttributeTypes(await response.json());
    } catch (err) { console.error(err); }
  };

  const loadRecurringExpenses = async () => {
    try {
      const endpoint = showActiveOnly ? `${API_BASE_URL}/recurring-expenses/active` : `${API_BASE_URL}/recurring-expenses`;
      const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"), } });
      if (response.ok) setRecurringExpenses(await response.json());
    } catch (err) { console.error(err); }
  };

  const loadOneTimeExpenses = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/one-time-expenses/between?startDate=${filterStartDate}&endDate=${filterEndDate}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"), } }
      );
      if (response.ok) setOneTimeExpenses(await response.json());
    } catch (err) { console.error(err); }
  };

  const loadOtherRevenues = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/other-revenues?startDate=${filterStartDate}&endDate=${filterEndDate}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"), } }
      );
      if (response.ok) setOtherRevenues(await response.json());
    } catch (err) { console.error(err); }
  };

  const handleOpenRecurringDialog = (expense = null) => {
    if (expense) {
      setEditingRecurring(expense);
      setRecurringFormData({
        expenseCategoryId: expense.expenseCategory?.id || "",
        amount: expense.amount,
        billingMethod: expense.billingMethod,
        effectiveFrom: expense.effectiveFrom,
        effectiveTo: expense.effectiveTo || "",
        notes: expense.notes || "",
        isActive: expense.isActive !== undefined ? expense.isActive : true,
      });
    } else {
      setEditingRecurring(null);
      const today = new Date();
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      setRecurringFormData({
        expenseCategoryId: "", amount: "",
        billingMethod: "MONTHLY", effectiveFrom: firstOfMonth, effectiveTo: "", notes: "", isActive: true,
      });
    }
    setError("");
    setSuccess("");
    setOpenRecurringDialog(true);
  };

  const handleSaveRecurring = async () => {
    // Validate required fields
    if (!recurringFormData.expenseCategoryId || !recurringFormData.amount || !recurringFormData.effectiveFrom) {
      setError("Category, amount, and effective date are required");
      return;
    }

    try {
      // Build payload with correct field types
      const payload = {
        expenseCategoryId: parseInt(recurringFormData.expenseCategoryId),
        amount: parseFloat(recurringFormData.amount),
        billingMethod: recurringFormData.billingMethod,
        effectiveFrom: recurringFormData.effectiveFrom,
        effectiveTo: recurringFormData.effectiveTo || null,
        notes: recurringFormData.notes,
        isActive: recurringFormData.isActive !== undefined ? recurringFormData.isActive : true,
      };

      const url = editingRecurring ? `${API_BASE_URL}/recurring-expenses/${editingRecurring.id}` : `${API_BASE_URL}/recurring-expenses`;
      const response = await fetch(url, {
        method: editingRecurring ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setSuccess(editingRecurring ? "Updated" : "Created");
        setOpenRecurringDialog(false);
        loadRecurringExpenses();
      } else {
        setError(await response.text() || "Failed");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleRecurringActive = async (id, currentStatus) => {
    try {
      const endpoint = currentStatus ? `${API_BASE_URL}/recurring-expenses/${id}/deactivate` : `${API_BASE_URL}/recurring-expenses/${id}/reactivate`;
      const response = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"), } });
      if (response.ok || response.status === 204) {
        setSuccess(`${currentStatus ? 'Deactivated' : 'Activated'}`);
        loadRecurringExpenses();
      }
    } catch (err) { setError(err.message); }
  };

  const handleOpenOneTimeDialog = (expense = null) => {
    if (expense) {
      // Don't allow editing - show warning instead
      setOpenEditWarningDialog(true);
      return;
    } else {
      setEditingOneTime(null);
      setOneTimeFormData({
        expenseCategoryId: "", name: "", amount: "",
        expenseDate: new Date().toISOString().split('T')[0], paidBy: "COMPANY",
        responsibleParty: "COMPANY", description: "", vendor: "", receiptUrl: "",
        invoiceNumber: "", isReimbursable: false, notes: "",
        applicationType: "", shiftProfileId: null,
        specificShiftId: null, specificPersonId: null,
        attributeTypeId: null,
      });
    }
    setError("");
    setSuccess("");
    setOpenOneTimeDialog(true);
  };

  const handleSaveOneTime = async () => {
    // Validate required fields (category is now optional)
    if (!oneTimeFormData.name || !oneTimeFormData.amount || !oneTimeFormData.expenseDate || !oneTimeFormData.paidBy) {
      setError("Required fields missing: Name, Amount, Date, and Paid By");
      return;
    }

    // Validate based on application type if one is specified
    if (oneTimeFormData.applicationType) {
      switch (oneTimeFormData.applicationType) {
        case "SHIFT_PROFILE":
          if (!oneTimeFormData.shiftProfileId) {
            setError("Please select a shift profile");
            return;
          }
          break;
        case "SPECIFIC_SHIFT":
          if (!oneTimeFormData.specificShiftId) {
            setError("Please select a specific shift");
            return;
          }
          break;
        case "SPECIFIC_PERSON":
          if (!oneTimeFormData.specificPersonId) {
            setError("Please select a person (driver or owner)");
            return;
          }
          break;
        case "SHIFTS_WITH_ATTRIBUTE":
          if (!oneTimeFormData.attributeTypeId) {
            setError("Please select an attribute type");
            return;
          }
          break;
      }
    }

    try {
      // Build payload with correct field types and values
      const payload = {
        expenseCategoryId: oneTimeFormData.expenseCategoryId ? parseInt(oneTimeFormData.expenseCategoryId) : null,
        name: oneTimeFormData.name,
        amount: parseFloat(oneTimeFormData.amount),
        expenseDate: oneTimeFormData.expenseDate,
        paidBy: oneTimeFormData.paidBy,
        responsibleParty: oneTimeFormData.responsibleParty,
        description: oneTimeFormData.description,
        vendor: oneTimeFormData.vendor,
        receiptUrl: oneTimeFormData.receiptUrl,
        invoiceNumber: oneTimeFormData.invoiceNumber,
        isReimbursable: oneTimeFormData.isReimbursable === true,
        notes: oneTimeFormData.notes,
        applicationType: oneTimeFormData.applicationType || null,
        shiftProfileId: oneTimeFormData.shiftProfileId ? parseInt(oneTimeFormData.shiftProfileId) : null,
        specificShiftId: oneTimeFormData.specificShiftId ? parseInt(oneTimeFormData.specificShiftId) : null,
        specificPersonId: oneTimeFormData.specificPersonId ? parseInt(oneTimeFormData.specificPersonId) : null,
        attributeTypeId: oneTimeFormData.attributeTypeId ? parseInt(oneTimeFormData.attributeTypeId) : null,
      };

      const url = editingOneTime ? `${API_BASE_URL}/one-time-expenses/${editingOneTime.id}` : `${API_BASE_URL}/one-time-expenses`;
      const response = await fetch(url, {
        method: editingOneTime ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setSuccess(editingOneTime ? "Updated" : "Created");
        setOpenOneTimeDialog(false);
        loadOneTimeExpenses();
      } else {
        const errorText = await response.text();
        setError(errorText || "Failed to save expense");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenRevenueDialog = (revenue = null) => {
    if (revenue) {
      // Don't allow editing - show warning instead
      setOpenEditWarningDialog(true);
      return;
    } else {
      setEditingRevenue(null);
      setRevenueFormData({
        revenueCategoryId: null, amount: "",
        revenueDate: new Date().toISOString().split('T')[0], revenueType: "CREDIT",
        description: "", referenceNumber: "", paymentStatus: "PENDING",
        // ✅ NEW: Application Type System
        applicationType: null,
        shiftProfileId: null,
        specificShiftId: null,
        specificPersonId: null,
        attributeTypeId: null,
      });
    }
    setError("");
    setSuccess("");
    setOpenRevenueDialog(true);
  };

  const handleSaveRevenue = async () => {
    if (!revenueFormData.amount || !revenueFormData.revenueDate) {
      setError("Required fields missing: Amount and Revenue Date");
      return;
    }

    // Validate application type requirements
    if (revenueFormData.applicationType === "SHIFT_PROFILE" && !revenueFormData.shiftProfileId) {
      setError("Shift Profile ID is required");
      return;
    }
    if (revenueFormData.applicationType === "SPECIFIC_SHIFT" && !revenueFormData.specificShiftId) {
      setError("Specific Shift is required");
      return;
    }
    if (revenueFormData.applicationType === "SPECIFIC_PERSON" && !revenueFormData.specificPersonId) {
      setError("Specific Person is required");
      return;
    }
    if (revenueFormData.applicationType === "SHIFTS_WITH_ATTRIBUTE" && !revenueFormData.attributeTypeId) {
      setError("Attribute Type is required");
      return;
    }

    try {
      const payload = {
        revenueDate: revenueFormData.revenueDate,
        amount: parseFloat(revenueFormData.amount),
        revenueType: revenueFormData.revenueType,
        description: revenueFormData.description,
        referenceNumber: revenueFormData.referenceNumber || null,
        paymentStatus: revenueFormData.paymentStatus || "PENDING",
        // ✅ NEW: Application Type System
        applicationType: revenueFormData.applicationType || null,
        shiftProfileId: revenueFormData.shiftProfileId || null,
        specificShiftId: revenueFormData.specificShiftId || null,
        specificPersonId: revenueFormData.specificPersonId || null,
        attributeTypeId: revenueFormData.attributeTypeId || null,
      };

      // Add category if provided
      if (revenueFormData.revenueCategoryId) {
        payload.categoryId = revenueFormData.revenueCategoryId;
      }

      const url = editingRevenue ? `${API_BASE_URL}/other-revenues/${editingRevenue.id}` : `${API_BASE_URL}/other-revenues`;
      const response = await fetch(url, {
        method: editingRevenue ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setSuccess(editingRevenue ? "Updated" : "Created");
        setOpenRevenueDialog(false);
        loadOtherRevenues();
      } else {
        const errorText = await response.text();
        setError(errorText || "Failed to save revenue");
      }
    } catch (err) {
      setError("Error: " + err.message);
    }
  };

  const getEntityDisplay = (entityType, entityId, shiftType, driver, owner, cab) => {
    if (entityType === "CAB") {
      const cabData = cab || cabs.find(c => c.id === entityId);
      return cabData ? `Cab ${cabData.cabNumber}` : `Cab #${entityId}`;
    } else if (entityType === "SHIFT") {
      return shiftType === "DAY" ? "Day Shift" : "Night Shift";
    } else if (entityType === "DRIVER") {
      const driverData = driver || drivers.find(d => d.id === entityId);
      return driverData ? `${driverData.firstName} ${driverData.lastName}` : `Driver #${entityId}`;
    } else if (entityType === "OWNER") {
      const ownerData = owner || drivers.find(d => d.id === entityId);
      return ownerData ? `${ownerData.firstName} ${ownerData.lastName}` : `Owner #${entityId}`;
    }
    return entityType;
  };

  const getChargeToDisplay = (expense) => {
    if (!expense.applicationType) {
      return "General Expense";
    }

    switch (expense.applicationType) {
      case "SHIFT_PROFILE":
        const profile = shiftProfiles.find(p => p.id === expense.shiftProfileId);
        return `Profile: ${profile?.profileName || `#${expense.shiftProfileId}`}`;

      case "SPECIFIC_SHIFT":
        const shift = shifts.find(s => s.id === expense.specificShiftId);
        return shift ? `Shift: Cab ${shift.cabNumber} ${shift.shiftType}` : `Shift #${expense.specificShiftId}`;

      case "SPECIFIC_PERSON":
        const person = drivers.find(d => d.id === expense.specificPersonId);
        if (!person) return `Person #${expense.specificPersonId}`;
        return `${person.firstName} ${person.lastName} ${person.isOwner ? "(Owner)" : "(Driver)"}`;

      case "SHIFTS_WITH_ATTRIBUTE":
        const attribute = attributeTypes.find(a => a.id === expense.attributeTypeId);
        return `Attribute: ${attribute?.attributeName || `#${expense.attributeTypeId}`}`;

      case "ALL_OWNERS":
        return "All Owners";

      case "ALL_ACTIVE_SHIFTS":
        return "All Active Shifts";

      case "ALL_DRIVERS":
        return "All Drivers";

      default:
        return expense.applicationType;
    }
  };

  const getFilteredRecurring = () => {
    let filtered = recurringExpenses;
    if (filterCategory) filtered = filtered.filter(e => e.expenseCategory?.id === parseInt(filterCategory));
    if (filterEntityType) filtered = filtered.filter(e => e.entityType === filterEntityType);
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(e => (e.expenseCategory?.categoryName?.toLowerCase().includes(searchLower)) || (e.notes?.toLowerCase().includes(searchLower)));
    }
    return filtered;
  };

  const getFilteredOneTime = () => {
    let filtered = oneTimeExpenses;
    if (filterCategory) filtered = filtered.filter(e => e.expenseCategory?.id === parseInt(filterCategory));
    if (filterEntityType) filtered = filtered.filter(e => e.entityType === filterEntityType);
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(e =>
        (e.expenseCategory?.categoryName?.toLowerCase().includes(searchLower)) ||
        (e.description?.toLowerCase().includes(searchLower)) ||
        (e.vendor?.toLowerCase().includes(searchLower))
      );
    }
    return filtered;
  };

  const getFilteredRevenues = () => {
    let filtered = otherRevenues;
    if (filterCategory) filtered = filtered.filter(r => r.category?.id === parseInt(filterCategory));
    if (filterEntityType) filtered = filtered.filter(r => r.entityType === filterEntityType);
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(r =>
        (r.category?.categoryName?.toLowerCase().includes(searchLower)) ||
        (r.description?.toLowerCase().includes(searchLower)) ||
        (r.revenueType?.toLowerCase().includes(searchLower))
      );
    }
    return filtered;
  };

  const calculateTotalRecurring = () => getFilteredRecurring().reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const calculateTotalOneTime = () => getFilteredOneTime().reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const calculateTotalRevenue = () => getFilteredRevenues().reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

  const generateStatement = async () => {
    if (!selectedPersonId || !statementStartDate || !statementEndDate) {
      setError("Please select a driver/owner and date range");
      return;
    }

    setLoadingStatement(true);
    setError("");
    try {
      let endpoint;
      if (statementType === "DRIVER") {
        endpoint = `${API_BASE_URL}/financial-statements/driver/${selectedPersonId}`;
      } else if (statementType === "OWNER") {
        endpoint = `${API_BASE_URL}/financial-statements/owner/${selectedPersonId}`;
      } else if (statementType === "OWNER_REPORT") {
        endpoint = `${API_BASE_URL}/financial-statements/owner-report/${selectedPersonId}`;
      }

      const response = await fetch(`${endpoint}?from=${statementStartDate}&to=${statementEndDate}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatement(data);
      } else {
        setError(await response.text() || "Failed to generate statement");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingStatement(false);
    }
  };

  const filteredRecurring = getFilteredRecurring();
  const filteredOneTime = getFilteredOneTime();
  const filteredRevenues = getFilteredRevenues();

  if (loading) {
    return (
      <Box>
        <GlobalNav currentUser={currentUser} title="Expenses & Revenues" />
        <Box sx={{ p: 3, textAlign: "center" }}><Typography>Loading...</Typography></Box>
      </Box>
    );
  }

  return (
    <Box>
      <GlobalNav currentUser={currentUser} title="Expenses & Revenues" />
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>Expense & Revenue Management</Typography>
          <Typography variant="body2" color="textSecondary">Manage recurring expenses, one-time expenses, and other revenues/credits</Typography>
        </Box>

        {success && <Alert severity="success" onClose={() => setSuccess("")} sx={{ mb: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card><CardContent><Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <RecurringIcon color="primary" />
              <Box><Typography color="textSecondary" variant="body2">Recurring Expenses</Typography><Typography variant="h6">{filteredRecurring.length}</Typography></Box>
            </Box></CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card><CardContent><Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <OneTimeIcon color="error" />
              <Box><Typography color="textSecondary" variant="body2">One-Time Expenses</Typography><Typography variant="h6">{filteredOneTime.length}</Typography></Box>
            </Box></CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card><CardContent><Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <RevenueIcon color="success" />
              <Box><Typography color="textSecondary" variant="body2">Other Revenues</Typography><Typography variant="h6">{filteredRevenues.length}</Typography></Box>
            </Box></CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card><CardContent><Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TrendingDownIcon color="error" />
              <Box><Typography color="textSecondary" variant="body2">Expense Total</Typography><Typography variant="h6" color="error">${(calculateTotalRecurring() + calculateTotalOneTime()).toFixed(2)}</Typography></Box>
            </Box></CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card><CardContent><Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TrendingUpIcon color="success" />
              <Box><Typography color="textSecondary" variant="body2">Revenue Total</Typography><Typography variant="h6" color="success.main">${calculateTotalRevenue().toFixed(2)}</Typography></Box>
            </Box></CardContent></Card>
          </Grid>
        </Grid>

        <Paper>
          <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
            <Tab label="Recurring Expenses" icon={<RecurringIcon />} iconPosition="start" />
            <Tab label="One-Time Expenses" icon={<OneTimeIcon />} iconPosition="start" />
            <Tab label="Other Revenues" icon={<RevenueIcon />} iconPosition="start" />
            <Tab label="Attribute Costs" icon={<TrendingDownIcon />} iconPosition="start" />
          </Tabs>

          {currentTab === 0 && (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Category</InputLabel>
                    <Select value={filterCategory} label="Category" onChange={(e) => setFilterCategory(e.target.value)}>
                      <MenuItem value="">All</MenuItem>
                      {expenseCategories.map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.categoryName}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Entity Type</InputLabel>
                    <Select value={filterEntityType} label="Entity Type" onChange={(e) => setFilterEntityType(e.target.value)}>
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="CAB">Cab</MenuItem>
                      <MenuItem value="SHIFT">Shift</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField placeholder="Search..." value={searchText} onChange={(e) => setSearchText(e.target.value)} fullWidth size="small" 
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControlLabel control={<Switch checked={showActiveOnly} onChange={(e) => { setShowActiveOnly(e.target.checked); loadRecurringExpenses(); }} />} label="Active Only" />
                </Grid>
                <Grid item xs={12} md={4}>
                  {canEdit && <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenRecurringDialog()} fullWidth>Add Recurring Expense</Button>}
                </Grid>
              </Grid>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell>Entity</TableCell>
                      <TableCell>Billing</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>From</TableCell>
                      <TableCell>To</TableCell>
                      <TableCell>Status</TableCell>
                      {canEdit && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRecurring.map(expense => (
                      <TableRow key={expense.id}>
                        <TableCell><Chip label={expense.expenseCategory?.categoryName} size="small" color="primary" /></TableCell>
                        <TableCell>{getEntityDisplay(expense.entityType, expense.entityId, expense.shiftType)}</TableCell>
                        <TableCell><Chip label={expense.billingMethod} size="small" variant="outlined" /></TableCell>
                        <TableCell align="right"><Typography variant="body2" fontWeight="bold">${parseFloat(expense.amount).toFixed(2)}</Typography></TableCell>
                        <TableCell>{expense.effectiveFrom}</TableCell>
                        <TableCell>{expense.effectiveTo || "Ongoing"}</TableCell>
                        <TableCell><Chip icon={expense.isActive ? <ActiveIcon /> : <InactiveIcon />} label={expense.isActive ? "Active" : "Inactive"} color={expense.isActive ? "success" : "default"} size="small" /></TableCell>
                        {canEdit && (
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => handleOpenRecurringDialog(expense)}><EditIcon fontSize="small" /></IconButton>
                            <IconButton size="small" onClick={() => handleToggleRecurringActive(expense.id, expense.isActive)} color={expense.isActive ? "default" : "success"}>
                              {expense.isActive ? <InactiveIcon fontSize="small" /> : <ActiveIcon fontSize="small" />}
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {currentTab === 1 && (
            <Box sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 700, color: 'error.main', mb: 2 }}>
                Once created, you cannot edit this entry as this will mess up the reports. Please create a counter entry (reversal) if you need to correct it.
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={2}>
                  <TextField label="Start Date" type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField label="End Date" type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} md={6}></Grid>
                <Grid item xs={12} md={2}>
                  {canEdit && <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenOneTimeDialog()} fullWidth>Add Expense</Button>}
                </Grid>
              </Grid>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Charge To</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Vendor</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredOneTime.map(expense => (
                      <TableRow key={expense.id}>
                        <TableCell>{expense.expenseDate}</TableCell>
                        <TableCell><Chip label={expense.expenseCategory?.categoryName || "Standalone"} size="small" color="secondary" /></TableCell>
                        <TableCell>{expense.name || "-"}</TableCell>
                        <TableCell>
                          <Chip
                            label={getChargeToDisplay(expense)}
                            size="small"
                            variant="outlined"
                            color={expense.applicationType ? "primary" : "default"}
                          />
                        </TableCell>
                        <TableCell>{expense.description || "-"}</TableCell>
                        <TableCell>{expense.vendor || "-"}</TableCell>
                        <TableCell align="right"><Typography variant="body2" fontWeight="bold" color="error">${parseFloat(expense.amount).toFixed(2)}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {currentTab === 2 && (
            <Box sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 700, color: 'error.main', mb: 2 }}>
                Once created, you cannot edit this entry as this will mess up the reports. Please create a counter entry (reversal) if you need to correct it.
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={2}>
                  <TextField label="Start Date" type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField label="End Date" type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} md={6}></Grid>
                <Grid item xs={12} md={2}>
                  {canEdit && <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={() => handleOpenRevenueDialog()} fullWidth>Add Revenue</Button>}
                </Grid>
              </Grid>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Applied To</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Payment Status</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRevenues.map(revenue => (
                      <TableRow key={revenue.id}>
                        <TableCell>{revenue.revenueDate}</TableCell>
                        <TableCell><Chip label={revenue.categoryName || "Uncategorized"} size="small" color="success" /></TableCell>
                        <TableCell><Chip label={revenue.revenueType} size="small" variant="outlined" color="success" /></TableCell>
                        <TableCell><Chip label={revenue.applicationTypeDisplay || "General"} size="small" variant="outlined" /></TableCell>
                        <TableCell>{revenue.description || "-"}</TableCell>
                        <TableCell><Chip label={revenue.paymentStatus} size="small" color={revenue.paymentStatus === "PAID" ? "success" : "warning"} /></TableCell>
                        <TableCell align="right"><Typography variant="body2" fontWeight="bold" color="success.main">${parseFloat(revenue.amount).toFixed(2)}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {currentTab === 3 && (
            <AttributeCostsTab canEdit={canEdit} />
          )}
        </Paper>


        {/* Recurring Expense Dialog */}
        <Dialog open={openRecurringDialog} onClose={() => setOpenRecurringDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>{editingRecurring ? "Edit Recurring Expense" : "Add Recurring Expense"}</DialogTitle>
          <DialogContent>
            <RecurringExpenseDialogContent
              formData={recurringFormData}
              setFormData={setRecurringFormData}
              expenseCategories={expenseCategories}
              cabs={cabs}
              drivers={drivers}
              editing={editingRecurring}
              error={error}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenRecurringDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveRecurring} variant="contained">{editingRecurring ? "Update" : "Save"}</Button>
          </DialogActions>
        </Dialog>

        {/* One-Time Expense Dialog */}
        <Dialog open={openOneTimeDialog} onClose={() => setOpenOneTimeDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>{editingOneTime ? "Edit Expense" : "Add One-Time Expense"}</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>One-Time Expenses - Now Standalone</Typography>
              <Typography variant="body2">
                Create ad-hoc expenses like speeding tickets, violations, repairs, or breakage without needing a pre-defined category.
                You can optionally assign them to specific shifts, drivers, owners, or shift profiles.
              </Typography>
            </Alert>
            <Typography sx={{ fontWeight: 700, mb: 2 }}>
              You will not be able to edit the entry once made. You will have to create a counter entry (reversal), so be careful.
            </Typography>
            <Grid container spacing={2} sx={{ pt: 2 }}>
              <Grid item xs={12} md={6}>
                <TextField label="Expense Name" value={oneTimeFormData.name} onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, name: e.target.value })}
                  fullWidth required placeholder="e.g., Emergency Repair, Fuel Surcharge" />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Expense Date" type="date" value={oneTimeFormData.expenseDate} onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, expenseDate: e.target.value })}
                  fullWidth required InputLabelProps={{ shrink: true }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={[{ id: null, categoryName: "None - Standalone Expense" }, ...expenseCategories]}
                  getOptionLabel={(option) => option.categoryName}
                  getOptionKey={(option) => `expense-category-${option.id || 'none'}`}
                  value={oneTimeFormData.expenseCategoryId ? expenseCategories.find(c => c.id === oneTimeFormData.expenseCategoryId) || null : null}
                  onChange={(event, newValue) => setOneTimeFormData({ ...oneTimeFormData, expenseCategoryId: newValue?.id || null })}
                  renderInput={(params) => <TextField {...params} label="Category (Optional)" />}
                />
              </Grid>

              {/* Charge To / Application Type - Now Optional for Standalone Expenses */}
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={[
                    { value: null, label: "No Specific Targeting (General Expense)" },
                    { value: "SHIFT_PROFILE", label: "Shift Profile (All Matching Shifts)" },
                    { value: "SPECIFIC_SHIFT", label: "Specific Shift" },
                    { value: "SPECIFIC_PERSON", label: "Specific Person (Driver or Owner)" },
                    { value: "SHIFTS_WITH_ATTRIBUTE", label: "Shifts With Attribute" },
                    { value: "ALL_ACTIVE_SHIFTS", label: "All Active Shifts" },
                    { value: "ALL_OWNERS", label: "All Owners" },
                    { value: "ALL_DRIVERS", label: "All Drivers" },
                  ]}
                  getOptionLabel={(option) => option.label}
                  value={oneTimeFormData.applicationType ?
                    { value: oneTimeFormData.applicationType, label: ["No Specific Targeting (General Expense)", "Shift Profile (All Matching Shifts)", "Specific Shift", "Specific Person (Driver or Owner)", "Shifts With Attribute", "All Active Shifts", "All Owners", "All Drivers"][["SHIFT_PROFILE", "SPECIFIC_SHIFT", "SPECIFIC_PERSON", "SHIFTS_WITH_ATTRIBUTE", "ALL_ACTIVE_SHIFTS", "ALL_OWNERS", "ALL_DRIVERS"].indexOf(oneTimeFormData.applicationType) + 1] }
                    : { value: null, label: "No Specific Targeting (General Expense)" }
                  }
                  onChange={(event, newValue) => setOneTimeFormData({
                    ...oneTimeFormData,
                    applicationType: newValue?.value || null,
                    shiftProfileId: null,
                    specificShiftId: null,
                    specificPersonId: null,
                    attributeTypeId: null
                  })}
                  renderInput={(params) => <TextField {...params} label="Charge To (Optional - for targeting)" />}
                />
              </Grid>

              {/* Conditional fields based on application type */}
              {oneTimeFormData.applicationType === "SHIFT_PROFILE" && (
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={shiftProfiles}
                    getOptionLabel={(option) => option.profileName}
                    getOptionKey={(option) => `shift-profile-${option.id}`}
                    value={oneTimeFormData.shiftProfileId ? shiftProfiles.find(p => p.id === oneTimeFormData.shiftProfileId) || null : null}
                    onChange={(event, newValue) => setOneTimeFormData({ ...oneTimeFormData, shiftProfileId: newValue?.id || null })}
                    renderInput={(params) => <TextField {...params} label="Shift Profile" required />}
                  />
                </Grid>
              )}

              {oneTimeFormData.applicationType === "SPECIFIC_SHIFT" && (
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={shifts}
                    getOptionLabel={(option) => `Cab ${option.cabNumber} - ${option.shiftType}`}
                    getOptionKey={(option) => `shift-${option.id}`}
                    value={oneTimeFormData.specificShiftId ? shifts.find(s => s.id === oneTimeFormData.specificShiftId) || null : null}
                    onChange={(event, newValue) => setOneTimeFormData({ ...oneTimeFormData, specificShiftId: newValue?.id || null })}
                    renderInput={(params) => <TextField {...params} label="Shift" required />}
                  />
                </Grid>
              )}

              {oneTimeFormData.applicationType === "SPECIFIC_PERSON" && (
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={drivers}
                    getOptionLabel={(option) => `${option.firstName} ${option.lastName} ${option.isOwner ? "(Owner)" : "(Driver)"}`}
                    getOptionKey={(option) => `driver-${option.id}`}
                    value={oneTimeFormData.specificPersonId ? drivers.find(d => d.id === oneTimeFormData.specificPersonId) || null : null}
                    onChange={(event, newValue) => setOneTimeFormData({ ...oneTimeFormData, specificPersonId: newValue?.id || null })}
                    renderInput={(params) => <TextField {...params} label="Select Person" required />}
                  />
                </Grid>
              )}

              {oneTimeFormData.applicationType === "SHIFTS_WITH_ATTRIBUTE" && (
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={attributeTypes}
                    getOptionLabel={(option) => `${option.attributeName} (${option.code})`}
                    getOptionKey={(option) => `attribute-${option.id}`}
                    value={oneTimeFormData.attributeTypeId ? attributeTypes.find(a => a.id === oneTimeFormData.attributeTypeId) || null : null}
                    onChange={(event, newValue) => setOneTimeFormData({ ...oneTimeFormData, attributeTypeId: newValue?.id || null })}
                    renderInput={(params) => <TextField {...params} label="Attribute Type" required />}
                  />
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <TextField label="Amount" type="number" value={oneTimeFormData.amount} onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, amount: e.target.value })}
                  fullWidth required InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} inputProps={{ step: "0.01", min: "0" }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={["DRIVER", "OWNER", "COMPANY", "THIRD_PARTY"]}
                  value={oneTimeFormData.paidBy}
                  onChange={(event, newValue) => setOneTimeFormData({ ...oneTimeFormData, paidBy: newValue })}
                  renderInput={(params) => <TextField {...params} label="Paid By" required />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Vendor" value={oneTimeFormData.vendor} onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, vendor: e.target.value })} fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Description" value={oneTimeFormData.description} onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, description: e.target.value })} fullWidth multiline rows={2} />
              </Grid>
            </Grid>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenOneTimeDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveOneTime} variant="contained">{editingOneTime ? "Update" : "Save"}</Button>
          </DialogActions>
        </Dialog>

        {/* Revenue Dialog */}
        <Dialog open={openRevenueDialog} onClose={() => setOpenRevenueDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>{editingRevenue ? "Edit Revenue" : "Add Other Revenue"}</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>Other Revenues - Now Standalone</Typography>
              <Typography variant="body2">
                Create bonuses, credits, adjustments, or other revenue types without needing a pre-defined category.
                You can optionally assign them to specific shifts, drivers, owners, or shift profiles.
              </Typography>
            </Alert>
            <Typography sx={{ fontWeight: 700, mb: 2 }}>
              You will not be able to edit the entry once made. You will have to create a counter entry (reversal), so be careful.
            </Typography>
            <Grid container spacing={2} sx={{ pt: 2 }}>
              <Grid item xs={12} md={6}>
                <TextField label="Revenue Name" value={revenueFormData.description || ""} onChange={(e) => setRevenueFormData({ ...revenueFormData, description: e.target.value })}
                  fullWidth required placeholder="e.g., Performance Bonus, Driver Credit" />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Revenue Date" type="date" value={revenueFormData.revenueDate} onChange={(e) => setRevenueFormData({ ...revenueFormData, revenueDate: e.target.value })}
                  fullWidth required InputLabelProps={{ shrink: true }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={[{ id: null, categoryName: "None - Standalone Revenue" }, ...revenueCategories]}
                  getOptionLabel={(option) => option.categoryName}
                  getOptionKey={(option) => `revenue-category-${option.id || 'none'}`}
                  value={revenueFormData.revenueCategoryId ? revenueCategories.find(c => c.id === revenueFormData.revenueCategoryId) || null : null}
                  onChange={(event, newValue) => setRevenueFormData({ ...revenueFormData, revenueCategoryId: newValue?.id || null })}
                  renderInput={(params) => <TextField {...params} label="Category (Optional)" />}
                />
              </Grid>

              {/* Apply To / Application Type - Optional for Standalone Revenues */}
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={[
                    { value: null, label: "No Specific Targeting (General Revenue)" },
                    { value: "SHIFT_PROFILE", label: "Shift Profile (All Matching Shifts)" },
                    { value: "SPECIFIC_SHIFT", label: "Specific Shift" },
                    { value: "SPECIFIC_PERSON", label: "Specific Person (Driver or Owner)" },
                    { value: "SHIFTS_WITH_ATTRIBUTE", label: "Shifts With Attribute" },
                    { value: "ALL_ACTIVE_SHIFTS", label: "All Active Shifts" },
                    { value: "ALL_OWNERS", label: "All Owners" },
                    { value: "ALL_DRIVERS", label: "All Drivers" },
                  ]}
                  getOptionLabel={(option) => option.label}
                  value={revenueFormData.applicationType ?
                    { value: revenueFormData.applicationType, label: ["No Specific Targeting (General Revenue)", "Shift Profile (All Matching Shifts)", "Specific Shift", "Specific Person (Driver or Owner)", "Shifts With Attribute", "All Active Shifts", "All Owners", "All Drivers"][["SHIFT_PROFILE", "SPECIFIC_SHIFT", "SPECIFIC_PERSON", "SHIFTS_WITH_ATTRIBUTE", "ALL_ACTIVE_SHIFTS", "ALL_OWNERS", "ALL_DRIVERS"].indexOf(revenueFormData.applicationType) + 1] }
                    : { value: null, label: "No Specific Targeting (General Revenue)" }
                  }
                  onChange={(event, newValue) => setRevenueFormData({
                    ...revenueFormData,
                    applicationType: newValue?.value || null,
                    shiftProfileId: null,
                    specificShiftId: null,
                    specificPersonId: null,
                    attributeTypeId: null
                  })}
                  renderInput={(params) => <TextField {...params} label="Apply To (Optional - for targeting)" />}
                />
              </Grid>

              {/* Conditional fields based on application type */}
              {revenueFormData.applicationType === "SHIFT_PROFILE" && (
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={shiftProfiles}
                    getOptionLabel={(option) => option.profileName}
                    getOptionKey={(option) => `shift-profile-${option.id}`}
                    value={revenueFormData.shiftProfileId ? shiftProfiles.find(p => p.id === revenueFormData.shiftProfileId) || null : null}
                    onChange={(event, newValue) => setRevenueFormData({ ...revenueFormData, shiftProfileId: newValue?.id || null })}
                    renderInput={(params) => <TextField {...params} label="Shift Profile" required />}
                  />
                </Grid>
              )}

              {revenueFormData.applicationType === "SPECIFIC_SHIFT" && (
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={shifts}
                    getOptionLabel={(option) => `Cab ${option.cabNumber} - ${option.shiftType}`}
                    getOptionKey={(option) => `shift-${option.id}`}
                    value={revenueFormData.specificShiftId ? shifts.find(s => s.id === revenueFormData.specificShiftId) || null : null}
                    onChange={(event, newValue) => setRevenueFormData({ ...revenueFormData, specificShiftId: newValue?.id || null })}
                    renderInput={(params) => <TextField {...params} label="Shift" required />}
                  />
                </Grid>
              )}

              {revenueFormData.applicationType === "SPECIFIC_PERSON" && (
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={drivers}
                    getOptionLabel={(option) => `${option.firstName} ${option.lastName} ${option.isOwner ? "(Owner)" : "(Driver)"}`}
                    getOptionKey={(option) => `driver-${option.id}`}
                    value={revenueFormData.specificPersonId ? drivers.find(d => d.id === revenueFormData.specificPersonId) || null : null}
                    onChange={(event, newValue) => setRevenueFormData({ ...revenueFormData, specificPersonId: newValue?.id || null })}
                    renderInput={(params) => <TextField {...params} label="Select Person" required />}
                  />
                </Grid>
              )}

              {revenueFormData.applicationType === "SHIFTS_WITH_ATTRIBUTE" && (
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={attributeTypes}
                    getOptionLabel={(option) => `${option.attributeName} (${option.code})`}
                    getOptionKey={(option) => `attribute-${option.id}`}
                    value={revenueFormData.attributeTypeId ? attributeTypes.find(a => a.id === revenueFormData.attributeTypeId) || null : null}
                    onChange={(event, newValue) => setRevenueFormData({ ...revenueFormData, attributeTypeId: newValue?.id || null })}
                    renderInput={(params) => <TextField {...params} label="Attribute Type" required />}
                  />
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <TextField label="Amount" type="number" value={revenueFormData.amount} onChange={(e) => setRevenueFormData({ ...revenueFormData, amount: e.target.value })}
                  fullWidth required InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} inputProps={{ step: "0.01", min: "0" }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={["BONUS", "CREDIT", "ADJUSTMENT", "REFERRAL", "INCENTIVE", "COMMISSION", "REFUND", "REIMBURSEMENT", "OTHER"]}
                  value={revenueFormData.revenueType}
                  onChange={(event, newValue) => setRevenueFormData({ ...revenueFormData, revenueType: newValue })}
                  renderInput={(params) => <TextField {...params} label="Revenue Type" required />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={["PENDING", "PAID", "CANCELLED"]}
                  value={revenueFormData.paymentStatus || "PENDING"}
                  onChange={(event, newValue) => setRevenueFormData({ ...revenueFormData, paymentStatus: newValue })}
                  renderInput={(params) => <TextField {...params} label="Payment Status" />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Reference Number" value={revenueFormData.referenceNumber || ""} onChange={(e) => setRevenueFormData({ ...revenueFormData, referenceNumber: e.target.value })} fullWidth />
              </Grid>
            </Grid>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenRevenueDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveRevenue} variant="contained" color="success">{editingRevenue ? "Update" : "Save"}</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Warning Dialog */}
        <Dialog open={openEditWarningDialog} onClose={() => setOpenEditWarningDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BlockIcon color="error" fontSize="large" />
              <Typography variant="h6" color="error">Editing Not Allowed</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="error" sx={{ mb: 3 }}>
              <AlertTitle>Cannot Edit Once Entered</AlertTitle>
              Expenses and revenues are <strong>immutable</strong> once created.
            </Alert>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Why?</Typography>
            <Typography paragraph>
              Editing existing records would change historical financial reports and calculations that have already been generated, 
              breaking the audit trail and making reconciliation impossible.
            </Typography>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Solution:</Typography>
            <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography paragraph fontWeight="bold">
                ✅ Create a Counter Entry (Reversal)
              </Typography>
              <Typography paragraph>
                1. Create a new entry with the <strong>same details</strong><br/>
                2. Enter a <strong>negative amount</strong> to reverse the incorrect entry<br/>
                3. Then create a new entry with the <strong>correct information</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Example: If you entered $100 by mistake, create a new entry for -$100, then create the correct entry.
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
              This approach maintains the complete financial audit trail and ensures report accuracy.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditWarningDialog(false)} variant="contained" color="primary">I Understand</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}