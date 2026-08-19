import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { Loader2 } from 'lucide-react';

// Layout & Pages
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import TaskDetail from './pages/TaskDetail';
import AcceptInvite from './pages/AcceptInvite';
import MyTasks from './pages/MyTasks';
import CalendarView from './pages/CalendarView';
import ActivityLog from './pages/ActivityLog';
import MembersView from './pages/MembersView';
import SettingsView from './pages/SettingsView';
import ProjectsView from './pages/ProjectsView';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

// Route Guard for authenticated pages
function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-xs text-zinc-500 font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

// Route Guard for unauthenticated pages (Login/Signup)
function AuthRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return user ? <Navigate to="/" replace /> : <Outlet />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <WorkspaceProvider>
              <SocketProvider>
                <BrowserRouter>
                  <Routes>
                    {/* Public Auth routes */}
                    <Route element={<AuthRoute />}>
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                    </Route>

                    {/* Invitation routes (Accessible whether logged in or out) */}
                    <Route path="/invitation/:token" element={<AcceptInvite />} />
                    <Route path="/invitations/token/:token" element={<AcceptInvite />} />

                    {/* Protected workspace and dashboard routes */}
                    <Route element={<ProtectedRoute />}>
                      <Route element={<DashboardLayout />}>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/projects" element={<ProjectsView />} />
                        <Route path="/my-tasks" element={<MyTasks />} />
                        <Route path="/tasks" element={<MyTasks />} />
                        <Route path="/calendar" element={<CalendarView />} />
                        <Route path="/activity" element={<ActivityLog />} />
                        <Route path="/members" element={<MembersView />} />
                        <Route path="/team" element={<MembersView />} />
                        <Route path="/settings" element={<SettingsView />} />
                        <Route path="/project/:projectId" element={<ProjectDetail />} />
                        <Route path="/project/:projectId/task/:taskId" element={<TaskDetail />} />
                      </Route>
                    </Route>

                    {/* Catch-all route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </BrowserRouter>
              </SocketProvider>
            </WorkspaceProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
