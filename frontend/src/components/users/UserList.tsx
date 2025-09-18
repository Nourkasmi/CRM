import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  LinearProgress,
} from "@mui/material";
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import {
  CheckCircle,
  People,
  PersonAdd,
  ManageAccounts,
  Delete,
  Verified,
} from "@mui/icons-material";
import { userAPI } from "../../services/api";

// shape we’ll render in the grid (robustly mapped from backend)
type RowUser = {
  id: string;
  username: string;
  email: string;
  role: "user" | "manager" | "superuser";
  is_validated: boolean;
};

export const UserList: React.FC = () => {
  const [rows, setRows] = useState<RowUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; type: "success" | "error" }>({
    open: false,
    msg: "",
    type: "success",
  });

  // assign-role dialog
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<RowUser | null>(null);
  const [newRole, setNewRole] = useState<"user" | "manager" | "superuser" | "">("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await userAPI.getAll();
      const mapped: RowUser[] = (res.data || []).map((u: any) => ({
        id: String(u.id ?? u._id),
        username:
          u.name ??
          u.username ??
          (typeof u.email === "string" ? u.email.split("@")[0] : "user"),
        email: u.email ?? "",
        role: (u.role ?? "user") as RowUser["role"],
        is_validated: Boolean(u.is_active ?? u.is_validated ?? u.validated),
      }));
      setRows(mapped);
    } catch (e) {
      setSnack({ open: true, msg: "Failed to load users", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // KPIs
  const stats = useMemo(() => {
    const total = rows.length;
    const validated = rows.filter((r) => r.is_validated).length;
    const pending = total - validated;
    const managers = rows.filter((r) => r.role === "manager").length;
    const regular = rows.filter((r) => r.role === "user").length;
    const supers = rows.filter((r) => r.role === "superuser").length;
    return { total, validated, pending, managers, regular, supers };
  }, [rows]);

  // actions
  const validateUser = async (id: string) => {
    try {
      const res = await userAPI.validateUser(id);
      setSnack({ open: true, msg: res.data?.msg ?? "User validated", type: "success" });
      await loadUsers();
    } catch (e: any) {
      setSnack({
        open: true,
        msg: e?.response?.data?.msg ?? "Failed to validate user",
        type: "error",
      });
    }
  };

  const openAssignRole = (user: RowUser) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleDialogOpen(true);
  };

  const confirmAssignRole = async () => {
    if (!selectedUser || !newRole) return;
    try {
      const res = await userAPI.assignRole(selectedUser.id, newRole);
      setSnack({ open: true, msg: res.data?.msg ?? "Role updated", type: "success" });
      setRoleDialogOpen(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (e: any) {
      setSnack({
        open: true,
        msg: e?.response?.data?.msg ?? "Failed to assign role",
        type: "error",
      });
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    try {
      await userAPI.deleteUser(id);
      setSnack({ open: true, msg: "User deleted", type: "success" });
      await loadUsers();
    } catch (e: any) {
      setSnack({
        open: true,
        msg: e?.response?.data?.msg ?? "Failed to delete user",
        type: "error",
      });
    }
  };

  const columns: GridColDef[] = [
    {
      field: "username",
      headerName: "Username",
      flex: 1,
      minWidth: 150,
      renderCell: (p) => <Typography fontWeight={500}>{p.value}</Typography>,
    },
    { field: "email", headerName: "Email", flex: 1.4, minWidth: 220 },
    {
      field: "role",
      headerName: "Role",
      minWidth: 130,
      renderCell: (p) => {
        const color =
          p.value === "superuser" ? "error" : p.value === "manager" ? "warning" : "primary";
        return <Chip label={p.value} color={color as any} size="small" sx={{ textTransform: "capitalize" }} />;
      },
    },
    {
      field: "is_validated",
      headerName: "Validated",
      minWidth: 130,
      renderCell: (p) =>
        p.value ? (
          <Chip size="small" icon={<Verified />} label="Validated" color="success" />
        ) : (
          <Chip size="small" label="Pending" />
        ),
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      getActions: (params) => {
        const u = params.row as RowUser;
        return [
          <GridActionsCellItem
            icon={<CheckCircle color="success" />}
            label="Validate"
            onClick={() => validateUser(u.id)}
            disabled={u.is_validated}
            showInMenu
          />,
          <GridActionsCellItem
            icon={<ManageAccounts color="primary" />}
            label="Assign role"
            onClick={() => openAssignRole(u)}
            showInMenu
          />,
          <GridActionsCellItem
            icon={<Delete color="error" />}
            label="Delete"
            onClick={() => deleteUser(u.id)}
            showInMenu
          />,
        ];
      },
      minWidth: 90,
    },
  ];

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Users
      </Typography>

      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <People color="primary" />
              <Box>
                <Typography variant="h6">{stats.total}</Typography>
                <Typography color="text.secondary">Total Users</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CheckCircle color="success" />
              <Box>
                <Typography variant="h6">{stats.validated}</Typography>
                <Typography color="text.secondary">Validated</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PersonAdd color="warning" />
              <Box>
                <Typography variant="h6">{stats.pending}</Typography>
                <Typography color="text.secondary">Pending</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ManageAccounts color="secondary" />
              <Box>
                <Typography variant="h6">
                  {stats.managers} mgr · {stats.supers} super · {stats.regular} user
                </Typography>
                <Typography color="text.secondary">Roles</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Table */}
      <Card>
        {loading && <LinearProgress />}
        <CardContent>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            autoHeight
            disableRowSelectionOnClick
            pageSizeOptions={[5, 10, 25]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            sx={{
              "& .MuiDataGrid-row:hover": { backgroundColor: "action.hover" },
            }}
          />
        </CardContent>
      </Card>

      {/* Assign Role dialog */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Assign Role</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedUser ? `${selectedUser.username} (${selectedUser.email})` : ""}
          </Typography>
          <FormControl fullWidth>
            <InputLabel id="role-label">Role</InputLabel>
            <Select
              labelId="role-label"
              label="Role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as any)}
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
            onClick={confirmAssignRole}
            variant="contained"
            disabled={!selectedUser || !newRole || newRole === selectedUser?.role}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snack.type}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{ width: "100%" }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};
