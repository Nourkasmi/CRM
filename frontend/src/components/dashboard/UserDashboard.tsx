import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Avatar,
  Chip,
  LinearProgress,
} from '@mui/material';
import { 
  Assignment, 
  Schedule, 
  CheckCircle, 
  Person,
  Work 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Task, Project } from '../../types';
import { taskAPI, projectAPI } from '../../services/api';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const projectsResponse = await projectAPI.getAll();
      setProjects(projectsResponse.data);
      
      // Load tasks from all projects (filtered by user on backend)
      const allTasks: Task[] = [];
      for (const project of projectsResponse.data) {
        try {
          const tasksResponse = await taskAPI.getByProject(project.id);
          // Filter tasks assigned to current user
          const userTasks = tasksResponse.data.filter(task => task.assigned_to === user?.id);
          allTasks.push(...userTasks);
        } catch (err) {
          console.error(`Failed to load tasks for project ${project.id}`);
        }
      }
      setTasks(allTasks);
    } catch (err) {
      console.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'done').length,
    inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
    pendingTasks: tasks.filter(t => t.status === 'todo').length,
    assignedProjects: projects.length,
  };

  const completionRate = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'success';
      case 'in_progress': return 'warning';
      case 'todo': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.username}!
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ width: 64, height: 64, mr: 2, bgcolor: 'primary.main' }}>
                  <Person fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h6">{user?.username}</Typography>
                  <Typography color="textSecondary">{user?.email}</Typography>
                  <Chip 
                    label={user?.role} 
                    size="small" 
                    color="primary" 
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/profile')}
              >
                View Profile
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Assignment color="primary" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="h6">{stats.totalTasks}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Tasks
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <CheckCircle color="success" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="h6">{stats.completedTasks}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Completed
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Schedule color="warning" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="h6">{stats.inProgressTasks}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        In Progress
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Work color="secondary" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="h6">{stats.assignedProjects}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Projects
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Progress Overview
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Overall Completion</Typography>
                  <Typography variant="body2">{completionRate.toFixed(1)}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={completionRate} 
                  color="success"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="success.main">
                      {stats.completedTasks}
                    </Typography>
                    <Typography variant="body2">Done</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="warning.main">
                      {stats.inProgressTasks}
                    </Typography>
                    <Typography variant="body2">In Progress</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="text.secondary">
                      {stats.pendingTasks}
                    </Typography>
                    <Typography variant="body2">To Do</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Tasks
              </Typography>
              {loading ? (
                <LinearProgress />
              ) : (
                <Box>
                  {tasks.slice(0, 5).map((task) => (
                    <Box 
                      key={task.id} 
                      sx={{ 
                        mb: 2, 
                        p: 2, 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 1,
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                        <Typography variant="subtitle2">{task.title}</Typography>
                        <Chip 
                          label={task.priority} 
                          size="small" 
                          color={getPriorityColor(task.priority) as any}
                        />
                      </Box>
                      <Typography variant="body2" color="textSecondary" mb={1}>
                        {task.description}
                      </Typography>
                      <Chip 
                        label={task.status.replace('_', ' ')} 
                        size="small" 
                        color={getStatusColor(task.status) as any}
                      />
                    </Box>
                  ))}
                  {tasks.length === 0 && (
                    <Typography color="textSecondary" textAlign="center">
                      No tasks assigned yet
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};