import React, { useState, useEffect } from "react";
import DataTableBasic from "../common/DataTableBasic";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
} from "@mui/material";
import {
  Work,
  CheckCircle,
  Archive,
  Folder,
  Schedule,
  InsertChart,
  AssignmentTurnedIn,
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
import { useAuth } from "../../contexts/AuthContext";
import { Project } from "../../types";
import { projectAPI } from "../../services/api";

const COLORS = ["#1976d2", "#2e7d32", "#f57c00", "#d32f2f", "#0097a7"];

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await projectAPI.getAllWithStats();
      // ✅ Managers only see their projects
      const myProjects = res.data.filter(
        (p: Project) =>
          p.created_by?.id === user?.id ||
          p.managers?.some((m) => m.id === user?.id)
      );
      setProjects(myProjects);
      setError("");
    } catch (err) {
      console.error("Failed to load manager dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const kpis = {
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => !p.is_archived).length,
    archivedProjects: projects.filter((p) => p.is_archived).length,
    totalTasks: projects.reduce((sum, p) => sum + (p.task_count || 0), 0),
    completedTasks: projects.reduce((sum, p) => sum + (p.task_stats?.done || 0), 0),
    inProgressTasks: projects.reduce((sum, p) => sum + (p.task_stats?.in_progress || 0), 0),
    pendingTasks: projects.reduce((sum, p) => sum + (p.task_stats?.todo || 0), 0),
    totalFiles: projects.reduce((sum, p) => sum + (p.file_count || 0), 0),
  };

  const completionRate =
    kpis.totalTasks > 0
      ? (kpis.completedTasks / kpis.totalTasks) * 100
      : 0;

  const projectsOverTime = projects
    .reduce((acc: any[], project) => {
      const month = new Date(project.created_at).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      const existing = acc.find((item) => item.month === month);
      if (existing) existing.count++;
      else acc.push({ month, count: 1 });
      return acc;
    }, [])
    .sort(
      (a, b) =>
        new Date(a.month + " 1").getTime() - new Date(b.month + " 1").getTime()
    );

  const fileTypeData = Object.entries(
    projects.reduce((acc, p) => {
      if (p.file_stats) {
        for (const [ft, count] of Object.entries(p.file_stats)) {
          acc[ft] = (acc[ft] || 0) + (count as number);
        }
      }
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const upcomingDeadlines = projects
    .filter(
      (p) => p.deadline && new Date(p.deadline) > new Date() && !p.is_archived
    )
    .sort(
      (a, b) =>
        new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()
    )
    .slice(0, 3);

  const getDeadlineColor = (days: number) => {
    if (days <= 3) return { bg: "#fdecea", color: "#d32f2f" };
    if (days <= 7) return { bg: "#fff4e5", color: "#ed6c02" };
    return { bg: "#e6f4ea", color: "#2e7d32" };
  };

  // ✅ Recent activity (latest 5 entries)
  const activity = projects
    .flatMap((p) => {
      const logs: { message: string; date: any; icon: JSX.Element }[] = [];
      logs.push({
        message: p.is_archived ? `Project "${p.name}" archived` : `Project "${p.name}" created`,
        date: p.created_at,
        icon: <Work sx={{ color: "#1976d2" }} />,
      });
      if (p.task_stats?.in_progress > 0)
        logs.push({
          message: `${p.task_stats.in_progress} tasks in progress in "${p.name}"`,
          date: p.updated_at,
          icon: <AssignmentTurnedIn sx={{ color: "#f57c00" }} />,
        });
      if (p.task_stats?.done > 0)
        logs.push({
          message: `${p.task_stats.done} tasks completed in "${p.name}"`,
          date: p.updated_at,
          icon: <CheckCircle sx={{ color: "#2e7d32" }} />,
        });
      if (p.file_count && p.file_count > 0)
        logs.push({
          message: `${p.file_count} files uploaded in "${p.name}"`,
          date: p.updated_at,
          icon: <Folder sx={{ color: "#757575" }} />,
        });
      return logs;
    })
    .sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, backgroundColor: "#f9fafb", minHeight: "100vh" }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ mb: 4, color: "#1e293b", fontWeight: 700 }}
      >
        {user?.name ? `${user.name}'s Manager Dashboard` : "Manager Dashboard"}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* KPI + Activity side by side */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
          gap: 3,
          mb: 4,
        }}
      >
        {/* KPI Cards */}
        <Grid container spacing={3}>
          {[
            { title: "Total Projects", value: kpis.totalProjects, icon: Work, color: "#1976d2" },
            { title: "Active Projects", value: kpis.activeProjects, icon: CheckCircle, color: "#2e7d32" },
            { title: "Archived Projects", value: kpis.archivedProjects, icon: Archive, color: "#f57c00" },
            { title: "Total Tasks", value: kpis.totalTasks, icon: AssignmentTurnedIn, color: "#0097a7" },
            { title: "Total Files", value: kpis.totalFiles, icon: Folder, color: "#757575" },
            { title: "Completion Rate", value: `${completionRate.toFixed(1)}%`, icon: InsertChart, color: "#673ab7" },
          ].map((kpi, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card>
                <CardContent
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Typography variant="h5" sx={{ color: kpi.color, fontWeight: 700 }}>
                      {kpi.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {kpi.title}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: `${kpi.color}15` }}>
                    <kpi.icon sx={{ fontSize: 28, color: kpi.color }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Recent Activity */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Recent Activity
            </Typography>
            <List dense>
              {activity.length > 0 ? (
                activity.map((item, i) => (
                  <ListItem key={i} sx={{ px: 0, py: 1, borderBottom: "1px solid #f1f5f9" }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
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

      {/* Charts */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                File Types Distribution
              </Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={fileTypeData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
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

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Projects Over Time
              </Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1976d2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Tasks by Status
              </Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { status: "To-Do", count: kpis.pendingTasks },
                      { status: "In Progress", count: kpis.inProgressTasks },
                      { status: "Done", count: kpis.completedTasks },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f57c00" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upcoming Deadlines */}
      <Card sx={{ borderRadius: 3, mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Upcoming Deadlines
          </Typography>
          {upcomingDeadlines.length > 0 ? (
            <List>
              {upcomingDeadlines.map((project, i) => {
                const days = Math.ceil(
                  (new Date(project.deadline!).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                const colors = getDeadlineColor(days);
                return (
                  <ListItem key={project.id} sx={{ borderBottom: i < upcomingDeadlines.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <ListItemIcon>
                      <Schedule sx={{ color: colors.color, fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{project.name}</Typography>}
                      secondary={`Due: ${formatDate(project.deadline)} • ${days} days remaining`}
                    />
                    <Chip label={`${days} days`} size="small" sx={{ backgroundColor: colors.bg, color: colors.color }} />
                  </ListItem>
                );
              })}
            </List>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No upcoming deadlines
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Project Table */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Project Management
            </Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <DataTableBasic
            data={projects
              .filter((p) =>
                statusFilter === "active"
                  ? !p.is_archived
                  : statusFilter === "archived"
                  ? p.is_archived
                  : true
              )
              .map((p) => [
                p.name || "—",
                p.description || "No description",
                p.created_at ? formatDate(p.created_at) : "—",
                p.deadline ? formatDate(p.deadline) : "No deadline",
                p.is_archived
                  ? '<span class="badge bg-secondary">Archived</span>'
                  : '<span class="badge bg-success">Active</span>',
              ])}
            columns={[
              "Project Name",
              "Description",
              "Created",
              "Deadline",
              "Status",
            ]}
            options={{
              responsive: true,
              dom: "Bfrtip",
              buttons: ["copy", "csv", "print"],
            }}
          />
        </CardContent>
      </Card>
    </Box>
  );
};
