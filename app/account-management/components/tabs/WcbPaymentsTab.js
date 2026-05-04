'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Collapse,
  Box,
  CircularProgress,
  Typography,
  Chip,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, Delete } from '@mui/icons-material';
import { tenantFetch } from '../../../lib/api';

export default function WcbPaymentsTab() {
  const [remittances, setRemittances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState({});
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' });

  useEffect(() => {
    fetchRemittances();
  }, []);

  const fetchRemittances = async () => {
    setLoading(true);
    try {
      const response = await tenantFetch('/api/wcb-remittances');
      if (response.ok) {
        const data = await response.json();
        setRemittances(data || []);
      }
    } catch (error) {
      console.error('Error fetching WCB remittances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExpandClick = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDeleteClick = (id, payeeName) => {
    setDeleteDialog({ open: true, id, name: payeeName });
  };

  const handleDeleteConfirm = async () => {
    const { id } = deleteDialog;
    try {
      const response = await tenantFetch(`/api/wcb-remittances/${id}`, {
        method: 'DELETE',
      });
      if (response.ok || response.status === 204) {
        setRemittances((prev) => prev.filter((r) => r.id !== id));
        setDeleteDialog({ open: false, id: null, name: '' });
      }
    } catch (error) {
      console.error('Error deleting WCB remittance:', error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, id: null, name: '' });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (remittances.length === 0) {
    return (
      <Box padding={3} textAlign="center">
        <Typography variant="h6" color="textSecondary">
          No WCB remittance entries found.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell width="50px" />
              <TableCell>Payee Name</TableCell>
              <TableCell>Payee #</TableCell>
              <TableCell>Cheque #</TableCell>
              <TableCell>Cheque Date</TableCell>
              <TableCell align="right">Total Amount</TableCell>
              <TableCell align="center">Lines</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {remittances.map((remittance) => (
              <React.Fragment key={remittance.id}>
                <TableRow hover>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleExpandClick(remittance.id)}
                    >
                      {expandedRows[remittance.id] ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                  </TableCell>
                  <TableCell>{remittance.payeeName || '—'}</TableCell>
                  <TableCell>{remittance.payeeNumber || '—'}</TableCell>
                  <TableCell>{remittance.chequeNumber || '—'}</TableCell>
                  <TableCell>
                    {remittance.chequeDate
                      ? new Date(remittance.chequeDate).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell align="right">
                    {remittance.totalAmount
                      ? `$${parseFloat(remittance.totalAmount).toFixed(2)}`
                      : '—'}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={remittance.lineItemCount || 0}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() =>
                        handleDeleteClick(remittance.id, remittance.payeeName)
                      }
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>

                {/* Expanded row with line items */}
                <TableRow>
                  <TableCell colSpan={8}>
                    <Collapse in={expandedRows[remittance.id]} timeout="auto" unmountOnExit>
                      <Box sx={{ margin: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Line Items ({remittance.lines?.length || 0})
                        </Typography>
                        {remittance.lines && remittance.lines.length > 0 ? (
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ backgroundColor: '#fafafa' }}>
                                <TableCell>Claim #</TableCell>
                                <TableCell>Invoice #</TableCell>
                                <TableCell>Customer Name</TableCell>
                                <TableCell>Service Date</TableCell>
                                <TableCell>Service Code</TableCell>
                                <TableCell align="right">Amount</TableCell>
                                <TableCell>Explanation</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {remittance.lines.map((line) => (
                                <TableRow key={line.id}>
                                  <TableCell>{line.claimNumber || '—'}</TableCell>
                                  <TableCell>{line.invoiceNo || '—'}</TableCell>
                                  <TableCell>{line.customerName || '—'}</TableCell>
                                  <TableCell>
                                    {line.serviceDate
                                      ? new Date(line.serviceDate).toLocaleDateString()
                                      : '—'}
                                  </TableCell>
                                  <TableCell>{line.serviceCode || '—'}</TableCell>
                                  <TableCell align="right">
                                    {line.amount ? `$${parseFloat(line.amount).toFixed(2)}` : '—'}
                                  </TableCell>
                                  <TableCell>{line.explanation || '—'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            No line items.
                          </Typography>
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={handleDeleteCancel}>
        <DialogTitle>Delete WCB Remittance</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the WCB payment for {deleteDialog.name}? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
