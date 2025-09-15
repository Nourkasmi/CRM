import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { 
  Add, 
  Visibility, 
  Edit, 
  Delete,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Project } from '../../types';
import { projectAPI } from '../../services/api';

interface ProjectFormData {
  name: string;
  description: string;
  deadline: string;
}

export const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    deadline: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectAPI.getAll();
      setProjects(response.data);
      setError('');
    } catch (err: any) {
      console.error('Failed to load projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (project: Project) => {
    navigate(`/projects/${project.id}`);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (project: Project) => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      try {
        await projectAPI.delete(project.id);
        setSnackbar({
          open: true,
          message: 'Project deleted successfully',
          severity: 'success',
        });
        await loadProjects();
      } catch (err: any) {
        console.error('Failed to delete project:', err);
        setSnackbar({
          open: true,
          message: err.response?.data?.msg || 'Failed to delete project',
          severity: 'error',
        });
      }
    }
  };

  const handleCreateNew = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      deadline: '',
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      deadline: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setSnackbar({
        open: true,
        message: 'Project name is required',
        severity: 'error',
      });
      return;
    }

    setSubmitting(true);
    
    try {
      const projectData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        deadline: formData.deadline || undefined,
      };

      if (editingProject) {
        // Update existing project
        await projectAPI.update(editingProject.id, projectData);
        setSnackbar({
          open: true,
          message: 'Project updated successfully',
          severity: 'success',
        });
      } else {
        // Create new project
        await projectAPI.create(projectData);
        setSnackbar({
          open: true,
          message: 'Project created successfully',
          severity: 'success',
        });
      }
      
      handleCloseDialog();
      await loadProjects();
    } catch (err: any) {
      console.error('Failed to save project:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.msg || `Failed to ${editingProject ? 'update' : 'create'} project`,
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormChange = (field: keyof ProjectFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'primary';
      case 'on_hold': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const canModify = user?.role === 'superuser' || user?.role === 'manager';

  const columns: GridColDef[] = [
    { 
      field: 'name', 
      headerName: 'Name', 
      width: 250, 
      flex: 1,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium">
          {params.value}
        </Typography>
      ),
    },
    { 
      field: 'description', 
      headerName: 'Description', 
      width: 300, 
      flex: 2,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || 'No description'}
        </Typography>
      ),
    },
    { 
      field: 'created_at', 
      headerName: 'Created', 
      width: 120,
      valueFormatter: (value) => new Date(value).toLocaleDateString()
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 150,
      getActions: (params) => {
        const actions = [
          <GridActionsCellItem
            icon={<Visibility />}
            label="View"
            onClick={() => handleView(params.row)}
            color="primary"
          />
        ];

        if (canModify) {
          actions.push(
            <GridActionsCellItem
              icon={<Edit />}
              label="Edit"
              onClick={() => handleEdit(params.row)}
              color="primary"
            />,
            <GridActionsCellItem
              icon={<Delete />}
              label="Delete"
              onClick={() => handleDelete(params.row)}
              color="error"
            />
          );
        }

        return actions;
      },
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Projects</Typography>
        {canModify && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateNew}
            size="large"
          >
            New Project
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent>
          <DataGrid
            rows={projects}
            columns={columns}
            loading={loading}
            autoHeight
            disableRowSelectionOnClick
            pageSizeOptions={[5, 10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            sx={{
              '& .MuiDataGrid-cell:hover': {
                color: 'primary.main',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Project Create/Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          component: 'form',
          onSubmit: handleSubmit,
        }}
      >
        <DialogTitle>
          {editingProject ? 'Edit Project' : 'Create New Project'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Project Name"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              required
              disabled={submitting}
              helperText="Enter a descriptive name for your project"
            />
            <TextField
              margin="dense"
              name="description"
              label="Description"
              type="text"
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              disabled={submitting}
              helperText="Provide details about the project goals and scope"
            />
            <TextField
              margin="dense"
              name="deadline"
              label="Deadline (Optional)"
              type="date"
              fullWidth
              variant="outlined"
              value={formData.deadline}
              onChange={(e) => handleFormChange('deadline', e.target.value)}
              disabled={submitting}
              InputLabelProps={{
                shrink: true,
              }}
              helperText="Set a target completion date for the project"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCloseDialog}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            variant="contained"
            disabled={submitting || !formData.name.trim()}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting 
              ? (editingProject ? 'Updating...' : 'Creating...') 
              : (editingProject ? 'Update Project' : 'Create Project')
            }
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};