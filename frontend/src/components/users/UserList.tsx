import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
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
import {
  CheckCircle,
  People,
  PersonAdd,
  ManageAccounts,
} from "@mui/icons-material";
import { userAPI } from "../../services/api";
import DataTableBasic from "../common/DataTableBasic";

// shape we’ll render in the table
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

  // ✅ Prepare rows for DataTables
  const dtRows = rows.map((u) => [
    u.username,
    u.email,
    `<span class="badge ${u.role === "superuser"
      ? "bg-danger"
      : u.role === "manager"
      ? "bg-warning text-dark"
      : "bg-primary"}">${u.role}</span>`,
    u.is_validated
      ? `<span class="badge bg-success">Validated</span>`
      : `<span class="badge bg-secondary">Pending</span>`,
    `
      <button class="btn btn-sm btn-outline-success" onclick="window.validateUser('${u.id}')">Validate</button>
      <button class="btn btn-sm btn-outline-primary" onclick="window.openAssignRole('${u.id}')">Role</button>
      <button class="btn btn-sm btn-outline-danger" onclick="window.deleteUser('${u.id}')">Delete</button>
    `,
  ]);

  // ✅ Expose handlers globally so DataTables buttons can call them
  useEffect(() => {
    (window as any).validateUser = validateUser;
    (window as any).openAssignRole = (id: string) => {
      const user = rows.find((r) => r.id === id);
      if (user) openAssignRole(user);
    };
    (window as any).deleteUser = deleteUser;
  }, [rows]);

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Users
      </Typography>

      {/* ✅ KPI Cards same style as SuperuserDashboard */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 4,
          overflowX: "auto",
          pb: 1,
          "&::-webkit-scrollbar": { height: 6 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#cbd5e1",
            borderRadius: 3,
          },
        }}
      >
        {[
          { title: "Total Users", value: stats.total, icon: People, color: "#1976d2" },
          { title: "Validated", value: stats.validated, icon: CheckCircle, color: "#2e7d32" },
          { title: "Pending", value: stats.pending, icon: PersonAdd, color: "#f57c00" },
          {
            title: "Roles",
            value: `${stats.managers} mgr · ${stats.supers} super · ${stats.regular} user`,
            icon: ManageAccounts,
            color: "#0097a7",
          },
        ].map((kpi, index) => (
          <Card
            key={index}
            sx={{
              minWidth: 200,
              flex: "0 0 auto",
              borderRadius: 3,
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
              },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ color: kpi.color, fontWeight: 700, mb: 0.5 }}>
                    {kpi.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {kpi.title}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: `${kpi.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <kpi.icon sx={{ fontSize: 28, color: kpi.color }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Table */}
      <Card>
        {loading && <LinearProgress />}
        <CardContent>
          <DataTableBasic
            data={dtRows}
            columns={["Username", "Email", "Role", "Validated", "Actions"]}
            options={{
              dom: "Bfrtip",
              buttons: ["copy", "csv", "excel", "pdf", "print"],
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
