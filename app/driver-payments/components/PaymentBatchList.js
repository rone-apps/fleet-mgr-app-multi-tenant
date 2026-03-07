"use client";

import React from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { apiRequest } from "../../lib/api";
import { formatCurrency, formatDate, getStatusColor, sortBatches } from "../utils/helpers";
import PaymentDetailsRow from "./PaymentDetailsRow";

export default function PaymentBatchList({
  batches,
  onSelectBatch,
  onPostBatch,
  onCompleteBatch,
  isLoading,
}) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedBatchId, setSelectedBatchId] = React.useState(null);
  const [expandedBatchId, setExpandedBatchId] = React.useState(null);
  const [batchStatements, setBatchStatements] = React.useState({}); // Cache for batch statement counts

  React.useEffect(() => {
    // Fetch statement payment counts for all batches
    const fetchBatchStatements = async () => {
      const statements = {};
      for (const batch of batches) {
        try {
          const response = await apiRequest(`/payments/batches/${batch.id}/statement-payments`);
          if (response.ok) {
            const payments = await response.json();
            const total = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
            statements[batch.id] = {
              count: payments.length,
              total: total,
            };
          }
        } catch (error) {
          console.warn(`Failed to fetch statements for batch ${batch.id}`);
        }
      }
      setBatchStatements(statements);
    };

    if (batches && batches.length > 0) {
      fetchBatchStatements();
    }
  }, [batches]);

  const handleMenuOpen = (event, batchId) => {
    setAnchorEl(event.currentTarget);
    setSelectedBatchId(batchId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBatchId(null);
  };

  const handlePostClick = () => {
    const batch = batches.find((b) => b.id === selectedBatchId);
    onPostBatch(batch);
    handleMenuClose();
  };

  const handleCompleteClick = () => {
    const batch = batches.find((b) => b.id === selectedBatchId);
    onCompleteBatch(batch);
    handleMenuClose();
  };

  const handleEditClick = () => {
    const batch = batches.find((b) => b.id === selectedBatchId);
    onSelectBatch(batch);
    handleMenuClose();
  };

  const sortedBatches = sortBatches(batches, "date", "desc");

  if (batches.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          textAlign: "center",
          border: "2px dashed #ccc",
          borderRadius: 2,
          backgroundColor: "#f9f9f9",
        }}
      >
        <Typography variant="h6" color="textSecondary" gutterBottom>
          No payment batches yet
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Create your first batch to get started
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} elevation={0}>
      <Table sx={{ minWidth: 900 }}>
        <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Batch Name</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Batch #</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="center">
              Date Created
            </TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="center">
              # Payments
            </TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">
              Total
            </TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="center">
              Status
            </TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="center">
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedBatches.map((batch) => (
            <React.Fragment key={batch.id}>
              <TableRow
                sx={{
                  "&:hover": { backgroundColor: "#fafafa" },
                  transition: "background-color 0.2s",
                  cursor: batch.status === "PROCESSED" ? "pointer" : "default",
                }}
                onClick={() => batch.status === "PROCESSED" && setExpandedBatchId(expandedBatchId === batch.id ? null : batch.id)}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {batch.batchName || batch.batchNumber || `BATCH-${batch.id}`}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {batch.batchNumber || `BATCH-${batch.id}`}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(batch.periodStart)} to {formatDate(batch.periodEnd)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">
                    {formatDate(batch.createdAt || batch.dateCreated)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">
                    {batchStatements[batch.id]?.count || batch.paymentCount || batch.paymentRows?.length || 0}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatCurrency(batchStatements[batch.id]?.total || batch.totalAmount || 0)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={batch.status || "DRAFT"}
                    color={getStatusColor(batch.status || "DRAFT")}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                    <Tooltip title="View/Edit Batch">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => onSelectBatch(batch)}
                          disabled={isLoading}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="More options">
                      <span>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, batch.id)}
                          disabled={isLoading}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>

                  <Menu
                    anchorEl={anchorEl}
                    open={selectedBatchId === batch.id && !!anchorEl}
                    onClose={handleMenuClose}
                  >
                    {batch.status === "DRAFT" && (
                      <MenuItem onClick={handlePostClick}>
                        Post Batch
                      </MenuItem>
                    )}
                    {batch.status === "POSTED" && (
                      <MenuItem onClick={handleCompleteClick}>
                        Complete Batch
                      </MenuItem>
                    )}
                    {batch.status === "PROCESSED" && (
                      <MenuItem disabled>
                        Batch Completed
                      </MenuItem>
                    )}
                  </Menu>
                </TableCell>
              </TableRow>
              {batch.status === "PROCESSED" && expandedBatchId === batch.id && (
                <PaymentDetailsRow batch={batch} isExpanded={true} onToggle={() => setExpandedBatchId(null)} />
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
