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

  const loadData = async () => {
    await Promise.all([loadCabs(), loadDrivers(), loadShiftProfiles()]);
    setLoading(false);
  };

  const loadCabs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cabs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
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

  const getFilteredCabs = () => {
    if (!cabSearchText) return cabs;
    
    const searchLower = cabSearchText.toLowerCase();
    return cabs.filter(cab =>
      (cab.cabNumber && cab.cabNumber.toLowerCase().includes(searchLower)) ||
      (cab.registrationNumber && cab.registrationNumber.toLowerCase().includes(searchLower)) ||
      (cab.make && cab.make.toLowerCase().includes(searchLower)) ||
      (cab.model && cab.model.toLowerCase().includes(searchLower))
    );
  };

  const getFilteredOwners = () => {
    if (!ownerSearchText) return drivers;
    
    const searchLower = ownerSearchText.toLowerCase();
    return drivers.filter(driver =>
      (driver.firstName && driver.firstName.toLowerCase().includes(searchLower)) ||
      (driver.lastName && driver.lastName.toLowerCase().includes(searchLower)) ||
      (driver.driverNumber && driver.driverNumber.toLowerCase().includes(searchLower)) ||
      (driver.firstName && driver.lastName && 
        `${driver.firstName} ${driver.lastName}`.toLowerCase().includes(searchLower))
    );
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
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    });
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

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Cabs
                </Typography>
                <Typography variant="h4">{cabs.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Shifts
                </Typography>
                <Typography variant="h4">{shifts.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Owner Drivers
                </Typography>
                <Typography variant="h4">{drivers.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Shifts
                </Typography>
                <Typography variant="h4" color="success.main">
                  {shifts.filter(s => s.isActive).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Left Panel - Cab/Owner Selection */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ 
              p: 2,
              position: 'sticky',
              top: 16,
              maxHeight: 'calc(100vh - 32px)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Tabs
                value={viewMode === "by-cab" ? 0 : 1}
                onChange={(e, newValue) => {
                  if (newValue === 0) {
                    setViewMode("by-cab");
                    setShifts([]);
                    setSelectedCab(null);
                    setSelectedOwner(null);
                    setCabFilter("");
                    setOwnerFilter("");
                    setCabSearchText("");
                    setOwnerSearchText("");
                  } else {
                    setViewMode("by-owner");
                    setShifts([]);
                    setSelectedCab(null);
                    setSelectedOwner(null);
                    setCabFilter("");
                    setOwnerFilter("");
                    setCabSearchText("");
                    setOwnerSearchText("");
                  }
                }}
                sx={{ borderBottom: 1, borderColor: "divider", mb: 2, flexShrink: 0 }}
              >
                <Tab label="By Cab" />
                <Tab label="By Owner" />
              </Tabs>

              {viewMode === "by-cab" ? (
                <>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", flexShrink: 0 }}>
                    Select Cab
                  </Typography>
                  
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
                              primary={cab.cabNumber}
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
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", flexShrink: 0 }}>
                    Select Owner
                  </Typography>
                  
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
            </Paper>
          </Grid>

          {/* Right Panel - Shift Details */}
          <Grid item xs={12} md={8}>
            {(selectedCab || selectedOwner) ? (
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {viewMode === "by-cab" 
                        ? `${selectedCab?.cabNumber} - Shifts`
                        : `${selectedOwner?.firstName} ${selectedOwner?.lastName}'s Shifts`
                      }
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {viewMode === "by-cab"
                        ? `${selectedCab?.registrationNumber}`
                        : `${selectedOwner?.driverNumber} - ${shifts.length} shift(s) owned`
                      }
                    </Typography>
                  </Box>
                  {canEdit && viewMode === "by-cab" && shifts.length < 2 && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleOpenCreateDialog}
                    >
                      Create Shift
                    </Button>
                  )}
                </Box>

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
                                      {new Date(shift.airportLicenseExpiry).toLocaleDateString()}
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
              </Paper>
            ) : (
              <Paper sx={{ p: 5, textAlign: "center" }}>
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
              <FormControl fullWidth size="small" required>
                <InputLabel>Shift Type</InputLabel>
                <Select
                  value={createFormData.shiftType}
                  label="Shift Type"
                  onChange={(e) => handleShiftTypeChange(e.target.value)}
                >
                  <MenuItem value="DAY">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <DayIcon /> Day Shift
                    </Box>
                  </MenuItem>
                  <MenuItem value="NIGHT">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <NightIcon /> Night Shift
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
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
              <FormControl fullWidth size="small" required>
                <InputLabel>Owner</InputLabel>
                <Select
                  value={createFormData.ownerId}
                  label="Owner"
                  onChange={(e) => setCreateFormData({ ...createFormData, ownerId: e.target.value })}
                >
                  {drivers.map((driver) => (
                    <MenuItem key={driver.id} value={driver.id}>
                      {driver.driverNumber} - {driver.firstName} {driver.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Acquisition Type</InputLabel>
                <Select
                  value={createFormData.acquisitionType}
                  label="Acquisition Type"
                  onChange={(e) => setCreateFormData({ ...createFormData, acquisitionType: e.target.value })}
                >
                  <MenuItem value="INITIAL_ASSIGNMENT">Initial Assignment</MenuItem>
                  <MenuItem value="PURCHASE">Purchase</MenuItem>
                  <MenuItem value="TRANSFER">Transfer</MenuItem>
                  <MenuItem value="INHERITANCE">Inheritance</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
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
              <FormControl fullWidth size="small">
                <InputLabel>Cab Type</InputLabel>
                <Select
                  value={createFormData.cabType || ""}
                  label="Cab Type"
                  onChange={(e) => setCreateFormData({ ...createFormData, cabType: e.target.value })}
                >
                  <MenuItem value="">Select Type</MenuItem>
                  <MenuItem value="SEDAN">Sedan</MenuItem>
                  <MenuItem value="HANDICAP_VAN">Handicap Van</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Share Type</InputLabel>
                <Select
                  value={createFormData.shareType || ""}
                  label="Share Type"
                  onChange={(e) => setCreateFormData({ ...createFormData, shareType: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="VOTING_SHARE">Voting Share</MenuItem>
                  <MenuItem value="NON_VOTING_SHARE">Non-Voting Share</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Airport License</InputLabel>
                <Select
                  value={createFormData.hasAirportLicense ? "YES" : "NO"}
                  label="Airport License"
                  onChange={(e) => setCreateFormData({ ...createFormData, hasAirportLicense: e.target.value === "YES" })}
                >
                  <MenuItem value="NO">No</MenuItem>
                  <MenuItem value="YES">Yes</MenuItem>
                </Select>
              </FormControl>
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
              {ownershipHistory.map((ownership, index) => (
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
              ))}
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
                      {new Date(assignment.startDate).toLocaleDateString()}
                    </Typography>
                    {assignment.endDate && (
                      <Typography variant="caption">
                        to {new Date(assignment.endDate).toLocaleDateString()}
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
                            on {new Date(assignment.createdAt).toLocaleDateString()}
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
    </Box>
  );
}