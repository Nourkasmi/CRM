import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  LinearProgress,
} from '@mui/material';
import { 
  Work, 
  Assignment, 
  Schedule, 
  TrendingUp,
  Add 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Project, Task } from '../../types';
import { projectAPI, taskAPI } from '../../services/api';

export const ManagerDashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const projectsResponse = await projectAPI.getAll();
      setProjects(projectsResponse.data);
      
      // Load tasks for all projects
      const allTasks: Task[] = [];
      for (const project of projectsResponse.data) {
        try {
          const tasksResponse = await taskAPI.getByProject(project.id);
          allTasks.push(...tasksResponse.data);
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
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'active').length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'done').length,
    inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
    pendingTasks: tasks.filter(t => t.status === 'todo').length,
  };

  const completionRate = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Manager Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Work color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{stats.totalProjects}</Typography>
                  <Typography color="textSecondary">Total Projects</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Assignment color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{stats.totalTasks}</Typography>
                  <Typography color="textSecondary">Total Tasks</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Schedule color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{stats.inProgressTasks}</Typography>
                  <Typography color="textSecondary">In Progress</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{completionRate.toFixed(1)}%</Typography>
                  <Typography color="textSecondary">Completion Rate</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Projects</Typography>
                <Button
                  startIcon={<Add />}
                  variant="outlined"
                  onClick={() => navigate('/projects/new')}
                >
                  New Project
                </Button>
              </Box>
              {loading ? (
                <LinearProgress />
              ) : (
                <Box>
                  {projects.slice(0, 5).map((project) => (
                    <Box key={project.id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Typography variant="subtitle1">{project.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Status: {project.status}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Task Overview
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Completed</Typography>
                  <Typography variant="body2">{stats.completedTasks}</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={completionRate} 
                  color="success"
                  sx={{ mb: 1 }}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">In Progress</Typography>
                  <Typography variant="body2">{stats.inProgressTasks}</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.totalTasks > 0 ? (stats.inProgressTasks / stats.totalTasks) * 100 : 0} 
                  color="warning"
                  sx={{ mb: 1 }}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Pending</Typography>
                  <Typography variant="body2">{stats.pendingTasks}</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.totalTasks > 0 ? (stats.pendingTasks / stats.totalTasks) * 100 : 0} 
                  color="error"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};