"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import AuthGuard from '../../../components/AuthGuard';
import GlobalNav from '../../../components/GlobalNav';

const PLUGIN_CONFIGS = {
  taxicaller: {
    name: 'TaxiCaller',
    icon: '🚕',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
      { name: 'companyId', label: 'Company ID', type: 'number', required: true },
      { name: 'baseUrl', label: 'Base URL', type: 'text', required: true, default: 'https://app.taxicaller.net' },
    ],
  },
  icabbi: {
    name: 'iCabbi',
    icon: '📱',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
      { name: 'secretKey', label: 'Secret Key', type: 'password', required: true },
      { name: 'accountId', label: 'Account ID', type: 'text', required: true },
      { name: 'baseUrl', label: 'Base URL', type: 'text', required: true, default: 'https://api.icabbi.com' },
    ],
  },
  moneris: {
    name: 'Moneris',
    icon: '💳',
    fields: [
      { name: 'environment', label: 'Environment', type: 'select', required: true, options: ['PROD', 'TEST'], default: 'PROD' },
      { name: 'syncMethod', label: 'Sync Method', type: 'select', required: true, options: ['SFTP', 'WEB_SCRAPE'], default: 'SFTP' },
    ],
  },
  chase: {
    name: 'Chase',
    icon: '💳',
    fields: [
      { name: 'merchantId', label: 'Merchant ID', type: 'text', required: true },
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
      { name: 'environment', label: 'Environment', type: 'select', required: true, options: ['PROD', 'TEST'], default: 'PROD' },
    ],
  },
};

const CRON_PRESETS = [
  { label: '2:00 AM Daily', value: '0 0 2 * * *' },
  { label: '3:00 AM Daily', value: '0 0 3 * * *' },
  { label: '4:00 AM Daily', value: '0 0 4 * * *' },
  { label: 'Every 6 Hours', value: '0 0 */6 * * *' },
  { label: 'Every Hour', value: '0 0 * * * *' },
  { label: 'Custom', value: 'custom' },
];

export default function ConfigurePluginPage() {
  const router = useRouter();
  const params = useParams();
  const pluginId = params.pluginId;

  const pluginDef = PLUGIN_CONFIGS[pluginId];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [enabled, setEnabled] = useState(true);
  const [configData, setConfigData] = useState({});
  const [cronPreset, setCronPreset] = useState('0 0 2 * * *');
  const [customCron, setCustomCron] = useState('');
  const [importDays, setImportDays] = useState(2);
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
    if (pluginId) {
      fetchPluginConfig();
    }
  }, [pluginId]);

  const fetchPluginConfig = async () => {
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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/plugins/${pluginId}/config`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': tenantId || 'mac-cabs',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConfigData(data.configData || {});
        setEnabled(data.enabled);
        if (data.scheduleConfig) {
          setCronPreset(data.scheduleConfig.cron || '0 0 2 * * *');
          setImportDays(data.scheduleConfig.importPreviousDays || 2);
        }
      } else {
        // Plugin not configured yet, use defaults
        const defaults = {};
        pluginDef?.fields.forEach(field => {
          if (field.default) {
            defaults[field.name] = field.default;
          }
        });
        setConfigData(defaults);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      const tenantId = document.cookie
        .split('; ')
        .find(row => row.startsWith('tenantId='))
        ?.split('=')[1];

      const payload = {
        pluginId,
        configData,
        enabled,
        scheduleConfig: {
          cron: cronPreset === 'custom' ? customCron : cronPreset,
          importPreviousDays: importDays,
        },
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/plugins/${pluginId}/configure`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': tenantId || 'mac-cabs',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save configuration');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/plugins');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (fieldName, value) => {
    setConfigData(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  if (userLoading || loading) {
    return (
      <AuthGuard requiredRole="ADMIN">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </AuthGuard>
    );
  }

  if (!pluginDef) {
    return (
      <AuthGuard requiredRole="ADMIN">
        <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
          <GlobalNav currentUser={currentUser} title="Plugin Configuration" />
          <Box sx={{ p: 3 }}>
            <Alert severity="error">Unknown plugin: {pluginId}</Alert>
          </Box>
        </Box>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="ADMIN">
      <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
        <GlobalNav currentUser={currentUser} title={`Configure ${pluginDef?.name || 'Plugin'}`} />
        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/plugins')}
          sx={{ mb: 2 }}
        >
          Back to Plugins
        </Button>

        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Typography variant="h3" sx={{ fontSize: '2.5rem' }}>
                {pluginDef.icon}
              </Typography>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Configure {pluginDef.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Set up connection and schedule for this plugin
                </Typography>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Configuration saved successfully! Redirecting...
              </Alert>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  color="success"
                />
              }
              label={<Typography variant="h6">Enable Plugin</Typography>}
              sx={{ mb: 3 }}
            />

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Connection Settings
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {pluginDef.fields.map((field) => {
                if (field.type === 'select') {
                  return (
                    <Grid item xs={12} key={field.name}>
                      <FormControl fullWidth>
                        <InputLabel>{field.label}</InputLabel>
                        <Select
                          value={configData[field.name] || field.default || ''}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          label={field.label}
                          required={field.required}
                        >
                          {field.options.map(option => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  );
                }

                return (
                  <Grid item xs={12} key={field.name}>
                    <TextField
                      fullWidth
                      label={field.label}
                      type={field.type}
                      value={configData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      required={field.required}
                      placeholder={field.default}
                    />
                  </Grid>
                );
              })}
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Schedule Settings
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <FormControl fullWidth>
                  <InputLabel>Schedule</InputLabel>
                  <Select
                    value={cronPreset}
                    onChange={(e) => setCronPreset(e.target.value)}
                    label="Schedule"
                  >
                    {CRON_PRESETS.map(preset => (
                      <MenuItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Import Previous Days"
                  value={importDays}
                  onChange={(e) => setImportDays(parseInt(e.target.value))}
                  inputProps={{ min: 1, max: 30 }}
                />
              </Grid>

              {cronPreset === 'custom' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Custom Cron Expression"
                    value={customCron}
                    onChange={(e) => setCustomCron(e.target.value)}
                    placeholder="0 0 2 * * *"
                    helperText="Format: second minute hour day month weekday"
                  />
                </Grid>
              )}
            </Grid>

            <Box mt={4} display="flex" gap={2}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
                fullWidth
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => router.push('/plugins')}
                disabled={saving}
              >
                Cancel
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
      </Box>
    </AuthGuard>
  );
}
