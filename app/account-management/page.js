"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Alert,
  Grid,
  Card,
  CardContent,
  IconButton,
} from "@mui/material";
import {
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  Assignment as AllChargesIcon,
  Description as InvoiceIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import GlobalNav from "../components/GlobalNav";
import { useAccountManagement } from "./hooks/useAccountManagement";
import {
  StatisticsCards,
  CustomersTab,
  TripChargesTab,
  AllChargesTab,
  InvoicesTab,
  CustomerDialog,
  ChargeDialog,
  BulkEditConfirmDialog,
  GenerateInvoiceDialog,
  InvoiceDetailsDialog,
  RecordPaymentDialog,
  CancelInvoiceDialog,
} from "./components";

const accountCards = [
  { key: "customers", label: "Account Customers", description: "Manage corporate customer accounts and profiles", icon: BusinessIcon, color: "#1565c0" },
  { key: "tripCharges", label: "Trip Charges", description: "View and manage trip charges by customer", icon: ReceiptIcon, color: "#c62828" },
  { key: "allCharges", label: "All Charges", description: "Search and filter across all charge records", icon: AllChargesIcon, color: "#e65100" },
  { key: "invoices", label: "Invoices", description: "Generate, send, and manage customer invoices", icon: InvoiceIcon, color: "#2e7d32" },
];

export default function AccountManagementPage() {
  const [allChargesSummary, setAllChargesSummary] = useState(null);

  const {
    // Core state
    currentUser,
    currentTab,
    setCurrentTab,
    loading,
    error,
    setError,
    success,
    setSuccess,

    // Permissions
    canEdit,
    canBulkEdit,
    canMarkPaid,

    // Customers
    customers,
    filteredCustomers,
    filterAccountId,
    setFilterAccountId,
    filterCompanyName,
    setFilterCompanyName,
    filterActiveStatus,
    setFilterActiveStatus,
    filterAccountType,
    setFilterAccountType,
    openCustomerDialog,
    setOpenCustomerDialog,
    editingCustomer,
    customerFormData,
    setCustomerFormData,
    handleOpenCustomerDialog,
    handleSaveCustomer,
    handleToggleCustomerActive,
    handleSelectCustomer,
    applyCustomerFilters,
    clearCustomerFilters,

    // Account Customers - Outstanding Balance
    showAllCustomers,
    setShowAllCustomers,

    // Trip Charges - Outstanding Balance
    showAllCustomersInCharges,
    setShowAllCustomersInCharges,

    // Trip Charges
    selectedCustomer,
    charges,
    openChargeDialog,
    setOpenChargeDialog,
    editingCharge,
    chargeFormData,
    setChargeFormData,
    handleOpenChargeDialog,
    handleSaveCharge,
    handleMarkChargePaid,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    handleFilterCharges,

    // Bulk Edit
    bulkEditMode,
    bulkEditCharges,
    confirmBulkEditDialog,
    setConfirmBulkEditDialog,
    handleEnterBulkEdit,
    handleCancelBulkEdit,
    handleBulkEditChange,
    handleSaveBulkEdit,
    handleConfirmBulkEdit,

    // All Charges
    filteredCharges,
    filterCustomerName,
    setFilterCustomerName,
    filterCabId,
    setFilterCabId,
    filterDriverId,
    setFilterDriverId,
    filterStartDate,
    setFilterStartDate,
    filterEndDate,
    setFilterEndDate,
    filterPaidStatus,
    setFilterPaidStatus,
    applyFilters,
    clearFilters,
    allChargesBulkEdit,
    bulkEditAllCharges,
    confirmAllChargesBulkEditDialog,
    setConfirmAllChargesBulkEditDialog,
    handleEnterAllChargesBulkEdit,
    handleCancelAllChargesBulkEdit,
    handleAllChargesBulkEditChange,
    handleSaveAllChargesBulkEdit,
    handleConfirmAllChargesBulkEdit,

    // Lookup data
    cabs,
    drivers,
    paymentMethods,

    // Invoices
    invoices,
    filteredInvoices,
    selectedInvoice,
    openGenerateInvoiceDialog,
    setOpenGenerateInvoiceDialog,
    openInvoiceDetailsDialog,
    setOpenInvoiceDetailsDialog,
    openRecordPaymentDialog,
    setOpenRecordPaymentDialog,
    isRecordingPayment,
    openCancelInvoiceDialog,
    setOpenCancelInvoiceDialog,
    cancelReason,
    setCancelReason,
    generateInvoiceFormData,
    setGenerateInvoiceFormData,
    paymentFormData,
    setPaymentFormData,
    invoiceFilterCustomerId,
    setInvoiceFilterCustomerId,
    invoiceFilterStatus,
    setInvoiceFilterStatus,
    handleOpenGenerateInvoiceDialog,
    handleGenerateInvoice,
    handleViewInvoice,
    handleSendInvoice,
    handleSendInvoiceViaEmail,
    handleDownloadInvoicePDF,
    handleOpenCancelInvoiceDialog,
    handleCancelInvoice,
    handleOpenRecordPaymentDialog,
    handleRecordPayment,
    applyInvoiceFilters,
    clearInvoiceFilters,
  } = useAccountManagement();

  const handleCardClick = (key) => {
    setCurrentTab(currentTab === key ? null : key);
  };

  if (loading) {
    return (
      <Box>
        <GlobalNav currentUser={currentUser} title="Account Management" />
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography>Loading...</Typography>
        </Box>
      </Box>
    );
  }

  const activeCat = accountCards.find(c => c.key === currentTab);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f6f9fc' }}>
      <GlobalNav currentUser={currentUser} title="Account Management" />
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#3e5244' }}>
            Account Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage corporate customers and their charges
          </Typography>
        </Box>

        {/* Success/Error Messages */}
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

        {/* Statistics Cards */}
        <StatisticsCards
          customers={customers}
          filteredCustomers={filteredCustomers}
          charges={charges}
          filteredCharges={filteredCharges}
          invoices={invoices}
          filteredInvoices={filteredInvoices}
          currentTab={currentTab}
          filterCustomerName={filterCustomerName}
          filterCabId={filterCabId}
          filterDriverId={filterDriverId}
          filterStartDate={filterStartDate}
          filterEndDate={filterEndDate}
        />

        {/* Category Cards Grid */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {accountCards.map((cat) => {
            const Icon = cat.icon;
            const isExpanded = currentTab === cat.key;
            return (
              <Grid item xs={12} sm={6} md={3} key={cat.key}>
                <Card
                  elevation={isExpanded ? 4 : 1}
                  sx={{
                    border: isExpanded ? `2px solid ${cat.color}` : "1px solid #e5e7eb",
                    borderRadius: 2,
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    "&:hover": { boxShadow: 3, borderColor: cat.color },
                  }}
                  onClick={() => handleCardClick(cat.key)}
                >
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 44, height: 44, borderRadius: 1.5,
                          backgroundColor: `${cat.color}15`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon sx={{ color: cat.color, fontSize: 24 }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ lineHeight: 1.3 }}>
                          {cat.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                          {cat.description}
                        </Typography>
                      </Box>
                      <ExpandMoreIcon
                        sx={{
                          color: "text.secondary",
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Expanded Content */}
        {activeCat && (
          <Paper
            elevation={2}
            sx={{
              border: `2px solid ${activeCat.color}`,
              borderRadius: 2,
              overflow: "hidden",
              mb: 3,
            }}
          >
            <Box
              sx={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                px: 3, py: 1.5,
                backgroundColor: `${activeCat.color}10`,
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <activeCat.icon sx={{ color: activeCat.color, fontSize: 22 }} />
                <Typography variant="h6" fontWeight={600} sx={{ color: activeCat.color }}>
                  {activeCat.label}
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => setCurrentTab(null)}>
                <CloseIcon />
              </IconButton>
            </Box>

            {currentTab === "customers" && (
              <CustomersTab
                filteredCustomers={filteredCustomers}
                filterAccountId={filterAccountId}
                setFilterAccountId={setFilterAccountId}
                filterCompanyName={filterCompanyName}
                setFilterCompanyName={setFilterCompanyName}
                filterActiveStatus={filterActiveStatus}
                setFilterActiveStatus={setFilterActiveStatus}
                filterAccountType={filterAccountType}
                setFilterAccountType={setFilterAccountType}
                applyCustomerFilters={applyCustomerFilters}
                clearCustomerFilters={clearCustomerFilters}
                canEdit={canEdit}
                handleOpenCustomerDialog={handleOpenCustomerDialog}
                handleToggleCustomerActive={handleToggleCustomerActive}
                handleSelectCustomer={handleSelectCustomer}
                handleOpenGenerateInvoiceDialog={handleOpenGenerateInvoiceDialog}
                setCurrentTab={setCurrentTab}
                showAllCustomers={showAllCustomers}
                setShowAllCustomers={setShowAllCustomers}
              />
            )}

            {currentTab === "tripCharges" && (
              <TripChargesTab
                customers={customers}
                selectedCustomer={selectedCustomer}
                charges={charges}
                bulkEditMode={bulkEditMode}
                bulkEditCharges={bulkEditCharges}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                canEdit={canEdit}
                canBulkEdit={canBulkEdit}
                canMarkPaid={canMarkPaid}
                showAllCustomersInCharges={showAllCustomersInCharges}
                setShowAllCustomersInCharges={setShowAllCustomersInCharges}
                handleSelectCustomer={handleSelectCustomer}
                handleOpenChargeDialog={handleOpenChargeDialog}
                handleMarkChargePaid={handleMarkChargePaid}
                handleEnterBulkEdit={handleEnterBulkEdit}
                handleCancelBulkEdit={handleCancelBulkEdit}
                handleBulkEditChange={handleBulkEditChange}
                handleSaveBulkEdit={handleSaveBulkEdit}
                handleFilterCharges={handleFilterCharges}
              />
            )}

            {currentTab === "allCharges" && (
              <AllChargesTab
                filteredCharges={filteredCharges}
                cabs={cabs}
                drivers={drivers}
                filterCustomerName={filterCustomerName}
                setFilterCustomerName={setFilterCustomerName}
                filterCabId={filterCabId}
                setFilterCabId={setFilterCabId}
                filterDriverId={filterDriverId}
                setFilterDriverId={setFilterDriverId}
                filterStartDate={filterStartDate}
                setFilterStartDate={setFilterStartDate}
                filterEndDate={filterEndDate}
                setFilterEndDate={setFilterEndDate}
                filterPaidStatus={filterPaidStatus}
                setFilterPaidStatus={setFilterPaidStatus}
                applyFilters={applyFilters}
                clearFilters={clearFilters}
                allChargesBulkEdit={allChargesBulkEdit}
                bulkEditAllCharges={bulkEditAllCharges}
                canEdit={canEdit}
                canBulkEdit={canBulkEdit}
                canMarkPaid={canMarkPaid}
                handleEnterAllChargesBulkEdit={handleEnterAllChargesBulkEdit}
                handleCancelAllChargesBulkEdit={handleCancelAllChargesBulkEdit}
                handleAllChargesBulkEditChange={handleAllChargesBulkEditChange}
                handleSaveAllChargesBulkEdit={handleSaveAllChargesBulkEdit}
                handleMarkChargePaid={handleMarkChargePaid}
                onTotalsUpdate={setAllChargesSummary}
              />
            )}

            {currentTab === "invoices" && (
              <InvoicesTab
                customers={customers}
                filteredInvoices={filteredInvoices}
                invoiceFilterCustomerId={invoiceFilterCustomerId}
                setInvoiceFilterCustomerId={setInvoiceFilterCustomerId}
                invoiceFilterStatus={invoiceFilterStatus}
                setInvoiceFilterStatus={setInvoiceFilterStatus}
                applyInvoiceFilters={applyInvoiceFilters}
                clearInvoiceFilters={clearInvoiceFilters}
                canEdit={canEdit}
                canMarkPaid={canMarkPaid}
                handleOpenGenerateInvoiceDialog={handleOpenGenerateInvoiceDialog}
                handleViewInvoice={handleViewInvoice}
                handleSendInvoice={handleSendInvoice}
                handleOpenCancelInvoiceDialog={handleOpenCancelInvoiceDialog}
                handleOpenRecordPaymentDialog={handleOpenRecordPaymentDialog}
              />
            )}
          </Paper>
        )}

        {/* Dialogs */}
        <CustomerDialog
          open={openCustomerDialog}
          onClose={() => setOpenCustomerDialog(false)}
          editingCustomer={editingCustomer}
          customerFormData={customerFormData}
          setCustomerFormData={setCustomerFormData}
          handleSaveCustomer={handleSaveCustomer}
          error={error}
        />

        <ChargeDialog
          open={openChargeDialog}
          onClose={() => setOpenChargeDialog(false)}
          editingCharge={editingCharge}
          chargeFormData={chargeFormData}
          setChargeFormData={setChargeFormData}
          handleSaveCharge={handleSaveCharge}
          cabs={cabs}
          drivers={drivers}
          error={error}
        />

        <BulkEditConfirmDialog
          open={confirmBulkEditDialog}
          onClose={() => setConfirmBulkEditDialog(false)}
          onConfirm={handleConfirmBulkEdit}
          chargesCount={bulkEditCharges.length}
          customerName={selectedCustomer?.companyName}
          isAllCharges={false}
        />

        <BulkEditConfirmDialog
          open={confirmAllChargesBulkEditDialog}
          onClose={() => setConfirmAllChargesBulkEditDialog(false)}
          onConfirm={handleConfirmAllChargesBulkEdit}
          chargesCount={bulkEditAllCharges.length}
          isAllCharges={true}
          affectedCustomers={[...new Set(bulkEditAllCharges.map(c => c.customerName))]}
        />

        <GenerateInvoiceDialog
          open={openGenerateInvoiceDialog}
          onClose={() => setOpenGenerateInvoiceDialog(false)}
          customers={customers}
          generateInvoiceFormData={generateInvoiceFormData}
          setGenerateInvoiceFormData={setGenerateInvoiceFormData}
          handleGenerateInvoice={handleGenerateInvoice}
          error={error}
        />

        <InvoiceDetailsDialog
          open={openInvoiceDetailsDialog}
          onClose={() => setOpenInvoiceDetailsDialog(false)}
          selectedInvoice={selectedInvoice}
          canMarkPaid={canMarkPaid}
          handleOpenRecordPaymentDialog={handleOpenRecordPaymentDialog}
          handleSendInvoiceViaEmail={handleSendInvoiceViaEmail}
          handleDownloadInvoicePDF={handleDownloadInvoicePDF}
        />

        <RecordPaymentDialog
          open={openRecordPaymentDialog}
          onClose={() => setOpenRecordPaymentDialog(false)}
          selectedInvoice={selectedInvoice}
          paymentFormData={paymentFormData}
          setPaymentFormData={setPaymentFormData}
          handleRecordPayment={handleRecordPayment}
          error={error}
          paymentMethods={paymentMethods}
          isLoading={isRecordingPayment}
        />

        <CancelInvoiceDialog
          open={openCancelInvoiceDialog}
          onClose={() => setOpenCancelInvoiceDialog(false)}
          selectedInvoice={selectedInvoice}
          cancelReason={cancelReason}
          setCancelReason={setCancelReason}
          handleCancelInvoice={handleCancelInvoice}
          error={error}
        />
      </Box>
    </Box>
  );
}
