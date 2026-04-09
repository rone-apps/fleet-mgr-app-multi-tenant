"use client";

import { Box, Breadcrumbs, Typography, Button, useTheme, useMediaQuery } from "@mui/material";
import { Home, ChevronRight } from "@mui/icons-material";
import { useRouter, usePathname } from "next/navigation";
import { pageMetadata, getCategoryTitle } from "../lib/categoryNav";

// Mapping of routes to display names
const routeLabels = {
  "/": "Dashboard",
  "/drivers": "Drivers",
  "/cabs": "Cabs",
  "/shifts": "Shifts",
  "/shift-attributes": "Shift Attributes",
  "/shift-profiles": "Shift Profiles",
  "/account-management": "Account Management",
  "/driver-trips": "Driver Trips",
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
  "/shift-data": "Driver Shift Data",
  "/cab-attributes/types": "Cab Types",
  "/cabs/attributes": "Cab Attributes",
  "/spare-machines": "Spare Machines",
  "/merchant-mappings": "Merchant Mappings",
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
    const items = [
      { label: "Dashboard", path: "/", icon: true }
    ];

    if (pathname === "/") {
      return items;
    }

    // Look up the category for the current page
    const meta = pageMetadata[pathname];
    if (meta && meta.category) {
      items.push({
        label: getCategoryTitle(meta.category),
        path: `/?category=${meta.category}`,
        icon: false,
        active: false
      });
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
        {breadcrumbItems.map((item) => (
          <Box key={item.label}>
            {item.active ? (
              <Typography
                variant={isMobile ? "body2" : "body1"}
                sx={{
                  fontWeight: 600,
                  color: "#1a1a2e",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                {item.label}
              </Typography>
            ) : (
              <Button
                size={isMobile ? "small" : "medium"}
                startIcon={item.icon ? <Home sx={{ fontSize: 18 }} /> : undefined}
                onClick={() => router.push(item.path)}
                sx={{
                  textTransform: "none",
                  color: "#635bff",
                  fontWeight: 500,
                  fontSize: isMobile ? "0.875rem" : "1rem",
                  padding: 0,
                  minWidth: 0,
                  "&:hover": {
                    backgroundColor: "rgba(99, 91, 255, 0.06)",
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
