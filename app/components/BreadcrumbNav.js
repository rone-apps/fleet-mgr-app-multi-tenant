"use client";

import { Box, Breadcrumbs, Typography, Button, useTheme, useMediaQuery } from "@mui/material";
import { Home, ChevronRight } from "@mui/icons-material";
import { useRouter, usePathname } from "next/navigation";

// Mapping of routes to display names
const routeLabels = {
  "/": "Dashboard",
  "/drivers": "Drivers",
  "/cabs": "Cabs",
  "/shifts": "Shifts",
  "/shift-attributes": "Shift Attributes",
  "/shift-profiles": "Shift Profiles",
  "/account-management": "Account Management",
  "/expenses": "Expenses",
  "/driver-payments": "Driver & Owner Payments",
  "/financial-setup": "Financial Setup",
  "/reports": "Reports & Statements",
  "/driver-summary": "Driver Summary",
  "/reports-analytics": "Reports Analytics",
  "/taxicaller-integration": "Taxicaller Integration",
  "/data-uploads": "Data Uploads",
  "/users": "Users",
  "/statement-builder": "Statement Builder",
  "/cab-attributes/types": "Cab Types",
  "/cabs/attributes": "Cab Attributes",
};

export default function BreadcrumbNav() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Don't show breadcrumb on login or token check pages
  if (["/signin", "/token-check"].includes(pathname)) {
    return null;
  }

  // Generate breadcrumb items from pathname
  const getBreadcrumbItems = () => {
    // Always start with Dashboard
    const items = [
      { label: "Dashboard", path: "/", icon: true }
    ];

    // If on home page, just show Dashboard
    if (pathname === "/") {
      return items;
    }

    // Add current page
    const label = routeLabels[pathname] || pathname.replace(/\//g, " ").trim();
    items.push({
      label: label,
      path: pathname,
      icon: false,
      active: true
    });

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  // Don't show breadcrumb on home page
  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <Box
      sx={{
        backgroundColor: "#f5f5f5",
        borderBottom: "1px solid #e0e0e0",
        py: { xs: 1, sm: 1.5 },
        px: { xs: 2, sm: 3 },
      }}
    >
      <Breadcrumbs
        separator={<ChevronRight sx={{ fontSize: 18, color: "#666" }} />}
        aria-label="breadcrumb"
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: isMobile ? "wrap" : "nowrap",
        }}
      >
        {breadcrumbItems.map((item, index) => (
          <Box key={item.path}>
            {item.active ? (
              // Last item (current page) - not clickable
              <Typography
                variant={isMobile ? "body2" : "body1"}
                sx={{
                  fontWeight: 600,
                  color: "#1e3a8a",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                {item.label}
              </Typography>
            ) : (
              // Clickable breadcrumb item
              <Button
                size={isMobile ? "small" : "medium"}
                startIcon={item.icon ? <Home sx={{ fontSize: 18 }} /> : undefined}
                onClick={() => router.push(item.path)}
                sx={{
                  textTransform: "none",
                  color: "#1e3a8a",
                  fontWeight: 500,
                  fontSize: isMobile ? "0.875rem" : "1rem",
                  padding: 0,
                  minWidth: 0,
                  "&:hover": {
                    backgroundColor: "rgba(30, 58, 138, 0.08)",
                    textDecoration: "underline",
                  },
                }}
              >
                {item.label}
              </Button>
            )}
          </Box>
        ))}
      </Breadcrumbs>
    </Box>
  );
}
