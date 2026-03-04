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
import OperationsHelpDialog from "./OperationsHelpDialog";

export default function OperationsHelpCard() {
  const [openDialog, setOpenDialog] = useState(false);

  return (
    <>
      <Card
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          mb: 3,
        }}
      >
        <CardHeader
          avatar={<HelpOutlineIcon sx={{ fontSize: 32 }} />}
          title="Need Help Setting Up Operations?"
          subheader="Learn about Users, Drivers, Cabs, Shifts & More"
          subheaderTypographyProps={{ sx: { color: "rgba(255,255,255,0.8)" } }}
          titleTypographyProps={{ sx: { color: "white", fontWeight: "bold" } }}
        />
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <p style={{ marginTop: 0 }}>
              Smart Fleets has several key components that work together. This guide
              explains each one in simple terms so you can set up your fleet
              management system with confidence.
            </p>
          </Box>

          <Stack
            direction="row"
            spacing={1}
            sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}
          >
            <Chip label="👤 Users" variant="outlined" sx={{ color: "white" }} />
            <Chip
              label="🚗 Drivers"
              variant="outlined"
              sx={{ color: "white" }}
            />
            <Chip label="🚕 Cabs" variant="outlined" sx={{ color: "white" }} />
            <Chip label="⏰ Shifts" variant="outlined" sx={{ color: "white" }} />
            <Chip
              label="📋 Shift Profiles"
              variant="outlined"
              sx={{ color: "white" }}
            />
            <Chip
              label="🏷️ Attributes"
              variant="outlined"
              sx={{ color: "white" }}
            />
          </Stack>

          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-start" }}>
            <Button
              variant="contained"
              sx={{ bgcolor: "white", color: "#667eea" }}
              onClick={() => setOpenDialog(true)}
              startIcon={<HelpOutlineIcon />}
            >
              Open Complete Guide
            </Button>
          </Box>
        </CardContent>
      </Card>

      <OperationsHelpDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      />
    </>
  );
}
