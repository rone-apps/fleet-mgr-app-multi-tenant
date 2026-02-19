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
} from "@mui/material";
import {
  ExpandMore,
  Person,
  Receipt,
  CreditCard,
  Paid,
  Assessment,
  Help,
  CheckCircle,
  Info,
  AccountBalanceWallet,
} from "@mui/icons-material";

export default function AccountCustomerHelpDialog({ open, onClose }) {
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
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          fontWeight: 700,
          fontSize: "1.5rem",
          pb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AccountBalanceWallet sx={{ fontSize: 32 }} />
          Account & Customer Management Guide
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Introduction */}
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="body2">
            The Account & Customer section helps you manage your clients, track their accounts,
            and manage invoicing and payments. This guide explains each concept in simple terms.
          </Typography>
        </Alert>

        {/* Section 1: What is a Customer */}
        <Accordion
          expanded={expandedPanel === "customers"}
          onChange={handlePanelChange("customers")}
          sx={{ mb: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Person sx={{ mr: 2, color: "#667eea" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              What are Customers?
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2 }}>
            <Box>
              <Typography variant="body2" paragraph>
                Customers are the people or companies that you do business with. They might be:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle sx={{ color: "#388e3c", fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Individual customers who use your taxi services"
                    secondary="Like corporate clients, frequent riders, or account holders"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle sx={{ color: "#388e3c", fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Businesses that contract your fleet"
                    secondary="Hotels, airports, ride-sharing platforms, corporate accounts"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle sx={{ color: "#388e3c", fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Charge account holders"
                    secondary="Customers who pay monthly rather than per trip"
                  />
                </ListItem>
              </List>

              <Card sx={{ mt: 2, backgroundColor: "#f5f5f5" }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    💡 Why Track Customers?
                  </Typography>
                  <Typography variant="body2">
                    Tracking customers helps you understand who generates the most revenue, identify
                    payment patterns, and send targeted invoices and statements.
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Section 2: Customer Information */}
        <Accordion
          expanded={expandedPanel === "info"}
          onChange={handlePanelChange("info")}
          sx={{ mb: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Info sx={{ mr: 2, color: "#1976d2" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Customer Information & Profiles
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2 }}>
            <Box>
              <Typography variant="body2" paragraph>
                When you add a customer, you record their basic information:
              </Typography>

              <Card sx={{ mb: 2, backgroundColor: "#f5f5f5" }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    📋 Basic Information Needed:
                  </Typography>
                  <List dense sx={{ mb: 1 }}>
                    <ListItem>
                      <Chip label="Customer Name" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">The person or company name</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="Email Address" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">For sending invoices and statements</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="Phone Number" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">For contact and follow-up</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="Address" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">Billing address for invoices</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="Account Type" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">Standard, Premium, Corporate, etc.</Typography>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, mt: 2 }}>
                ✅ How to Add a Customer:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="1. Click 'Add Customer' or the Plus button"
                    secondary="Opens a form to enter customer details"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="2. Fill in the customer information"
                    secondary="Name, email, phone, address, account type"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="3. Set the account status"
                    secondary="Active, Inactive, or On Hold"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="4. Click Save"
                    secondary="Customer is now added to your system"
                  />
                </ListItem>
              </List>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Section 3: Account Management */}
        <Accordion
          expanded={expandedPanel === "accounts"}
          onChange={handlePanelChange("accounts")}
          sx={{ mb: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <CreditCard sx={{ mr: 2, color: "#d32f2f" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Managing Customer Accounts
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2 }}>
            <Box>
              <Typography variant="body2" paragraph>
                Each customer has an account that tracks their balance and transactions.
              </Typography>

              <Card sx={{ mb: 2, backgroundColor: "#fff3e0" }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    🎯 Account Balance Concept:
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Think of it like a checking account. The balance can be positive (they owe you money)
                    or negative (you owe them money / they have a credit).
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                    <Box sx={{ flex: 1, p: 1.5, backgroundColor: "#e8f5e9", borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Positive Balance 📈
                      </Typography>
                      <Typography variant="body2">Customer owes you money</Typography>
                    </Box>
                    <Box sx={{ flex: 1, p: 1.5, backgroundColor: "#ffebee", borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Negative Balance 📉
                      </Typography>
                      <Typography variant="body2">You owe the customer (credit)</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                📊 What Affects Account Balance:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Assessment sx={{ fontSize: 20, color: "#f57c00" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Charges Added"
                    secondary="Trip charges, service fees, or other amounts owed"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Paid sx={{ fontSize: 20, color: "#388e3c" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Payments Received"
                    secondary="Money the customer pays toward their balance"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Receipt sx={{ fontSize: 20, color: "#1976d2" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Adjustments"
                    secondary="Refunds, credits, or corrections"
                  />
                </ListItem>
              </List>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Section 4: Invoicing */}
        <Accordion
          expanded={expandedPanel === "invoicing"}
          onChange={handlePanelChange("invoicing")}
          sx={{ mb: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Receipt sx={{ mr: 2, color: "#f57c00" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Creating & Managing Invoices
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2 }}>
            <Box>
              <Typography variant="body2" paragraph>
                Invoices are formal bills that summarize charges and payments for a customer during a
                specific period.
              </Typography>

              <Card sx={{ mb: 2, backgroundColor: "#f5f5f5" }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    📝 What's on an Invoice:
                  </Typography>
                  <List dense sx={{ mb: 1 }}>
                    <ListItem>
                      <Chip label="Invoice Number" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">Unique identifier (INV-001, etc.)</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="Invoice Date" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">When the invoice was created</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="Due Date" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">When payment is expected</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="Line Items" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">Individual charges and descriptions</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="Total Amount" size="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">Sum of all charges and fees</Typography>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                ✅ How to Generate an Invoice:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="1. Go to Customer Management"
                    secondary="Select the customer you want to invoice"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="2. Click 'Generate Invoice'"
                    secondary="Choose the period and charges to include"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="3. Review the invoice"
                    secondary="Make sure all charges and amounts are correct"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="4. Send to Customer"
                    secondary="Email directly or download as PDF"
                  />
                </ListItem>
              </List>

              <Card sx={{ mt: 2, backgroundColor: "#e3f2fd" }}>
                <CardContent>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    💡 Pro Tip: Invoice Status
                  </Typography>
                  <Typography variant="body2">
                    Invoices can be Draft (not final), Sent (delivered to customer), or Paid (settled).
                    This helps you track what customers have received and what's been paid.
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Section 5: Payments & Collections */}
        <Accordion
          expanded={expandedPanel === "payments"}
          onChange={handlePanelChange("payments")}
          sx={{ mb: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Paid sx={{ mr: 2, color: "#388e3c" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Recording Payments & Collections
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2 }}>
            <Box>
              <Typography variant="body2" paragraph>
                When customers pay their invoices, you record these payments to update their account
                balance.
              </Typography>

              <Card sx={{ mb: 2, backgroundColor: "#e8f5e9" }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    💰 Payment Methods:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <Chip label="Cash" size="small" sx={{ mr: 1 }} />
                    </ListItem>
                    <ListItem>
                      <Chip label="Check" size="small" sx={{ mr: 1 }} />
                    </ListItem>
                    <ListItem>
                      <Chip label="Bank Transfer" size="small" sx={{ mr: 1 }} />
                    </ListItem>
                    <ListItem>
                      <Chip label="Credit Card" size="small" sx={{ mr: 1 }} />
                    </ListItem>
                    <ListItem>
                      <Chip label="Mobile Payment" size="small" sx={{ mr: 1 }} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                ✅ How to Record a Payment:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="1. Select the Customer"
                    secondary="Find them in your customer list"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="2. Click 'Record Payment'"
                    secondary="Opens payment entry form"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="3. Enter Payment Details"
                    secondary="Amount, date, method, reference number"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="4. Apply to Invoice(s)"
                    secondary="Specify which invoices this payment covers"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="5. Save"
                    secondary="Account balance updates automatically"
                  />
                </ListItem>
              </List>

              <Card sx={{ mt: 2, backgroundColor: "#fff3e0" }}>
                <CardContent>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    ⚠️ Important:
                  </Typography>
                  <Typography variant="body2">
                    Always record payments promptly. This keeps your financial records accurate and
                    helps you identify overdue invoices.
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Section 6: Collections & Follow-up */}
        <Accordion
          expanded={expandedPanel === "collections"}
          onChange={handlePanelChange("collections")}
          sx={{ mb: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Assessment sx={{ mr: 2, color: "#c2185b" }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Collections & Follow-up
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2 }}>
            <Box>
              <Typography variant="body2" paragraph>
                Collections is the process of following up with customers who haven't paid their
                invoices on time.
              </Typography>

              <Card sx={{ mb: 2, backgroundColor: "#fcebee" }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    📌 Types of Invoices to Track:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <Chip
                        label="Current"
                        size="small"
                        sx={{ mr: 1, backgroundColor: "#e8f5e9" }}
                      />
                      <Typography variant="body2">Invoices not yet due</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip
                        label="Due"
                        size="small"
                        sx={{ mr: 1, backgroundColor: "#fff3e0" }}
                      />
                      <Typography variant="body2">Invoices due today or passed due date</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip
                        label="Overdue"
                        size="small"
                        sx={{ mr: 1, backgroundColor: "#ffebee" }}
                      />
                      <Typography variant="body2">Invoices past their due date</Typography>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                🎯 Collection Best Practices:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Send reminders before due date"
                    secondary="Help customers remember to pay on time"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Follow up on overdue invoices quickly"
                    secondary="Contact customer within 5-7 days of due date"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Offer payment plans for large amounts"
                    secondary="Help customers manage cash flow"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Keep detailed notes"
                    secondary="Document all contact attempts and agreements"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Escalate if needed"
                    secondary="Take action for severely overdue amounts"
                  />
                </ListItem>
              </List>
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
                ❓ Can I have multiple accounts per customer?
              </Typography>
              <Typography variant="body2" paragraph sx={{ ml: 2, mb: 2 }}>
                Yes! Large customers might have multiple accounts (one for corporate, one for travel,
                etc.). Each is tracked separately.
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                ❓ What happens if a customer overpays?
              </Typography>
              <Typography variant="body2" paragraph sx={{ ml: 2, mb: 2 }}>
                The account will show a negative balance (credit). You can apply this credit to future
                invoices or issue a refund.
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                ❓ Can I edit an invoice after it's sent?
              </Typography>
              <Typography variant="body2" paragraph sx={{ ml: 2, mb: 2 }}>
                Draft invoices can be edited. Once sent, you should create a credit memo or new invoice
                for any changes.
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                ❓ How do I know which customers haven't paid?
              </Typography>
              <Typography variant="body2" paragraph sx={{ ml: 2, mb: 2 }}>
                Use the Accounts section to filter by "Overdue" status, or generate an aging report
                showing unpaid invoices.
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                ❓ What's the difference between a customer and an invoice?
              </Typography>
              <Typography variant="body2" paragraph sx={{ ml: 2, mb: 2 }}>
                A customer is the entity (person/company). An invoice is a bill sent to that customer
                for specific charges during a period.
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                ❓ Can I set payment terms (like Net 30)?
              </Typography>
              <Typography variant="body2" paragraph sx={{ ml: 2, mb: 2 }}>
                Yes! Set default payment terms on the customer record, and the system calculates due
                dates automatically on invoices.
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Quick Start Guide */}
        <Card sx={{ mt: 3, backgroundColor: "#f0f4ff", border: "2px solid #667eea" }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
              ⚡ 10-Minute Quick Start
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="1. Add 2-3 test customers"
                  secondary="Use your actual customers or test names"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="2. Add some charges to one customer"
                  secondary="Either manually or from existing data"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="3. Generate an invoice"
                  secondary="See how it looks with real data"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="4. Record a test payment"
                  secondary="See how the account balance updates"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="5. Explore the reports"
                  secondary="View aging, collections, and revenue reports"
                />
              </ListItem>
            </List>
            <Typography variant="caption" sx={{ display: "block", mt: 2, fontStyle: "italic" }}>
              ✅ Now you understand the basics! Explore other features at your own pace.
            </Typography>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
