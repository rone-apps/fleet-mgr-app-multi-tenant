"use client";

import React, { useState } from "react";
import { Box, Typography, Button, IconButton, Chip } from "@mui/material";
import { LightbulbOutlined, Close, ArrowForward } from "@mui/icons-material";
import AccountCustomerHelpDialog from "./AccountCustomerHelpDialog";

export default function AccountCustomerHelpCard() {
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
          background: "linear-gradient(135deg, #f8f0ff 0%, #f0f4ff 100%)",
          border: "1px solid #e8deff",
          borderRadius: "10px",
          mb: 3,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "8px",
            backgroundColor: "#ede5ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <LightbulbOutlined sx={{ fontSize: 20, color: "#7c5cfc" }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ color: "#1a1a2e", fontWeight: 600, fontSize: "0.88rem", mb: 0.3 }}>
            Customer Management Guide
          </Typography>
          <Typography variant="caption" sx={{ color: "#697386", fontSize: "0.8rem" }}>
            Customers, invoicing, payments & collections
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            label="Tip"
            size="small"
            sx={{
              backgroundColor: "#ede5ff",
              color: "#7c5cfc",
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
              color: "#7c5cfc",
              fontWeight: 600,
              fontSize: "0.8rem",
              textTransform: "none",
              "&:hover": { backgroundColor: "rgba(124,92,252,0.06)" },
            }}
          >
            View guide
          </Button>
          <IconButton size="small" onClick={() => setDismissed(true)} sx={{ color: "#c0b8d6", p: 0.5 }}>
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>

      <AccountCustomerHelpDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      />
    </>
  );
}
