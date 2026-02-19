"use client";

import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Box,
  Chip,
  Stack,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ReportsHelpDialog from "./ReportsHelpDialog";

export default function ReportsHelpCard() {
  const [openDialog, setOpenDialog] = useState(false);

  return (
    <>
      <Card
        sx={{
          background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
          color: "#1a1a1a",
          mb: 3,
        }}
      >
        <CardHeader
          avatar={<HelpOutlineIcon sx={{ fontSize: 32 }} />}
          title="Need Help with Financial Reports?"
          subheader="Learn about Driver Reports, Performance Metrics & Statements"
          subheaderTypographyProps={{ sx: { color: "rgba(0,0,0,0.6)" } }}
          titleTypographyProps={{ sx: { color: "#1a1a1a", fontWeight: "bold" } }}
        />
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <p style={{ marginTop: 0 }}>
              Reports help you understand your business performance, driver earnings, and financial
              health. This guide explains how to generate, interpret, and use various report types
              to make better business decisions.
            </p>
          </Box>

          <Stack
            direction="row"
            spacing={1}
            sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}
          >
            <Chip label="📊 Driver Reports" variant="outlined" sx={{ color: "#1a1a1a" }} />
            <Chip
              label="📈 Performance Metrics"
              variant="outlined"
              sx={{ color: "#1a1a1a" }}
            />
            <Chip label="📋 Statements" variant="outlined" sx={{ color: "#1a1a1a" }} />
            <Chip
              label="💰 Settlements"
              variant="outlined"
              sx={{ color: "#1a1a1a" }}
            />
            <Chip
              label="📉 Trends & Analysis"
              variant="outlined"
              sx={{ color: "#1a1a1a" }}
            />
            <Chip label="✅ Best Practices" variant="outlined" sx={{ color: "#1a1a1a" }} />
          </Stack>

          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-start" }}>
            <Button
              variant="contained"
              sx={{ bgcolor: "#1a1a1a", color: "#00f2fe" }}
              onClick={() => setOpenDialog(true)}
              startIcon={<HelpOutlineIcon />}
            >
              Open Complete Guide
            </Button>
          </Box>
        </CardContent>
      </Card>

      <ReportsHelpDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      />
    </>
  );
}
