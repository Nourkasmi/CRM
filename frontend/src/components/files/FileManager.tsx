import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { ProjectFile, Project, FileType } from '../../types';
import { fileAPI, projectAPI, fileTypeAPI } from '../../services/api';
import DataTableBasic from '../common/DataTableBasic';

export const FileManager: React.FC = () => {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Active/Archived filter state
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived'>('active');

  // Upload dialog states
  const [openUpload, setOpenUpload] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [fileTypes, setFileTypes] = useState<FileType[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');
  const [newFileTypeName, setNewFileTypeName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadFiles();
    loadProjects();
    loadFileTypes();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await fileAPI.getAll(true);
      setFiles(response.data);
    } catch (err) {
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const res = await projectAPI.getAll();
      setProjects(res.data);
    } catch (err) {
      setError('Failed to load projects');
    }
  };

  const loadFileTypes = async () => {
    try {
      const res = await fileTypeAPI.getAll();
      setFileTypes(res.data);
    } catch (err) {
      setError('Failed to load file types');
    }
  };

  const handleDownload = async (fileId: string, filename: string) => {
    try {
      const response = await fileAPI.download(fileId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || 'file');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download file');
    }
  };

  const handleArchive = async (fileId: string, archive: boolean) => {
    try {
      if (archive) {
        await fileAPI.archive(fileId);
      } else {
        await fileAPI.unarchive(fileId);
      }
      await loadFiles();
    } catch (err) {
      setError('Failed to update file status');
    }
  };

  const handleUpload = async () => {
    try {
      let fileTypeId = selectedFileType;

      // If user chose "create new type"
      if (selectedFileType === 'create_new' && newFileTypeName) {
        const res = await fileTypeAPI.create({ name: newFileTypeName });
        fileTypeId = res.data.id;
        await loadFileTypes();
      }

      if (!selectedFile || !selectedProject || !fileTypeId) {
        setError('Please select project, file type, and file');
        return;
      }

      await fileAPI.upload(selectedProject, selectedFile, fileTypeId);
      setOpenUpload(false);
      setSelectedFile(null);
      setSelectedFileType('');
      setNewFileTypeName('');
      await loadFiles();
    } catch (err) {
      setError('Failed to upload file');
    }
  };

  const canModify = user?.role === 'superuser' || user?.role === 'manager';

  // ✅ Prepare rows
  const rows = files
    .filter((f) => (statusFilter === 'active' ? !f.is_archived : f.is_archived))
    .map((file) => [
      `<span>📄 ${file.filename}</span>`,
      file.filetype?.name || '—',
      file.project || '—',
      file.uploaded_by?.email || '—',
      file.is_archived
        ? '<span style="color:gray;">Archived</span>'
        : '<span style="color:green;">Active</span>',
      file.uploaded_at ? new Date(file.uploaded_at).toLocaleString() : '',
      `
        <button class="download-btn" data-id="${file.id}" data-name="${file.filename}">⬇️ Download</button>
        ${
          canModify
            ? file.is_archived
              ? `<button class="unarchive-btn" data-id="${file.id}">Unarchive</button>`
              : `<button class="archive-btn" data-id="${file.id}">Archive</button>`
            : ''
        }
      `,
    ]);

  useEffect(() => {
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const id = target.getAttribute('data-id');
      if (!id) return;

      if (target.classList.contains('download-btn')) {
        const name = target.getAttribute('data-name') || 'file';
        handleDownload(id, name);
      } else if (target.classList.contains('archive-btn')) {
        handleArchive(id, true);
      } else if (target.classList.contains('unarchive-btn')) {
        handleArchive(id, false);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [files]);

  return (
    <Box sx={{ p: 3, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ mb: 3, color: '#1e293b', fontWeight: 600 }}
      >
        Files
      </Typography>

      {/* Active/Archived Filters + Upload button aligned right */}
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" gap={2}>
          <button
            onClick={() => setStatusFilter('active')}
            style={{
              background: statusFilter === 'active' ? '#1976d2' : 'transparent',
              color: statusFilter === 'active' ? '#fff' : '#1976d2',
              border: '1px solid #1976d2',
              borderRadius: '6px',
              padding: '6px 14px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter('archived')}
            style={{
              background: statusFilter === 'archived' ? '#1976d2' : 'transparent',
              color: statusFilter === 'archived' ? '#fff' : '#1976d2',
              border: '1px solid #1976d2',
              borderRadius: '6px',
              padding: '6px 14px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Archived
          </button>
        </Box>

        <Button variant="contained" onClick={() => setOpenUpload(true)}>
          + Upload File
        </Button>
      </Box>

      {/* Upload Dialog */}
      <Dialog open={openUpload} onClose={() => setOpenUpload(false)}>
        <DialogTitle>Upload File</DialogTitle>
        <DialogContent>
          {/* Project Selector */}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Project</InputLabel>
            <Select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* File Type Selector with Create New */}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>File Type</InputLabel>
            <Select
              value={selectedFileType}
              onChange={(e) => setSelectedFileType(e.target.value)}
            >
              {fileTypes.map((ft) => (
                <MenuItem key={ft.id} value={ft.id}>
                  {ft.name}
                </MenuItem>
              ))}
              <MenuItem value="create_new">➕ Create New Type</MenuItem>
            </Select>
          </FormControl>

          {/* Show textfield only if create_new selected */}
          {selectedFileType === 'create_new' && (
            <TextField
              label="New File Type"
              fullWidth
              sx={{ mt: 2 }}
              value={newFileTypeName}
              onChange={(e) => setNewFileTypeName(e.target.value)}
            />
          )}

          {/* File Picker */}
          <Button variant="outlined" component="label" sx={{ mt: 2 }}>
            Choose File
            <input
              type="file"
              hidden
              onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
            />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUpload(false)}>Cancel</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={
              !selectedProject ||
              (!selectedFileType && !newFileTypeName) ||
              !selectedFile
            }
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* KPI Cards */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 4,
          overflowX: 'auto',
          pb: 1,
          '&::-webkit-scrollbar': { height: 6 },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#cbd5e1',
            borderRadius: 3,
          },
        }}
      >
        {[
          { title: 'Total Files', value: files.length, color: '#1976d2', icon: '📂' },
          {
            title: 'Active',
            value: files.filter((f) => !f.is_archived).length,
            color: '#2e7d32',
            icon: '✅',
          },
          {
            title: 'Archived',
            value: files.filter((f) => f.is_archived).length,
            color: '#f57c00',
            icon: '📦',
          },
        ].map((kpi, i) => (
          <Card
            key={i}
            sx={{
              minWidth: 200,
              flex: '0 0 auto',
              borderRadius: 3,
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
              },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
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
                    fontSize: 24,
                  }}
                >
                  {kpi.icon}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* File Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Typography>Loading...</Typography>
          ) : (
            <DataTableBasic
              data={rows}
              columns={[
                'Filename',
                'Type',
                'Project',
                'Uploaded By',
                'Status',
                'Uploaded At',
                'Actions',
              ]}
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
