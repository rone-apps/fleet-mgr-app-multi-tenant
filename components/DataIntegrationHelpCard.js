"use client";

import React, { useState } from "react";
import { Box, Typography, Button, IconButton, Chip } from "@mui/material";
import { LightbulbOutlined, Close, ArrowForward } from "@mui/icons-material";
import DataIntegrationHelpDialog from "./DataIntegrationHelpDialog";

export default function DataIntegrationHelpCard() {
  const [openDialog, setOpenDialog] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          px: 3,
          py: 2,
          background: "linear-gradient(135deg, #fef9ee 0%, #fff8eb 100%)",
          border: "1px solid #fbe8b8",
          borderRadius: "10px",
          mb: 3,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "8px",
            backgroundColor: "#fef0cd",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <LightbulbOutlined sx={{ fontSize: 20, color: "#d97706" }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ color: "#1a1a2e", fontWeight: 600, fontSize: "0.88rem", mb: 0.3 }}>
            Data & Integrations Guide
          </Typography>
          <Typography variant="caption" sx={{ color: "#697386", fontSize: "0.8rem" }}>
            Bulk imports, file formats & third-party sync
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            label="Tip"
            size="small"
            sx={{
              backgroundColor: "#fef0cd",
              color: "#d97706",
              fontWeight: 600,
              fontSize: "0.7rem",
              height: 22,
            }}
          />
          <Button
            size="small"
            endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
            onClick={() => setOpenDialog(true)}
            sx={{
              color: "#d97706",
              fontWeight: 600,
              fontSize: "0.8rem",
              textTransform: "none",
              "&:hover": { backgroundColor: "rgba(217,119,6,0.06)" },
            }}
          >
            View guide
          </Button>
          <IconButton size="small" onClick={() => setDismissed(true)} sx={{ color: "#d6c89e", p: 0.5 }}>
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>

      <DataIntegrationHelpDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      />
    </>
  );
}
