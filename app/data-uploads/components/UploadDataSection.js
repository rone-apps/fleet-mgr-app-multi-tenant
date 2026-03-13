"use client";

import { useState, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  Fade,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
} from "@mui/material";
import {
  CreditCard as CreditCardIcon,
  FlightTakeoff as AirportIcon,
  Speed as MileageIcon,
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  InsertDriveFile as FileIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { API_BASE_URL, getTenantSchema } from "../../lib/api";

const FILE_TYPES = [
  {
    key: "credit-card",
    label: "Credit Card Transactions",
    icon: CreditCardIcon,
    color: "#6366f1",
    previewUrl: "/uploads/credit-card-transactions/preview",
    importUrl: "/uploads/credit-card-transactions/import",
    cancelUrl: "/uploads/credit-card-transactions/cancel",
    description: "Merchant transactions CSV from payment processor",
  },
  {
    key: "mileage",
    label: "Cab Mileage",
    icon: MileageIcon,
    color: "#10b981",
    previewUrl: "/uploads/mileage/preview",
    importUrl: "/uploads/mileage/import",
    cancelUrl: "/uploads/mileage/cancel",
    description: "Daily mileage records per cab",
  },
  {
    key: "airport-trips",
    label: "Airport Trips",
    icon: AirportIcon,
    color: "#f59e0b",
    previewUrl: "/uploads/airport-trips/preview",
    importUrl: "/uploads/airport-trips/import",
    cancelUrl: "/uploads/airport-trips/cancel",
    description: "Airport trip logs per cab",
  },
];

function UploadCard({ fileType, onDrop, uploadState }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const Icon = fileType.icon;

  const state = uploadState || {};
  const isProcessing = state.status === "processing";
  const isComplete = state.status === "complete";
  const isFailed = state.status === "failed";

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) setDragOver(true);
  }, [isProcessing]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (isProcessing) return;
    const file = e.dataTransfer.files[0];
    if (file && file.name.toLowerCase().endsWith(".csv")) {
      onDrop(fileType.key, file);
    }
  }, [fileType.key, onDrop, isProcessing]);

  const handleClick = () => {
    if (!isProcessing) inputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onDrop(fileType.key, file);
      e.target.value = "";
    }
  };

  return (
    <Card
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      sx={{
        cursor: isProcessing ? "default" : "pointer",
        border: "2px dashed",
        borderColor: dragOver ? fileType.color : isComplete ? "#10b981" : isFailed ? "#ef4444" : "#d1d5db",
        borderRadius: 3,
        bgcolor: dragOver ? `${fileType.color}08` : isComplete ? "#f0fdf4" : isFailed ? "#fef2f2" : "#fafbfc",
        transition: "all 0.2s ease",
        "&:hover": isProcessing ? {} : {
          borderColor: fileType.color,
          bgcolor: `${fileType.color}05`,
          transform: "translateY(-2px)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        },
        position: "relative",
        overflow: "hidden",
      }}
    >
      <input ref={inputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFileChange} />

      {isProcessing && (
        <LinearProgress
          sx={{
            position: "absolute", top: 0, left: 0, right: 0,
            "& .MuiLinearProgress-bar": { bgcolor: fileType.color },
          }}
        />
      )}

      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Box
            sx={{
              width: 48, height: 48, borderRadius: 2,
              bgcolor: `${fileType.color}15`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {isComplete ? (
              <CheckIcon sx={{ fontSize: 28, color: "#10b981" }} />
            ) : isFailed ? (
              <ErrorIcon sx={{ fontSize: 28, color: "#ef4444" }} />
            ) : (
              <Icon sx={{ fontSize: 28, color: fileType.color }} />
            )}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{fileType.label}</Typography>
            <Typography variant="caption" color="text.secondary">{fileType.description}</Typography>
          </Box>
        </Box>

        {!state.status && (
          <Box sx={{ textAlign: "center", py: 2 }}>
            <UploadIcon sx={{ fontSize: 36, color: "#9ca3af", mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Drag & drop CSV here or click to browse
            </Typography>
          </Box>
        )}

        {isProcessing && (
          <Box sx={{ py: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <FileIcon fontSize="small" sx={{ color: fileType.color }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{state.fileName}</Typography>
              <Typography variant="caption" color="text.secondary">
                ({(state.fileSize / 1024).toFixed(1)} KB)
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {state.stage === "parsing" ? "Parsing CSV..." : "Importing records to database..."}
            </Typography>
          </Box>
        )}

        {isComplete && (
          <Box sx={{ py: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <FileIcon fontSize="small" sx={{ color: "#10b981" }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{state.fileName}</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {state.result?.successCount != null && (
                <Chip size="small" label={`${state.result.successCount} imported`} color="success" variant="outlined" />
              )}
              {state.result?.skipCount > 0 && (
                <Chip size="small" label={`${state.result.skipCount} skipped`} color="warning" variant="outlined" />
              )}
              {state.result?.errorCount > 0 && (
                <Chip size="small" label={`${state.result.errorCount} errors`} color="error" variant="outlined" />
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              Drop another file to upload again
            </Typography>
          </Box>
        )}

        {isFailed && (
          <Box sx={{ py: 1 }}>
            <Typography variant="body2" color="error" sx={{ mb: 1 }}>{state.error}</Typography>
            <Typography variant="caption" color="text.secondary">Drop the file again to retry</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

/** Parse a record string like "Row 5: Duplicate - Cab 42, Auth ABC123, $10.50 on 2026-03-01" */
function parseRecord(str) {
  const rowMatch = str.match(/^Row (\d+):\s*(.*)/);
  return {
    row: rowMatch ? rowMatch[1] : "-",
    detail: rowMatch ? rowMatch[2] : str,
  };
}

function ResultDetailTable({ records, color, emptyLabel }) {
  if (!records || records.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
        {emptyLabel}
      </Typography>
    );
  }

  return (
    <TableContainer sx={{ maxHeight: 300 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, width: 70, bgcolor: "#fafafa" }}>Row</TableCell>
            <TableCell sx={{ fontWeight: 700, bgcolor: "#fafafa" }}>Detail</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((rec, idx) => {
            const parsed = parseRecord(rec);
            return (
              <TableRow key={idx} sx={{ "&:last-child td": { borderBottom: 0 } }}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
                    {parsed.row}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{parsed.detail}</Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function UploadResultDetails({ uploadStates }) {
  const [activeTab, setActiveTab] = useState(0);
  const [detailTab, setDetailTab] = useState(0);

  // Collect all completed uploads with skipped or error details
  const completedTypes = FILE_TYPES.filter((ft) => {
    const state = uploadStates[ft.key];
    if (!state || state.status !== "complete") return false;
    const result = state.result || {};
    return (result.skipCount > 0) || (result.errorCount > 0);
  });

  if (completedTypes.length === 0) return null;

  const currentType = completedTypes[activeTab] || completedTypes[0];
  const state = uploadStates[currentType.key];
  const result = state?.result || {};
  const skippedRecords = result.skippedRecords || [];
  const errors = result.errors || [];
  const hasSkipped = result.skipCount > 0;
  const hasErrors = result.errorCount > 0;

  return (
    <Fade in>
      <Paper sx={{ overflow: "hidden" }}>
        {/* Type tabs - only if multiple types have details */}
        {completedTypes.length > 1 && (
          <Tabs
            value={activeTab}
            onChange={(e, v) => { setActiveTab(v); setDetailTab(0); }}
            sx={{ borderBottom: "1px solid #e5e7eb", px: 2 }}
          >
            {completedTypes.map((ft, idx) => {
              const Icon = ft.icon;
              const r = uploadStates[ft.key]?.result || {};
              return (
                <Tab
                  key={ft.key}
                  icon={<Icon sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      {ft.label}
                      {(r.skipCount > 0 || r.errorCount > 0) && (
                        <Chip
                          size="small"
                          label={(r.skipCount || 0) + (r.errorCount || 0)}
                          color="warning"
                          sx={{ height: 20, fontSize: "0.7rem" }}
                        />
                      )}
                    </Box>
                  }
                  sx={{ textTransform: "none", minHeight: 48 }}
                />
              );
            })}
          </Tabs>
        )}

        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <currentType.icon sx={{ fontSize: 20, color: currentType.color }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {currentType.label} — Upload Details
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ({state.fileName})
            </Typography>
          </Box>

          {/* Summary chips */}
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <Chip size="small" label={`${result.successCount || 0} imported`} color="success" variant="outlined" />
            {hasSkipped && (
              <Chip size="small" label={`${result.skipCount} skipped (duplicates)`} color="warning" variant="outlined" />
            )}
            {hasErrors && (
              <Chip size="small" label={`${result.errorCount} errors`} color="error" variant="outlined" />
            )}
            <Chip size="small" label={`${result.totalProcessed || 0} total`} variant="outlined" />
          </Box>
        </Box>

        {/* Skipped / Errors sub-tabs */}
        {(hasSkipped && hasErrors) ? (
          <>
            <Tabs
              value={detailTab}
              onChange={(e, v) => setDetailTab(v)}
              sx={{ px: 2, borderBottom: "1px solid #f0f0f0", minHeight: 36 }}
            >
              <Tab
                icon={<WarningIcon sx={{ fontSize: 16 }} />}
                iconPosition="start"
                label={`Skipped (${result.skipCount})`}
                sx={{ textTransform: "none", minHeight: 36, py: 0 }}
              />
              <Tab
                icon={<ErrorIcon sx={{ fontSize: 16 }} />}
                iconPosition="start"
                label={`Errors (${result.errorCount})`}
                sx={{ textTransform: "none", minHeight: 36, py: 0 }}
              />
            </Tabs>
            {detailTab === 0 && (
              <ResultDetailTable records={skippedRecords} color="warning" emptyLabel="No skip details available" />
            )}
            {detailTab === 1 && (
              <ResultDetailTable records={errors} color="error" emptyLabel="No error details available" />
            )}
          </>
        ) : hasSkipped ? (
          <>
            <Box sx={{ px: 2, pb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "#b45309" }}>
                Skipped Records (Duplicates)
              </Typography>
            </Box>
            <ResultDetailTable records={skippedRecords} color="warning" emptyLabel="No skip details available" />
          </>
        ) : hasErrors ? (
          <>
            <Box sx={{ px: 2, pb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "#dc2626" }}>
                Error Records
              </Typography>
            </Box>
            <ResultDetailTable records={errors} color="error" emptyLabel="No error details available" />
          </>
        ) : null}
      </Paper>
    </Fade>
  );
}

export default function UploadDataSection() {
  const [uploadStates, setUploadStates] = useState({});
  const [recentUploads, setRecentUploads] = useState([]);

  const updateState = (key, update) => {
    setUploadStates((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), ...update },
    }));
  };

  const getHeaders = () => {
    const token = localStorage.getItem("token");
    const tenant = getTenantSchema();
    return {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(tenant && { "X-Tenant-ID": tenant }),
    };
  };

  const handleDrop = useCallback(async (typeKey, file) => {
    const fileType = FILE_TYPES.find((t) => t.key === typeKey);
    if (!fileType) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      updateState(typeKey, { status: "failed", error: "Please select a CSV file", fileName: file.name });
      return;
    }

    updateState(typeKey, {
      status: "processing",
      stage: "parsing",
      fileName: file.name,
      fileSize: file.size,
      error: null,
      result: null,
    });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);

      const previewRes = await fetch(`${API_BASE_URL}${fileType.previewUrl}`, {
        method: "POST",
        headers: getHeaders(),
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!previewRes.ok) {
        const errText = await previewRes.text().catch(() => "");
        throw new Error(errText || `Upload failed (HTTP ${previewRes.status})`);
      }

      const preview = await previewRes.json();
      const sessionId = preview.sessionId;

      updateState(typeKey, { stage: "importing" });

      const importRes = await fetch(
        `${API_BASE_URL}${fileType.importUrl}?sessionId=${sessionId}&filename=${encodeURIComponent(file.name)}`,
        {
          method: "POST",
          headers: getHeaders(),
        }
      );

      if (!importRes.ok) {
        const errData = await importRes.json().catch(() => ({}));
        throw new Error(errData.error || `Import failed (HTTP ${importRes.status})`);
      }

      const result = await importRes.json();

      updateState(typeKey, { status: "complete", result });

      setRecentUploads((prev) => [
        {
          type: fileType.label,
          fileName: file.name,
          time: new Date(),
          success: result.successCount || 0,
          skipped: result.skipCount || 0,
          errors: result.errorCount || 0,
        },
        ...prev.slice(0, 9),
      ]);
    } catch (err) {
      if (err.name === "AbortError") {
        updateState(typeKey, { status: "failed", error: "Upload timed out. Try a smaller file." });
      } else {
        updateState(typeKey, { status: "failed", error: err.message });
      }
    }
  }, []);

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 700 }}>
        Upload Data
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Drag and drop a CSV file onto any card below. Files are automatically parsed and imported.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {FILE_TYPES.map((ft) => (
          <Grid item xs={12} md={4} key={ft.key}>
            <UploadCard
              fileType={ft}
              onDrop={handleDrop}
              uploadState={uploadStates[ft.key]}
            />
          </Grid>
        ))}
      </Grid>

      {/* Detail tables for skipped/error records */}
      <Box sx={{ mb: 3 }}>
        <UploadResultDetails uploadStates={uploadStates} />
      </Box>

      {/* Recent uploads log */}
      {recentUploads.length > 0 && (
        <Fade in>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
              Recent Uploads
            </Typography>
            {recentUploads.map((upload, idx) => (
              <Box
                key={idx}
                sx={{
                  display: "flex", alignItems: "center", gap: 2, py: 1,
                  borderBottom: idx < recentUploads.length - 1 ? "1px solid #f0f0f0" : "none",
                }}
              >
                <CheckIcon fontSize="small" sx={{ color: "#10b981" }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{upload.fileName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {upload.type} &middot; {upload.time.toLocaleTimeString()}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <Chip size="small" label={`${upload.success} imported`} color="success" variant="outlined" />
                  {upload.skipped > 0 && (
                    <Chip size="small" label={`${upload.skipped} skipped`} color="warning" variant="outlined" />
                  )}
                  {upload.errors > 0 && (
                    <Chip size="small" label={`${upload.errors} errors`} color="error" variant="outlined" />
                  )}
                </Box>
              </Box>
            ))}
          </Paper>
        </Fade>
      )}
    </Box>
  );
}
