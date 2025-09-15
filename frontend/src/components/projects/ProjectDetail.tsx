import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Chip,
  Button,
  Alert,
  Grid,
  CircularProgress,
  Container,
} from '@mui/material';
import { Edit, ArrowBack } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Project } from '../../types';
import { projectAPI } from '../../services/api';
import { PhaseList } from '../phases/PhaseList';
import { TaskBoard } from '../tasks/TaskBoard';
import { FileManager } from '../files/FileManager';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadProject();
    } else {
      setError('No project ID provided');
      setLoading(false);
    }
  }, [id]);

  const loadProject = async () => {
    if (!id) {
      setError('No project ID provided');
      setLoading(false);
      return;
    }
    
    console.log('Loading project with ID:', id);
    setLoading(true);
    setError('');
    
    try {
      const response = await projectAPI.getById(id);
      console.log('Project loaded successfully:', response.data);
      setProject(response.data);
    } catch (err: any) {
      console.error('Failed to load project:', err);
      
      // More detailed error handling
      if (err.response?.status === 404) {
        setError('Project not found. It may have been deleted or you may not have access to it.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view this project.');
      } else if (err.response?.status === 401) {
        setError('You need to log in to view this project.');
      } else {
        setError(err.response?.data?.msg || 'Failed to load project. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'primary';
      case 'on_hold': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const canModify = user?.role === 'superuser' || user?.role === 'manager';

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Box textAlign="center">
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Loading project...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/projects')}
            sx={{ mb: 2 }}
          >
            Back to Projects
          </Button>
          <Alert 
            severity="error" 
            action={
              <Button color="inherit" size="small" onClick={loadProject}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        </Box>
      </Container>
    );
  }

  // No project found
  if (!project) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/projects')}
            sx={{ mb: 2 }}
          >
            Back to Projects
          </Button>
          <Alert severity="warning">
            Project not found
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 2 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/projects')}
            sx={{ mr: 2 }}
          >
            Back to Projects
          </Button>
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            {project.name}
          </Typography>
          {canModify && (
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => navigate(`/projects/${project.id}/edit`)}
            >
              Edit Project
            </Button>
          )}
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1" paragraph>
                  {project.description || 'No description provided'}
                </Typography>
                
                {project.deadline && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Deadline
                    </Typography>
                    <Typography variant="body1">
                      {new Date(project.deadline).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
              </Grid>
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Project Details
                  </Typography>
                  
                  {project.created_by && (
                    <Box mb={2}>
                      <Typography variant="body2" color="textSecondary">
                        Created By
                      </Typography>
                      <Typography variant="body1">
                        {project.created_by.email}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box mb={2}>
                    <Typography variant="body2" color="textSecondary">
                      Created
                    </Typography>
                    <Typography variant="body1">
                      {new Date(project.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  
                  <Box mb={2}>
                    <Typography variant="body2" color="textSecondary">
                      Last Updated
                    </Typography>
                    <Typography variant="body1">
                      {new Date(project.updated_at).toLocaleDateString()}
                    </Typography>
                  </Box>

                  {project.managers && project.managers.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="body2" color="textSecondary">
                        Managers
                      </Typography>
                      {project.managers.map((manager, index) => (
                        <Typography key={index} variant="body1">
                          {manager.email}
                        </Typography>
                      ))}
                    </Box>
                  )}

                  {project.members && project.members.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="body2" color="textSecondary">
                        Members
                      </Typography>
                      {project.members.map((member, index) => (
                        <Typography key={index} variant="body1">
                          {member.email}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Phases" />
              <Tab label="Tasks" />
              <Tab label="Files" />
            </Tabs>
          </Box>
          <TabPanel value={tabValue} index={0}>
            <PhaseList projectId={parseInt(project.id)} />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <TaskBoard projectId={parseInt(project.id)} />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <FileManager projectId={parseInt(project.id)} />
          </TabPanel>
        </Card>
      </Box>
    </Container>
  );
};