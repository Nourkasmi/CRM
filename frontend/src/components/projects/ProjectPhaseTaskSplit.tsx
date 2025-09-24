import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Autocomplete,
  Snackbar,
  Alert,
  useTheme,
  SelectChangeEvent,
} from "@mui/material";
import {
  Folder as FolderIcon,
  Category as CategoryIcon,
  CheckCircle as TaskIcon,
  Add as AddIcon,
  Person as PersonIcon,
  ManageAccounts as ManagerIcon,
} from "@mui/icons-material";
import { Project, Phase, Task, User } from "../../types";
import { projectAPI, phaseAPI, taskAPI, userAPI } from "../../services/api";
import { Tooltip } from "@mui/material";

export const ProjectPhaseTaskSplit: React.FC = () => {
  const theme = useTheme();
  
  // Data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Selection state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);

  // Loading state
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingPhases, setLoadingPhases] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"project" | "phase" | "task" | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    deadline: "",
    assignedUsers: [] as string[],
  });

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  // Load data on mount
  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  // Load phases when project selected
  useEffect(() => {
    if (!selectedProject) return;
    fetchPhases(selectedProject.id);
    setTasks([]);
    setSelectedPhase(null);
  }, [selectedProject]);

  // Load tasks when phase selected
  useEffect(() => {
    if (!selectedPhase) return;
    fetchTasks(selectedPhase.id);
  }, [selectedPhase]);

  // Fetch functions
  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await projectAPI.getAll();
      setProjects(res.data);
    } catch (error) {
      showSnackbar("Failed to load projects", "error");
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await userAPI.getAll();
      setUsers(res.data);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  const fetchPhases = async (projectId: string) => {
    setLoadingPhases(true);
    try {
      const res = await phaseAPI.getByProject(projectId);
      setPhases(res.data);
    } catch (error) {
      showSnackbar("Failed to load phases", "error");
    } finally {
      setLoadingPhases(false);
    }
  };

  const fetchTasks = async (phaseId: string) => {
    setLoadingTasks(true);
    try {
      const res = await taskAPI.getByPhase(phaseId);
      setTasks(res.data);
    } catch (error) {
      showSnackbar("Failed to load tasks", "error");
    } finally {
      setLoadingTasks(false);
    }
  };

  // Helpers
  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return '#2e7d32';
      case 'in_progress': return '#f57c00';
      case 'todo': return '#1976d2';
      default: return '#757575';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'done': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'todo': return 'To Do';
      default: return status;
    }
  };

  // Dialog handlers
  const handleOpenDialog = (type: "project" | "phase" | "task") => {
    setDialogType(type);
    setFormData({ name: "", description: "", deadline: "", assignedUsers: [] });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogType(null);
    setFormData({ name: "", description: "", deadline: "", assignedUsers: [] });
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.deadline) {
      showSnackbar("Please fill in all required fields", "error");
      return;
    }

    try {
      if (dialogType === "project") {
        await projectAPI.create({
          name: formData.name,
          description: formData.description,
          deadline: formData.deadline,
        });
        await fetchProjects();
        showSnackbar("Project created successfully", "success");
      } else if (dialogType === "phase" && selectedProject) {
        await phaseAPI.create(selectedProject.id, {
          name: formData.name,
          deadline: formData.deadline,
        });
        await fetchPhases(selectedProject.id);
        showSnackbar("Phase created successfully", "success");
      } else if (dialogType === "task" && selectedPhase) {
        await taskAPI.create(selectedPhase.id, {
          title: formData.name,
          description: formData.description,
          status: "todo",
        });
        await fetchTasks(selectedPhase.id);
        showSnackbar("Task created successfully", "success");
      }
      handleCloseDialog();
    } catch (error) {
      showSnackbar(`Failed to create ${dialogType}`, "error");
    }
  };

  // Render project card with hover tooltip
  const renderProjectCard = (project: Project) => {
    const manager = project.created_by && typeof project.created_by === 'object' ? project.created_by : null;

    return (
      <Tooltip
        title={
          <Box>
            {project.description && <Typography variant="body2">{project.description}</Typography>}
            {project.deadline && <Typography variant="body2">Due: {new Date(project.deadline).toLocaleDateString()}</Typography>}
            {manager && <Typography variant="body2">Manager: {manager.email || "Unknown"}</Typography>}
          </Box>
        }
        arrow
        placement="right"
      >
        <ListItemButton
          key={project.id}
          selected={selectedProject?.id === project.id}
          onClick={() => setSelectedProject(selectedProject?.id === project.id ? null : project)}
          sx={{
            borderRadius: 2,
            mb: 1,
            "&.Mui-selected": { bgcolor: "primary.main", color: "white" },
            "&:hover": { bgcolor: selectedProject?.id === project.id ? "primary.dark" : "action.hover" },
          }}
        >
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>{project.name}</Typography>
                {project.status === "completed" ? (
                  <Chip label="Completed" color="success" size="small" sx={{ fontWeight: 600 }} />
                ) : (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation();
                      projectAPI.complete(project.id)
                        .then(() => fetchProjects())
                        .catch(() => showSnackbar("Failed to complete project", "error"));
                    }}
                  >
                    Complete
                  </Button>
                )}
              </Box>
            }
          />
        </ListItemButton>
      </Tooltip>
    );
  };

  // Render phase card with hover tooltip
  const renderPhaseCard = (phase: Phase) => {
    return (
      <Tooltip
        title={
          <Box>
            {phase.deadline && <Typography variant="body2">Due: {new Date(phase.deadline).toLocaleDateString()}</Typography>}
          </Box>
        }
        arrow
        placement="right"
      >
        <ListItemButton
          key={phase.id}
          selected={selectedPhase?.id === phase.id}
          onClick={() => setSelectedPhase(selectedPhase?.id === phase.id ? null : phase)}
          sx={{
            borderRadius: 2,
            mb: 1,
            "&.Mui-selected": { bgcolor: "secondary.main", color: "white" },
          }}
        >
          <ListItemIcon><CategoryIcon /></ListItemIcon>
          <Box display="flex" justifyContent="space-between" alignItems="center" flex={1}>
            <Typography variant="subtitle2" fontWeight={600}>{phase.name}</Typography>
            {phase.status === "completed" ? (
              <Chip label="Completed" color="success" size="small" sx={{ fontWeight: 600 }} />
            ) : (
              <Button
                size="small"
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  phaseAPI.complete(phase.id)
                    .then(() => fetchPhases(selectedProject!.id))
                    .catch(() => showSnackbar("Failed to complete phase", "error"));
                }}
              >
                Complete
              </Button>
            )}
          </Box>
        </ListItemButton>
      </Tooltip>
    );
  };

  // Render task card with hover tooltip
  const renderTaskCard = (task: Task) => {
    const assignee = task.assigned_to && task.assigned_to.length > 0 ? task.assigned_to[0] : null;

    return (
      <Tooltip
        title={
          <Box>
            {task.description && <Typography variant="body2">{task.description}</Typography>}
            {task.deadline && <Typography variant="body2">Due: {new Date(task.deadline).toLocaleDateString()}</Typography>}
            {assignee && <Typography variant="body2">Assigned to: {assignee.email || "Unknown"}</Typography>}
          </Box>
        }
        arrow
        placement="right"
      >
        <ListItemButton key={task.id} sx={{ borderRadius: 2, mb: 1, "&:hover": { bgcolor: "action.hover" } }}>
          <ListItemIcon><TaskIcon sx={{ color: getStatusColor(task.status) }} /></ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>{task.title}</Typography>
                {task.status === "done" ? (
                  <Chip label="Completed" color="success" size="small" sx={{ fontWeight: 600 }} />
                ) : (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation();
                      taskAPI.complete(task.id)
                        .then(() => fetchTasks(selectedPhase!.id))
                        .catch(() => showSnackbar("Failed to complete task", "error"));
                    }}
                  >
                    Complete
                  </Button>
                )}
              </Box>
            }
          />
        </ListItemButton>
      </Tooltip>
    );
  };

  return (
    <Box sx={{ p: theme.spacing(3) }}>
      <Typography variant="h4" gutterBottom sx={{ mb: theme.spacing(3), fontWeight: 600 }}>
        Projects Overview
      </Typography>

      <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={3}>
        {/* Projects Column */}
        <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', display: "flex", flexDirection: "column", maxHeight: 600 }}>
          <CardContent sx={{ flex: 1, overflowY: "auto", p: theme.spacing(2) }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={600}>Projects</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog("project")} size="small" sx={{ borderRadius: 2 }}>Add Project</Button>
            </Box>
            {loadingProjects ? (
              <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>
            ) : (
              <List dense sx={{ p: 0 }}>{projects.map(renderProjectCard)}</List>
            )}
          </CardContent>
        </Card>

        {/* Phases Column */}
        {selectedProject && (
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', display: "flex", flexDirection: "column", maxHeight: 600 }}>
            <CardContent sx={{ flex: 1, overflowY: "auto", p: theme.spacing(2) }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>Phases</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog("phase")} size="small" sx={{ borderRadius: 2 }}>Add Phase</Button>
              </Box>
              {loadingPhases ? (
                <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>
              ) : phases.length === 0 ? (
                <Typography variant="body2" color="textSecondary" textAlign="center" py={3}>No phases found for this project</Typography>
              ) : (
                <List dense sx={{ p: 0 }}>{phases.map(renderPhaseCard)}</List>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tasks Column */}
        {selectedPhase && (
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', display: "flex", flexDirection: "column", maxHeight: 600 }}>
            <CardContent sx={{ flex: 1, overflowY: "auto", p: theme.spacing(2) }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>Tasks</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog("task")} size="small" sx={{ borderRadius: 2 }}>Add Task</Button>
              </Box>
              {loadingTasks ? (
                <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>
              ) : tasks.length === 0 ? (
                <Typography variant="body2" color="textSecondary" textAlign="center" py={3}>No tasks found for this phase</Typography>
              ) : (
                <List dense sx={{ p: 0 }}>{tasks.map(renderTaskCard)}</List>
              )}
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          Create New {dialogType === "project" ? "Project" : dialogType === "phase" ? "Phase" : "Task"}
        </DialogTitle>
        <DialogContent>
          <TextField margin="normal" fullWidth label={dialogType === "task" ? "Task Title" : "Name"} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          {(dialogType === "project" || dialogType === "task") && (
            <TextField margin="normal" fullWidth label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} multiline rows={3} />
          )}
          <TextField margin="normal" fullWidth type="date" label="Deadline" InputLabelProps={{ shrink: true }} value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} required />
          {dialogType === "project" && (
            <Autocomplete
              multiple
              options={users}
              getOptionLabel={(user) => `${user.name || user.email} (${user.email})`}
              value={users.filter(user => formData.assignedUsers.includes(user.id))}
              onChange={(event, newValue) => setFormData({ ...formData, assignedUsers: newValue.map(user => user.id) })}
              renderTags={(value, getTagProps) => value.map((user, index) => (
                <Chip {...getTagProps({ index })} key={user.id} avatar={<Avatar sx={{ width: 24, height: 24, fontSize: "0.8rem" }}>{(user.name || user.email)[0].toUpperCase()}</Avatar>} label={user.name || user.email} size="small" />
              ))}
              renderInput={(params) => (
                <TextField {...params} margin="normal" label="Assign Users" placeholder="Select users to assign to this project" helperText="Users assigned here will have access to this project" />
              )}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!formData.name.trim() || !formData.deadline} sx={{ borderRadius: 2 }}>
            Create {dialogType === "project" ? "Project" : dialogType === "phase" ? "Phase" : "Task"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
