"use client";

import { useState, useCallback } from "react";
import { apiRequest, API_BASE_URL } from "../../lib/api";

export const useDriverPayments = () => {
  const [state, setState] = useState({
    batches: [],
    selectedBatch: null,
    batchRows: [],
    periodStatements: [],
    paymentMethods: [
      { id: 1, code: "CHQ", name: "Cheque", requiresReference: true },
      { id: 2, code: "DD", name: "Direct Deposit", requiresReference: true },
      { id: 3, code: "CASH", name: "Cash", requiresReference: false },
      { id: 4, code: "ETRF", name: "E-Transfer", requiresReference: true },
    ],
    loading: false,
    error: null,
    success: null,
    openCreateBatch: false,
    openPostBatch: false,
    openRecallStatement: false,
    openAuditHistory: false,
    selectedStatement: null,
    recallReason: "",
  });

  // Load all payment batches
  const loadBatches = useCallback(async (statusFilter = null) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const endpoint = statusFilter
        ? `/payments/batches?status=${statusFilter}`
        : "/payments/batches";
      const response = await apiRequest(endpoint);

      // If endpoint not found (404) or not implemented, show friendly message
      if (response.status === 404 || response.status === 403) {
        setState((prev) => ({
          ...prev,
          batches: [],
          loading: false,
          error: null, // Don't show error, just empty list
        }));
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load batches");
      setState((prev) => ({ ...prev, batches: data, loading: false }));
    } catch (error) {
      // Silently handle errors for now - backend endpoints not implemented yet
      setState((prev) => ({
        ...prev,
        batches: [],
        loading: false,
        error: null,
      }));
    }
  }, []);

  // Create a new payment batch
  const createBatch = useCallback(async (batchData) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      // Validate required fields
      if (!batchData.batchDate || !batchData.periodFrom || !batchData.periodTo) {
        throw new Error("Batch date, period from, and period to are required");
      }

      // Build query string for the batch creation endpoint
      const params = new URLSearchParams({
        batchDate: batchData.batchDate,
        periodFrom: batchData.periodFrom,
        periodTo: batchData.periodTo,
        ...(batchData.notes && { notes: batchData.notes }),
      });

      const response = await apiRequest(`/payments/batches?${params.toString()}`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create batch");

      setState((prev) => ({
        ...prev,
        selectedBatch: data,
        batchRows: [],
        openCreateBatch: false,
        success: "Batch created successfully",
        loading: false,
      }));

      // Reload batches
      loadBatches();
      return data;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
      throw error;
    }
  }, [loadBatches]);

  // Load statements for a period
  const loadStatementsForPeriod = useCallback(async (from, to, status = "FINALIZED") => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      // Validate dates are provided
      if (!from || !to) {
        throw new Error("Period start and end dates are required");
      }

      const params = new URLSearchParams({
        from: from,
        to: to,
        status: status,
      });

      const response = await apiRequest(
        `/financial-statements/statements/period?${params.toString()}`
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load statements");
      setState((prev) => ({ ...prev, periodStatements: data, loading: false }));
      return data;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
      throw error;
    }
  }, []);

  // Add statement to batch rows
  const addStatementRow = useCallback((statement) => {
    // Only add payable statements (netDue > 0); negative balances carry forward
    if (statement.netDue <= 0) return;
    setState((prev) => ({
      ...prev,
      batchRows: [
        ...prev.batchRows,
        {
          id: Math.random().toString(36).substr(2, 9),
          statementId: statement.id,
          personId: statement.personId,
          personName: statement.personName,
          personType: statement.personType,
          netDue: statement.netDue,
          payAmount: statement.netDue,
          method: "",
          referenceNumber: "",
          notes: "",
          status: "PENDING",
        },
      ],
    }));
  }, []);

  // Update batch row
  const updateBatchRow = useCallback((rowId, updates) => {
    setState((prev) => ({
      ...prev,
      batchRows: prev.batchRows.map((row) =>
        row.id === rowId ? { ...row, ...updates } : row
      ),
    }));
  }, []);

  // Remove batch row
  const removeBatchRow = useCallback((rowId) => {
    setState((prev) => ({
      ...prev,
      batchRows: prev.batchRows.filter((row) => row.id !== rowId),
    }));
  }, []);

  // Add statement rows from period
  const addStatementsFromPeriod = useCallback(async (batchId) => {
    try {
      // Get batch details to know the period
      const response = await apiRequest(`/payments/batches/${batchId}`);
      const batch = await response.json();

      if (!response.ok) throw new Error("Failed to load batch");

      // Load statements for the batch period
      // Note: PaymentBatch uses periodStart/periodEnd, not periodFrom/periodTo
      const statements = await loadStatementsForPeriod(
        batch.periodStart,
        batch.periodEnd
      );

      if (statements.length === 0) {
        setState((prev) => ({
          ...prev,
          success: "No finalized statements found for this period",
        }));
        return;
      }

      // Filter out statements already in the batch
      setState((prev) => {
        const existingStatementIds = new Set(
          prev.batchRows.map((row) => row.statementId)
        );
        // Only include payable statements (netDue > 0) and exclude duplicates
        const newStatements = statements.filter(
          (s) => !existingStatementIds.has(s.id) && s.netDue > 0
        );

        if (newStatements.length === 0) {
          const hasNegative = statements.some((s) => s.netDue <= 0);
          const msg = hasNegative
            ? "No payable statements for this period. Negative balances carry forward to the next period."
            : "All payable statements from this period are already in the batch";
          return {
            ...prev,
            success: msg,
          };
        }

        const newRows = newStatements.map((statement) => ({
          id: Math.random().toString(36).substr(2, 9),
          statementId: statement.id,
          personId: statement.personId,
          personName: statement.personName,
          personType: statement.personType,
          netDue: statement.netDue,
          payAmount: statement.netDue,
          method: "",
          referenceNumber: "",
          notes: "",
          status: "PENDING",
        }));

        return {
          ...prev,
          batchRows: [...prev.batchRows, ...newRows],
          success: `Added ${newStatements.length} payable statements to batch`,
        };
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error.message,
      }));
    }
  }, [loadStatementsForPeriod]);

  // Post batch (transition from DRAFT to POSTED)
  const postBatch = useCallback(async (batchId) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      // Validate all rows have required fields before posting
      for (const row of state.batchRows) {
        if (!row.method || row.method.trim() === "") {
          throw new Error(
            `Payment method is required for ${row.personName}. Please select a payment method before posting.`
          );
        }

        if (!row.payAmount || row.payAmount <= 0) {
          throw new Error(
            `Valid payment amount is required for ${row.personName}. Amount must be greater than 0.`
          );
        }

        if (row.netDue > 0 && row.payAmount > row.netDue) {
          throw new Error(
            `Payment amount for ${row.personName} ($${row.payAmount.toFixed(2)}) cannot exceed the payable amount ($${row.netDue.toFixed(2)}).`
          );
        }
      }

      // First, set the statement IDs on the batch
      const statementIds = state.batchRows.map((row) => row.statementId).join(",");
      console.log(`batchRows:`, state.batchRows);
      console.log(`Setting statement IDs on batch: ${statementIds}`);

      const setStatementsUrl = `/payments/batches/${batchId}/set-statements?statementIds=${encodeURIComponent(statementIds)}`;
      console.log(`setStatements URL: ${setStatementsUrl}`);

      const setStatementsResponse = await apiRequest(setStatementsUrl, {
        method: "PUT",
      });

      console.log(`setStatements response status: ${setStatementsResponse.status}`);
      const setStatementsData = await setStatementsResponse.json();
      console.log(`setStatements response data:`, setStatementsData);

      if (!setStatementsResponse.ok) {
        throw new Error("Failed to set statements on batch: " + JSON.stringify(setStatementsData));
      }

      console.log(`Posting batch ${batchId} with ${state.batchRows.length} statements...`);

      // Create payment records for each statement BEFORE posting the batch
      for (const row of state.batchRows) {
        // Find the payment method object to get the ID
        const paymentMethod = state.paymentMethods.find(
          (pm) => pm.code === row.method || pm.methodCode === row.method
        );

        if (!paymentMethod) {
          throw new Error(
            `Payment method "${row.method}" not found in system. Please check your payment method selection.`
          );
        }

        // Use the correct backend endpoint to add payment to batch
        // This creates a record in the payment table
        const params = new URLSearchParams({
          statementId: row.statementId,
          amount: row.payAmount,
          paymentDate: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
          paymentMethodId: paymentMethod.id,
          ...(row.referenceNumber && { referenceNumber: row.referenceNumber }),
          ...(row.notes && { notes: row.notes }),
        });

        const paymentResponse = await apiRequest(
          `/payments/batches/${batchId}/payments?${params.toString()}`,
          {
            method: "POST",
          }
        );

        if (!paymentResponse.ok) {
          const errorData = await paymentResponse.json();
          throw new Error(
            `Failed to create payment for statement ${row.statementId}: ${
              errorData.message || "Unknown error"
            }`
          );
        }
      }

      // Then post the batch
      const response = await apiRequest(`/payments/batches/${batchId}/post`, {
        method: "PUT",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to post batch");

      setState((prev) => ({
        ...prev,
        selectedBatch: data,
        openPostBatch: false,
        success: "Batch posted successfully",
        loading: false,
      }));

      loadBatches();
      return data;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
      throw error;
    }
  }, [loadBatches, state]);

  // Complete batch (transition from POSTED to PROCESSED)
  // Note: Payments should already be created during POST. This marks the batch as complete and updates statement paid amounts.
  const completeBatch = useCallback(async (batchId) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      // Build payment summary to send to backend
      // Backend will use this to update the paid_amount on statements
      const paymentsByStatement = {};
      for (const row of state.batchRows) {
        if (!paymentsByStatement[row.statementId]) {
          paymentsByStatement[row.statementId] = 0;
        }
        paymentsByStatement[row.statementId] += row.payAmount || 0;
      }

      // First, update each statement with the paid amount directly (in case backend doesn't)
      for (const row of state.batchRows) {
        try {
          const updateResponse = await apiRequest(
            `/financial-statements/statements/${row.statementId}`,
            {
              method: "PUT",
              body: JSON.stringify({
                paidAmount: row.payAmount,
                status: "PAID",
              }),
            }
          );

          if (!updateResponse.ok) {
            console.warn(`Warning: Failed to update statement ${row.statementId} paid amount`);
          }
        } catch (error) {
          console.warn(`Error updating statement ${row.statementId}:`, error);
        }
      }

      // Then complete the batch and provide payment data
      const response = await apiRequest(`/payments/batches/${batchId}/complete`, {
        method: "PUT",
        body: JSON.stringify({
          paymentsByStatement: paymentsByStatement,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to complete batch");

      setState((prev) => ({
        ...prev,
        selectedBatch: data,
        batchRows: [],
        success: "Batch completed successfully and statements updated",
        loading: false,
      }));

      loadBatches();
      return data;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
      throw error;
    }
  }, [loadBatches, state.batchRows]);

  // Record individual payment for a statement
  const recordPayment = useCallback(async (statementId, paymentData) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiRequest(
        `/financial-statements/statements/${statementId}/paid`,
        {
          method: "PUT",
          body: JSON.stringify(paymentData),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to record payment");

      setState((prev) => ({
        ...prev,
        success: "Payment recorded successfully",
        loading: false,
      }));

      return data;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
      throw error;
    }
  }, []);

  // Recall a statement
  const recallStatement = useCallback(async (statementId, reason) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiRequest(
        `/payments/statements/${statementId}/recall?reason=${encodeURIComponent(reason)}`,
        {
          method: "PUT",
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to recall statement");

      setState((prev) => ({
        ...prev,
        openRecallStatement: false,
        recallReason: "",
        success: "Statement recalled successfully",
        loading: false,
      }));

      return data;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
      throw error;
    }
  }, []);

  // Load audit history for a statement
  const loadAuditHistory = useCallback(async (statementId) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiRequest(`/payments/statements/${statementId}/history`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load history");
      return data;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
      throw error;
    }
  }, []);

  // Load payment methods
  const loadPaymentMethods = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiRequest("/payments/payment-methods");

      // If endpoint not found (404) or not implemented, use default methods
      if (response.status === 404 || response.status === 403) {
        // Default payment methods
        const defaultMethods = [
          { id: 1, code: "CHQ", name: "Cheque", requiresReference: true },
          { id: 2, code: "DD", name: "Direct Deposit", requiresReference: true },
          { id: 3, code: "CASH", name: "Cash", requiresReference: false },
          { id: 4, code: "ETRF", name: "E-Transfer", requiresReference: true },
        ];
        console.log("Using default payment methods:", defaultMethods);
        setState((prev) => ({
          ...prev,
          paymentMethods: defaultMethods,
          loading: false,
        }));
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load payment methods");

      // If API returns empty array, use defaults
      if (!Array.isArray(data) || data.length === 0) {
        console.log("API returned empty data, using default payment methods");
        const defaultMethods = [
          { id: 1, code: "CHQ", name: "Cheque", requiresReference: true },
          { id: 2, code: "DD", name: "Direct Deposit", requiresReference: true },
          { id: 3, code: "CASH", name: "Cash", requiresReference: false },
          { id: 4, code: "ETRF", name: "E-Transfer", requiresReference: true },
        ];
        setState((prev) => ({ ...prev, paymentMethods: defaultMethods, loading: false }));
        return;
      }

      console.log("Loaded payment methods from API:", data);
      setState((prev) => ({ ...prev, paymentMethods: data, loading: false }));
    } catch (error) {
      // Use default methods on error
      console.error("Error loading payment methods, using defaults:", error);
      const defaultMethods = [
        { id: 1, code: "CHQ", name: "Cheque", requiresReference: true },
        { id: 2, code: "DD", name: "Direct Deposit", requiresReference: true },
        { id: 3, code: "CASH", name: "Cash", requiresReference: false },
        { id: 4, code: "ETRF", name: "E-Transfer", requiresReference: true },
      ];
      setState((prev) => ({
        ...prev,
        paymentMethods: defaultMethods,
        loading: false,
      }));
    }
  }, []);

  // Get payments for a batch
  const getPaymentsForBatch = useCallback(async (batchId) => {
    try {
      const response = await apiRequest(`/payments/batches/${batchId}`);
      const batch = await response.json();

      if (!response.ok) return [];

      // Try to fetch payment records if the batch has statement IDs
      if (batch.statementIds) {
        const statementIdArray = batch.statementIds.split(",").map((id) => id.trim());

        // Fetch payments for each statement in this batch
        const paymentsByStatement = {};
        for (const statementId of statementIdArray) {
          try {
            const paymentResponse = await apiRequest(`/payments/statements/${statementId}`);
            if (paymentResponse.ok) {
              const payments = await paymentResponse.json();
              if (payments && payments.length > 0) {
                // Get the most recent payment for this statement
                paymentsByStatement[statementId] = payments[0];
              }
            }
          } catch (error) {
            console.warn(`Failed to fetch payments for statement ${statementId}`);
          }
        }

        return paymentsByStatement;
      }

      return {};
    } catch (error) {
      console.warn("Failed to get payments for batch:", error);
      return {};
    }
  }, []);

  // Select a batch for editing
  const selectBatch = useCallback(
    async (batch) => {
      setState((prev) => ({
        ...prev,
        selectedBatch: batch,
        loading: true,
      }));

      try {
        // Fetch full batch details to get associated statements/payment rows
        const response = await apiRequest(`/payments/batches/${batch.id}`);
        const batchDetails = await response.json();

        if (!response.ok) throw new Error("Failed to load batch details");

        let paymentRows = [];

        // If batch is PROCESSED or POSTED, fetch statement payments from the statement_payment table
        if (batchDetails.status === "POSTED" || batchDetails.status === "PROCESSED") {
          try {
            const statementPaymentsResponse = await apiRequest(
              `/payments/batches/${batch.id}/statement-payments`
            );
            if (statementPaymentsResponse.ok) {
              const statementPayments = await statementPaymentsResponse.json();
              paymentRows = statementPayments.map((payment) => ({
                id: Math.random().toString(36).substr(2, 9),
                statementId: payment.statementId,
                personId: payment.personId,
                personName: payment.personName,
                personType: payment.personType,
                netDue: 0, // Not available from payment record
                payAmount: parseFloat(payment.amount),
                method: payment.paymentMethod?.methodCode || payment.paymentMethod || "",
                referenceNumber: payment.referenceNumber || "",
                notes: payment.notes || "",
                status: payment.status || "PENDING",
              }));
            }
          } catch (error) {
            console.warn("Failed to load statement payments:", error);
          }
        }

        // If no payment rows found (DRAFT batch), fetch statements for the period
        if (!paymentRows || paymentRows.length === 0) {
          const statements = await loadStatementsForPeriod(
            batchDetails.periodStart || batchDetails.periodFrom,
            batchDetails.periodEnd || batchDetails.periodTo
          );

          // Try to load payment records for this batch
          const paymentsByStatement = await getPaymentsForBatch(batch.id);

          paymentRows = statements
            .filter((statement) => statement.netDue > 0) // Only payable statements
            .map((statement) => {
              const payment = paymentsByStatement[statement.id];

              return {
                id: Math.random().toString(36).substr(2, 9),
                statementId: statement.id,
                personId: statement.personId,
                personName: statement.personName,
                personType: statement.personType,
                netDue: statement.netDue,
                payAmount: payment?.amount || statement.netDue,
                method: payment?.paymentMethod || "",
                referenceNumber: payment?.referenceNumber || "",
                notes: payment?.notes || "",
                status: payment ? "COMPLETED" : "PENDING",
              };
            });
        }

        setState((prev) => ({
          ...prev,
          selectedBatch: batchDetails,
          batchRows: paymentRows,
          loading: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error.message,
          loading: false,
        }));
      }
    },
    [loadStatementsForPeriod, getPaymentsForBatch]
  );

  // Clear selections and reset state
  const clearSelection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedBatch: null,
      batchRows: [],
      periodStatements: [],
    }));
  }, []);

  // Dialog state handlers
  const openCreateBatchDialog = useCallback(() => {
    setState((prev) => ({ ...prev, openCreateBatch: true }));
  }, []);

  const closeCreateBatchDialog = useCallback(() => {
    setState((prev) => ({ ...prev, openCreateBatch: false }));
  }, []);

  const openPostBatchDialog = useCallback(() => {
    setState((prev) => ({ ...prev, openPostBatch: true }));
  }, []);

  const closePostBatchDialog = useCallback(() => {
    setState((prev) => ({ ...prev, openPostBatch: false }));
  }, []);

  const openRecallDialog = useCallback((statement) => {
    setState((prev) => ({
      ...prev,
      openRecallStatement: true,
      selectedStatement: statement,
    }));
  }, []);

  const closeRecallDialog = useCallback(() => {
    setState((prev) => ({
      ...prev,
      openRecallStatement: false,
      selectedStatement: null,
      recallReason: "",
    }));
  }, []);

  const openAuditDialog = useCallback((statement) => {
    setState((prev) => ({
      ...prev,
      openAuditHistory: true,
      selectedStatement: statement,
    }));
  }, []);

  const closeAuditDialog = useCallback(() => {
    setState((prev) => ({
      ...prev,
      openAuditHistory: false,
      selectedStatement: null,
    }));
  }, []);

  const setRecallReason = useCallback((reason) => {
    setState((prev) => ({ ...prev, recallReason: reason }));
  }, []);

  const clearMessages = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
      success: null,
    }));
  }, []);

  return {
    ...state,
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
  };
};
