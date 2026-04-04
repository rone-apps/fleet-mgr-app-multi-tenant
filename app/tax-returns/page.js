"use client";

import { useState } from "react";
import {
  Box, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Alert,
} from "@mui/material";
import { Lock as LockIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import YearEndReportContent from "../components/YearEndReportContent";

export default function TaxReturnsPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleUnlock = () => {
    if (password === "Tax-Haven") {
      setUnlocked(true);
      setError("");
    } else {
      setError("Incorrect password");
    }
  };

  if (unlocked) {
    return <YearEndReportContent showTaxButtons={true} />;
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Dialog open={true} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: "center", pt: 4 }}>
          <LockIcon sx={{ fontSize: 48, color: "#b91c1c", mb: 1 }} />
          <Box component="span" sx={{ display: "block", typography: "h6", fontWeight: 700 }}>
            Do Your Own Taxes
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This is a paid section. Please enter the access password to continue.
          </Alert>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            fullWidth
            size="small"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleUnlock(); }}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => router.push("/")}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={handleUnlock}
            sx={{ backgroundColor: "#b91c1c", "&:hover": { backgroundColor: "#991b1b" } }}
          >
            Unlock
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
