"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import {
  ExpandMore,
  CloudUpload,
  FileUpload,
  Assessment,
  ApiOutlined,
  Help,
  CheckCircle,
  Info,
  Warning,
  UploadFile,
} from "@mui/icons-material";

export default function DataIntegrationHelpDialog({ open, onClose }) {
  const [expandedPanel, setExpandedPanel] = React.useState(false);

  const handlePanelChange = (panel) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          background: "linear-gradient(135deg, #F9D13E 0%, #E5C02E 100%)",
          color: "#1a1a1a",
          fontWeight: 700,
          fontSize: "1.5rem",
          pb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CloudUpload sx={{ fontSize: 32 }} />
          Data & Integrations Guide
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Introduction */}
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="body2">
            Data & Integrations let you import external data and connect with third-party systems.
            This guide explains how to upload data, format files correctly, and manage integrations.
          </Typography>
        </Alert>

        {/* Section 1: What is Data & Integrations */}
        <Accordion
          expanded={expandedPanel === "overview"}
          onChange={handlePanelChange("overview")}
          sx={{ mb: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Info sx={{ mr: 2, color: "#F9D13E" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Data & Integrations Overview
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2 }}>
            <Box>
              <Typography variant="body2" paragraph>
                Data & Integrations help you bring information into Smart Fleets from external sources
                and connect with other business systems.
              </Typography>

              <Card sx={{ mb: 2, backgroundColor: "#f5f5f5" }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    🔄 Two Main Functions:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle sx={{ color: "#F9D13E", fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Data Import"
                        secondary="Upload CSV/Excel files with bulk data (trips, charges, drivers, etc.)"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle sx={{ color: "#F9D13E", fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="System Integrations"
                        secondary="Connect with external systems like Taxi Caller dispatch software"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                ✅ What You Can Import:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Trip Data"
                    secondary="Routes, fares, dates, and customer information from dispatch systems"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Driver Information"
                    secondary="Names, contact info, license numbers, hire dates"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Vehicle Data"
                    secondary="Cab numbers, license plates, registration info"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Charge Data"
                    secondary="Credit card charges, airport fees, surcharges"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Mileage Data"
                    secondary="Trip distances and odometer readings"
                  />
                </ListItem>
              </List>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Section 2: Data Import Basics */}
        <Accordion
          expanded={expandedPanel === "import"}
          onChange={handlePanelChange("import")}
          sx={{ mb: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <FileUpload sx={{ mr: 2, color: "#4facfe" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              How to Import Data
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2 }}>
            <Box>
              <Typography variant="body2" paragraph>
                Importing data is the fastest way to load bulk information into Smart Fleets.
              </Typography>

              <Card sx={{ mb: 2, backgroundColor: "#f5f5f5" }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    📁 Supported File Formats:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <Chip label="CSV" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">Comma-Separated Values (most common)</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="XLSX" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">Excel spreadsheets</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="XLS" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">Older Excel format</Typography>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                ✅ Step-by-Step Import Process:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="1. Go to Data Import"
                    secondary="Click Data & Integrations > Data Import"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="2. Select Data Type"
                    secondary="Choose what you're importing (trips, drivers, charges, etc.)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="3. Upload File"
                    secondary="Click 'Choose File' and select your CSV or Excel file"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="4. Preview Data"
                    secondary="System shows first few rows to verify format is correct"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="5. Map Columns"
                    secondary="Match your file columns to Smart Fleets fields"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="6. Review Errors"
                    secondary="System checks for problems before importing"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="7. Confirm & Import"
                    secondary="Click Import to add data to your system"
                  />
                </ListItem>
              </List>

              <Card sx={{ mt: 2, backgroundColor: "#e8f5e9" }}>
                <CardContent>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    ✅ Pro Tip: Batch Imports
                  </Typography>
                  <Typography variant="body2">
                    You can import multiple files at once. System processes them in order and shows
                    a summary report when complete.
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Section 3: File Format Requirements */}
        <Accordion
          expanded={expandedPanel === "format"}
          onChange={handlePanelChange("format")}
          sx={{ mb: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Assessment sx={{ mr: 2, color: "#10b981" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              File Format & Column Requirements
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                📋 Trip Data Format:
              </Typography>
              <Card sx={{ mb: 2, backgroundColor: "#f5f5f5", overflow: "auto" }}>
                <CardContent>
                  <TableContainer component={Paper} sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#e0e0e0" }}>
                          <TableCell sx={{ fontWeight: 600 }}>Column</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Format</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Example</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>Trip Date</TableCell>
                          <TableCell>YYYY-MM-DD</TableCell>
                          <TableCell>2026-02-17</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Trip Time</TableCell>
                          <TableCell>HH:MM or HH:MM:SS</TableCell>
                          <TableCell>14:30 or 14:30:45</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Driver ID</TableCell>
                          <TableCell>Number or Code</TableCell>
                          <TableCell>123 or DRV-001</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Cab Number</TableCell>
                          <TableCell>Number</TableCell>
                          <TableCell>45</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Fare Amount</TableCell>
                          <TableCell>Decimal number</TableCell>
                          <TableCell>25.50</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Mileage</TableCell>
                          <TableCell>Decimal number</TableCell>
                          <TableCell>12.5</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                ⚠️ Important Format Notes:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="No empty rows or columns"
                    secondary="Remove any blank rows or columns in your file"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Consistent date format"
                    secondary="Use YYYY-MM-DD throughout (e.g., 2026-02-17)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Match driver/cab IDs"
                    secondary="Driver ID and Cab Number must exist in the system"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Decimal separators"
                    secondary="Use periods (.) not commas (,) for decimals"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="No special characters in IDs"
                    secondary="Use only letters, numbers, and hyphens in ID fields"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Header row required"
                    secondary="First row must be column names, not data"
                  />
                </ListItem>
              </List>

              <Card sx={{ mt: 2, backgroundColor: "#fff3e0" }}>
                <CardContent>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    💡 Tip: Download Template
                  </Typography>
                  <Typography variant="body2">
                    The system provides download templates for each data type. Use these as a guide
                    to format your data correctly.
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Section 4: Taxi Caller Integration */}
        <Accordion
          expanded={expandedPanel === "taxicaller"}
          onChange={handlePanelChange("taxicaller")}
          sx={{ mb: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <ApiOutlined sx={{ mr: 2, color: "#1976d2" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Taxi Caller Sync Integration
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2 }}>
            <Box>
              <Typography variant="body2" paragraph>
                Taxi Caller Sync connects Smart Fleets directly with your Taxi Caller dispatch system
                for automatic, real-time data synchronization.
              </Typography>

              <Card sx={{ mb: 2, backgroundColor: "#e3f2fd" }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    🔄 What Syncs Automatically:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <Chip
                        label="Trip Data"
                        size="small"
                        sx={{ mr: 1, backgroundColor: "#bbdefb" }}
                      />
                      <Typography variant="body2">All trips from dispatch system</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip
                        label="Fares"
                        size="small"
                        sx={{ mr: 1, backgroundColor: "#bbdefb" }}
                      />
                      <Typography variant="body2">Calculated fares per trip</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip
                        label="Driver Assignments"
                        size="small"
                        sx={{ mr: 1, backgroundColor: "#bbdefb" }}
                      />
                      <Typography variant="body2">Which drivers worked which shifts</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip
                        label="Mileage"
                        size="small"
                        sx={{ mr: 1, backgroundColor: "#bbdefb" }}
                      />
                      <Typography variant="body2">Distance traveled per trip</Typography>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                ✅ How to Set Up Taxi Caller Sync:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="1. Go to Taxi Caller Integration"
                    secondary="Navigate to Data & Integrations > Taxi Caller Sync"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="2. Provide API Credentials"
                    secondary="Enter your Taxi Caller API key and endpoint URL"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="3. Test Connection"
                    secondary="Click Test to verify connection is working"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="4. Enable Sync"
                    secondary="Turn on automatic synchronization"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="5. Set Sync Frequency"
                    secondary="Choose real-time, hourly, or daily sync"
                  />
                </ListItem>
              </List>

              <Card sx={{ mt: 2, backgroundColor: "#f3e5f5" }}>
                <CardContent>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    ⚡ Real-Time Sync Benefits:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <CheckCircle sx={{ fontSize: 16, mr: 1, color: "#667eea" }} />
                      <Typography variant="body2">
                        Automatic trip data from dispatch—no manual entry
                      </Typography>
                    </ListItem>
                    <ListItem>
                      <CheckCircle sx={{ fontSize: 16, mr: 1, color: "#667eea" }} />
                      <Typography variant="body2">
                        Always up-to-date financial information
                      </Typography>
                    </ListItem>
                    <ListItem>
                      <CheckCircle sx={{ fontSize: 16, mr: 1, color: "#667eea" }} />
                      <Typography variant="body2">Fewer data errors and discrepancies</Typography>
                    </ListItem>
                    <ListItem>
                      <CheckCircle sx={{ fontSize: 16, mr: 1, color: "#667eea" }} />
                      <Typography variant="body2">Faster report generation</Typography>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Section 5: Troubleshooting */}
        <Accordion
          expanded={expandedPanel === "troubleshoot"}
          onChange={handlePanelChange("troubleshoot")}
          sx={{ mb: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Warning sx={{ mr: 2, color: "#d32f2f" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Troubleshooting & Common Issues
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                ❌ "File format not supported"
              </Typography>
              <Card sx={{ mb: 2, backgroundColor: "#ffebee", pl: 2 }}>
                <CardContent>
                  <Typography variant="body2">
                    <strong>Solution:</strong> Make sure your file is .CSV, .XLSX, or .XLS. Don't
                    upload .txt, .json, or other formats.
                  </Typography>
                </CardContent>
              </Card>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                ❌ "Column mapping failed"
              </Typography>
              <Card sx={{ mb: 2, backgroundColor: "#ffebee", pl: 2 }}>
                <CardContent>
                  <Typography variant="body2">
                    <strong>Solution:</strong> Verify your file has the correct column names and no
                    empty columns. Use the template as reference.
                  </Typography>
                </CardContent>
              </Card>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                ❌ "Driver ID not found"
              </Typography>
              <Card sx={{ mb: 2, backgroundColor: "#ffebee", pl: 2 }}>
                <CardContent>
                  <Typography variant="body2">
                    <strong>Solution:</strong> Add drivers to the system first (Users → Drivers
                    section). Then use the exact driver IDs in your import file.
                  </Typography>
                </CardContent>
              </Card>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                ❌ "Invalid date format"
              </Typography>
              <Card sx={{ mb: 2, backgroundColor: "#ffebee", pl: 2 }}>
                <CardContent>
                  <Typography variant="body2">
                    <strong>Solution:</strong> Ensure all dates are in YYYY-MM-DD format (e.g.,
                    2026-02-17). Not MM/DD/YYYY or DD-MM-YYYY.
                  </Typography>
                </CardContent>
              </Card>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                ❌ "Taxi Caller sync not connecting"
              </Typography>
              <Card sx={{ mb: 2, backgroundColor: "#ffebee", pl: 2 }}>
                <CardContent>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="✓ Verify API credentials are correct" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="✓ Check endpoint URL is reachable" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="✓ Ensure firewall allows connection" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="✓ Contact Taxi Caller support if problems persist" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Card sx={{ mt: 2, backgroundColor: "#e8f5e9" }}>
                <CardContent>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    💡 Tip: View Import Logs
                  </Typography>
                  <Typography variant="body2">
                    After each import, check the Results tab to see detailed error logs. These help
                    diagnose exactly what went wrong.
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Section 6: Best Practices */}
        <Accordion
          expanded={expandedPanel === "bestpractices"}
          onChange={handlePanelChange("bestpractices")}
          sx={{ mb: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <CheckCircle sx={{ mr: 2, color: "#388e3c" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Best Practices for Data Management
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2 }}>
            <Box>
              <List dense sx={{ mb: 2 }}>
                <ListItem>
                  <ListItemText
                    primary="✓ Test imports on sample data first"
                    secondary="Always do a test run with a small file before large imports"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="✓ Keep master data up to date"
                    secondary="Add drivers, cabs, and shift profiles before importing transaction data"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="✓ Schedule regular imports"
                    secondary="Import at consistent times (daily, weekly) for predictability"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="✓ Archive imported files"
                    secondary="Keep copies for audit trail and troubleshooting"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="✓ Monitor import results"
                    secondary="Check import logs immediately after each import"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="✓ Use Taxi Caller Sync when available"
                    secondary="Automates data flow and reduces manual work"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="✓ Validate data accuracy"
                    secondary="Spot-check imported data against source system"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="✓ Plan your import structure"
                    secondary="Decide what data types to import and import order"
                  />
                </ListItem>
              </List>

              <Card sx={{ backgroundColor: "#e0f2f1" }}>
                <CardContent>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    ✅ Recommended Import Order:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <Chip label="1" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">Drivers (if not already in system)</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="2" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">Cabs (if not already in system)</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="3" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">Trip Data (historical records)</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="4" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">Charges (additional fees, adjustments)</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="5" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">Mileage (if applicable)</Typography>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Section 7: FAQ */}
        <Accordion
          expanded={expandedPanel === "faq"}
          onChange={handlePanelChange("faq")}
          sx={{ mb: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Help sx={{ mr: 2, color: "#667eea" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Frequently Asked Questions
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                ❓ Can I import duplicate data?
              </Typography>
              <Typography variant="body2" paragraph sx={{ ml: 2, mb: 2 }}>
                The system has duplicate detection. If data with the same date/driver/cab/fare
                exists, it will warn you before importing.
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                ❓ How long does an import take?
              </Typography>
              <Typography variant="body2" paragraph sx={{ ml: 2, mb: 2 }}>
                Depends on file size. Small files (under 1000 rows) typically process in seconds.
                Large files may take several minutes.
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                ❓ Can I undo an import?
              </Typography>
              <Typography variant="body2" paragraph sx={{ ml: 2, mb: 2 }}>
                Not directly, but you can delete imported records individually. For large
                corrections, contact support for database-level rollback.
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                ❓ What if my dispatch system isn't Taxi Caller?
              </Typography>
              <Typography variant="body2" paragraph sx={{ ml: 2, mb: 2 }}>
                Use Data Import with CSV/Excel export from your system. Smart Fleets is flexible with
                file formats and can map your column names.
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                ❓ Can I schedule imports automatically?
              </Typography>
              <Typography variant="body2" paragraph sx={{ ml: 2, mb: 2 }}>
                Taxi Caller Sync does this automatically. For manual imports, you can set up API
                calls through third-party services or contact support.
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                ❓ What's the maximum file size?
              </Typography>
              <Typography variant="body2" paragraph sx={{ ml: 2, mb: 2 }}>
                Typical limit is 50MB per file. For larger datasets, split into multiple files and
                import in batches.
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Quick Start Guide */}
        <Card sx={{ mt: 3, backgroundColor: "#fff9e6", border: "2px solid #F9D13E" }}>
          <CardContent>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              ⚡ 10-Minute Quick Start
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="1. Prepare your data file"
                  secondary="Ensure it's .CSV or .XLSX with correct format"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="2. Go to Data Import"
                  secondary="Navigate to Data & Integrations > Data Import"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="3. Upload a test file"
                  secondary="Start with a small sample file"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="4. Review preview"
                  secondary="Verify first few rows look correct"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="5. Map columns"
                  secondary="Match your columns to Smart Fleets fields"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="6. Check for errors"
                  secondary="Review any warnings or validation issues"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="7. Import"
                  secondary="Click Import to load data into system"
                />
              </ListItem>
            </List>
            <Typography variant="caption" sx={{ display: "block", mt: 2, fontStyle: "italic" }}>
              ✅ Data imported successfully! Repeat process for other data types as needed.
            </Typography>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
