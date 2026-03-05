"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Paper, Tabs, Tab, Alert, Grid } from "@mui/material";
import GlobalNav from "../components/GlobalNav";
import { getCurrentUser } from "../lib/api";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// Tab Components
import ExpenseCategoriesTab from "./tabs/ExpenseCategoriesTab";
import RevenueCategoriesTab from "./tabs/RevenueCategoriesTab";
import LeasePlansRatesTab from "./tabs/LeasePlansRatesTab";
import LeaseRateOverridesTab from "./tabs/LeaseRateOverridesTab";
import MerchantMappingsTab from "./tabs/MerchantMappingsTab";
import AttributeCostsTab from "../expenses/components/AttributeCostsTab";
import ItemRatesTab from "./tabs/ItemRatesTab";
import ItemRateOverridesTab from "./tabs/ItemRateOverridesTab";

// Statistics Component
import FinancialStats from "./components/FinancialStats";

// Help Dialog Component
import FinancialHelpDialog from "./components/FinancialHelpDialog";

// Icons
import {
  Category as CategoryIcon,
  TrendingUp as RevenueIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  CreditCard as MerchantIcon,
  Settings as AttributeIcon,
  Speed as SpeedIcon,
  Tune as TuneIcon,
} from "@mui/icons-material";

export default function FinancialSetupPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  // Statistics data
  const [stats, setStats] = useState({
    expenseCategories: 0,
    revenueCategories: 0,
    leasePlans: 0,
    leaseRates: 0,
    leaseRateOverrides: 0,
    merchantMappings: 0,
    attributeCosts: 0,
  });

  const canEdit = currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER";
  const canDelete = currentUser?.role === "ADMIN";

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !["ADMIN", "MANAGER", "ACCOUNTANT", "DISPATCHER"].includes(user.role)) {
      window.location.href = "/";
      return;
    }
    setCurrentUser(user);
    setLoading(false);
  }, []);

  const updateStats = (newStats) => {
    setStats((prev) => ({ ...prev, ...newStats }));
  };

  if (!currentUser) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
        <GlobalNav currentUser={currentUser} />

        <Box sx={{ p: 3 }}>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: "#3e5244" }}>
            Financial Configuration
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Manage expense categories, revenue categories, lease plans, rates, overrides, merchant mappings, and attribute costs
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
              {success}
            </Alert>
          )}

          {/* Statistics Cards */}
          <FinancialStats stats={stats} onHelpClick={() => setHelpDialogOpen(true)} />

          {/* Tabs */}
          <Paper sx={{ overflow: "hidden", border: "2px solid #1565c0", borderRadius: 2 }}>
            <Box sx={{ bgcolor: "#1565c0", px: 2, py: 1.5 }}>
              <Tabs
                value={currentTab}
                onChange={(e, newValue) => setCurrentTab(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                TabIndicatorProps={{ sx: { display: "none" } }}
                sx={{
                  minHeight: 42,
                  "& .MuiTab-root": {
                    minHeight: 42, py: 1, px: 3, mr: 1.5, borderRadius: "24px",
                    color: "rgba(255,255,255,0.75)", fontWeight: 600, fontSize: "0.9rem",
                    textTransform: "none", bgcolor: "rgba(255,255,255,0.1)",
                    border: "1.5px solid rgba(255,255,255,0.35)",
                    transition: "all 0.2s ease",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.2)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.6)" },
                    "&.Mui-selected": { bgcolor: "#fff", color: "#1565c0", border: "1.5px solid #fff", fontWeight: 700, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" },
                    "& .MuiTab-iconWrapper": { mr: 1 },
                  },
                }}
              >
                <Tab label="Expense Categories" icon={<CategoryIcon />} iconPosition="start" />
                <Tab label="Revenue Categories" icon={<RevenueIcon />} iconPosition="start" />
                <Tab label="Lease Plans & Rates" icon={<ReceiptIcon />} iconPosition="start" />
                <Tab label="Lease Rate Overrides" icon={<MoneyIcon />} iconPosition="start" />
                <Tab label="Merchant Mappings" icon={<MerchantIcon />} iconPosition="start" />
                <Tab label="Attribute Costs" icon={<AttributeIcon />} iconPosition="start" />
                <Tab label="Item Rates" icon={<SpeedIcon />} iconPosition="start" />
                <Tab label="Item Rate Overrides" icon={<TuneIcon />} iconPosition="start" />
              </Tabs>
            </Box>

            {/* Tab Content */}
            {currentTab === 0 && (
              <ExpenseCategoriesTab
                canEdit={canEdit}
                canDelete={canDelete}
                setError={setError}
                setSuccess={setSuccess}
                updateStats={updateStats}
              />
            )}

            {currentTab === 1 && (
              <RevenueCategoriesTab
                canEdit={canEdit}
                canDelete={canDelete}
                setError={setError}
                setSuccess={setSuccess}
                updateStats={updateStats}
              />
            )}

            {currentTab === 2 && (
              <LeasePlansRatesTab
                canEdit={canEdit}
                canDelete={canDelete}
                setError={setError}
                setSuccess={setSuccess}
                updateStats={updateStats}
              />
            )}

            {currentTab === 3 && (
              <LeaseRateOverridesTab
                canEdit={canEdit}
                canDelete={canDelete}
                setError={setError}
                setSuccess={setSuccess}
                updateStats={updateStats}
              />
            )}

            {currentTab === 4 && (
              <MerchantMappingsTab
                canEdit={canEdit}
                canDelete={canDelete}
                setError={setError}
                setSuccess={setSuccess}
                updateStats={updateStats}
              />
            )}

            {currentTab === 5 && (
              <AttributeCostsTab
                canEdit={canEdit}
              />
            )}

            {currentTab === 6 && (
              <ItemRatesTab
                canEdit={canEdit}
                canDelete={canDelete}
                setError={setError}
                setSuccess={setSuccess}
                updateStats={updateStats}
              />
            )}

            {currentTab === 7 && (
              <ItemRateOverridesTab
                canEdit={canEdit}
                canDelete={canDelete}
                setError={setError}
                setSuccess={setSuccess}
                updateStats={updateStats}
              />
            )}
          </Paper>

          {/* Help Dialog */}
          <FinancialHelpDialog open={helpDialogOpen} onClose={() => setHelpDialogOpen(false)} />
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
