import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  LinearProgress,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { 
  CloudUpload, 
  Download, 
  Archive, 
  Delete, 
  Unarchive,
  InsertDriveFile 
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { ProjectFile } from '../../types';
import { fileAPI } from '../../services/api';

interface FileManagerProps {
  projectId: number;
}

export const FileManager: React.FC<FileManagerProps> = ({ projectId }) => {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadFiles();
  }, [projectId]);

  const loadFiles = async () => {
    try {
      const response = await fileAPI.getByProject(projectId);
      setFiles(response.data);
    } catch (err) {
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    try {
      await fileAPI.upload(projectId, selectedFile);
      await loadFiles();
      setUploadDialogOpen(false);
      setSelectedFile(null);
    } catch (err) {
      setError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file: ProjectFile) => {
    try {
      const response = await fileAPI.download(file.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.original_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download file');
    }
  };

  const handleArchive = async (fileId: number) => {
    try {
      await fileAPI.archive(fileId);
      await loadFiles();
    } catch (err) {
      setError('Failed to archive file');
    }
  };

  const handleDelete = async (fileId: number) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await fileAPI.delete(fileId);
        await loadFiles();
      } catch (err) {
        setError('Failed to delete file');
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canModify = user?.role === 'superuser' || user?.role === 'manager';

  const columns: GridColDef[] = [
    { 
      field: 'original_name', 
      headerName: 'Name', 
      width: 250, 
      flex: 1,
      renderCell: (params) => (
        <Box display="flex" alignItems="center">
          <InsertDriveFile sx={{ mr: 1, color: 'text.secondary' }} />
          {params.value}
        </Box>
      )
    },
    { field: 'file_type', headerName: 'Type', width: 100 },
    { 
      field: 'size', 
      headerName: 'Size', 
      width: 100,
      valueFormatter: (value) => formatFileSize(value)
    },
    { 
      field: 'is_archived', 
      headerName: 'Status', 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value ? 'Archived' : 'Active'}
          color={params.value ? 'default' : 'success'}
          size="small"
        />
      )
    },
    { 
      field: 'created_at', 
      headerName: 'Uploaded', 
      width: 120,
      valueFormatter: (value) => new Date(value).toLocaleDateString()
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 150,
      getActions: (params) => {
        const actions = [
          <GridActionsCellItem
            icon={<Download />}
            label="Download"
            onClick={() => handleDownload(params.row)}
          />
        ];

        if (canModify) {
          if (params.row.is_archived) {
            actions.push(
              <GridActionsCellItem
                icon={<Unarchive />}
                label="Unarchive"
                onClick={() => handleArchive(params.row.id)}
              />
            );
          } else {
            actions.push(
              <GridActionsCellItem
                icon={<Archive />}
                label="Archive"
                onClick={() => handleArchive(params.row.id)}
              />
            );
          }
          
          actions.push(
            <GridActionsCellItem
              icon={<Delete />}
              label="Delete"
              onClick={() => handleDelete(params.row.id)}
            />
          );
        }

        return actions;
      },
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Project Files</Typography>
        {canModify && (
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload File
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent>
          <DataGrid
            rows={files}
            columns={columns}
            loading={loading}
            autoHeight
            disableRowSelectionOnClick
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            sx={{
              '& .MuiDataGrid-cell:hover': {
                color: 'primary.main',
              },
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)}>
        <DialogTitle>Upload File</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <input
              type="file"
              onChange={handleFileSelect}
              style={{ marginBottom: 16, width: '100%' }}
            />
            {selectedFile && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </Typography>
              </Box>
            )}
            {uploading && <LinearProgress sx={{ mt: 2 }} />}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            variant="contained" 
            disabled={!selectedFile || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};