import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { theme } from "./theme";
import { AuthProvider } from "./contexts/AuthContext";
import { Layout } from "./components/layout/Layout";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import { SuperuserDashboard } from "./components/dashboard/SuperuserDashboard";
import { ManagerDashboard } from "./components/dashboard/ManagerDashboard";
import { UserDashboard } from "./components/dashboard/UserDashboard";
import { ProjectDetail } from "./components/projects/ProjectDetail";
import { useAuth } from "./contexts/AuthContext";
import { ProjectPhaseTaskSplit } from "./components/projects/ProjectPhaseTaskSplit";
import { UserList } from "./components/users/UserList";
import FilesPage from "./components/files/FilesPage";


// ✅ Forgot & Reset Password components
import { ForgotPassword } from "./components/auth/ForgotPassword";
import { ResetPassword } from "./components/auth/ResetPassword";

// ✅ Task board
import { TaskBoard } from "./components/tasks/TaskBoard";

const DashboardRouter: React.FC = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case "superuser":
      return <SuperuserDashboard />;
    case "manager":
      return <ManagerDashboard />;
    case "user":
    default:
      return <UserDashboard />;
  }
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ✅ Forgot & Reset Password Routes */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/dashboard" element={<DashboardRouter />} />

                      {/* 🔹 Replace ProjectList with Split View */}
                      <Route path="/projects" element={<ProjectPhaseTaskSplit />} />
                      <Route path="/projects/:id" element={<ProjectDetail />} />

                      <Route path="/users" element={<UserList />} />
                      <Route path="/tasks" element={<TaskBoard projectId={1} />} />
                      {/* NOTE: projectId={1} is a placeholder.
                          Later you can make a global AllTasksPage 
                          or handle dynamic project IDs. */}
                          
                      <Route path="/" element={<Navigate to="/dashboard" />} />
                      <Route path="/files" element={<FilesPage />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
