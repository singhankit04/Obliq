import { useEffect, useMemo, useState } from 'react';
import { Outlet, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useSocket } from '../context/SocketContext';
import { useSidebarStore } from '../store/useSidebarStore';
import { useCommandStore } from '../store/useCommandStore';
import { api } from '../services/api';
import {
  FolderKanban, Plus, ChevronDown, LogOut,
  Settings, Folder, LayoutGrid, X, Loader2, Menu,
  CheckSquare, Calendar, Bell, Activity, Users, Search,
  PanelLeftClose, PanelLeftOpen, Circle,
} from 'lucide-react';

import CommandPalette from './ui/CommandPalette';
import Dialog from './ui/Dialog';
import Button from './ui/Button';
import Avatar from './ui/Avatar';
import Badge from './ui/Badge';
import { useToast } from './ui/Toast';
import { cn } from '../lib/cn';

export default function DashboardLayout() {
  const { logout, user } = useAuth();
  const { socket, isConnected } = useSocket();
  const { addToast } = useToast();
  const {
    workspaces, activeWorkspace, setActiveWorkspace,
    projects, refreshWorkspaces, refreshProjects,
  } = useWorkspace();

  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();

  // Zustand stores
  const { isCollapsed, toggle: toggleSidebar, isMobileOpen, openMobile, closeMobile } = useSidebarStore();
  const { open: openCommand } = useCommandStore();

  // Local UI state
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Form state
  const [wsName, setWsName] = useState('');
  const [wsDesc, setWsDesc] = useState('');
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projManagerId, setProjManagerId] = useState('');
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [submittingWs, setSubmittingWs] = useState(false);
  const [submittingProj, setSubmittingProj] = useState(false);
  const [error, setError] = useState('');

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [notifData, countData] = await Promise.all([
          api.getNotifications(),
          api.getUnreadCount(),
        ]);
        setNotifications(notifData.notifications || []);
        setUnreadCount(countData.unreadCount || 0);
      } catch {
        // Notifications API may not be available yet
      }
    };
    fetchNotifications();
  }, []);

  // Listen to real-time notifications via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (newNotif) => {
      console.log('🔔 [Socket.IO] New notification received:', newNotif);

      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Trigger real-time toast alert
      if (addToast) {
        addToast({
          title: newNotif.title || 'New Notification',
          message: newNotif.message || 'You have a new update in your workspace.',
          type: 'info',
        });
      }
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, addToast]);

  // Handle Workspace creation
  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!wsName.trim()) return;
    setSubmittingWs(true);
    setError('');
    try {
      const data = await api.createWorkspace(wsName, wsDesc);
      await refreshWorkspaces();
      setActiveWorkspace(data.workspace);
      setWsName('');
      setWsDesc('');
      setShowWorkspaceModal(false);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to create workspace.');
    } finally {
      setSubmittingWs(false);
    }
  };

  // Fetch workspace members when project modal opens
  const handleOpenProjectModal = async () => {
    setError('');
    setProjName('');
    setProjDesc('');
    setProjManagerId('');
    setShowProjectModal(true);
    if (activeWorkspace) {
      try {
        const data = await api.getWorkspaceMembers(activeWorkspace._id);
        setWorkspaceMembers(data.members || []);
      } catch (err) {
        console.error('Failed to load workspace members for manager selection', err);
      }
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const openProjectDialog = () => handleOpenProjectModal();
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openCommand();
      }
    };
    window.addEventListener('obliq:create-project', openProjectDialog);
    window.addEventListener('keydown', handleShortcut);
    return () => {
      window.removeEventListener('obliq:create-project', openProjectDialog);
      window.removeEventListener('keydown', handleShortcut);
    };
  });

  // Handle Project creation
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projName.trim() || !activeWorkspace) return;
    setSubmittingProj(true);
    setError('');
    try {
      await api.createProject(activeWorkspace._id, projName, projDesc, projManagerId || null);
      await refreshProjects();
      setProjName('');
      setProjDesc('');
      setProjManagerId('');
      setShowProjectModal(false);
    } catch (err) {
      setError(err.message || 'Failed to create project.');
    } finally {
      setSubmittingProj(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  const handleNotificationClick = async (notif) => {
    const isUnread = !notif.isRead && !notif.read;
    if (isUnread) {
      try {
        await api.markAsRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // silent
      }
    }
    setShowNotifications(false);

    // Navigate to invite link, task, or project if present
    const inviteToken = notif.data?.inviteToken || notif.inviteToken;
    const projId = notif.project?._id || notif.project;
    const taskId = notif.task?._id || notif.task;

    if (inviteToken) {
      navigate(`/invitation/${inviteToken}`);
    } else if (projId && taskId) {
      navigate(`/project/${projId}/task/${taskId}`);
    } else if (projId) {
      navigate(`/project/${projId}`);
    }
  };

  // Nav items
  const navItems = [
    { path: '/', icon: LayoutGrid, label: 'Dashboard', exact: true },
  ];

  const secondaryNavItems = [
    { icon: CheckSquare, label: 'My Tasks' },
    { icon: Calendar, label: 'Calendar' },
    { icon: Activity, label: 'Activity' },
    { icon: Users, label: 'Members' },
    { icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)] text-[var(--text-primary)]">

      {/* ════════ SIDEBAR ════════ */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-zinc-800 bg-[var(--bg-sidebar)]',
          'transition-[width] duration-200 ease-out',
          isCollapsed ? 'w-[68px]' : 'w-[260px]',
          'lg:translate-x-0 lg:static lg:h-screen lg:sticky lg:top-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className={cn(
          'h-14 flex items-center border-b border-zinc-800 shrink-0',
          isCollapsed ? 'justify-center px-3' : 'justify-between px-4'
        )}>
          <Link
            to="/"
            className="flex items-center gap-2.5"
            onClick={closeMobile}
            aria-label="Obliq dashboard"
          >
            <img src="/favicon.svg" alt="Obliq Logo" className="w-8 h-8 rounded-lg shadow-sm shadow-blue-600/20" />
            {!isCollapsed && (
              <span className="font-bold text-base text-zinc-100 tracking-tight">
                Obliq
              </span>
            )}
          </Link>
          {!isCollapsed && (
            <button
              className="lg:hidden text-zinc-500 hover:text-zinc-200 p-1 rounded-lg"
              onClick={closeMobile}
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Workspace Switcher */}
        <div className={cn('relative border-b border-zinc-800', isCollapsed ? 'px-2 py-3' : 'px-3 py-3')}>
          <button
            onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
            className={cn(
              'w-full flex items-center gap-2.5 py-2 rounded-xl text-left hover:bg-zinc-800/60 transition-colors cursor-pointer',
              isCollapsed ? 'justify-center px-2' : 'px-3'
            )}
            aria-label="Switch workspace"
          >
            <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
              {activeWorkspace?.name?.charAt(0)?.toUpperCase() || 'W'}
            </div>
            {!isCollapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-zinc-200 truncate">
                    {activeWorkspace ? activeWorkspace.name : 'Select Workspace'}
                  </p>
                </div>
                <ChevronDown className={cn(
                  'w-3.5 h-3.5 text-zinc-500 transition-transform',
                  showWorkspaceDropdown && 'rotate-180'
                )} />
              </>
            )}
          </button>

          {/* Workspace Dropdown */}
          <AnimatePresence>
            {showWorkspaceDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                className={cn(
                  'absolute z-50 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl shadow-black/30 p-1',
                  isCollapsed ? 'left-2 w-56' : 'left-3 right-3'
                )}
              >
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {workspaces.map((ws) => (
                    <button
                      key={ws._id}
                      onClick={() => {
                        setActiveWorkspace(ws);
                        setShowWorkspaceDropdown(false);
                        closeMobile();
                        navigate('/');
                      }}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                        activeWorkspace?._id === ws._id
                          ? 'bg-blue-500/10 text-blue-400 font-semibold'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                      )}
                    >
                      <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 shrink-0">
                        {ws.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate">{ws.name}</span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-zinc-800 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setShowWorkspaceModal(true);
                      setShowWorkspaceDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-blue-400 hover:bg-blue-500/10 transition-colors text-left"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Workspace
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav Links */}
        <nav className={cn('flex-1 overflow-y-auto py-4 space-y-6', isCollapsed ? 'px-2' : 'px-3')}>
          {/* Primary Nav */}
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={closeMobile}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                    isCollapsed && 'justify-center px-2',
                    isActive
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60'
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && item.label}
                </Link>
              );
            })}
          </div>

          {/* Projects */}
          <div>
            <div className={cn('flex items-center mb-2', isCollapsed ? 'justify-center' : 'justify-between px-3')}>
              {!isCollapsed && (
                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">
                  Projects
                </span>
              )}
              {activeWorkspace && (
                <button
                  onClick={handleOpenProjectModal}
                  className="p-1 hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300 rounded-lg transition-colors"
                  title="Create Project"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {projects.length === 0 ? (
              <div className={cn(
                'border border-dashed border-zinc-800 rounded-xl text-center',
                isCollapsed ? 'px-2 py-3' : 'px-3 py-4'
              )}>
                <p className="text-xs text-zinc-600">
                  {isCollapsed ? '—' : 'No projects yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {projects.map((proj) => {
                  const isActive = projectId === proj._id;
                  return (
                    <Link
                      key={proj._id}
                      to={`/project/${proj._id}`}
                      onClick={closeMobile}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                        isCollapsed && 'justify-center px-2',
                        isActive
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60'
                      )}
                      title={isCollapsed ? proj.name : undefined}
                    >
                      <Folder className="w-4 h-4 shrink-0" />
                      {!isCollapsed && <span className="truncate">{proj.name}</span>}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Secondary Nav */}
          <div>
            {!isCollapsed && (
              <div className="px-3 mb-2">
                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">
                  Navigation
                </span>
              </div>
            )}
            <div className="space-y-0.5">
              {secondaryNavItems.map((item) => (
                <button
                  key={item.label}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors cursor-pointer',
                    isCollapsed && 'justify-center px-2'
                  )}
                  onClick={closeMobile}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && item.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Bottom section */}
        <div className="border-t border-zinc-800 shrink-0 pt-2">
          {/* User Profile */}
          <div className={cn(isCollapsed ? 'px-2 pb-3' : 'px-3 pb-3')}>
            <div className={cn(
              'flex items-center rounded-xl bg-zinc-800/50 border border-zinc-800',
              isCollapsed ? 'justify-center p-2' : 'justify-between p-2.5'
            )}>
              <div className="min-w-0 flex items-center gap-2.5">
                <Avatar name={user?.name} size="sm" />
                {!isCollapsed && (
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-200 truncate">{user?.name}</p>
                    <p className="text-[10px] text-zinc-600 truncate">{user?.email}</p>
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <button
                  onClick={handleLogout}
                  className="p-1.5 hover:bg-red-500/10 hover:text-red-400 text-zinc-500 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>

      {/* ════════ MAIN CONTENT ════════ */}
      <div className="flex-1 flex flex-col min-w-0 relative">

        {/* Top Navbar */}
        <header className="h-14 border-b border-zinc-800 flex items-center justify-between gap-4 px-4 sm:px-6 bg-[var(--bg-primary)]/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <button
              onClick={openMobile}
              className="lg:hidden p-1.5 hover:bg-zinc-800 text-zinc-500 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Sidebar toggle (desktop) */}
            <button
              onClick={toggleSidebar}
              className="hidden lg:grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
            {/* Workspace name */}
            <div className="hidden sm:block">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Workspace</p>
              <h1 className="text-sm font-bold text-zinc-100 -mt-0.5">
                {activeWorkspace ? activeWorkspace.name : 'Obliq'}
              </h1>
            </div>
          </div>

          {/* Search trigger */}
          <div className="flex flex-1 justify-center">
            <button
              onClick={openCommand}
              className="hidden sm:flex w-full max-w-[420px] items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-left text-xs text-zinc-500 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
              aria-label="Search projects and tasks"
            >
              <Search className="h-4 w-4" />
              <span className="flex-1">Search anything...</span>
              <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Status */}
            <div className={cn(
              "hidden sm:flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold",
              isConnected
                ? "border-emerald-500/15 bg-emerald-500/5 text-emerald-400"
                : "border-amber-500/15 bg-amber-500/5 text-amber-400"
            )}>
              <Circle className={cn("h-2 w-2 fill-current", isConnected ? "text-emerald-400" : "text-amber-400")} />
              <span>{isConnected ? "Live" : "Connecting..."}</span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative grid h-9 w-9 place-items-center rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 h-4 min-w-4 rounded-full bg-blue-600 text-[9px] font-bold text-white flex items-center justify-center px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification panel */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-zinc-800 bg-zinc-900 p-2 shadow-xl shadow-black/40"
                  >
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-sm font-bold text-zinc-100">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="mt-1 space-y-0.5 max-h-64 overflow-y-auto">
                      {notifications.length > 0 ? notifications.slice(0, 8).map((notif) => {
                        const isUnread = !notif.isRead && !notif.read;
                        return (
                          <div
                            key={notif._id}
                            onClick={() => handleNotificationClick(notif)}
                            className={cn(
                              'rounded-xl p-3 transition-colors hover:bg-zinc-800/60 cursor-pointer',
                              isUnread && 'bg-blue-500/5 font-medium'
                            )}
                          >
                            <div className="flex items-start gap-2">
                              {isUnread && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                              )}
                              <div className={!isUnread ? 'ml-3.5' : ''}>
                                <p className="text-xs text-zinc-200">{notif.title ? `${notif.title}: ${notif.message}` : (notif.message || notif.content)}</p>
                                <p className="mt-0.5 text-[10px] text-zinc-500">
                                  {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      }) : (
                        <div className="py-8 text-center text-xs text-zinc-600">
                          No notifications yet
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="rounded-xl transition-colors hover:bg-zinc-800 p-1"
              >
                <Avatar name={user?.name} size="sm" />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-11 z-50 w-52 rounded-xl border border-zinc-800 bg-zinc-900 p-1 shadow-xl shadow-black/40"
                  >
                    <div className="px-3 py-2 border-b border-zinc-800 mb-1">
                      <p className="text-xs font-semibold text-zinc-200">{user?.name}</p>
                      <p className="text-[10px] text-zinc-600 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => { setShowUserMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors text-left"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Settings
                    </button>
                    <button
                      onClick={() => { setShowUserMenu(false); handleLogout(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {activeWorkspace ? (
            <Outlet context={{ activeWorkspace, projects, refreshProjects }} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 p-2.5">
                <img src="/favicon.svg" alt="Obliq Logo" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100">No Workspaces Found</h3>
              <p className="text-zinc-500 text-sm mt-2">
                Workspaces are central hubs for collaborating on projects. Create one to get started!
              </p>
              <Button
                variant="gradient"
                icon={Plus}
                onClick={() => setShowWorkspaceModal(true)}
                className="mt-6"
              >
                Create a Workspace
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette />

      {/* ════════ WORKSPACE MODAL ════════ */}
      <Dialog
        open={showWorkspaceModal}
        onClose={() => setShowWorkspaceModal(false)}
        title="Create New Workspace"
        description="Workspaces organize your team's projects in one place."
      >
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
            {error}
          </div>
        )}
        <form onSubmit={handleCreateWorkspace} className="space-y-4">
          <div>
            <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">
              Workspace Name
            </label>
            <input
              type="text"
              required
              value={wsName}
              onChange={(e) => setWsName(e.target.value)}
              placeholder="e.g. Acme Marketing Team"
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm"
            />
          </div>
          <div>
            <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">
              Description (Optional)
            </label>
            <textarea
              value={wsDesc}
              onChange={(e) => setWsDesc(e.target.value)}
              placeholder="Describe your workspace..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowWorkspaceModal(false)}>
              Cancel
            </Button>
            <Button variant="gradient" type="submit" loading={submittingWs}>
              Create Workspace
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ════════ PROJECT MODAL ════════ */}
      <Dialog
        open={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        title="Create New Project"
        description="Projects give tasks a home, visibility, and a shared finish line."
      >
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
            {error}
          </div>
        )}
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">
              Project Name
            </label>
            <input
              type="text"
              required
              value={projName}
              onChange={(e) => setProjName(e.target.value)}
              placeholder="e.g. Website Redesign"
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm"
            />
          </div>
          <div>
            <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">
              Description (Optional)
            </label>
            <textarea
              value={projDesc}
              onChange={(e) => setProjDesc(e.target.value)}
              placeholder="Write a brief overview..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">
              Project Manager
            </label>
            <select
              value={projManagerId}
              onChange={(e) => setProjManagerId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-blue-500 text-sm cursor-pointer"
            >
              <option value="">Default: You ({user?.name || 'Creator'})</option>
              {workspaceMembers.filter((m) => m.user).map((m) => (
                <option key={m.user._id} value={m.user._id}>
                  {m.user.name} ({m.user.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowProjectModal(false)}>
              Cancel
            </Button>
            <Button variant="gradient" type="submit" loading={submittingProj}>
              Create Project
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Click-away listeners */}
      {(showNotifications || showUserMenu || showWorkspaceDropdown) && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            setShowNotifications(false);
            setShowUserMenu(false);
            setShowWorkspaceDropdown(false);
          }}
        />
      )}
    </div>
  );
}
