import { useState } from 'react';
import { Outlet, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../services/api';
import { 
  FolderKanban, Plus, ChevronDown, LogOut, User as UserIcon, 
  Settings, Folder, LayoutGrid, X, Loader2, Menu
} from 'lucide-react';

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

  const activeLinkClass = "flex items-center gap-3 px-3 py-2 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/20 font-medium text-sm transition-all";
  const inactiveLinkClass = "flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 font-medium text-sm transition-all";

  return (
    <div className="min-h-screen flex bg-[#080b11] text-slate-200">
      
      {/* Sidebar for Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0c0f16]/95 border-r border-slate-800/60 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/50">
          <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-900/20">
              <FolderKanban className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent tracking-wide">
              Obliq
            </span>
          </Link>
          <button className="lg:hidden text-slate-400 hover:text-slate-200" onClick={() => setMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Switcher */}
        <div className="px-4 py-4 relative border-b border-slate-800/50">
          <button 
            onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-left hover:border-slate-700 hover:bg-slate-900 transition-all cursor-pointer group"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Workspace</p>
              <p className="font-bold text-slate-200 text-sm truncate">
                {activeWorkspace ? activeWorkspace.name : 'Select Workspace'}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform group-hover:text-slate-300 ${showWorkspaceDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showWorkspaceDropdown && (
            <div className="absolute left-4 right-4 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-1.5 animate-slide-in">
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-all ${activeWorkspace?._id === ws._id ? 'bg-purple-600/20 text-purple-300 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
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
                className="w-full flex items-center gap-2 mt-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-purple-400 hover:text-purple-300 hover:bg-purple-600/10 border border-dashed border-purple-500/20 transition-all text-left"
              >
                <Plus className="w-4 h-4" />
                New Workspace
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          <div className="space-y-1">
            <Link 
              to="/" 
              onClick={() => setMobileMenuOpen(false)}
              className={location.pathname === '/' ? activeLinkClass : inactiveLinkClass}
            >
              <LayoutGrid className="w-4 h-4" />
              Workspace Hub
            </Link>
          </div>

          {/* Projects Listing */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Projects</span>
              {activeWorkspace && (
                <button 
                  onClick={handleOpenProjectModal}
                  className="p-1 hover:bg-slate-850 hover:text-purple-400 text-slate-500 rounded-lg transition-all"
                  title="Create Project"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
            {projects.length === 0 ? (
              <div className="px-3 py-3 border border-dashed border-slate-850 rounded-xl text-center">
                <p className="text-xs text-slate-650">No projects yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {projects.map((proj) => (
                  <Link
                    key={proj._id}
                    to={`/project/${proj._id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className={projectId === proj._id ? activeLinkClass : inactiveLinkClass}
                  >
                    <Folder className="w-4 h-4 shrink-0" />
                    <span className="truncate">{proj.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Bottom User profile */}
        <div className="p-4 border-t border-slate-800/50 bg-slate-900/10">
          <div className="flex items-center justify-between bg-slate-900/40 border border-slate-800/40 p-3 rounded-xl">
            <div className="min-w-0 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-semibold border border-slate-700 text-sm">
                {user ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 hover:bg-red-500/10 hover:text-red-400 text-slate-500 rounded-lg transition-all"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </aside>

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/60 flex items-center justify-between px-6 bg-[#0c0f16]/60 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 hover:bg-slate-800 text-slate-400 rounded-lg transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              {activeWorkspace ? activeWorkspace.name : 'Obliq Manager'}
            </h1>
          </div>
        </header>

        {/* Page Context Outlet */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {activeWorkspace ? (
            <Outlet context={{ activeWorkspace, projects, refreshProjects }} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto">
              <div className="p-4 bg-purple-600/10 rounded-2xl mb-4 border border-purple-500/20 text-purple-400">
                <FolderKanban className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-200">No Workspaces Found</h3>
              <p className="text-slate-400 text-sm mt-2">
                Workspaces are central hubs for collaborating on projects. Create one to get started!
              </p>
              <button
                onClick={() => setShowWorkspaceModal(true)}
                className="mt-6 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-slate-100 font-semibold rounded-xl flex items-center gap-2 text-sm shadow-lg shadow-purple-900/20 cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-slide-in relative">
            <button 
              onClick={() => setShowWorkspaceModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-100 mb-4">Create New Workspace</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-950/30 border border-red-500/20 rounded-xl text-xs text-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1">WORKSPACE NAME</label>
                <input
                  type="text"
                  required
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  placeholder="e.g. Acme Marketing Team"
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1">DESCRIPTION (OPTIONAL)</label>
                <textarea
                  value={wsDesc}
                  onChange={(e) => setWsDesc(e.target.value)}
                  placeholder="Describe your workspace, goals, or department..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowWorkspaceModal(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWs}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-900/20"
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-slide-in relative">
            <button 
              onClick={() => setShowProjectModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-100 mb-4">Create New Project</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-950/30 border border-red-500/20 rounded-xl text-xs text-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1">PROJECT NAME</label>
                <input
                  type="text"
                  required
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  placeholder="e.g. Website Redesign"
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1">DESCRIPTION (OPTIONAL)</label>
                <textarea
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="Write a brief overview of this project..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1">PROJECT MANAGER</label>
                <select
                  value={projManagerId}
                  onChange={(e) => setProjManagerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-purple-500 text-sm cursor-pointer"
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
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProj}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-900/20"
                >
                  {submittingProj && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
