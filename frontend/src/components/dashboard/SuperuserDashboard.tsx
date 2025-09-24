import React, { useState, useEffect } from "react";
import DataTableBasic from "../common/DataTableBasic";
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
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  Tabs,
  Tab,
} from "@mui/material";
import {
  People,
  Work,
  CheckCircle,
  PersonAdd,
  Archive,
  Folder,
  Schedule,
  Assessment,
  InsertChart,
  Timeline,
  AssignmentTurnedIn,
  UploadFile,
} from "@mui/icons-material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Project, User, ProjectFile, FileType, Task, Phase } from "../../types";
import { projectAPI, userAPI, fileAPI, fileTypeAPI, taskAPI, phaseAPI } from "../../services/api";

const COLORS = ["#1976d2", "#2e7d32", "#f57c00", "#d32f2f", "#0097a7"];

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const SuperuserDashboard: React.FC = () => {
  const theme = useTheme();

  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [fileTypes, setFileTypes] = useState<FileType[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectFormData, setProjectFormData] = useState({ name: "", description: "", deadline: "" });
  const [statusFilter, setStatusFilter] = useState("all");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [activityTab, setActivityTab] = useState(0); // 0: Projects, 1: Phases, 2: Tasks, 3: Users, 4: Files

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [projectsRes, usersRes, fileTypesRes] = await Promise.all([
        projectAPI.getAll(),
        userAPI.getAll(),
        fileTypeAPI.getAll(),
      ]);

      setProjects(projectsRes.data);
      setUsers(usersRes.data);
      setFileTypes(fileTypesRes.data);

      const allFiles: ProjectFile[] = [];
      const allTasks: Task[] = [];
      const allPhases: Phase[] = [];

      for (const project of projectsRes.data) {
        try {
          const filesRes = await fileAPI.getByProject(project.id);
          allFiles.push(...filesRes.data);
        } catch (err) {
          console.error(`Failed to load files for project ${project.id}:`, err);
        }

        try {
          const tasksRes = await taskAPI.getByProject(project.id);
          allTasks.push(...tasksRes.data);
        } catch (err) {
          console.error(`Failed to load tasks for project ${project.id}:`, err);
        }

        try {
          const phasesRes = await phaseAPI.getByProject(project.id);
          allPhases.push(...phasesRes.data);
        } catch (err) {
          console.error(`Failed to load phases for project ${project.id}:`, err);
        }
      }

      setFiles(allFiles);
      setTasks(allTasks);
      setPhases(allPhases);
      setError("");
    } catch (err: any) {
      console.error("Failed to load data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const kpis = {
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => !p.is_archived).length,
    archivedProjects: projects.filter((p) => p.is_archived).length,
    totalUsers: users.length,
    pendingUsers: users.filter((u) => !u.is_active).length,
    totalFiles: files.length,
  };

  // Activity (latest 5 each)
  const projectActivity = projects
    .map((p) => ({
      message: p.is_archived ? `Project "${p.name}" was archived` : `Project "${p.name}" was created`,
      date: p.created_at,
    }))
    .sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime())
    .slice(0, 5);

  const phaseActivity = phases
    .map((ph) => ({
      message: ph.status === "completed" ? `Phase "${ph.name}" was completed` : `Phase "${ph.name}" was created`,
      date: ph.created_at,
    }))
    .sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime())
    .slice(0, 5);

  const taskActivity = tasks
    .map((t) => ({
      message: t.status === "done" ? `Task "${t.title}" completed` : `Task "${t.title}" created`,
      date: t.created_at,
    }))
    .sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime())
    .slice(0, 5);

  const userActivity = users
    .filter((u) => u.is_active)
    .map((u) => ({ message: `User "${u.name}" validated`, date: u.updated_at }))
    .sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime())
    .slice(0, 5);

  const fileActivity = files
    .map((f) => ({ message: `File "${f.filename}" uploaded`, date: f.uploaded_at }))
    .sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime())
    .slice(0, 5);

  const activityLists = [projectActivity, phaseActivity, taskActivity, userActivity, fileActivity];

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>Dashboard</Typography>
        <LinearProgress />
      </Box>
    );
  }

  const kpiCards = [
    { title: "Total Projects", value: kpis.totalProjects, icon: Work, color: "#1976d2" },
    { title: "Active Projects", value: kpis.activeProjects, icon: CheckCircle, color: "#2e7d32" },
    { title: "Archived Projects", value: kpis.archivedProjects, icon: Archive, color: "#f57c00" },
    { title: "Total Users", value: kpis.totalUsers, icon: People, color: "#0097a7" },
    { title: "Total Files", value: kpis.totalFiles, icon: Folder, color: "#757575" },
    { title: "Pending Users", value: kpis.pendingUsers, icon: PersonAdd, color: "#f57c00" },
  ];

  const projectsOverTime = projects
    .reduce((acc: any[], project) => {
      const month = new Date(project.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" });
      const existing = acc.find((item) => item.month === month);
      if (existing) existing.count++;
      else acc.push({ month, count: 1 });
      return acc;
    }, [])
    .sort((a, b) => new Date(a.month + " 1").getTime() - new Date(b.month + " 1").getTime());

  const fileTypeData = fileTypes
    .map((ft) => ({ name: ft.name, value: files.filter((f) => f.filetype?.name === ft.name).length }))
    .filter((item) => item.value > 0);

  const upcomingDeadlines = projects
    .filter((p) => p.deadline && new Date(p.deadline) > new Date() && !p.is_archived)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 3);

  const getDeadlineColor = (days: number) => {
    if (days <= 3) return { bg: "#fdecea", color: "#d32f2f" };
    if (days <= 7) return { bg: "#fff4e5", color: "#ed6c02" };
    return { bg: "#e6f4ea", color: "#2e7d32" };
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setProjectFormData({
      name: project.name,
      description: project.description || "",
      deadline: project.deadline ? new Date(project.deadline).toISOString().split("T")[0] : "",
    });
    setEditingProject(true);
    setProjectDialogOpen(true);
  };

  const handleProjectSubmit = async () => {
    try {
      if (editingProject && selectedProject) {
        const projectData = {
          name: projectFormData.name.trim(),
          description: projectFormData.description.trim(),
          deadline: projectFormData.deadline || undefined,
        };
        await projectAPI.update(selectedProject.id, projectData);
        setSnackbar({ open: true, message: "Project updated successfully", severity: "success" });
      }
      setProjectDialogOpen(false);
      await loadAllData();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.msg || "Failed to update project",
        severity: "error",
      });
    }
  };

  return (
    <Box sx={{ p: theme.spacing(4), backgroundColor: "#f9fafb", minHeight: "100vh" }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, color: "#1e293b", fontWeight: 700 }}>
        Dashboard Overview
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* ======= KPI (left) + Activity (right) in a two-column responsive grid ======= */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, // activity sits to the right on md+
          gap: 3,
          mb: 4,
          alignItems: "start",
        }}
      >
        {/* Left column: KPI cards (3 per row) */}
        <Box>
          <Grid container spacing={3}>
            {kpiCards.map((kpi, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{
                    borderRadius: 3,
                    height: "100%",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
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
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Right column: Activity feed with tabs */}
        <Box>
          <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "#1e293b", mb: 2 }}>
                Recent Activity
              </Typography>

              <Tabs
                value={activityTab}
                onChange={(e, v) => setActivityTab(v)}
                variant="fullWidth"
                textColor="primary"
                indicatorColor="primary"
                sx={{ mb: 2 }}
              >
                <Tab icon={<Work />} label="Projects" />
                <Tab icon={<Timeline />} label="Phases" />
                <Tab icon={<AssignmentTurnedIn />} label="Tasks" />
                <Tab icon={<People />} label="Users" />
                <Tab icon={<UploadFile />} label="Files" />
              </Tabs>

              <List dense sx={{ p: 0 }}>
                {activityLists[activityTab].length > 0 ? (
                  activityLists[activityTab].map((item, i) => (
                    <ListItem key={i} sx={{ px: 0, py: 1, borderBottom: "1px solid #f1f5f9" }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {activityTab === 0 && <Work sx={{ color: "#1976d2" }} />}
                        {activityTab === 1 && <Timeline sx={{ color: "#2e7d32" }} />}
                        {activityTab === 2 && <AssignmentTurnedIn sx={{ color: "#f57c00" }} />}
                        {activityTab === 3 && <People sx={{ color: "#0097a7" }} />}
                        {activityTab === 4 && <UploadFile sx={{ color: "#757575" }} />}
                      </ListItemIcon>
                      <ListItemText
                        primary={<Typography variant="body2">{item.message}</Typography>}
                        secondary={<Typography variant="caption" color="text.secondary">{formatDate(item.date)}</Typography>}
                      />
                    </ListItem>
                  ))
                ) : (
                  <Typography variant="caption" color="text.secondary">No recent activity</Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Charts */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Assessment sx={{ color: "#1976d2" }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: "#1e293b" }}>
                  File Types Distribution
                </Typography>
              </Box>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={fileTypeData} cx="50%" cy="50%" outerRadius={100} dataKey="value">
                      {fileTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <InsertChart sx={{ color: "#2e7d32" }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: "#1e293b" }}>
                  Projects Created Over Time
                </Typography>
              </Box>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#64748b" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "none",
                        borderRadius: 8,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      }}
                    />
                    <Bar dataKey="count" fill="#1976d2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upcoming Deadlines */}
      <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#1e293b", mb: 2 }}>
            Upcoming Deadlines
          </Typography>
          {upcomingDeadlines.length > 0 ? (
            <List sx={{ p: 0 }}>
              {upcomingDeadlines.map((project, index) => {
                const days = Math.ceil(
                  (new Date(project.deadline!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                const colors = getDeadlineColor(days);
                return (
                  <ListItem
                    key={project.id}
                    sx={{
                      px: 0,
                      py: 1.5,
                      borderBottom: index < upcomingDeadlines.length - 1 ? "1px solid #f1f5f9" : "none",
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Schedule sx={{ color: colors.color, fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{project.name}</Typography>}
                      secondary={`Due: ${new Date(project.deadline!).toLocaleDateString()} • ${days} days remaining`}
                    />
                    <Chip
                      label={`${days} days`}
                      size="small"
                      sx={{ backgroundColor: colors.bg, color: colors.color, fontWeight: 600 }}
                    />
                  </ListItem>
                );
              })}
            </List>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body2" color="text.secondary">No upcoming deadlines</Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Project Management Table */}
      <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#1e293b" }}>Project Management</Typography>
            <Box display="flex" gap={2}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          <DataTableBasic
            data={projects
              .filter((p) => (statusFilter === "active" ? !p.is_archived : statusFilter === "archived" ? p.is_archived : true))
              .map((p) => [
                p.name || "—",
                p.description || "No description",
                p.created_by?.email || "Unknown",
                p.created_at ? new Date(p.created_at).toLocaleDateString() : "—",
                p.deadline ? new Date(p.deadline).toLocaleDateString() : "No deadline",
                p.is_archived
                  ? '<span class="badge bg-secondary">Archived</span>'
                  : '<span class="badge bg-success">Active</span>',
                `<div style="display:flex; gap:4px; align-items:center;">
                   <button class="MuiButton-root MuiButton-outlined MuiButton-outlinedPrimary MuiButton-sizeSmall" onclick="window.dispatchEvent(new CustomEvent('editProject',{detail:${p.id}}))">
                     Edit
                   </button>
                   <button class="MuiButton-root MuiButton-outlined MuiButton-outlinedSecondary MuiButton-sizeSmall" onclick="window.dispatchEvent(new CustomEvent('viewProject',{detail:${p.id}}))">
                     View
                   </button>
                 </div>`,
              ])}
            columns={["Project Name", "Description", "Created By", "Created", "Deadline", "Status", "Actions"]}
            options={{ responsive: true, dom: "Bfrtip", buttons: ["copy", "csv", "print"] }}
          />
        </CardContent>
      </Card>

      {/* Project Create/Edit Dialog */}
      <Dialog open={projectDialogOpen} onClose={() => setProjectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Edit Project</DialogTitle>
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
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setProjectDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleProjectSubmit}
            variant="contained"
            disabled={!projectFormData.name.trim()}
            sx={{ borderRadius: 2 }}
          >
            Update Project
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
