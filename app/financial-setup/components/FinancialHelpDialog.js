"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Paper,
  Alert,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Help as HelpIcon,
  Category as CategoryIcon,
  TrendingUp as RevenueIcon,
  AttachMoney as MoneyIcon,
  LocalOffer as TagIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";

export default function FinancialHelpDialog({ open, onClose }) {
  const sections = [
    {
      title: "Expense Categories",
      icon: <CategoryIcon sx={{ color: "#d32f2f" }} />,
      content: (
        <>
          <Typography variant="body2" paragraph>
            Expense categories define the types of charges that can be applied to drivers and owners.
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
            How to Create an Expense Category:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Click 'Add Expense Category' button in the Expense Categories tab" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Fill in category code (e.g., 'FUEL', 'INSURANCE') and name" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Select category type: FIXED (constant amount) or VARIABLE (changes over time)" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Choose who this applies to: CAB, SHIFT, OWNER, DRIVER, or COMPANY" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Set description, tags, and activate it" />
            </ListItem>
          </List>

          <Alert severity="info" sx={{ mt: 2 }}>
            Once created, you can use this category when creating recurring or one-time expenses.
          </Alert>
        </>
      ),
    },
    {
      title: "Revenue Categories",
      icon: <RevenueIcon sx={{ color: "#2e7d32" }} />,
      content: (
        <>
          <Typography variant="body2" paragraph>
            Revenue categories track the different types of income sources in your fleet.
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
            How to Create a Revenue Category:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Go to Revenue Categories tab" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Click 'Add Revenue Category' button" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Enter category code (e.g., 'TRIP_FARE', 'BONUS') and display name" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Choose type: FIXED or VARIABLE" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Add description and activate" />
            </ListItem>
          </List>

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
            Common Revenue Types:
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip label="Trip Fares" size="small" variant="outlined" />
            <Chip label="Tips" size="small" variant="outlined" />
            <Chip label="Bonuses" size="small" variant="outlined" />
            <Chip label="Account Charges" size="small" variant="outlined" />
            <Chip label="Other Revenue" size="small" variant="outlined" />
          </Box>
        </>
      ),
    },
    {
      title: "Adding Expenses & Revenue",
      icon: <MoneyIcon sx={{ color: "#1565c0" }} />,
      content: (
        <>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Adding a Recurring Expense:
          </Typography>
          <Typography variant="body2" paragraph>
            Recurring expenses are charged repeatedly on a schedule (daily, weekly, monthly, etc).
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Go to Expenses section" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Click 'Add Recurring Expense' button" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Select an expense category from those you created" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Choose application type (see options below)" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Set amount, billing method (daily/weekly/monthly), and effective dates" />
            </ListItem>
          </List>

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
            Application Types (How Expenses Apply):
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <TagIcon fontSize="small" sx={{ color: "#f57c00" }} />
              </ListItemIcon>
              <ListItemText
                primary="ALL_OWNERS"
                secondary="Charge all cab owners equally"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <TagIcon fontSize="small" sx={{ color: "#f57c00" }} />
              </ListItemIcon>
              <ListItemText
                primary="ALL_DRIVERS"
                secondary="Charge all drivers equally"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <TagIcon fontSize="small" sx={{ color: "#f57c00" }} />
              </ListItemIcon>
              <ListItemText
                primary="SPECIFIC_PERSON"
                secondary="Charge a specific owner or driver"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <TagIcon fontSize="small" sx={{ color: "#f57c00" }} />
              </ListItemIcon>
              <ListItemText
                primary="SHIFT_PROFILE"
                secondary="Charge based on shift profile (applies to all shifts using that profile)"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <TagIcon fontSize="small" sx={{ color: "#f57c00" }} />
              </ListItemIcon>
              <ListItemText
                primary="SPECIFIC_SHIFT"
                secondary="Charge a specific shift only"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <TagIcon fontSize="small" sx={{ color: "#f57c00" }} />
              </ListItemIcon>
              <ListItemText
                primary="ALL_ACTIVE_SHIFTS"
                secondary="Charge all active shifts (expands to one charge per shift)"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <TagIcon fontSize="small" sx={{ color: "#f57c00" }} />
              </ListItemIcon>
              <ListItemText
                primary="SHIFTS_WITH_ATTRIBUTE"
                secondary="Charge only shifts that have a specific custom attribute (e.g., transponders)"
              />
            </ListItem>
          </List>

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
            Adding a One-Time Expense:
          </Typography>
          <Typography variant="body2" paragraph>
            One-time expenses are single charges that occur once on a specific date.
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Go to Expenses section" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Click 'Add One-Time Expense' button" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Select category, application type, date, and amount" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Add optional description and notes" />
            </ListItem>
          </List>

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
            Adding Other Revenue:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Go to Reports > Other Revenue section" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Click 'Add Other Revenue' button" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Select driver/owner, category, date, and amount" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Add description for tracking" />
            </ListItem>
          </List>
        </>
      ),
    },
    {
      title: "Lease Plans & Rates",
      icon: <MoneyIcon sx={{ color: "#6a1b9a" }} />,
      content: (
        <>
          <Typography variant="body2" paragraph>
            Lease plans define the rental arrangements between owners and drivers. Each plan has a base rate and mileage rate.
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
            How to Create a Lease Plan:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Go to Lease Plans & Rates tab" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Click 'Add Lease Plan' button" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Enter plan name (e.g., 'Premium', 'Standard', 'Economy')" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Set effective dates and save" />
            </ListItem>
          </List>

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
            How to Add Rates to a Lease Plan:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Select a lease plan from the list" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Click 'Add Rate' button" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Set shift type (Day, Night, etc.)" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Enter base rate (daily lease cost) and mileage rate (per mile)" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Set effective dates and save" />
            </ListItem>
          </List>

          <Alert severity="success" sx={{ mt: 2 }}>
            <strong>Example:</strong> A Standard plan for Day shifts might have: $50 base rate + $0.25 per mile
          </Alert>
        </>
      ),
    },
    {
      title: "Lease Rate Overrides",
      icon: <MoneyIcon sx={{ color: "#c62828" }} />,
      content: (
        <>
          <Typography variant="body2" paragraph>
            Rate overrides allow you to set custom lease rates for specific owner-driver pairs or special situations, overriding the standard plan rates.
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
            How to Create a Rate Override:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Go to Lease Rate Overrides tab" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Click 'Add Override' button" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Select the owner (cab owner) and driver (who rents)" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Choose the shift type affected" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Set custom base rate and mileage rate (leave blank to use plan default)" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Add effective dates and reason for override" />
            </ListItem>
          </List>

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
            When to Use Overrides:
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip label="Driver promotions" size="small" variant="outlined" color="primary" />
            <Chip label="Loyalty discounts" size="small" variant="outlined" color="primary" />
            <Chip label="Special agreements" size="small" variant="outlined" color="primary" />
            <Chip label="Seasonal rates" size="small" variant="outlined" color="primary" />
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            Overrides take precedence over standard lease plan rates when calculating charges.
          </Alert>
        </>
      ),
    },
    {
      title: "Merchant Mappings",
      icon: <CategoryIcon sx={{ color: "#0097a7" }} />,
      content: (
        <>
          <Typography variant="body2" paragraph>
            Merchant mappings link taxi dispatch platforms or payment processors to specific cabs, enabling automatic revenue tracking.
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
            How to Create a Merchant Mapping:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Go to Merchant Mappings tab" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Click 'Add Mapping' button" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Select a merchant (e.g., Uber, Lyft, local dispatch)" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Assign one or more cabs to this merchant" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Verify the mapping and save" />
            </ListItem>
          </List>

          <Alert severity="info" sx={{ mt: 2 }}>
            Once mapped, revenue from assigned merchants will automatically appear in driver/owner statements.
          </Alert>
        </>
      ),
    },
    {
      title: "Attribute Costs (Custom Charges)",
      icon: <TagIcon sx={{ color: "#5e35b1" }} />,
      content: (
        <>
          <Typography variant="body2" paragraph>
            Attribute costs let you charge for special features or equipment on shifts, like transponders, GPS trackers, or special permits.
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
            How to Set Up Attribute Costs:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Go to Attribute Costs tab" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="First, define attribute types in Shift Attributes section" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Click 'Add Attribute Cost' button" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Select an attribute type (e.g., 'Transponder')" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Set price and billing unit (daily/monthly)" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Set effective dates" />
            </ListItem>
          </List>

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
            How to Charge Shifts with Attributes:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Go to Expenses > One-Time Expenses" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Click 'Add One-Time Expense'" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Select application type 'SHIFTS_WITH_ATTRIBUTE'" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="Choose the attribute type (e.g., 'Transponder')" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />
              </ListItemIcon>
              <ListItemText primary="The system will automatically charge only shifts with that attribute" />
            </ListItem>
          </List>

          <Alert severity="success" sx={{ mt: 2 }}>
            <strong>Example:</strong> Airport permit charge on all shifts that have the 'Airport Permit' attribute.
          </Alert>
        </>
      ),
    },
    {
      title: "Key Concepts & Tips",
      icon: <InfoIcon sx={{ color: "#1565c0" }} />,
      content: (
        <>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Active vs. Inactive Items:
          </Typography>
          <Typography variant="body2" paragraph>
            All categories and expenses must be activated to be used in statements. Inactive items are available but won't appear on reports.
          </Typography>

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
            Effective Dates:
          </Typography>
          <Typography variant="body2" paragraph>
            Always set proper effective dates. Expenses with effective dates in the future won't be charged until that date arrives.
          </Typography>

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
            Prorating:
          </Typography>
          <Typography variant="body2" paragraph>
            Monthly expenses are automatically prorated (divided) for the actual days in the statement period. A $300 monthly expense for 10 days is charged proportionally.
          </Typography>

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
            Statement Generation:
          </Typography>
          <Typography variant="body2" paragraph>
            After creating expenses and revenue, use the Reports section to generate statements for drivers/owners. Statements show all charges and income for a date range.
          </Typography>

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
            Statement Finalization:
          </Typography>
          <Typography variant="body2" paragraph>
            Draft statements recalculate each time. Finalize a statement to lock in the numbers for historical reference. Previous balance is carried forward from the last finalized statement.
          </Typography>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <strong>Important:</strong> Changes to categories or expenses only affect future statements. Historical finalized statements are not affected.
          </Alert>
        </>
      ),
    },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <HelpIcon />
          Financial Configuration Guide
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          This guide helps you understand how to set up and manage all financial aspects of your fleet, including expenses,
          revenues, lease rates, and custom charges.
        </Alert>

        {sections.map((section, index) => (
          <Accordion key={index} defaultOpen={index === 0}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                {section.icon}
                <Typography variant="h6">{section.title}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 2 }}>
              <Divider sx={{ mb: 2 }} />
              {section.content}
            </AccordionDetails>
          </Accordion>
        ))}

        <Box sx={{ mt: 4, p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Need More Help?
          </Typography>
          <Typography variant="body2">
            If you need additional assistance, please contact your system administrator or refer to the full documentation
            in the system.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary" variant="contained">
          Close Guide
        </Button>
      </DialogActions>
    </Dialog>
  );
}
