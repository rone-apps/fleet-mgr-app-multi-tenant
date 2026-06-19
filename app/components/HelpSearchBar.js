'use client';
import { useState, useEffect } from 'react';
import {
  Box, TextField, InputAdornment, Paper, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Typography,
  Chip, IconButton, Fade
} from '@mui/material';
import { HelpOutline, Close, ArrowForward } from '@mui/icons-material';
import { searchHelp, getPopularTopics } from '../utils/helpSearch';
import * as MuiIcons from '@mui/icons-material';

export default function HelpSearchBar({ onSelectTopic }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [popularTopics, setPopularTopics] = useState([]);

  useEffect(() => {
    setPopularTopics(getPopularTopics());
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      const searchResults = searchHelp(query);
      setResults(searchResults);
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [query]);

  const handleSelectTopic = (topic) => {
    console.log('Help topic clicked:', topic);
    if (onSelectTopic) {
      console.log('Calling onSelectTopic callback');
      onSelectTopic(topic);
    } else {
      console.warn('onSelectTopic callback is not defined');
    }
    setQuery('');
    setShowResults(false);
  };

  const handleClickAway = (event) => {
    // Close results when clicking outside
    if (event.target.closest('.help-search-container') === null) {
      setShowResults(false);
    }
  };

  useEffect(() => {
    if (showResults) {
      document.addEventListener('click', handleClickAway);
      return () => document.removeEventListener('click', handleClickAway);
    }
  }, [showResults]);

  return (
    <Box className="help-search-container" sx={{ position: 'relative', width: '100%', maxWidth: 650 }}>
      <TextField
        fullWidth
        placeholder="Ask a question... (e.g., 'how do I see driver reports?')"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length > 2 && setShowResults(true)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <HelpOutline sx={{ color: '#667eea' }} />
            </InputAdornment>
          ),
          endAdornment: query && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setQuery('')}>
                <Close />
              </IconButton>
            </InputAdornment>
          ),
          sx: {
            borderRadius: 3,
            backgroundColor: '#f9fafb',
            '& fieldset': { border: '2px solid #e5e7eb' },
            '&:hover fieldset': { borderColor: '#667eea' },
            '&.Mui-focused fieldset': { borderColor: '#667eea' }
          }
        }}
      />

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <Fade in={showResults}>
          <Paper
            elevation={8}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              mt: 1,
              maxHeight: 450,
              overflow: 'auto',
              zIndex: 1000,
              borderRadius: 2,
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
            }}
          >
            <List sx={{ py: 1 }}>
              {results.map((result) => {
                const IconComponent = MuiIcons[result.icon] || HelpOutline;
                return (
                  <ListItem key={result.id} disablePadding>
                    <ListItemButton
                      onClick={() => handleSelectTopic(result)}
                      sx={{
                        py: 1.5,
                        px: 2,
                        '&:hover': {
                          backgroundColor: '#f5f7fa'
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 48 }}>
                        <IconComponent sx={{ color: result.color, fontSize: 28 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {result.title}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                              {result.navigationPath}
                            </Typography>
                            <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                              {result.matchedKeywords?.slice(0, 3).map((kw) => (
                                <Chip
                                  key={kw}
                                  label={kw}
                                  size="small"
                                  sx={{
                                    mr: 0.5,
                                    height: 20,
                                    fontSize: '0.7rem',
                                    backgroundColor: `${result.color}20`,
                                    color: result.color,
                                    fontWeight: 600
                                  }}
                                />
                              ))}
                            </Box>
                          </>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                      <ArrowForward sx={{ color: 'text.secondary', ml: 1 }} />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        </Fade>
      )}

      {/* No results message */}
      {showResults && query.length > 2 && results.length === 0 && (
        <Fade in={showResults}>
          <Paper
            elevation={8}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              mt: 1,
              p: 3,
              zIndex: 1000,
              borderRadius: 2,
              textAlign: 'center'
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No help topics found for "{query}". Try different keywords or browse popular topics below.
            </Typography>
          </Paper>
        </Fade>
      )}

      {/* Popular Topics (when no search) */}
      {!query && popularTopics.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
            🔥 Popular Topics:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {popularTopics.map((topic) => (
              <Chip
                key={topic.id}
                label={topic.title}
                onClick={() => handleSelectTopic(topic)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#667eea',
                    color: 'white'
                  }
                }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
