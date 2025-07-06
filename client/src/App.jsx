import React from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import LandingPage from './LandingPage';

// Admin pages
import AdminProjects from './pages/admin/Projects';
import CreateProject from './pages/admin/CreateProject';
import ProjectDetail from './pages/admin/ProjectDetail';
import AdminTeams from './pages/admin/Teams';
import ProjectBoard from './pages/admin/ProjectBoard';
import ProjectBacklog from './pages/admin/ProjectBacklog';

// Employee pages
import EmployeeProjects from './pages/employee/EmployeeProjects';
import EmployeeProjectDetail from './pages/employee/EmployeeProjectDetail';
import EmployeeTeams from './pages/employee/EmployeeTeams';

// Shared pages
import Recent from './pages/shared/Recent';
import Starred from './pages/shared/Starred';
import VirtualRoom from './pages/shared/VirtualRoom';
import Meet from './pages/shared/Meet';
import Chat from './pages/shared/Chat';

// Protected Route component for role-based access
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return user.role === 'admin' 
      ? <Navigate to="/admin-dashboard" replace /> 
      : <Navigate to="/employee-dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          
          {/* Admin Dashboard Routes */}
          <Route path="/admin-dashboard" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="recent" replace />} />
            <Route path="recent" element={<Recent />} />
            <Route path="starred" element={<Starred />} />
            <Route path="virtual-room" element={<VirtualRoom />} />
            <Route path="meet" element={<Meet />} />
            <Route path="chat" element={<Chat />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="projects/create" element={<CreateProject />} />
            <Route path="projects/:id" element={<ProjectDetail />}>
              <Route index element={<Navigate to="board" replace />} />
              <Route path="board" element={<ProjectBoard />} />
              <Route path="backlog" element={<ProjectBacklog />} />
              <Route path="attachments" element={null} />
            </Route>
            <Route path="teams" element={<AdminTeams />} />
          </Route>

          {/* Employee Dashboard Routes */}
          <Route path="/employee-dashboard" element={
            <ProtectedRoute requiredRole="employee">
              <EmployeeDashboard />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="recent" replace />} />
            <Route path="recent" element={<Recent />} />
            <Route path="starred" element={<Starred />} />
            <Route path="virtual-room" element={<VirtualRoom />} />
            <Route path="meet" element={<Meet />} />
            <Route path="chat" element={<Chat />} />
            <Route path="projects" element={<EmployeeProjects />} />
            <Route path="projects/:projectId" element={<EmployeeProjectDetail />} />
            <Route path="teams" element={<EmployeeTeams />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
