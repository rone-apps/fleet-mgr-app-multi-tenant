"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Paper, Alert, Grid, Card, CardContent, CardActionArea, Collapse, IconButton } from "@mui/material";
import { Close as CloseIcon, ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import GlobalNav from "../components/GlobalNav";
import { getCurrentUser } from "../lib/api";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// Tab Components
import ExpenseCategoriesTab from "./tabs/ExpenseCategoriesTab";
import RevenueCategoriesTab from "./tabs/RevenueCategoriesTab";
import LeasePlansRatesTab from "./tabs/LeasePlansRatesTab";
import LeaseRateOverridesTab from "./tabs/LeaseRateOverridesTab";
import AttributeCostsTab from "../expenses/components/AttributeCostsTab";
import ItemRatesTab from "./tabs/ItemRatesTab";
import ItemRateOverridesTab from "./tabs/ItemRateOverridesTab";
import TaxesTab from "./tabs/TaxesTab";
import CommissionsTab from "./tabs/CommissionsTab";

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
  Settings as AttributeIcon,
  Speed as SpeedIcon,
  Tune as TuneIcon,
  AccountBalance as TaxIcon,
  Percent as CommissionIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";

const groups = [
  {
    key: "operatingExpense",
    title: "Operating Expense Configuration",
    description: "Configure monthly recurring expenses, one-time expenses, and other item-based costs",
    icon: SettingsIcon,
    color: "#e53935",
    items: [
      { key: "expenseCategories", label: "Expense Categories", description: "Define and manage expense types for tracking costs", icon: CategoryIcon, color: "#e53935" },
      { key: "itemRates", label: "Item Rates", description: "Manage insurance, mileage, and other item rates", icon: SpeedIcon, color: "#5c6bc0" },
      { key: "itemOverrides", label: "Item Rate Overrides", description: "Set item rate overrides for specific entities", icon: TuneIcon, color: "#78909c" },
      { key: "attributeCosts", label: "Attribute Costs", description: "Configure costs based on shift attributes", icon: AttributeIcon, color: "#00897b" },
    ],
  },
  {
    key: "revenueStream",
    title: "Revenue Stream Setup",
    description: "Configure revenue categories, lease plans, and associated rates",
    icon: SettingsIcon,
    color: "#43a047",
    items: [
      { key: "revenueCategories", label: "Revenue Categories", description: "Define and manage revenue streams and income types", icon: RevenueIcon, color: "#43a047" },
      { key: "leasePlans", label: "Lease Plans & Rates", description: "Configure lease plans and their associated rates", icon: ReceiptIcon, color: "#1e88e5" },
      { key: "leaseOverrides", label: "Lease Rate Overrides", description: "Set rate overrides for specific drivers or cabs", icon: MoneyIcon, color: "#fb8c00" },
    ],
  },
  {
    key: "commissionTax",
    title: "Commission and Tax Rates",
    description: "Configure commission and tax structures, rates, and assignments",
    icon: SettingsIcon,
    color: "#6a1b9a",
    items: [
      { key: "commissions", label: "Commissions", description: "Configure commission types, rates, and assignments", icon: CommissionIcon, color: "#00695c" },
      { key: "taxes", label: "Taxes", description: "Configure tax types, rates, and category assignments", icon: TaxIcon, color: "#6a1b9a" },
    ],
  },
];

// Flatten for rendering purposes
const allCategories = groups.flatMap(g => g.items);

export default function FinancialSetupPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
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

  const handleGroupClick = (groupKey) => {
    setExpandedGroup(expandedGroup === groupKey ? null : groupKey);
  };

  const handleCardClick = (key) => {
    setExpandedCard(expandedCard === key ? null : key);
  };

  const renderTabContent = (key) => {
    const commonProps = { canEdit, canDelete, setError, setSuccess, updateStats };
    switch (key) {
      case "expenseCategories": return <ExpenseCategoriesTab {...commonProps} />;
      case "revenueCategories": return <RevenueCategoriesTab {...commonProps} />;
      case "leasePlans": return <LeasePlansRatesTab {...commonProps} />;
      case "leaseOverrides": return <LeaseRateOverridesTab {...commonProps} />;
      case "attributeCosts": return <AttributeCostsTab canEdit={canEdit} />;
      case "itemRates": return <ItemRatesTab {...commonProps} />;
      case "itemOverrides": return <ItemRateOverridesTab {...commonProps} />;
      case "taxes": return <TaxesTab canEdit={canEdit} setError={setError} setSuccess={setSuccess} />;
      case "commissions": return <CommissionsTab canEdit={canEdit} setError={setError} setSuccess={setSuccess} />;
      default: return null;
    }
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
            Manage expense categories, revenue categories, lease plans, rates, overrides, and attribute costs
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

          {/* Parent Group Cards Grid */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {groups.map((group) => {
              const Icon = group.icon;
              const isExpanded = expandedGroup === group.key;
              return (
                <Grid item xs={12} sm={6} md={4} key={group.key}>
                  <Card
                    elevation={isExpanded ? 4 : 1}
                    sx={{
                      border: isExpanded ? `2px solid ${group.color}` : "1px solid #e5e7eb",
                      borderRadius: 2,
                      transition: "all 0.2s ease",
                      "&:hover": { boxShadow: 3, borderColor: group.color },
                    }}
                  >
                    <CardActionArea onClick={() => handleGroupClick(group.key)} sx={{ p: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 44, height: 44, borderRadius: 1.5,
                            backgroundColor: `${group.color}15`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          <Icon sx={{ color: group.color, fontSize: 24 }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight={600} sx={{ lineHeight: 1.3 }}>
                            {group.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                            {group.description}
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
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Expanded Group Content */}
          {expandedGroup && (
            <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden", mb: 3, border: "1px solid #e5e7eb" }}>
              {/* Group Header */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2, backgroundColor: "#f5f5f5", borderBottom: "1px solid #e5e7eb" }}>
                <Typography variant="h6" fontWeight={600} sx={{ color: "#1a1a2e" }}>
                  {groups.find(g => g.key === expandedGroup)?.title}
                </Typography>
                <IconButton size="small" onClick={() => setExpandedGroup(null)}>
                  <CloseIcon />
                </IconButton>
              </Box>

              {/* Group Items Grid */}
              <Box sx={{ p: 3 }}>
                <Grid container spacing={2}>
                  {groups
                    .find(g => g.key === expandedGroup)
                    ?.items.map((cat) => {
                      const Icon = cat.icon;
                      const isExpanded = expandedCard === cat.key;
                      return (
                        <Grid item xs={12} sm={6} md={4} key={cat.key}>
                          <Card
                            elevation={isExpanded ? 4 : 1}
                            sx={{
                              border: isExpanded ? `2px solid ${cat.color}` : "1px solid #e5e7eb",
                              borderRadius: 2,
                              transition: "all 0.2s ease",
                              "&:hover": { boxShadow: 3, borderColor: cat.color },
                            }}
                          >
                            <CardActionArea onClick={() => handleCardClick(cat.key)} sx={{ p: 2 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                <Box
                                  sx={{
                                    width: 44, height: 44, borderRadius: 1.5,
                                    backgroundColor: `${cat.color}15`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                  }}
                                >
                                  <Icon sx={{ color: cat.color, fontSize: 24 }} />
                                </Box>
                                <Box sx={{ flex: 1 }}>
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
                            </CardActionArea>
                          </Card>
                        </Grid>
                      );
                    })}
                </Grid>
              </Box>
            </Paper>
          )}

          {/* Expanded Card Content */}
          <Collapse in={expandedCard !== null} timeout={300}>
            {expandedCard && (
              <Paper
                elevation={2}
                sx={{
                  border: `2px solid ${allCategories.find(c => c.key === expandedCard)?.color || "#ccc"}`,
                  borderRadius: 2,
                  overflow: "hidden",
                  mb: 3,
                }}
              >
                <Box
                  sx={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    px: 3, py: 1.5,
                    backgroundColor: `${allCategories.find(c => c.key === expandedCard)?.color}10`,
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    {(() => {
                      const cat = allCategories.find(c => c.key === expandedCard);
                      const Icon = cat?.icon;
                      return Icon ? <Icon sx={{ color: cat.color, fontSize: 22 }} /> : null;
                    })()}
                    <Typography variant="h6" fontWeight={600} sx={{ color: allCategories.find(c => c.key === expandedCard)?.color }}>
                      {allCategories.find(c => c.key === expandedCard)?.label}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={() => setExpandedCard(null)}>
                    <CloseIcon />
                  </IconButton>
                </Box>
                {renderTabContent(expandedCard)}
              </Paper>
            )}
          </Collapse>

          {/* Help Dialog */}
          <FinancialHelpDialog open={helpDialogOpen} onClose={() => setHelpDialogOpen(false)} />
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
