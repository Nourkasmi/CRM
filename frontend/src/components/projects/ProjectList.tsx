import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { 
  Add, 
  Visibility, 
  Edit, 
  Delete, 
  Archive 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Project } from '../../types';
import { projectAPI } from '../../services/api';

export const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectAPI.getAll();
      setProjects(response.data);
    } catch (err) {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await projectAPI.delete(id);
        await loadProjects();
      } catch (err) {
        setError('Failed to delete project');
      }
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await projectAPI.archive(id);
      await loadProjects();
    } catch (err) {
      setError('Failed to archive project');
    }
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
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', width: 200, flex: 1 },
    { field: 'description', headerName: 'Description', width: 300, flex: 1 },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={getStatusColor(params.value) as any}
          size="small"
        />
      )
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
            onClick={() => navigate(`/projects/${params.row.id}`)}
          />
        ];

        if (canModify) {
          actions.push(
            <GridActionsCellItem
              icon={<Edit />}
              label="Edit"
              onClick={() => navigate(`/projects/${params.row.id}/edit`)}
            />,
            <GridActionsCellItem
              icon={<Archive />}
              label="Archive"
              onClick={() => handleArchive(params.row.id)}
            />,
            <GridActionsCellItem
              icon={<Delete />}
              label="Delete"
              onClick={() => handleDelete(params.row.id)}
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
            onClick={() => navigate('/projects/new')}
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
            }}
          />
        </CardContent>
      </Card>
    </Box>
  );
};