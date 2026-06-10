'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

const FLEET_SIZE_OPTIONS = [
  { value: '1-5', label: '1-5 vehicles' },
  { value: '6-20', label: '6-20 vehicles' },
  { value: '21-50', label: '21-50 vehicles' },
  { value: '51-100', label: '51-100 vehicles' },
  { value: '100+', label: '100+ vehicles' },
];

export default function LeadSignupForm() {
  const [formData, setFormData] = useState({
    company_name: '',
    fleet_size: '',
    contact_name: '',
    email: '',
    phone: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successModalOpen, setSuccessModalOpen] = useState(false);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone) => {
    const re = /^[\d\s\-\(\)\+]+$/;
    return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required';
    }

    if (!formData.fleet_size) {
      newErrors.fleet_size = 'Fleet size is required';
    }

    if (!formData.contact_name.trim()) {
      newErrors.contact_name = 'Contact name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number (at least 10 digits)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare payload for backend (matching old contact form format)
      const payload = {
        firstName: formData.contact_name.split(' ')[0] || formData.contact_name,
        lastName: formData.contact_name.split(' ').slice(1).join(' ') || '',
        email: formData.email,
        company: formData.company_name,
        fleetSize: formData.fleet_size,
        phone: formData.phone,
        message: formData.notes || '',
      };

      // POST to existing backend endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send');
      }

      // Show success modal
      setSuccessModalOpen(true);

      // Reset form
      setFormData({
        company_name: '',
        fleet_size: '',
        contact_name: '',
        email: '',
        phone: '',
        notes: '',
      });
    } catch (error) {
      console.error('Contact form error:', error);
      setSubmitError(
        error.message || 'Failed to submit your information. Please try again or email us directly at info@smartfleets.ai'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setSuccessModalOpen(false);
  };

  return (
    <>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          maxWidth: 600,
          mx: 'auto',
          p: 4,
          bgcolor: 'white',
          borderRadius: 2,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Get Started with SmartFleets
        </Typography>

        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Company Name"
          name="company_name"
          value={formData.company_name}
          onChange={handleChange}
          error={!!errors.company_name}
          helperText={errors.company_name}
          required
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          select
          label="Fleet Size"
          name="fleet_size"
          value={formData.fleet_size}
          onChange={handleChange}
          error={!!errors.fleet_size}
          helperText={errors.fleet_size}
          required
          sx={{ mb: 2 }}
        >
          {FLEET_SIZE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth
          label="Contact Name"
          name="contact_name"
          value={formData.contact_name}
          onChange={handleChange}
          error={!!errors.contact_name}
          helperText={errors.contact_name}
          required
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={!!errors.email}
          helperText={errors.email}
          required
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Phone Number"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          error={!!errors.phone}
          helperText={errors.phone}
          required
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Additional Notes (Optional)"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          multiline
          rows={4}
          placeholder="Tell us about your fleet management needs..."
          sx={{ mb: 3 }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 600,
            '&:hover': {
              background: 'linear-gradient(135deg, #5568d3 0%, #63408a 100%)',
            },
            '&:disabled': {
              background: 'rgba(0, 0, 0, 0.12)',
            },
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
        </Button>
      </Box>

      {/* Success Modal */}
      <Dialog open={successModalOpen} onClose={handleCloseSuccessModal}>
        <DialogTitle sx={{ fontWeight: 600 }}>Thank You!</DialogTitle>
        <DialogContent>
          <Typography>
            We've received your information and will get in touch with you within 24 hours.
          </Typography>
          <Typography sx={{ mt: 2 }}>
            Our team is excited to help you modernize your fleet management!
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseSuccessModal}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #63408a 100%)',
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
