import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { Add, MoreVert, Edit, Delete, CalendarToday } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { Phase } from '../../types';
import { phaseAPI } from '../../services/api';

interface PhaseListProps {
  projectId: string;
}

export const PhaseList: React.FC<PhaseListProps> = ({ projectId }) => {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    start_date: '',
    end_date: '',
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadPhases();
  }, [projectId]);

  const loadPhases = async () => {
    try {
      const response = await phaseAPI.getByProject(projectId);
      setPhases(response.data);
    } catch (err) {
      setError('Failed to load phases');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const phaseData = { ...formData, project_id: projectId };
      if (editingPhase) {
        await phaseAPI.update(editingPhase.id, phaseData);
      } else {
        await phaseAPI.create(projectId, phaseData);
      }
      await loadPhases();
      handleCloseDialog();
    } catch {
      setError(editingPhase ? 'Failed to update phase' : 'Failed to create phase');
    }
  };

  const handleDelete = async (phaseId: string) => {
    if (window.confirm('Are you sure you want to delete this phase?')) {
      try {
        await phaseAPI.delete(phaseId);
        await loadPhases();
      } catch {
        setError('Failed to delete phase');
      }
    }
    setAnchorEl(null);
  };

  const handleComplete = async (phaseId: string) => {
    try {
      await phaseAPI.complete(phaseId);
      await loadPhases();
    } catch {
      setError('Failed to mark phase as completed');
    }
    setAnchorEl(null);
  };

  const handleOpenDialog = (phase?: Phase) => {
    if (phase) {
      setEditingPhase(phase);
      setFormData({
        name: phase.name,
        description: '',
        status: phase.status,
        start_date: '',
        end_date: '',
      });
    } else {
      setEditingPhase(null);
      setFormData({
        name: '',
        description: '',
        status: 'active',
        start_date: '',
        end_date: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPhase(null);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, phase: Phase) => {
    setAnchorEl(event.currentTarget);
    setSelectedPhase(phase);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPhase(null);
  };

  const canModify = user?.role === 'superuser' || user?.role === 'manager';

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Project Phases</Typography>
        {canModify && (
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            Add Phase
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {phases.map((phase) => (
          <Grid item xs={12} md={6} lg={4} key={phase.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6">{phase.name}</Typography>
                  {canModify && (
                    <IconButton size="small" onClick={(e) => handleMenuClick(e, phase)}>
                      <MoreVert />
                    </IconButton>
                  )}
                </Box>

                <Box mb={2}>
                  <Chip
                    label={phase.status}
                    color={phase.status === 'completed' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>

                {phase.deadline && (
                  <Box display="flex" alignItems="center" color="text.secondary">
                    <CalendarToday fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {new Date(phase.deadline).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            if (selectedPhase) handleOpenDialog(selectedPhase);
            handleMenuClose();
          }}
        >
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedPhase) handleDelete(selectedPhase.id);
          }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
        {selectedPhase?.status !== 'completed' && (
          <MenuItem
            onClick={() => {
              if (selectedPhase) handleComplete(selectedPhase.id);
            }}
          >
            ✅ Mark as Completed
          </MenuItem>
        )}
      </Menu>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingPhase ? 'Edit Phase' : 'Add New Phase'}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Phase Name"
              fullWidth
              variant="outlined"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingPhase ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
