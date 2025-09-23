import React, { useState, useEffect } from 'react';
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
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableSortLabel,
  TablePagination,
  useTheme,
} from '@mui/material';
import {
  People,
  Work,
  CheckCircle,
  PersonAdd,
  Archive,
  Assignment,
  Folder,
  Schedule,
  Warning,
  Add,
} from '@mui/icons-material';
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
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { Project, User, Task, ProjectFile, FileType } from '../../types';
import { projectAPI, userAPI, taskAPI, fileAPI, fileTypeAPI } from '../../services/api';

const COLORS = ['#1976d2', '#2e7d32', '#f57c00', '#d32f2f', '#0097a7'];

export const SuperuserDashboard: React.FC = () => {
  const theme = useTheme();
  
  // State for data
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [fileTypes, setFileTypes] = useState<FileType[]>([]);
  
  // State for UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Project dialog state
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectFormData, setProjectFormData] = useState({
    name: '',
    description: '',
    deadline: '',
  });
  
  // Table state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof Project>('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const navigate = useNavigate();

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

      // Load files for all projects
      const allFiles: ProjectFile[] = [];
      
      for (const project of projectsRes.data) {
        try {
          const filesResponse = await fileAPI.getByProject(project.id);
          allFiles.push(...filesResponse.data);
        } catch (err) {
          console.error(`Failed to load files for project ${project.id}:`, err);
        }
      }

      setFiles(allFiles);
      setTasks([]); // Set empty for now to avoid backend API errors
      setError('');
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate KPIs
  const kpis = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => !p.is_archived).length,
    archivedProjects: projects.filter(p => p.is_archived).length,
    totalUsers: users.length,
    pendingUsers: users.filter(u => !u.is_active).length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'done').length,
    overdueTasks: tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'done').length,
    totalFiles: files.length,
  };

  // Chart data preparation
  const projectStatusData = [
    { name: 'Active', value: kpis.activeProjects, color: '#2e7d32' },
    { name: 'Archived', value: kpis.archivedProjects, color: '#f57c00' },
  ].filter(item => item.value > 0);

  const taskStatusData = [
    { name: 'Completed', value: kpis.completedTasks, color: '#2e7d32' },
    { name: 'Pending', value: kpis.totalTasks - kpis.completedTasks, color: '#f57c00' },
    { name: 'Overdue', value: kpis.overdueTasks, color: '#d32f2f' },
  ].filter(item => item.value > 0);

  // Projects over time data
  const projectsOverTime = projects.reduce((acc: any[], project) => {
    const month = new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ month, count: 1 });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.month + ' 1') - new Date(b.month + ' 1'));

  // File types distribution
  const fileTypeData = fileTypes.map(ft => ({
    name: ft.name,
    value: files.filter(f => f.filetype?.name === ft.name).length,
  })).filter(item => item.value > 0);

  // Next deadlines
  const upcomingDeadlines = projects
    .filter(p => p.deadline && new Date(p.deadline) > new Date() && !p.is_archived)
    .sort((a, b) => new Date(a.deadline!) - new Date(b.deadline!))
    .slice(0, 3);

  // Table functions
  const handleSort = (property: keyof Project) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredProjects = projects.filter(project => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return !project.is_archived;
    if (statusFilter === 'archived') return project.is_archived;
    return true;
  });

  const sortedProjects = filteredProjects.sort((a, b) => {
    let aValue = a[orderBy];
    let bValue = b[orderBy];

    if (orderBy === 'created_by' && typeof aValue === 'object') {
      aValue = (aValue as any)?.email || '';
      bValue = (bValue as any)?.email || '';
    }

    if (order === 'asc') {
      return aValue < bValue ? -1 : 1;
    }
    return aValue > bValue ? -1 : 1;
  });

  const paginatedProjects = sortedProjects.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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

const handleProjectSubmit = async () => {
  try {
    if (editingProject && selectedProject) {
      const projectData = {
        name: projectFormData.name.trim(),
        description: projectFormData.description.trim(),
        deadline: projectFormData.deadline || undefined,
      };

      await projectAPI.update(selectedProject.id, projectData);
      setSnackbar({ open: true, message: 'Project updated successfully', severity: 'success' });
    }

    setProjectDialogOpen(false);
    await loadAllData();
  } catch (err: any) {
    setSnackbar({
      open: true,
      message: err.response?.data?.msg || 'Failed to update project',
      severity: 'error',
    });
  }
};

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>Dashboard</Typography>
        <LinearProgress />
      </Box>
    );
  }

  const kpiCards = [
    { title: 'Total Projects', value: kpis.totalProjects, icon: Work, color: '#1976d2' },
    { title: 'Active Projects', value: kpis.activeProjects, icon: CheckCircle, color: '#2e7d32' },
    { title: 'Archived Projects', value: kpis.archivedProjects, icon: Archive, color: '#f57c00' },
    { title: 'Total Users', value: kpis.totalUsers, icon: People, color: '#0097a7' },
    { title: 'Total Tasks', value: kpis.totalTasks, icon: Assignment, color: '#1976d2' },
    { title: 'Overdue Tasks', value: kpis.overdueTasks, icon: Warning, color: '#d32f2f' },
    { title: 'Total Files', value: kpis.totalFiles, icon: Folder, color: '#757575' },
    { title: 'Pending Users', value: kpis.pendingUsers, icon: PersonAdd, color: '#f57c00' },
  ];

  return (
    <Box sx={{ p: theme.spacing(4), backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: theme.spacing(4), color: '#1e293b', fontWeight: 600 }}>
        Dashboard Overview
      </Typography>

      {error && <Alert severity="error" sx={{ mb: theme.spacing(3) }}>{error}</Alert>}

      {/* KPI Cards - Single line with horizontal scroll */}
<Box
  sx={{
    display: 'flex',
    gap: 2,
    mb: theme.spacing(4),
    overflowX: 'auto',
    pb: 1,
    '&::-webkit-scrollbar': { height: 6 },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: '#cbd5e1',
      borderRadius: 3,
    },
  }}
