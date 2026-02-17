"use client";

import { Box, Typography, Button, IconButton, useMediaQuery, useTheme, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { DirectionsCar, Home, Logout, Business, ArrowBack } from "@mui/icons-material";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getTenantName, logout as apiLogout } from "../lib/api";

// Mapping of page paths to their category
const pageToCategory = {
  '/drivers': { category: 'operations', categoryName: 'Operations' },
  '/cabs': { category: 'operations', categoryName: 'Operations' },
  '/shifts': { category: 'operations', categoryName: 'Operations' },
  '/shift-attributes': { category: 'operations', categoryName: 'Operations' },
  '/account-management': { category: 'account', categoryName: 'Account & Customers' },
  '/expenses': { category: 'financials', categoryName: 'Financials' },
  '/financial-setup': { category: 'financials', categoryName: 'Financials' },
  '/reports': { category: 'reports', categoryName: 'Reports' },
  '/driver-summary': { category: 'reports', categoryName: 'Reports' },
  '/taxicaller-integration': { category: 'integrations', categoryName: 'Data & Integrations' },
  '/data-uploads': { category: 'integrations', categoryName: 'Data & Integrations' },
  '/shift-profiles': { category: 'profiles', categoryName: 'Shift Profiles' }
};

export default function GlobalNav({ currentUser, title = "FareFlow" }) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tenantName, setTenantName] = useState(null);
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  useEffect(() => {
    setTenantName(getTenantName());

    // Get category info from current page
    if (pageToCategory[pathname]) {
      setCategoryInfo(pageToCategory[pathname]);
    } else {
      setCategoryInfo(null);
    }
  }, [pathname]);

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

  const handleBackToCategory = () => {
    if (categoryInfo?.category) {
      // Store the category in localStorage and go back to home
      localStorage.setItem('dashboardCategory', categoryInfo.category);
      router.push('/');
    }
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
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Home
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

      {/* Back to Category Navigation - Simple and Obvious */}
      {categoryInfo && (
        <Box
          sx={{
            backgroundColor: "#2d5a3d",
            color: "white",
            p: { xs: 1.5, sm: 2 },
            display: "flex",
            alignItems: "center",
            gap: 2,
            borderTop: "3px solid #3e5244"
          }}
        >
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={handleBackToCategory}
            sx={{
              backgroundColor: "#3e5244",
              color: "white",
              fontWeight: 700,
              textTransform: "none",
              fontSize: "1rem",
              px: 3,
              '&:hover': {
                backgroundColor: "#4a6652"
              }
            }}
          >
            ← Back to {categoryInfo.categoryName}
          </Button>

          <Box sx={{ borderLeft: '2px solid rgba(255, 255, 255, 0.3)', pl: 2 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              Click to return to the {categoryInfo.categoryName} category
            </Typography>
          </Box>
        </Box>
      )}

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
