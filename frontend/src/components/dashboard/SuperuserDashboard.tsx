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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import {
  People,
  Work,
  CheckCircle,
  Delete,
  Edit,
  PersonAdd,
} from '@mui/icons-material';
import { User } from '../../types';
import { userAPI, projectAPI } from '../../services/api';

export const SuperuserDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log('🔄 Loading user data...');
    try {
      const [usersResponse, projectsResponse] = await Promise.all([
        userAPI.getAll(),
        projectAPI.getAll(),
      ]);

      console.log('📊 Raw users data:', usersResponse.data);

      const mappedUsers = usersResponse.data.map((u: any) => ({
        id: u.id,
        username: u.name,
        email: u.email,
        role: u.role,
        is_validated: u.is_active,
      }));

      console.log('📊 Mapped users:', mappedUsers);
      setUsers(mappedUsers);
      setProjects(projectsResponse.data);
    } catch (err) {
      console.error('❌ Failed to load data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateUser = async (userId: string) => {
    try {
      const res = await userAPI.validateUser(userId);
      setSnackbar({ open: true, message: res.data.msg, severity: 'success' });
      // ✅ Refresh data after validation
      await loadData();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.msg || 'Failed to validate user',
        severity: 'error',
      });
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser) return;
    
    console.log(`🔄 Assigning role "${newRole}" to user ${selectedUser.id}`);
    
    try {
      const response = await userAPI.assignRole(selectedUser.id, newRole);
      console.log('✅ Role assignment response:', response.data);
      
      setSnackbar({
        open: true,
        message: response.data.msg || `Role updated to ${newRole}`,
        severity: 'success',
      });
      
      // ✅ Close dialog first
      setRoleDialogOpen(false);
      setSelectedUser(null);
      setNewRole('');
      
      // ✅ Force reload data to show updated roles
      console.log('🔄 Reloading data after role assignment...');
      await loadData();
      
    } catch (err: any) {
      console.error('❌ Role assignment failed:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.msg || 'Failed to assign role',
        severity: 'error',
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userAPI.deleteUser(userId);
        setSnackbar({
          open: true,
          message: 'User deleted successfully',
          severity: 'success',
        });
        // ✅ Refresh data after deletion
        await loadData();
      } catch (err) {
        setSnackbar({
          open: true,
          message: 'Failed to delete user',
          severity: 'error',
        });
      }
    }
  };

  const userColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 200 },
    { field: 'username', headerName: 'Username', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'role', headerName: 'Role', width: 120 },
    {
      field: 'is_validated',
      headerName: 'Validated',
      width: 120,
      renderCell: (params) => (params.value ? '✓' : '✗'),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 180,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<CheckCircle />}
          label="Validate"
          onClick={() => handleValidateUser(params.row.id)}
          disabled={params.row.is_validated}
        />,
        <GridActionsCellItem
          icon={<Edit />}
          label="Assign Role"
          onClick={() => {
            console.log('🔧 Opening role dialog for user:', params.row);
            setSelectedUser(params.row);
            setNewRole(params.row.role);
            setRoleDialogOpen(true);
          }}
        />,
        <GridActionsCellItem
          icon={<Delete />}
          label="Delete"
          onClick={() => handleDeleteUser(params.row.id)}
        />,
      ],
    },
  ];

  const stats = {
    totalUsers: users.length,
    totalProjects: projects.length,
    validatedUsers: users.filter((u) => u.is_validated).length,
    pendingUsers: users.filter((u) => !u.is_validated).length,
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Superuser Dashboard
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
          />
        </CardContent>
      </Card>

      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)}>
        <DialogTitle>Assign Role</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                User: {selectedUser.username} ({selectedUser.email})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current Role: {selectedUser.role}
              </Typography>
            </Box>
          )}
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
          <Button 
            onClick={handleAssignRole} 
            variant="contained"
            disabled={!newRole || newRole === selectedUser?.role}
          >
            Assign Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
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