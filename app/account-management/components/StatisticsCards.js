"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import {
  Business as BusinessIcon,
  CheckCircle as ActiveIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  Description as InvoiceIcon,
} from "@mui/icons-material";
import { formatCurrency } from "../utils/helpers";
import { API_BASE_URL } from "../../lib/api";

export default function StatisticsCards({
  customers = [],
  filteredCustomers = [],
  charges = [],
  filteredCharges = [],
  invoices = [],
  filteredInvoices = [],
  currentTab,
  filterCustomerName = "",
  filterCabId = "",
  filterDriverId = "",
  filterStartDate = "",
  filterEndDate = "",
}) {
  // State for backend summary data
  const [summary, setSummary] = useState({
    totalCharges: 0,
    totalChargesAmount: 0,
    paidCharges: 0,
    paidChargesAmount: 0,
    unpaidCharges: 0,
    unpaidChargesAmount: 0,
    outstandingBalance: 0,
    collectionRate: 0,
  });
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Ensure all props are always arrays
  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeFilteredCustomers = Array.isArray(filteredCustomers) ? filteredCustomers : [];
  const safeInvoices = Array.isArray(invoices) ? invoices : [];
  const safeFilteredInvoices = Array.isArray(filteredInvoices) ? filteredInvoices : [];

  // Fetch summary from backend when filters change
  useEffect(() => {
    fetchChargeSummary();
  }, [filterCustomerName, filterCabId, filterDriverId, filterStartDate, filterEndDate]);

  const fetchChargeSummary = async () => {
    setSummaryLoading(true);
    try {
      const params = new URLSearchParams();

      if (filterCustomerName) params.append("customerName", filterCustomerName);
      if (filterCabId) params.append("cabId", filterCabId);
      if (filterDriverId) params.append("driverId", filterDriverId);
      if (filterStartDate) params.append("startDate", filterStartDate);
      if (filterEndDate) params.append("endDate", filterEndDate);

      // Fetch both summary and totals in parallel
      const summaryUrl = `${API_BASE_URL}/account-charges/summary${params.toString() ? "?" + params.toString() : ""}`;
      const totalsUrl = `${API_BASE_URL}/account-charges/totals${params.toString() ? "?" + params.toString() : ""}`;

      console.log("📊 Fetching charge summary from:", summaryUrl);
      console.log("💰 Fetching charge totals from:", totalsUrl);

      const [summaryResponse, totalsResponse] = await Promise.all([
        fetch(summaryUrl, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }),
        fetch(totalsUrl, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }),
      ]);

      console.log("📊 Summary response status:", summaryResponse.status);
      console.log("💰 Totals response status:", totalsResponse.status);

      if (summaryResponse.ok && totalsResponse.ok) {
        const summaryData = await summaryResponse.json();
        const totalsData = await totalsResponse.json();

        console.log("📊 Summary data received:", summaryData);
        console.log("💰 Totals data received:", totalsData);

        const totalAmount = totalsData.totalAmount || 0;
        const paidAmount = totalsData.paidAmount || 0;
        const collectionRate = totalAmount > 0 ? ((paidAmount / totalAmount) * 100).toFixed(1) : 0;

        setSummary({
          totalCharges: totalsData.chargeCount || 0,
          totalChargesAmount: totalAmount,
          paidCharges: totalsData.paidCount || 0,
          paidChargesAmount: paidAmount,
          unpaidCharges: totalsData.unpaidCount || 0,
          unpaidChargesAmount: totalsData.unpaidAmount || 0,
          outstandingBalance: totalsData.unpaidAmount || 0,
          collectionRate: collectionRate,
        });
      } else {
        console.error("📊 Failed to fetch summary:", summaryResponse.status);
        console.error("💰 Failed to fetch totals:", totalsResponse.status);
      }
    } catch (err) {
      console.error("📊 Error fetching charge summary:", err);
    } finally {
      setSummaryLoading(false);
    }
  };

  // Calculate displayed data based on current tab
  // Tab 0: Customers, Tab 1: Trip Charges, Tab 2: All Charges, Tab 3: Invoices
  const displayedCustomers = currentTab === 0 ? safeFilteredCustomers : safeCustomers;
  const displayedInvoices = currentTab === 3 ? safeFilteredInvoices : safeInvoices;

  // Always use backend summary for charge statistics
  const totalChargesCount = summary.totalCharges;
  const totalChargesAmount = summary.totalChargesAmount;
  const unpaidChargesCount = summary.unpaidCharges;
  const unpaidChargesAmount = summary.unpaidChargesAmount;
  const outstandingBalance = summary.outstandingBalance;

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={2.4}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <BusinessIcon color="primary" />
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Total Customers
                </Typography>
                <Typography variant="h5">{displayedCustomers.length}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2.4}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ActiveIcon color="success" />
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Active Customers
                </Typography>
                <Typography variant="h5">
                  {displayedCustomers.filter(c => c.active).length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2.4}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ReceiptIcon color="primary" />
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Total Charges
                </Typography>
                <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  {formatCurrency(totalChargesAmount)}
                </Typography>
                <Typography color="textSecondary" variant="caption">
                  ({totalChargesCount} charges)
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2.4}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <MoneyIcon sx={{ color: "#4caf50" }} />
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Paid Charges
                </Typography>
                <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600, color: '#4caf50' }}>
                  {formatCurrency(summary.paidChargesAmount)}
                </Typography>
                <Typography color="textSecondary" variant="caption">
                  ({summary.paidCharges} paid)
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2.4}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <MoneyIcon sx={{ color: "#ff9800" }} />
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Unpaid Charges
                </Typography>
                <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600, color: '#ff9800' }}>
                  {formatCurrency(unpaidChargesAmount)}
                </Typography>
                <Typography color="textSecondary" variant="caption">
                  ({unpaidChargesCount} unpaid)
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2.4}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: "#667eea", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography variant="caption" sx={{ color: "white", fontWeight: 700 }}>%</Typography>
              </Box>
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Collection Rate
                </Typography>
                <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  {summary.collectionRate}%
                </Typography>
                <Typography color="textSecondary" variant="caption">
                  of total
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2.4}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <InvoiceIcon color="warning" />
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Outstanding Balance
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(outstandingBalance)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
