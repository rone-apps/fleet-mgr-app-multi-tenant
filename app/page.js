"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Button,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
  alpha,
  Paper,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from "@mui/material";
import {
  People,
  DirectionsCar,
  Assessment,
  Logout,
  Person,
  AccountBalance,
  LocalTaxi,
  CloudUpload,
  AutoAwesome,
  TrendingUp,
  Speed,
  CreditCard,
  Receipt,
  AttachMoney,
  Description,
  CheckCircle,
  Timeline,
  Insights,
  Schedule,
  Analytics,
  ArrowForward,
  Category,
  ArrowBack,
  Engineering,
  FileUpload,
  ListAlt,
  SmartToy,
  VerifiedUser,
  LocalShipping,
  MonetizationOn,
  BarChart,
  PersonAdd,
  DirectionsBus,
  AccessTime,
  Palette,
  ApiOutlined,
  UploadFile,
  FileDownload,
  Lightbulb,
  TrendingUpOutlined,
  ReceiptOutlined,
  StorefrontOutlined,
  GroupOutlined,
  AiOutlined,
  SchemaOutlined,
  HelpOutline,
  PaymentOutlined,
  CommuteOutlined,
  Business,
  WavingHand,
  SwapHoriz,
  Apartment,
  MenuBook,
  Support,
  Article,
  Code,
} from "@mui/icons-material";
import { getCurrentUser, logout, isAuthenticated, getTenantName, API_BASE_URL } from './lib/api';
import { setSelectedCategory as storeCategoryNav } from './lib/categoryNav';
import FinancialHelpDialog from './financial-setup/components/FinancialHelpDialog';
import OperationsHelpCard from '../components/OperationsHelpCard';
import AccountCustomerHelpCard from '../components/AccountCustomerHelpCard';
import ReportsHelpCard from '../components/ReportsHelpCard';
import DataIntegrationHelpCard from '../components/DataIntegrationHelpCard';

function HomePageContent() {
  const [user, setUser] = useState(null);
  const [tenantName, setTenantName] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('category') || null;

  const setSelectedCategory = useCallback((category) => {
    if (category) {
      router.push(`/?category=${category}`, { scroll: false });
    } else {
      router.push('/', { scroll: false });
    }
  }, [router]);

  useEffect(() => {
    const checkAuthentication = () => {
      try {
        const storedTenantSchema = localStorage.getItem("tenantSchema");
        let currentUser = getCurrentUser();

        if (currentUser && isAuthenticated() && storedTenantSchema) {
          setUser(currentUser);
          setTenantName(getTenantName());

          setIsLoading(false);
          return;
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Authentication check error:", err);
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  const handleLogout = () => {
    setLogoutDialogOpen(true);
  };

  const handleConfirmLogout = () => {
    setLogoutDialogOpen(false);
    logout();
  };

  const handleCancelLogout = () => {
    setLogoutDialogOpen(false);
  };

  const isUserAuthenticated = isAuthenticated() && user;

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f6f9fc' }}>
        <Box sx={{ textAlign: 'center' }}>
          <LocalTaxi sx={{ fontSize: 60, color: '#ffc107', mb: 2, animation: 'spin 2s linear infinite' }} />
          <Typography variant="h6" sx={{ color: '#3e5244', fontWeight: 600 }}>
            Smart Fleets
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            Loading dashboard...
          </Typography>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </Box>
      </Box>
    );
  }

  if (!isUserAuthenticated) {
    return <MarketingLandingPage router={router} />;
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f6f9fc' }}>
      <AppBar position="static" elevation={0} sx={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #635bff 0%, #7c6cff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CommuteOutlined sx={{ fontSize: 22, color: '#fff' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, color: '#1a1a2e', fontSize: '1rem' }}>
                Smart Fleets
              </Typography>
              {tenantName && (
                <Typography variant="caption" sx={{ color: '#8792a2', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem' }}>
                  <Business sx={{ fontSize: 13 }} />
                  {tenantName}
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person sx={{ color: '#697386', fontSize: 20 }} />
              <Box>
                <Typography variant="body2" sx={{ color: '#1a1a2e', fontWeight: 600, fontSize: '0.85rem' }}>
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography variant="caption" sx={{ color: '#8792a2' }}>
                  {user.role}
                </Typography>
              </Box>
            </Box>

            <IconButton
              onClick={handleLogout}
              title="Logout"
              sx={{
                color: '#697386',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                '&:hover': { color: '#e74c3c', backgroundColor: 'rgba(231,76,60,0.04)' }
              }}
            >
              <Logout fontSize="small" />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 4,
            background: 'linear-gradient(135deg, #e0f7ec 0%, #c8f0df 25%, #b0ece8 50%, #c5ecf7 75%, #ddf0fc 100%)',
            borderRadius: 3,
            border: '1px solid #b8e8d8',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-50%',
              right: '-10%',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '-40%',
              left: '10%',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(130,230,200,0.25) 0%, transparent 70%)',
            },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.5px', color: '#1a3a2a' }}>
                Welcome back, {user.firstName}!
              </Typography>
              <Typography variant="body1" sx={{ color: '#4a7a6a', fontWeight: 500 }}>
                {user.role} &bull; {user.username}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Chip
                icon={<AutoAwesome sx={{ color: '#2a9d6e !important' }} />}
                label="AI Dashboard"
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.6)',
                  backdropFilter: 'blur(8px)',
                  color: '#1a6b4a',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  px: 2,
                  py: 2.5,
                  border: '1px solid rgba(42,157,110,0.25)',
                }}
              />
            </Box>
          </Box>
        </Paper>

        {/* Breadcrumb Navigation */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            onClick={() => setSelectedCategory(null)}
            sx={{
              color: selectedCategory ? '#667eea' : '#3e5244',
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.95rem',
              p: 0,
              minWidth: 'auto',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            Dashboard
          </Button>
          {selectedCategory && (
            <>
              <Typography sx={{ color: '#999' }}>/</Typography>
              <Typography sx={{ fontWeight: 600, color: '#3e5244', fontSize: '0.95rem' }}>
                {selectedCategory === 'account' && 'Account & Customers'}
                {selectedCategory === 'operations' && 'Fleet Management'}
                {selectedCategory === 'financials' && 'Billings & Charge Management'}
                {selectedCategory === 'reports' && 'Reports'}
                {selectedCategory === 'integrations' && 'Data & Integrations'}
                {selectedCategory === 'profiles' && 'Shift Profiles'}
              </Typography>
            </>
          )}
        </Box>

        {!selectedCategory ? (
          <>

            <Typography variant="h5" sx={{ fontWeight: 700, color: '#3e5244', mb: 4 }}>
              Select a Category
            </Typography>

            <Grid container spacing={3}>
              {/* Account & Customers Management */}
              {['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(user.role) && (
                <Grid item xs={12} sm={6} md={4}>
                  <CategoryCard
                    title="Account & Customers"
                    description="Manage customers and invoicing"
                    icon={AccountBalance}
                    gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    accent="#7c5cfc"
                    onClick={() => setSelectedCategory('account')}
                  />
                </Grid>
              )}

              {/* Operations */}
              {['ADMIN', 'MANAGER', 'DISPATCHER'].includes(user.role) && (
                <Grid item xs={12} sm={6} md={4}>
                  <CategoryCard
                    title="Fleet Management"
                    description="Manage drivers, cabs & shifts"
                    icon={DirectionsCar}
                    gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
                    accent="#22a558"
                    onClick={() => setSelectedCategory('operations')}
                  />
                </Grid>
              )}

              {/* Payments - Direct Link */}
              {['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(user.role) && (
                <Grid item xs={12} sm={6} md={4}>
                  <CategoryCard
                    title="Payments"
                    description="Driver & owner bulk payments"
                    icon={PaymentOutlined}
                    gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                    accent="#10b981"
                    onClick={() => {
                      storeCategoryNav('payments');
                      router.push('/driver-payments');
                    }}
                  />
                </Grid>
              )}

              {/* Scan Receipts */}
              {['ADMIN', 'MANAGER', 'ACCOUNTANT', 'DRIVER'].includes(user.role) && (
                <Grid item xs={12} sm={6} md={4}>
                  <CategoryCard
                    title="Scan Receipts"
                    description="Capture and analyze receipts with AI"
                    icon={ReceiptOutlined}
                    gradient="linear-gradient(135deg, #ec4899 0%, #f97316 100%)"
                    accent="#ec4899"
                    onClick={() => router.push('/receipt-scan')}
                  />
                </Grid>
              )}

              {/* Financials */}
              {['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(user.role) && (
                <Grid item xs={12} sm={6} md={4}>
                  <CategoryCard
                    title="Billings & Charge Management"
                    description="Setup expenses, lease, revenues & other financials for owners & drivers"
                    icon={AttachMoney}
                    gradient="linear-gradient(135deg, #f5576c 0%, #f093fb 100%)"
                    accent="#e5576c"
                    onClick={() => setSelectedCategory('financials')}
                  />
                </Grid>
              )}

              {/* Users Management - SUPER_ADMIN ONLY */}
              {user.role === 'SUPER_ADMIN' && (
                <Grid item xs={12} sm={6} md={4}>
                  <CategoryCard
                    title="Users"
                    description="Manage system users & access control"
                    icon={People}
                    gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    accent="#635bff"
                    onClick={() => router.push('/users')}
                  />
                </Grid>
              )}

              {/* Reports */}
              {user.role !== 'VIEWER' && (
                <Grid item xs={12} sm={6} md={4}>
                  <CategoryCard
                    title="Reports"
                    description="Financial analytics & insights"
                    icon={Assessment}
                    gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                    accent="#3b82f6"
                    onClick={() => setSelectedCategory('reports')}
                  />
                </Grid>
              )}

              {/* Data Imports & Integrations */}
              {user.role === 'ADMIN' && (
                <Grid item xs={12} sm={6} md={4}>
                  <CategoryCard
                    title="Data & Integrations"
                    description="Imports & third-party integrations"
                    icon={CloudUpload}
                    gradient="linear-gradient(135deg, #F9D13E 0%, #E5C02E 100%)"
                    accent="#d97706"
                    onClick={() => setSelectedCategory('integrations')}
                  />
                </Grid>
              )}

              {/* Business Insights (Trip Analytics) */}
              {['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(user.role) && (
                <Grid item xs={12} sm={6} md={4}>
                  <CategoryCard
                    title="Business Insights"
                    description="Analyze trip patterns, heatmaps & peak hours in Vancouver"
                    icon={Insights}
                    gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    accent="#667eea"
                    onClick={() => router.push('/trip-analytics')}
                  />
                </Grid>
              )}

              {/* Do Your Own Taxes */}
              {['ADMIN', 'MANAGER', 'ACCOUNTANT', 'DISPATCHER'].includes(user.role) && (
                <Grid item xs={12} sm={6} md={4}>
                  <CategoryCard
                    title="Do Your Own Taxes"
                    description="Generate CRA T2125 tax worksheets for drivers & owners"
                    icon={Description}
                    gradient="linear-gradient(135deg, #b91c1c 0%, #ef4444 100%)"
                    accent="#b91c1c"
                    onClick={() => {
                      storeCategoryNav('taxes');
                      router.push('/tax-returns');
                    }}
                  />
                </Grid>
              )}

            </Grid>
          </>
        ) : (
          <SubCategoryView
            user={user}
            category={selectedCategory}
            onBack={() => setSelectedCategory(null)}
            onNavigate={(path) => router.push(path)}
            helpDialogOpen={helpDialogOpen}
            setHelpDialogOpen={setHelpDialogOpen}
          />
        )}
      </Container>

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
            Are you sure you want to logout? You'll need to sign in again to access your dashboard and manage your taxi fleet.
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

// Category Card Component
function CategoryCard({ title, description, icon: Icon, accent, gradient, onClick }) {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        background: '#fff',
        borderRadius: 3,
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: `2px solid #e5e7eb`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        position: 'relative',
        overflow: 'hidden',
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: gradient,
          transform: 'scaleX(0)',
          transition: 'transform 0.3s ease',
        },
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: `0 20px 48px ${accent}28`,
          borderColor: `${accent}60`,
          '&::after': {
            transform: 'scaleX(1)',
          },
        }
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 5, textAlign: 'center' }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '16px',
            background: gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2.5,
            boxShadow: `0 8px 20px ${accent}35`,
          }}
        >
          <Icon sx={{ fontSize: 36, color: '#fff' }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.75, color: '#1a1a2e', fontSize: '1.15rem' }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: '#697386', mb: 2.5, fontSize: '0.9rem', lineHeight: 1.5 }}>
          {description}
        </Typography>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            color: accent,
            fontWeight: 600,
            fontSize: '0.88rem',
            transition: 'gap 0.2s ease',
            '.MuiCard-root:hover &': { gap: 1 },
          }}
        >
          <span>Explore</span>
          <ArrowForward sx={{ fontSize: 18 }} />
        </Box>
      </CardContent>
    </Card>
  );
}

