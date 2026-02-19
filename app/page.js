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
  Lightbulb,
  TrendingUpOutlined,
  ReceiptOutlined,
  StorefrontOutlined,
  GroupOutlined,
  AiOutlined,
  SchemaOutlined,
  HelpOutline
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
                FareFlow
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

// Marketing Landing Page Component
function MarketingLandingPage({ router }) {
  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: 'transparent',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
            <LocalTaxi sx={{ fontSize: 32, color: '#fff' }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
              FareFlow
            </Typography>
            <Chip
              icon={<AutoAwesome sx={{ fontSize: 16 }} />}
              label="AI-Powered"
              size="small"
              sx={{
                ml: 1,
                backgroundColor: alpha('#fff', 0.2),
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.7rem'
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => router.push('/signin')}
              sx={{
                color: '#fff',
                borderColor: alpha('#fff', 0.3),
                fontWeight: 600,
                px: 3,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#fff',
                  backgroundColor: alpha('#fff', 0.1)
                }
              }}
            >
              Sign In
            </Button>
            <Button
              variant="contained"
              onClick={() => router.push('/signin')}
              sx={{
                backgroundColor: '#fff',
                color: '#667eea',
                fontWeight: 700,
                px: 3,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                '&:hover': {
                  backgroundColor: alpha('#fff', 0.9),
                  boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
                }
              }}
            >
              Get Started
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ pt: 8, pb: 6 }}>
        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', mb: 12 }}>
          <Chip
            label="Transform Your Business"
            sx={{
              mb: 3,
              backgroundColor: alpha('#fff', 0.2),
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.85rem',
              px: 1
            }}
          />
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              color: '#fff',
              mb: 3,
              letterSpacing: '-1px',
              textShadow: '0 2px 10px rgba(0,0,0,0.1)',
              fontSize: { xs: '2.5rem', md: '3.5rem' }
            }}
          >
            AI-Driven Taxi Financial Management
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: alpha('#fff', 0.9),
              maxWidth: 800,
              mx: 'auto',
              fontWeight: 400,
              lineHeight: 1.8,
              mb: 5,
              fontSize: '1.1rem'
            }}
          >
            Revolutionize your taxi business with intelligent automation. Real-time reporting,
            automated billing, and financial insights powered by artificial intelligence.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push('/signin')}
              sx={{
                backgroundColor: '#fff',
                color: '#667eea',
                fontWeight: 700,
                px: 6,
                py: 2,
                borderRadius: 3,
                fontSize: '1rem',
                textTransform: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                '&:hover': {
                  backgroundColor: alpha('#fff', 0.95),
                  boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Get Started for Free
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                color: '#fff',
                borderColor: alpha('#fff', 0.5),
                fontWeight: 700,
                px: 6,
                py: 2,
                borderRadius: 3,
                fontSize: '1rem',
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#fff',
                  backgroundColor: alpha('#fff', 0.1)
                },
                transition: 'all 0.3s ease'
              }}
            >
              Watch Demo
            </Button>
          </Box>
        </Box>

        {/* Features Section */}
        <Box sx={{ mb: 12, pt: 8 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: '#fff',
              textAlign: 'center',
              mb: 8,
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}
          >
            Powerful Features for Your Fleet
          </Typography>

          <Grid container spacing={4}>
            {[
              {
                icon: <TrendingUpOutlined sx={{ fontSize: 40 }} />,
                title: 'Real-Time Analytics',
                description: 'Track earnings, expenses, and profitability in real-time with AI-powered insights'
              },
              {
                icon: <MonetizationOn sx={{ fontSize: 40 }} />,
                title: 'Automated Billing',
                description: 'Smart expense tracking and automatic invoice generation for customers'
              },
              {
                icon: <LocalShipping sx={{ fontSize: 40 }} />,
                title: 'Fleet Management',
                description: 'Manage drivers, vehicles, and shift allocations with intelligent optimization'
              },
              {
                icon: <BarChart sx={{ fontSize: 40 }} />,
                title: 'Advanced Reports',
                description: 'Comprehensive financial reports and driver performance metrics'
              },
              {
                icon: <AutoAwesome sx={{ fontSize: 40 }} />,
                title: 'AI Insights',
                description: 'Intelligent recommendations for business optimization and growth'
              },
              {
                icon: <CheckCircle sx={{ fontSize: 40 }} />,
                title: 'Multi-Tenant Support',
                description: 'Manage multiple taxi companies or divisions from one platform'
              }
            ].map((feature, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    background: alpha('#fff', 0.08),
                    backdropFilter: 'blur(10px)',
                    border: '1px solid ' + alpha('#fff', 0.2),
                    borderRadius: 3,
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: alpha('#fff', 0.12),
                      border: '1px solid ' + alpha('#fff', 0.4),
                      transform: 'translateY(-8px)'
                    }
                  }}
                >
                  <Box sx={{ color: '#ffc107', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
                    {feature.title}
                  </Typography>
                  <Typography sx={{ color: alpha('#fff', 0.8), lineHeight: 1.6 }}>
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Benefits Section */}
        <Box sx={{ mb: 12, pt: 8, background: alpha('#fff', 0.05), p: 6, borderRadius: 3 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: '#fff',
              textAlign: 'center',
              mb: 8,
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}
          >
            Why Choose FareFlow?
          </Typography>

          <Grid container spacing={4}>
            {[
              { number: '50+', label: 'Taxi Companies Trust Us', icon: '🚕' },
              { number: '1M+', label: 'Transactions Processed', icon: '💰' },
              { number: '99.9%', label: 'System Uptime', icon: '⚡' },
              { number: '24/7', label: 'Customer Support', icon: '🎯' }
            ].map((stat, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '3rem', mb: 1 }}>{stat.icon}</Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 800, color: '#ffc107', mb: 1 }}
                  >
                    {stat.number}
                  </Typography>
                  <Typography sx={{ color: alpha('#fff', 0.8), fontWeight: 500 }}>
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* CTA Section */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            border: '1px solid ' + alpha('#fff', 0.2),
            p: 8,
            borderRadius: 3,
            textAlign: 'center',
            mb: 6
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: '#fff',
              mb: 3,
              fontSize: { xs: '1.8rem', md: '2.5rem' }
            }}
          >
            Ready to Transform Your Taxi Business?
          </Typography>
          <Typography
            sx={{
              color: alpha('#fff', 0.9),
              mb: 5,
              fontSize: '1.1rem',
              maxWidth: 700,
              mx: 'auto'
            }}
          >
            Join hundreds of taxi companies worldwide that are already using FareFlow to automate their operations and grow their business.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => router.push('/signin')}
            sx={{
              backgroundColor: '#ffc107',
              color: '#333',
              fontWeight: 700,
              px: 8,
              py: 2.5,
              borderRadius: 3,
              fontSize: '1.1rem',
              textTransform: 'none',
              boxShadow: '0 8px 24px rgba(255,193,7,0.3)',
              '&:hover': {
                backgroundColor: '#ffb300',
                boxShadow: '0 12px 32px rgba(255,193,7,0.4)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Start Your Free Trial Today
          </Button>
        </Box>
      </Container>

      {/* Footer */}
      <Box
        sx={{
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid ' + alpha('#fff', 0.1),
          py: 6,
          mt: 6
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LocalTaxi sx={{ fontSize: 24, color: '#ffc107' }} />
                <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>
                  FareFlow
                </Typography>
              </Box>
              <Typography sx={{ color: alpha('#fff', 0.7), fontSize: '0.9rem' }}>
                AI-powered taxi financial management platform
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>Product</Typography>
              <Typography sx={{ color: alpha('#fff', 0.7), mb: 1, cursor: 'pointer', '&:hover': { color: '#fff' } }}>
                Features
              </Typography>
              <Typography sx={{ color: alpha('#fff', 0.7), mb: 1, cursor: 'pointer', '&:hover': { color: '#fff' } }}>
                Pricing
              </Typography>
              <Typography sx={{ color: alpha('#fff', 0.7), cursor: 'pointer', '&:hover': { color: '#fff' } }}>
                Security
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>Company</Typography>
              <Typography sx={{ color: alpha('#fff', 0.7), mb: 1, cursor: 'pointer', '&:hover': { color: '#fff' } }}>
                About Us
              </Typography>
              <Typography sx={{ color: alpha('#fff', 0.7), mb: 1, cursor: 'pointer', '&:hover': { color: '#fff' } }}>
                Blog
              </Typography>
              <Typography sx={{ color: alpha('#fff', 0.7), cursor: 'pointer', '&:hover': { color: '#fff' } }}>
                Contact
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>Legal</Typography>
              <Typography sx={{ color: alpha('#fff', 0.7), mb: 1, cursor: 'pointer', '&:hover': { color: '#fff' } }}>
                Privacy Policy
              </Typography>
              <Typography sx={{ color: alpha('#fff', 0.7), mb: 1, cursor: 'pointer', '&:hover': { color: '#fff' } }}>
                Terms of Service
              </Typography>
              <Typography sx={{ color: alpha('#fff', 0.7), cursor: 'pointer', '&:hover': { color: '#fff' } }}>
                Cookies
              </Typography>
            </Grid>
          </Grid>
          <Box sx={{ borderTop: '1px solid ' + alpha('#fff', 0.1), pt: 4, textAlign: 'center' }}>
            <Typography sx={{ color: alpha('#fff', 0.6), fontSize: '0.9rem' }}>
              © 2026 FareFlow. All rights reserved. | Powered by AI
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
