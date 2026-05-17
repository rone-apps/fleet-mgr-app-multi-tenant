"use client";

import { Box, Typography, Button, IconButton, useMediaQuery, useTheme, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { CommuteOutlined, Home, Logout, Business } from "@mui/icons-material";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getTenantName, logout as apiLogout } from "../lib/api";
import * as amplitude from "@amplitude/unified";
import BreadcrumbNav from "./BreadcrumbNav";


export default function GlobalNav({ currentUser, title = "Smart Fleets" }) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tenantName, setTenantName] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  useEffect(() => {
    setTenantName(getTenantName());
  }, []);

  const handleLogout = () => {
    setLogoutDialogOpen(true);
  };

  const handleConfirmLogout = () => {
    setLogoutDialogOpen(false);
    amplitude.track("User Signed Out");
    apiLogout();
  };

  const handleCancelLogout = () => {
    setLogoutDialogOpen(false);
  };

  if (!currentUser) return null;

  return (
    <Box>
      {/* Main Navigation Bar */}
      <Box
        sx={{
          backgroundColor: "#fff",
          color: "#1a1a2e",
          borderBottom: "1px solid #e5e7eb",
          p: { xs: 1.5, sm: 2 },
          px: { xs: 2, sm: 3 },
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Logo and Title */}
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5 } }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "8px",
              background: "linear-gradient(135deg, #635bff 0%, #7c6cff 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CommuteOutlined sx={{ fontSize: 22, color: "#fff" }} />
          </Box>
          <Box>
            <Typography
              variant={isMobile ? "h6" : "h6"}
              fontWeight="700"
              sx={{ display: { xs: 'none', sm: 'block' }, lineHeight: 1.2, color: "#1a1a2e", fontSize: "1rem" }}
            >
              {title}
            </Typography>
            {tenantName && !isMobile && (
              <Typography
                variant="caption"
                sx={{
                  color: '#8792a2',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontSize: '0.75rem',
                }}
              >
                <Business sx={{ fontSize: 13, color: '#8792a2' }} />
                {tenantName}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Navigation Buttons */}
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5 } }}>
          {isMobile ? (
            <>
              <IconButton
                onClick={() => router.replace("/")}
                sx={{
                  color: '#697386',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  '&:hover': { backgroundColor: '#f6f9fc', color: '#635bff' }
                }}
                title="Home"
              >
                <Home fontSize="small" />
              </IconButton>
              <IconButton
                onClick={handleLogout}
                sx={{
                  color: '#697386',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  '&:hover': { backgroundColor: '#f6f9fc', color: '#e74c3c' }
                }}
                title="Logout"
              >
                <Logout fontSize="small" />
              </IconButton>
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                startIcon={<Home fontSize="small" />}
                onClick={() => router.replace("/")}
                title="Go to Dashboard"
                sx={{
                  color: '#697386',
                  borderColor: '#e5e7eb',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  borderRadius: '8px',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#635bff',
                    color: '#635bff',
                    backgroundColor: 'rgba(99,91,255,0.04)'
                  }
                }}
              >
                Dashboard
              </Button>
              <Button
                variant="outlined"
                startIcon={<Logout fontSize="small" />}
                onClick={handleLogout}
                sx={{
                  color: '#697386',
                  borderColor: '#e5e7eb',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  borderRadius: '8px',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#e74c3c',
                    color: '#e74c3c',
                    backgroundColor: 'rgba(231,76,60,0.04)'
                  }
                }}
              >
                Logout
              </Button>
            </>
          )}
        </Box>
      </Box>


      {/* Breadcrumb Navigation */}
      <BreadcrumbNav />

      {/* Professional Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={handleCancelLogout}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }
        }}
      >
        <DialogTitle
          sx={{
            color: '#fff',
            fontWeight: 700,
            fontSize: '1.3rem',
            pb: 1
          }}
        >
          Confirm Logout
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '1rem', lineHeight: 1.6 }}>
            Are you sure you want to logout? You'll need to sign in again to access your dashboard.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            onClick={handleCancelLogout}
            variant="outlined"
            sx={{
              color: '#fff',
              borderColor: 'rgba(255,255,255,0.5)',
              fontWeight: 600,
              px: 3,
              '&:hover': {
                borderColor: '#fff',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmLogout}
            variant="contained"
            sx={{
              backgroundColor: '#fff',
              color: '#667eea',
              fontWeight: 700,
              px: 4,
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.95)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.3)'
              }
            }}
          >
            Yes, Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