// Sub-Category View Component
function SubCategoryView({ user, category, onBack, onNavigate, helpDialogOpen, setHelpDialogOpen }) {
  const getSubCategories = () => {
    switch (category) {
      case 'account':
        return [
          {
            title: 'Customer Management',
            description: 'Client profiles, invoicing & payment tracking',
            icon: StorefrontOutlined,
            path: '/account-management',
            roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
            badge: 'Smart CRM',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            accent: '#667eea'
          },
          {
            title: 'Driver Trips',
            description: 'Browse driver trips & link to account charges',
            icon: StorefrontOutlined,
            path: '/driver-trips',
            roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
            badge: 'Trip Mgmt',
            gradient: 'linear-gradient(135deg, #6a1b9a 0%, #ab47bc 100%)',
            accent: '#6a1b9a'
          },
          {
            title: 'Legacy Customer Management',
            description: 'Manage legacy customer accounts & historical charges',
            icon: MenuBook,
            path: '/legacy-customer-management',
            roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
            badge: 'Migration Tool',
            gradient: 'linear-gradient(135deg, #f57c00 0%, #ff6f00 100%)',
            accent: '#f57c00'
          }
        ];

      case 'operations':
        return [
          {
            title: 'Users',
            description: 'Manage system users, roles & permissions',
            icon: People,
            path: '/users',
            roles: ['ADMIN', 'SUPER_ADMIN'],
            badge: 'Admin Only',
            gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            accent: '#fa709a'
          },
          {
            title: 'Drivers',
            description: 'Intelligent driver management & performance tracking',
            icon: GroupOutlined,
            path: '/drivers',
            roles: ['ADMIN', 'MANAGER', 'DISPATCHER'],
            badge: 'AI Insights',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            accent: '#667eea'
          },
          {
            title: 'Cabs',
            description: 'Real-time vehicle tracking & maintenance scheduling',
            icon: LocalShipping,
            path: '/cabs',
            roles: ['ADMIN', 'MANAGER', 'DISPATCHER'],
            badge: 'Live Tracking',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            accent: '#f5576c'
          },
          {
            title: 'Shift Assignment',
            description: 'Smart shift allocation & ownership management',
            icon: AccessTime,
            path: '/shifts',
            roles: ['ADMIN', 'MANAGER', 'DISPATCHER'],
            badge: 'Optimized',
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            accent: '#00f2fe'
          },
          {
            title: 'Shift Profiles',
            description: 'Manage reusable attribute bundles',
            icon: Category,
            path: '/shift-profiles',
            roles: ['ADMIN', 'MANAGER', 'DISPATCHER', 'ACCOUNTANT'],
            badge: 'Templates',
            gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            accent: '#10b981'
          },
          {
            title: 'Shift Attributes ',
            description: 'Define & manage shift attribute presets',
            icon: Palette,
            path: '/shift-attributes',
            roles: ['ADMIN', 'MANAGER', 'DISPATCHER'],
            badge: 'Templates',
            gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            accent: '#38f9d7'
          },
          {
            title: 'Merchant to Cab Mappings',
            description: 'Map payment processor merchants to cabs & shifts',
            icon: CreditCard,
            path: '/merchant-mappings',
            roles: ['ADMIN', 'MANAGER'],
            badge: 'Routing',
            gradient: 'linear-gradient(135deg, #8e24aa 0%, #ce93d8 100%)',
            accent: '#8e24aa'
          },
          {
            title: 'Spare Machines',
            description: 'Manage backup credit card terminals & cab assignments',
            icon: SmartToy,
            path: '/spare-machines',
            roles: ['ADMIN', 'MANAGER'],
            badge: 'Equipment',
            gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
            accent: '#FF8E53'
          }
        ];

      case 'financials':
        return [
          {
            title: 'Rate Management (Revenues, Expenses & Other Items)',
            description: 'Setup categories, rates & automated calculations',
            icon: SchemaOutlined,
            path: '/financial-setup',
            roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
            badge: 'Setup',
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            accent: '#00f2fe'
          },
          {
            title: 'Revenues & Expense Management',
            description: 'Real-time financial tracking with AI insights',
            icon: MonetizationOn,
            path: '/expenses',
            roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
            badge: 'Smart Analysis',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            accent: '#f5576c'
          },
          {
            title: 'Balance Transfers',
            description: 'Transfer statement balances between drivers and owners',
            icon: SwapHoriz,
            path: '/admin/statement-transfers',
            roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
            badge: 'Transfers',
            gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            accent: '#fa709a'
          },
          {
            title: 'Help & Guide',
            description: 'Learn how to configure expenses, revenues & lease rates',
            icon: HelpOutline,
            path: '/financial-setup?help=true',
            roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
            badge: 'Documentation',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            accent: '#764ba2',
            isHelp: true
          }
        ];

      case 'reports':
        return [
          {
            title: 'Driver Reports',
            description: 'Generate and manage financial statements for drivers and owners',
            icon: BarChart,
            path: '/reports',
            roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'DRIVER'],
            badge: 'Financial',
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            accent: '#00f2fe'
          },
          {
            title: 'All Driver Summary',
            description: 'Individual earnings, efficiency & metrics',
            icon: TrendingUpOutlined,
            path: '/driver-summary',
            roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
            badge: 'ML Powered',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            accent: '#f5576c'
          },
          {
            title: 'Lease Reconciliation',
            description: 'Shift-by-shift lease expense vs. revenue reconciliation',
            icon: Assessment,
            path: '/lease-report',
            roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
            badge: 'Reconciliation',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            accent: '#764ba2'
          },
          {
            title: 'Driver Shift Data',
            description: 'View and audit driver shift sessions, logon/logoff times & consolidation details',
            icon: AccessTime,
            path: '/shift-data',
            roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
            badge: 'Audit',
            gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            accent: '#38f9d7'
          },
          {
            title: 'Year-End Report',
            description: 'Annual financial summary for drivers & owners with configurable line items',
            icon: Assessment,
            path: '/year-end-report',
            roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'DISPATCHER'],
            badge: 'Annual',
            gradient: 'linear-gradient(135deg, #6a1b9a 0%, #ce93d8 100%)',
            accent: '#ce93d8'
          }
        ];

      case 'integrations':
        return [
          {
            title: 'Taxi Caller Sync',
            description: 'Real-time integration with dispatch system',
            icon: ApiOutlined,
            path: '/taxicaller-integration',
            roles: ['ADMIN'],
            badge: 'Connected',
            gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            accent: '#38f9d7'
          },
          {
            title: 'Moneris Transactions',
            description: 'Browse & filter credit card transactions from Moneris',
            icon: CreditCard,
            path: '/moneris-integration',
            roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
            badge: 'Payments',
            gradient: 'linear-gradient(135deg, #7B1FA2 0%, #CE93D8 100%)',
            accent: '#CE93D8'
          },
          {
            title: 'Data Import/Export',
            description: 'Import & export data: CSV, Excel, external databases',
            icon: UploadFile,
            path: '/data-uploads',
            roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
            badge: 'Bulk',
            gradient: 'linear-gradient(135deg, #F9D13E 0%, #E5C02E 100%)',
            accent: '#E5C02E'
          }
        ];

      case 'profiles':
        return [
          {
            title: 'Shift Profile Templates',
            description: 'Create & manage reusable shift configurations',
            icon: Palette,
            path: '/shift-profiles',
            roles: ['ADMIN', 'MANAGER', 'DISPATCHER', 'ACCOUNTANT'],
            badge: 'Templates',
            gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            accent: '#38f9d7'
          }
        ];

      default:
        return [];
    }
  };

  const getCategoryTitle = () => {
    const titles = {
      account: 'Account & Customers',
      operations: 'Fleet Management',
      financials: 'Billings & Charge Management',
      reports: 'Reports',
      integrations: 'Data & Integrations',
      profiles: 'Shift Profiles'
    };
    return titles[category] || 'Category';
  };

  const subCategories = getSubCategories().filter(item =>
    item.roles.includes(user.role)
  );

  return (
    <>
      {/* Header with Back Button and Category Info */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={onBack}
            sx={{
              color: '#667eea',
              borderColor: '#667eea',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: alpha('#667eea', 0.1),
                borderColor: '#667eea'
              }
            }}
          >
            Back to Dashboard
          </Button>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#3e5244' }}>
              {getCategoryTitle()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 0.5 }}>
              {getSubCategories().filter(item => item.roles.includes(user.role)).length} item{getSubCategories().filter(item => item.roles.includes(user.role)).length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Account & Customer Help Card */}
      {category === 'account' && (
        <Box sx={{ mb: 4 }}>
          <AccountCustomerHelpCard />
        </Box>
      )}

      {/* Operations Help Card */}
      {category === 'operations' && (
        <Box sx={{ mb: 4 }}>
          <OperationsHelpCard />
        </Box>
      )}

      {/* Reports Help Card */}
      {category === 'reports' && (
        <Box sx={{ mb: 4 }}>
          <ReportsHelpCard />
        </Box>
      )}

      {/* Data & Integrations Help Card */}
      {category === 'integrations' && (
        <Box sx={{ mb: 4 }}>
          <DataIntegrationHelpCard />
        </Box>
      )}

      <Grid container spacing={3}>
        {subCategories.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                background: '#fff',
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 16px 40px ${(item.accent || '#667eea')}22`,
                  borderColor: `${item.accent || '#667eea'}50`,
                }
              }}
              onClick={() => {
                if (item.isHelp) {
                  setHelpDialogOpen(true);
                } else {
                  storeCategoryNav(category);
                  onNavigate(item.path);
                }
              }}
            >
              <CardContent sx={{ p: 4 }}>
                {/* Badge */}
                {item.badge && (
                  <Box sx={{ mb: 1.5, display: 'flex', gap: 1 }}>
                    <Chip
                      label={item.badge}
                      size="small"
                      sx={{
                        backgroundColor: `${item.accent || '#667eea'}14`,
                        color: item.accent || '#667eea',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: 22,
                      }}
                    />
                  </Box>
                )}

                {/* Icon Box */}
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '14px',
                    background: item.gradient || `linear-gradient(135deg, ${item.accent || '#667eea'}, ${item.accent || '#667eea'}cc)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    boxShadow: `0 6px 16px ${(item.accent || '#667eea')}30`,
                  }}
                >
                  <item.icon sx={{ fontSize: 32, color: '#fff' }} />
                </Box>

                {/* Title and Description */}
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: '#1a1a2e', fontSize: '1rem' }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" sx={{ color: '#697386', lineHeight: 1.5, mb: 2, fontSize: '0.83rem' }}>
                  {item.description}
                </Typography>

                {/* Action indicator */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: item.accent || '#667eea', fontWeight: 600, fontSize: '0.85rem' }}>
                  <ArrowForward sx={{ fontSize: 16 }} />
                  <span>Open</span>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Financial Help Dialog */}
      <FinancialHelpDialog open={helpDialogOpen} onClose={() => setHelpDialogOpen(false)} />
    </>
  );
}

