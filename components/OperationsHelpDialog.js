"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoIcon from "@mui/icons-material/Info";
import HelpIcon from "@mui/icons-material/Help";

export default function OperationsHelpDialog({ open, onClose }) {
  const [expandedSection, setExpandedSection] = useState("users");

  const handleSectionChange = (panel) => {
    setExpandedSection(expandedSection === panel ? false : panel);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <HelpIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Operations Guide - Complete Setup
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, maxHeight: "70vh", overflowY: "auto" }}>
        {/* Introduction */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Welcome to Smart Fleets Operations!</strong> This guide explains
            all the components you need to set up your fleet management system.
            Think of it like building blocks - start with Users, then Drivers,
            then Cabs, and finally configure how shifts work.
          </Typography>
        </Alert>

        {/* USERS Section */}
        <Accordion
          expanded={expandedSection === "users"}
          onChange={() => handleSectionChange("users")}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              👤 Users (Who Can Access Smart Fleets)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" paragraph>
                <strong>What are Users?</strong> Users are people who log into
                Smart Fleets to do their job. They can be managers, accountants,
                admins, or drivers.
              </Typography>

              <Card sx={{ mb: 2, bgcolor: "#f5f5f5" }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                    Types of Users:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Admin"
                        secondary="Full access to everything - can create users, drivers, cabs, configure shifts"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Manager"
                        secondary="Can manage drivers, view reports, generate statements"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Accountant"
                        secondary="Can create invoices, manage finances, view financial reports"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Driver"
                        secondary="Can view their own financial statements and reports"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" paragraph sx={{ mt: 2 }}>
                <strong>How to Add a User:</strong>
              </Typography>
              <List dense>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="1. Go to Users → Add User" />
                </ListItem>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="2. Enter Name, Email, Phone Number" />
                </ListItem>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="3. Select Role (Admin, Manager, Accountant, Driver)" />
                </ListItem>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="4. Click Save - Password will be sent to their email" />
                </ListItem>
              </List>

              <Alert severity="success" sx={{ mt: 2 }}>
                <strong>💡 Pro Tip:</strong> Start with one Admin (you) and one
                Manager. Add more users as your team grows.
              </Alert>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* DRIVERS Section */}
        <Accordion
          expanded={expandedSection === "drivers"}
          onChange={() => handleSectionChange("drivers")}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              🚗 Drivers (Your Employees)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" paragraph>
                <strong>What are Drivers?</strong> Drivers are your employees.
                Each driver has a record of their earnings, expenses, and
                financial history in the system.
              </Typography>

              <Card sx={{ mb: 2, bgcolor: "#f5f5f5" }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                    Driver Information Needed:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Driver Number (unique ID like D001, D002)" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Name" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Phone Number" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Email Address" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="License Number (optional)" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" paragraph sx={{ mt: 2 }}>
                <strong>How to Add a Driver:</strong>
              </Typography>
              <List dense>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="1. Go to Drivers → Add Driver" />
                </ListItem>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="2. Fill in Driver Number, Name, Contact Info" />
                </ListItem>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="3. Click Save" />
                </ListItem>
              </List>

              <Alert severity="info" sx={{ mt: 2 }}>
                <strong>📝 Important:</strong> Driver Number must be unique and
                easy to remember (e.g., D001, D002, etc.)
              </Alert>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* CABS Section */}
        <Accordion
          expanded={expandedSection === "cabs"}
          onChange={() => handleSectionChange("cabs")}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              🚕 Cabs (Your Vehicles)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" paragraph>
                <strong>What are Cabs?</strong> Cabs are your vehicles. Each cab
                can be driven by different drivers, and the system tracks which
                driver was driving which cab on which day.
              </Typography>

              <Card sx={{ mb: 2, bgcolor: "#f5f5f5" }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                    Cab Information Needed:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Cab Number (like 101, 102, etc.)" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="License Plate" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Vehicle Type (Sedan, SUV, etc.)" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Status (Active, Inactive, Maintenance)" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" paragraph sx={{ mt: 2 }}>
                <strong>How to Add a Cab:</strong>
              </Typography>
              <List dense>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="1. Go to Cabs → Add Cab" />
                </ListItem>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="2. Enter Cab Number (e.g., 101)" />
                </ListItem>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="3. Enter License Plate Number" />
                </ListItem>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="4. Select Vehicle Type" />
                </ListItem>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="5. Click Save" />
                </ListItem>
              </List>

              <Alert severity="success" sx={{ mt: 2 }}>
                <strong>💡 Pro Tip:</strong> Use simple numbers for cab IDs
                (101, 102, 103). Makes it easier for drivers to remember.
              </Alert>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* SHIFT PROFILES Section */}
        <Accordion
          expanded={expandedSection === "profiles"}
          onChange={() => handleSectionChange("profiles")}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              ⏰ Shift Profiles (How You Organize Work)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" paragraph>
                <strong>What is a Shift Profile?</strong> A Shift Profile defines
                how you organize your workday. It's like a blueprint for your
                shifts (Day Shift, Night Shift, Weekend, etc.).
              </Typography>

              <Card sx={{ mb: 2, bgcolor: "#e8f5e9" }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                    Real-World Example:
                  </Typography>
                  <Typography variant="body2">
                    Your company might have:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Day Shift"
                        secondary="6 AM to 3 PM, $150/day lease"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Night Shift"
                        secondary="3 PM to Midnight, $200/day lease"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Weekend Shift"
                        secondary="7 AM to 7 PM, $250/day lease"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Typography variant="body2" paragraph sx={{ mt: 2 }}>
                <strong>What Goes in a Shift Profile:</strong>
              </Typography>
              <List dense>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="Name (Day Shift, Night Shift, etc.)" />
                </ListItem>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="Start Time and End Time" />
                </ListItem>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="Lease Rate (cost per day for driver)" />
                </ListItem>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="Description (what this shift is for)" />
                </ListItem>
              </List>

              <Alert severity="info" sx={{ mt: 2 }}>
                <strong>🔗 How it's used:</strong> When you create a Shift, you
                pick a Shift Profile. The system automatically uses the times
                and rates from the profile.
              </Alert>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* SHIFTS Section */}
        <Accordion
          expanded={expandedSection === "shifts"}
          onChange={() => handleSectionChange("shifts")}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              📅 Shifts (Actual Scheduled Work)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" paragraph>
                <strong>What is a Shift?</strong> A Shift is a specific day and
                time when a specific driver drives a specific cab. For example:
                "Ahmed drives Cab 17 on Feb 15, Day Shift".
              </Typography>

              <Card sx={{ mb: 2, bgcolor: "#f5f5f5" }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                    Shift = Cab + Driver + Date + Shift Profile
                  </Typography>
                  <Typography variant="body2">
                    Example: <br />
                    • Cab: 17 <br />
                    • Driver: Ahmed <br />
                    • Date: Feb 15, 2026 <br />
                    • Shift Profile: Day Shift (6 AM - 3 PM, $150 lease)
                  </Typography>
                </CardContent>
              </Card>

              <Typography variant="body2" paragraph sx={{ mt: 2 }}>
                <strong>Why Shifts Matter:</strong>
              </Typography>
              <List dense>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="Tracks who drives what cab when" />
                </ListItem>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="Records lease payments automatically" />
                </ListItem>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="Links drivers to their earnings" />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" paragraph sx={{ mt: 2 }}>
                <strong>How to Create a Shift:</strong>
              </Typography>
              <List dense>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="1. Go to Shifts → Add Shift" />
                </ListItem>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="2. Select a Cab (e.g., Cab 17)" />
                </ListItem>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="3. Select a Driver (e.g., Ahmed)" />
                </ListItem>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="4. Select the Date" />
                </ListItem>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="5. Select Shift Profile (Day, Night, etc.)" />
                </ListItem>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="6. Click Save" />
                </ListItem>
              </List>

              <Alert severity="success" sx={{ mt: 2 }}>
                <strong>✅ System does this automatically:</strong> Once saved,
                the system records the lease payment ($150 for Day Shift) under
                Ahmed's financial statement.
              </Alert>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* SHIFT ATTRIBUTES Section */}
        <Accordion
          expanded={expandedSection === "attributes"}
          onChange={() => handleSectionChange("attributes")}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              🏷️ Shift Attributes (Special Tags/Conditions)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" paragraph>
                <strong>What are Shift Attributes?</strong> Shift Attributes are
                special tags or conditions you can add to shifts. Use them to
                mark shifts with extra details or conditions.
              </Typography>

              <Card sx={{ mb: 2, bgcolor: "#f5f5f5" }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                    Real-World Examples:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="BACKUP CAB"
                        secondary="Mark when using a replacement vehicle"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="TRAINING"
                        secondary="Mark training shifts"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="OUT OF SERVICE"
                        secondary="Mark when cab wasn't available"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="PREMIUM RATE"
                        secondary="Mark premium shifts"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" paragraph sx={{ mt: 2 }}>
                <strong>Step 1: Create Attribute Types:</strong>
              </Typography>
              <List dense>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="1. Go to Cab Attributes → Types" />
                </ListItem>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="2. Click Add Attribute Type" />
                </ListItem>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="3. Enter Name (e.g., BACKUP CAB)" />
                </ListItem>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="4. Enter Code (e.g., BCK)" />
                </ListItem>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="5. Click Save" />
                </ListItem>
              </List>

              <Typography variant="body2" paragraph sx={{ mt: 2 }}>
                <strong>Step 2: Add Attributes to Shifts:</strong>
              </Typography>
              <List dense>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="1. Open a Shift" />
                </ListItem>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="2. Click 'Custom Attributes'" />
                </ListItem>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="3. Select an attribute from the list" />
                </ListItem>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="4. Enter start date (when it applies)" />
                </ListItem>
                <ListItem sx={{ display: "list-item", ml: 2 }}>
                  <ListItemText primary="5. Click Save" />
                </ListItem>
              </List>

              <Alert severity="warning" sx={{ mt: 2 }}>
                <strong>⚠️ Optional:</strong> Shift Attributes are optional.
                Start with your basic shifts first, add attributes later as
                needed.
              </Alert>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* RELATIONSHIPS Section */}
        <Accordion
          expanded={expandedSection === "relationships"}
          onChange={() => handleSectionChange("relationships")}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              🔗 How Everything Connects Together
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" paragraph>
                <strong>The Setup Flow:</strong>
              </Typography>

              <Card sx={{ mb: 2, bgcolor: "#e3f2fd" }}>
                <CardContent>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>Step 1:</strong> Create Shift Profiles
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", ml: 2, mb: 2 }}>
                    Define your shift types: Day Shift (6AM-3PM, $150), Night
                    Shift (3PM-12AM, $200)
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>Step 2:</strong> Add Drivers
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", ml: 2, mb: 2 }}>
                    Create driver records: Ahmed, Marcus, Singh, etc.
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>Step 3:</strong> Add Cabs
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", ml: 2, mb: 2 }}>
                    Create cab records: Cab 17, Cab 18, Cab 19, etc.
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>Step 4:</strong> Create Shifts
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", ml: 2, mb: 2 }}>
                    Assign: Ahmed + Cab 17 + Feb 15 + Day Shift Profile = One
                    Shift
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>Step 5 (Optional):</strong> Add Custom Attributes
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", ml: 2 }}>
                    Tag the shift if needed: "BACKUP CAB" or "TRAINING"
                  </Typography>
                </CardContent>
              </Card>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" paragraph sx={{ mt: 2 }}>
                <strong>Visual Relationship:</strong>
              </Typography>

              <Card sx={{ bgcolor: "#f5f5f5" }}>
                <CardContent>
                  <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                    {`
Shift Profile: "Day Shift"
  ├─ Start: 6 AM
  ├─ End: 3 PM
  └─ Rate: $150/day

            ↓

Shift (ONE specific day)
  ├─ Date: Feb 15, 2026
  ├─ Cab: 17
  ├─ Driver: Ahmed
  ├─ Shift Profile: Day Shift
  └─ Attributes: [Optional: BACKUP CAB]

            ↓

Financial Record
  ├─ Driver: Ahmed
  ├─ Expense: $150 (lease)
  └─ Date: Feb 15, 2026
                    `}
                  </Typography>
                </CardContent>
              </Card>

              <Alert severity="success" sx={{ mt: 2 }}>
                <strong>✨ The Magic:</strong> Once you create shifts, Smart Fleets
                automatically generates Ahmed's financial statement showing the
                $150 lease payment!
              </Alert>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* FAQ Section */}
        <Accordion
          expanded={expandedSection === "faq"}
          onChange={() => handleSectionChange("faq")}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              ❓ Frequently Asked Questions
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ pt: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                Q: Can I change a Shift Profile after creating shifts?
              </Typography>
              <Typography variant="body2" paragraph sx={{ mb: 2 }}>
                A: Yes, you can. But it won't affect shifts that were already
                created with the old profile.
              </Typography>

              <Divider sx={{ my: 1 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                Q: Can one driver drive multiple cabs in a day?
              </Typography>
              <Typography variant="body2" paragraph sx={{ mb: 2 }}>
                A: Yes. Each shift is separate. Ahmed can drive Cab 17 on Feb
                15, then Cab 18 on Feb 16.
              </Typography>

              <Divider sx={{ my: 1 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                Q: What if I delete a Shift Profile that has shifts?
              </Typography>
              <Typography variant="body2" paragraph sx={{ mb: 2 }}>
                A: The system won't let you. You must first move all shifts to a
                different profile or delete the shifts first.
              </Typography>

              <Divider sx={{ my: 1 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                Q: What if I need to change the lease rate mid-month?
              </Typography>
              <Typography variant="body2" paragraph sx={{ mb: 2 }}>
                A: Create a new Shift Profile with the new rate, then apply it
                to shifts starting from that date.
              </Typography>

              <Divider sx={{ my: 1 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                Q: Can multiple drivers use the same shift?
              </Typography>
              <Typography variant="body2" paragraph sx={{ mb: 2 }}>
                A: No. One shift = one driver + one cab + one date. If another
                driver uses the same cab on the same day, it's a different shift.
              </Typography>

              <Divider sx={{ my: 1 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                Q: Do I need Shift Attributes?
              </Typography>
              <Typography variant="body2" paragraph>
                A: No, they're optional. Use them only if you need to mark
                special conditions on shifts.
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Quick Start Section */}
        <Card sx={{ bgcolor: "#c8e6c9", mt: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
              🚀 Quick Start (15 minutes)
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="1. Create 1-2 Shift Profiles (Day, Night)" />
              </ListItem>
              <ListItem>
                <ListItemText primary="2. Add 3-5 test Drivers" />
              </ListItem>
              <ListItem>
                <ListItemText primary="3. Add 2-3 test Cabs" />
              </ListItem>
              <ListItem>
                <ListItemText primary="4. Create 5-10 test Shifts" />
              </ListItem>
              <ListItem>
                <ListItemText primary="5. View a driver's financial statement" />
              </ListItem>
            </List>
            <Typography variant="caption" sx={{ mt: 2, display: "block" }}>
              That's it! You now understand the entire operations system. Add
              more data as needed.
            </Typography>
          </CardContent>
        </Card>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: "#f5f5f5" }}>
        <Button onClick={onClose} variant="contained">
          Got It!
        </Button>
      </DialogActions>
    </Dialog>
  );
}
