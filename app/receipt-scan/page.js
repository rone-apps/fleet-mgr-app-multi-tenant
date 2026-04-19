"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Button, Card, CardContent, CircularProgress, Container, Dialog,
  DialogActions, DialogContent, DialogTitle, Grid, Paper, Step, StepLabel,
  Stepper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography, Alert, Select, MenuItem, FormControl, InputLabel,
  Snackbar, Alert as SnackAlert, AppBar, Toolbar, IconButton, Chip,
  Autocomplete, Checkbox,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon, PhotoCamera as PhotoCameraIcon,
  Check as CheckIcon, Edit as EditIcon, Replay as ReplayIcon,
  ArrowBack as ArrowBackIcon, Logout as LogoutIcon, Person as PersonIcon,
  CommuteOutlined, AutoAwesome, Business,
} from "@mui/icons-material";
import GlobalNav from "../components/GlobalNav";
import { tenantFetch, getCurrentUser, getTenantName, logout, isAuthenticated } from "../lib/api";

export default function ReceiptScanPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tenantName, setTenantName] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const checkAuth = () => {
      if (!isAuthenticated()) {
        router.push("/");
        return;
      }
      setUser(getCurrentUser());
      setTenantName(getTenantName());
    };
    checkAuth();
  }, [router]);

  const handleLogout = () => {
    setLogoutDialogOpen(true);
  };

  const handleConfirmLogout = () => {
    setLogoutDialogOpen(false);
    logout();
  };

  const handleUnlockScanReceipts = () => {
    if (password === "Scan-It") {
      setUnlocked(true);
      setPasswordError("");
    } else {
      setPasswordError("Incorrect password");
    }
  };

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  // Step 1 - Capture
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Step 2 - AI Processing
  const [receiptData, setReceiptData] = useState(null);

  // Step 3 - Review & Confirm
  const [formData, setFormData] = useState({
    receiptId: null,
    documentType: "OTHER",
    vendorName: "",
    receiptDate: "",
    taxAmount: 0,
    totalAmount: 0,
    lineItems: [],
    notes: "",
    cabId: null,
    ownerId: null,
    accountCustomerId: null,
    shiftType: null,
  });

  // Cabs and Owners/Drivers
  const [cabs, setCabs] = useState([]);
  const [owners, setOwners] = useState([]);
  const [accountCustomers, setAccountCustomers] = useState([]);
  const [cabsLoading, setCabsLoading] = useState(false);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [accountCustomersLoading, setAccountCustomersLoading] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  // Receipt History & Filters
  const [receipts, setReceipts] = useState([]);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    cabId: "",
    shiftId: "",
    ownerId: "",
    vendorName: "",
    documentType: "",
  });
  const [showHistory, setShowHistory] = useState(false);

  // Image viewer
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedReceiptImage, setSelectedReceiptImage] = useState(null);

  // Inline editing
  const [selectedReceipts, setSelectedReceipts] = useState(new Set());
  const [editingRows, setEditingRows] = useState(new Set());
  const [rowEditData, setRowEditData] = useState({});
  const [savingRows, setSavingRows] = useState(new Set());

  const handleOpenImage = (receipt) => {
    console.log("📸 Opening image for receipt:", receipt.id);
    setSelectedReceiptImage(receipt);
    setImageViewerOpen(true);
  };

  const handleCloseImageViewer = () => {
    console.log("❌ Closing image viewer");
    setImageViewerOpen(false);
    setSelectedReceiptImage(null);
  };

  // Fetch receipts on component mount, when filters change, or when history view is toggled
  useEffect(() => {
    if (showHistory) {
      console.log("📜 History view toggled ON - fetching receipts with driver filter");
      fetchReceipts();
    }
  }, [showHistory]);

  const fetchReceipts = async () => {
    console.log("🔍 Fetching receipts with filters:", filters);
    setReceiptsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.cabId) params.append("cabId", filters.cabId);
      if (filters.shiftId) params.append("shiftId", filters.shiftId);
      if (filters.ownerId) params.append("ownerId", filters.ownerId);
      if (filters.vendorName) params.append("vendorName", filters.vendorName);
      if (filters.documentType) params.append("documentType", filters.documentType);

      // If user is a driver, only show their receipts (use driverId, not userId)
      if (user?.role === "DRIVER") {
        const driverId = user?.driverId || user?.userId;
        if (driverId) {
          params.append("ownerId", driverId);
          console.log("🚗 Driver filter applied - ownerId:", driverId);
        }
      }

      const url = `/api/receipts?${params.toString()}`;
      console.log("🌐 Request URL:", url);
      const response = await tenantFetch(url);

      console.log("📨 Receipts response:", { status: response.status });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Receipts fetched:", {
          count: data.content?.length || 0,
          totalElements: data.totalElements,
          totalPages: data.totalPages,
        });
        setReceipts(data.content || []);
      } else {
        console.error("❌ Failed to fetch receipts:", response.status);
      }
    } catch (err) {
      console.error("❌ Error fetching receipts:", err);
    } finally {
      setReceiptsLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    fetchReceipts();
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      cabId: "",
      shiftId: "",
      ownerId: "",
      vendorName: "",
      documentType: "",
    });
    setReceipts([]);
  };

  const handleToggleReceiptSelection = (receiptId) => {
    const newSelected = new Set(selectedReceipts);
    if (newSelected.has(receiptId)) {
      newSelected.delete(receiptId);
    } else {
      newSelected.add(receiptId);
    }
    setSelectedReceipts(newSelected);
  };

  const handleSelectAllReceipts = () => {
    if (selectedReceipts.size === receipts.length) {
      setSelectedReceipts(new Set());
    } else {
      setSelectedReceipts(new Set(receipts.map(r => r.id)));
    }
  };

  const handleBulkEditSelected = async () => {
    if (selectedReceipts.size === 0) {
      setSnackbar({ open: true, message: "Please select receipts to edit", severity: "warning" });
      return;
    }

    // Load cabs, owners, and account customers if not already loaded
    if (cabs.length === 0) await fetchCabs();
    if (owners.length === 0) await fetchOwners();
    if (accountCustomers.length === 0) await fetchAccountCustomers();

    const newEditingRows = new Set(editingRows);
    selectedReceipts.forEach(id => {
      const receipt = receipts.find(r => r.id === id);
      if (receipt) {
        newEditingRows.add(id);
        setRowEditData(prev => ({
          ...prev,
          [id]: {
            documentType: receipt.documentType || "",
            vendorName: receipt.vendorName || "",
            accountCustomerId: receipt.accountCustomerId || null,
            cabId: receipt.cab?.id || null,
            ownerId: receipt.owner?.id || null,
            shiftType: receipt.shiftType || "",
            notes: "",
          }
        }));
      }
    });
    setEditingRows(newEditingRows);
  };

  const handleBulkSaveAll = async () => {
    const editingIdsArray = Array.from(editingRows);
    if (editingIdsArray.length === 0) return;

    setSavingRows(new Set(editingIdsArray));
    let successCount = 0;
    let failCount = 0;

    try {
      for (const receiptId of editingIdsArray) {
        const receipt = receipts.find(r => r.id === receiptId);
        if (!receipt) continue;

        const editData = rowEditData[receiptId];
        const updateData = {
          receiptId,
          documentType: editData.documentType || receipt.documentType,
          vendorName: editData.vendorName || receipt.vendorName,
          accountCustomerId: editData.accountCustomerId || receipt.accountCustomerId,
          cabId: editData.cabId || null,
          ownerId: editData.ownerId || null,
          shiftType: editData.shiftType || receipt.shiftType || null,
          notes: editData.notes ? `${receipt.notes || ""}\n[Updated] ${editData.notes} - ${user?.name || "User"}` : receipt.notes,
          receiptDate: receipt.receiptDate,
          taxAmount: receipt.taxAmount,
          totalAmount: receipt.totalAmount,
          lineItems: [],
        };

        const response = await tenantFetch("/api/receipts/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      }

      if (successCount > 0) {
        setSnackbar({
          open: true,
          message: `Updated ${successCount} receipt(s)${failCount > 0 ? `, ${failCount} failed` : ""}`,
          severity: failCount > 0 ? "warning" : "success"
        });
      }

      setEditingRows(new Set());
      setRowEditData({});
      setSelectedReceipts(new Set());
      fetchReceipts();
    } catch (err) {
      console.error("❌ Bulk save error:", err);
      setSnackbar({ open: true, message: "Error saving receipts", severity: "error" });
    } finally {
      setSavingRows(new Set());
    }
  };

  const handleStartEdit = async (receipt) => {
    // Load cabs, owners, and account customers if not already loaded
    if (cabs.length === 0) await fetchCabs();
    if (owners.length === 0) await fetchOwners();
    if (accountCustomers.length === 0) await fetchAccountCustomers();

    const newEditingRows = new Set(editingRows);
    newEditingRows.add(receipt.id);
    setEditingRows(newEditingRows);

    setRowEditData(prev => ({
      ...prev,
      [receipt.id]: {
        documentType: receipt.documentType || "",
        vendorName: receipt.vendorName || "",
        accountCustomerId: receipt.accountCustomerId || null,
        cabId: receipt.cab?.id || null,
        ownerId: receipt.owner?.id || null,
        shiftType: receipt.shiftType || "",
        notes: "",
      }
    }));
  };

  const handleCancelEdit = (receiptId) => {
    const newEditingRows = new Set(editingRows);
    newEditingRows.delete(receiptId);
    setEditingRows(newEditingRows);

    const newData = { ...rowEditData };
    delete newData[receiptId];
    setRowEditData(newData);
  };

  const handleRowEditChange = (receiptId, field, value) => {
    setRowEditData(prev => ({
      ...prev,
      [receiptId]: {
        ...prev[receiptId],
        [field]: value
      }
    }));
  };

  const handleSaveRow = async (receiptId) => {
    const receipt = receipts.find(r => r.id === receiptId);
    if (!receipt) return;

    const editData = rowEditData[receiptId];
    setSavingRows(prev => new Set([...prev, receiptId]));

    try {
      const updateData = {
        receiptId,
        documentType: editData.documentType || receipt.documentType,
        vendorName: editData.vendorName || receipt.vendorName,
        accountCustomerId: editData.accountCustomerId || receipt.accountCustomerId,
        cabId: editData.cabId || null,
        ownerId: editData.ownerId || null,
        shiftType: editData.shiftType || receipt.shiftType || null,
        notes: editData.notes ? `${receipt.notes || ""}\n[Updated] ${editData.notes} - ${user?.name || "User"}` : receipt.notes,
        receiptDate: receipt.receiptDate,
        taxAmount: receipt.taxAmount,
        totalAmount: receipt.totalAmount,
        lineItems: [],
      };

      const response = await tenantFetch("/api/receipts/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        setSnackbar({ open: true, message: "Receipt updated successfully", severity: "success" });
        handleCancelEdit(receiptId);
        fetchReceipts();
      } else {
        setSnackbar({ open: true, message: "Failed to update receipt", severity: "error" });
      }
    } catch (err) {
      console.error("❌ Save error:", err);
      setSnackbar({ open: true, message: "Error saving receipt", severity: "error" });
    } finally {
      setSavingRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(receiptId);
        return newSet;
      });
    }
  };

  const fetchCabs = async (ownerId = null) => {
    console.log("🚗 ========== FETCHCABS CALLED ==========");
    console.log("📊 ownerId parameter:", ownerId);
    setCabsLoading(true);
    try {
      let url = "/api/cabs";

      // Use the ownerId if provided, otherwise fetch all
      if (ownerId) {
        url += `?ownerId=${ownerId}`;
        console.log("🔍 Filtering by ownerId:", ownerId);
      } else {
        console.log("📋 No filter - fetching all cabs");
      }

      console.log("🌐 Making request to:", url);
      const response = await tenantFetch(url);

      console.log("📡 Response received:");
      console.log("   Status:", response.status);
      console.log("   OK:", response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log("📦 Response data:", data);

        let cabsList = Array.isArray(data) ? data : data.content || [];
        console.log("✅ Successfully fetched", cabsList.length, "cabs");

        // Sort cabs by cab number in natural (integer) order
        cabsList.sort((a, b) => {
          const numA = parseInt(a.cabNumber) || 0;
          const numB = parseInt(b.cabNumber) || 0;
          return numA - numB;
        });
        console.log("📊 Sorted cabs by number");

        if (cabsList.length === 0) {
          console.warn("⚠️ WARNING: Cab list is empty!");
        } else {
          cabsList.forEach((c, i) => {
            console.log(`   Cab ${i + 1}:`, {
              id: c.id,
              cabNumber: c.cabNumber,
              ownerDriverId: c.ownerDriver?.id,
              ownerDriverName: c.ownerDriver?.firstName + " " + c.ownerDriver?.lastName
            });
          });
        }

        setCabs(cabsList);
      } else {
        const errorText = await response.text();
        console.error("❌ Failed to fetch cabs. Status:", response.status);
        console.error("❌ Error response:", errorText);
        setCabs([]);
      }
    } catch (err) {
      console.error("❌ Exception in fetchCabs:", err);
      setCabs([]);
    } finally {
      setCabsLoading(false);
      console.log("🏁 ========== FETCHCABS COMPLETED ==========");
    }
  };

  const fetchOwners = async () => {
    console.log("👤 Fetching owners list");
    setOwnersLoading(true);
    try {
      const response = await tenantFetch("/api/drivers");
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Owners fetched:", data.length || 0);
        setOwners(Array.isArray(data) ? data : data.content || []);
      } else {
        console.error("❌ Failed to fetch owners:", response.status);
      }
    } catch (err) {
      console.error("❌ Error fetching owners:", err);
    } finally {
      setOwnersLoading(false);
    }
  };

  const fetchAccountCustomers = async () => {
    console.log("🏢 Fetching account customers list");
    setAccountCustomersLoading(true);
    try {
      const response = await tenantFetch("/api/account-customers");
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Account customers fetched:", data.length || 0);
        setAccountCustomers(Array.isArray(data) ? data : data.content || []);
      } else if (response.status === 403) {
        console.warn("⚠️ Access denied to account customers (expected for drivers)");
        setAccountCustomers([]);
      } else {
        console.error("❌ Failed to fetch account customers:", response.status);
        setAccountCustomers([]);
      }
    } catch (err) {
      console.error("❌ Error fetching account customers:", err);
      setAccountCustomers([]);
    } finally {
      setAccountCustomersLoading(false);
    }
  };

  // Load data when step changes to 2
  useEffect(() => {
    if (step === 2) {
      console.log("🎯 STEP 2 REACHED!");
      console.log("👤 User object:", user);
      console.log("🔍 User details:", {
        role: user?.role,
        id: user?.id,
        userId: user?.userId,
        driverId: user?.driverId,
        firstName: user?.firstName,
        lastName: user?.lastName
      });

      fetchOwners();
      fetchAccountCustomers();

      // For drivers, fetch their own cabs; for admins, fetch all cabs
      if (user?.role === "DRIVER") {
        // Use driverId if available, otherwise userId, otherwise id
        const driverId = user?.driverId || user?.userId || user?.id;
        console.log("🚗 DRIVER MODE - Fetching cabs for driver ID:", driverId);
        console.log("   (user.id:", user?.id, ", user.userId:", user?.userId, ", user.driverId:", user?.driverId, ")");
        if (!driverId) {
          console.error("❌ ERROR: Driver ID is missing!");
        }
        fetchCabs(driverId);
      } else {
        console.log("👨‍💼 ADMIN/MANAGER MODE - Fetching all cabs");
        fetchCabs(null);
      }
    } else {
      console.log("⏸️ Step is", step, "- not loading cabs yet");
    }
  }, [step, user?.role, user?.id, user?.driverId, user?.userId]);

  // When admin selects a driver, refetch that driver's cabs
  useEffect(() => {
    if (step === 2 && user?.role !== "DRIVER" && formData.ownerId) {
      console.log("📍 Admin selected driver, fetching their cabs:", formData.ownerId);
      fetchCabs(formData.ownerId);
    }
  }, [formData.ownerId]);

  // Pre-populate driver field when step 2 is reached
  useEffect(() => {
    if (step === 2) {
      setFormData(prev => {
        // For drivers, always use their own driver ID
        if (user?.role === "DRIVER" && !prev.ownerId) {
          // Use driverId if available, otherwise try userId
          const driverId = user?.driverId || user?.userId;
          if (driverId) {
            console.log("👤 Driver auto-populated:", user.firstName, user.lastName, "DriverID:", driverId);
            return {
              ...prev,
              ownerId: driverId
            };
          }
        }
        // For admins/managers, try to match extracted driver name from receipt
        else if (user?.role !== "DRIVER" && receiptData?.driverName && owners.length > 0 && !prev.ownerId) {
          const driverNameLower = receiptData.driverName.toLowerCase();
          const matchedOwner = owners.find((o) => {
            const fullName = `${o.firstName || ""} ${o.lastName || ""}`.toLowerCase();
            return fullName.includes(driverNameLower) || driverNameLower.includes(fullName);
          });
          if (matchedOwner) {
            console.log("👤 Auto-matched driver from receipt:", receiptData.driverName, "to ID:", matchedOwner.id);
            return {
              ...prev,
              ownerId: matchedOwner.id
            };
          }
        }
        return prev;
      });
    }
  }, [step, user?.role, user?.driverId, user?.userId, receiptData, owners]);

  // Auto-match cab number and driver name when cabs/owners are loaded
  useEffect(() => {
    if (cabs.length > 0 && owners.length > 0 && receiptData) {
      let updatedFormData = { ...formData };

      // Try to match cab number
      if (receiptData.cabNumber && !formData.cabId) {
        const matchedCab = cabs.find(
          (c) => c.cabNumber && c.cabNumber.toString() === receiptData.cabNumber.toString()
        );
        if (matchedCab) {
          console.log("🚗 Auto-matched cab:", receiptData.cabNumber, "to ID:", matchedCab.id);
          updatedFormData.cabId = matchedCab.id;
        }
      }


      // Only update if something changed
      if (updatedFormData.cabId !== formData.cabId || updatedFormData.ownerId !== formData.ownerId) {
        setFormData(updatedFormData);
      }
    }
  }, [cabs, owners, receiptData]);

  // Convert HEIC to JPEG and compress image
  const compressImage = async (file) => {
    try {
      // Check if file is HEIC format
      const isHeic = file.type.includes("heic") || file.type.includes("heif") ||
                     file.name.toLowerCase().endsWith(".heic") ||
                     file.name.toLowerCase().endsWith(".heif");

      let fileToProcess = file;

      // If HEIC, convert to JPEG first
      if (isHeic) {
        console.log("📱 HEIC format detected, converting to JPEG using heic2any...");
        try {
          const heic2any = (await import("heic2any")).default;
          const jpegBlob = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.85,
          });

          console.log("✅ HEIC conversion successful");
          console.log("📊 Converted blob size:", (jpegBlob.size / 1024 / 1024).toFixed(2), "MB");

          // Create a new File from the blob
          fileToProcess = new File([jpegBlob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), {
            type: "image/jpeg",
          });
        } catch (heicError) {
          console.error("❌ HEIC conversion failed:", heicError);
          setError("Failed to convert HEIC image. Please try a JPEG, PNG, or GIF image instead.");
          return file;
        }
      }

      // Now compress/resize the image
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(fileToProcess);
        reader.onload = (e) => {
          try {
            const img = new Image();
            img.onload = () => {
              try {
                console.log("📐 Image dimensions:", { width: img.width, height: img.height });

                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                // Limit dimensions to 1920x1440 max
                const maxWidth = 1920;
                const maxHeight = 1440;
                if (width > height) {
                  if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                  }
                } else {
                  if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                  }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");

                if (!ctx) {
                  throw new Error("Could not get canvas context");
                }

                ctx.drawImage(img, 0, 0, width, height);
                console.log("✅ Image drawn on canvas");

                // Convert to JPEG with quality 0.85
                const timeout = setTimeout(() => {
                  console.error("❌ Blob conversion timeout");
                  resolve(fileToProcess);
                }, 5000);

                canvas.toBlob(
                  (blob) => {
                    clearTimeout(timeout);

                    if (!blob) {
                      console.warn("⚠️ Blob is empty, using converted file");
                      resolve(fileToProcess);
                      return;
                    }

                    const originalSize = (fileToProcess.size / 1024 / 1024).toFixed(2);
                    const compressedSize = (blob.size / 1024 / 1024).toFixed(2);
                    const reduction = ((1 - blob.size / fileToProcess.size) * 100).toFixed(1);

                    console.log("🗜️ Image processed:", {
                      originalSize: originalSize + " MB",
                      compressedSize: compressedSize + " MB",
                      reduction: reduction + "%",
                      blobSize: blob.size,
                    });

                    resolve(new File([blob], fileToProcess.name, { type: "image/jpeg" }));
                  },
                  "image/jpeg",
                  0.85
                );
              } catch (err) {
                console.error("❌ Canvas processing error:", err);
                resolve(fileToProcess);
              }
            };

            img.onerror = () => {
              console.error("❌ Image load error");
              resolve(fileToProcess);
            };

            img.src = e.target.result;
          } catch (err) {
            console.error("❌ Image processing error:", err);
            resolve(fileToProcess);
          }
        };

        reader.onerror = () => {
          console.error("❌ FileReader error:", reader.error);
          resolve(fileToProcess);
        };
      });
    } catch (err) {
      console.error("❌ Compression error:", err);
      return file;
    }
  };

  // Handle file selection
  const handleFileSelect = async (file) => {
    if (!file) {
      console.log("❌ No file provided");
      return;
    }

    console.log("📁 File selected:", {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeInMB: (file.size / 1024 / 1024).toFixed(2),
      lastModified: new Date(file.lastModified).toISOString(),
    });

    // Check if file is HEIC format
    const isHeic = file.type.includes("heic") || file.type.includes("heif") ||
                   file.name.toLowerCase().endsWith(".heic") ||
                   file.name.toLowerCase().endsWith(".heif");

    // Compress image if it's large OR if it's HEIC format
    let fileToUse = file;
    if (file.size > 2 * 1024 * 1024 || isHeic) {
      if (isHeic) {
        console.log("📱 HEIC file detected - converting to JPEG...");
      } else {
        console.log("📦 Image is large, compressing...");
      }
      fileToUse = await compressImage(file);
    }

    // More lenient validation - just check file size
    // HEIC will be automatically converted to JPEG
    // Backend will validate the actual format
    if (fileToUse.size > 10 * 1024 * 1024) {
      console.warn("⚠️ File too large:", fileToUse.size);
      setError("Image file must be smaller than 10MB");
      return;
    }

    if (fileToUse.size === 0) {
      console.warn("⚠️ File is empty");
      setError("File is empty. Please select a valid image.");
      return;
    }

    console.log("✅ File validation passed");
    setSelectedImage(fileToUse);
    setError("");

    // Create preview
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log("📸 Preview generated");
        setImagePreview(reader.result);
      };
      reader.onerror = () => {
        console.error("❌ FileReader error:", reader.error);
        setError("Failed to read file. Please try again.");
      };
      reader.readAsDataURL(fileToUse);
    } catch (err) {
      console.error("❌ Error reading file:", err);
      setError("Error reading file: " + err.message);
    }
  };

  // Handle camera/file input change
  const handleInputChange = (e) => {
    console.log("📂 Input change event triggered");
    try {
      const file = e.target.files?.[0];
      console.log("📂 Files array:", {
        length: e.target.files?.length || 0,
        file: file ? { name: file.name, type: file.type, size: file.size } : null,
      });

      if (file) {
        handleFileSelect(file);
      } else {
        console.warn("⚠️ No file selected");
        setError("No file selected. Please try again.");
      }
      // Reset input so user can select the same file again
      e.target.value = "";
    } catch (err) {
      console.error("❌ File selection error:", err);
      setError("Error selecting file: " + err.message);
    }
  };

  // Analyze receipt with Claude
  const handleAnalyzeReceipt = async () => {
    if (!selectedImage) {
      console.warn("⚠️ No image selected");
      setError("Please select an image first");
      return;
    }

    console.log("🚀 Starting receipt analysis for:", selectedImage.name);
    setLoading(true);
    setError("");

    try {
      const formDataObj = new FormData();
      formDataObj.append("image", selectedImage);
      console.log("📦 FormData prepared with image");

      console.log("🌐 Sending to backend: POST /api/receipts/analyze");
      const response = await tenantFetch("/api/receipts/analyze", {
        method: "POST",
        body: formDataObj,
      });

      console.log("📨 Response received:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers),
      });

      if (!response.ok) {
        console.error("❌ API error:", response.status);
        const errorData = await response.json();
        console.error("Error details:", errorData);
        throw new Error(errorData.error || "Failed to analyze receipt");
      }

      const data = await response.json();
      console.log("✅ Analysis successful:", {
        receiptId: data.receiptId,
        documentType: data.documentType,
        vendorName: data.vendorName,
        totalAmount: data.totalAmount,
        lineItemsCount: data.lineItems?.length || 0,
      });

      setReceiptData(data);

      // Build notes with account number if extracted
      let notesText = "";
      if (data.accountNumber) {
        notesText = `Account #: ${data.accountNumber}`;
        console.log("💳 Account number extracted:", data.accountNumber);
      }

      setFormData({
        receiptId: data.receiptId,
        documentType: data.documentType || "OTHER",
        vendorName: data.vendorName || "",
        receiptDate: data.receiptDate || "",
        taxAmount: data.taxAmount || 0,
        totalAmount: data.totalAmount || 0,
        lineItems: data.lineItems || [],
        notes: notesText,
        cabId: null,
        ownerId: null,
      });

      setStep(2); // Move to review step
    } catch (err) {
      console.error("❌ Analysis failed:", {
        message: err.message,
        stack: err.stack,
      });
      setError(err.message || "Failed to analyze receipt. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle form field changes
  const handleFormChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // If clearing the driver/owner, also clear the cab and refetch all cabs for admins
      if (field === "ownerId" && value === null) {
        updated.cabId = null;
        // For admins, refetch all cabs when driver is cleared
        if (user?.role !== "DRIVER") {
          fetchCabs(null);
        }
      }
      return updated;
    });
  };

  // Handle line item change
  const handleLineItemChange = (index, field, value) => {
    const updatedItems = [...formData.lineItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
    handleFormChange("lineItems", updatedItems);
  };

  // Confirm and save receipt
  const handleConfirmReceipt = async () => {
    console.log("💾 Starting receipt confirmation");
    console.log("📋 Form data:", {
      receiptId: formData.receiptId,
      documentType: formData.documentType,
      vendorName: formData.vendorName,
      receiptDate: formData.receiptDate,
      totalAmount: formData.totalAmount,
      taxAmount: formData.taxAmount,
      lineItemsCount: formData.lineItems?.length || 0,
    });

    setLoading(true);
    setError("");

    try {
      console.log("🌐 Sending to backend: POST /api/receipts/confirm");
      const response = await tenantFetch("/api/receipts/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      console.log("📨 Confirm response received:", {
        status: response.status,
        statusText: response.statusText,
      });

      if (!response.ok) {
        console.error("❌ Confirm failed with status:", response.status);
        const errorData = await response.json();
        console.error("Error details:", errorData);
        throw new Error(errorData.error || "Failed to save receipt");
      }

      const responseData = await response.json();
      console.log("✅ Receipt confirmed successfully:", responseData);

      setSnackbar({
        open: true,
        message: "Receipt saved successfully!",
        severity: "success",
      });

      // Reset form
      setTimeout(() => {
        setStep(0);
        setSelectedImage(null);
        setImagePreview(null);
        setReceiptData(null);
        setFormData({
          receiptId: null,
          documentType: "OTHER",
          vendorName: "",
          receiptDate: "",
          taxAmount: 0,
          totalAmount: 0,
          lineItems: [],
          notes: "",
          cabId: null,
          ownerId: null,
          accountCustomerId: null,
          shiftType: null,
        });
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to save receipt. Please try again.");
      console.error("Confirm error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRescan = () => {
    setStep(0);
    setSelectedImage(null);
    setImagePreview(null);
    setReceiptData(null);
  };

  if (!user) {
    return null;
  }

  // Show password dialog if not unlocked
  if (!unlocked) {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Dialog open={true} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ textAlign: "center", pt: 4 }}>
            <Box sx={{ fontSize: 48, mb: 1 }}>🔒</Box>
            <Box component="span" sx={{ display: "block", typography: "h6", fontWeight: 700 }}>
              Scan Receipts
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              This is a premium feature. Please enter the access password to continue.
            </Alert>
            {passwordError && <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>}
            <TextField
              fullWidth
              size="small"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleUnlockScanReceipts(); }}
              autoFocus
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => router.push("/")}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={handleUnlockScanReceipts}
              sx={{ backgroundColor: "#ec4899", "&:hover": { backgroundColor: "#db2777" } }}
            >
              Unlock
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f6f9fc' }}>
      {/* Header AppBar */}
      <AppBar position="static" elevation={0} sx={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #635bff 0%, #7c6cff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CommuteOutlined sx={{ fontSize: 22, color: '#fff' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, color: '#1a1a2e', fontSize: '1rem' }}>
                Smart Fleets
              </Typography>
              {tenantName && (
                <Typography variant="caption" sx={{ color: '#8792a2', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem' }}>
                  <Business sx={{ fontSize: 13 }} />
                  {tenantName}
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon sx={{ color: '#697386', fontSize: 20 }} />
              <Box>
                <Typography variant="body2" sx={{ color: '#1a1a2e', fontWeight: 600, fontSize: '0.85rem' }}>
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography variant="caption" sx={{ color: '#8792a2' }}>
                  {user.role}
                </Typography>
              </Box>
            </Box>

            <IconButton
              onClick={handleLogout}
              title="Logout"
              sx={{
                color: '#697386',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                '&:hover': { color: '#e74c3c', backgroundColor: 'rgba(231,76,60,0.04)' }
              }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Breadcrumb Navigation */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            onClick={() => router.push("/")}
            sx={{
              color: '#667eea',
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.95rem',
              p: 0,
              minWidth: 'auto',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            Dashboard
          </Button>
          <Typography sx={{ color: '#999' }}>/</Typography>
          <Typography sx={{ fontWeight: 600, color: '#3e5244', fontSize: '0.95rem' }}>
            Scan Receipts
          </Typography>
        </Box>

        {/* Title & History Toggle */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#3e5244' }}>
            {showHistory ? "Receipt History" : "Receipt Scanner - AI-Powered Analysis"}
          </Typography>
          <Button
            variant={showHistory ? "contained" : "outlined"}
            onClick={() => setShowHistory(!showHistory)}
            sx={{
              backgroundColor: showHistory ? '#667eea' : 'transparent',
              color: showHistory ? '#fff' : '#667eea',
              borderColor: '#667eea',
              '&:hover': {
                backgroundColor: showHistory ? '#5568d3' : 'rgba(102, 126, 234, 0.04)'
              }
            }}
          >
            {showHistory ? "Back to Scanner" : "View History"}
          </Button>
        </Box>

        {/* Receipt History Section */}
        {showHistory ? (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#193366' }}>
                  Filter Receipts
                </Typography>
                {user?.role === "DRIVER" && (
                  <Alert severity="info" sx={{ flex: 1, ml: 2 }}>
                    You can only view and edit your own receipts
                  </Alert>
                )}
              </Box>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Start Date"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange("startDate", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="End Date"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange("endDate", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Vendor Name"
                    value={filters.vendorName}
                    onChange={(e) => handleFilterChange("vendorName", e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Cab ID"
                    type="number"
                    value={filters.cabId}
                    onChange={(e) => handleFilterChange("cabId", e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Document Type</InputLabel>
                    <Select
                      value={filters.documentType}
                      onChange={(e) => handleFilterChange("documentType", e.target.value)}
                      label="Document Type"
                    >
                      <MenuItem value="">All Types</MenuItem>
                      <MenuItem value="GAS_RECEIPT">Gas Receipt</MenuItem>
                      <MenuItem value="PARKING">Parking</MenuItem>
                      <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                      <MenuItem value="BILL">Bill</MenuItem>
                      <MenuItem value="ACCOUNT_CHARGE">Account Charge</MenuItem>
                      <MenuItem value="AIRPORT_FEE">Airport Fee</MenuItem>
                      <MenuItem value="MEAL">Meal</MenuItem>
                      <MenuItem value="OTHER">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleApplyFilters}
                  sx={{
                    backgroundColor: '#4caf50',
                    '&:hover': { backgroundColor: '#388e3c' }
                  }}
                >
                  Apply Filters
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  sx={{ color: '#667eea', borderColor: '#667eea' }}
                >
                  Clear All
                </Button>
              </Box>

              {/* Receipts Table */}
              {receiptsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : receipts.length > 0 ? (
                <TableContainer component={Paper} sx={{ mt: 3 }}>
                    {/* Show bulk edit toolbar only for non-drivers */}
                    {user?.role !== "DRIVER" && (selectedReceipts.size > 0 || editingRows.size > 0) && (
                      <Box sx={{ p: 2, backgroundColor: '#f9f9f9', borderBottom: '1px solid #eee', display: 'flex', gap: 2, alignItems: 'center' }}>
                        {selectedReceipts.size > 0 && (
                          <>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', flex: 1 }}>
                              {selectedReceipts.size} receipt(s) selected
                            </Typography>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={handleBulkEditSelected}
                              sx={{
                                backgroundColor: '#667eea',
                                '&:hover': { backgroundColor: '#5568d3' }
                              }}
                            >
                              Edit Selected
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => setSelectedReceipts(new Set())}
                              sx={{ color: '#999', borderColor: '#999' }}
                            >
                              Clear
                            </Button>
                          </>
                        )}
                        {editingRows.size > 0 && (
                          <>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', flex: 1 }}>
                              Editing {editingRows.size} row(s)
                            </Typography>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={handleBulkSaveAll}
                              disabled={savingRows.size > 0}
                              sx={{
                                backgroundColor: '#4caf50',
                                '&:hover': { backgroundColor: '#388e3c' }
                              }}
                            >
                              {savingRows.size > 0 ? "Saving..." : "Save All"}
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                setEditingRows(new Set());
                                setRowEditData({});
                              }}
                              disabled={savingRows.size > 0}
                              sx={{ color: '#999', borderColor: '#999' }}
                            >
                              Cancel All
                            </Button>
                          </>
                        )}
                      </Box>
                    )}
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                          {/* Only show checkbox for non-drivers */}
                          {user?.role !== "DRIVER" && (
                            <TableCell padding="checkbox">
                              <Checkbox
                                indeterminate={selectedReceipts.size > 0 && selectedReceipts.size < receipts.length}
                                checked={selectedReceipts.size === receipts.length && receipts.length > 0}
                                onChange={handleSelectAllReceipts}
                              />
                            </TableCell>
                          )}
                          <TableCell><strong>ID</strong></TableCell>
                        <TableCell><strong>Vendor/Account</strong></TableCell>
                        <TableCell><strong>Shift</strong></TableCell>
                        <TableCell><strong>Date</strong></TableCell>
                        <TableCell align="right"><strong>Amount</strong></TableCell>
                        <TableCell><strong>Cab</strong></TableCell>
                        <TableCell><strong>Driver</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell align="center"><strong>Image</strong></TableCell>
                        <TableCell align="center"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {receipts.map((receipt) => {
                        const isEditing = editingRows.has(receipt.id);
                        const editData = rowEditData[receipt.id] || {};
                        const isSaving = savingRows.has(receipt.id);

                        return (
                          <TableRow key={receipt.id} hover sx={{ backgroundColor: isEditing ? '#f9f9f9' : 'inherit' }}>
                            {/* Only show checkbox for non-drivers */}
                            {user?.role !== "DRIVER" && (
                              <TableCell padding="checkbox">
                                <Checkbox
                                  checked={selectedReceipts.has(receipt.id)}
                                  onChange={() => handleToggleReceiptSelection(receipt.id)}
                                  disabled={isEditing}
                                />
                              </TableCell>
                            )}
                            <TableCell>#{receipt.id}</TableCell>
                            <TableCell>
                              {isEditing ? (
                                editData.documentType === "ACCOUNT_CHARGE" ? (
                                  <Autocomplete
                                    size="small"
                                    options={accountCustomers}
                                    getOptionLabel={(option) => option.companyName || ""}
                                    value={accountCustomers.find(a => a.id === editData.accountCustomerId) || null}
                                    onChange={(e, value) => handleRowEditChange(receipt.id, "accountCustomerId", value?.id || null)}
                                    renderInput={(params) => <TextField {...params} placeholder="Account" />}
                                    sx={{ minWidth: 150 }}
                                  />
                                ) : (
                                  <TextField
                                    size="small"
                                    value={editData.vendorName || ""}
                                    onChange={(e) => handleRowEditChange(receipt.id, "vendorName", e.target.value)}
                                    placeholder="Vendor name"
                                    fullWidth
                                  />
                                )
                              ) : (
                                receipt.documentType === "ACCOUNT_CHARGE"
                                  ? receipt.accountName || "-"
                                  : receipt.vendorName || "-"
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Select
                                  size="small"
                                  value={editData.shiftType || ""}
                                  onChange={(e) => handleRowEditChange(receipt.id, "shiftType", e.target.value)}
                                  sx={{ minWidth: 100 }}
                                >
                                  <MenuItem value="">None</MenuItem>
                                  <MenuItem value="Day">Day</MenuItem>
                                  <MenuItem value="Night">Night</MenuItem>
                                  <MenuItem value="Single">Single</MenuItem>
                                </Select>
                              ) : (
                                receipt.shiftType ? (
                                  <Chip
                                    label={receipt.shiftType}
                                    size="small"
                                    variant="outlined"
                                  />
                                ) : (
                                  "-"
                                )
                              )}
                            </TableCell>
                            <TableCell>{receipt.receiptDate || "-"}</TableCell>
                            <TableCell align="right">${receipt.totalAmount || "0.00"}</TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Autocomplete
                                  size="small"
                                  options={cabs}
                                  getOptionLabel={(option) => option.cabNumber || ""}
                                  value={cabs.find(c => c.id === editData.cabId) || null}
                                  onChange={(e, value) => handleRowEditChange(receipt.id, "cabId", value?.id || null)}
                                  renderInput={(params) => <TextField {...params} placeholder="Cab" />}
                                  sx={{ minWidth: 100 }}
                                />
                              ) : (
                                receipt.cabNumber || "-"
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Autocomplete
                                  size="small"
                                  options={owners}
                                  getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                                  value={owners.find(o => o.id === editData.ownerId) || null}
                                  onChange={(e, value) => handleRowEditChange(receipt.id, "ownerId", value?.id || null)}
                                  renderInput={(params) => <TextField {...params} placeholder="Driver" />}
                                  sx={{ minWidth: 120 }}
                                />
                              ) : (
                                receipt.ownerName || "-"
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={receipt.status}
                                size="small"
                                color={receipt.status === "CONFIRMED" ? "success" : "default"}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="center">
                              {receipt.imageData ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleOpenImage(receipt)}
                                  sx={{ color: '#667eea', borderColor: '#667eea' }}
                                >
                                  View
                                </Button>
                              ) : (
                                <Typography variant="caption" sx={{ color: '#999' }}>
                                  No img
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {/* Drivers cannot edit anything */}
                              {user?.role === "DRIVER" ? (
                                <Typography variant="caption" sx={{ color: '#999' }}>
                                  View only
                                </Typography>
                              ) : isEditing ? (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => handleSaveRow(receipt.id)}
                                    disabled={isSaving}
                                    sx={{
                                      backgroundColor: '#4caf50',
                                      '&:hover': { backgroundColor: '#388e3c' }
                                    }}
                                  >
                                    {isSaving ? "..." : "Save"}
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleCancelEdit(receipt.id)}
                                    disabled={isSaving}
                                    sx={{ color: '#999', borderColor: '#999' }}
                                  >
                                    Cancel
                                  </Button>
                                </Box>
                              ) : (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleStartEdit(receipt)}
                                  sx={{
                                    color: '#667eea',
                                    borderColor: '#667eea',
                                    '&:hover': { backgroundColor: '#f0f0f0' }
                                  }}
                                >
                                  Edit
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography sx={{ mt: 3, color: '#999', textAlign: 'center' }}>
                  No receipts found. Try adjusting your filters.
                </Typography>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stepper */}
        <Stepper activeStep={step} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>Capture Receipt</StepLabel>
          </Step>
          <Step>
            <StepLabel>AI Analysis</StepLabel>
          </Step>
          <Step>
            <StepLabel>Review & Confirm</StepLabel>
          </Step>
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* STEP 1: Capture */}
        {step === 0 && (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 6 }}>
              <PhotoCameraIcon sx={{ fontSize: 64, color: "#6699cc", mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 3, color: "#193366" }}>
                Take or Upload a Receipt Photo
              </Typography>

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleInputChange}
                onError={(e) => {
                  console.error("❌ File input error event:", e);
                  setError("Error opening file picker. Please try again.");
                }}
                style={{ display: "none" }}
              />

              <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mb: 4 }}>
                <Button
                  variant="contained"
                  startIcon={<PhotoCameraIcon />}
                  onClick={() => {
                    try {
                      console.log("🖱️ File picker button clicked");
                      if (fileInputRef.current) {
                        console.log("📂 Triggering file input click");
                        fileInputRef.current.click();
                      } else {
                        console.error("❌ fileInputRef is not available");
                        setError("File picker not ready. Please refresh and try again.");
                      }
                    } catch (err) {
                      console.error("❌ Error opening file picker:", err);
                      setError("Error opening file picker: " + err.message);
                    }
                  }}
                  sx={{
                    backgroundColor: "#6699cc",
                    "&:hover": { backgroundColor: "#5588bb" },
                  }}
                >
                  Take Photo / Choose File
                </Button>
              </Box>

              {imagePreview && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, color: "#555" }}>
                    Selected Image:
                  </Typography>
                  <Box
                    component="img"
                    src={imagePreview}
                    sx={{
                      maxWidth: "100%",
                      maxHeight: 400,
                      borderRadius: 1,
                      mb: 3,
                      border: "1px solid #ddd",
                    }}
                  />

                  <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                    <Button
                      variant="outlined"
                      onClick={handleRescan}
                      startIcon={<ReplayIcon />}
                    >
                      Choose Different Image
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleAnalyzeReceipt}
                      disabled={loading}
                      sx={{
                        backgroundColor: "#4caf50",
                        "&:hover": { backgroundColor: "#388e3c" },
                      }}
                      endIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
                    >
                      {loading ? "Analyzing..." : "Analyze Receipt"}
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 2: AI Processing */}
        {step === 1 && (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 8 }}>
              <CircularProgress size={80} sx={{ color: "#6699cc", mb: 3 }} />
              <Typography variant="h6" sx={{ mb: 2, color: "#193366" }}>
                🤖 Analyzing with AI...
              </Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                Reading document type, amounts, and line items. This may take a few seconds.
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Review & Confirm */}
        {step === 2 && receiptData && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, color: "#193366", display: "flex", alignItems: "center", gap: 1 }}>
                <CheckIcon sx={{ color: "#4caf50" }} />
                Receipt Detected
              </Typography>

              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Document Type</InputLabel>
                    <Select
                      value={formData.documentType}
                      onChange={(e) => handleFormChange("documentType", e.target.value)}
                      label="Document Type"
                    >
                      <MenuItem value="GAS_RECEIPT">Gas Receipt</MenuItem>
                      <MenuItem value="PARKING">Parking</MenuItem>
                      <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                      <MenuItem value="BILL">Bill</MenuItem>
                      <MenuItem value="ACCOUNT_CHARGE">Account Charge</MenuItem>
                      <MenuItem value="AIRPORT_FEE">Airport Fee</MenuItem>
                      <MenuItem value="MEAL">Meal</MenuItem>
                      <MenuItem value="OTHER">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Shift Type</InputLabel>
                    <Select
                      value={formData.shiftType || ""}
                      onChange={(e) => handleFormChange("shiftType", e.target.value || null)}
                      label="Shift Type"
                    >
                      <MenuItem value="">
                        <em>Select shift type...</em>
                      </MenuItem>
                      <MenuItem value="DAY">Day</MenuItem>
                      <MenuItem value="NIGHT">Night</MenuItem>
                      <MenuItem value="SINGLE">Single</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {formData.documentType === "ACCOUNT_CHARGE" ? (
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      options={accountCustomers}
                      getOptionLabel={(option) => option?.companyName || ""}
                      getOptionKey={(option) => `acct-${option?.id}`}
                      value={accountCustomers.find((ac) => ac.id === formData.accountCustomerId) || null}
                      onChange={(e, newValue) => {
                        console.log("🏢 Account name selected:", newValue?.companyName);
                        handleFormChange("accountCustomerId", newValue?.id || null);
                      }}
                      loading={accountCustomersLoading}
                      noOptionsText="No accounts found"
                      loadingText="Loading accounts..."
                      openOnFocus
                      clearOnBlur
                      selectOnFocus
                      filterOptions={(options, state) => {
                        if (!state.inputValue) return options;
                        return options.filter((option) =>
                          option?.companyName?.toLowerCase().includes(state.inputValue.toLowerCase())
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Account Name"
                          placeholder="Search account..."
                        />
                      )}
                      isOptionEqualToValue={(option, value) => option?.id === value?.id}
                    />
                  </Grid>
                ) : (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Vendor Name"
                      value={formData.vendorName}
                      onChange={(e) => handleFormChange("vendorName", e.target.value)}
                    />
                  </Grid>
                )}

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Receipt Date"
                    type="date"
                    value={formData.receiptDate}
                    onChange={(e) => handleFormChange("receiptDate", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Total Amount"
                    type="number"
                    value={formData.totalAmount}
                    onChange={(e) => handleFormChange("totalAmount", parseFloat(e.target.value) || 0)}
                    inputProps={{ step: "0.01" }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tax Amount"
                    type="number"
                    value={formData.taxAmount}
                    onChange={(e) => handleFormChange("taxAmount", parseFloat(e.target.value) || 0)}
                    inputProps={{ step: "0.01" }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={cabs}
                    getOptionLabel={(option) => option?.cabNumber || ""}
                    getOptionKey={(option) => `cab-${option?.id}`}
                    value={cabs.find((c) => c.id === formData.cabId) || null}
                    onChange={(e, newValue) => {
                      console.log("🚗 Cab selected:", newValue?.cabNumber);
                      handleFormChange("cabId", newValue?.id || null);
                    }}
                    loading={cabsLoading}
                    noOptionsText="No cabs found"
                    loadingText="Loading cabs..."
                    openOnFocus
                    clearOnBlur
                    selectOnFocus
                    filterOptions={(options, state) => {
                      if (!state.inputValue) return options;
                      return options.filter((option) =>
                        option?.cabNumber?.toString().toLowerCase().includes(state.inputValue.toLowerCase())
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Cab"
                        placeholder="Search cab number..."
                        helperText={cabs.length === 0 && !cabsLoading ? "No cabs available" : ""}
                      />
                    )}
                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  {user?.role === "DRIVER" ? (
                    <TextField
                      disabled
                      fullWidth
                      label="Driver / Owner"
                      value={`${user.firstName} ${user.lastName}`}
                      helperText="Logged in as this driver"
                    />
                  ) : (
                    <Autocomplete
                      options={owners}
                      getOptionLabel={(option) => `${option?.firstName || ""} ${option?.lastName || ""}`.trim()}
                      getOptionKey={(option) => `owner-${option?.id}`}
                      value={owners.find((o) => o.id === formData.ownerId) || null}
                      onChange={(e, newValue) => {
                        console.log("👤 Driver selected:", newValue?.firstName, newValue?.lastName);
                        handleFormChange("ownerId", newValue?.id || null);
                      }}
                      loading={ownersLoading}
                      noOptionsText="No drivers found"
                      loadingText="Loading drivers..."
                      openOnFocus
                      clearOnBlur
                      selectOnFocus
                      filterOptions={(options, state) => {
                        if (!state.inputValue) return options;
                        const fullName = `${state.inputValue}`.toLowerCase();
                        return options.filter((option) => {
                          const name = `${option?.firstName || ""} ${option?.lastName || ""}`.toLowerCase();
                          return name.includes(fullName);
                        });
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Driver / Owner"
                          placeholder="Search driver name..."
                          helperText={owners.length === 0 && !ownersLoading ? "No drivers available" : ""}
                        />
                      )}
                      isOptionEqualToValue={(option, value) => option?.id === value?.id}
                    />
                  )}
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    value={formData.notes}
                    onChange={(e) => handleFormChange("notes", e.target.value)}
                    multiline
                    rows={3}
                    placeholder="Add any additional notes about this receipt..."
                  />
                </Grid>
              </Grid>

              {/* Line Items Table */}
              {formData.lineItems && formData.lineItems.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold", color: "#193366" }}>
                    Line Items
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                          <TableCell>Description</TableCell>
                          <TableCell align="right">Qty</TableCell>
                          <TableCell align="right">Unit Price</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {formData.lineItems.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <TextField
                                size="small"
                                value={item.description || ""}
                                onChange={(e) => handleLineItemChange(idx, "description", e.target.value)}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                size="small"
                                type="number"
                                value={item.quantity || 0}
                                onChange={(e) => handleLineItemChange(idx, "quantity", parseFloat(e.target.value) || 0)}
                                inputProps={{ step: "0.01" }}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                size="small"
                                type="number"
                                value={item.unitPrice || 0}
                                onChange={(e) => handleLineItemChange(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                                inputProps={{ step: "0.01" }}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                size="small"
                                type="number"
                                value={item.total || 0}
                                onChange={(e) => handleLineItemChange(idx, "total", parseFloat(e.target.value) || 0)}
                                inputProps={{ step: "0.01" }}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Action Buttons */}
              <Box sx={{ display: "flex", gap: 2, justifyContent: "space-between" }}>
                <Button
                  variant="outlined"
                  onClick={handleRescan}
                  startIcon={<ReplayIcon />}
                >
                  Rescan Receipt
                </Button>
                <Button
                  variant="contained"
                  onClick={handleConfirmReceipt}
                  disabled={loading}
                  sx={{
                    backgroundColor: "#4caf50",
                    "&:hover": { backgroundColor: "#388e3c" },
                  }}
                  endIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
                >
                  {loading ? "Saving..." : "Save Receipt"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
          </>
        )}

        {/* Success Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <SnackAlert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
          >
            {snackbar.message}
          </SnackAlert>
        </Snackbar>
      </Container>

      {/* Logout Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff', fontWeight: 700, fontSize: '1.3rem', pb: 1 }}>
          🚪 Confirm Logout
        </DialogTitle>
        <DialogContent sx={{ color: '#fff' }}>
          <Typography>Are you sure you want to logout?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setLogoutDialogOpen(false)}
            sx={{ color: '#fff', borderColor: '#fff' }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmLogout}
            variant="contained"
            sx={{
              backgroundColor: '#ff6b6b',
              '&:hover': { backgroundColor: '#ff5252' }
            }}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Viewer Dialog */}
      <Dialog
        open={imageViewerOpen}
        onClose={handleCloseImageViewer}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            backgroundColor: '#f5f5f5'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          📸 Receipt Image
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 2 }}>
          {selectedReceiptImage && selectedReceiptImage.imageData ? (
            <>
              <Box
                component="img"
                src={selectedReceiptImage.imageData}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '600px',
                  borderRadius: 1,
                  border: '1px solid #ddd',
                  mb: 2
                }}
              />
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #ddd' }}>
                <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                  <strong>Receipt ID:</strong> #{selectedReceiptImage.id}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                  <strong>Vendor:</strong> {selectedReceiptImage.vendorName || "-"}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  <strong>Date:</strong> {selectedReceiptImage.receiptDate || "-"}
                </Typography>
              </Box>
            </>
          ) : (
            <Typography sx={{ color: '#999' }}>No image available</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCloseImageViewer}
            variant="contained"
            sx={{
              backgroundColor: '#667eea',
              '&:hover': { backgroundColor: '#5568d3' }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
