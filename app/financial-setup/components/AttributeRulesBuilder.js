"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Button,
  Stack,
  Typography,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  RadioGroup,
  Radio,
  IconButton,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Preview as PreviewIcon,
} from "@mui/icons-material";
import { API_BASE_URL } from "../../lib/api";

/**
 * AttributeRulesBuilder - Component for building attribute-based matching criteria
 * Supports static attributes (share type, airport license, etc.) and dynamic attributes
 */
export default function AttributeRulesBuilder({
  matchingCriteria,
  onChange,
  onPreview,
  disabled = false,
}) {
  const [criteria, setCriteria] = useState(matchingCriteria || {});
  const [cabAttributes, setCabAttributes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewCount, setPreviewCount] = useState(null);
  const [previewError, setPreviewError] = useState(null);

  useEffect(() => {
    loadCabAttributes();
  }, []);

  useEffect(() => {
    onChange(criteria);
  }, [criteria]);

  /**
   * Load available cab attribute types
   */
  const loadCabAttributes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/cab-attribute-types`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCabAttributes(data);
      }
    } catch (err) {
      console.error("Error loading cab attributes:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update static attribute criterion
   */
  const updateStaticAttribute = (attribute, value) => {
    const updated = { ...criteria };

    if (value === null || value === "") {
      delete updated[attribute];
    } else {
      if (attribute === "shareType") {
        updated.shareType = { value, negate: updated.shareType?.negate || false };
      } else if (attribute === "hasAirportLicense") {
        updated.hasAirportLicense = value === "true" ? true : value === "false" ? false : null;
      } else if (attribute === "cabShiftType") {
        updated.cabShiftType = { value, negate: updated.cabShiftType?.negate || false };
      } else if (attribute === "cabType") {
        updated.cabType = { value, negate: updated.cabType?.negate || false };
      } else if (attribute === "status") {
        updated.status = { value, negate: updated.status?.negate || false };
      }
    }

    setCriteria(updated);
  };

  /**
   * Toggle negation for an attribute
   */
  const toggleNegate = (attribute) => {
    const updated = { ...criteria };

    if (attribute === "shareType" && updated.shareType) {
      updated.shareType.negate = !updated.shareType.negate;
    } else if (attribute === "cabShiftType" && updated.cabShiftType) {
      updated.cabShiftType.negate = !updated.cabShiftType.negate;
    } else if (attribute === "cabType" && updated.cabType) {
      updated.cabType.negate = !updated.cabType.negate;
    } else if (attribute === "status" && updated.status) {
      updated.status.negate = !updated.status.negate;
    }

    setCriteria(updated);
  };

  /**
   * Add dynamic attribute rule
   */
  const addDynamicAttribute = () => {
    const updated = { ...criteria };
    updated.dynamicAttributes = updated.dynamicAttributes || [];
    updated.dynamicAttributes.push({
      attributeTypeId: null,
      attributeCode: "",
      mustHave: true,
      expectedValue: null,
    });
    setCriteria(updated);
  };

  /**
   * Update dynamic attribute rule
   */
  const updateDynamicAttribute = (index, field, value) => {
    const updated = { ...criteria };
    updated.dynamicAttributes[index][field] = value;
    setCriteria(updated);
  };

  /**
   * Remove dynamic attribute rule
   */
  const removeDynamicAttribute = (index) => {
    const updated = { ...criteria };
    updated.dynamicAttributes.splice(index, 1);
    setCriteria(updated);
  };

  /**
   * Preview matching cabs
   */
  const handlePreview = async () => {
    try {
      setPreviewLoading(true);
      setPreviewError(null);

      const response = await fetch(
        `${API_BASE_URL}/expense-category-rules/preview-match`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ matchingCriteria: criteria }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPreviewCount(data.totalCount);
      } else {
        setPreviewError("Failed to preview matching cabs");
      }
    } catch (err) {
      console.error("Error previewing match:", err);
      setPreviewError("Error previewing match");
    } finally {
      setPreviewLoading(false);
    }
  };

  const shareTypeValue = criteria.shareType?.value || "";
  const hasAirportLicenseValue = criteria.hasAirportLicense === true ? "true" : criteria.hasAirportLicense === false ? "false" : "";
  const cabShiftTypeValue = criteria.cabShiftType?.value || "";
  const cabTypeValue = criteria.cabType?.value || "";
  const statusValue = criteria.status?.value || "";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Static Attributes Section */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography variant="h6" sx={{ mb: 0 }}>
              Attribute Matching Rules
            </Typography>
            <Chip label="Shift Level" size="small" />
          </Box>
          <Typography variant="caption" color="text.secondary">
            Rules match against individual shift attributes. A cab matches if ANY of its shifts match the criteria.
          </Typography>
        </Box>

        <Stack spacing={2}>
          {/* Share Type */}
          <Box>
            <FormControl fullWidth>
              <InputLabel>Shift Share Type</InputLabel>
              <Select
                value={shareTypeValue}
                label="Shift Share Type"
                onChange={(e) => updateStaticAttribute("shareType", e.target.value || null)}
                disabled={disabled}
              >
                <MenuItem value="">Any (Not specified)</MenuItem>
                <MenuItem value="VOTING_SHARE">Voting Share</MenuItem>
                <MenuItem value="NON_VOTING_SHARE">Non-Voting Share</MenuItem>
              </Select>
            </FormControl>
            {criteria.shareType && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={criteria.shareType.negate || false}
                    onChange={() => toggleNegate("shareType")}
                    disabled={disabled}
                  />
                }
                label="NOT (negate this criteria)"
                sx={{ mt: 1 }}
              />
            )}
          </Box>

          {/* Airport License */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              Shift Airport License
            </Typography>
            <RadioGroup
              row
              value={hasAirportLicenseValue}
              onChange={(e) => updateStaticAttribute("hasAirportLicense", e.target.value || null)}
            >
              <FormControlLabel value="" control={<Radio />} label="Any" />
              <FormControlLabel value="true" control={<Radio />} label="Yes" />
              <FormControlLabel value="false" control={<Radio />} label="No" />
            </RadioGroup>
          </Box>

          {/* Shift Type */}
          <FormControl fullWidth>
            <InputLabel>Shift Type (Schedule)</InputLabel>
            <Select
              value={cabShiftTypeValue}
              label="Shift Type (Schedule)"
              onChange={(e) => updateStaticAttribute("cabShiftType", e.target.value || null)}
              disabled={disabled}
            >
              <MenuItem value="">Any (Not specified)</MenuItem>
              <MenuItem value="SINGLE">Single Shift</MenuItem>
              <MenuItem value="DOUBLE">Double Shift</MenuItem>
            </Select>
          </FormControl>
          {criteria.cabShiftType && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={criteria.cabShiftType.negate || false}
                  onChange={() => toggleNegate("cabShiftType")}
                  disabled={disabled}
                />
              }
              label="NOT (negate this criteria)"
            />
          )}

          {/* Shift Cab Type */}
          <FormControl fullWidth>
            <InputLabel>Shift Cab Type</InputLabel>
            <Select
              value={cabTypeValue}
              label="Shift Cab Type"
              onChange={(e) => updateStaticAttribute("cabType", e.target.value || null)}
              disabled={disabled}
            >
              <MenuItem value="">Any (Not specified)</MenuItem>
              <MenuItem value="SEDAN">Sedan</MenuItem>
              <MenuItem value="HANDICAP_VAN">Handicap Van</MenuItem>
            </Select>
          </FormControl>
          {criteria.cabType && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={criteria.cabType.negate || false}
                  onChange={() => toggleNegate("cabType")}
                  disabled={disabled}
                />
              }
              label="NOT (negate this criteria)"
            />
          )}

          {/* Status */}
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusValue}
              label="Status"
              onChange={(e) => updateStaticAttribute("status", e.target.value || null)}
              disabled={disabled}
            >
              <MenuItem value="">Any (Not specified)</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
              <MenuItem value="RETIRED">Retired</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Dynamic Attributes Section */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6">Dynamic Attributes</Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={addDynamicAttribute}
            disabled={disabled || loading}
            size="small"
          >
            Add Attribute
          </Button>
        </Box>

        {criteria.dynamicAttributes && criteria.dynamicAttributes.length > 0 ? (
          <Stack spacing={2}>
            {criteria.dynamicAttributes.map((rule, index) => (
              <Box key={index} sx={{ p: 2, border: "1px solid #ddd", borderRadius: 1 }}>
                <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                  <FormControl sx={{ flex: 1 }}>
                    <InputLabel>Attribute Type</InputLabel>
                    <Select
                      value={rule.attributeTypeId || ""}
                      label="Attribute Type"
                      onChange={(e) => {
                        const attr = cabAttributes.find((a) => a.id === parseInt(e.target.value));
                        updateDynamicAttribute(index, "attributeTypeId", parseInt(e.target.value));
                        if (attr) {
                          updateDynamicAttribute(index, "attributeCode", attr.attributeCode);
                        }
                      }}
                      disabled={disabled}
                    >
                      {cabAttributes.map((attr) => (
                        <MenuItem key={attr.id} value={attr.id}>
                          {attr.attributeName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel>Requirement</InputLabel>
                    <Select
                      value={rule.mustHave !== null && rule.mustHave !== undefined ? (rule.mustHave ? "must" : "must-not") : ""}
                      label="Requirement"
                      onChange={(e) =>
                        updateDynamicAttribute(index, "mustHave", e.target.value === "must")
                      }
                      disabled={disabled}
                    >
                      <MenuItem value="must">Must Have</MenuItem>
                      <MenuItem value="must-not">Must Not Have</MenuItem>
                    </Select>
                  </FormControl>

                  <IconButton
                    onClick={() => removeDynamicAttribute(index)}
                    disabled={disabled}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>

                {rule.expectedValue && (
                  <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
                    Expected Value: {rule.expectedValue}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="textSecondary">
            No dynamic attributes configured. Click "Add Attribute" to add custom criteria.
          </Typography>
        )}
      </Paper>

      {/* Preview Section */}
      <Paper sx={{ p: 2, backgroundColor: "#f5f5f5" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6">Preview</Typography>
          <Button
            startIcon={previewLoading ? <CircularProgress size={20} /> : <PreviewIcon />}
            onClick={handlePreview}
            disabled={disabled || previewLoading}
            variant="outlined"
          >
            Preview Matching Cabs
          </Button>
        </Box>

        {previewError && <Alert severity="error">{previewError}</Alert>}

        {previewCount !== null && (
          <Box>
            <Chip
              label={`${previewCount} cabs match these criteria`}
              color={previewCount > 0 ? "success" : "warning"}
              variant="outlined"
            />
          </Box>
        )}

        {/* Display criteria chips */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Selected Criteria:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {shareTypeValue && (
              <Chip
                label={`Share Type: ${shareTypeValue.replace("_", " ")}${criteria.shareType?.negate ? " (NOT)" : ""}`}
                onDelete={() => updateStaticAttribute("shareType", null)}
                size="small"
              />
            )}
            {hasAirportLicenseValue && (
              <Chip
                label={`Airport License: ${hasAirportLicenseValue === "true" ? "Yes" : "No"}`}
                onDelete={() => updateStaticAttribute("hasAirportLicense", null)}
                size="small"
              />
            )}
            {cabShiftTypeValue && (
              <Chip
                label={`Shift Type: ${cabShiftTypeValue}${criteria.cabShiftType?.negate ? " (NOT)" : ""}`}
                onDelete={() => updateStaticAttribute("cabShiftType", null)}
                size="small"
              />
            )}
            {cabTypeValue && (
              <Chip
                label={`Cab Type: ${cabTypeValue.replace("_", " ")}${criteria.cabType?.negate ? " (NOT)" : ""}`}
                onDelete={() => updateStaticAttribute("cabType", null)}
                size="small"
              />
            )}
            {statusValue && (
              <Chip
                label={`Status: ${statusValue}${criteria.status?.negate ? " (NOT)" : ""}`}
                onDelete={() => updateStaticAttribute("status", null)}
                size="small"
              />
            )}
            {criteria.dynamicAttributes && criteria.dynamicAttributes.length > 0 && (
              <Chip
                label={`+${criteria.dynamicAttributes.length} custom attribute(s)`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
