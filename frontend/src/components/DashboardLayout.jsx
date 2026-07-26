import { useEffect, useMemo, useState } from 'react';
import { Outlet, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../services/api';
import { 
  FolderKanban, Plus, ChevronDown, LogOut, 
  Settings, Folder, LayoutGrid, X, Loader2, Menu,
  CheckSquare, Calendar, Bell, Activity, Users, Search,
  PanelLeftClose, PanelLeftOpen, Circle, ChevronRight
} from 'lucide-react';
import ThemeToggle from './ui/ThemeToggle';

export default function DashboardLayout() {
  const { logout, user } = useAuth();
  const { 
    workspaces, activeWorkspace, setActiveWorkspace, 
    projects, refreshWorkspaces, refreshProjects 
  } = useWorkspace();

  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();

  // Switcher and Modals State
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  // Form Fields State
  const [wsName, setWsName] = useState('');
  const [wsDesc, setWsDesc] = useState('');
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projManagerId, setProjManagerId] = useState('');
  const [workspaceMembers, setWorkspaceMembers] = useState([]);

  const [submittingWs, setSubmittingWs] = useState(false);
  const [submittingProj, setSubmittingProj] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    const openProjectDialog = () => handleOpenProjectModal();
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setShowCommandMenu(true);
      }
      if (event.key === 'Escape') setShowCommandMenu(false);
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

  const activeLinkClass = "flex items-center gap-3 px-3 py-2 rounded-xl bg-[var(--accent-primary-muted)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/15 font-medium text-sm transition-all";
  const inactiveLinkClass = "flex items-center gap-3 px-3 py-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] font-medium text-sm transition-all";

  // Nav items
  const navItems = [
    { path: '/', icon: LayoutGrid, label: 'Dashboard', exact: true },
  ];

  const secondaryNavItems = [
    { icon: CheckSquare, label: 'My Tasks' },
    { icon: Calendar, label: 'Calendar' },
    { icon: Bell, label: 'Notifications' },
    { icon: Activity, label: 'Activity' },
    { icon: Users, label: 'Members' },
    { icon: Settings, label: 'Settings' },
  ];

  const filteredProjects = useMemo(() => projects.filter((project) => (
    project.name.toLowerCase().includes(commandQuery.toLowerCase())
  )), [projects, commandQuery]);

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
      
      {/* Sidebar for Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-40 ${isCollapsed ? 'w-[78px]' : 'w-72'} border-r border-white/[0.08] bg-[#0b1020]/90 shadow-2xl shadow-black/20 backdrop-blur-xl flex flex-col transition-[width,transform] duration-300 lg:translate-x-0 lg:static lg:h-screen lg:sticky lg:top-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Brand Header */}
        <div className={`h-[72px] flex items-center ${isCollapsed ? 'justify-center px-3' : 'justify-between px-5'} border-b border-white/[0.08]`}>
          <Link to="/" className="flex items-center gap-2.5" onClick={() => setMobileMenuOpen(false)} aria-label="Obliq dashboard">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <FolderKanban className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed && <span className="font-bold text-lg bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent tracking-wide">
              Obliq
            </span>}
          </Link>
          {!isCollapsed && <button className="lg:hidden text-[var(--text-tertiary)] hover:text-[var(--text-primary)]" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation">
            <X className="w-5 h-5" />
          </button>}
        </div>

        {/* Workspace Switcher */}
        <div className={`${isCollapsed ? 'px-3 py-4' : 'px-4 py-4'} relative border-b border-white/[0.07]`}>
          <button 
            onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2.5' : 'justify-between px-3.5'} py-2.5 bg-white/[0.035] border border-white/[0.08] rounded-xl text-left hover:border-indigo-400/40 transition-all cursor-pointer group`}
            aria-label="Switch workspace"
          >
            <div className={`min-w-0 flex-1 ${isCollapsed ? 'hidden' : ''}`}>
              <p className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Workspace</p>
              <p className="font-bold text-[var(--text-primary)] text-sm truncate">
                {activeWorkspace ? activeWorkspace.name : 'Select Workspace'}
              </p>
            </div>
            {isCollapsed ? <span className="grid h-4 w-4 place-items-center rounded bg-indigo-500/20 text-[10px] font-bold text-indigo-200">{activeWorkspace?.name?.charAt(0)?.toUpperCase() || 'W'}</span> : <ChevronDown className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform group-hover:text-[var(--text-secondary)] ${showWorkspaceDropdown ? 'rotate-180' : ''}`} />}
          </button>

          {showWorkspaceDropdown && (
            <div className={`absolute ${isCollapsed ? 'left-3 w-64' : 'left-4 right-4'} mt-2 bg-[var(--bg-card)] border border-white/[0.1] rounded-xl shadow-2xl z-50 p-1.5 animate-slide-in`}>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {workspaces.map((ws) => (
                  <button
                    key={ws._id}
                    onClick={() => {
                      setActiveWorkspace(ws);
                      setShowWorkspaceDropdown(false);
                      setMobileMenuOpen(false);
                      navigate('/');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-all ${activeWorkspace?._id === ws._id ? 'bg-[var(--accent-primary-muted)] text-[var(--accent-primary)] font-semibold' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'}`}
                  >
                    <span className="truncate">{ws.name}</span>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => {
                  setShowWorkspaceModal(true);
                  setShowWorkspaceDropdown(false);
                }}
                className="w-full flex items-center gap-2 mt-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] hover:bg-[var(--accent-primary-muted)] border border-dashed border-[var(--accent-primary)]/20 transition-all text-left"
              >
                <Plus className="w-4 h-4" />
                New Workspace
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Nav Links */}
        <nav className={`${isCollapsed ? 'px-3' : 'px-4'} flex-1 overflow-y-auto py-5 space-y-6`}>
          {/* Primary Nav */}
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`${location.pathname === item.path ? activeLinkClass : inactiveLinkClass} ${isCollapsed ? 'justify-center px-2.5' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="w-4 h-4" />
                {!isCollapsed && item.label}
              </Link>
            ))}
          </div>

          {/* Projects Listing */}
          <div>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-3'} mb-2`}>
              {!isCollapsed && <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Projects</span>}
              {activeWorkspace && (
                <button 
                  onClick={handleOpenProjectModal}
                  className="p-1 hover:bg-[var(--bg-card-hover)] hover:text-[var(--accent-primary)] text-[var(--text-muted)] rounded-lg transition-all"
                  title="Create Project"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
            {projects.length === 0 ? (
              <div className={`${isCollapsed ? 'px-2' : 'px-3'} py-3 border border-dashed border-[var(--border-primary)] rounded-xl text-center`}>
                <p className="text-xs text-[var(--text-muted)]">{isCollapsed ? '—' : 'No projects yet'}</p>
              </div>
            ) : (
              <div className="space-y-1">
                {projects.map((proj) => (
                  <Link
                    key={proj._id}
                    to={`/project/${proj._id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`${projectId === proj._id ? activeLinkClass : inactiveLinkClass} ${isCollapsed ? 'justify-center px-2.5' : ''}`}
                    title={isCollapsed ? proj.name : undefined}
                  >
                    <Folder className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span className="truncate">{proj.name}</span>}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Secondary Nav */}
          <div>
            <div className="px-3 mb-2">
              {!isCollapsed && <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Navigation</span>}
            </div>
            <div className="space-y-1">
              {secondaryNavItems.map((item) => (
                <button
                  key={item.label}
                  className={`${inactiveLinkClass} w-full cursor-pointer ${isCollapsed ? 'justify-center px-2.5' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="w-4 h-4" />
                  {!isCollapsed && item.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Bottom section: Theme toggle + User profile */}
        <div className="border-t border-[var(--border-primary)]">
          {/* Theme Toggle */}
          <div className={`${isCollapsed ? 'px-3' : 'px-4'} py-2`}>
            {!isCollapsed && <ThemeToggle />}
            {isCollapsed && <button onClick={() => setIsCollapsed(false)} className="grid w-full place-items-center rounded-xl p-2 text-slate-500 transition hover:bg-white/[0.06] hover:text-white" aria-label="Expand sidebar"><PanelLeftOpen className="w-4 h-4" /></button>}
          </div>

          {/* User Profile */}
          <div className={`${isCollapsed ? 'px-3' : 'p-4 pt-0'}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center p-2' : 'justify-between p-3'} bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl`}>
              <div className="min-w-0 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                  {user ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                {!isCollapsed && <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{user?.name}</p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">{user?.email}</p>
                </div>}
              </div>
              {!isCollapsed && <button 
                onClick={handleLogout}
                className="p-1.5 hover:bg-rose-500/10 hover:text-rose-400 text-[var(--text-muted)] rounded-lg transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>}
            </div>
          </div>
        </div>

      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden" 
          onClick={() => setMobileMenuOpen(false)} 
        />
      )}

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Top Header */}
        <header className="h-[72px] border-b border-white/[0.08] flex items-center justify-between gap-4 px-4 sm:px-6 bg-[#090d16]/75 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 hover:bg-[var(--bg-elevated)] text-[var(--text-tertiary)] rounded-lg transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden lg:grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-white" aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}</button>
            <div className="hidden sm:block"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">Workspace</p><h1 className="mt-0.5 text-sm font-bold text-white">{activeWorkspace ? activeWorkspace.name : 'Obliq'}</h1></div>
          </div>
          <div className="flex flex-1 justify-center">
            <button onClick={() => setShowCommandMenu(true)} className="hidden w-full max-w-[430px] items-center gap-2 rounded-xl border border-white/[0.08] bg-slate-900/50 px-3 py-2 text-left text-xs text-slate-500 transition hover:border-white/[0.15] hover:bg-slate-900 sm:flex" aria-label="Search projects and tasks">
              <Search className="h-4 w-4" /><span className="flex-1">Search anything...</span><kbd className="rounded border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-slate-500">Ctrl K</kbd>
            </button>
          </div>
          <div className="relative flex items-center gap-2">
            <div className="hidden items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-2.5 py-1 sm:flex"><Circle className="h-2 w-2 fill-emerald-400 text-emerald-400" /><span className="text-[10px] font-semibold text-emerald-300">All systems live</span></div>
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-400 transition hover:border-indigo-400/30 hover:text-white" aria-label="Notifications" aria-expanded={showNotifications}><Bell className="h-4 w-4" /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-indigo-400 ring-2 ring-[#0b1020]" /></button>
            {showNotifications && <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-white/[0.1] bg-[#111827]/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl animate-slide-in"><div className="flex items-center justify-between px-3 py-2"><span className="text-sm font-bold text-white">Notifications</span><span className="text-[10px] font-semibold text-indigo-300">2 new</span></div><div className="mt-1 space-y-1"><div className="rounded-xl p-3 hover:bg-white/[0.04]"><p className="text-xs font-medium text-slate-200">Sprint review starts in 30 min</p><p className="mt-1 text-[11px] text-slate-500">Team calendar · now</p></div><div className="rounded-xl p-3 hover:bg-white/[0.04]"><p className="text-xs font-medium text-slate-200">You have tasks due this week</p><p className="mt-1 text-[11px] text-slate-500">Project pulse · 8 min ago</p></div></div></div>}
          </div>
        </header>

        {/* Page Context Outlet */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {activeWorkspace ? (
            <Outlet context={{ activeWorkspace, projects, refreshProjects }} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto">
              <div className="p-4 bg-[var(--accent-primary-muted)] rounded-2xl mb-4 border border-[var(--accent-primary)]/15 text-[var(--accent-primary)]">
                <FolderKanban className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">No Workspaces Found</h3>
              <p className="text-[var(--text-tertiary)] text-sm mt-2">
                Workspaces are central hubs for collaborating on projects. Create one to get started!
              </p>
              <button
                onClick={() => setShowWorkspaceModal(true)}
                className="mt-6 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold rounded-xl flex items-center gap-2 text-sm shadow-lg shadow-indigo-900/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create a Workspace
              </button>
            </div>
          )}
        </main>
      </div>

      {/* NEW WORKSPACE MODAL */}
      {showWorkspaceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-2xl animate-slide-in relative">
            <button 
              onClick={() => setShowWorkspaceModal(false)}
              className="absolute top-4 right-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Create New Workspace</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-[var(--text-tertiary)] text-xs font-semibold mb-1">WORKSPACE NAME</label>
                <input
                  type="text"
                  required
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  placeholder="e.g. Acme Marketing Team"
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-sm"
                />
              </div>
              <div>
                <label className="block text-[var(--text-tertiary)] text-xs font-semibold mb-1">DESCRIPTION (OPTIONAL)</label>
                <textarea
                  value={wsDesc}
                  onChange={(e) => setWsDesc(e.target.value)}
                  placeholder="Describe your workspace, goals, or department..."
                  rows={3}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-sm resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowWorkspaceModal(false)}
                  className="px-4 py-2 border border-[var(--border-primary)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWs}
                  className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-900/20"
                >
                  {submittingWs && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW PROJECT MODAL */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-2xl animate-slide-in relative">
            <button 
              onClick={() => setShowProjectModal(false)}
              className="absolute top-4 right-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Create New Project</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-[var(--text-tertiary)] text-xs font-semibold mb-1">PROJECT NAME</label>
                <input
                  type="text"
                  required
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  placeholder="e.g. Website Redesign"
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-sm"
                />
              </div>
              <div>
                <label className="block text-[var(--text-tertiary)] text-xs font-semibold mb-1">DESCRIPTION (OPTIONAL)</label>
                <textarea
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="Write a brief overview of this project..."
                  rows={3}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-[var(--text-tertiary)] text-xs font-semibold mb-1">PROJECT MANAGER</label>
                <select
                  value={projManagerId}
                  onChange={(e) => setProjManagerId(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] text-sm cursor-pointer"
                >
                  <option value="">Default: You ({user?.name || 'Creator'})</option>
                  {workspaceMembers.filter(m => m.user).map((m) => (
                    <option key={m.user._id} value={m.user._id}>
                      {m.user.name} ({m.user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 border border-[var(--border-primary)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProj}
                  className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-900/20"
                >
                  {submittingProj && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCommandMenu && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh] sm:pt-[18vh]" role="dialog" aria-modal="true" aria-label="Quick search">
          <button className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" onClick={() => setShowCommandMenu(false)} aria-label="Close quick search" />
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/[0.12] bg-[#101827]/95 shadow-2xl shadow-black/50 backdrop-blur-xl animate-scale-in">
            <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3">
              <Search className="h-5 w-5 text-indigo-300" />
              <input autoFocus value={commandQuery} onChange={(event) => setCommandQuery(event.target.value)} placeholder="Search projects..." className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
              <kbd className="rounded border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-500">ESC</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              <p className="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">Projects</p>
              {filteredProjects.length ? filteredProjects.map((project) => (
                <button key={project._id} onClick={() => { navigate(`/project/${project._id}`); setShowCommandMenu(false); setCommandQuery(''); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/[0.06]">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-500/10 text-indigo-300"><Folder className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-200">{project.name}</span><span className="mt-0.5 block truncate text-[11px] text-slate-500">{project.description || 'Open project board'}</span></span>
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </button>
              )) : <div className="px-3 py-8 text-center text-sm text-slate-500">No matching projects.</div>}
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.08] px-4 py-2.5 text-[10px] text-slate-600"><span>Navigate your workspace faster</span><span>↵ to open</span></div>
          </div>
        </div>
      )}

    </div>
  );
}
