'use client';

import { Box, Container, Typography, Link as MuiLink } from '@mui/material';
import Link from 'next/link';
import LeadSignupForm from '../components/LeadSignupForm';

export default function SignupPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h2"
            sx={{
              color: 'white',
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: '2rem', md: '3rem' },
            }}
          >
            Start Managing Your Fleet Smarter
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 400,
              fontSize: { xs: '1rem', md: '1.25rem' },
            }}
          >
            Tell us about your fleet and we'll get in touch within 24 hours to show you how
            SmartFleets can transform your operations.
          </Typography>
        </Box>

        {/* Lead Form */}
        <LeadSignupForm />

        {/* Footer Link */}
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Existing customers?{' '}
            <MuiLink
              component={Link}
              href="/signin"
              sx={{
                color: 'white',
                fontWeight: 600,
                textDecoration: 'underline',
                '&:hover': {
                  color: 'rgba(255, 255, 255, 0.9)',
                },
              }}
            >
              Sign in
            </MuiLink>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
