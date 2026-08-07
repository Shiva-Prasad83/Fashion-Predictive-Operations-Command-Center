import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import WorkflowQueuesPage from './pages/WorkflowQueuesPage';
import ForecastCapacityPage from './pages/ForecastCapacityPage';
import TaskAssignmentPage from './pages/TaskAssignmentPage';
import DemandPredictionsPage from './pages/DemandPredictionsPage';
import AnomalyRiskPage from './pages/AnomalyRiskPage';
import PreventiveActionsPage from './pages/PreventiveActionsPage';
import ReportsPage from './pages/ReportsPage';
import NotificationsPage from './pages/NotificationsPage';
import UserManagementPage from './pages/UserManagementPage';
import AuditSettingsPage from './pages/AuditSettingsPage';

// Protected route wrapper
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const roleHierarchy = { 'Operations Admin': 4, 'Manager': 3, 'Analyst': 2, 'Field Staff': 1 };
  if (requiredRole && (roleHierarchy[user?.role] || 0) < (roleHierarchy[requiredRole] || 0)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm">Initialising...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignupPage />} />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="workflows" element={<WorkflowQueuesPage />} />
        <Route path="forecast" element={<ForecastCapacityPage />} />
        <Route path="tasks" element={<TaskAssignmentPage />} />
        <Route path="predictions" element={<DemandPredictionsPage />} />
        <Route path="anomalies" element={<AnomalyRiskPage />} />
        <Route path="preventive-actions" element={<PreventiveActionsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="users" element={<ProtectedRoute requiredRole="Manager"><UserManagementPage /></ProtectedRoute>} />
        <Route path="audit" element={<ProtectedRoute requiredRole="Manager"><AuditSettingsPage /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: '#fff', color: '#1e293b', fontSize: '14px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
