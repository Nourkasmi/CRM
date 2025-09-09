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
import { 
  Add, 
  MoreVert, 
  Edit, 
  Delete,
  CalendarToday 
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { Phase } from '../../types';
import { phaseAPI } from '../../services/api';

interface PhaseListProps {
  projectId: number;
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
    status: 'planning',
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
      const phaseData = {
        ...formData,
        project_id: projectId,
      };

      if (editingPhase) {
        await phaseAPI.update(editingPhase.id, phaseData);
      } else {
        await phaseAPI.create(phaseData);
      }

      await loadPhases();
      handleCloseDialog();
    } catch (err) {
      setError(editingPhase ? 'Failed to update phase' : 'Failed to create phase');
    }
  };

  const handleDelete = async (phaseId: number) => {
    if (window.confirm('Are you sure you want to delete this phase?')) {
      try {
        await phaseAPI.delete(phaseId);
        await loadPhases();
      } catch (err) {
        setError('Failed to delete phase');
      }
    }
    setAnchorEl(null);
  };

  const handleOpenDialog = (phase?: Phase) => {
    if (phase) {
      setEditingPhase(phase);
      setFormData({
        name: phase.name,
        description: phase.description,
        status: phase.status,
        start_date: phase.start_date || '',
        end_date: phase.end_date || '',
      });
    } else {
      setEditingPhase(null);
      setFormData({
        name: '',
        description: '',
        status: 'planning',
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'default';
      case 'in_progress': return 'warning';
      case 'completed': return 'success';
      case 'on_hold': return 'error';
      default: return 'default';
    }
  };

  const canModify = user?.role === 'superuser' || user?.role === 'manager';

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Project Phases</Typography>
        {canModify && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
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
                  <Typography variant="h6" component="div">
                    {phase.name}
                  </Typography>
                  {canModify && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, phase)}
                    >
                      <MoreVert />
                    </IconButton>
                  )}
                </Box>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  {phase.description}
                </Typography>
                
                <Box mb={2}>
                  <Chip 
                    label={phase.status.replace('_', ' ')} 
                    color={getStatusColor(phase.status) as any}
                    size="small"
                  />
                </Box>
                
                {(phase.start_date || phase.end_date) && (
                  <Box display="flex" alignItems="center" color="text.secondary">
                    <CalendarToday fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {phase.start_date && new Date(phase.start_date).toLocaleDateString()}
                      {phase.start_date && phase.end_date && ' - '}
                      {phase.end_date && new Date(phase.end_date).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
        
        {phases.length === 0 && !loading && (
          <Grid item xs={12}>
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                No phases found. {canModify && 'Create your first phase to get started.'}
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedPhase) handleOpenDialog(selectedPhase);
          handleMenuClose();
        }}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedPhase) handleDelete(selectedPhase.id);
        }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingPhase ? 'Edit Phase' : 'Add New Phase'}
          </DialogTitle>
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
            <TextField
              margin="dense"
              name="description"
              label="Description"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <TextField
              margin="dense"
              name="start_date"
              label="Start Date"
              type="date"
              fullWidth
              variant="outlined"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              margin="dense"
              name="end_date"
              label="End Date"
              type="date"
              fullWidth
              variant="outlined"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
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