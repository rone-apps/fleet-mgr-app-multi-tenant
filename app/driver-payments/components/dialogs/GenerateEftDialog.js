"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
  Link,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  AccountBalance as BankIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import { API_BASE_URL } from "../../../lib/api";
import * as amplitude from "@amplitude/unified";
import { formatCurrency, formatDate } from "../../utils/helpers";

export default function GenerateEftDialog({ open, onClose, batch, rows }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [configExists, setConfigExists] = useState(null);

  useEffect(() => {
    if (open && batch) {
      setResult(null);
      setError("");
      setShowHistory(false);
      checkConfig();
      loadHistory();
    }
  }, [open, batch]);

  const getHeaders = () => {
    const token = localStorage.getItem("token");
    const tenant = localStorage.getItem("tenantSchema");
    return {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(tenant && { "X-Tenant-ID": tenant }),
    };
  };

  const checkConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/eft/config`, {
        headers: getHeaders(),
      });
      setConfigExists(response.ok && response.status !== 204);
    } catch {
      setConfigExists(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/eft/history/${batch.id}`,
        { headers: getHeaders() }
      );
      if (response.ok) {
        setHistory(await response.json());
      }
    } catch (e) {
      console.error("Error loading EFT history:", e);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/eft/generate/${batch.id}`,
        {
          method: "POST",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to generate EFT (HTTP ${response.status})`);
      }

      const data = await response.json();
      setResult(data);
      amplitude.track("EFT File Generated", {
        batch_id: batch?.id,
        batch_number: batch?.batchNumber,
        file_name: data?.fileName,
      });
      loadHistory();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result?.fileContent || !result?.fileName) return;
    const blob = new Blob([result.fileContent], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ddRows = rows?.filter((r) => r.method === "DD" || r.method === "Direct Deposit") || [];
  const totalDdAmount = ddRows.reduce((sum, r) => sum + (r.payAmount || 0), 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
        <BankIcon sx={{ color: "#6366f1" }} />
        Generate EFT File
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Config check */}
          {configExists === false && (
            <Alert severity="error">
              EFT configuration is not set up. Please configure your originator
              details under Financial Setup before generating EFT files.
            </Alert>
          )}

          {/* Batch info */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box>
              <Typography variant="caption" color="textSecondary">Batch</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {batch?.batchNumber}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">Period</Typography>
              <Typography variant="body2">
                {formatDate(batch?.periodStart)} to {formatDate(batch?.periodEnd)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">DD Payments</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {ddRows.length} of {rows?.length || 0} total
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">DD Total</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatCurrency(totalDdAmount)}
              </Typography>
            </Box>
          </Box>

          {ddRows.length === 0 && (
            <Alert severity="info">
              No Direct Deposit (DD) payments found in this batch. EFT files are
              only generated for payments with DD payment method.
            </Alert>
          )}

          {ddRows.length > 0 && !result && (
            <>
              <Alert severity="info" icon={<BankIcon />}>
                This will generate a CPA Standard 005 EFT file containing{" "}
                {ddRows.length} Direct Deposit payment(s) totaling{" "}
                {formatCurrency(totalDdAmount)}. The file can be uploaded to your
                bank&apos;s online portal for processing.
              </Alert>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1 }}>
                Direct Deposit Payments
              </Typography>
              <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 250 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableCell sx={{ fontWeight: 600 }}>Person</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ddRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.personName}</TableCell>
                        <TableCell align="right">{formatCurrency(row.payAmount || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {/* Error */}
          {error && <Alert severity="error">{error}</Alert>}

          {/* Result */}
          {result && (
            <Box>
              <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 2 }}>
                EFT file generated successfully!
              </Alert>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="caption" color="textSecondary">File Name</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: "monospace" }}>
                    {result.fileName}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">Records</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {result.recordCount} credit transaction(s)
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">Total Amount</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatCurrency(result.totalAmount)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">Format</Typography>
                  <Typography variant="body2">CPA Standard 005</Typography>
                </Box>
              </Box>

              {result.warnings?.length > 0 && (
                <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {result.warnings.length} payment(s) skipped (missing bank account):
                  </Typography>
                  {result.warnings.map((w, i) => (
                    <Typography key={i} variant="body2">• {w}</Typography>
                  ))}
                </Alert>
              )}

              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                fullWidth
                sx={{ mt: 1 }}
              >
                Download EFT File
              </Button>
            </Box>
          )}

          {/* Generation History */}
          {history.length > 0 && (
            <>
              <Divider sx={{ my: 1 }} />
              <Box
                onClick={() => setShowHistory(!showHistory)}
                sx={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 1 }}
              >
                <HistoryIcon fontSize="small" />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Previous Generations ({history.length})
                </Typography>
              </Box>
              {showHistory && (
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>File</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Records</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Generated</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {history.map((gen) => (
                        <TableRow key={gen.id}>
                          <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                            {gen.fileName}
                          </TableCell>
                          <TableCell>{gen.recordCount}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(gen.totalCreditAmount)}
                          </TableCell>
                          <TableCell>
                            {gen.generatedAt
                              ? new Date(gen.generatedAt).toLocaleString()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Chip label={gen.status} size="small" color="default" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {!result && ddRows.length > 0 && (
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={loading || configExists === false}
            startIcon={loading ? <CircularProgress size={20} /> : <BankIcon />}
          >
            {loading ? "Generating..." : "Generate EFT File"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
