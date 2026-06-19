'use client';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Stepper, Step, StepLabel,
  Card, CardContent, Chip, IconButton, Alert, Divider
} from '@mui/material';
import { Close, ArrowForward } from '@mui/icons-material';
import * as MuiIcons from '@mui/icons-material';

export default function HelpGuidanceDialog({ open, onClose, topic, onNavigate }) {
  console.log('HelpGuidanceDialog render:', { open, hasTopic: !!topic, topicTitle: topic?.title });

  if (!topic) return null;

  const IconComponent = MuiIcons[topic.icon] || MuiIcons.HelpOutline;

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate(topic);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle
        sx={{
          background: `linear-gradient(135deg, ${topic.color}dd 0%, ${topic.color}99 100%)`,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <IconComponent sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {topic.title}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {topic.category} • {topic.difficulty}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        {/* Navigation Path */}
        <Alert
          severity="info"
          icon={false}
          sx={{
            mb: 3,
            borderRadius: 2,
            backgroundColor: '#e3f2fd',
            border: '2px solid #2196f3'
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            📍 Where to go:
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2' }}>
            {topic.navigationPath}
          </Typography>
        </Alert>

        {/* Description */}
        <Typography variant="body1" paragraph sx={{ color: 'text.secondary', mb: 3 }}>
          {topic.description}
        </Typography>

        <Divider sx={{ my: 3 }} />

        {/* Step-by-Step Guide */}
        <Card sx={{ mb: 3, backgroundColor: '#f9fafb', border: '1px solid #e0e0e0' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              ✅ Step-by-Step Guide
            </Typography>
            <Stepper orientation="vertical" sx={{ '.MuiStepLabel-label': { fontSize: '0.95rem' } }}>
              {topic.steps.map((step, index) => (
                <Step key={index} active>
                  <StepLabel
                    StepIconProps={{
                      sx: {
                        color: topic.color,
                        '&.Mui-active': { color: topic.color },
                        '&.Mui-completed': { color: topic.color }
                      }
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {step}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* Related Topics */}
        {topic.relatedTopics && topic.relatedTopics.length > 0 && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
              Related Topics:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {topic.relatedTopics.map((relatedId) => (
                <Chip
                  key={relatedId}
                  label={relatedId.replace(/-/g, ' ')}
                  size="small"
                  variant="outlined"
                  sx={{ textTransform: 'capitalize' }}
                />
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2, backgroundColor: '#f9fafb' }}>
        <Button onClick={onClose} size="large">
          Close
        </Button>
        {onNavigate && (
          <Button
            variant="contained"
            size="large"
            onClick={handleNavigate}
            endIcon={<ArrowForward />}
            sx={{
              background: `linear-gradient(135deg, ${topic.color} 0%, ${topic.color}aa 100%)`,
              boxShadow: `0 4px 14px ${topic.color}40`,
              '&:hover': {
                background: `linear-gradient(135deg, ${topic.color}ee 0%, ${topic.color}bb 100%)`,
                boxShadow: `0 6px 20px ${topic.color}50`
              }
            }}
          >
            Take Me There
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
