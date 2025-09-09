import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Avatar,
} from '@mui/material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Add } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { Task, User } from '../../types';
import { taskAPI, userAPI } from '../../services/api';

interface TaskBoardProps {
  projectId: number;
}

interface SortableTaskProps {
  task: Task;
  onEdit: (task: Task) => void;
  users: User[];
}

const SortableTask: React.FC<SortableTaskProps> = ({ task, onEdit, users }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const assignedUser = users.find(u => u.id === task.assigned_to);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        mb: 2,
        cursor: isDragging ? 'grabbing' : 'grab',
        '&:hover': { boxShadow: 3 }
      }}
      onClick={() => onEdit(task)}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography variant="subtitle2" fontWeight="bold">
            {task.title}
          </Typography>
          <Chip 
            label={task.priority} 
            size="small" 
            color={getPriorityColor(task.priority) as any}
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" mb={2}>
          {task.description}
        </Typography>
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          {assignedUser && (
            <Box display="flex" alignItems="center">
              <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>
                {assignedUser.username[0].toUpperCase()}
              </Avatar>
              <Typography variant="caption">
                {assignedUser.username}
              </Typography>
            </Box>
          )}
          
          {task.due_date && (
            <Typography variant="caption" color="text.secondary">
              Due: {new Date(task.due_date).toLocaleDateString()}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export const TaskBoard: React.FC<TaskBoardProps> = ({ projectId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assigned_to: '',
    due_date: '',
  });
  const { user } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      const [tasksResponse, usersResponse] = await Promise.all([
        taskAPI.getByProject(projectId),
        userAPI.getAll(),
      ]);
      setTasks(tasksResponse.data);
      setUsers(usersResponse.data);
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const taskId = active.id as number;
    const newStatus = over.id as string;

    try {
      await taskAPI.updateStatus(taskId, newStatus);
      await loadData();
    } catch (err) {
      setError('Failed to update task status');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const taskData = {
        ...formData,
        project_id: projectId,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : undefined,
        status: editingTask?.status || 'todo',
      };

      if (editingTask) {
        await taskAPI.update(editingTask.id, taskData);
      } else {
        await taskAPI.create(taskData);
      }

      await loadData();
      handleCloseDialog();
    } catch (err) {
      setError(editingTask ? 'Failed to update task' : 'Failed to create task');
    }
  };

  const handleOpenDialog = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description,
        priority: task.priority,
        assigned_to: task.assigned_to?.toString() || '',
        due_date: task.due_date || '',
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        assigned_to: '',
        due_date: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTask(null);
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const columns = [
    { id: 'todo', title: 'To Do', color: '#f5f5f5' },
    { id: 'in_progress', title: 'In Progress', color: '#fff3cd' },
    { id: 'done', title: 'Done', color: '#d4edda' },
  ];

  const canModify = user?.role === 'superuser' || user?.role === 'manager';

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Task Board</Typography>
        {canModify && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Task
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Grid container spacing={3}>
          {columns.map((column) => (
            <Grid item xs={12} md={4} key={column.id}>
              <Card sx={{ minHeight: 400, backgroundColor: column.color }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {column.title}
                    <Chip 
                      label={getTasksByStatus(column.id).length}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  
                  <SortableContext
                    items={getTasksByStatus(column.id).map(task => task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <Box
                      sx={{
                        minHeight: 300,
                        p: 1,
                        border: '2px dashed transparent',
                        borderRadius: 1,
                        '&[data-over]': {
                          border: '2px dashed #1976d2',
                          backgroundColor: 'rgba(25, 118, 210, 0.1)',
                        }
                      }}
                    >
                      {getTasksByStatus(column.id).map((task) => (
                        <SortableTask
                          key={task.id}
                          task={task}
                          onEdit={handleOpenDialog}
                          users={users}
                        />
                      ))}
                    </Box>
                  </SortableContext>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DndContext>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingTask ? 'Edit Task' : 'Add New Task'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="title"
              label="Task Title"
              fullWidth
              variant="outlined"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <TextField
              margin="dense"
              name="description"
              label="Description"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                label="Priority"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense">
              <InputLabel>Assigned To</InputLabel>
              <Select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                label="Assigned To"
              >
                <MenuItem value="">Unassigned</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id.toString()}>
                    {user.username} ({user.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              name="due_date"
              label="Due Date"
              type="date"
              fullWidth
              variant="outlined"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingTask ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};