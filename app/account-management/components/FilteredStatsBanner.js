"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
} from "@mui/material";
import {
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  TrendingDown as TrendingDownIcon,
} from "@mui/icons-material";
import { formatCurrency } from "../utils/helpers";
import { API_BASE_URL } from "../../lib/api";

export default function FilteredStatsBanner({
  filterCustomerName = "",
  filterCabId = "",
  filterDriverId = "",
  filterStartDate = "",
  filterEndDate = "",
  filterPaidStatus = "all",
  showBanner = false,
}) {
  const [stats, setStats] = useState({
    totalChargesCount: 0,
    totalChargesAmount: 0,
    paidChargesCount: 0,
    paidChargesAmount: 0,
    unpaidChargesCount: 0,
    unpaidChargesAmount: 0,
  });
  const [loading, setLoading] = useState(false);

  // Fetch filtered stats whenever filters change
  useEffect(() => {
    if (showBanner && (filterStartDate || filterEndDate || filterCustomerName || filterCabId || filterDriverId)) {
      fetchFilteredStats();
    }
  }, [filterCustomerName, filterCabId, filterDriverId, filterStartDate, filterEndDate, filterPaidStatus, showBanner]);

  const fetchFilteredStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (filterCustomerName) params.append("customerName", filterCustomerName);
      if (filterCabId) params.append("cabId", filterCabId);
      if (filterDriverId) params.append("driverId", filterDriverId);
      if (filterStartDate) params.append("startDate", filterStartDate);
      if (filterEndDate) params.append("endDate", filterEndDate);

      const url = `${API_BASE_URL}/account-charges/totals${params.toString() ? "?" + params.toString() : ""}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });

      if (response.ok) {
        const data = await response.json();

        setStats({
          totalChargesCount: data.chargeCount || 0,
          totalChargesAmount: data.totalAmount || 0,
          paidChargesCount: data.paidCount || 0,
          paidChargesAmount: data.paidAmount || 0,
          unpaidChargesCount: data.unpaidCount || 0,
          unpaidChargesAmount: data.unpaidAmount || 0,
        });
      }
    } catch (err) {
      console.error("Error fetching filtered stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!showBanner) return null;

  return (
    <Card sx={{ mb: 2, backgroundColor: "#f5f5f5", border: "2px solid #667eea" }}>
      <CardContent>
        <Box sx={{ mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#667eea", mb: 1 }}>
            📊 Filtered Period Statistics
          </Typography>
          {(filterStartDate || filterEndDate) && (
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              {filterStartDate && <Chip label={`From: ${filterStartDate}`} size="small" />}
              {filterEndDate && <Chip label={`To: ${filterEndDate}`} size="small" />}
            </Box>
          )}
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ReceiptIcon sx={{ color: "#667eea", fontSize: 24 }} />
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Total Charges
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {formatCurrency(stats.totalChargesAmount)}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  ({stats.totalChargesCount} charges)
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TrendingDownIcon sx={{ color: "#4caf50", fontSize: 24 }} />
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Paid Amount
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#4caf50" }}>
                  {formatCurrency(stats.paidChargesAmount)}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  ({stats.paidChargesCount} paid)
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <MoneyIcon sx={{ color: "#ff9800", fontSize: 24 }} />
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Unpaid Amount
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#ff9800" }}>
                  {formatCurrency(stats.unpaidChargesAmount)}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  ({stats.unpaidChargesCount} unpaid)
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: "#667eea", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography variant="caption" sx={{ color: "white", fontWeight: 700 }}>%</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Collection Rate
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {stats.totalChargesAmount > 0
                    ? ((stats.paidChargesAmount / stats.totalChargesAmount) * 100).toFixed(1)
                    : 0}%
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Paid of total
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
