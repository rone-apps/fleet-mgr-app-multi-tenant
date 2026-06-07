"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GlobalNav from "../components/GlobalNav";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Tooltip,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Autocomplete,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from "@mui/lab";
import {
  Add as AddIcon,
  SwapHoriz as TransferIcon,
  History as HistoryIcon,
  Close as CloseIcon,
  WbSunny as DayIcon,
  NightsStay as NightIcon,
  DirectionsCar,
  Person,
  AttachMoney,
  Search as SearchIcon,
  CheckCircle as CurrentIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
  Tune as TuneIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { getCurrentUser, API_BASE_URL } from "../lib/api";
import { formatDatePST, getTodayPST, formatDateRangePST, calculateDuration, formatDateTimePST } from "../lib/dateUtils";

export default function ShiftsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [cabs, setCabs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [shiftProfiles, setShiftProfiles] = useState([]);
  const [selectedCab, setSelectedCab] = useState(null);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Filter states
  const [cabFilter, setCabFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [viewMode, setViewMode] = useState("by-cab");
  const [showInactiveCabs, setShowInactiveCabs] = useState(false);
  const [attributeFilters, setAttributeFilters] = useState({
    cabType: "ALL",
    shareType: "ALL",
    airportLicense: "ALL",
  });
  
  // Search states for lists
  const [cabSearchText, setCabSearchText] = useState("");
  const [ownerSearchText, setOwnerSearchText] = useState("");
  
  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openTransferDialog, setOpenTransferDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [openProfileAssignmentDialog, setOpenProfileAssignmentDialog] = useState(false);
  const [openProfileHistoryDialog, setOpenProfileHistoryDialog] = useState(false);
  const [openShiftTypeDialog, setOpenShiftTypeDialog] = useState(false);
  const [shiftTypeHistory, setShiftTypeHistory] = useState([]);
  const [selectedShift, setSelectedShift] = useState(null);
  const [ownershipHistory, setOwnershipHistory] = useState([]);
  const [statusHistory, setStatusHistory] = useState([]);
  const [profileAssignmentHistory, setProfileAssignmentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [customAttributes, setCustomAttributes] = useState([]);
  const [attributeHistory, setAttributeHistory] = useState([]);
  const [statusChangeFormData, setStatusChangeFormData] = useState({
    effectiveFrom: new Date().toISOString().split("T")[0],
    reason: "",
  });

  const [shiftTypeChangeFormData, setShiftTypeChangeFormData] = useState({
    shiftType: "",
    reason: "",
  });

  // Edit attributes dialog states
  const [openEditAttributesDialog, setOpenEditAttributesDialog] = useState(false);
  const [editAttributesFormData, setEditAttributesFormData] = useState({
    cabType: "",
    shareType: "",
    hasAirportLicense: false,
    airportLicenseNumber: "",
    airportLicenseExpiry: "",
  });

  // Manage Custom Attributes dialog states
  const [openManageAttributesDialog, setOpenManageAttributesDialog] = useState(false);
  const [allAttributeTypes, setAllAttributeTypes] = useState([]);
  const [managingAttributesForShift, setManagingAttributesForShift] = useState(null);
  const [attributeDialogLoading, setAttributeDialogLoading] = useState(false);
  const [addAttributeForm, setAddAttributeForm] = useState({
    attributeTypeId: "",
    attributeValue: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    notes: "",
  });
  const [currentAttributes, setCurrentAttributes] = useState([]);
  const [attributeHistoryAll, setAttributeHistoryAll] = useState([]);

  // Stats state (for banner)
  const [allShiftsStats, setAllShiftsStats] = useState({ total: 0, active: 0 });
  const [allShiftsData, setAllShiftsData] = useState([]);

  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
  // Form data
  const [createFormData, setCreateFormData] = useState({
    cabId: "",
    shiftType: "DAY",
    startTime: "06:00",
    endTime: "18:00",
    ownerId: "",
    acquisitionType: "INITIAL_ASSIGNMENT",
    acquisitionPrice: "",
    notes: "",
    cabType: "",
    shareType: "",
    hasAirportLicense: false,
    airportLicenseNumber: "",
    airportLicenseExpiry: "",
    createdDate: new Date().toISOString().split("T")[0], // Add creation date field
  });

  const [transferFormData, setTransferFormData] = useState({
    newOwnerId: "",
    transferDate: "",
    acquisitionType: "PURCHASE",
    salePrice: "",
    acquisitionPrice: "",
    notes: "",
  });

  const [profileAssignmentFormData, setProfileAssignmentFormData] = useState({
    profileId: "",
    startDate: new Date().toISOString().split("T")[0],
    reason: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signin");
      return;
    }

    const user = getCurrentUser();
    setCurrentUser(user);

    if (!["ADMIN", "MANAGER", "DISPATCHER"].includes(user?.role)) {
      router.push("/");
      return;
    }

    loadData();
  }, [router]);

  // Reload cabs when show inactive filter changes
  useEffect(() => {
    if (currentUser) {
      loadCabs();
    }
  }, [showInactiveCabs]);

  const loadData = async () => {
    await Promise.all([loadCabs(), loadDrivers(), loadShiftProfiles(), loadAllShiftsStats()]);
    setLoading(false);
  };

  const loadAllShiftsStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/shifts`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });
      if (response.ok) {
        const data = await response.json();
        const allShifts = Array.isArray(data) ? data : (data.content || []);
        setAllShiftsData(allShifts);
        setAllShiftsStats({
          total: allShifts.length,
          active: allShifts.filter(s => s.isActive || s.active).length,
        });
      }
    } catch (err) {
      console.error("Error loading shifts stats:", err);
    }
  };

  const loadCabs = async () => {
    try {
      const url = `${API_BASE_URL}/cabs${showInactiveCabs ? '?includeInactive=true' : ''}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Sort cabs numerically by cab number
        const sortedCabs = data.sort((a, b) => {
          const numA = parseInt(a.cabNumber) || 0;
          const numB = parseInt(b.cabNumber) || 0;
          return numA - numB;
        });
        setCabs(sortedCabs);
      }
    } catch (err) {
      console.error("Error loading cabs:", err);
    }
  };

  const loadDrivers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/drivers`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDrivers(data);  // Show all drivers, not just owners - any driver can own a shift
      }
    } catch (err) {
      console.error("Error loading drivers:", err);
    }
  };

  const loadShiftProfiles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/shift-profiles`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setShiftProfiles(data);
      }
    } catch (err) {
      console.error("Error loading shift profiles:", err);
    }
  };

  const loadShiftsForCab = async (cabId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/shifts/cab/${cabId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setShifts(data);
        setSelectedCab(cabs.find(c => c.id === cabId));
        setSelectedOwner(null);
        setViewMode("by-cab");
      } else {
        setShifts([]);
      }
      // Clear stale attribute data from previously selected cab/shift
      setCustomAttributes([]);
      setAttributeHistory([]);
    } catch (err) {
      console.error("Error loading shifts:", err);
      setShifts([]);
    }
  };

  const loadShiftsByOwner = async (ownerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/shifts/owner/${ownerId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setShifts(data);
        setSelectedOwner(drivers.find(d => d.id === ownerId));
        setSelectedCab(null);
        setViewMode("by-owner");
      } else {
        setShifts([]);
      }
      // Clear stale attribute data from previously selected cab/shift
      setCustomAttributes([]);
      setAttributeHistory([]);
    } catch (err) {
      console.error("Error loading shifts:", err);
      setShifts([]);
    }
  };

  const loadCustomAttributes = async (shiftId) => {
    try {
      const [currentRes, historyRes] = await Promise.all([
        fetch(`${API_BASE_URL}/cab-shifts/${shiftId}/custom-attributes/current`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }),
        fetch(`${API_BASE_URL}/cab-shifts/${shiftId}/custom-attributes/history`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }),
      ]);

      if (currentRes.ok) {
        const data = await currentRes.json();
        setCustomAttributes(data);
      } else {
        setCustomAttributes([]);
      }

      if (historyRes.ok) {
        const data = await historyRes.json();
        setAttributeHistory(data);
      } else {
        setAttributeHistory([]);
      }
    } catch (err) {
      console.error("Error loading custom attributes:", err);
      setCustomAttributes([]);
      setAttributeHistory([]);
    }
  };

  // Load all active attribute types for the dialog
  const loadAllAttributeTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cab-attribute-types/active`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAllAttributeTypes(data);
      } else {
        setAllAttributeTypes([]);
      }
    } catch (err) {
      console.error("Error loading attribute types:", err);
      setAllAttributeTypes([]);
    }
  };

  // Open manage attributes dialog
  const handleOpenManageAttributesDialog = async (shift) => {
    setManagingAttributesForShift(shift);
    setAddAttributeForm({
      attributeTypeId: "",
      attributeValue: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      notes: "",
    });
    setAttributeDialogLoading(true);

    try {
      // Load both attribute types and current attributes in parallel
      await Promise.all([
        loadAllAttributeTypes(),
        (async () => {
          const [currentRes, historyRes] = await Promise.all([
            fetch(`${API_BASE_URL}/cab-shifts/${shift.id}/custom-attributes/current`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "X-Tenant-ID": localStorage.getItem("tenantSchema"),
              },
            }),
            fetch(`${API_BASE_URL}/cab-shifts/${shift.id}/custom-attributes/history`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "X-Tenant-ID": localStorage.getItem("tenantSchema"),
              },
            }),
          ]);

          if (currentRes.ok) {
            setCurrentAttributes(await currentRes.json());
          } else {
            setCurrentAttributes([]);
          }

          if (historyRes.ok) {
            setAttributeHistoryAll(await historyRes.json());
          } else {
            setAttributeHistoryAll([]);
          }
        })(),
      ]);
    } catch (err) {
      console.error("Error loading data for manage attributes dialog:", err);
      setCurrentAttributes([]);
      setAttributeHistoryAll([]);
      setAllAttributeTypes([]);
    } finally {
      setAttributeDialogLoading(false);
      setOpenManageAttributesDialog(true);
    }
  };

  // Add attribute to shift
  const handleAddAttribute = async () => {
    if (!managingAttributesForShift || !addAttributeForm.attributeTypeId) {
      setError("Please select an attribute type");
      return;
    }

    setAttributeDialogLoading(true);
    try {
      const body = {
        attributeTypeId: parseInt(addAttributeForm.attributeTypeId),
        attributeValue: addAttributeForm.attributeValue || "",
        startDate: addAttributeForm.startDate,
        endDate: addAttributeForm.endDate || null,
        notes: addAttributeForm.notes || "",
      };

      const response = await fetch(
        `${API_BASE_URL}/cab-shifts/${managingAttributesForShift.id}/custom-attributes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
          body: JSON.stringify(body),
        }
      );

      if (response.ok) {
        setSuccess("Attribute added successfully");
        setAddAttributeForm({
          attributeTypeId: "",
          attributeValue: "",
          startDate: new Date().toISOString().split("T")[0],
          endDate: "",
          notes: "",
        });
        // Reload current attributes
        const currentRes = await fetch(
          `${API_BASE_URL}/cab-shifts/${managingAttributesForShift.id}/custom-attributes/current`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            },
          }
        );
        if (currentRes.ok) {
          setCurrentAttributes(await currentRes.json());
        }
        // Also reload history
        const historyRes = await fetch(
          `${API_BASE_URL}/cab-shifts/${managingAttributesForShift.id}/custom-attributes/history`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            },
          }
        );
        if (historyRes.ok) {
          setAttributeHistoryAll(await historyRes.json());
        }
      } else {
        const error = await response.json();
        setError(error.message || "Failed to add attribute");
      }
    } catch (err) {
      console.error("Error adding attribute:", err);
      setError(err.message || "Error adding attribute");
    } finally {
      setAttributeDialogLoading(false);
    }
  };

  // End/remove attribute
  const handleEndAttribute = async (attributeValueId) => {
    if (!managingAttributesForShift) return;

    setAttributeDialogLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/cab-shifts/${managingAttributesForShift.id}/custom-attributes/${attributeValueId}/end`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
          body: JSON.stringify({
            endDate: new Date().toISOString().split("T")[0],
          }),
        }
      );

      if (response.ok) {
        setSuccess("Attribute removed successfully");
        // Reload current and history attributes
        const [currentRes, historyRes] = await Promise.all([
          fetch(`${API_BASE_URL}/cab-shifts/${managingAttributesForShift.id}/custom-attributes/current`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            },
          }),
          fetch(`${API_BASE_URL}/cab-shifts/${managingAttributesForShift.id}/custom-attributes/history`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            },
          }),
        ]);

        if (currentRes.ok) {
          setCurrentAttributes(await currentRes.json());
        }
        if (historyRes.ok) {
          setAttributeHistoryAll(await historyRes.json());
        }
      } else {
        const error = await response.json();
        setError(error.message || "Failed to remove attribute");
      }
    } catch (err) {
      console.error("Error removing attribute:", err);
      setError(err.message || "Error removing attribute");
    } finally {
      setAttributeDialogLoading(false);
    }
  };

  const getFilteredShifts = () => {
    let filtered = [...shifts];

    if (viewMode === "by-owner" && cabFilter) {
      filtered = filtered.filter(shift =>
        (shift.cabNumber && shift.cabNumber.toLowerCase().includes(cabFilter.toLowerCase())) ||
        (shift.cabRegistration && shift.cabRegistration.toLowerCase().includes(cabFilter.toLowerCase()))
      );
    }

    if (viewMode === "by-cab" && ownerFilter) {
      filtered = filtered.filter(shift =>
        (shift.currentOwnerName && shift.currentOwnerName.toLowerCase().includes(ownerFilter.toLowerCase())) ||
        (shift.currentOwnerDriverNumber && shift.currentOwnerDriverNumber.toLowerCase().includes(ownerFilter.toLowerCase()))
      );
    }

    // Apply attribute filters
    if (attributeFilters.cabType !== "ALL") {
      filtered = filtered.filter(shift => shift.cabType === attributeFilters.cabType);
    }

    if (attributeFilters.shareType !== "ALL") {
      filtered = filtered.filter(shift => shift.shareType === attributeFilters.shareType);
    }

    if (attributeFilters.airportLicense === "YES") {
      filtered = filtered.filter(shift => shift.hasAirportLicense);
    } else if (attributeFilters.airportLicense === "NO") {
      filtered = filtered.filter(shift => !shift.hasAirportLicense);
    }

    return filtered;
  };

  const filteredShifts = getFilteredShifts();

  // Derive sets of cab IDs that have shifts and owner IDs that have active shifts
  const cabIdsWithShifts = new Set(allShiftsData.map(s => s.cabId));
  const activeShifts = allShiftsData.filter(s => s.isActive || s.active);
  const ownerIdsWithActiveShifts = new Set(activeShifts.map(s => s.currentOwnerId).filter(Boolean));
  const ownerIdsWithAnyShifts = new Set(allShiftsData.map(s => s.currentOwnerId).filter(Boolean));

  const getFilteredCabs = () => {
    let result = cabs;

    // Cabs are already filtered by backend based on showInactiveCabs checkbox
    // No need for additional client-side status filtering

    if (cabSearchText) {
      const searchLower = cabSearchText.toLowerCase();
      result = result.filter(cab =>
        (cab.cabNumber && cab.cabNumber.toLowerCase().includes(searchLower)) ||
        (cab.registrationNumber && cab.registrationNumber.toLowerCase().includes(searchLower)) ||
        (cab.make && cab.make.toLowerCase().includes(searchLower)) ||
        (cab.model && cab.model.toLowerCase().includes(searchLower))
      );
    }

    return result;
  };

  const getFilteredOwners = () => {
    let result = drivers;

    // Default: only owners with active shifts. Show Inactive: owners with any shifts + all drivers
    if (!showInactiveCabs) {
      result = result.filter(driver => ownerIdsWithActiveShifts.has(driver.id));
    }

    if (ownerSearchText) {
      const searchLower = ownerSearchText.toLowerCase();
      result = result.filter(driver =>
        (driver.firstName && driver.firstName.toLowerCase().includes(searchLower)) ||
        (driver.lastName && driver.lastName.toLowerCase().includes(searchLower)) ||
        (driver.driverNumber && driver.driverNumber.toLowerCase().includes(searchLower)) ||
        (driver.firstName && driver.lastName &&
          `${driver.firstName} ${driver.lastName}`.toLowerCase().includes(searchLower))
      );
    }

    // Sort by first name
    result.sort((a, b) => {
      const nameA = (a.firstName || "").toLowerCase();
      const nameB = (b.firstName || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return result;
  };

  const filteredCabs = getFilteredCabs();
  const filteredOwners = getFilteredOwners();

  const handleOpenCreateDialog = () => {
    setCreateFormData({
      cabId: selectedCab?.id || "",
      shiftType: "DAY",
      startTime: "06:00",
      endTime: "18:00",
      ownerId: "",
      acquisitionType: "INITIAL_ASSIGNMENT",
      acquisitionPrice: "",
      notes: "",
      cabType: "",
      shareType: "",
      hasAirportLicense: false,
      airportLicenseNumber: "",
      airportLicenseExpiry: "",
      createdDate: new Date().toISOString().split("T")[0],
    });
    setError("");
    setSuccess("");
    setOpenCreateDialog(true);
  };

  const handleShiftTypeChange = (newShiftType) => {
    const defaults = {
      DAY: { startTime: "06:00", endTime: "18:00" },
      NIGHT: { startTime: "18:00", endTime: "06:00" },
    };
    
    setCreateFormData({
      ...createFormData,
      shiftType: newShiftType,
      startTime: defaults[newShiftType].startTime,
      endTime: defaults[newShiftType].endTime,
    });
  };

  const handleCreateShift = async () => {
    try {
      // Validate: Owner is required
      if (!createFormData.ownerId) {
        setError("Owner is required. Please select an owner for this shift.");
        return;
      }

      // Validate: Check if shift type already exists for this cab
      const existingShifts = allShiftsData.filter(s => s.cabId === selectedCab?.id);
      const existingTypes = existingShifts.map(s => s.shiftType);

      if (existingTypes.includes(createFormData.shiftType)) {
        setError(`A ${createFormData.shiftType} shift already exists for this cab. Cannot create duplicate shift types.`);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/shifts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
        body: JSON.stringify({
          ...createFormData,
          acquisitionPrice: createFormData.acquisitionPrice ? parseFloat(createFormData.acquisitionPrice) : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message || "Shift created successfully");
        setOpenCreateDialog(false);
        loadAllShiftsStats();
        if (selectedCab) {
          loadShiftsForCab(selectedCab.id);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create shift");
      }
    } catch (err) {
      console.error("Error creating shift:", err);
      setError("Failed to create shift");
    }
  };

  const handleOpenTransferDialog = (shift) => {
    setSelectedShift(shift);
    setTransferFormData({
      newOwnerId: "",
      transferDate: new Date().toISOString().split('T')[0],
      acquisitionType: "PURCHASE",
      salePrice: "",
      acquisitionPrice: "",
      notes: "",
    });
    setError("");
    setSuccess("");
    setOpenTransferDialog(true);
  };

  const handleTransferOwnership = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/shifts/${selectedShift.id}/transfer`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
        body: JSON.stringify({
          ...transferFormData,
          salePrice: transferFormData.salePrice ? parseFloat(transferFormData.salePrice) : null,
          acquisitionPrice: transferFormData.acquisitionPrice ? parseFloat(transferFormData.acquisitionPrice) : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message || "Ownership transferred successfully");
        setOpenTransferDialog(false);
        if (selectedCab) {
          loadShiftsForCab(selectedCab.id);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to transfer ownership");
      }
    } catch (err) {
      console.error("Error transferring ownership:", err);
      setError("Failed to transfer ownership");
    }
  };

  // ENHANCED: Beautiful history dialog with timeline
  const handleOpenHistoryDialog = async (shift) => {
    setSelectedShift(shift);
    setOpenHistoryDialog(true);
    setHistoryLoading(true);
    setHistoryError("");
    setOwnershipHistory([]);
    
    try {
      const response = await fetch(`${API_BASE_URL}/shifts/${shift.id}/ownership-history`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOwnershipHistory(data);
      } else {
        setHistoryError("Failed to load ownership history");
      }
    } catch (err) {
      console.error("Error loading history:", err);
      setHistoryError("Failed to load ownership history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCloseHistoryDialog = () => {
    setOpenHistoryDialog(false);
    setSelectedShift(null);
    setOwnershipHistory([]);
    setHistoryError("");
  };

  const handleOpenStatusDialog = (shift) => {
    setSelectedShift(shift);
    setStatusChangeFormData({
      effectiveFrom: new Date().toISOString().split("T")[0],
      reason: "",
    });
    setStatusHistory([]);
    setError("");
    setSuccess("");
    setOpenStatusDialog(true);
  };

  const handleCloseStatusDialog = () => {
    setOpenStatusDialog(false);
    setSelectedShift(null);
    setStatusHistory([]);
  };

  const handleOpenEditAttributesDialog = (shift) => {
    setSelectedShift(shift);
    setEditAttributesFormData({
      cabType: shift.cabType || "",
      shareType: shift.shareType || "",
      hasAirportLicense: shift.hasAirportLicense || false,
      airportLicenseNumber: shift.airportLicenseNumber || "",
      airportLicenseExpiry: shift.airportLicenseExpiry || "",
    });
    setError("");
    setSuccess("");
    setOpenEditAttributesDialog(true);
  };

  const handleCloseEditAttributesDialog = () => {
    setOpenEditAttributesDialog(false);
    setSelectedShift(null);
    setEditAttributesFormData({
      cabType: "",
      shareType: "",
      hasAirportLicense: false,
      airportLicenseNumber: "",
      airportLicenseExpiry: "",
    });
  };

  const handleOpenProfileAssignmentDialog = (shift) => {
    setSelectedShift(shift);
    setProfileAssignmentFormData({
      profileId: "",
      startDate: new Date().toISOString().split("T")[0],
      reason: "",
    });
    setError("");
    setSuccess("");
    setOpenProfileAssignmentDialog(true);
  };

  const handleCloseProfileAssignmentDialog = () => {
    setOpenProfileAssignmentDialog(false);
    setSelectedShift(null);
    setProfileAssignmentFormData({
      profileId: "",
      startDate: new Date().toISOString().split("T")[0],
      reason: "",
    });
  };

  const handleOpenProfileHistoryDialog = async (shift) => {
    setSelectedShift(shift);
    setProfileAssignmentHistory([]);
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/shift-profiles/assignments/${shift.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProfileAssignmentHistory(data);
        setOpenProfileHistoryDialog(true);
      } else {
        setHistoryError("Failed to load profile assignment history");
      }
    } catch (err) {
      console.error("Error loading profile history:", err);
      setHistoryError("Failed to load profile assignment history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCloseProfileHistoryDialog = () => {
    setOpenProfileHistoryDialog(false);
    setSelectedShift(null);
    setProfileAssignmentHistory([]);
  };

  const handleAssignProfile = async () => {
    if (!profileAssignmentFormData.profileId) {
      setError("Please select a profile");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/shift-profiles/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
        body: JSON.stringify({
          shiftId: selectedShift.id,
          profileId: profileAssignmentFormData.profileId,
          startDate: profileAssignmentFormData.startDate,
          reason: profileAssignmentFormData.reason || "Profile assignment",
        }),
      });

      if (response.ok) {
        setSuccess("Profile assigned successfully");
        handleCloseProfileAssignmentDialog();
        // Reload shifts to get updated profile info
        if (selectedCab) {
          loadShiftsForCab(selectedCab.id);
        } else if (selectedOwner) {
          loadShiftsByOwner(selectedOwner.id);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to assign profile");
      }
    } catch (err) {
      console.error("Error assigning profile:", err);
      setError("Failed to assign profile");
    }
  };

  const handleUpdateShiftAttributes = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/cab-shifts/${selectedShift.id}/attributes`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
          body: JSON.stringify({
            cabType: editAttributesFormData.cabType || null,
            shareType: editAttributesFormData.shareType || null,
            hasAirportLicense: editAttributesFormData.hasAirportLicense,
            airportLicenseNumber: editAttributesFormData.airportLicenseNumber || null,
            airportLicenseExpiry: editAttributesFormData.airportLicenseExpiry || null,
          }),
        }
      );

      if (response.ok) {
        setSuccess("Shift attributes updated successfully");
        handleCloseEditAttributesDialog();
        if (selectedCab) {
          loadShiftsForCab(selectedCab.id);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update shift attributes");
      }
    } catch (err) {
      console.error("Error updating shift attributes:", err);
      setError("Failed to update shift attributes");
    }
  };

  const handleChangeShiftStatus = async (action) => {
    try {
      const endpoint = action === "activate"
        ? `/shift-status/${selectedShift.id}/activate`
        : `/shift-status/${selectedShift.id}/deactivate`;

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
        body: JSON.stringify({
          effectiveFrom: statusChangeFormData.effectiveFrom,
          reason: statusChangeFormData.reason,
        }),
      });

      if (response.ok) {
        setSuccess(`Shift ${action === "activate" ? "activated" : "deactivated"} successfully`);
        handleCloseStatusDialog();
        if (selectedCab) {
          loadShiftsForCab(selectedCab.id);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Failed to ${action} shift`);
      }
    } catch (err) {
      console.error(`Error ${action}ing shift:`, err);
      setError(`Failed to ${action} shift`);
    }
  };

  // Helper functions for history display
  const formatCurrency = (amount) => {
    if (!amount) return "N/A";
    return `$${parseFloat(amount).toLocaleString("en-US", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Present";
    // Use PST date formatting utility
    return formatDatePST(dateString);
  };

  const getAcquisitionTypeColor = (type) => {
    const colors = {
      "INITIAL_ASSIGNMENT": "primary",
      "PURCHASE": "success",
      "TRANSFER": "info",
      "INHERITANCE": "secondary",
    };
    return colors[type] || "default";
  };

  const handleOpenShiftTypeDialog = async () => {
    if (!selectedCab) return;

    setShiftTypeChangeFormData({
      shiftType: selectedCab.cabShiftType === "SINGLE" ? "DOUBLE" : "SINGLE",
      reason: "",
    });
    setOpenShiftTypeDialog(true);

    // Load history
    try {
      const response = await fetch(`${API_BASE_URL}/cabs/${selectedCab.id}/shift-type-history`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setShiftTypeHistory(data);
      }
    } catch (err) {
      console.error("Error loading shift type history:", err);
    }
  };

  const handleChangeShiftType = async () => {
    if (!selectedCab) return;

    try {
      const response = await fetch(`${API_BASE_URL}/cabs/${selectedCab.id}/shift-type`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
        body: JSON.stringify({
          shiftType: shiftTypeChangeFormData.shiftType,
          reason: shiftTypeChangeFormData.reason,
          changedBy: "admin", // TODO: Get from auth context
        }),
      });

      if (response.ok) {
        setSuccess(`Cab shift type changed to ${shiftTypeChangeFormData.shiftType}`);
        setOpenShiftTypeDialog(false);
        loadAllShiftsStats(); // Reload data
        loadShiftsForCab(selectedCab.id);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to change shift type");
      }
    } catch (err) {
      console.error("Error changing shift type:", err);
      setError("Failed to change shift type");
    }
  };

  const getAcquisitionTypeLabel = (type) => {
    const labels = {
      "INITIAL_ASSIGNMENT": "Initial Assignment",
      "PURCHASE": "Purchase",
      "TRANSFER": "Transfer",
      "INHERITANCE": "Inheritance",
    };
    return labels[type] || type;
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months !== 1 ? "s" : ""}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      return `${years} year${years !== 1 ? "s" : ""}${remainingMonths > 0 ? `, ${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}` : ""}`;
    }
  };

  const canEdit = ["ADMIN", "MANAGER"].includes(currentUser?.role);

  if (!currentUser) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
      <GlobalNav currentUser={currentUser} title="Smart Fleets - Shift Ownership" />

      <Box sx={{ p: 3 }}>
        {success && (
          <Alert severity="success" onClose={() => setSuccess("")} sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Page Header */}
        <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#3e5244" }}>
              Shift Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View and manage cab shifts, ownership, profiles, and attributes
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={showInactiveCabs}
                onChange={(e) => setShowInactiveCabs(e.target.checked)}
              />
            }
            label={<Typography variant="body1" fontWeight={600}>Show Deactivated Cabs</Typography>}
            sx={{ mt: 0.5, border: "1px solid #e0e0e0", borderRadius: 1, px: 1.5, py: 0.25, backgroundColor: showInactiveCabs ? "#e3f2fd" : "transparent" }}
          />
        </Box>

        {/* Stats Banner */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: "Total Cabs", value: cabs.length, icon: DirectionsCar, color: "#1565c0" },
            { label: "Total Drivers / Owners", value: drivers.length, icon: Person, color: "#2e7d32" },
            { label: "Total Shifts", value: allShiftsStats.total, icon: AttachMoney, color: "#ed6c02" },
            { label: "Active Shifts", value: allShiftsStats.active, icon: AttachMoney, color: "#2e7d32" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Grid item xs={6} sm={3} key={stat.label}>
                <Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 2 }}>
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box sx={{
                        width: 40, height: 40, borderRadius: 1.5,
                        backgroundColor: `${stat.color}15`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <Icon sx={{ color: stat.color, fontSize: 22 }} />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                        <Typography variant="h5" fontWeight={700}>{stat.value}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* View Mode Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { key: "by-cab", label: "Browse by Cab", description: `${cabs.length} cabs registered`, icon: DirectionsCar, color: "#1565c0" },
            { key: "by-owner", label: "Browse by Owner", description: `${drivers.length} owner drivers`, icon: Person, color: "#2e7d32" },
          ].map((mode) => {
            const Icon = mode.icon;
            const isActive = viewMode === mode.key;
            return (
              <Grid item xs={12} sm={6} key={mode.key}>
                <Card
                  elevation={isActive ? 4 : 1}
                  sx={{
                    border: isActive ? `2px solid ${mode.color}` : "1px solid #e5e7eb",
                    borderRadius: 2,
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    "&:hover": { boxShadow: 3, borderColor: mode.color },
                  }}
                  onClick={() => {
                    if (viewMode !== mode.key) {
                      setViewMode(mode.key);
                      setShifts([]);
                      setSelectedCab(null);
                      setSelectedOwner(null);
                      setCabFilter("");
                      setOwnerFilter("");
                      setCabSearchText("");
                      setOwnerSearchText("");
                    }
                  }}
                >
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box sx={{
                        width: 44, height: 44, borderRadius: 1.5,
                        backgroundColor: `${mode.color}15`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <Icon sx={{ color: mode.color, fontSize: 24 }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ lineHeight: 1.3 }}>
                          {mode.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {mode.description}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Left Panel - Cab/Owner Selection */}
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{
              overflow: 'hidden',
              border: `2px solid ${viewMode === "by-cab" ? "#1565c0" : "#2e7d32"}`,
              borderRadius: 2,
              position: 'sticky',
              top: 16,
              maxHeight: 'calc(100vh - 32px)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Box sx={{
                px: 2, py: 1.5,
                backgroundColor: viewMode === "by-cab" ? "#1565c010" : "#2e7d3210",
                borderBottom: "1px solid #e5e7eb",
                display: "flex", alignItems: "center", gap: 1,
              }}>
                {viewMode === "by-cab"
                  ? <DirectionsCar sx={{ color: "#1565c0", fontSize: 20 }} />
                  : <Person sx={{ color: "#2e7d32", fontSize: 20 }} />
                }
                <Typography variant="subtitle1" fontWeight={600} sx={{ color: viewMode === "by-cab" ? "#1565c0" : "#2e7d32" }}>
                  {viewMode === "by-cab" ? "Select a Cab" : "Select an Owner"}
                </Typography>
              </Box>

              <Box sx={{ p: 2, overflow: 'auto', flex: 1 }}>
              {viewMode === "by-cab" ? (
                <>
                  <TextField
                    placeholder="Search cabs..."
                    value={cabSearchText}
                    onChange={(e) => setCabSearchText(e.target.value)}
                    size="small"
                    fullWidth
                    sx={{ mb: 2, flexShrink: 0 }}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
                    }}
                  />
                  
                  {filteredCabs.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 2, flexShrink: 0 }}>
                      No cabs match "{cabSearchText}"
                    </Alert>
                  ) : (
                    <>
                      {cabSearchText && (
                        <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: "block", flexShrink: 0 }}>
                          Showing {filteredCabs.length} of {cabs.length} cabs
                        </Typography>
                      )}
                      <List sx={{ 
                        overflow: 'auto',
                        flexGrow: 1,
                        '&::-webkit-scrollbar': {
                          width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                          backgroundColor: '#f1f1f1',
                          borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: '#888',
                          borderRadius: '4px',
                          '&:hover': {
                            backgroundColor: '#555',
                          },
                        },
                      }}>
                        {filteredCabs.map((cab) => (
                          <ListItem
                            key={cab.id}
                            button
                            selected={selectedCab?.id === cab.id}
                            onClick={() => loadShiftsForCab(cab.id)}
                            sx={{
                              borderRadius: 1,
                              mb: 1,
                              "&.Mui-selected": {
                                backgroundColor: "#e3f2fd",
                              },
                            }}
                          >
                            <DirectionsCar sx={{ mr: 2, color: "#1976d2" }} />
                            <ListItemText
                              primary={
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  {cab.cabNumber}
                                  {cab.status === 'INACTIVE' && cab.deactivatedDate && (
                                    <Chip
                                      label={`Deactivated ${formatDatePST(cab.deactivatedDate)}`}
                                      size="small"
                                      color="error"
                                      variant="outlined"
                                      sx={{ fontSize: "0.65rem", height: "18px" }}
                                    />
                                  )}
                                  {!cabIdsWithShifts.has(cab.id) && cab.status === 'ACTIVE' && (
                                    <Chip
                                      label="No Shifts"
                                      size="small"
                                      color="warning"
                                      variant="outlined"
                                      sx={{ fontSize: "0.65rem", height: "18px" }}
                                    />
                                  )}
                                </Box>
                              }
                              secondary={`${cab.registrationNumber} - ${cab.make} ${cab.model}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                </>
              ) : (
                <>
                  <TextField
                    placeholder="Search owners..."
                    value={ownerSearchText}
                    onChange={(e) => setOwnerSearchText(e.target.value)}
                    size="small"
                    fullWidth
                    sx={{ mb: 2, flexShrink: 0 }}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
                    }}
                  />
                  
                  {filteredOwners.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 2, flexShrink: 0 }}>
                      No owners match "{ownerSearchText}"
                    </Alert>
                  ) : (
                    <>
                      {ownerSearchText && (
                        <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: "block", flexShrink: 0 }}>
                          Showing {filteredOwners.length} of {drivers.length} owners
                        </Typography>
                      )}
                      <List sx={{ 
                        overflow: 'auto',
                        flexGrow: 1,
                        '&::-webkit-scrollbar': {
                          width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                          backgroundColor: '#f1f1f1',
                          borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: '#888',
                          borderRadius: '4px',
                          '&:hover': {
                            backgroundColor: '#555',
                          },
                        },
                      }}>
                        {filteredOwners.map((driver) => (
                          <ListItem
                            key={driver.id}
                            button
                            selected={selectedOwner?.id === driver.id}
                            onClick={() => loadShiftsByOwner(driver.id)}
                            sx={{
                              borderRadius: 1,
                              mb: 1,
                              "&.Mui-selected": {
                                backgroundColor: "#e3f2fd",
                              },
                            }}
                          >
                            <Person sx={{ mr: 2, color: "#1976d2" }} />
                            <ListItemText
                              primary={`${driver.firstName} ${driver.lastName}`}
                              secondary={driver.driverNumber}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                </>
              )}
              </Box>
            </Paper>
          </Grid>

          {/* Right Panel - Shift Details */}
          <Grid item xs={12} md={8}>
            {(selectedCab || selectedOwner) ? (
              <Paper elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 2, overflow: "hidden" }}>
                <Box sx={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  px: 3, py: 2,
                  backgroundColor: viewMode === "by-cab" ? "#1565c010" : "#2e7d3210",
                  borderBottom: "1px solid #e5e7eb",
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    {viewMode === "by-cab"
                      ? <DirectionsCar sx={{ color: "#1565c0", fontSize: 28 }} />
                      : <Person sx={{ color: "#2e7d32", fontSize: 28 }} />
                    }
                    <Box>
                      <Typography variant="h6" fontWeight={700} sx={{ color: viewMode === "by-cab" ? "#1565c0" : "#2e7d32" }}>
                        {viewMode === "by-cab"
                          ? `Cab ${selectedCab?.cabNumber}`
                          : `${selectedOwner?.firstName} ${selectedOwner?.lastName}`
                        }
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {viewMode === "by-cab"
                          ? `${selectedCab?.registrationNumber} - ${shifts.length} shift(s)`
                          : `${selectedOwner?.driverNumber} - ${shifts.length} shift(s) owned`
                        }
                      </Typography>
                      {viewMode === "by-cab" && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                          {selectedCab?.cabShiftType && (
                            <Chip
                              label={`${selectedCab.cabShiftType === "SINGLE" ? "Single" : "Double"} Shift`}
                              size="small"
                              color={selectedCab.cabShiftType === "SINGLE" ? "warning" : "primary"}
                              sx={{ fontSize: "0.7rem", height: "20px", cursor: "pointer" }}
                              onClick={handleOpenShiftTypeDialog}
                            />
                          )}
                          {selectedCab?.fleetAddedDate && (
                            <Typography variant="caption" color="text.secondary">
                              Fleet Added: {formatDatePST(selectedCab.fleetAddedDate)}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>
                  {canEdit && viewMode === "by-cab" && (() => {
                    if (shifts.length === 0) {
                      // Cab has NO shifts - show prominent message
                      return (
                        <Box>
                          <Alert severity="info" sx={{ mb: 2 }}>
                            This cab has no shifts configured. Click below to create DAY and NIGHT shifts.
                          </Alert>
                          <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            startIcon={<AddIcon />}
                            onClick={handleOpenCreateDialog}
                          >
                            Create Shifts for Cab {selectedCab?.cabNumber}
                          </Button>
                        </Box>
                      );
                    } else if (shifts.length < 2) {
                      // Cab has 1 shift - show normal create button
                      const existingShiftType = shifts[0]?.shiftType;
                      const missingShiftType = existingShiftType === "DAY" ? "Night" : "Day";
                      return (
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={handleOpenCreateDialog}
                        >
                          Create {missingShiftType} Shift
                        </Button>
                      );
                    }
                    return null; // Cab has 2 shifts already
                  })()}
                </Box>
                <Box sx={{ p: 3 }}>

                {viewMode === "by-owner" && shifts.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      label="Filter by Cab"
                      placeholder="Search cab number or registration..."
                      value={cabFilter}
                      onChange={(e) => setCabFilter(e.target.value)}
                      size="small"
                      fullWidth
                      InputProps={{
                        startAdornment: <DirectionsCar sx={{ mr: 1, color: "text.secondary" }} />,
                      }}
                    />
                    {cabFilter && (
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
                        Showing {filteredShifts.length} of {shifts.length} shifts
                      </Typography>
                    )}
                  </Box>
                )}

                {viewMode === "by-cab" && shifts.length > 1 && (
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      label="Filter by Owner"
                      placeholder="Search owner name or driver number..."
                      value={ownerFilter}
                      onChange={(e) => setOwnerFilter(e.target.value)}
                      size="small"
                      fullWidth
                      InputProps={{
                        startAdornment: <Person sx={{ mr: 1, color: "text.secondary" }} />,
                      }}
                    />
                    {ownerFilter && (
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
                        Showing {filteredShifts.length} of {shifts.length} shifts
                      </Typography>
                    )}
                  </Box>
                )}

                {shifts.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Filter by Attributes
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Cab Type</InputLabel>
                          <Select
                            value={attributeFilters.cabType}
                            label="Cab Type"
                            onChange={(e) => setAttributeFilters({ ...attributeFilters, cabType: e.target.value })}
                          >
                            <MenuItem value="ALL">All Types</MenuItem>
                            <MenuItem value="SEDAN">Sedan</MenuItem>
                            <MenuItem value="HANDICAP_VAN">Handicap Van</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Share Type</InputLabel>
                          <Select
                            value={attributeFilters.shareType}
                            label="Share Type"
                            onChange={(e) => setAttributeFilters({ ...attributeFilters, shareType: e.target.value })}
                          >
                            <MenuItem value="ALL">All Share Types</MenuItem>
                            <MenuItem value="VOTING_SHARE">Voting Share</MenuItem>
                            <MenuItem value="NON_VOTING_SHARE">Non-Voting Share</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Airport License</InputLabel>
                          <Select
                            value={attributeFilters.airportLicense}
                            label="Airport License"
                            onChange={(e) => setAttributeFilters({ ...attributeFilters, airportLicense: e.target.value })}
                          >
                            <MenuItem value="ALL">All</MenuItem>
                            <MenuItem value="YES">Has License</MenuItem>
                            <MenuItem value="NO">No License</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {filteredShifts.length === 0 ? (
                  <Alert severity="info">
                    {shifts.length === 0 
                      ? (viewMode === "by-cab" 
                          ? "No shifts created yet. Click 'Create Shift' to add DAY and NIGHT shifts."
                          : "This owner doesn't have any shifts yet.")
                      : "No shifts match your filter."
                    }
                  </Alert>
                ) : (
                  <Grid container spacing={3}>
                    {filteredShifts.map((shift) => (
                      <Grid item xs={12} key={shift.id}>
                        <Card sx={{ border: shift.isActive ? "2px solid #4caf50" : "1px solid #ddd" }}>
                          <CardContent>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                {shift.shiftType === "DAY" ? (
                                  <DayIcon sx={{ fontSize: 40, color: "#ff9800" }} />
                                ) : (
                                  <NightIcon sx={{ fontSize: 40, color: "#3f51b5" }} />
                                )}
                                <Box>
                                  <Typography variant="h6" fontWeight="bold">
                                    {shift.shiftTypeDisplay}
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    {shift.shiftHours}
                                  </Typography>
                                </Box>
                              </Box>
                              <Chip
                                label={shift.status}
                                color={shift.isActive ? "success" : "default"}
                                size="small"
                              />
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {viewMode === "by-owner" ? (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                  Cab
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <DirectionsCar />
                                  <Typography variant="body1" fontWeight="bold">
                                    {shift.cabNumber}
                                  </Typography>
                                  <Chip label={shift.cabRegistration} size="small" />
                                </Box>
                              </Box>
                            ) : (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                  Current Owner
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <Person />
                                  <Typography variant="body1" fontWeight="bold">
                                    {shift.currentOwnerName}
                                  </Typography>
                                  <Chip label={shift.currentOwnerDriverNumber} size="small" />
                                </Box>
                              </Box>
                            )}

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                Shift Attributes
                              </Typography>
                              <Grid container spacing={1}>
                                {shift.cabType && (
                                  <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">
                                      Cab Type
                                    </Typography>
                                    <Typography variant="body2">
                                      {shift.cabType === "HANDICAP_VAN" ? "Handicap Van" : "Sedan"}
                                    </Typography>
                                  </Grid>
                                )}
                                {shift.shareType && (
                                  <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">
                                      Share Type
                                    </Typography>
                                    <Typography variant="body2">
                                      {shift.shareType === "VOTING_SHARE" ? "Voting" : "Non-Voting"}
                                    </Typography>
                                  </Grid>
                                )}
                                {shift.hasAirportLicense !== undefined && (
                                  <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">
                                      Airport License
                                    </Typography>
                                    <Typography variant="body2">
                                      {shift.hasAirportLicense ? "Yes" : "No"}
                                    </Typography>
                                  </Grid>
                                )}
                                {shift.hasAirportLicense && shift.airportLicenseNumber && (
                                  <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">
                                      License #
                                    </Typography>
                                    <Typography variant="body2">
                                      {shift.airportLicenseNumber}
                                    </Typography>
                                  </Grid>
                                )}
                                {shift.hasAirportLicense && shift.airportLicenseExpiry && (
                                  <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">
                                      Expires
                                    </Typography>
                                    <Typography variant="body2">
                                      {formatDatePST(shift.airportLicenseExpiry)}
                                    </Typography>
                                  </Grid>
                                )}
                              </Grid>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                Shift Profile
                              </Typography>
                              {shift.currentProfile ? (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                  <CategoryIcon fontSize="small" />
                                  <Chip
                                    label={shift.currentProfile.profileName}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      backgroundColor: shift.currentProfile.colorCode || "#2196f3",
                                      color: "#fff",
                                      fontWeight: "bold",
                                    }}
                                  />
                                </Box>
                              ) : (
                                <Typography variant="body2" color="textSecondary">
                                  No profile assigned
                                </Typography>
                              )}
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Creation Date */}
                            {shift.createdAt && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                  Shift Created
                                </Typography>
                                <Typography variant="body2">
                                  {formatDateTimePST(shift.createdAt)}
                                </Typography>
                              </Box>
                            )}

                            <Divider sx={{ my: 2 }} />

                            {/* Custom Attributes Section */}
                            <Box sx={{ mb: 2 }}>
                              <Button
                                fullWidth
                                onClick={() => loadCustomAttributes(shift.id)}
                                size="small"
                                sx={{ mb: 1 }}
                              >
                                View Attributes & History
                              </Button>

                              {/* Active Attributes */}
                              {customAttributes.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 1 }}>
                                    Active Attributes:
                                  </Typography>
                                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                                    {customAttributes.map((attr) => (
                                      <Chip
                                        key={attr.id}
                                        label={
                                          attr.attributeValue
                                            ? `${attr.attributeCode}: ${attr.attributeValue}`
                                            : attr.attributeCode
                                        }
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                      />
                                    ))}
                                  </Box>
                                </Box>
                              )}

                              {/* Attribute History */}
                              {attributeHistory.length > 0 && attributeHistory.some(a => a.endDate) && (
                                <Box>
                                  <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 1 }}>
                                    Other Attributes ({attributeHistory.filter(a => a.endDate).length}):
                                  </Typography>
                                  <Box sx={{ maxHeight: 200, overflowY: "auto" }}>
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                                          <TableCell sx={{ py: 0.5, px: 1 }}>Attribute</TableCell>
                                          <TableCell sx={{ py: 0.5, px: 1 }}>Value</TableCell>
                                          <TableCell sx={{ py: 0.5, px: 1 }}>End Date</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {attributeHistory
                                          .filter(a => a.endDate)
                                          .slice(0, 5)
                                          .map((attr) => (
                                            <TableRow key={attr.id} sx={{ "&:hover": { backgroundColor: "#fafafa" } }}>
                                              <TableCell sx={{ py: 0.5, px: 1, fontSize: "0.75rem" }}>
                                                <Chip label={attr.attributeCode} size="small" />
                                              </TableCell>
                                              <TableCell sx={{ py: 0.5, px: 1, fontSize: "0.75rem" }}>
                                                {attr.attributeValue || "-"}
                                              </TableCell>
                                              <TableCell sx={{ py: 0.5, px: 1, fontSize: "0.75rem" }}>
                                                {attr.endDate}
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                      </TableBody>
                                    </Table>
                                  </Box>
                                </Box>
                              )}
                            </Box>

                            {canEdit && (
                              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                <Button
                                  variant="outlined"
                                  startIcon={<CategoryIcon />}
                                  onClick={() => handleOpenProfileAssignmentDialog(shift)}
                                  size="small"
                                >
                                  {shift.currentProfile ? "Change Profile" : "Assign Profile"}
                                </Button>
                                <Button
                                  variant="outlined"
                                  onClick={() => handleOpenEditAttributesDialog(shift)}
                                  size="small"
                                >
                                  Edit Attributes
                                </Button>
                                <Button
                                  variant="outlined"
                                  startIcon={<TuneIcon />}
                                  onClick={() => handleOpenManageAttributesDialog(shift)}
                                  size="small"
                                >
                                  Custom Attributes
                                </Button>
                                {!shift.isActive && (
                                  <Button
                                    variant="contained"
                                    color="success"
                                    onClick={() => handleOpenStatusDialog(shift)}
                                    size="small"
                                  >
                                    Activate
                                  </Button>
                                )}
                                {shift.isActive && (
                                  <Button
                                    variant="outlined"
                                    color="warning"
                                    onClick={() => handleOpenStatusDialog(shift)}
                                    size="small"
                                  >
                                    Deactivate
                                  </Button>
                                )}
                                <Button
                                  variant="outlined"
                                  startIcon={<TransferIcon />}
                                  onClick={() => handleOpenTransferDialog(shift)}
                                  size="small"
                                >
                                  Transfer
                                </Button>
                                <Button
                                  variant="outlined"
                                  startIcon={<HistoryIcon />}
                                  onClick={() => handleOpenHistoryDialog(shift)}
                                  size="small"
                                >
                                  History
                                </Button>
                                <Button
                                  variant="outlined"
                                  startIcon={<CategoryIcon />}
                                  onClick={() => handleOpenProfileHistoryDialog(shift)}
                                  size="small"
                                >
                                  Profile History
                                </Button>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
                </Box>
              </Paper>
            ) : (
              <Paper elevation={0} sx={{ p: 5, textAlign: "center", border: "1px solid #e5e7eb", borderRadius: 2 }}>
                {viewMode === "by-cab" ? (
                  <>
                    <DirectionsCar sx={{ fontSize: 80, color: "#ccc", mb: 2 }} />
                    <Typography variant="h6" color="textSecondary">
                      Select a cab to view its shifts
                    </Typography>
                  </>
                ) : (
                  <>
                    <Person sx={{ fontSize: 80, color: "#ccc", mb: 2 }} />
                    <Typography variant="h6" color="textSecondary">
                      Select an owner to view their shifts
                    </Typography>
                  </>
                )}
              </Paper>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* Create Shift Dialog - (keeping your existing implementation) */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Create New Shift</Typography>
            <IconButton onClick={() => setOpenCreateDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Cab"
                value={selectedCab?.cabNumber || ""}
                fullWidth
                disabled
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                options={(() => {
                  // Filter shift type options based on existing shifts for this cab
                  const existingShifts = allShiftsData.filter(s => s.cabId === selectedCab?.id);
                  const existingTypes = existingShifts.map(s => s.shiftType);
                  const allOptions = [
                    { value: "DAY", label: "Day Shift" },
                    { value: "NIGHT", label: "Night Shift" }
                  ];
                  // Only show options that don't already exist
                  return allOptions.filter(opt => !existingTypes.includes(opt.value));
                })()}
                getOptionLabel={(option) => option.label || ""}
                value={createFormData.shiftType ? { value: createFormData.shiftType, label: createFormData.shiftType === "DAY" ? "Day Shift" : "Night Shift" } : null}
                onChange={(e, newValue) => handleShiftTypeChange(newValue?.value || "")}
                renderInput={(params) => <TextField {...params} label="Shift Type" required size="small" />}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <li key={key} {...otherProps}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {option.value === "DAY" ? <DayIcon /> : <NightIcon />} {option.label}
                      </Box>
                    </li>
                  );
                }}
                size="small"
                noOptionsText="All shift types already exist for this cab"
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Start Time"
                type="time"
                value={createFormData.startTime}
                onChange={(e) => setCreateFormData({ ...createFormData, startTime: e.target.value })}
                fullWidth
                size="small"
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="End Time"
                type="time"
                value={createFormData.endTime}
                onChange={(e) => setCreateFormData({ ...createFormData, endTime: e.target.value })}
                fullWidth
                size="small"
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                options={drivers}
                getOptionLabel={(option) => `${option.driverNumber} - ${option.firstName} ${option.lastName}`}
                value={drivers.find(d => d.id === createFormData.ownerId) || null}
                onChange={(e, newValue) => setCreateFormData({ ...createFormData, ownerId: newValue?.id || "" })}
                renderInput={(params) => <TextField {...params} label="Owner" required size="small" />}
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                options={[
                  { value: "INITIAL_ASSIGNMENT", label: "Initial Assignment" },
                  { value: "PURCHASE", label: "Purchase" },
                  { value: "TRANSFER", label: "Transfer" },
                  { value: "INHERITANCE", label: "Inheritance" }
                ]}
                getOptionLabel={(option) => option.label || ""}
                value={createFormData.acquisitionType ? { value: createFormData.acquisitionType, label: createFormData.acquisitionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) } : null}
                onChange={(e, newValue) => setCreateFormData({ ...createFormData, acquisitionType: newValue?.value || "" })}
                renderInput={(params) => <TextField {...params} label="Acquisition Type" size="small" />}
                size="small"
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Creation Date"
                type="date"
                value={createFormData.createdDate || new Date().toISOString().split("T")[0]}
                onChange={(e) => setCreateFormData({ ...createFormData, createdDate: e.target.value })}
                fullWidth
                size="small"
                required
                InputLabelProps={{ shrink: true }}
                helperText="Date when shift ownership begins"
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Acquisition Price"
                type="number"
                value={createFormData.acquisitionPrice}
                onChange={(e) => setCreateFormData({ ...createFormData, acquisitionPrice: e.target.value })}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: <AttachMoney />,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Notes"
                value={createFormData.notes}
                onChange={(e) => setCreateFormData({ ...createFormData, notes: e.target.value })}
                fullWidth
                multiline
                rows={3}
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Shift Attributes
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                options={[
                  { value: "SEDAN", label: "Sedan" },
                  { value: "HANDICAP_VAN", label: "Handicap Van" }
                ]}
                getOptionLabel={(option) => option.label || ""}
                value={createFormData.cabType ? { value: createFormData.cabType, label: createFormData.cabType === "SEDAN" ? "Sedan" : "Handicap Van" } : null}
                onChange={(e, newValue) => setCreateFormData({ ...createFormData, cabType: newValue?.value || "" })}
                renderInput={(params) => <TextField {...params} label="Cab Type" size="small" />}
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                options={[
                  { value: "", label: "None" },
                  { value: "VOTING_SHARE", label: "Voting Share" },
                  { value: "NON_VOTING_SHARE", label: "Non-Voting Share" }
                ]}
                getOptionLabel={(option) => option.label || ""}
                value={createFormData.shareType ? { value: createFormData.shareType, label: createFormData.shareType === "VOTING_SHARE" ? "Voting Share" : "Non-Voting Share" } : { value: "", label: "None" }}
                onChange={(e, newValue) => setCreateFormData({ ...createFormData, shareType: newValue?.value || "" })}
                renderInput={(params) => <TextField {...params} label="Share Type" size="small" />}
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                options={[
                  { value: "NO", label: "No" },
                  { value: "YES", label: "Yes" }
                ]}
                getOptionLabel={(option) => option.label || ""}
                value={createFormData.hasAirportLicense ? { value: "YES", label: "Yes" } : { value: "NO", label: "No" }}
                onChange={(e, newValue) => setCreateFormData({ ...createFormData, hasAirportLicense: newValue?.value === "YES" })}
                renderInput={(params) => <TextField {...params} label="Airport License" size="small" />}
                size="small"
              />
            </Grid>

            {createFormData.hasAirportLicense && (
              <>
                <Grid item xs={6}>
                  <TextField
                    label="License Number"
                    value={createFormData.airportLicenseNumber || ""}
                    onChange={(e) => setCreateFormData({ ...createFormData, airportLicenseNumber: e.target.value })}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Expiry Date"
                    type="date"
                    value={createFormData.airportLicenseExpiry || ""}
                    onChange={(e) => setCreateFormData({ ...createFormData, airportLicenseExpiry: e.target.value })}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateShift} variant="contained" color="primary">
            Create Shift
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Ownership Dialog - (keeping your existing implementation) */}
      <Dialog open={openTransferDialog} onClose={() => setOpenTransferDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Transfer Shift Ownership</Typography>
            <IconButton onClick={() => setOpenTransferDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          {selectedShift && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Transferring {selectedShift.shiftTypeDisplay} from {selectedShift.currentOwnerName}
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Autocomplete
                    options={drivers.filter(d => d.id !== selectedShift.currentOwnerId).sort((a, b) => a.firstName.localeCompare(b.firstName))}
                    getOptionLabel={(option) => `${option.driverNumber} - ${option.firstName} ${option.lastName}`}
                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                    value={transferFormData.newOwnerId ? drivers.find(d => d.id === transferFormData.newOwnerId) || null : null}
                    onChange={(event, newValue) => {
                      setTransferFormData({ ...transferFormData, newOwnerId: newValue?.id || "" });
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="New Owner"
                        required
                        size="small"
                        placeholder="Click to see all owners..."
                      />
                    )}
                    fullWidth
                    size="small"
                    noOptionsText="No owners found"
                    openOnFocus
                    clearOnEscape
                    filterOptions={(options, state) => {
                      if (!state.inputValue) {
                        return options;  // Show all options when input is empty
                      }
                      const inputLower = state.inputValue.toLowerCase();
                      return options.filter(option =>
                        `${option.driverNumber} - ${option.firstName} ${option.lastName}`.toLowerCase().includes(inputLower)
                      );
                    }}
                    slotProps={{
                      listbox: {
                        sx: {
                          maxHeight: "500px",
                          overflow: "auto",
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Transfer Date"
                    type="date"
                    value={transferFormData.transferDate}
                    onChange={(e) => setTransferFormData({ ...transferFormData, transferDate: e.target.value })}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Acquisition Type</InputLabel>
                    <Select
                      value={transferFormData.acquisitionType}
                      label="Acquisition Type"
                      onChange={(e) => setTransferFormData({ ...transferFormData, acquisitionType: e.target.value })}
                    >
                      <MenuItem value="PURCHASE">Purchase</MenuItem>
                      <MenuItem value="TRANSFER">Transfer</MenuItem>
                      <MenuItem value="INHERITANCE">Inheritance</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    label="Sale Price (from current owner)"
                    type="number"
                    value={transferFormData.salePrice}
                    onChange={(e) => setTransferFormData({ ...transferFormData, salePrice: e.target.value })}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: <AttachMoney />,
                    }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    label="Acquisition Price (to new owner)"
                    type="number"
                    value={transferFormData.acquisitionPrice}
                    onChange={(e) => setTransferFormData({ ...transferFormData, acquisitionPrice: e.target.value })}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: <AttachMoney />,
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Notes"
                    value={transferFormData.notes}
                    onChange={(e) => setTransferFormData({ ...transferFormData, notes: e.target.value })}
                    fullWidth
                    multiline
                    rows={3}
                    size="small"
                  />
                </Grid>
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTransferDialog(false)}>Cancel</Button>
          <Button onClick={handleTransferOwnership} variant="contained" color="primary">
            Transfer Ownership
          </Button>
        </DialogActions>
      </Dialog>

      {/* ENHANCED: Beautiful Ownership History Dialog with Timeline */}
      <Dialog 
        open={openHistoryDialog} 
        onClose={handleCloseHistoryDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { minHeight: "400px" }
        }}
      >
        <DialogTitle sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          borderBottom: 1,
          borderColor: "divider"
        }}>
          <Box>
            <Typography variant="h6">
              Ownership History
            </Typography>
            {selectedShift && (
              <Typography variant="subtitle2" color="text.secondary">
                Cab: {selectedShift.cabNumber} • Shift: {selectedShift.shiftType}
              </Typography>
            )}
          </Box>
          <IconButton onClick={handleCloseHistoryDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ mt: 2 }}>
          {historyLoading && (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
              <CircularProgress />
            </Box>
          )}

          {historyError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {historyError}
            </Alert>
          )}

          {!historyLoading && !historyError && ownershipHistory.length === 0 && (
            <Alert severity="info">
              No ownership history found for this shift.
            </Alert>
          )}

          {!historyLoading && !historyError && ownershipHistory.length > 0 && (
            <Timeline position="right">
              {ownershipHistory.flatMap((ownership, index) => {
                const items = [];

                // Check if there's a gap before this ownership (deactivation period)
                if (index > 0) {
                  const previousOwnership = ownershipHistory[index - 1];
                  const previousEndDate = previousOwnership.endDate;
                  const currentStartDate = ownership.startDate;

                  // If previous ended and current starts on different dates, there's a gap
                  if (previousEndDate && currentStartDate) {
                    const prevEnd = new Date(previousEndDate);
                    const currStart = new Date(currentStartDate);

                    // Calculate days between (if more than 1 day gap)
                    const daysDiff = Math.floor((currStart - prevEnd) / (1000 * 60 * 60 * 24));

                    if (daysDiff > 1) {
                      // Add a gap indicator
                      items.push(
                        <TimelineItem key={`gap-${index}`}>
                          <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.3 }}>
                            <Typography variant="caption" color="error">
                              {formatDate(new Date(prevEnd.getTime() + 86400000).toISOString().split('T')[0])}
                            </Typography>
                            <Typography variant="caption" display="block">
                              to
                            </Typography>
                            <Typography variant="caption" color="error">
                              {formatDate(new Date(currStart.getTime() - 86400000).toISOString().split('T')[0])}
                            </Typography>
                          </TimelineOppositeContent>

                          <TimelineSeparator>
                            <TimelineDot color="error" variant="outlined">
                              <BlockIcon fontSize="small" />
                            </TimelineDot>
                            <TimelineConnector sx={{ bgcolor: 'error.light' }} />
                          </TimelineSeparator>

                          <TimelineContent>
                            <Alert severity="warning" sx={{ mb: 2 }}>
                              <Typography variant="body2" fontWeight="bold">
                                Cab Inactive
                              </Typography>
                              <Typography variant="caption">
                                {daysDiff - 1} days out of service
                              </Typography>
                            </Alert>
                          </TimelineContent>
                        </TimelineItem>
                      );
                    }
                  }
                }

                // Add the actual ownership item
                items.push(
                  <TimelineItem key={ownership.id}>
                  <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.3 }}>
                    <Typography variant="body2" fontWeight="bold">
                      {formatDate(ownership.startDate)}
                    </Typography>
                    <Typography variant="caption">
                      {ownership.endDate ? `to ${formatDate(ownership.endDate)}` : "Present"}
                    </Typography>
                  </TimelineOppositeContent>

                  <TimelineSeparator>
                    <TimelineDot color={ownership.isCurrent ? "success" : "grey"}>
                      {ownership.isCurrent ? <CurrentIcon /> : <PersonIcon />}
                    </TimelineDot>
                    {index < ownershipHistory.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>

                  <TimelineContent>
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        {/* Owner Info */}
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <PersonIcon color="action" fontSize="small" />
                          <Typography variant="h6">
                            {ownership.ownerName}
                          </Typography>
                          {ownership.isCurrent && (
                            <Chip 
                              label="Current Owner" 
                              color="success" 
                              size="small" 
                            />
                          )}
                        </Box>

                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Driver #: {ownership.ownerDriverNumber}
                        </Typography>

                        <Divider sx={{ my: 1.5 }} />

                        {/* Acquisition Details */}
                        <Box display="flex" flexDirection="column" gap={1}>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" color="text.secondary">
                              Acquisition Type:
                            </Typography>
                            <Chip 
                              label={getAcquisitionTypeLabel(ownership.acquisitionType)}
                              color={getAcquisitionTypeColor(ownership.acquisitionType)}
                              size="small"
                            />
                          </Box>

                          {ownership.acquisitionPrice && (
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" color="text.secondary">
                                <MoneyIcon fontSize="inherit" /> Acquisition Price:
                              </Typography>
                              <Typography variant="body2" fontWeight="medium" color="success.main">
                                {formatCurrency(ownership.acquisitionPrice)}
                              </Typography>
                            </Box>
                          )}

                          {ownership.salePrice && (
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" color="text.secondary">
                                <MoneyIcon fontSize="inherit" /> Sale Price:
                              </Typography>
                              <Typography variant="body2" fontWeight="medium" color="error.main">
                                {formatCurrency(ownership.salePrice)}
                              </Typography>
                            </Box>
                          )}

                          {ownership.transferredToName && (
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" color="text.secondary">
                                <TransferIcon fontSize="inherit" /> Transferred To:
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {ownership.transferredToName}
                              </Typography>
                            </Box>
                          )}

                          {ownership.notes && (
                            <Box mt={1}>
                              <Typography variant="caption" color="text.secondary">
                                Notes:
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                bgcolor: "grey.50", 
                                p: 1, 
                                borderRadius: 1,
                                fontStyle: "italic"
                              }}>
                                {ownership.notes}
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        {/* Duration Calculation */}
                        {ownership.endDate && (
                          <Box mt={1.5} pt={1.5} borderTop={1} borderColor="divider">
                            <Typography variant="caption" color="text.secondary">
                              Duration: {calculateDuration(ownership.startDate, ownership.endDate)}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </TimelineContent>
                </TimelineItem>
                );

                return items;
              }).flat()}
            </Timeline>
          )}
        </DialogContent>

        <DialogActions sx={{ borderTop: 1, borderColor: "divider", px: 3, py: 2 }}>
          <Button onClick={handleCloseHistoryDialog} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={openStatusDialog} onClose={handleCloseStatusDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">
              {selectedShift?.isActive ? "Deactivate" : "Activate"} Shift
            </Typography>
            <IconButton onClick={handleCloseStatusDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {selectedShift && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                {selectedShift.isActive
                  ? `You are about to deactivate the ${selectedShift.shiftTypeDisplay}`
                  : `You are about to activate the ${selectedShift.shiftTypeDisplay}`
                }
              </Alert>

              <TextField
                fullWidth
                label="Effective From"
                type="date"
                value={statusChangeFormData.effectiveFrom}
                onChange={(e) =>
                  setStatusChangeFormData({
                    ...statusChangeFormData,
                    effectiveFrom: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Reason (optional)"
                multiline
                rows={3}
                value={statusChangeFormData.reason}
                onChange={(e) =>
                  setStatusChangeFormData({
                    ...statusChangeFormData,
                    reason: e.target.value,
                  })
                }
                placeholder={
                  selectedShift.isActive
                    ? "e.g., Maintenance, Lease ended, etc."
                    : "e.g., Back from maintenance, New agreement, etc."
                }
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusDialog}>Cancel</Button>
          <Button
            onClick={() =>
              handleChangeShiftStatus(selectedShift?.isActive ? "deactivate" : "activate")
            }
            variant="contained"
            color={selectedShift?.isActive ? "warning" : "success"}
          >
            {selectedShift?.isActive ? "Deactivate" : "Activate"} Shift
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Shift Attributes Dialog */}
      <Dialog open={openEditAttributesDialog} onClose={handleCloseEditAttributesDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">
              Edit Shift Attributes
            </Typography>
            <IconButton onClick={handleCloseEditAttributesDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {selectedShift && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                {selectedShift.shiftTypeDisplay} Shift - Cab {selectedShift.cabNumber}
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Cab Type</InputLabel>
                <Select
                  value={editAttributesFormData.cabType}
                  onChange={(e) =>
                    setEditAttributesFormData({
                      ...editAttributesFormData,
                      cabType: e.target.value,
                    })
                  }
                  label="Cab Type"
                >
                  <MenuItem value="">Select Type</MenuItem>
                  <MenuItem value="SEDAN">Sedan</MenuItem>
                  <MenuItem value="HANDICAP_VAN">Handicap Van</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Share Type</InputLabel>
                <Select
                  value={editAttributesFormData.shareType}
                  onChange={(e) =>
                    setEditAttributesFormData({
                      ...editAttributesFormData,
                      shareType: e.target.value,
                    })
                  }
                  label="Share Type"
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="VOTING_SHARE">Voting Share</MenuItem>
                  <MenuItem value="NON_VOTING_SHARE">Non-Voting Share</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Airport License</InputLabel>
                <Select
                  value={editAttributesFormData.hasAirportLicense ? "YES" : "NO"}
                  onChange={(e) =>
                    setEditAttributesFormData({
                      ...editAttributesFormData,
                      hasAirportLicense: e.target.value === "YES",
                    })
                  }
                  label="Airport License"
                >
                  <MenuItem value="NO">No</MenuItem>
                  <MenuItem value="YES">Yes</MenuItem>
                </Select>
              </FormControl>

              {editAttributesFormData.hasAirportLicense && (
                <>
                  <TextField
                    fullWidth
                    label="License Number"
                    value={editAttributesFormData.airportLicenseNumber}
                    onChange={(e) =>
                      setEditAttributesFormData({
                        ...editAttributesFormData,
                        airportLicenseNumber: e.target.value,
                      })
                    }
                    placeholder="e.g., ALT-123456"
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Expiry Date"
                    type="date"
                    value={editAttributesFormData.airportLicenseExpiry}
                    onChange={(e) =>
                      setEditAttributesFormData({
                        ...editAttributesFormData,
                        airportLicenseExpiry: e.target.value,
                      })
                    }
                    InputLabelProps={{ shrink: true }}
                    sx={{ mb: 2 }}
                  />
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditAttributesDialog}>Cancel</Button>
          <Button
            onClick={handleUpdateShiftAttributes}
            variant="contained"
            color="primary"
          >
            Update Attributes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Profile History Dialog */}
      <Dialog open={openProfileHistoryDialog} onClose={handleCloseProfileHistoryDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">
              Profile Assignment History - {selectedShift?.shiftTypeDisplay}
            </Typography>
            <IconButton onClick={handleCloseProfileHistoryDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {historyLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress />
            </Box>
          )}

          {historyError && <Alert severity="error" sx={{ mb: 2 }}>{historyError}</Alert>}

          {!historyLoading && profileAssignmentHistory.length === 0 && (
            <Alert severity="info">No profile assignment history</Alert>
          )}

          {!historyLoading && profileAssignmentHistory.length > 0 && (
            <Timeline>
              {profileAssignmentHistory.map((assignment, index) => (
                <TimelineItem key={assignment.id}>
                  <TimelineOppositeContent color="textSecondary" sx={{ maxWidth: "30%" }}>
                    <Typography variant="body2" fontWeight="bold">
                      {formatDatePST(assignment.startDate)}
                    </Typography>
                    {assignment.endDate ? (
                      <Typography variant="caption">
                        to {formatDatePST(assignment.endDate)}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="success.main">
                        to present
                      </Typography>
                    )}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot
                      sx={{
                        bgcolor: assignment.isActive ? "#4caf50" : "#999",
                      }}
                    >
                      {assignment.isActive && <CurrentIcon fontSize="small" />}
                    </TimelineDot>
                    {index < profileAssignmentHistory.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Card sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                          <CategoryIcon fontSize="small" />
                          <Typography variant="h6" sx={{ mb: 0 }}>
                            {assignment.profileName}
                          </Typography>
                          {assignment.isActive && (
                            <Chip label="Current" size="small" color="success" />
                          )}
                        </Box>

                        <Box sx={{ mb: 1 }}>
                          <Typography variant="caption" color="textSecondary">
                            Profile Code
                          </Typography>
                          <Typography variant="body2">
                            {assignment.profileCode}
                          </Typography>
                        </Box>

                        {assignment.reason && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="caption" color="textSecondary">
                              Reason
                            </Typography>
                            <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                              {assignment.reason}
                            </Typography>
                          </Box>
                        )}

                        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: 1, borderColor: "divider" }}>
                          <Typography variant="caption" color="textSecondary">
                            Assigned by: {assignment.assignedBy}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ display: "block" }}>
                            on {formatDatePST(assignment.createdAt)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          )}
        </DialogContent>

        <DialogActions sx={{ borderTop: 1, borderColor: "divider", px: 3, py: 2 }}>
          <Button onClick={handleCloseProfileHistoryDialog} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Profile Assignment Dialog */}
      <Dialog open={openProfileAssignmentDialog} onClose={handleCloseProfileAssignmentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">
              {selectedShift?.currentProfile ? "Change" : "Assign"} Shift Profile
            </Typography>
            <IconButton onClick={handleCloseProfileAssignmentDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {selectedShift && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Assign a profile bundle to this shift. The profile will be active starting from the selected date.
              </Alert>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Shift Profile</InputLabel>
                <Select
                  value={profileAssignmentFormData.profileId}
                  label="Shift Profile"
                  onChange={(e) =>
                    setProfileAssignmentFormData({
                      ...profileAssignmentFormData,
                      profileId: e.target.value,
                    })
                  }
                >
                  <MenuItem value="">Select a profile...</MenuItem>
                  {shiftProfiles.map((profile) => (
                    <MenuItem key={profile.id} value={profile.id}>
                      {profile.profileName} ({profile.profileCode})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={profileAssignmentFormData.startDate}
                onChange={(e) =>
                  setProfileAssignmentFormData({
                    ...profileAssignmentFormData,
                    startDate: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Reason (optional)"
                multiline
                rows={3}
                value={profileAssignmentFormData.reason}
                onChange={(e) =>
                  setProfileAssignmentFormData({
                    ...profileAssignmentFormData,
                    reason: e.target.value,
                  })
                }
                placeholder="e.g., Customer request, Operational change, etc."
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProfileAssignmentDialog}>Cancel</Button>
          <Button
            onClick={handleAssignProfile}
            variant="contained"
            color="primary"
          >
            Assign Profile
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Custom Attributes Dialog */}
      <Dialog open={openManageAttributesDialog} onClose={() => setOpenManageAttributesDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">
              Custom Attributes — {managingAttributesForShift && `Cab ${managingAttributesForShift.cabNumber} ${managingAttributesForShift.shiftTypeDisplay}`}
            </Typography>
            <IconButton onClick={() => setOpenManageAttributesDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {attributeDialogLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Active Attributes Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                  Active Attributes
                </Typography>
                {currentAttributes.length === 0 ? (
                  <Alert severity="info">No custom attributes assigned</Alert>
                ) : (
                  <TableContainer sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                          <TableCell>Code</TableCell>
                          <TableCell>Value</TableCell>
                          <TableCell>Start Date</TableCell>
                          <TableCell align="right">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {currentAttributes.map((attr) => (
                          <TableRow key={attr.id}>
                            <TableCell>
                              <Chip label={attr.attributeCode} size="small" />
                            </TableCell>
                            <TableCell>{attr.attributeValue || "-"}</TableCell>
                            <TableCell>{attr.startDate}</TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleEndAttribute(attr.id)}
                                disabled={attributeDialogLoading}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Add New Attribute Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                  Add New Attribute
                </Typography>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Attribute Type</InputLabel>
                  <Select
                    value={addAttributeForm.attributeTypeId}
                    label="Attribute Type"
                    onChange={(e) =>
                      setAddAttributeForm({
                        ...addAttributeForm,
                        attributeTypeId: e.target.value,
                      })
                    }
                  >
                    <MenuItem value="">Select an attribute type...</MenuItem>
                    {allAttributeTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.attributeName} ({type.attributeCode})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {addAttributeForm.attributeTypeId &&
                  allAttributeTypes.find(t => t.id.toString() === addAttributeForm.attributeTypeId)?.requiresValue && (
                  <TextField
                    fullWidth
                    label="Value"
                    value={addAttributeForm.attributeValue}
                    onChange={(e) =>
                      setAddAttributeForm({
                        ...addAttributeForm,
                        attributeValue: e.target.value,
                      })
                    }
                    sx={{ mb: 2 }}
                  />
                )}

                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={addAttributeForm.startDate}
                  onChange={(e) =>
                    setAddAttributeForm({
                      ...addAttributeForm,
                      startDate: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="End Date (optional)"
                  type="date"
                  value={addAttributeForm.endDate}
                  onChange={(e) =>
                    setAddAttributeForm({
                      ...addAttributeForm,
                      endDate: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Notes (optional)"
                  multiline
                  rows={2}
                  value={addAttributeForm.notes}
                  onChange={(e) =>
                    setAddAttributeForm({
                      ...addAttributeForm,
                      notes: e.target.value,
                    })
                  }
                  placeholder="e.g., Special conditions or context"
                  sx={{ mb: 2 }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleAddAttribute}
                  disabled={attributeDialogLoading || !addAttributeForm.attributeTypeId}
                >
                  Add Attribute
                </Button>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Attribute History Section */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                  Attribute History
                </Typography>
                {attributeHistoryAll.length === 0 ? (
                  <Alert severity="info">No attribute history</Alert>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                          <TableCell>Attribute</TableCell>
                          <TableCell>Value</TableCell>
                          <TableCell>Start Date</TableCell>
                          <TableCell>End Date</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {attributeHistoryAll.map((attr) => (
                          <TableRow key={attr.id}>
                            <TableCell>
                              <Chip label={attr.attributeCode} size="small" />
                            </TableCell>
                            <TableCell>{attr.attributeValue || "-"}</TableCell>
                            <TableCell>{attr.startDate}</TableCell>
                            <TableCell>{attr.endDate || "-"}</TableCell>
                            <TableCell>
                              {!attr.endDate ? (
                                <Chip label="Active" color="success" size="small" />
                              ) : (
                                <Chip label="Ended" size="small" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: 1, borderColor: "divider", px: 3, py: 2 }}>
          <Button onClick={() => setOpenManageAttributesDialog(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Shift Type Change Dialog */}
      <Dialog open={openShiftTypeDialog} onClose={() => setOpenShiftTypeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Change Cab Shift Type</Typography>
            <IconButton onClick={() => setOpenShiftTypeDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              <strong>Current:</strong> {selectedCab?.cabShiftType === "SINGLE" ? "Single Shift (DAY only)" : "Double Shift (DAY + NIGHT)"}
            </Typography>
            <Typography variant="body2">
              <strong>Change to:</strong> {shiftTypeChangeFormData.shiftType === "SINGLE" ? "Single Shift (DAY only)" : "Double Shift (DAY + NIGHT)"}
            </Typography>
          </Alert>

          {shiftTypeChangeFormData.shiftType === "SINGLE" && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              To change to SINGLE shift, you must first deactivate the NIGHT shift if it exists. Only DAY shift is allowed for single-shift cabs.
            </Alert>
          )}

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>New Shift Type</InputLabel>
            <Select
              value={shiftTypeChangeFormData.shiftType}
              label="New Shift Type"
              onChange={(e) => setShiftTypeChangeFormData({ ...shiftTypeChangeFormData, shiftType: e.target.value })}
            >
              <MenuItem value="SINGLE">Single Shift (DAY only)</MenuItem>
              <MenuItem value="DOUBLE">Double Shift (DAY + NIGHT)</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Reason for Change"
            value={shiftTypeChangeFormData.reason}
            onChange={(e) => setShiftTypeChangeFormData({ ...shiftTypeChangeFormData, reason: e.target.value })}
            fullWidth
            multiline
            rows={3}
            size="small"
            helperText="Optional: Explain why you're changing the shift type"
          />

          {shiftTypeHistory.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Change History
              </Typography>
              <Timeline>
                {shiftTypeHistory.map((record, index) => (
                  <TimelineItem key={record.id}>
                    <TimelineSeparator>
                      <TimelineDot color="primary" />
                      {index < shiftTypeHistory.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="body2" fontWeight="bold">
                        {record.oldShiftType || "Initial"} → {record.newShiftType}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(record.changedAt).toLocaleString()}
                      </Typography>
                      {record.reason && (
                        <Typography variant="caption" display="block">
                          {record.reason}
                        </Typography>
                      )}
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenShiftTypeDialog(false)}>Cancel</Button>
          <Button onClick={handleChangeShiftType} variant="contained" color="primary">
            Change Shift Type
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}