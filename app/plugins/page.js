"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Switch,
  Button,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  CloudSync as CloudSyncIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import AuthGuard from '../components/AuthGuard';
import GlobalNav from '../components/GlobalNav';

// Available plugins metadata
const AVAILABLE_PLUGINS = [
  {
    id: 'taxicaller',
    name: 'TaxiCaller',
    description: 'Import driver shifts, trips, and account charges from TaxiCaller dispatch system',
    icon: '🚕',
    type: 'DISPATCH',
    color: '#4CAF50',
  },
  {
    id: 'icabbi',
    name: 'iCabbi',
    description: 'Import booking and dispatch data from iCabbi system',
    icon: '📱',
    type: 'DISPATCH',
    color: '#2196F3',
  },
  {
    id: 'moneris',
    name: 'Moneris',
    description: 'Sync credit card transactions from Moneris payment terminals',
    icon: '💳',
    type: 'PAYMENT',
    color: '#FF9800',
  },
  {
    id: 'chase',
    name: 'Chase',
    description: 'Sync credit card transactions from Chase payment terminals',
    icon: '💳',
    type: 'PAYMENT',
    color: '#0066CC',
  },
];

export default function PluginsPage() {
  const router = useRouter();
  const [pluginConfigs, setPluginConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toggling, setToggling] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
    setUserLoading(false);
  }, []);

  useEffect(() => {
    fetchPluginConfigs();
  }, []);

  const fetchPluginConfigs = async () => {
    try {
      setLoading(true);
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      const tenantId = document.cookie
        .split('; ')
        .find(row => row.startsWith('tenantId='))
        ?.split('=')[1];

      // Debug logging
      console.log('All cookies:', document.cookie);
      console.log('Parsed tenantId:', tenantId);
      console.log('Token exists:', !!token);
      console.log('Using tenant:', tenantId || 'mac-cabs');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plugins/configs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || 'mac-cabs',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch plugin configurations');
      }

      const data = await response.json();
      setPluginConfigs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (pluginId, currentEnabled) => {
    try {
      setToggling(prev => ({ ...prev, [pluginId]: true }));
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      const tenantId = document.cookie
        .split('; ')
        .find(row => row.startsWith('tenantId='))
        ?.split('=')[1];

      console.log('Toggle - Using tenant:', tenantId || 'mac-cabs');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plugins/${pluginId}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId || 'mac-cabs',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle plugin');
      }

      await fetchPluginConfigs();
    } catch (err) {
      setError(err.message);
    } finally {
      setToggling(prev => ({ ...prev, [pluginId]: false }));
    }
  };

  const handleConfigure = (pluginId) => {
    router.push(`/plugins/${pluginId}/configure`);
  };

  const getPluginConfig = (pluginId) => {
    return pluginConfigs.find(config => config.pluginId === pluginId);
  };

  const renderPluginCard = (plugin) => {
    const config = getPluginConfig(plugin.id);
    const isConfigured = !!config;
    const isEnabled = config?.enabled || false;

    return (
      <Grid item xs={12} md={6} lg={4} key={plugin.id}>
        <Card
          sx={{
            height: '100%',
            border: isEnabled ? `2px solid ${plugin.color}` : '1px solid #e0e0e0',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: 6,
              transform: 'translateY(-4px)',
            },
          }}
        >
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h3" sx={{ fontSize: '2rem' }}>
                  {plugin.icon}
                </Typography>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {plugin.name}
                  </Typography>
                  <Chip
                    label={plugin.type}
                    size="small"
                    sx={{
                      backgroundColor: plugin.color,
                      color: 'white',
                      fontSize: '0.7rem',
                      height: '20px',
                    }}
                  />
                </Box>
              </Box>
              {isConfigured && (
                <Switch
                  checked={isEnabled}
                  onChange={() => handleToggle(plugin.id, isEnabled)}
                  disabled={toggling[plugin.id]}
                  color="success"
                />
              )}
            </Box>

            <Typography variant="body2" color="text.secondary" mb={2}>
              {plugin.description}
            </Typography>

            <Box display="flex" gap={1} alignItems="center" mb={2}>
              {isConfigured ? (
                <Chip
                  icon={<CheckCircleIcon />}
                  label="Configured"
                  color="success"
                  size="small"
                />
              ) : (
                <Chip
                  icon={<CancelIcon />}
                  label="Not Configured"
                  color="default"
                  size="small"
                />
              )}
              {isConfigured && config.scheduleConfig && (
                <Tooltip title={`Schedule: ${config.scheduleConfig.cron}`}>
                  <Chip
                    icon={<ScheduleIcon />}
                    label="Scheduled"
                    size="small"
                    color="primary"
                  />
                </Tooltip>
              )}
            </Box>

            <Box display="flex" gap={1}>
              <Button
                variant={isConfigured ? "outlined" : "contained"}
                color="primary"
                startIcon={<SettingsIcon />}
                onClick={() => handleConfigure(plugin.id)}
                fullWidth
              >
                {isConfigured ? 'Reconfigure' : 'Configure'}
              </Button>
              {isConfigured && (
                <Tooltip title="Test Connection">
                  <IconButton
                    color="primary"
                    sx={{
                      border: '1px solid',
                      borderColor: 'primary.main',
                    }}
                  >
                    <CloudSyncIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  if (loading || userLoading) {
    return (
      <AuthGuard requiredRole="ADMIN">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="ADMIN">
      <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
        <GlobalNav currentUser={currentUser} title="Plugin Management" />

        <Box sx={{ p: 3 }}>
          <Box mb={4}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Plugin Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Configure third-party integrations for your company
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {AVAILABLE_PLUGINS.map(plugin => renderPluginCard(plugin))}
          </Grid>
        </Box>
      </Box>
    </AuthGuard>
  );
}
