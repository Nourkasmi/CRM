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
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import CategoryIcon from "@mui/icons-material/Category";
import TaskIcon from "@mui/icons-material/CheckCircle";
import AddIcon from "@mui/icons-material/Add";
import { Project, Phase, Task } from "../../types";
import { projectAPI, phaseAPI, taskAPI } from "../../services/api";

export const ProjectPhaseTaskSplit: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingPhases, setLoadingPhases] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"project" | "phase" | "task" | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDeadline, setNewDeadline] = useState("");

  // Load all projects
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = () => {
    setLoadingProjects(true);
    projectAPI
      .getAll()
      .then((res) => setProjects(res.data))
      .finally(() => setLoadingProjects(false));
  };

  const fetchPhases = (projectId: string) => {
    setLoadingPhases(true);
    phaseAPI
      .getByProject(projectId)
      .then((res) => setPhases(res.data))
      .finally(() => setLoadingPhases(false));
  };

  const fetchTasks = (phaseId: string) => {
    setLoadingTasks(true);
    taskAPI
      .getByPhase(phaseId)
      .then((res) => setTasks(res.data))
      .finally(() => setLoadingTasks(false));
  };

  // When selecting project
  useEffect(() => {
    if (!selectedProject) return;
    fetchPhases(selectedProject.id);
    setTasks([]);
    setSelectedPhase(null);
  }, [selectedProject]);

  // When selecting phase
  useEffect(() => {
    if (!selectedPhase) return;
    fetchTasks(selectedPhase.id);
  }, [selectedPhase]);

  // Handle Add button click
  const handleOpenDialog = (type: "project" | "phase" | "task") => {
    setDialogType(type);
    setNewName("");
    setNewDesc("");
    setNewDeadline("");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogType(null);
  };

  const handleCreate = async () => {
    if (!dialogType) return;

    try {
      if (dialogType === "project") {
        await projectAPI.create({ name: newName, description: newDesc });
        fetchProjects();
      }
      if (dialogType === "phase" && selectedProject) {
        await phaseAPI.create(selectedProject.id, {
          name: newName,
          deadline: newDeadline || undefined,
        });
        fetchPhases(selectedProject.id);
      }
      if (dialogType === "task" && selectedPhase) {
        await taskAPI.create(selectedPhase.id, {
          title: newName,
          description: newDesc,
          status: "todo",
        });
        fetchTasks(selectedPhase.id);
      }
    } catch (err) {
      console.error("Error creating", err);
    } finally {
      handleCloseDialog();
    }
  };

  // 🔹 Reusable board column
  const BoardColumn: React.FC<{
    title: string;
    loading: boolean;
    items: React.ReactNode;
    addAction?: () => void;
  }> = ({ title, loading, items, addAction }) => (
    <Card
      sx={{
        flex: 1,
        boxShadow: 3,
        display: "flex",
        flexDirection: "column",
        maxHeight: 500,
      }}
    >
      <CardContent sx={{ flex: 1, overflowY: "auto", p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">{title}</Typography>
          {addAction && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={addAction}
              sx={{
                textTransform: "uppercase",
                fontWeight: "bold",
                borderRadius: 1,
                px: 2,
                py: 0.5,
                fontSize: "0.8rem",
                boxShadow: 2,
              }}
            >
              Add {title.slice(0, -1)}
            </Button>
          )}
        </Box>
        {loading ? <CircularProgress /> : items}
      </CardContent>
    </Card>
  );

  return (
    <>
      <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={2} p={2}>
        {/* Projects */}
        <BoardColumn
          title="Projects"
          loading={loadingProjects}
          addAction={() => handleOpenDialog("project")}
          items={
            <List dense>
              {projects.map((p) => (
                <ListItemButton
                  key={p.id}
                  selected={selectedProject?.id === p.id}
                  onClick={() =>
                    setSelectedProject(selectedProject?.id === p.id ? null : p)
                  }
                  sx={{
                    borderRadius: 1,
                    "&.Mui-selected": {
                      bgcolor: "primary.main",
                      color: "white",
                    },
                  }}
                >
                  <ListItemIcon>
                    <FolderIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={p.name} />
                </ListItemButton>
              ))}
            </List>
          }
        />

        {/* Phases */}
        {selectedProject && (
          <BoardColumn
            title="Phases"
            loading={loadingPhases}
            addAction={() => handleOpenDialog("phase")}
            items={
              phases.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  No phases found for this project
                </Typography>
              ) : (
                <List dense>
                  {phases.map((ph) => (
                    <ListItemButton
                      key={ph.id}
                      selected={selectedPhase?.id === ph.id}
                      onClick={() =>
                        setSelectedPhase(selectedPhase?.id === ph.id ? null : ph)
                      }
                      sx={{
                        borderRadius: 1,
                        "&.Mui-selected": {
                          bgcolor: "secondary.main",
                          color: "white",
                        },
                      }}
                    >
                      <ListItemIcon>
                        <CategoryIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={ph.name} />
                    </ListItemButton>
                  ))}
                </List>
              )
            }
          />
        )}

        {/* Tasks */}
        {selectedPhase && (
          <BoardColumn
            title="Tasks"
            loading={loadingTasks}
            addAction={() => handleOpenDialog("task")}
            items={
              tasks.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  No tasks found for this phase
                </Typography>
              ) : (
                <List dense>
                  {tasks.map((t) => (
                    <ListItemButton key={t.id}>
                      <ListItemIcon>
                        <TaskIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={t.title}
                        secondary={t.status}
                        secondaryTypographyProps={{
                          color: "textSecondary",
                          fontSize: "0.8rem",
                        }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              )
            }
          />
        )}
      </Box>

      {/* 🔹 Create Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {dialogType === "project"
            ? "Add Project"
            : dialogType === "phase"
            ? "Add Phase"
            : "Add Task"}
        </DialogTitle>
        <DialogContent>
          {/* Common name/title field */}
          <TextField
            margin="normal"
            fullWidth
            label={dialogType === "task" ? "Task Title" : "Name"}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />

          {/* Project & Task have description */}
          {(dialogType === "project" || dialogType === "task") && (
            <TextField
              margin="normal"
              fullWidth
              label="Description"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
          )}

          {/* Phase has deadline */}
          {dialogType === "phase" && (
            <TextField
              margin="normal"
              fullWidth
              type="date"
              label="Deadline"
              InputLabelProps={{ shrink: true }}
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!newName}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
