import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import Layout from './layouts/Layout';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import CheckIn from './pages/CheckIn';
import AttendanceHistory from './pages/AttendanceHistory';
import EmployeeManagement from './pages/EmployeeManagement';
import AttendanceMonitoring from './pages/AttendanceMonitoring';
import { useAuth } from './contexts/AuthContext';

// Protected route component
function ProtectedRoute({ children, requireHR = false }: { children: ReactNode; requireHR?: boolean }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireHR && user?.role !== 'hr_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Public route component - redirects if already logged in
function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="check-in" element={<CheckIn />} />
          <Route path="attendance-history" element={<AttendanceHistory />} />
          <Route path="employees" element={
            <ProtectedRoute requireHR>
              <EmployeeManagement />
            </ProtectedRoute>
          } />
          <Route path="monitoring" element={
            <ProtectedRoute requireHR>
              <AttendanceMonitoring />
            </ProtectedRoute>
          } />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
