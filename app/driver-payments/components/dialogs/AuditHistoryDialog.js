"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Paper,
} from "@mui/material";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from "@mui/lab";
import {
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import { formatDate } from "../../utils/helpers";

export default function AuditHistoryDialog({
  open,
  onClose,
  statement,
  onFetchHistory,
  isLoading,
}) {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (open && statement) {
      const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
          const data = await onFetchHistory(statement.id);
          setHistory(data || []);
        } catch (error) {
          console.error("Error loading history:", error);
          setHistory([]);
        } finally {
          setLoadingHistory(false);
        }
      };
      fetchHistory();
    }
  }, [open, statement, onFetchHistory]);

  if (!statement) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        Statement Audit History
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box>
            <Typography variant="caption" color="textSecondary">
              Statement ID
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {statement.id}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="textSecondary">
              Person
            </Typography>
            <Typography variant="body2">
              {statement.personName || statement.personId}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Activity Timeline
            </Typography>

            {loadingHistory ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : history.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  textAlign: "center",
                  backgroundColor: "#f5f5f5",
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" color="textSecondary">
                  No history available
                </Typography>
              </Paper>
            ) : (
              <Timeline position="left">
                {history.map((entry, index) => (
                  <TimelineItem key={index}>
                    <TimelineSeparator>
                      <TimelineDot
                        sx={{
                          backgroundColor:
                            entry.action === "CREATED"
                              ? "#4caf50"
                              : entry.action === "FINALIZED"
                              ? "#2196f3"
                              : entry.action === "PAID"
                              ? "#4caf50"
                              : entry.action === "RECALLED"
                              ? "#ff9800"
                              : "#9e9e9e",
                        }}
                      >
                        {entry.action === "CREATED" || entry.action === "PAID" ? (
                          <CheckCircleIcon sx={{ fontSize: 20, color: "#fff" }} />
                        ) : entry.action === "RECALLED" ? (
                          <EditIcon sx={{ fontSize: 20, color: "#fff" }} />
                        ) : (
                          <HistoryIcon sx={{ fontSize: 20, color: "#fff" }} />
                        )}
                      </TimelineDot>
                      {index < history.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {entry.action}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatDate(entry.timestamp || entry.createdAt)}
                      </Typography>
                      {entry.reason && (
                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                          {entry.reason}
                        </Typography>
                      )}
                      {entry.notes && (
                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                          {entry.notes}
                        </Typography>
                      )}
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
