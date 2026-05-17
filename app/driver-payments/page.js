"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  UploadFile as UploadFileIcon,
  CheckCircle as CheckCircleIcon,
  PostAdd as PostAddIcon,
  AccountBalance as BankIcon,
  Payment as PaymentIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "../lib/api";
import GlobalNav from "../components/GlobalNav";
import { useDriverPayments } from "./hooks/useDriverPayments";
import PaymentBatchList from "./components/PaymentBatchList";
import BulkPaymentEntryTable from "./components/BulkPaymentEntryTable";
import CreateBatchDialog from "./components/dialogs/CreateBatchDialog";
import PostBatchDialog from "./components/dialogs/PostBatchDialog";
import RecallStatementDialog from "./components/dialogs/RecallStatementDialog";
import AuditHistoryDialog from "./components/dialogs/AuditHistoryDialog";
import GenerateEftDialog from "./components/dialogs/GenerateEftDialog";
import EftConfigTab from "../financial-setup/tabs/EftConfigTab";
import { formatCurrency, formatDate, getStatusColor } from "./utils/helpers";
import * as amplitude from "@amplitude/unified";

export default function DriverPaymentsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(null); // null | "payments" | "eftConfig"
  const [showBatchList, setShowBatchList] = useState(true);
  const [completeBatchDialog, setCompleteBatchDialog] = useState(false);
  const [eftDialog, setEftDialog] = useState(false);
  const [eftError, setEftError] = useState("");
  const [eftSuccess, setEftSuccess] = useState("");

  const {
    batches,
    selectedBatch,
    batchRows,
    periodStatements,
    paymentMethods,
    loading,
    error,
    success,
    openCreateBatch,
    openPostBatch,
    openRecallStatement,
    openAuditHistory,
    selectedStatement,
    recallReason,
    loadBatches,
    createBatch,
    loadStatementsForPeriod,
    addStatementRow,
    updateBatchRow,
    removeBatchRow,
    addStatementsFromPeriod,
    postBatch,
    completeBatch,
    recordPayment,
    recallStatement,
    loadAuditHistory,
    loadPaymentMethods,
    selectBatch,
    clearSelection,
    openCreateBatchDialog,
    closeCreateBatchDialog,
    openPostBatchDialog,
    closePostBatchDialog,
    openRecallDialog,
    closeRecallDialog,
    openAuditDialog,
    closeAuditDialog,
    setRecallReason,
    clearMessages,
  } = useDriverPayments();

  // Check authentication and load data
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (
      !currentUser ||
      !["ADMIN", "MANAGER", "ACCOUNTANT"].includes(currentUser.role)
    ) {
      router.push("/");
      return;
    }
    setUser(currentUser);
    setIsLoading(false);
  }, [router]);

  // Load initial data
  useEffect(() => {
    if (!isLoading && user) {
      loadBatches();
      loadPaymentMethods();
    }
  }, [isLoading, user, loadBatches, loadPaymentMethods]);

  const handleCreateBatch = async (batchData) => {
    try {
      const newBatch = await createBatch(batchData);
      amplitude.track("Payment Batch Created", {
        batch_id: newBatch?.id,
        period_start: batchData?.periodStart,
        period_end: batchData?.periodEnd,
      });
      await selectBatch(newBatch);
      setShowBatchList(false);
    } catch (error) {
      console.error("Error creating batch:", error);
    }
  };

  const handlePostBatch = async (batch) => {
    try {
      await postBatch(batch.id);
      amplitude.track("Payment Batch Posted", {
        batch_id: batch.id,
        batch_number: batch.batchNumber,
      });
      await selectBatch({
        ...batch,
        status: "POSTED",
      });
    } catch (error) {
      console.error("Error posting batch:", error);
    }
  };

  const handleCompleteBatch = async (batch) => {
    setCompleteBatchDialog(false);
    try {
      await completeBatch(batch.id);
      amplitude.track("Payment Batch Completed", {
        batch_id: batch.id,
        batch_number: batch.batchNumber,
        total_amount: batchRows.reduce((sum, row) => sum + (row.payAmount || 0), 0),
        statement_count: batchRows.length,
      });
      setShowBatchList(true);
      clearSelection();
    } catch (error) {
      console.error("Error completing batch:", error);
    }
  };

  const handleAddStatementsFromPeriod = async () => {
    try {
      await addStatementsFromPeriod(selectedBatch.id);
    } catch (error) {
      console.error("Error adding statements:", error);
    }
  };

  const handleSelectBatch = async (batch) => {
    await selectBatch(batch);
    setShowBatchList(false);
  };

  const handleBackToBatchList = () => {
    clearSelection();
    setShowBatchList(true);
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
      <GlobalNav currentUser={user} title="Driver & Owner Payments" />

      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => {
              if (activeSection) {
                setActiveSection(null);
              } else {
                localStorage.removeItem('dashboardCategory');
                router.push('/');
              }
            }}
            sx={{
              color: '#667eea',
              borderColor: '#667eea',
              fontWeight: 600,
              textTransform: 'none',
              mt: 0.5,
              '&:hover': {
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderColor: '#667eea'
              }
            }}
          >
            {activeSection ? 'Back to Payments' : 'Back to Dashboard'}
          </Button>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#3e5244' }}>
              {activeSection === 'eftConfig' ? 'EFT Configuration' : 'Driver & Owner Payments'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {activeSection === 'eftConfig'
                ? 'Configure bank details and originator settings for EFT file generation'
                : 'Manage bulk payment batches, settlements, and EFT configuration'}
            </Typography>
          </Box>
        </Box>

        {/* Section Selector Cards */}
        {!activeSection && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <Card
                elevation={2}
                sx={{
                  cursor: 'pointer',
                  border: '2px solid transparent',
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': { borderColor: '#667eea', boxShadow: 4 },
                }}
                onClick={() => setActiveSection('payments')}
              >
                <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2.5 }}>
                  <Box
                    sx={{
                      width: 56, height: 56, borderRadius: 2,
                      backgroundColor: 'rgba(102, 126, 234, 0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <PaymentIcon sx={{ color: '#667eea', fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#3e5244' }}>
                      Driver & Owner Payments
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Create payment batches, manage settlements, post and process payments
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card
                elevation={2}
                sx={{
                  cursor: 'pointer',
                  border: '2px solid transparent',
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': { borderColor: '#1565c0', boxShadow: 4 },
                }}
                onClick={() => setActiveSection('eftConfig')}
              >
                <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2.5 }}>
                  <Box
                    sx={{
                      width: 56, height: 56, borderRadius: 2,
                      backgroundColor: 'rgba(21, 101, 192, 0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <BankIcon sx={{ color: '#1565c0', fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#3e5244' }}>
                      EFT Configuration
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Configure bank details and originator settings for EFT file generation (CPA 005)
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* EFT Configuration Section */}
        {activeSection === 'eftConfig' && (
          <Box>
            {eftError && (
              <Alert severity="error" onClose={() => setEftError("")} sx={{ mb: 2 }}>
                {eftError}
              </Alert>
            )}
            {eftSuccess && (
              <Alert severity="success" onClose={() => setEftSuccess("")} sx={{ mb: 2 }}>
                {eftSuccess}
              </Alert>
            )}
            <EftConfigTab
              canEdit={user?.role === "ADMIN" || user?.role === "MANAGER"}
              setError={setEftError}
              setSuccess={setEftSuccess}
            />
          </Box>
        )}

        {/* Payments Section */}
        {activeSection === 'payments' && (
        <>
        {/* Alerts */}
        {error && (
          <Alert
            severity="error"
            onClose={() => clearMessages()}
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            onClose={() => clearMessages()}
            sx={{ mb: 2 }}
          >
            {success}
          </Alert>
        )}

        {/* View 1: Batch List */}
        {showBatchList ? (
          <>
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openCreateBatchDialog}
                disabled={loading}
                size="large"
              >
                New Payment Batch
              </Button>
            </Box>

            <PaymentBatchList
              batches={batches}
              onSelectBatch={handleSelectBatch}
              onPostBatch={async (batch) => {
                await selectBatch(batch);
                openPostBatchDialog();
              }}
              onCompleteBatch={async (batch) => {
                await selectBatch(batch);
                setCompleteBatchDialog(true);
              }}
              isLoading={loading}
            />
          </>
        ) : (
          <>
            {/* View 2: Batch Editor */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={handleBackToBatchList}
                disabled={loading}
              >
                Back to Batches
              </Button>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Batch: {selectedBatch?.batchNumber || `BATCH-${selectedBatch?.id}`}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Period: {formatDate(selectedBatch?.periodStart)} to{" "}
                  {formatDate(selectedBatch?.periodEnd)}
                </Typography>
              </Box>
              <Chip
                label={selectedBatch?.status || "DRAFT"}
                color={getStatusColor(selectedBatch?.status || "DRAFT")}
                size="medium"
              />
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} sx={{ backgroundColor: "#f5f5f5" }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Amount
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {formatCurrency(
                        batchRows.reduce((sum, row) => sum + (row.payAmount || 0), 0)
                      )}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} sx={{ backgroundColor: "#f5f5f5" }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Number of Payments
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {batchRows.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} sx={{ backgroundColor: "#f5f5f5" }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Pending
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {batchRows.filter((r) => r.status === "PENDING").length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} sx={{ backgroundColor: "#f5f5f5" }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Completed
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {batchRows.filter((r) => r.status === "COMPLETED").length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
              {selectedBatch?.status === "DRAFT" && (
                <>
                  <Button
                    variant="contained"
                    startIcon={<UploadFileIcon />}
                    onClick={handleAddStatementsFromPeriod}
                    disabled={loading}
                  >
                    Add Statements from Period
                  </Button>
                  {/* Debug: Log why button is disabled */}
                  {batchRows.length > 0 && (
                    <Typography variant="caption" color="textSecondary">
                      {batchRows.some((r) => !r.payAmount || r.payAmount <= 0)
                        ? "❌ All rows need payAmount > 0"
                        : ""}
                      {batchRows.some((r) => !r.method)
                        ? " ❌ All rows need a payment method"
                        : ""}
                    </Typography>
                  )}
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<PostAddIcon />}
                    onClick={openPostBatchDialog}
                    disabled={
                      loading ||
                      batchRows.length === 0 ||
                      batchRows.some((r) => !r.payAmount || r.payAmount <= 0 || !r.method)
                    }
                  >
                    Post Batch
                  </Button>
                </>
              )}

              {selectedBatch?.status === "POSTED" && (
                <>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => setCompleteBatchDialog(true)}
                    disabled={loading}
                  >
                    Complete Batch
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<BankIcon />}
                    onClick={() => setEftDialog(true)}
                    disabled={loading}
                    sx={{ borderColor: "#6366f1", color: "#6366f1" }}
                  >
                    Generate EFT File
                  </Button>
                </>
              )}

              {selectedBatch?.status === "PROCESSED" && (
                <>
                  <Chip
                    label="Batch Completed"
                    color="success"
                    icon={<CheckCircleIcon />}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<BankIcon />}
                    onClick={() => setEftDialog(true)}
                    sx={{ borderColor: "#6366f1", color: "#6366f1" }}
                  >
                    Generate EFT File
                  </Button>
                </>
              )}
            </Box>

            {/* Bulk Entry Table */}
            <Paper elevation={0} sx={{ p: 3 }}>
              <BulkPaymentEntryTable
                rows={batchRows}
                paymentMethods={paymentMethods}
                onUpdateRow={updateBatchRow}
                onRemoveRow={removeBatchRow}
                isReadOnly={selectedBatch?.status !== "DRAFT"}
                batchStatus={selectedBatch?.status}
              />
            </Paper>
          </>
        )}
        </>
        )}
      </Box>

      {/* Dialogs */}
      <CreateBatchDialog
        open={openCreateBatch}
        onClose={closeCreateBatchDialog}
        onSubmit={handleCreateBatch}
        isLoading={loading}
      />

      <PostBatchDialog
        open={openPostBatch}
        onClose={closePostBatchDialog}
        onSubmit={handlePostBatch}
        batch={selectedBatch}
        rows={batchRows}
        isLoading={loading}
      />

      {/* Complete Batch Confirmation Dialog */}
      <Dialog open={completeBatchDialog} onClose={() => setCompleteBatchDialog(false)}>
        <DialogTitle sx={{ fontWeight: 600 }}>Complete Batch</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This will mark all statements in this batch as PAID. This action cannot be
            undone.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Batch: {selectedBatch?.batchNumber || `BATCH-${selectedBatch?.id}`}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Total: {formatCurrency(
              batchRows.reduce((sum, row) => sum + (row.payAmount || 0), 0)
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteBatchDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleCompleteBatch(selectedBatch)}
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? "Processing..." : "Complete Batch"}
          </Button>
        </DialogActions>
      </Dialog>

      <RecallStatementDialog
        open={openRecallStatement}
        onClose={closeRecallDialog}
        onSubmit={recallStatement}
        statement={selectedStatement}
        isLoading={loading}
      />

      <AuditHistoryDialog
        open={openAuditHistory}
        onClose={closeAuditDialog}
        onFetchHistory={loadAuditHistory}
        statement={selectedStatement}
        isLoading={loading}
      />

      <GenerateEftDialog
        open={eftDialog}
        onClose={() => setEftDialog(false)}
        batch={selectedBatch}
        rows={batchRows}
      />
    </Box>
  );
}
