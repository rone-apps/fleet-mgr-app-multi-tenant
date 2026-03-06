"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  PaymentOutlined,
  CommuteOutlined,
  Business,
  WavingHand,
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
      <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: '#fff' }}>
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

      {/* ─── CTA Section ─── */}
      <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: bgLight }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography
            variant="h3"
            sx={{ fontWeight: 700, color: textPrimary, mb: 2, letterSpacing: '-0.5px', fontSize: { xs: '1.8rem', md: '2.4rem' } }}
          >
            The future of fleet finance is autonomous
          </Typography>
          <Typography sx={{ color: textSecondary, mb: 5, fontSize: '1.1rem', maxWidth: 520, mx: 'auto', lineHeight: 1.6 }}>
            Join the fleet operators who stopped managing finances and started letting AI handle it. Get started in minutes.
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
                AI-powered financial intelligence for modern fleet operators.
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <Typography sx={{ color: alpha('#fff', 0.4), fontWeight: 600, mb: 2, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1.5 }}>Products</Typography>
              {['AI Reconciliation', 'Analytics', 'Settlements', 'Fleet Intelligence', 'Integrations'].map(item => (
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

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  );
}
