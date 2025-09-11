import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { 
  People, 
  Work, 
  CheckCircle, 
  Delete, 
  Edit, 
  PersonAdd 
} from '@mui/icons-material';
import { User } from '../../types';
import { userAPI, projectAPI } from '../../services/api';

export const SuperuserDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersResponse, projectsResponse] = await Promise.all([
        userAPI.getAll(),
        projectAPI.getAll()
      ]);
      setUsers(usersResponse.data);
      setProjects(projectsResponse.data);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateUser = async (userId: number) => {
    try {
      await userAPI.validateUser(userId);
      await loadData();
      setError(''); // Clear any previous errors
    } catch (err: any) {
      console.error('Failed to validate user:', err);
      setError(`Failed to validate user: ${err.response?.data?.msg || err.message}`);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser) return;
    
    try {
      await userAPI.assignRole(selectedUser.id, newRole);
      setRoleDialogOpen(false);
      setSelectedUser(null);
      setNewRole('');
      await loadData();
      setError(''); // Clear any previous errors
    } catch (err: any) {
      console.error('Failed to assign role:', err);
      setError(`Failed to assign role: ${err.response?.data?.msg || err.message}`);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userAPI.deleteUser(userId);
        await loadData();
        setError(''); // Clear any previous errors
      } catch (err: any) {
        console.error('Failed to delete user:', err);
        setError(`Failed to delete user: ${err.response?.data?.msg || err.message}`);
      }
    }
  };

  const userColumns: GridColDef[] = [
    { 
      field: 'id', 
      headerName: 'ID', 
      width: 100,
      renderCell: (params) => params.value?.substring(0, 8) || params.value
    },
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'email', headerName: 'Email', width: 250 },
    { field: 'role', headerName: 'Role', width: 120 },
    { 
      field: 'is_active', 
      headerName: 'Validated', 
      width: 120,
      renderCell: (params) => (
        params.value ? '✓' : '✗'
      )
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 200,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<CheckCircle />}
          label="Validate"
          onClick={() => handleValidateUser(params.row.id)}
          disabled={params.row.is_active}
          key="validate"
        />,
        <GridActionsCellItem
          icon={<Edit />}
          label="Assign Role"
          onClick={() => {
            setSelectedUser(params.row);
            setNewRole(params.row.role);
            setRoleDialogOpen(true);
          }}
          key="edit"
        />,
        <GridActionsCellItem
          icon={<Delete />}
          label="Delete"
          onClick={() => handleDeleteUser(params.row.id)}
          key="delete"
        />,
      ],
    },
  ];

  const stats = {
    totalUsers: users.length,
    totalProjects: projects.length,
    validatedUsers: users.filter(u => u.is_active).length,
    pendingUsers: users.filter(u => !u.is_active).length,
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Superuser Dashboard
      </Typography>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }} 
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <People color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{stats.totalUsers}</Typography>
                  <Typography color="textSecondary">Total Users</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
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
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircle color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{stats.validatedUsers}</Typography>
                  <Typography color="textSecondary">Validated Users</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PersonAdd color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{stats.pendingUsers}</Typography>
                  <Typography color="textSecondary">Pending Users</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            User Management
          </Typography>
          <DataGrid
            rows={users}
            columns={userColumns}
            loading={loading}
            autoHeight
            disableRowSelectionOnClick
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            getRowId={(row) => row.id}
          />
        </CardContent>
      </Card>

      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)}>
        <DialogTitle>Assign Role</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              label="Role"
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="superuser">Superuser</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAssignRole} variant="contained">
            Assign Role
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};