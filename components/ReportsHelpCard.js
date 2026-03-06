"use client";

import React, { useState } from "react";
import { Box, Typography, Button, IconButton, Chip } from "@mui/material";
import { LightbulbOutlined, Close, ArrowForward } from "@mui/icons-material";
import ReportsHelpDialog from "./ReportsHelpDialog";

export default function ReportsHelpCard() {
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
          background: "linear-gradient(135deg, #eff6ff 0%, #f0f7ff 100%)",
          border: "1px solid #d0e3ff",
          borderRadius: "10px",
          mb: 3,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "8px",
            backgroundColor: "#dbeafe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <LightbulbOutlined sx={{ fontSize: 20, color: "#3b82f6" }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ color: "#1a1a2e", fontWeight: 600, fontSize: "0.88rem", mb: 0.3 }}>
            Reports & Analytics Guide
          </Typography>
          <Typography variant="caption" sx={{ color: "#697386", fontSize: "0.8rem" }}>
            Driver reports, performance metrics & statements
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            label="Tip"
            size="small"
            sx={{
              backgroundColor: "#dbeafe",
              color: "#3b82f6",
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
              color: "#3b82f6",
              fontWeight: 600,
              fontSize: "0.8rem",
              textTransform: "none",
              "&:hover": { backgroundColor: "rgba(59,130,246,0.06)" },
            }}
          >
            View guide
          </Button>
          <IconButton size="small" onClick={() => setDismissed(true)} sx={{ color: "#a8c4e6", p: 0.5 }}>
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>

      <ReportsHelpDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      />
    </>
  );
}
