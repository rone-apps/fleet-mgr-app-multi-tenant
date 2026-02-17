import { Grid, Card, CardContent, Box, Typography, Tooltip } from "@mui/material";
import {
  Category as CategoryIcon,
  TrendingUp as RevenueIcon,
  Assignment as PlanIcon,
  AttachMoney as MoneyIcon,
  CreditCard as MerchantIcon,
  HelpOutline as HelpIcon,
} from "@mui/icons-material";

export default function FinancialStats({ stats, onHelpClick }) {
  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CategoryIcon color="error" />
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Expense Categories
                </Typography>
                <Typography variant="h5">{stats.expenseCategories}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <RevenueIcon color="success" />
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Revenue Categories
                </Typography>
                <Typography variant="h5">{stats.revenueCategories}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PlanIcon color="primary" />
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Lease Plans
                </Typography>
                <Typography variant="h5">{stats.leasePlans}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <MoneyIcon color="primary" />
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Lease Rates
                </Typography>
                <Typography variant="h5">{stats.leaseRates}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <MoneyIcon color="secondary" />
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Rate Overrides
                </Typography>
                <Typography variant="h5">{stats.leaseRateOverrides}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <MerchantIcon color="info" />
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Merchant Mappings
                </Typography>
                <Typography variant="h5">{stats.merchantMappings}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2}>
        <Tooltip title="Click to view configuration guide">
          <Card
            onClick={onHelpClick}
            sx={{
              cursor: "pointer",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 8px 24px rgba(102, 126, 234, 0.4)",
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <HelpIcon sx={{ fontSize: 28 }} />
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Help & Guide
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Learn More
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Tooltip>
      </Grid>
    </Grid>
  );
}
