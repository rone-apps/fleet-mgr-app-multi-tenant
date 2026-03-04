"use client";

import { Box, Typography, Button, IconButton, useMediaQuery, useTheme, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { DirectionsCar, Home, Logout, Business } from "@mui/icons-material";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getTenantName, logout as apiLogout } from "../lib/api";
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
          backgroundColor: "#1e3a8a",
          color: "white",
          p: { xs: 1.5, sm: 2 },
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Logo and Title */}
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 } }}>
          <DirectionsCar sx={{ fontSize: { xs: 28, sm: 32 } }} />
          <Box>
            <Typography
              variant={isMobile ? "h6" : "h5"}
              fontWeight="bold"
              sx={{ display: { xs: 'none', sm: 'block' }, lineHeight: 1.2 }}
            >
              {title}
            </Typography>
            {tenantName && !isMobile && (
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                <Business sx={{ fontSize: 14 }} />
                {tenantName}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Navigation Buttons */}
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 } }}>
          {isMobile ? (
            <>
              {/* Mobile: Icon buttons only */}
              <IconButton
                color="inherit"
                onClick={() => router.replace("/")}
                sx={{
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                }}
                title="Home"
              >
                <Home />
              </IconButton>
              <IconButton
                color="inherit"
                onClick={handleLogout}
                sx={{
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                }}
                title="Logout"
              >
                <Logout />
              </IconButton>
            </>
          ) : (
            <>
              {/* Desktop: Text buttons with icons */}
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<Home />}
                onClick={() => router.replace("/")}
                title="Go to Dashboard"
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Dashboard
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<Logout />}
                onClick={handleLogout}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
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
          🚪 Confirm Logout
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
