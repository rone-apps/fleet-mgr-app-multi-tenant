"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Chip,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import { API_BASE_URL } from "../../lib/api";

/**
 * MatchingCabsPreview - Shows preview of cabs matching the category rules
 */
export default function MatchingCabsPreview({
  categoryId,
  category,
  hideIfEmpty = false,
}) {
  const [expanded, setExpanded] = useState(false);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (categoryId && expanded) {
      loadPreview();
    }
  }, [categoryId, expanded]);

  /**
   * Load matching cabs preview
   */
  const loadPreview = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/expense-category-rules/${categoryId}/matching-cabs`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPreview(data);
      } else {
        setError("Failed to load matching cabs preview");
      }
    } catch (err) {
      console.error("Error loading preview:", err);
      setError("Error loading preview");
    } finally {
      setLoading(false);
    }
  };

  if (!preview && !expanded) {
    return null;
  }

  if (hideIfEmpty && preview && preview.totalCount === 0) {
    return null;
  }

  /**
   * Calculate total expenses that will be created
   */
  const calculateExpenseCount = () => {
    if (!category || category.appliesTo !== "SHIFT" || !preview) {
      return preview?.totalCount || 0;
    }

    // For SHIFT level, estimate based on sample
    // SINGLE shift = 1 expense, DOUBLE shift = 2 expenses
    let total = 0;
    if (preview.sampleCabs) {
      preview.sampleCabs.forEach((cab) => {
        if (cab.cabShiftType === "SINGLE") {
          total += 1;
        } else if (cab.cabShiftType === "DOUBLE") {
          total += 2;
        }
      });

      // Extrapolate for remaining cabs if needed
      if (preview.hasMore && preview.sampleCabs.length > 0) {
        const avgPerCab = total / preview.sampleCabs.length;
        const remainingCabs = preview.totalCount - preview.sampleCabs.length;
        total += Math.round(avgPerCab * remainingCabs);
      }
    }

    return total;
  };

  const expenseCount = calculateExpenseCount();
  const statusColor = preview?.totalCount > 0 ? "success" : "warning";

  return (
    <Card sx={{ mt: 2 }}>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              label={`${preview?.totalCount || 0} cabs match`}
              color={statusColor}
              variant="outlined"
            />
            {category?.appliesTo === "SHIFT" && preview?.totalCount > 0 && (
              <Typography variant="body2" color="textSecondary">
                → Will create ~{expenseCount} shift-level expenses
              </Typography>
            )}
          </Box>
        }
        action={
          <IconButton
            onClick={() => {
              if (!expanded && !preview) {
                loadPreview();
              }
              setExpanded(!expanded);
            }}
            aria-expanded={expanded}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        }
      />

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          )}

          {error && <Alert severity="error">{error}</Alert>}

          {preview && !loading && (
            <Box>
              {preview.sampleCabs && preview.sampleCabs.length > 0 ? (
                <>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Cabs with Matching Shifts:
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: "block" }}>
                    Each cab may have multiple shifts. Below are the cabs that have at least one shift matching your criteria.
                  </Typography>

                  <List sx={{ width: "100%" }}>
                    {preview.sampleCabs.map((cab) => (
                      <ListItem key={cab.id}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {cab.cabNumber}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.5, flexWrap: "wrap" }}>
                              <Typography variant="caption" color="textSecondary">
                                Matching shifts:
                              </Typography>

                              {cab.shareType && (
                                <Chip
                                  label={`Share: ${cab.shareType.replace("_", " ")}`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}

                              {cab.hasAirportLicense && (
                                <Chip label="Airport License" size="small" color="primary" />
                              )}

                              {cab.cabType && (
                                <Chip
                                  label={`Type: ${cab.cabType === "HANDICAP_VAN" ? "Handicap Van" : "Sedan"}`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}

                              {category?.appliesTo === "SHIFT" && (
                                <Chip
                                  label={cab.cabShiftType === "SINGLE" ? "1 shift matches" : "2 shifts match"}
                                  size="small"
                                  color="success"
                                />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>

                  {preview.hasMore && (
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      ... and {preview.totalCount - preview.sampleCabs.length} more cabs
                    </Typography>
                  )}
                </>
              ) : (
                <Alert severity="warning">
                  No cabs match the specified criteria. Please review your rule configuration.
                </Alert>
              )}
            </Box>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
}
