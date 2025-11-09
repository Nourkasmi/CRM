import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import {
  Work,
  CheckCircle,
  Schedule,
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
import { useAuth } from "../../contexts/AuthContext";
import { Project, Task, File } from "../../types";
import { projectAPI, taskAPI, fileAPI } from "../../services/api";
import DataTableBasic from "../common/DataTableBasic";

const COLORS = ["#1976d2", "#2e7d32", "#f57c00", "#d32f2f", "#0097a7"];

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const projectsRes = await projectAPI.getAll();
      const userProjects = projectsRes.data.filter((p: Project) =>
        p.members?.some((m) => m.id === user?.id)
      );
      setProjects(userProjects);

      const allTasks: Task[] = [];
      for (const project of userProjects) {
        try {
          const tasksRes = await taskAPI.getByProject(project.id);
          const userTasks = tasksRes.data.filter(
            (t: Task) => t.assigned_to === user?.id
          );
          allTasks.push(...userTasks);
        } catch {
          console.error(`Failed to load tasks for project ${project.id}`);
        }
      }
      setTasks(allTasks);

      const filesRes = await fileAPI.getAll();
      const userFiles = filesRes.data.filter(
        (f: File) => f.uploaded_by?.id === user?.id
      );
      setFiles(userFiles);

      setError("");
    } catch (err) {
      console.error("Failed to load user dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    assignedProjects: projects.length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t) => t.status === "done").length,
    inProgressTasks: tasks.filter((t) => t.status === "in_progress").length,
    todoTasks: tasks.filter((t) => t.status === "todo").length,
    totalFiles: files.length,
  };

  const tasksByStatus = [
    { status: "To-Do", count: stats.todoTasks },
    { status: "In Progress", count: stats.inProgressTasks },
    { status: "Done", count: stats.completedTasks },
  ];

  const filesByProject = Object.entries(
    files.reduce((acc, f) => {
      const proj = f.project || "Unassigned";
      acc[proj] = (acc[proj] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const upcomingDeadlines = projects
    .filter(
      (p) =>
        p.deadline && new Date(p.deadline) > new Date() && !p.is_archived
    )
    .sort(
      (a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()
    )
    .slice(0, 3);

  const getDeadlineColor = (days: number) => {
    if (days <= 3) return { bg: "#fdecea", color: "#d32f2f" };
    if (days <= 7) return { bg: "#fff4e5", color: "#ed6c02" };
    return { bg: "#e6f4ea", color: "#2e7d32" };
  };

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
        Welcome back, {user?.name || user?.username}!
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* ===== KPI Cards ===== */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: "Projects",
            value: stats.assignedProjects,
            icon: Work,
            color: "#1976d2",
          },
          {
            title: "Total Tasks",
            value: stats.totalTasks,
            icon: AssignmentTurnedIn,
            color: "#f57c00",
          },
          {
            title: "Completed",
            value: stats.completedTasks,
            icon: CheckCircle,
            color: "#2e7d32",
          },
          {
            title: "Files",
            value: stats.totalFiles,
            icon: UploadFile,
            color: "#0097a7",
          },
        ].map((kpi, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                borderRadius: 3,
                minHeight: 140,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              }}
            >
              <CardContent
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 3,
                }}
              >
                <Box>
                  <Typography
                    variant="h4"
                    sx={{ color: kpi.color, fontWeight: 700, mb: 0.5 }}
                  >
                    {kpi.value}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontWeight: 500 }}
                  >
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
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ===== Charts ===== */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: "#1e293b", mb: 2 }}
              >
                Tasks by Status
              </Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tasksByStatus}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1976d2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: "#1e293b", mb: 2 }}
              >
                Files by Project
              </Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={filesByProject}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {filesByProject.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
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
      </Grid>

      {/* ===== Upcoming Deadlines ===== */}
      <Card sx={{ borderRadius: 3, mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: "#1e293b", mb: 2 }}
          >
            Upcoming Deadlines
          </Typography>
          {upcomingDeadlines.length > 0 ? (
            <List sx={{ p: 0 }}>
              {upcomingDeadlines.map((project, index) => {
                const days = Math.ceil(
                  (new Date(project.deadline!).getTime() -
                    new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                const colors = getDeadlineColor(days);
                return (
                  <ListItem
                    key={project.id}
                    sx={{
                      px: 0,
                      py: 1.5,
                      borderBottom:
                        index < upcomingDeadlines.length - 1
                          ? "1px solid #f1f5f9"
                          : "none",
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Schedule sx={{ color: colors.color, fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
                          {project.name}
                        </Typography>
                      }
                      secondary={`Due: ${new Date(
                        project.deadline!
                      ).toLocaleDateString()} • ${days} days remaining`}
                    />
                    <Chip
                      label={`${days} days`}
                      size="small"
                      sx={{
                        backgroundColor: colors.bg,
                        color: colors.color,
                        fontWeight: 600,
                      }}
                    />
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

      {/* ===== Project Management Table ===== */}
      <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
        <CardContent sx={{ p: 3 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: "#1e293b" }}
            >
              Project Management
            </Typography>
            <Box display="flex" gap={2}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>
            </Box>
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
                p.deadline
                  ? new Date(p.deadline).toLocaleDateString()
                  : "No deadline",
                p.is_archived
                  ? '<span class="badge bg-secondary">Archived</span>'
                  : '<span class="badge bg-success">Active</span>',
              ])}
            columns={[
              "Project Name",
              "Description",
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
