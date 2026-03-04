"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  DialogActions
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
  PaymentOutlined
} from "@mui/icons-material";
import { getCurrentUser, logout, isAuthenticated, getTenantName, API_BASE_URL } from './lib/api';
import { setSelectedCategory as storeCategoryNav } from './lib/categoryNav';
import FinancialHelpDialog from './financial-setup/components/FinancialHelpDialog';
import OperationsHelpCard from '../components/OperationsHelpCard';
import AccountCustomerHelpCard from '../components/AccountCustomerHelpCard';
import ReportsHelpCard from '../components/ReportsHelpCard';
import DataIntegrationHelpCard from '../components/DataIntegrationHelpCard';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [tenantName, setTenantName] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuthentication = () => {
      try {
        const storedTenantSchema = localStorage.getItem("tenantSchema");
        let currentUser = getCurrentUser();

        if (currentUser && isAuthenticated() && storedTenantSchema) {
          setUser(currentUser);
          setTenantName(getTenantName());

          // Load saved category if returning from a sub-page
          const savedCategory = localStorage.getItem('dashboardCategory');
          if (savedCategory) {
            setSelectedCategory(savedCategory);
            localStorage.removeItem('dashboardCategory'); // Clear after using
          }

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
            🚕 Maclures Cabs
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
      <AppBar position="static" sx={{ backgroundColor: '#3e5244' }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            <LocalTaxi sx={{ fontSize: 28, color: '#ffc107', mr: 1 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1, color: '#fff' }}>
                Smart Fleets
              </Typography>
              {tenantName && (
                <Typography variant="caption" sx={{ color: '#a5d6a7', fontWeight: 600, display: 'block' }}>
                  🚕 {tenantName}
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person />
              <Box>
                <Typography variant="body2">
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography variant="caption" sx={{ color: '#ccc' }}>
                  {user.role}
                </Typography>
              </Box>
            </Box>

            <IconButton color="inherit" onClick={handleLogout} title="Logout">
              <Logout />
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
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 3,
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              transform: 'translate(30%, -30%)'
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.5px' }}>
                Welcome back, {user.firstName}! 👋
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.95, fontWeight: 500 }}>
                {user.role} • {user.username}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Chip
                icon={<AutoAwesome />}
                label="AI Dashboard"
                sx={{
                  backgroundColor: alpha('#fff', 0.25),
                  backdropFilter: 'blur(10px)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  px: 2,
                  py: 2.5,
                  border: '1px solid rgba(255,255,255,0.3)'
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
                {selectedCategory === 'operations' && 'Operations'}
                {selectedCategory === 'financials' && 'Financials'}
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
                    onClick={() => setSelectedCategory('account')}
                  />
                </Grid>
              )}

              {/* Operations */}
              {['ADMIN', 'MANAGER', 'DISPATCHER'].includes(user.role) && (
                <Grid item xs={12} sm={6} md={4}>
                  <CategoryCard
                    title="Operations"
                    description="Manage drivers, cabs & shifts"
                    icon={DirectionsCar}
                    gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
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
                    onClick={() => {
                      storeCategoryNav('payments');
                      router.push('/driver-payments');
                    }}
                  />
                </Grid>
              )}

              {/* Financials */}
              {['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(user.role) && (
                <Grid item xs={12} sm={6} md={4}>
                  <CategoryCard
                    title="Financials"
                    description="Setup expenses, revenues & reporting"
                    icon={AttachMoney}
                    gradient="linear-gradient(135deg, #f5576c 0%, #f093fb 100%)"
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
                    onClick={() => setSelectedCategory('integrations')}
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
function CategoryCard({ title, description, icon: Icon, gradient, onClick }) {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        background: '#fff',
        borderRadius: 3,
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: '2px solid transparent',
        backgroundImage: `linear-gradient(white, white), ${gradient}`,
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        }
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 3, textAlign: 'center' }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: 3,
            background: gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
          }}
        >
          <Icon sx={{ fontSize: 32, color: '#fff' }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
          {description}
        </Typography>
        <ArrowForward sx={{ fontSize: 20, color: '#667eea' }} />
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
          }
        ];

      case 'financials':
        return [
          {
            title: 'Income & Expenses',
            description: 'Real-time financial tracking with AI insights',
            icon: MonetizationOn,
            path: '/expenses',
            roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
            badge: 'Smart Analysis',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            accent: '#f5576c'
          },
          {
            title: 'Driver & Owner Payments',
            description: 'Bulk payment batches and settlement management',
            icon: PaymentOutlined,
            path: '/driver-payments',
            roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
            badge: 'Bulk Processing',
            gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            accent: '#10b981'
          },
          {
            title: 'Financial Configuration',
            description: 'Setup categories, rates & automated calculations',
            icon: SchemaOutlined,
            path: '/financial-setup',
            roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
            badge: 'Setup',
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            accent: '#00f2fe'
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
            title: 'Statement Builder',
            description: 'Generate detailed financial statements & settle accounts',
            icon: ReceiptOutlined,
            path: '/statement-builder',
            roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
            badge: 'Interactive',
            gradient: 'linear-gradient(135deg, #f5576c 0%, #ffa502 100%)',
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
            title: 'Data Import',
            description: 'Batch upload CSV, Excel & external data sources',
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
      operations: 'Operations',
      financials: 'Financials',
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
                transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                border: '2px solid transparent',
                backgroundImage: `linear-gradient(white, white), ${item.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}`,
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  background: `radial-gradient(circle at top right, ${item.accent || '#667eea'}15, transparent 60%)`,
                  pointerEvents: 'none'
                },
                '&:hover': {
                  transform: 'translateY(-12px) scale(1.02)',
                  boxShadow: `0 20px 50px ${(item.accent || '#667eea')}25`,
                  borderColor: item.accent || '#667eea'
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
              <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                {/* Badge */}
                {item.badge && (
                  <Box sx={{ mb: 1.5, display: 'flex', gap: 1 }}>
                    <Chip
                      icon={<AutoAwesome sx={{ fontSize: 14 }} />}
                      label={item.badge}
                      size="small"
                      sx={{
                        background: `linear-gradient(135deg, ${item.accent || '#667eea'}, ${item.accent || '#667eea'}dd)`,
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        height: 20
                      }}
                    />
                  </Box>
                )}

                {/* Icon Box with gradient */}
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: 2.5,
                    background: item.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    boxShadow: `0 10px 30px ${(item.accent || '#667eea')}30`,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <item.icon sx={{ fontSize: 32, color: '#fff' }} />
                </Box>

                {/* Title and Description */}
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: '#1a1a1a' }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" sx={{ color: '#555', lineHeight: 1.5, mb: 2 }}>
                  {item.description}
                </Typography>

                {/* Action indicator */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: item.accent || '#667eea', fontWeight: 600, fontSize: '0.9rem' }}>
                  <ArrowForward sx={{ fontSize: 18 }} />
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
                  sx={{ color: textSecondary, fontWeight: 500, fontSize: '0.95rem', cursor: 'pointer', '&:hover': { color: textPrimary } }}
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
            label="Automate fleet finances"
            size="small"
            sx={{ mb: 3, backgroundColor: alpha(accent, 0.08), color: accent, fontWeight: 600, fontSize: '0.8rem', border: `1px solid ${alpha(accent, 0.15)}` }}
          />
          <Typography
            variant="h1"
            sx={{ fontWeight: 700, color: textPrimary, mb: 3, letterSpacing: '-1.5px', lineHeight: 1.08, fontSize: { xs: '2.8rem', sm: '3.5rem', md: '4.2rem' } }}
          >
            Fleet finances on autopilot
          </Typography>
          <Typography
            sx={{ color: textSecondary, maxWidth: 620, mx: 'auto', fontWeight: 400, lineHeight: 1.7, mb: 5, fontSize: { xs: '1.05rem', md: '1.2rem' } }}
          >
            Smart reconciliation, automated billing, and real-time reporting — from your first driver to your thousandth. Zero spreadsheets. Minimal manual intervention.
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
            Trusted by fleet operators across the country
          </Typography>
          <Grid container spacing={4} justifyContent="center" alignItems="center">
            {['Maclures Cabs', 'City Taxi Co', 'Metro Fleet Services', 'Express Dispatch', 'Premier Cars'].map((name, idx) => (
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
            overline="Solutions"
            title="Flexible solutions for every fleet model"
            subtitle="Whether you run 10 cabs or 1,000, Smart Fleets adapts to your business. Automate the financial workflows that matter most."
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
                <Chip label="Core Platform" size="small" sx={{ mb: 2, backgroundColor: alpha(accent, 0.1), color: accent, fontWeight: 600, fontSize: '0.75rem' }} />
                <Typography sx={{ fontWeight: 700, color: textPrimary, fontSize: '1.5rem', mb: 2, letterSpacing: '-0.3px' }}>
                  Auto-reconciliation engine
                </Typography>
                <Typography sx={{ color: textSecondary, lineHeight: 1.7, mb: 3, fontSize: '1rem' }}>
                  Shifts, mileage, lease charges, airport fees, credit card totals — all reconciled automatically.
                  Smart Fleets matches every transaction to its source and flags discrepancies before they become problems.
                </Typography>
                <Grid container spacing={2}>
                  {['Shift-level matching', 'Mileage-based lease calc', 'Airport trip detection', 'Multi-source revenue merge'].map((item, i) => (
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
                    <AttachMoney sx={{ fontSize: 24, color: green }} />
                  </Box>
                  <Typography sx={{ fontWeight: 600, color: textPrimary, mb: 1, fontSize: '1.05rem' }}>
                    One-click settlements
                  </Typography>
                  <Typography sx={{ color: textSecondary, lineHeight: 1.6, fontSize: '0.9rem' }}>
                    Generate driver and owner payment batches instantly. Review, approve, and export — no manual calculation required.
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
                    <Receipt sx={{ fontSize: 24, color: '#f59e0b' }} />
                  </Box>
                  <Typography sx={{ fontWeight: 600, color: textPrimary, mb: 1, fontSize: '1.05rem' }}>
                    Automated financial statements
                  </Typography>
                  <Typography sx={{ color: textSecondary, lineHeight: 1.6, fontSize: '0.9rem' }}>
                    Every driver gets a detailed statement — revenue, expenses, deductions, net owed — generated automatically from shift data.
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
            title="The backbone of fleet operations"
          />
          <Grid container spacing={4}>
            {[
              { number: '50+', label: 'Fleet operators onboarded', sublabel: 'across multiple regions' },
              { number: '1M+', label: 'Transactions reconciled', sublabel: 'shifts, mileage, payments' },
              { number: '99.9%', label: 'Historical uptime', sublabel: 'for Smart Fleets services' },
              { number: '<30s', label: 'Report generation', sublabel: 'for any driver, any period' }
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
            title="From shift data to settled accounts in minutes"
            subtitle="Three steps to fully automated fleet financial management. No spreadsheets. No manual reconciliation."
          />

          <Grid container spacing={4}>
            {[
              {
                step: '01',
                icon: <CloudUpload sx={{ fontSize: 28 }} />,
                title: 'Connect your data',
                description: 'Import shifts from TaxiCaller, upload credit card CSVs, or sync mileage records. Smart Fleets ingests data from every source your fleet uses.',
                color: accent
              },
              {
                step: '02',
                icon: <AutoAwesome sx={{ fontSize: 28 }} />,
                title: 'Auto-reconcile everything',
                description: 'The platform matches shifts to lease charges, calculates mileage-based expenses, counts airport trips, and flags any discrepancies — automatically.',
                color: green
              },
              {
                step: '03',
                icon: <Description sx={{ fontSize: 28 }} />,
                title: 'Generate & settle',
                description: 'One-click financial statements for every driver. Bulk payment batches for owners. Export to Excel or PDF. Review, approve, done.',
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
            overline="Use cases"
            title="Built for every role in your operation"
          />

          {[
            {
              title: 'Fleet owners & managers',
              description: 'See the full financial picture across all drivers and vehicles. Track revenue vs. expenses at a glance, identify underperforming assets, and make data-driven decisions about your fleet.',
              features: ['Cross-driver summary reports', 'Owner revenue tracking', 'Lease vs. income analysis', 'Bulk payment processing'],
              icon: <Assessment sx={{ fontSize: 32 }} />,
              color: accent,
              reverse: false
            },
            {
              title: 'Accountants & bookkeepers',
              description: 'Eliminate the end-of-month crunch. Smart Fleets continuously reconciles every data source so your books are always up to date. Export-ready reports in the formats you need.',
              features: ['Auto-reconciled statements', 'Excel & PDF exports', 'Itemized expense breakdowns', 'Audit-ready data trail'],
              icon: <CreditCard sx={{ fontSize: 32 }} />,
              color: green,
              reverse: true
            },
            {
              title: 'Dispatchers & operations',
              description: 'Manage shift assignments, track vehicle usage, and ensure every driver is properly accounted for. Real-time visibility into who is driving what, when.',
              features: ['Shift profile templates', 'Driver-cab assignment', 'Attribute-based configuration', 'TaxiCaller integration'],
              icon: <Schedule sx={{ fontSize: 32 }} />,
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
            overline="What our customers say"
            title="Trusted by fleet operators"
          />

          <Grid container spacing={3}>
            {[
              {
                quote: "We used to spend two full days at month-end reconciling spreadsheets. Smart Fleets does it continuously. Our books are always up to date now.",
                name: 'Operations Manager',
                company: 'Regional Taxi Fleet',
              },
              {
                quote: "The driver summary report alone saved us 20 hours a month. Every driver gets an accurate statement with zero manual work from our side.",
                name: 'Fleet Accountant',
                company: 'City Cab Company',
              },
              {
                quote: "Integration with TaxiCaller was seamless. Shifts flow in automatically, and settlements are generated with one click. Game changer for our dispatch team.",
                name: 'Fleet Director',
                company: 'Metro Dispatch Services',
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
            overline="Integration"
            title="Connects with the tools you already use"
            subtitle="Import data from any source. Smart Fleets works with your existing dispatch system, payment processor, and accounting workflow."
            light
          />

          <Grid container spacing={3}>
            {[
              { title: 'TaxiCaller Sync', description: 'Real-time shift import from your dispatch system. Drivers, cabs, and shift data flow in automatically.', icon: <ApiOutlined sx={{ fontSize: 24 }} /> },
              { title: 'CSV & Excel Import', description: 'Bulk upload credit card transactions, mileage records, and payment data. Drag, drop, done.', icon: <UploadFile sx={{ fontSize: 24 }} /> },
              { title: 'Export Anywhere', description: 'Generate Excel reports, PDF statements, and structured data exports for your accounting system.', icon: <FileDownload sx={{ fontSize: 24 }} /> },
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
      <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: '#fff' }}>
        <Container maxWidth="lg">
          <SectionHeader
            overline="Platform"
            title="Everything you need to run your fleet"
            subtitle="Purpose-built tools for fleet financial management, from shift tracking to automated settlements."
          />

          <Grid container spacing={3}>
            {[
              { icon: <TrendingUpOutlined sx={{ fontSize: 26 }} />, title: 'Real-time dashboards', description: 'Live revenue, expense, and profitability metrics across your entire fleet.', color: accent },
              { icon: <MonetizationOn sx={{ fontSize: 26 }} />, title: 'Automated billing', description: 'Expense tracking and invoice generation with zero manual input.', color: green },
              { icon: <LocalShipping sx={{ fontSize: 26 }} />, title: 'Fleet management', description: 'Drivers, vehicles, and shift allocations with intelligent scheduling.', color: '#f59e0b' },
              { icon: <BarChart sx={{ fontSize: 26 }} />, title: 'Advanced reports', description: 'Driver summaries, lease reconciliation, and financial statements.', color: accent },
              { icon: <Speed sx={{ fontSize: 26 }} />, title: 'Instant settlements', description: 'Generate payment batches for drivers and owners in seconds.', color: green },
              { icon: <CheckCircle sx={{ fontSize: 26 }} />, title: 'Multi-tenant', description: 'Run multiple taxi companies from one unified platform.', color: '#f59e0b' },
              { icon: <Insights sx={{ fontSize: 26 }} />, title: 'Smart alerts', description: 'Get notified about discrepancies, missing data, and anomalies.', color: accent },
              { icon: <VerifiedUser sx={{ fontSize: 26 }} />, title: 'Role-based access', description: 'Admins, managers, accountants, and drivers each see what they need.', color: green },
              { icon: <Timeline sx={{ fontSize: 26 }} />, title: 'Audit trail', description: 'Every calculation traceable back to source data for full accountability.', color: '#f59e0b' },
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

      {/* ─── CTA Section ─── */}
      <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: bgLight }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography
            variant="h3"
            sx={{ fontWeight: 700, color: textPrimary, mb: 2, letterSpacing: '-0.5px', fontSize: { xs: '1.8rem', md: '2.4rem' } }}
          >
            Ready to automate your fleet finances?
          </Typography>
          <Typography sx={{ color: textSecondary, mb: 5, fontSize: '1.1rem', maxWidth: 520, mx: 'auto', lineHeight: 1.6 }}>
            Start for free. See results in minutes. No credit card required.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained" size="large" onClick={() => router.push('/signin')} endIcon={<ArrowForward />}
              sx={{
                backgroundColor: accent, color: '#fff', fontWeight: 600, px: 5, py: 1.5, borderRadius: '8px', fontSize: '1rem', textTransform: 'none', boxShadow: 'none',
                '&:hover': { backgroundColor: accentLight, boxShadow: '0 6px 20px rgba(99,91,255,0.35)' },
              }}
            >
              Start now
            </Button>
            <Button
              size="large"
              sx={{ color: textSecondary, fontWeight: 600, px: 4, py: 1.5, borderRadius: '8px', fontSize: '1rem', textTransform: 'none', '&:hover': { color: textPrimary, backgroundColor: alpha(textPrimary, 0.04) } }}
            >
              Contact sales
            </Button>
          </Box>
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
              <Typography sx={{ color: alpha('#fff', 0.5), fontSize: '0.85rem', lineHeight: 1.6, mb: 2 }}>
                Automated financial infrastructure for modern fleet operators.
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <Typography sx={{ color: alpha('#fff', 0.4), fontWeight: 600, mb: 2, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1.5 }}>Products</Typography>
              {['Reconciliation', 'Reports', 'Settlements', 'Fleet Mgmt', 'Data Import'].map(item => (
                <Typography key={item} sx={{ color: alpha('#fff', 0.65), mb: 1, fontSize: '0.85rem', cursor: 'pointer', '&:hover': { color: '#fff' } }}>{item}</Typography>
              ))}
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <Typography sx={{ color: alpha('#fff', 0.4), fontWeight: 600, mb: 2, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1.5 }}>Solutions</Typography>
              {['Fleet Owners', 'Accountants', 'Dispatchers', 'Multi-fleet', 'Enterprise'].map(item => (
                <Typography key={item} sx={{ color: alpha('#fff', 0.65), mb: 1, fontSize: '0.85rem', cursor: 'pointer', '&:hover': { color: '#fff' } }}>{item}</Typography>
              ))}
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <Typography sx={{ color: alpha('#fff', 0.4), fontWeight: 600, mb: 2, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1.5 }}>Resources</Typography>
              {['Documentation', 'Blog', 'Customer Stories', 'Support', 'Status'].map(item => (
                <Typography key={item} sx={{ color: alpha('#fff', 0.65), mb: 1, fontSize: '0.85rem', cursor: 'pointer', '&:hover': { color: '#fff' } }}>{item}</Typography>
              ))}
            </Grid>
            <Grid item xs={6} sm={3} md={3}>
              <Typography sx={{ color: alpha('#fff', 0.4), fontWeight: 600, mb: 2, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1.5 }}>Company</Typography>
              {['About', 'Careers', 'Contact', 'Privacy Policy', 'Terms of Service'].map(item => (
                <Typography key={item} sx={{ color: alpha('#fff', 0.65), mb: 1, fontSize: '0.85rem', cursor: 'pointer', '&:hover': { color: '#fff' } }}>{item}</Typography>
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
