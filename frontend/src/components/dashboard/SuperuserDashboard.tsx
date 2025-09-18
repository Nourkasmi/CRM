import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { People, Work, CheckCircle, PersonAdd } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Project } from '../../types';
import { projectAPI } from '../../services/api';

export const SuperuserDashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [projectFormData, setProjectFormData] = useState({
    name: '',
    description: '',
    deadline: '',
  });
  const [editingProject, setEditingProject] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const projectsResponse = await projectAPI.getAll();
      setProjects(projectsResponse.data);
    } catch (err) {
      console.error('❌ Failed to load data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setProjectFormData({
      name: project.name,
      description: project.description || '',
      deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
    });
    setEditingProject(true);
    setProjectDialogOpen(true);
  };

  const handleCreateProject = () => {
    setSelectedProject(null);
    setProjectFormData({
      name: '',
      description: '',
      deadline: '',
    });
    setEditingProject(false);
    setProjectDialogOpen(true);
  };

  const handleProjectSubmit = async () => {
    try {
      const projectData = {
        name: projectFormData.name.trim(),
        description: projectFormData.description.trim(),
        deadline: projectFormData.deadline || undefined,
      };

      if (editingProject && selectedProject) {
        await projectAPI.update(selectedProject.id, projectData);
        setSnackbar({ open: true, message: 'Project updated successfully', severity: 'success' });
      } else {
        await projectAPI.create(projectData);
        setSnackbar({ open: true, message: 'Project created successfully', severity: 'success' });
      }

      setProjectDialogOpen(false);
      await loadData();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.msg || `Failed to ${editingProject ? 'update' : 'create'} project`,
        severity: 'error',
      });
    }
  };

  const projectColumns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Project Name',
      width: 200,
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
      width: 250,
      flex: 2,
      renderCell: (params) => (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {params.value || 'No description'}
        </Typography>
      ),
    },
    {
      field: 'created_by',
      headerName: 'Created By',
      width: 180,
      renderCell: (params) => {
        if (!params.value) return 'Unknown';
        if (typeof params.value === 'string') return params.value; // fallback id
        return params.value.email || params.value.name || 'Unknown';
      },
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 110,
      valueFormatter: (value) => new Date(value as string).toLocaleDateString(),
    },
    {
      field: 'deadline',
      headerName: 'Deadline',
      width: 110,
      renderCell: (params) => (
        <Typography variant="body2" color={params.value ? 'text.primary' : 'text.secondary'}>
          {params.value ? new Date(params.value).toLocaleDateString() : 'No deadline'}
        </Typography>
      ),
    },
    {
      field: 'is_archived',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Typography
          variant="body2"
          color={params.value ? 'text.secondary' : 'success.main'}
          fontWeight="medium"
        >
          {params.value ? 'Archived' : 'Active'}
        </Typography>
      ),
    },
  ];

  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => !p.is_archived).length,
    archivedProjects: projects.filter((p) => p.is_archived).length,
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Superuser Dashboard
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Work color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{stats.totalProjects}</Typography>
                  <Typography color="textSecondary">Total Projects</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircle color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{stats.activeProjects}</Typography>
                  <Typography color="textSecondary">Active Projects</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PersonAdd color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{stats.archivedProjects}</Typography>
                  <Typography color="textSecondary">Archived Projects</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Projects DataGrid */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Project Management
          </Typography>
          <DataGrid
            rows={projects}
            columns={projectColumns}
            loading={loading}
            autoHeight
            disableRowSelectionOnClick
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            sx={{
              '& .MuiDataGrid-cell:hover': { color: 'primary.main' },
              '& .MuiDataGrid-row:hover': { backgroundColor: 'action.hover' },
            }}
          />
        </CardContent>
      </Card>

      {/* Project Create/Edit Dialog */}
      <Dialog open={projectDialogOpen} onClose={() => setProjectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingProject ? 'Edit Project' : 'Create New Project'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Project Name"
            type="text"
            fullWidth
            variant="outlined"
            value={projectFormData.name}
            onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
            required
            sx={{ mb: 2 }}
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
            value={projectFormData.description}
            onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="deadline"
            label="Deadline (Optional)"
            type="date"
            fullWidth
            variant="outlined"
            value={projectFormData.deadline}
            onChange={(e) => setProjectFormData({ ...projectFormData, deadline: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProjectDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleProjectSubmit} variant="contained" disabled={!projectFormData.name.trim()}>
            {editingProject ? 'Update Project' : 'Create Project'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
