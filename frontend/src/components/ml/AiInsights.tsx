import React, { useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Chip,
} from "@mui/material";
import {
  UploadFile,
  Assessment,
  BarChart as BarChartIcon,
  TableChart,
} from "@mui/icons-material";
import axios from "../../services/api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#1976d2", "#2e7d32", "#f57c00", "#d32f2f", "#0097a7"];

const AiInsights: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [datasetSummary, setDatasetSummary] = useState<any>(null);
  const [clusterSummary, setClusterSummary] = useState<{ [key: string]: number }>({});
  const [clusterKpis, setClusterKpis] = useState<any>({});
  const [preview, setPreview] = useState<any[]>([]);
  const [nClusters, setNClusters] = useState(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    setError("");

    try {
      const res = await axios.post("/ml/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDatasetSummary(res.data.dataset_summary);
      setClusterSummary(res.data.cluster_summary);
      setClusterKpis(res.data.cluster_kpis);
      setPreview(res.data.rows);
      setNClusters(res.data.n_clusters);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const getClusterColor = (cluster: number) => COLORS[cluster % COLORS.length];

  const chartData = Object.entries(clusterSummary).map(([cluster, count]) => ({
    cluster,
    count,
  }));

  return (
    <Box sx={{ p: 4, bgcolor: "#f9fafb", minHeight: "100vh" }}>
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e293b" }}>
          AI Model Dashboard
        </Typography>
        <Button
          variant="contained"
          component="label"
          startIcon={<UploadFile />}
          sx={{ borderRadius: 2, textTransform: "none" }}
        >
          Upload Dataset
          <input hidden type="file" accept=".csv,.xlsx" onChange={handleFileUpload} />
        </Button>
      </Box>

      {loading && <CircularProgress sx={{ display: "block", mx: "auto", mt: 4 }} />}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* KPI CARDS */}
      {datasetSummary && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { title: "Total Rows", value: datasetSummary.rows },
            { title: "Total Columns", value: datasetSummary.cols },
            { title: "Missing Data (%)", value: (datasetSummary.missing_pct * 100).toFixed(2) },
            { title: "Clusters Detected", value: nClusters },
          ].map((kpi, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card
                sx={{
                  borderRadius: 3,
                  textAlign: "center",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                }}
              >
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    {kpi.title}
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {kpi.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* CLUSTER DISTRIBUTION CHARTS */}
      {Object.keys(clusterSummary).length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <BarChartIcon sx={{ color: "#1976d2" }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Cluster Distribution (Bar)
                  </Typography>
                </Box>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="cluster" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#1976d2">
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={getClusterColor(i)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Assessment sx={{ color: "#2e7d32" }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Cluster Share (Pie)
                  </Typography>
                </Box>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="count"
                      nameKey="cluster"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={getClusterColor(i)} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* CLUSTER KPI TABLE */}
      {Object.keys(clusterKpis).length > 0 && (
        <Card sx={{ borderRadius: 3, mb: 4, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <TableChart sx={{ color: "#f57c00" }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Cluster KPI Averages
              </Typography>
            </Box>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Cluster</TableCell>
                    {Object.keys(Object.values(clusterKpis)[0]).map((col) => (
                      <TableCell key={col}>{col}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(clusterKpis).map(([cluster, metrics]: any, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Chip
                          label={`Cluster ${cluster}`}
                          sx={{
                            bgcolor: getClusterColor(Number(cluster)),
                            color: "#fff",
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      {Object.values(metrics).map((val: any, j) => (
                        <TableCell key={j}>{val}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* DATASET PREVIEW */}
      {preview.length > 0 && (
        <Card sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Dataset Preview (First 10 Rows)
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {Object.keys(preview[0]).map((col) => (
                      <TableCell key={col}>{col}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.map((row, i) => (
                    <TableRow key={i}>
                      {Object.entries(row).map(([key, val]) => (
                        <TableCell
                          key={key}
                          sx={{
                            color:
                              key === "Predicted_Cluster"
                                ? getClusterColor(Number(val))
                                : "inherit",
                            fontWeight:
                              key === "Predicted_Cluster" ? 600 : "normal",
                          }}
                        >
                          {val}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AiInsights;
