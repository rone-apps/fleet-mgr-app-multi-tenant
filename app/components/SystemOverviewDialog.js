'use client';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Grid, Card, CardContent,
  List, ListItem, ListItemIcon, ListItemText,
  Accordion, AccordionSummary, AccordionDetails, IconButton
} from '@mui/material';
import {
  Close, ExpandMore, Person, DirectionsCar, AccessTime,
  AttachMoney, Receipt, Settings
} from '@mui/icons-material';
import { systemOverview } from '../data/helpIndex';

export default function SystemOverviewDialog({ open, onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
            <Settings sx={{ fontSize: 28 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {systemOverview.title}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Core Entities Section */}
        <Accordion defaultExpanded>
          <AccordionSummary
            expandIcon={<ExpandMore />}
            sx={{
              '&:hover': { backgroundColor: '#f5f5f5' }
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              📦 Core Entities
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Understanding these key entities will help you navigate and use the system effectively.
            </Typography>
            <Grid container spacing={2}>
              {systemOverview.sections[0].content.map((entity) => {
                const iconMap = {
                  Person, DirectionsCar, AccessTime, AttachMoney, Receipt
                };
                const IconComponent = iconMap[entity.icon];
                return (
                  <Grid item xs={12} sm={6} md={4} key={entity.entity}>
                    <Card
                      sx={{
                        height: '100%',
                        borderLeft: '4px solid #667eea',
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 24px rgba(102,126,234,0.2)'
                        }
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 2,
                              backgroundColor: '#667eea20',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 1.5
                            }}
                          >
                            <IconComponent sx={{ color: '#667eea', fontSize: 24 }} />
                          </Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {entity.entity}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {entity.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Typical Workflow Section */}
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMore />}
            sx={{
              '&:hover': { backgroundColor: '#f5f5f5' }
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              🔄 Typical Workflow
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Follow these steps to get your fleet management system up and running:
            </Typography>
            <List>
              {systemOverview.sections[1].steps.map((step, index) => (
                <ListItem key={index} sx={{ py: 1.5 }}>
                  <ListItemIcon>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        backgroundColor: '#667eea',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.95rem'
                      }}
                    >
                      {index + 1}
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={step}
                    primaryTypographyProps={{
                      variant: 'body1',
                      sx: { fontWeight: 500 }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>

        {/* Reports & Analytics Section */}
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMore />}
            sx={{
              '&:hover': { backgroundColor: '#f5f5f5' }
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              📊 Reports & Analytics
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {systemOverview.sections[2].content}
            </Typography>
          </AccordionDetails>
        </Accordion>

        {/* Data Integration Section */}
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMore />}
            sx={{
              '&:hover': { backgroundColor: '#f5f5f5' }
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              🔌 Data Integration
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {systemOverview.sections[3].content}
            </Typography>
          </AccordionDetails>
        </Accordion>
      </DialogContent>

      <DialogActions sx={{ p: 3, backgroundColor: '#f9fafb' }}>
        <Button onClick={onClose} variant="contained" size="large">
          Got It
        </Button>
      </DialogActions>
    </Dialog>
  );
}
