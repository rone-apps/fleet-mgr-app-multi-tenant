"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GlobalNav from "../components/GlobalNav";
import {
  Box,
  Typography,
  Container,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Grid,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
} from "@mui/material";
import {
  Edit,
  Delete,
  Add,
  Close,
  Category,
  ArrowBack,
} from "@mui/icons-material";
import { getCurrentUser, isAuthenticated, API_BASE_URL, getTenantSchema } from '../lib/api';

const CabTypeEnum = {
  SEDAN: 'SEDAN',
  HANDICAP_VAN: 'HANDICAP_VAN'
};

const ShareTypeEnum = {
  VOTING_SHARE: 'VOTING_SHARE',
  NON_VOTING_SHARE: 'NON_VOTING_SHARE'
};

const ShiftTypeEnum = {
  DAY: 'DAY',
  NIGHT: 'NIGHT'
};

export default function ShiftProfilesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [attributeTypes, setAttributeTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [formData, setFormData] = useState({
    profileCode: '',
    profileName: '',
    description: '',
    cabType: '',
    shareType: '',
    hasAirportLicense: false,
    shiftType: '',
    category: '',
    colorCode: '#3E5244',
    displayOrder: 0,
    dynamicAttributes: []
  });

  // Dynamic attributes UI state
  const [newAttribute, setNewAttribute] = useState({
    attributeTypeId: '',
    isRequired: true,
    expectedValue: ''
  });

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = getCurrentUser();
      if (!isAuthenticated() || !currentUser) {
        router.push('/');
        return;
      }

      // Check permissions with current user data
      const canView = ['ADMIN', 'MANAGER', 'DISPATCHER', 'ACCOUNTANT'].includes(currentUser.role);
      if (!canView) {
        setError('You do not have permission to view shift profiles');
        setLoading(false);
        return;
      }

      // Debug: Log tenant schema
      const tenantSchema = getTenantSchema();
      console.log('Tenant Schema:', tenantSchema);
      console.log('Local Storage tenantSchema:', localStorage.getItem('tenantSchema'));
      console.log('Local Storage tenantId:', localStorage.getItem('tenantId'));

      setUser(currentUser);
      await loadProfiles();
      await loadAttributeTypes();
    };

    checkAuth();
  }, []);

  // Permission checks (for rendering)
  const canCreate = user && ['ADMIN', 'MANAGER'].includes(user.role);
  const canDelete = user && ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
  const canView = user && ['ADMIN', 'MANAGER', 'DISPATCHER', 'ACCOUNTANT'].includes(user.role);

  const loadProfiles = async () => {
    try {
      const tenantSchema = typeof window !== 'undefined'
        ? (localStorage.getItem('tenantSchema') || localStorage.getItem('tenantId') || 'fareflow')
        : 'fareflow';

      const response = await fetch(`${API_BASE_URL}/shift-profiles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-ID': tenantSchema
        }
      });

      if (!response.ok) throw new Error('Failed to load profiles');
      const data = await response.json();
      setProfiles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAttributeTypes = async () => {
    try {
      const tenantSchema = typeof window !== 'undefined'
        ? (localStorage.getItem('tenantSchema') || localStorage.getItem('tenantId') || 'fareflow')
        : 'fareflow';

      const response = await fetch(`${API_BASE_URL}/cab-attribute-types`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-ID': tenantSchema
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAttributeTypes(data);
      }
    } catch (err) {
      console.error('Failed to load attribute types:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      profileCode: '',
      profileName: '',
      description: '',
      cabType: '',
      shareType: '',
      hasAirportLicense: false,
      shiftType: '',
      category: '',
      colorCode: '#3E5244',
      displayOrder: 0,
      dynamicAttributes: []
    });
    setNewAttribute({
      attributeTypeId: '',
      isRequired: true,
      expectedValue: ''
    });
    setEditingProfile(null);
  };

  const handleOpenDialog = (profile = null) => {
    if (profile) {
      setEditingProfile(profile);
      setFormData({
        profileCode: profile.profileCode,
        profileName: profile.profileName,
        description: profile.description,
        cabType: profile.cabType || '',
        shareType: profile.shareType || '',
        hasAirportLicense: profile.hasAirportLicense || false,
        shiftType: profile.shiftType || '',
        category: profile.category || '',
        colorCode: profile.colorCode || '#3E5244',
        displayOrder: profile.displayOrder || 0,
        dynamicAttributes: profile.profileAttributes || []
      });
    } else {
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  const handleAddAttribute = () => {
    if (!newAttribute.attributeTypeId) {
      setError('Please select an attribute type');
      return;
    }

    setFormData({
      ...formData,
      dynamicAttributes: [
        ...formData.dynamicAttributes,
        { ...newAttribute, id: Date.now() }
      ]
    });

    setNewAttribute({
      attributeTypeId: '',
      isRequired: true,
      expectedValue: ''
    });
  };

  const handleRemoveAttribute = (attrId) => {
    setFormData({
      ...formData,
      dynamicAttributes: formData.dynamicAttributes.filter(attr => attr.id !== attrId)
    });
  };

  const handleSaveProfile = async () => {
    try {
      if (!formData.profileCode || !formData.profileName) {
        setError('Profile code and name are required');
        return;
      }

      const url = editingProfile
        ? `${API_BASE_URL}/shift-profiles/${editingProfile.id}`
        : `${API_BASE_URL}/shift-profiles`;

      const method = editingProfile ? 'PUT' : 'POST';

      const payload = {
        profileCode: formData.profileCode,
        profileName: formData.profileName,
        description: formData.description,
        cabType: formData.cabType || null,
        shareType: formData.shareType || null,
        hasAirportLicense: formData.hasAirportLicense || null,
        shiftType: formData.shiftType || null,
        category: formData.category,
        colorCode: formData.colorCode,
        displayOrder: formData.displayOrder,
        dynamicAttributes: formData.dynamicAttributes.map(attr => ({
          attributeTypeId: attr.attributeTypeId,
          isRequired: attr.isRequired,
          expectedValue: attr.expectedValue
        }))
      };

      const tenantSchema = typeof window !== 'undefined'
        ? (localStorage.getItem('tenantSchema') || localStorage.getItem('tenantId') || 'fareflow')
        : 'fareflow';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-ID': tenantSchema
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to save profile');

      setSuccessMessage(editingProfile ? 'Profile updated successfully' : 'Profile created successfully');
      setTimeout(() => setSuccessMessage(null), 3000);

      await loadProfiles();
      handleCloseDialog();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteProfile = async (profileId) => {
    if (!window.confirm('Are you sure you want to delete this profile?')) return;

    try {
      const tenantSchema = typeof window !== 'undefined'
        ? (localStorage.getItem('tenantSchema') || localStorage.getItem('tenantId') || 'fareflow')
        : 'fareflow';

      const response = await fetch(`${API_BASE_URL}/shift-profiles/${profileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-ID': tenantSchema
        }
      });

      if (!response.ok) throw new Error('Failed to delete profile');

      setSuccessMessage('Profile deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadProfiles();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleStatus = async (profileId, isActive) => {
    try {
      const endpoint = isActive ? 'deactivate' : 'activate';
      const tenantSchema = typeof window !== 'undefined'
        ? (localStorage.getItem('tenantSchema') || localStorage.getItem('tenantId') || 'fareflow')
        : 'fareflow';

      const response = await fetch(`${API_BASE_URL}/shift-profiles/${profileId}/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Tenant-ID': tenantSchema
        }
      });

      if (!response.ok) throw new Error('Failed to update profile status');

      setSuccessMessage(`Profile ${isActive ? 'deactivated' : 'activated'} successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadProfiles();
    } catch (err) {
      setError(err.message);
    }
  };

  const getAttributeName = (attributeTypeId) => {
    const attr = attributeTypes.find(a => a.id === attributeTypeId);
    return attr ? attr.attributeName : 'Unknown';
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!canView) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="error">You do not have permission to access this page</Typography>
      </Box>
    );
  }

  return (
    <>
      <GlobalNav currentUser={user} title="FareFlow - Shift Profiles" />
      <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => router.back()} sx={{ color: '#3e5244' }}>
            <ArrowBack />
          </IconButton>
          <Category sx={{ fontSize: 32, color: '#3e5244' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#3e5244' }}>
              Shift Profiles
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Manage reusable attribute bundles for shifts and expenses
            </Typography>
          </Box>
        </Box>

        {canCreate && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ backgroundColor: '#3e5244' }}
          >
            New Profile
          </Button>
        )}
      </Box>

      {/* Success Message */}
      {successMessage && (
        <Card sx={{ mb: 3, backgroundColor: '#d4edda', borderColor: '#28a745' }}>
          <CardContent>
            <Typography sx={{ color: '#155724' }}>{successMessage}</Typography>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card sx={{ mb: 3, backgroundColor: '#f8d7da', borderColor: '#f5c6cb' }}>
          <CardContent>
            <Typography sx={{ color: '#721c24' }}>{error}</Typography>
          </CardContent>
        </Card>
      )}

      {/* Profiles Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Cab Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Share Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Airport License</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Shift Type</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Usage</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {profiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">No profiles found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((profile) => (
                <TableRow key={profile.id} sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: profile.colorCode || '#3e5244'
                        }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {profile.profileCode}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{profile.profileName}</TableCell>
                  <TableCell>{profile.cabType || '-'}</TableCell>
                  <TableCell>{profile.shareType ? profile.shareType.replace('_', ' ') : '-'}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    {profile.hasAirportLicense === null ? '-' : (profile.hasAirportLicense ? '✓' : '✗')}
                  </TableCell>
                  <TableCell>{profile.shiftType || '-'}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Chip label={profile.usageCount || 0} size="small" />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Chip
                      label={profile.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={profile.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(profile)}
                      sx={{ color: '#3e5244' }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    {canDelete && profile.usageCount === 0 && !profile.isSystemProfile && (
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteProfile(profile.id)}
                        sx={{ color: '#d32f2f' }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    )}
                    {profile.isActive && (
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => handleToggleStatus(profile.id, true)}
                      >
                        Deactivate
                      </Button>
                    )}
                    {!profile.isActive && (
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => handleToggleStatus(profile.id, false)}
                      >
                        Activate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#3e5244' }}>
          {editingProfile ? 'Edit Profile' : 'Create Profile'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Profile Code"
                value={formData.profileCode}
                onChange={(e) => setFormData({ ...formData, profileCode: e.target.value })}
                disabled={editingProfile !== null}
                placeholder="e.g., PREMIUM_SEDAN_VOTING"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Profile Name"
                value={formData.profileName}
                onChange={(e) => setFormData({ ...formData, profileName: e.target.value })}
                placeholder="e.g., Premium Sedan - Voting Share"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>

            {/* Static Attributes */}
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Cab Type</InputLabel>
                <Select
                  value={formData.cabType}
                  onChange={(e) => setFormData({ ...formData, cabType: e.target.value })}
                  label="Cab Type"
                >
                  <MenuItem value="">Any</MenuItem>
                  <MenuItem value="SEDAN">Sedan</MenuItem>
                  <MenuItem value="HANDICAP_VAN">Handicap Van</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Share Type</InputLabel>
                <Select
                  value={formData.shareType}
                  onChange={(e) => setFormData({ ...formData, shareType: e.target.value })}
                  label="Share Type"
                >
                  <MenuItem value="">Any</MenuItem>
                  <MenuItem value="VOTING_SHARE">Voting Share</MenuItem>
                  <MenuItem value="NON_VOTING_SHARE">Non-Voting Share</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Airport License</InputLabel>
                <Select
                  value={formData.hasAirportLicense === null ? '' : formData.hasAirportLicense}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, hasAirportLicense: val === '' ? null : val === 'true' });
                  }}
                  label="Airport License"
                >
                  <MenuItem value="">Any</MenuItem>
                  <MenuItem value="true">Required</MenuItem>
                  <MenuItem value="false">Not Required</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Shift Type</InputLabel>
                <Select
                  value={formData.shiftType}
                  onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })}
                  label="Shift Type"
                >
                  <MenuItem value="">Any</MenuItem>
                  <MenuItem value="DAY">Day</MenuItem>
                  <MenuItem value="NIGHT">Night</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Metadata */}
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., PREMIUM"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="color"
                label="Color Code"
                value={formData.colorCode}
                onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Dynamic Attributes */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Dynamic Attributes
              </Typography>
              {formData.dynamicAttributes.map((attr, idx) => (
                <Box key={attr.id || idx} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {getAttributeName(attr.attributeTypeId)} ({attr.isRequired ? 'Required' : 'Excluded'})
                    {attr.expectedValue && ` = ${attr.expectedValue}`}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveAttribute(attr.id)}
                    sx={{ color: '#d32f2f' }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
              ))}

              <Grid container spacing={1} sx={{ mt: 0.5 }}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Add Attribute</InputLabel>
                    <Select
                      value={newAttribute.attributeTypeId}
                      onChange={(e) => setNewAttribute({ ...newAttribute, attributeTypeId: e.target.value })}
                      label="Add Attribute"
                    >
                      {attributeTypes.map((attr) => (
                        <MenuItem key={attr.id} value={attr.id}>
                          {attr.attributeName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={newAttribute.isRequired}
                        onChange={(e) => setNewAttribute({ ...newAttribute, isRequired: e.target.checked })}
                      />
                    }
                    label="Required"
                    sx={{ fontSize: '0.9rem' }}
                  />
                </Grid>
                <Grid item xs={2}>
                  <Button
                    size="small"
                    onClick={handleAddAttribute}
                    variant="outlined"
                    sx={{ color: '#3e5244', borderColor: '#3e5244' }}
                  >
                    Add
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveProfile}
            variant="contained"
            sx={{ backgroundColor: '#3e5244' }}
          >
            {editingProfile ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
    </>
  );
}
