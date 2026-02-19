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
import DataIntegrationHelpDialog from "./DataIntegrationHelpDialog";

export default function DataIntegrationHelpCard() {
  const [openDialog, setOpenDialog] = useState(false);

  return (
    <>
      <Card
        sx={{
          background: "linear-gradient(135deg, #F9D13E 0%, #E5C02E 100%)",
          color: "#1a1a1a",
          mb: 3,
        }}
      >
        <CardHeader
          avatar={<HelpOutlineIcon sx={{ fontSize: 32 }} />}
          title="Need Help with Data & Integrations?"
          subheader="Learn about Data Import, Integrations & File Formats"
          subheaderTypographyProps={{ sx: { color: "rgba(0,0,0,0.6)" } }}
          titleTypographyProps={{ sx: { color: "#1a1a1a", fontWeight: "bold" } }}
        />
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <p style={{ marginTop: 0 }}>
              Data & Integrations help you import bulk data and connect with external systems.
              This guide explains how to upload files, format data correctly, and manage real-time
              integrations with third-party systems.
            </p>
          </Box>

          <Stack
            direction="row"
            spacing={1}
            sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}
          >
            <Chip label="📤 Data Import" variant="outlined" sx={{ color: "#1a1a1a" }} />
            <Chip
              label="📋 File Formats"
              variant="outlined"
              sx={{ color: "#1a1a1a" }}
            />
            <Chip label="🔄 Integrations" variant="outlined" sx={{ color: "#1a1a1a" }} />
            <Chip
              label="🚕 Taxi Caller Sync"
              variant="outlined"
              sx={{ color: "#1a1a1a" }}
            />
            <Chip
              label="⚙️ Configuration"
              variant="outlined"
              sx={{ color: "#1a1a1a" }}
            />
            <Chip label="🐛 Troubleshooting" variant="outlined" sx={{ color: "#1a1a1a" }} />
          </Stack>

          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-start" }}>
            <Button
              variant="contained"
              sx={{ bgcolor: "#1a1a1a", color: "#F9D13E" }}
              onClick={() => setOpenDialog(true)}
              startIcon={<HelpOutlineIcon />}
            >
              Open Complete Guide
            </Button>
          </Box>
        </CardContent>
      </Card>

      <DataIntegrationHelpDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      />
    </>
  );
}
