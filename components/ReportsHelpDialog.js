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
} from "@mui/material";
import {
  ExpandMore,
  BarChart,
  TrendingUp,
  Receipt,
  Assessment,
  Help,
  CheckCircle,
  Info,
  Description,
} from "@mui/icons-material";

export default function ReportsHelpDialog({ open, onClose }) {
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
          background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
          color: "#1a1a1a",
          fontWeight: 700,
          fontSize: "1.5rem",
          pb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <BarChart sx={{ fontSize: 32 }} />
          Financial Reports & Analytics Guide
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Introduction */}
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="body2">
            Reports help you understand your business performance, driver earnings, and financial
            health. This guide explains how to generate, read, and use financial reports effectively.
          </Typography>
        </Alert>

        {/* Section 1: What are Reports */}
        <Accordion
          expanded={expandedPanel === "reports"}
          onChange={handlePanelChange("reports")}
          sx={{ mb: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Description sx={{ mr: 2, color: "#4facfe" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              What Are Financial Reports?
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2 }}>
            <Box>
              <Typography variant="body2" paragraph>
                Financial reports are summaries of money earned and spent during a specific time
                period. They show the financial health of your business and each driver's earnings.
              </Typography>

              <Card sx={{ mb: 2, backgroundColor: "#f5f5f5" }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    📊 Three Main Report Types:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle sx={{ color: "#4facfe", fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Driver Reports"
                        secondary="Individual earnings and settlements for each driver"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle sx={{ color: "#4facfe", fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Summary Reports"
                        secondary="Performance metrics across all drivers"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle sx={{ color: "#4facfe", fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Statement Builder"
                        secondary="Custom reports for settlement and reconciliation"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                🎯 Why Generate Reports?
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Know exactly how much each driver earned"
                    secondary="Transparency and dispute prevention"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Identify top performers"
                    secondary="Understand driver productivity and patterns"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Settle driver accounts"
                    secondary="Final calculation of money owed or owing"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Make business decisions"
                    secondary="Plan rates, incentives, and growth strategies"
                  />
                </ListItem>
              </List>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Section 2: Driver Reports */}
        <Accordion
          expanded={expandedPanel === "driver"}
          onChange={handlePanelChange("driver")}
          sx={{ mb: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <TrendingUp sx={{ mr: 2, color: "#00f2fe" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Driver Reports & Statements
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2 }}>
            <Box>
              <Typography variant="body2" paragraph>
                Driver reports show a detailed breakdown of one driver's financial activity for a
                specific period (usually monthly).
              </Typography>

              <Card sx={{ mb: 2, backgroundColor: "#e0f7ff" }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    📋 What's in a Driver Report:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <Chip label="Period" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">The date range (e.g., Feb 1-28, 2026)</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="Revenues" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        All money earned (lease revenue, other charges, bonuses)
                      </Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="Expenses" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        All money owed (vehicle lease, fuel, damage, fees)
                      </Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="Previous Balance" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">Money carried over from last month</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="Net Amount" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        Final calculation (Revenue - Expenses + Previous Balance)
                      </Typography>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                ✅ How to Generate a Driver Report:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="1. Go to Driver Reports"
                    secondary="Navigate to Reports > Driver Reports"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="2. Select the Driver"
                    secondary="Choose from dropdown or search"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="3. Choose the Period"
                    secondary="Select month and year or custom date range"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="4. Click Generate"
                    secondary="System calculates all revenues and expenses"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="5. Review & Export"
                    secondary="View on screen, print to PDF, or email to driver"
                  />
                </ListItem>
              </List>

              <Card sx={{ mt: 2, backgroundColor: "#fff3e0" }}>
                <CardContent>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    💡 Pro Tip: Color-Coded Sections
                  </Typography>
                  <Typography variant="body2">
                    Different sections use different colors for easy scanning: Green for revenues,
                    Red for expenses, Blue for charges. This helps drivers quickly understand their
                    statement.
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Section 3: Understanding Report Sections */}
        <Accordion
          expanded={expandedPanel === "sections"}
          onChange={handlePanelChange("sections")}
          sx={{ mb: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Assessment sx={{ mr: 2, color: "#10b981" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Reading Report Sections
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                📊 Revenues Section (Money Earned):
              </Typography>
              <Card sx={{ mb: 2, backgroundColor: "#e8f5e9" }}>
                <CardContent>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Lease Revenue"
                        secondary="Base daily/weekly lease payment for the cab"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Account Charges"
                        secondary="Fares charged to customer accounts"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Credit Card Revenue"
                        secondary="Fares paid by credit card"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Other Revenue"
                        secondary="Bonuses, incentives, tips, or other amounts"
                      />
                    </ListItem>
                  </List>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#388e3c" }}>
                    Total Revenues = Sum of all above
                  </Typography>
                </CardContent>
              </Card>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                💰 Expenses Section (Money Owed):
              </Typography>
              <Card sx={{ mb: 2, backgroundColor: "#ffebee" }}>
                <CardContent>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Vehicle Lease"
                        secondary="Payment to lease the cab"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Recurring Expenses"
                        secondary="Gas, insurance, maintenance (split per shift)"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="One-Time Charges"
                        secondary="Damage, traffic fines, fuel surcharge"
                      />
                    </ListItem>
                  </List>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#d32f2f" }}>
                    Total Expenses = Sum of all above
                  </Typography>
                </CardContent>
              </Card>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                📈 Calculation (Final Amount):
              </Typography>
              <Card sx={{ backgroundColor: "#f5f5f5" }}>
                <CardContent>
                  <Box sx={{ fontFamily: "monospace", mb: 1 }}>
                    <Typography variant="body2">Total Revenues</Typography>
                    <Typography variant="body2">- Total Expenses</Typography>
                    <Typography variant="body2">+ Previous Balance (if any)</Typography>
                    <Divider sx={{ my: 0.5 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#1976d2" }}>
                      = Net Amount Due
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
                    Positive = You owe the driver | Negative = Driver owes you
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Section 4: Summary Reports */}
        <Accordion
          expanded={expandedPanel === "summary"}
          onChange={handlePanelChange("summary")}
          sx={{ mb: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <BarChart sx={{ mr: 2, color: "#f57c00" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              All Driver Summary & Performance
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2 }}>
            <Box>
              <Typography variant="body2" paragraph>
                Summary reports show performance metrics across all your drivers, helping you compare
                efficiency and identify trends.
              </Typography>

              <Card sx={{ mb: 2, backgroundColor: "#f5f5f5" }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    📊 Key Metrics Shown:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <Chip label="Total Earnings" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">Sum of all revenues</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="Total Expenses" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">Sum of all expenses</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="Net Profit" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">Earnings minus expenses</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="Profit Margin" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">Percentage of earnings kept</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="Efficiency Score" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">Performance rating compared to others</Typography>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                🎯 Use Cases:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Identify top performers"
                    secondary="See which drivers earn the most and work efficiently"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Benchmark performance"
                    secondary="Compare drivers to fleet average"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Spot problematic patterns"
                    secondary="Notice high expenses or declining earnings"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Plan incentives"
                    secondary="Reward top performers or support struggling drivers"
                  />
                </ListItem>
              </List>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Section 5: Statement Builder */}
        <Accordion
          expanded={expandedPanel === "builder"}
          onChange={handlePanelChange("builder")}
          sx={{ mb: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Receipt sx={{ mr: 2, color: "#c2185b" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Statement Builder & Settlement
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2 }}>
            <Box>
              <Typography variant="body2" paragraph>
                The Statement Builder lets you create custom financial statements and finalize driver
                settlements.
              </Typography>

              <Card sx={{ mb: 2, backgroundColor: "#f3e5f5" }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    🔧 What You Can Do:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Select driver and period"
                        secondary="Customize date range as needed"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Review line items"
                        secondary="See and verify each charge and credit"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Add adjustments"
                        secondary="Include special bonuses or corrections"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Record payment"
                        secondary="Enter how much you're paying or they're owing"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Finalize & Send"
                        secondary="Lock the statement and send to driver"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                ✅ Settlement Workflow:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="1. Generate Statement"
                    secondary="Create report for the period you're settling"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="2. Review with Driver"
                    secondary="Go through line items together if needed"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="3. Confirm Final Amount"
                    secondary="Agree on total before payment"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="4. Record Payment"
                    secondary="Enter how much money was paid"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="5. Finalize"
                    secondary="Mark settlement as complete and archive"
                  />
                </ListItem>
              </List>

              <Card sx={{ mt: 2, backgroundColor: "#fff3e0" }}>
                <CardContent>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    💡 When to Use:
                  </Typography>
                  <Typography variant="body2">
                    Use the Statement Builder for monthly settlements, special payments, or when
                    drivers are leaving. It keeps a permanent record of all settlements for auditing.
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Section 6: Tips & Best Practices */}
        <Accordion
          expanded={expandedPanel === "tips"}
          onChange={handlePanelChange("tips")}
          sx={{ mb: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Info sx={{ mr: 2, color: "#667eea" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Tips for Using Reports Effectively
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                📌 Best Practices:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Generate reports at consistent times"
                    secondary="Weekly, bi-weekly, or monthly so drivers expect them"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Review for data accuracy"
                    secondary="Check that all charges and credits are correct before sharing"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Keep records organized"
                    secondary="Archive old reports for auditing and reference"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Communicate changes upfront"
                    secondary="If rates or expenses change, notify drivers in advance"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Use trends, not just points"
                    secondary="Look at 3+ months to spot patterns, not just one month"
                  />
                </ListItem>
              </List>

              <Card sx={{ mt: 3, backgroundColor: "#e0f2f1" }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    ✅ Monthly Checklist:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <Chip label="☐" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">Verify all trips and charges are recorded</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="☐" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">Update any recurring expenses (fuel, insurance)</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="☐" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">Generate driver reports</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="☐" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">Review summary metrics for trends</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="☐" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">Send reports to drivers</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="☐" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">Settle accounts and record payments</Typography>
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
            <Help sx={{ mr: 2, color: "#1976d2" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Frequently Asked Questions
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                ❓ How often should I generate reports?
              </Typography>
              <Typography variant="body2" paragraph sx={{ ml: 2, mb: 2 }}>
                Most companies do monthly reports for settlement. Some generate weekly summaries for
                monitoring. You can generate as often as needed for monitoring.
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                ❓ What if a report shows errors?
              </Typography>
              <Typography variant="body2" paragraph sx={{ ml: 2, mb: 2 }}>
                Check your source data (trip records, expense entries). Fix the underlying issue, then
                regenerate the report. For finalized reports, you may need to create an adjustment
                entry.
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                ❓ Can drivers dispute their report?
              </Typography>
              <Typography variant="body2" paragraph sx={{ ml: 2, mb: 2 }}>
                Yes. Review line items together, discuss any discrepancies, and correct data if
                needed. Regenerate and settle once both parties agree.
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                ❓ How do I compare driver performance?
              </Typography>
              <Typography variant="body2" paragraph sx={{ ml: 2, mb: 2 }}>
                Use the Summary Report to see each driver's earnings, expenses, and profit margins.
                Look at efficiency score and trends over several months.
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                ❓ What does "Previous Balance" mean?
              </Typography>
              <Typography variant="body2" paragraph sx={{ ml: 2, mb: 2 }}>
                Money carried over from the last settlement. If a driver was owed $50 last month and
                you didn't pay it, it shows as previous balance this month.
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                ❓ Can I modify a finalized statement?
              </Typography>
              <Typography variant="body2" paragraph sx={{ ml: 2, mb: 2 }}>
                Not directly. Create a new adjustment entry or dispute memo instead. This maintains
                audit trail and accurate historical records.
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Quick Start Guide */}
        <Card sx={{ mt: 3, backgroundColor: "#e0f2f1", border: "2px solid #4facfe" }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
              ⚡ 15-Minute Quick Start
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="1. Go to Driver Reports"
                  secondary="Select any driver and current month"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="2. Click Generate"
                  secondary="See their full earnings and expenses"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="3. Review the sections"
                  secondary="Understand how revenues and expenses are organized"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="4. Go to Summary Report"
                  secondary="Compare this driver to others"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="5. Try Statement Builder"
                  secondary="Create a custom settlement for practice"
                />
              </ListItem>
            </List>
            <Typography variant="caption" sx={{ display: "block", mt: 2, fontStyle: "italic" }}>
              ✅ You now understand the full reporting system! Generate real reports with confidence.
            </Typography>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