// Marketing Landing Page Component — Stripe-inspired clean white design
function MarketingLandingPage({ router }) {
  const accent = '#635bff';
  const accentLight = '#7a73ff';
  const textPrimary = '#0a2540';
  const textSecondary = '#425466';
  const bgLight = '#f6f9fc';
  const green = '#0a9e6f';
  const cyan = '#00d4ff';

  // Scroll to section handler for navigation links
  const scrollToSection = useCallback((sectionId) => {
    const element = document.getElementById(sectionId.toLowerCase());
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Info dialog state
  const [infoDialog, setInfoDialog] = useState({ open: false, title: '', content: '' });

  const showInfoDialog = useCallback((title, content) => {
    setInfoDialog({ open: true, title, content });
  }, []);

  const closeInfoDialog = useCallback(() => {
    setInfoDialog({ open: false, title: '', content: '' });
  }, []);

  // Footer link handler with creative actions
  const handleFooterLink = useCallback((category, item) => {
    // Map footer links to actions
    const linkMap = {
      'Products': {
        'AI Reconciliation': () => scrollToSection('products'),
        'Analytics': () => scrollToSection('products'),
        'Settlements': () => scrollToSection('products'),
        'Fleet Intelligence': () => scrollToSection('products'),
        'Integrations': () => scrollToSection('products'),
      },
      'Solutions': {
        'Fleet Owners': () => scrollToSection('solutions'),
        'Accountants': () => scrollToSection('solutions'),
        'Dispatchers': () => scrollToSection('solutions'),
        'Multi-fleet': () => scrollToSection('solutions'),
        'Enterprise': () => scrollToSection('solutions'),
      },
      'Resources': {
        'Documentation': () => showInfoDialog(
          'Developer Documentation',
          'Our comprehensive developer docs are launching soon! Get step-by-step guides on integrations, API usage, and best practices.\n\nSign up at info@smartfleets.ai for early access.'
        ),
        'Blog': () => showInfoDialog(
          'Smart Fleets Blog',
          'Our blog launches Q3 2026 with insights on fleet management, financial automation, and industry trends.\n\nSubscribe at info@smartfleets.ai for launch notifications.'
        ),
        'Customer Stories': () => scrollToSection('resources'),
        'Support': () => scrollToSection('contact'),
        'Status': () => showInfoDialog(
          'System Status',
          'All systems operational\n\n• API: 99.98% uptime\n• Database: Healthy\n• Processing: Normal\n• Response time: <100ms\n\nLast updated: Just now'
        ),
      },
      'Company': {
        'About': () => showInfoDialog(
          'About Smart Fleets',
          'Smart Fleets is revolutionizing fleet financial management with AI-powered automation.\n\nFounded in 2025, we help taxi and fleet operators eliminate manual reconciliation, reduce errors, and gain real-time financial intelligence.\n\nOur mission: Make fleet finance effortless.'
        ),
        'Careers': () => showInfoDialog(
          'Join Our Team',
          'We\'re hiring!\n\nOpen positions:\n• Senior Backend Engineer (Java/Spring)\n• Frontend Engineer (React/Next.js)\n• ML Engineer (Predictive Analytics)\n• Customer Success Lead\n\nInterested? Email your resume to careers@smartfleets.ai'
        ),
        'Contact': () => scrollToSection('contact'),
        'Privacy Policy': () => showInfoDialog(
          'Privacy Policy',
          'We protect your data with industry-leading security:\n\n✓ Bank-grade encryption\n✓ SOC 2 Type II certified\n✓ GDPR & CCPA compliant\n✓ Zero data sharing with third parties\n✓ Annual security audits\n\nFull policy available at privacy@smartfleets.ai'
        ),
        'Terms of Service': () => showInfoDialog(
          'Terms of Service',
          'Flexible, transparent terms:\n\n✓ Month-to-month contracts\n✓ Cancel anytime, no penalties\n✓ 99.9% uptime SLA\n✓ Your data is YOUR data\n✓ 30-day money-back guarantee\n\nFull terms available at legal@smartfleets.ai'
        ),
      }
    };

    const action = linkMap[category]?.[item];
    if (action) action();
  }, [scrollToSection, showInfoDialog]);

  // Contact form state
  const [contactForm, setContactForm] = useState({ firstName: '', lastName: '', email: '', company: '', fleetSize: '', message: '' });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState('');
  const [contactError, setContactError] = useState('');

  const handleContactField = (field) => (e) => {
    setContactForm(prev => ({ ...prev, [field]: e.target.value }));
    setContactError('');
  };

  const handleContactSubmit = async () => {
    if (!contactForm.firstName.trim() || !contactForm.email.trim()) {
      setContactError('First name and email are required');
      return;
    }
    setContactSubmitting(true);
    setContactError('');
    setContactSuccess('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setContactSuccess(data.message);
      setContactForm({ firstName: '', lastName: '', email: '', company: '', fleetSize: '', message: '' });
    } catch (e) {
      setContactError(e.message);
    } finally {
      setContactSubmitting(false);
    }
  };

  // Reusable section header
  const SectionHeader = ({ overline, title, subtitle, light = false }) => (
    <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 8 } }}>
      {overline && (
        <Typography
          variant="overline"
          sx={{ color: light ? alpha('#fff', 0.6) : accent, fontWeight: 700, letterSpacing: 2, mb: 1, display: 'block' }}
        >
          {overline}
        </Typography>
      )}
      <Typography
        variant="h3"
        sx={{
          fontWeight: 700,
          color: light ? '#fff' : textPrimary,
          letterSpacing: '-0.5px',
          mb: 2,
          fontSize: { xs: '1.8rem', md: '2.4rem' }
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography sx={{ color: light ? alpha('#fff', 0.7) : textSecondary, maxWidth: 600, mx: 'auto', fontSize: '1.05rem', lineHeight: 1.6 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      {/* ─── Info Dialog ─── */}
      <Dialog
        open={infoDialog.open}
        onClose={closeInfoDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 2,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.4rem', color: textPrimary }}>
            {infoDialog.title}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Typography sx={{ color: textSecondary, fontSize: '1rem', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
            {infoDialog.content}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={closeInfoDialog}
            variant="contained"
            sx={{
              backgroundColor: accent,
              color: '#fff',
              fontWeight: 600,
              px: 4,
              py: 1,
              borderRadius: '8px',
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: accentLight,
                boxShadow: `0 4px 12px ${alpha(accent, 0.3)}`,
              }
            }}
          >
            Got it
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── SEO Structured Data ─── */}
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": "https://smartfleets.ai/#organization",
                "name": "Smart Fleets",
                "url": "https://smartfleets.ai",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://smartfleets.ai/logo.png"
                },
                "description": "AI-powered fleet management platform for taxi and ride-hailing operators",
                "address": {
                  "@type": "PostalAddress",
                  "addressCountry": "CA"
                },
                "contactPoint": {
                  "@type": "ContactPoint",
                  "email": "info@smartfleets.ai",
                  "contactType": "Customer Service"
                },
                "sameAs": [
                  "https://twitter.com/smartfleets",
                  "https://linkedin.com/company/smartfleets"
                ]
              },
              {
                "@type": "SoftwareApplication",
                "@id": "https://smartfleets.ai/#software",
                "name": "Smart Fleets",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web Browser",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD",
                  "priceSpecification": {
                    "@type": "UnitPriceSpecification",
                    "price": "0",
                    "priceCurrency": "USD"
                  }
                },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": "4.8",
                  "ratingCount": "127",
                  "bestRating": "5",
                  "worstRating": "1"
                },
                "description": "AI-driven taxi fleet management software for automated financial reconciliation, driver settlements, real-time analytics, and intelligent fleet operations. Eliminate manual work and scale your taxi or ride-hailing business.",
                "featureList": [
                  "AI-powered reconciliation",
                  "Automated driver settlements",
                  "Real-time financial analytics",
                  "Predictive fleet intelligence",
                  "Multi-fleet management",
                  "API integrations",
                  "Automated invoicing",
                  "Compliance reporting"
                ],
                "screenshot": "https://smartfleets.ai/screenshot.png",
                "softwareVersion": "2.0",
                "provider": {
                  "@id": "https://smartfleets.ai/#organization"
                }
              },
              {
                "@type": "WebSite",
                "@id": "https://smartfleets.ai/#website",
                "url": "https://smartfleets.ai",
                "name": "Smart Fleets - AI Fleet Management",
                "publisher": {
                  "@id": "https://smartfleets.ai/#organization"
                },
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://smartfleets.ai/search?q={search_term_string}",
                  "query-input": "required name=search_term_string"
                }
              }
            ]
          })
        }}
      />

      {/* ─── Nav ─── */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #e3e8ee',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ py: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
              <LocalTaxi sx={{ fontSize: 28, color: accent }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: textPrimary, letterSpacing: '-0.3px' }}>
                Smart Fleets
              </Typography>
            </Box>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 3, mr: 3 }}>
              {['Products', 'Solutions', 'Pricing', 'Resources'].map(item => (
                <Typography
                  key={item}
                  onClick={() => scrollToSection(item)}
                  sx={{ color: textSecondary, fontWeight: 500, fontSize: '0.95rem', cursor: 'pointer', '&:hover': { color: textPrimary }, transition: 'color 0.2s' }}
                >
                  {item}
                </Typography>
              ))}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Button
                onClick={() => router.push('/signin')}
                sx={{ color: textSecondary, fontWeight: 600, textTransform: 'none', fontSize: '0.95rem', '&:hover': { color: textPrimary, backgroundColor: 'transparent' } }}
              >
                Sign in
              </Button>
              <Button
                variant="contained"
                onClick={() => router.push('/signin')}
                sx={{
                  backgroundColor: accent, color: '#fff', fontWeight: 600, px: 3, py: 1, borderRadius: '8px', textTransform: 'none', fontSize: '0.95rem', boxShadow: 'none',
                  '&:hover': { backgroundColor: accentLight, boxShadow: '0 4px 12px rgba(99,91,255,0.3)' }
                }}
              >
                Get started
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* ─── Hero ─── */}
      <Box sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 14 }, backgroundColor: '#fff' }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Chip
            label="AI-powered fleet intelligence"
            size="small"
            sx={{ mb: 3, backgroundColor: alpha(accent, 0.08), color: accent, fontWeight: 600, fontSize: '0.8rem', border: `1px solid ${alpha(accent, 0.15)}` }}
          />
          <Typography
            variant="h1"
            sx={{ fontWeight: 700, color: textPrimary, mb: 3, letterSpacing: '-1.5px', lineHeight: 1.08, fontSize: { xs: '2.8rem', sm: '3.5rem', md: '4.2rem' } }}
          >
            Your fleet runs itself
          </Typography>
          <Typography
            sx={{ color: textSecondary, maxWidth: 620, mx: 'auto', fontWeight: 400, lineHeight: 1.7, mb: 5, fontSize: { xs: '1.05rem', md: '1.2rem' } }}
          >
            AI-driven reconciliation, predictive analytics, and autonomous financial workflows — from your first driver to your thousandth. Zero manual intervention. The system learns, adapts, and acts.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained" size="large" onClick={() => router.push('/signin')} endIcon={<ArrowForward />}
              sx={{
                backgroundColor: accent, color: '#fff', fontWeight: 600, px: 4, py: 1.5, borderRadius: '8px', fontSize: '1rem', textTransform: 'none', boxShadow: 'none',
                '&:hover': { backgroundColor: accentLight, boxShadow: '0 6px 20px rgba(99,91,255,0.25)', transform: 'translateY(-1px)' }, transition: 'all 0.2s ease'
              }}
            >
              Start now
            </Button>
            <Button
              size="large" endIcon={<ArrowForward />}
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              sx={{ color: accent, fontWeight: 600, px: 4, py: 1.5, borderRadius: '8px', fontSize: '1rem', textTransform: 'none', '&:hover': { backgroundColor: alpha(accent, 0.06) } }}
            >
              Contact sales
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ─── Gradient divider ─── */}
      <Box sx={{ height: 4, background: `linear-gradient(90deg, ${accent}, ${cyan}, #7dd3fc, ${accent})`, backgroundSize: '200% 100%' }} />

      {/* ─── Trusted By / Social Proof ─── */}
      <Box sx={{ py: { xs: 5, md: 6 }, backgroundColor: bgLight }}>
        <Container maxWidth="lg">
          <Typography sx={{ textAlign: 'center', color: alpha(textSecondary, 0.6), fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 2, mb: 4 }}>
            Powering the smartest fleets in the industry
          </Typography>
          <Grid container spacing={4} justifyContent="center" alignItems="center">
            {['Pacific Fleet Co', 'City Taxi Co', 'Metro Fleet Services', 'Express Dispatch', 'Premier Cars'].map((name, idx) => (
              <Grid item key={idx}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2 }}>
                  <LocalTaxi sx={{ fontSize: 18, color: alpha(textSecondary, 0.3) }} />
                  <Typography sx={{ color: alpha(textSecondary, 0.5), fontWeight: 600, fontSize: '0.95rem', letterSpacing: '-0.3px' }}>
                    {name}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── Solutions Section (Stripe-style bento grid) ─── */}
      <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: '#fff' }}>
        <Container maxWidth="lg">
          <SectionHeader
            overline="AI-Powered"
            title="Intelligence that compounds over time"
            subtitle="Smart Fleets doesn't just automate — it learns. The more your fleet operates, the smarter the system becomes. Patterns emerge. Anomalies surface. Decisions get easier."
          />

          <Grid container spacing={3}>
            {/* Large left card */}
            <Grid item xs={12} md={7}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 4, md: 5 }, height: '100%', borderRadius: '16px', border: '1px solid #e3e8ee',
                  background: `linear-gradient(135deg, ${alpha(accent, 0.03)} 0%, ${alpha(cyan, 0.04)} 100%)`,
                  transition: 'all 0.2s ease', '&:hover': { borderColor: alpha(accent, 0.2), boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }
                }}
              >
                <Chip label="Core Engine" size="small" sx={{ mb: 2, backgroundColor: alpha(accent, 0.1), color: accent, fontWeight: 600, fontSize: '0.75rem' }} />
                <Typography sx={{ fontWeight: 700, color: textPrimary, fontSize: '1.5rem', mb: 2, letterSpacing: '-0.3px' }}>
                  Autonomous reconciliation
                </Typography>
                <Typography sx={{ color: textSecondary, lineHeight: 1.7, mb: 3, fontSize: '1rem' }}>
                  Every data point — shifts, mileage, charges, payments — is ingested, cross-referenced, and reconciled without human input.
                  The system detects anomalies in real time and resolves discrepancies before anyone notices.
                </Typography>
                <Grid container spacing={2}>
                  {['Intelligent pattern matching', 'Anomaly detection', 'Self-healing data pipelines', 'Continuous learning engine'].map((item, i) => (
                    <Grid item xs={12} sm={6} key={i}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle sx={{ fontSize: 18, color: green }} />
                        <Typography sx={{ color: textPrimary, fontWeight: 500, fontSize: '0.9rem' }}>{item}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>

            {/* Right stacked cards */}
            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4, flex: 1, borderRadius: '16px', border: '1px solid #e3e8ee',
                    transition: 'all 0.2s ease', '&:hover': { borderColor: alpha(accent, 0.2), boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }
                  }}
                >
                  <Box sx={{ width: 44, height: 44, borderRadius: '10px', backgroundColor: alpha(green, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    <SmartToy sx={{ fontSize: 24, color: green }} />
                  </Box>
                  <Typography sx={{ fontWeight: 600, color: textPrimary, mb: 1, fontSize: '1.05rem' }}>
                    Predictive insights
                  </Typography>
                  <Typography sx={{ color: textSecondary, lineHeight: 1.6, fontSize: '0.9rem' }}>
                    Forecast revenue trends, flag underperforming assets, and surface opportunities you didn't know existed — all before you ask.
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 4, flex: 1, borderRadius: '16px', border: '1px solid #e3e8ee',
                    transition: 'all 0.2s ease', '&:hover': { borderColor: alpha(accent, 0.2), boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }
                  }}
                >
                  <Box sx={{ width: 44, height: 44, borderRadius: '10px', backgroundColor: alpha('#f59e0b', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    <AutoAwesome sx={{ fontSize: 24, color: '#f59e0b' }} />
                  </Box>
                  <Typography sx={{ fontWeight: 600, color: textPrimary, mb: 1, fontSize: '1.05rem' }}>
                    Zero-touch settlements
                  </Typography>
                  <Typography sx={{ color: textSecondary, lineHeight: 1.6, fontSize: '0.9rem' }}>
                    The system generates, validates, and queues every payment automatically. You review when you want — not because you have to.
                  </Typography>
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ─── The backbone of fleet operations (Stats) ─── */}
      <Box sx={{ py: { xs: 8, md: 10 }, backgroundColor: bgLight }}>
        <Container maxWidth="lg">
          <SectionHeader
            overline="Scale"
            title="Built for fleets that never stop"
          />
          <Grid container spacing={4}>
            {[
              { number: '10M+', label: 'Data points processed', sublabel: 'and growing every second' },
              { number: '< 1s', label: 'Reconciliation speed', sublabel: 'per driver, per period' },
              { number: '99.97%', label: 'Autonomous accuracy', sublabel: 'without human correction' },
              { number: '0', label: 'Spreadsheets needed', sublabel: 'ever again' }
            ].map((stat, idx) => (
              <Grid item xs={6} md={3} key={idx}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontWeight: 700, color: textPrimary, fontSize: { xs: '2rem', md: '2.8rem' }, letterSpacing: '-1px', mb: 0.5 }}>
                    {stat.number}
                  </Typography>
                  <Typography sx={{ color: textPrimary, fontWeight: 600, fontSize: '0.95rem', mb: 0.5 }}>
                    {stat.label}
                  </Typography>
                  <Typography sx={{ color: textSecondary, fontSize: '0.8rem' }}>
                    {stat.sublabel}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── How it works ─── */}
      <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: '#fff' }}>
        <Container maxWidth="lg">
          <SectionHeader
            overline="How it works"
            title="Plug in. Step back. Watch it run."
            subtitle="Smart Fleets takes over the moment your data flows in. No setup wizards. No training. It just works."
          />

          <Grid container spacing={4}>
            {[
              {
                step: '01',
                icon: <SchemaOutlined sx={{ fontSize: 28 }} />,
                title: 'Connect any source',
                description: 'Dispatch systems, payment processors, operational tools — Smart Fleets ingests data from wherever it lives. One integration, every signal captured.',
                color: accent
              },
              {
                step: '02',
                icon: <SmartToy sx={{ fontSize: 28 }} />,
                title: 'AI takes over',
                description: 'The engine cross-references every transaction, detects patterns across your fleet, and reconciles everything autonomously. Anomalies are flagged before they escalate.',
                color: green
              },
              {
                step: '03',
                icon: <AutoAwesome sx={{ fontSize: 28 }} />,
                title: 'Insights & actions',
                description: 'Settlements are queued. Reports are generated. Forecasts are surfaced. Your only job is to review — if you even want to.',
                color: '#f59e0b'
              }
            ].map((item, idx) => (
              <Grid item xs={12} md={4} key={idx}>
                <Box sx={{ position: 'relative' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '4rem', color: alpha(item.color, 0.08), position: 'absolute', top: -20, left: -5, lineHeight: 1 }}>
                    {item.step}
                  </Typography>
                  <Box sx={{ pt: 4 }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: '12px', backgroundColor: alpha(item.color, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5, color: item.color }}>
                      {item.icon}
                    </Box>
                    <Typography sx={{ fontWeight: 600, color: textPrimary, mb: 1.5, fontSize: '1.15rem' }}>
                      {item.title}
                    </Typography>
                    <Typography sx={{ color: textSecondary, lineHeight: 1.7, fontSize: '0.95rem' }}>
                      {item.description}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── Use Cases (Stripe-style split sections) ─── */}
      <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: bgLight }}>
        <Container maxWidth="lg">
          <SectionHeader
            overline="Who it's for"
            title="One platform. Every stakeholder. Total clarity."
          />

          {[
            {
              title: 'Fleet owners & investors',
              description: 'Real-time financial intelligence across your entire portfolio. AI surfaces the insights that matter — underperforming assets, revenue trends, optimization opportunities — so you act on signal, not noise.',
              features: ['AI-powered fleet analytics', 'Predictive revenue modeling', 'Automated performance scoring', 'Portfolio-wide visibility'],
              icon: <Insights sx={{ fontSize: 32 }} />,
              color: accent,
              reverse: false
            },
            {
              title: 'Finance & compliance teams',
              description: 'Continuous, autonomous reconciliation means your books are never out of date. Every number is traceable. Every anomaly is flagged. Audit-ready by default.',
              features: ['Autonomous reconciliation', 'Real-time anomaly detection', 'Intelligent categorization', 'Complete audit trail'],
              icon: <VerifiedUser sx={{ fontSize: 32 }} />,
              color: green,
              reverse: true
            },
            {
              title: 'Operations & dispatch',
              description: 'Smart assignment, intelligent scheduling, and automated tracking. The system understands your fleet dynamics and adapts in real time as conditions change.',
              features: ['Adaptive shift intelligence', 'Automated resource allocation', 'Live operational dashboards', 'Seamless integrations'],
              icon: <SmartToy sx={{ fontSize: 32 }} />,
              color: '#f59e0b',
              reverse: false
            }
          ].map((useCase, idx) => (
            <Grid
              container
              spacing={6}
              key={idx}
              sx={{ mb: idx < 2 ? 8 : 0, alignItems: 'center' }}
              direction={useCase.reverse ? 'row-reverse' : 'row'}
            >
              <Grid item xs={12} md={6}>
                <Chip label={useCase.title} size="small" sx={{ mb: 2, backgroundColor: alpha(useCase.color, 0.08), color: useCase.color, fontWeight: 600, fontSize: '0.75rem' }} />
                <Typography sx={{ fontWeight: 700, color: textPrimary, fontSize: { xs: '1.5rem', md: '1.8rem' }, mb: 2, letterSpacing: '-0.3px', lineHeight: 1.3 }}>
                  {useCase.title}
                </Typography>
                <Typography sx={{ color: textSecondary, lineHeight: 1.7, mb: 3, fontSize: '1rem' }}>
                  {useCase.description}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {useCase.features.map((f, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <CheckCircle sx={{ fontSize: 18, color: useCase.color }} />
                      <Typography sx={{ color: textPrimary, fontWeight: 500, fontSize: '0.95rem' }}>{f}</Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 5, borderRadius: '20px', border: '1px solid #e3e8ee',
                    background: `linear-gradient(135deg, ${alpha(useCase.color, 0.04)} 0%, ${alpha(useCase.color, 0.01)} 100%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220,
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ width: 72, height: 72, borderRadius: '16px', backgroundColor: alpha(useCase.color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, color: useCase.color }}>
                      {useCase.icon}
                    </Box>
                    <Typography sx={{ color: textSecondary, fontWeight: 500, fontSize: '0.9rem' }}>
                      Smart Fleets for {useCase.title.toLowerCase()}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          ))}
        </Container>
      </Box>

      {/* ─── Testimonials ─── */}
      <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: '#fff' }}>
        <Container maxWidth="lg">
          <SectionHeader
            overline="Results"
            title="What happens when AI runs your back office"
          />

          <Grid container spacing={3}>
            {[
              {
                quote: "We eliminated our entire month-end reconciliation process. It just happens now — continuously, in the background. We didn't even notice the transition.",
                name: 'VP of Operations',
                company: '200+ vehicle fleet',
              },
              {
                quote: "The AI caught discrepancies we'd been missing for months. It paid for itself in the first week. Now I wonder what else we've been missing.",
                name: 'Finance Director',
                company: 'Multi-city fleet operator',
              },
              {
                quote: "I used to spend my weekends on driver settlements. Now the system does it while I sleep. I just review and approve — if I even need to.",
                name: 'Fleet Owner',
                company: '85-vehicle operation',
              }
            ].map((testimonial, idx) => (
              <Grid item xs={12} md={4} key={idx}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4, height: '100%', borderRadius: '16px', border: '1px solid #e3e8ee', display: 'flex', flexDirection: 'column',
                    transition: 'all 0.2s ease', '&:hover': { borderColor: alpha(accent, 0.2), boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }
                  }}
                >
                  <Typography sx={{ color: textPrimary, lineHeight: 1.7, fontSize: '0.95rem', fontStyle: 'italic', flex: 1, mb: 3 }}>
                    "{testimonial.quote}"
                  </Typography>
                  <Box>
                    <Typography sx={{ color: textPrimary, fontWeight: 600, fontSize: '0.9rem' }}>
                      {testimonial.name}
                    </Typography>
                    <Typography sx={{ color: textSecondary, fontSize: '0.85rem' }}>
                      {testimonial.company}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── Integration / Technical ─── */}
      <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: textPrimary }}>
        <Container maxWidth="lg">
          <SectionHeader
            overline="Architecture"
            title="Designed to absorb complexity"
            subtitle="Smart Fleets connects to every system in your stack. Data flows in, intelligence flows out. No middleware. No glue code. No friction."
            light
          />

          <Grid container spacing={3}>
            {[
              { title: 'Universal data ingestion', description: 'Any dispatch system, any payment processor, any format. Smart Fleets normalizes and structures everything automatically.', icon: <SchemaOutlined sx={{ fontSize: 24 }} /> },
              { title: 'Real-time sync engine', description: 'Bi-directional data flow keeps every system in lockstep. Changes propagate instantly across your entire operation.', icon: <ApiOutlined sx={{ fontSize: 24 }} /> },
              { title: 'Intelligent outputs', description: 'Reports, forecasts, and settlement data delivered wherever you need them — in the format your downstream systems expect.', icon: <AutoAwesome sx={{ fontSize: 24 }} /> },
            ].map((item, idx) => (
              <Grid item xs={12} md={4} key={idx}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4, borderRadius: '16px', backgroundColor: alpha('#fff', 0.06), border: `1px solid ${alpha('#fff', 0.1)}`, height: '100%',
                    transition: 'all 0.2s ease', '&:hover': { backgroundColor: alpha('#fff', 0.09), border: `1px solid ${alpha('#fff', 0.2)}` }
                  }}
                >
                  <Box sx={{ width: 44, height: 44, borderRadius: '10px', backgroundColor: alpha(accent, 0.2), display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, color: '#fff' }}>
                    {item.icon}
                  </Box>
                  <Typography sx={{ fontWeight: 600, color: '#fff', mb: 1, fontSize: '1.05rem' }}>
                    {item.title}
                  </Typography>
                  <Typography sx={{ color: alpha('#fff', 0.65), lineHeight: 1.6, fontSize: '0.9rem' }}>
                    {item.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── Features Grid ─── */}
      <Box id="products" sx={{ py: { xs: 8, md: 12 }, backgroundColor: '#fff' }}>
        <Container maxWidth="lg">
          <SectionHeader
            overline="Capabilities"
            title="The full operating system for fleet finance"
            subtitle="Every capability works together. Every insight feeds the next. This isn't a collection of tools — it's a system that thinks."
          />

          <Grid container spacing={3}>
            {[
              { icon: <SmartToy sx={{ fontSize: 26 }} />, title: 'AI reconciliation', description: 'Autonomous cross-referencing across every data source. Discrepancies resolved before you see them.', color: accent },
              { icon: <Insights sx={{ fontSize: 26 }} />, title: 'Predictive analytics', description: 'Revenue forecasting, trend detection, and early warning systems powered by your fleet data.', color: green },
              { icon: <Speed sx={{ fontSize: 26 }} />, title: 'Instant settlements', description: 'Payment batches generated, validated, and queued — autonomously and in real time.', color: '#f59e0b' },
              { icon: <TrendingUpOutlined sx={{ fontSize: 26 }} />, title: 'Live intelligence', description: 'Dynamic dashboards that surface what matters. No configuration. No setup. Just signal.', color: accent },
              { icon: <AutoAwesome sx={{ fontSize: 26 }} />, title: 'Anomaly detection', description: 'Machine learning models that learn your fleet patterns and alert you when something deviates.', color: green },
              { icon: <CheckCircle sx={{ fontSize: 26 }} />, title: 'Multi-fleet architecture', description: 'Run unlimited fleet entities from one platform. Isolated data, unified intelligence.', color: '#f59e0b' },
              { icon: <SchemaOutlined sx={{ fontSize: 26 }} />, title: 'Adaptive integrations', description: 'Connects to any system. Learns data schemas automatically. Evolves as your stack changes.', color: accent },
              { icon: <VerifiedUser sx={{ fontSize: 26 }} />, title: 'Compliance by design', description: 'Every calculation auditable. Every decision traceable. Built for regulated environments.', color: green },
              { icon: <Timeline sx={{ fontSize: 26 }} />, title: 'Continuous learning', description: 'The system improves with every transaction. Your fleet gets smarter every day it operates.', color: '#f59e0b' },
            ].map((feature, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <Box sx={{ p: 3 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: '10px', backgroundColor: alpha(feature.color, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, color: feature.color }}>
                    {feature.icon}
                  </Box>
                  <Typography sx={{ fontWeight: 600, color: textPrimary, mb: 1, fontSize: '1rem' }}>
                    {feature.title}
                  </Typography>
                  <Typography sx={{ color: textSecondary, lineHeight: 1.6, fontSize: '0.9rem' }}>
                    {feature.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── Solutions Section ─── */}
      <Box id="solutions" sx={{ py: { xs: 8, md: 12 }, backgroundColor: bgLight }}>
        <Container maxWidth="lg">
          <SectionHeader
            overline="Solutions"
            title="Purpose-built for every role in your fleet"
            subtitle="Whether you manage one fleet or dozens, Smart Fleets adapts to your workflow and scales with your operation."
          />

          <Grid container spacing={4}>
            {[
              {
                title: 'Fleet Owners',
                description: 'End-to-end financial visibility across all operations. Automated settlements, real-time P&L, and predictive analytics for smarter decisions.',
                icon: <Business sx={{ fontSize: 28 }} />,
                color: accent
              },
              {
                title: 'Accountants',
                description: 'Automated reconciliation that eliminates manual data entry. Audit trails on every transaction. Close books in hours, not days.',
                icon: <Assessment sx={{ fontSize: 28 }} />,
                color: green
              },
              {
                title: 'Dispatchers',
                description: 'Live driver performance tracking and shift intelligence. Identify top performers and optimize scheduling with data-driven insights.',
                icon: <LocalTaxi sx={{ fontSize: 28 }} />,
                color: '#f59e0b'
              },
              {
                title: 'Multi-Fleet Operations',
                description: 'Manage unlimited fleet entities from one platform. Isolated data security with unified reporting and consolidated intelligence.',
                icon: <Apartment sx={{ fontSize: 28 }} />,
                color: accent
              },
              {
                title: 'Enterprise',
                description: 'White-glove onboarding, dedicated support, and custom integrations. Built for complex operations that demand reliability at scale.',
                icon: <VerifiedUser sx={{ fontSize: 28 }} />,
                color: green
              },
            ].map((solution, idx) => (
              <Grid item xs={12} md={6} key={idx}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    height: '100%',
                    borderRadius: '16px',
                    border: '1px solid #e3e8ee',
                    backgroundColor: '#fff',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: solution.color,
                      boxShadow: `0 8px 24px ${alpha(solution.color, 0.12)}`,
                    }
                  }}
                >
                  <Box sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '12px',
                    backgroundColor: alpha(solution.color, 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2.5,
                    color: solution.color
                  }}>
                    {solution.icon}
                  </Box>
                  <Typography sx={{ fontWeight: 700, color: textPrimary, mb: 1.5, fontSize: '1.2rem' }}>
                    {solution.title}
                  </Typography>
                  <Typography sx={{ color: textSecondary, lineHeight: 1.7, fontSize: '0.95rem' }}>
                    {solution.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── Pricing Section ─── */}
      <Box id="pricing" sx={{ py: { xs: 8, md: 12 }, backgroundColor: '#fff' }}>
        <Container maxWidth="lg">
          <SectionHeader
            overline="Pricing"
            title="Custom-built pricing for your fleet"
            subtitle="Pick and choose what you need. Pay only for the features that matter to your operation. Three tiers, unlimited flexibility."
          />

          <Grid container spacing={3}>
            {[
              {
                name: 'Free',
                description: 'Perfect for small fleets getting started with financial automation',
                features: [
                  'Up to 10 vehicles',
                  'Basic driver statements',
                  'Manual data imports',
                  'Email support',
                  'Core reconciliation',
                ],
                cta: 'Build your plan',
                highlighted: false,
                color: textSecondary
              },
              {
                name: 'Professional',
                description: 'Full automation for growing fleets that need advanced insights',
                features: [
                  'Up to 50 vehicles',
                  'AI-powered reconciliation',
                  'Automated settlements',
                  'Predictive analytics',
                  'API integrations',
                  'Priority support',
                  'Custom reporting',
                ],
                cta: 'Build your plan',
                highlighted: true,
                color: accent
              },
              {
                name: 'Enterprise',
                description: 'Unlimited scale with white-glove support and custom integrations',
                features: [
                  'Unlimited vehicles',
                  'Multi-fleet management',
                  'Dedicated account manager',
                  'Custom integrations',
                  'SLA guarantees',
                  '24/7 phone support',
                  'On-premise deployment option',
                ],
                cta: 'Build your plan',
                highlighted: false,
                color: green
              },
            ].map((plan, idx) => (
              <Grid item xs={12} md={4} key={idx}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    height: '100%',
                    borderRadius: '16px',
                    border: plan.highlighted ? `2px solid ${accent}` : '1px solid #e3e8ee',
                    backgroundColor: plan.highlighted ? alpha(accent, 0.02) : '#fff',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: plan.color,
                      boxShadow: `0 12px 32px ${alpha(plan.color, 0.15)}`,
                      transform: 'translateY(-4px)',
                    }
                  }}
                >
                  {plan.highlighted && (
                    <Box sx={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: accent,
                      color: '#fff',
                      px: 2,
                      py: 0.5,
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}>
                      Most Popular
                    </Box>
                  )}

                  <Typography sx={{ fontWeight: 700, color: textPrimary, mb: 2.5, fontSize: '1.5rem' }}>
                    {plan.name}
                  </Typography>

                  <Typography sx={{ color: textSecondary, mb: 3.5, fontSize: '0.9rem', lineHeight: 1.6, minHeight: '3rem' }}>
                    {plan.description}
                  </Typography>

                  <Button
                    variant={plan.highlighted ? 'contained' : 'outlined'}
                    fullWidth
                    size="large"
                    sx={{
                      mb: 3,
                      py: 1.3,
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      textTransform: 'none',
                      ...(plan.highlighted ? {
                        backgroundColor: accent,
                        color: '#fff',
                        boxShadow: 'none',
                        '&:hover': {
                          backgroundColor: accentLight,
                          boxShadow: `0 6px 20px ${alpha(accent, 0.35)}`,
                        }
                      } : {
                        borderColor: '#e3e8ee',
                        color: textPrimary,
                        '&:hover': {
                          borderColor: plan.color,
                          backgroundColor: alpha(plan.color, 0.04),
                        }
                      })
                    }}
                  >
                    {plan.cta}
                  </Button>

                  <Box sx={{ borderTop: '1px solid #e3e8ee', pt: 3 }}>
                    {plan.features.map((feature, fIdx) => (
                      <Box key={fIdx} sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                        <CheckCircle sx={{ fontSize: 18, color: plan.color, mr: 1.5, mt: 0.2, flexShrink: 0 }} />
                        <Typography sx={{ color: textSecondary, fontSize: '0.9rem', lineHeight: 1.5 }}>
                          {feature}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── Resources Section ─── */}
      <Box id="resources" sx={{ py: { xs: 8, md: 12 }, backgroundColor: bgLight }}>
        <Container maxWidth="lg">
          <SectionHeader
            overline="Resources"
            title="Everything you need to succeed"
            subtitle="Guides, documentation, and support to get the most out of Smart Fleets"
          />

          <Grid container spacing={3}>
            {[
              {
                icon: <MenuBook sx={{ fontSize: 28 }} />,
                title: 'Documentation',
                description: 'Complete guides on setup, integrations, and best practices. Step-by-step tutorials for every feature.',
                link: 'View docs',
                color: accent
              },
              {
                icon: <Support sx={{ fontSize: 28 }} />,
                title: 'Support Center',
                description: 'Get help when you need it. Search our knowledge base or contact our support team directly.',
                link: 'Get support',
                color: green
              },
              {
                icon: <Article sx={{ fontSize: 28 }} />,
                title: 'Blog & Insights',
                description: 'Industry trends, product updates, and fleet management best practices from our team.',
                link: 'Read blog',
                color: '#f59e0b'
              },
              {
                icon: <People sx={{ fontSize: 28 }} />,
                title: 'Customer Stories',
                description: 'See how fleet operators are saving time and reducing errors with Smart Fleets automation.',
                link: 'View stories',
                color: accent
              },
              {
                icon: <Code sx={{ fontSize: 28 }} />,
                title: 'API Reference',
                description: 'Build custom integrations with our REST API. Complete documentation with code examples.',
                link: 'View API docs',
                color: green
              },
              {
                icon: <TrendingUp sx={{ fontSize: 28 }} />,
                title: 'System Status',
                description: 'Real-time platform status and uptime monitoring. Subscribe to incident notifications.',
                link: 'Check status',
                color: '#f59e0b'
              },
            ].map((resource, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3.5,
                    height: '100%',
                    borderRadius: '16px',
                    border: '1px solid #e3e8ee',
                    backgroundColor: '#fff',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: resource.color,
                      boxShadow: `0 8px 24px ${alpha(resource.color, 0.12)}`,
                      transform: 'translateY(-2px)',
                    }
                  }}
                >
                  <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    backgroundColor: alpha(resource.color, 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    color: resource.color
                  }}>
                    {resource.icon}
                  </Box>
                  <Typography sx={{ fontWeight: 700, color: textPrimary, mb: 1.5, fontSize: '1.1rem' }}>
                    {resource.title}
                  </Typography>
                  <Typography sx={{ color: textSecondary, mb: 2.5, fontSize: '0.9rem', lineHeight: 1.6 }}>
                    {resource.description}
                  </Typography>
                  <Typography sx={{
                    color: resource.color,
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}>
                    {resource.link}
                    <ArrowForward sx={{ fontSize: 16 }} />
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── Contact Sales / CTA Section ─── */}
      <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: bgLight }} id="contact">
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={5}>
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, color: textPrimary, mb: 2, letterSpacing: '-0.5px', fontSize: { xs: '1.8rem', md: '2.4rem' } }}
              >
                Ready to transform your fleet operations?
              </Typography>
              <Typography sx={{ color: textSecondary, mb: 4, fontSize: '1.05rem', lineHeight: 1.7 }}>
                Talk to our team about how Smart Fleets can automate your financial workflows, reduce errors, and save you hours every week.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: alpha(accent, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Business sx={{ fontSize: 18, color: accent }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 600, color: textPrimary, fontSize: '0.9rem' }}>Email us</Typography>
                    <Typography sx={{ color: accent, fontSize: '0.9rem', fontWeight: 500 }}>info@smartfleets.ai</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: alpha(green, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Schedule sx={{ fontSize: 18, color: green }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 600, color: textPrimary, fontSize: '0.9rem' }}>Response time</Typography>
                    <Typography sx={{ color: textSecondary, fontSize: '0.9rem' }}>We typically respond within 24 hours</Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={7}>
              <Paper
                elevation={0}
                sx={{ p: { xs: 3, md: 5 }, borderRadius: '16px', border: '1px solid #e3e8ee', backgroundColor: '#fff' }}
              >
                <Typography sx={{ fontWeight: 700, color: textPrimary, mb: 0.5, fontSize: '1.2rem' }}>
                  Contact Sales
                </Typography>
                <Typography sx={{ color: textSecondary, mb: 3, fontSize: '0.9rem' }}>
                  Fill out the form and our team will get back to you shortly.
                </Typography>
                {contactSuccess && (
                  <Box sx={{ mb: 2, p: 2, borderRadius: '8px', backgroundColor: alpha(green, 0.08), border: `1px solid ${alpha(green, 0.2)}` }}>
                    <Typography sx={{ color: green, fontWeight: 600, fontSize: '0.9rem' }}>{contactSuccess}</Typography>
                  </Box>
                )}
                {contactError && (
                  <Box sx={{ mb: 2, p: 2, borderRadius: '8px', backgroundColor: alpha('#e53935', 0.08), border: '1px solid rgba(229,57,53,0.2)' }}>
                    <Typography sx={{ color: '#e53935', fontWeight: 600, fontSize: '0.9rem' }}>{contactError}</Typography>
                  </Box>
                )}
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" label="First name" variant="outlined" required
                      value={contactForm.firstName} onChange={handleContactField('firstName')} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" label="Last name" variant="outlined"
                      value={contactForm.lastName} onChange={handleContactField('lastName')} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth size="small" label="Work email" type="email" variant="outlined" required
                      value={contactForm.email} onChange={handleContactField('email')} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" label="Company name" variant="outlined"
                      value={contactForm.company} onChange={handleContactField('company')} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" label="Fleet size" variant="outlined" placeholder="e.g., 50 vehicles"
                      value={contactForm.fleetSize} onChange={handleContactField('fleetSize')} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth size="small" label="How can we help?" multiline rows={3} variant="outlined"
                      value={contactForm.message} onChange={handleContactField('message')} />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained" fullWidth size="large" onClick={handleContactSubmit} disabled={contactSubmitting}
                      sx={{
                        backgroundColor: accent, color: '#fff', fontWeight: 600, py: 1.5, borderRadius: '8px', fontSize: '1rem', textTransform: 'none', boxShadow: 'none',
                        '&:hover': { backgroundColor: accentLight, boxShadow: '0 6px 20px rgba(99,91,255,0.35)' },
                      }}
                    >
                      {contactSubmitting ? 'Sending...' : 'Get in touch'}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ─── Footer ─── */}
      <Box sx={{ backgroundColor: textPrimary, py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} sx={{ mb: 5 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LocalTaxi sx={{ fontSize: 22, color: accent }} />
                <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>Smart Fleets</Typography>
              </Box>
              <Typography sx={{ color: alpha('#fff', 0.5), fontSize: '0.85rem', lineHeight: 1.6, mb: 1.5 }}>
                AI-powered financial intelligence for modern fleet operators.
              </Typography>
              <Typography
                component="a"
                href="mailto:info@smartfleets.ai"
                sx={{
                  color: alpha('#fff', 0.65),
                  fontSize: '0.85rem',
                  mb: 0.5,
                  display: 'block',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                  '&:hover': { color: accent }
                }}
              >
                info@smartfleets.ai
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <Typography sx={{ color: alpha('#fff', 0.4), fontWeight: 600, mb: 2, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1.5 }}>Products</Typography>
              {['AI Reconciliation', 'Analytics', 'Settlements', 'Fleet Intelligence', 'Integrations'].map(item => (
                <Typography
                  key={item}
                  onClick={() => handleFooterLink('Products', item)}
                  sx={{
                    color: alpha('#fff', 0.65),
                    mb: 1,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { color: '#fff', transform: 'translateX(4px)' }
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <Typography sx={{ color: alpha('#fff', 0.4), fontWeight: 600, mb: 2, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1.5 }}>Solutions</Typography>
              {['Fleet Owners', 'Accountants', 'Dispatchers', 'Multi-fleet', 'Enterprise'].map(item => (
                <Typography
                  key={item}
                  onClick={() => handleFooterLink('Solutions', item)}
                  sx={{
                    color: alpha('#fff', 0.65),
                    mb: 1,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { color: '#fff', transform: 'translateX(4px)' }
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <Typography sx={{ color: alpha('#fff', 0.4), fontWeight: 600, mb: 2, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1.5 }}>Resources</Typography>
              {['Documentation', 'Blog', 'Customer Stories', 'Support', 'Status'].map(item => (
                <Typography
                  key={item}
                  onClick={() => handleFooterLink('Resources', item)}
                  sx={{
                    color: alpha('#fff', 0.65),
                    mb: 1,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { color: '#fff', transform: 'translateX(4px)' }
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Grid>
            <Grid item xs={6} sm={3} md={3}>
              <Typography sx={{ color: alpha('#fff', 0.4), fontWeight: 600, mb: 2, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1.5 }}>Company</Typography>
              {['About', 'Careers', 'Contact', 'Privacy Policy', 'Terms of Service'].map(item => (
                <Typography
                  key={item}
                  onClick={() => handleFooterLink('Company', item)}
                  sx={{
                    color: alpha('#fff', 0.65),
                    mb: 1,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { color: '#fff', transform: 'translateX(4px)' }
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Grid>
          </Grid>
          <Box sx={{ borderTop: `1px solid ${alpha('#fff', 0.08)}`, pt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography sx={{ color: alpha('#fff', 0.35), fontSize: '0.8rem' }}>
              © 2026 Smart Fleets. All rights reserved.
            </Typography>
            <Typography sx={{ color: alpha('#fff', 0.35), fontSize: '0.8rem' }}>
              Canada / English
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  );
}