>
  {kpiCards.map((kpi, index) => (
    <Card
      key={index}
      sx={{
        minWidth: 200, // ensures each card has width
        flex: '0 0 auto', // prevent shrinking
        borderRadius: 3,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
        },
      }}
    >
      <CardContent sx={{ p: theme.spacing(2.5) }}>
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <kpi.icon sx={{ fontSize: 28, color: kpi.color }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  ))}
</Box>


<Grid container spacing={4} sx={{ mb: theme.spacing(4) }}>
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              borderRadius: 3,
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease',
              '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.12)' }
            }}
          >
            <CardContent sx={{ p: theme.spacing(3) }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#1e293b' }}>
                File Types Distribution
              </Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fileTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                    >
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
          <Card 
            sx={{ 
              borderRadius: 3,
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease',
              '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.12)' }
            }}
          >
            <CardContent sx={{ p: theme.spacing(3) }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#1e293b' }}>
                Task Completion Overview
              </Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                {taskStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {taskStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      No task data available
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Row 2: Full-width Projects Timeline */}
      <Card 
        sx={{ 
          borderRadius: 3,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          mb: theme.spacing(4),
          transition: 'all 0.3s ease',
          '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.12)' }
        }}
      >
        <CardContent sx={{ p: theme.spacing(3) }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#1e293b' }}>
            Projects Created Over Time
          </Typography>
          <Box sx={{ height: 350, mt: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  stroke="#64748b"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#64748b"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                />
                <Bar dataKey="count" fill="#1976d2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Row 3: File Types + Upcoming Deadlines */}
      <Grid container spacing={4} sx={{ mb: theme.spacing(4) }}>
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              borderRadius: 3,
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease',
              '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.12)' }
            }}
          >
            <CardContent sx={{ p: theme.spacing(3) }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#1e293b' }}>
                File Types Distribution
              </Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fileTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                    >
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
          <Card 
            sx={{ 
              borderRadius: 3,
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease',
              '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.12)' }
            }}
          >
            <CardContent sx={{ p: theme.spacing(3) }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#1e293b' }}>
                Upcoming Deadlines
              </Typography>
              <Box sx={{ mt: 2 }}>
                {upcomingDeadlines.length > 0 ? (
                  <List sx={{ p: 0 }}>
                    {upcomingDeadlines.map((project, index) => (
                      <ListItem 
                        key={project.id} 
                        sx={{ 
                          px: 0, 
                          py: 1.5,
                          borderBottom: index < upcomingDeadlines.length - 1 ? '1px solid #f1f5f9' : 'none'
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Schedule sx={{ color: '#f57c00', fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {project.name}
                            </Typography>
                          }
                          secondary={
                            `Due: ${new Date(project.deadline!).toLocaleDateString()} • ${Math.ceil((new Date(project.deadline!) - new Date()) / (1000 * 60 * 60 * 24))} days remaining`
                          }
                        />
                        <Chip
                          label={`${Math.ceil((new Date(project.deadline!) - new Date()) / (1000 * 60 * 60 * 24))} days`}
                          size="small"
                          sx={{ 
                            backgroundColor: '#fff3cd',
                            color: '#f57c00',
                            fontWeight: 600
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No upcoming deadlines
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

{/* Project Management Table (DataTables) */}
<Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
  <CardContent sx={{ p: 3 }}>
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: "#1e293b" }}>
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
  p.created_by?.email || "Unknown",   // ✅ always a string
  p.created_at ? new Date(p.created_at).toLocaleDateString() : "—",
  p.deadline ? new Date(p.deadline).toLocaleDateString() : "No deadline",
  p.is_archived
    ? '<span class="badge bg-secondary">Archived</span>'
    : '<span class="badge bg-success">Active</span>',
  `<button class="btn btn-sm btn-outline-primary me-1">Edit</button>
   <button class="btn btn-sm btn-outline-secondary">View</button>`,
])}
      columns={[
        "Project Name",
        "Description",
        "Created By",
        "Created",
        "Deadline",
        "Status",
        "Actions",
      ]}
      options={{ responsive: true, dom: "Bfrtip", buttons: ["copy", "csv", "print"] }}
    />
  </CardContent>
</Card>


      {/* Project Create/Edit Dialog */}
      <Dialog open={projectDialogOpen} onClose={() => setProjectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          Edit Project
        </DialogTitle>
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
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};