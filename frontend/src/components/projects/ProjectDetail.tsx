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
    }
  }, [id]);

  const loadProject = async () => {
    if (!id) return;
    
    try {
      const response = await projectAPI.getById(parseInt(id));
      setProject(response.data);
    } catch (err) {
      setError('Failed to load project');
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

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error || !project) {
    return <Alert severity="error">{error || 'Project not found'}</Alert>;
  }

  return (
    <Box>
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
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Project Details
                </Typography>
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">
                    Status
                  </Typography>
                  <Chip 
                    label={project.status} 
                    color={getStatusColor(project.status) as any}
                    size="small"
                  />
                </Box>
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
          <PhaseList projectId={project.id} />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <TaskBoard projectId={project.id} />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <FileManager projectId={project.id} />
        </TabPanel>
      </Card>
    </Box>
  );
};