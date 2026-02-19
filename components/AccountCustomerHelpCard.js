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
import AccountCustomerHelpDialog from "./AccountCustomerHelpDialog";

export default function AccountCustomerHelpCard() {
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
          title="Need Help with Customer Management?"
          subheader="Learn about Customers, Invoicing, Payments & Collections"
          subheaderTypographyProps={{ sx: { color: "rgba(255,255,255,0.8)" } }}
          titleTypographyProps={{ sx: { color: "white", fontWeight: "bold" } }}
        />
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <p style={{ marginTop: 0 }}>
              Managing customers and their accounts is central to your business. This guide explains
              how to track customers, generate professional invoices, record payments, and manage
              collections—all in simple terms.
            </p>
          </Box>

          <Stack
            direction="row"
            spacing={1}
            sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}
          >
            <Chip label="👥 Customers" variant="outlined" sx={{ color: "white" }} />
            <Chip
              label="📋 Invoicing"
              variant="outlined"
              sx={{ color: "white" }}
            />
            <Chip label="💰 Payments" variant="outlined" sx={{ color: "white" }} />
            <Chip
              label="🏦 Accounts"
              variant="outlined"
              sx={{ color: "white" }}
            />
            <Chip
              label="📊 Collections"
              variant="outlined"
              sx={{ color: "white" }}
            />
            <Chip
              label="📈 Reports"
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

      <AccountCustomerHelpDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      />
    </>
  );
}
