import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Plus, Calendar, User, Trash2, Edit2, 
  X, Loader2, Users,
  FolderOpen, Shield, Trash
} from 'lucide-react';

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const { user: currentUser } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  
  // Loading States
  const [loading, setLoading] = useState(true);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [submittingMember, setSubmittingMember] = useState(false);

  // Modals & Panels State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null); // If set, we are editing. If null, creating.
  const [showMembersModal, setShowMembersModal] = useState(false);

  // Form Fields for Tasks
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskStatus, setTaskStatus] = useState('pending');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssignees, setTaskAssignees] = useState([]);

  // Form Fields for Project Members
  const [selectedWorkspaceMemberIds, setSelectedWorkspaceMemberIds] = useState([]);
  const [memberRole, setMemberRole] = useState('member');

  // Load project details, tasks, and members
  useEffect(() => {
    if (!projectId) return;
    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) setLoading(true);
    });
    Promise.all([
      api.getProject(projectId),
      api.getTasks(projectId),
      api.getProjectMembers(projectId),
      activeWorkspace ? api.getWorkspaceMembers(activeWorkspace._id) : { members: [] }
    ]).then(([projData, taskData, membersData, wsMembersData]) => {
      if (!isMounted) return;
      setProject(projData.project);
      setTasks(taskData.tasks || []);
      setProjectMembers(membersData.members || []);
      setWorkspaceMembers(wsMembersData.members || []);
    }).catch((err) => {
      console.error('Failed to load project details:', err);
      if (isMounted) navigate('/');
    }).finally(() => {
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, [projectId, activeWorkspace, navigate]);

  // Open task modal for creation
  const handleOpenCreateTaskModal = (status = 'pending') => {
    setSelectedTask(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('medium');
    setTaskStatus(status);
    setTaskDueDate('');
    setTaskAssignees([]);
    setShowTaskModal(true);
  };

  // Open task modal for editing
  const handleOpenEditTaskModal = (task) => {
    setSelectedTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskPriority(task.priority || 'medium');
    setTaskStatus(task.status || 'pending');
    
    // Format date for datetime-local or date input: YYYY-MM-DD
    if (task.dueDate) {
      setTaskDueDate(new Date(task.dueDate).toISOString().substring(0, 10));
    } else {
      setTaskDueDate('');
    }
    
    if (Array.isArray(task.assignedTo)) {
      setTaskAssignees(task.assignedTo.map(u => (typeof u === 'object' ? u._id : u)));
    } else if (task.assignedTo) {
      const id = typeof task.assignedTo === 'object' ? task.assignedTo._id : task.assignedTo;
      setTaskAssignees(id ? [id] : []);
    } else {
      setTaskAssignees([]);
    }
    setShowTaskModal(true);
  };

  // Submit Task (Create or Edit)
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setSubmittingTask(true);

    const taskData = {
      title: taskTitle,
      description: taskDesc,
      priority: taskPriority,
      status: taskStatus,
      dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : null,
      assignedTo: taskAssignees,
    };

    try {
      if (selectedTask) {
        // Edit Mode
        await api.updateTask(selectedTask._id, taskData);
      } else {
        // Create Mode
        await api.createTask(projectId, taskData);
      }
      setShowTaskModal(false);
      // Refresh tasks
      const res = await api.getTasks(projectId);
      setTasks(res.tasks || []);
    } catch (err) {
      alert(err.message || 'Failed to save task.');
    } finally {
      setSubmittingTask(false);
    }
  };

  // Quick switch status buttons
  const handleQuickStatusChange = async (task, newStatus) => {
    try {
      await api.updateTask(task._id, { status: newStatus });
      const res = await api.getTasks(projectId);
      setTasks(res.tasks || []);
    } catch (err) {
      alert(err.message || 'Failed to update task status.');
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.deleteTask(taskId);
      setTasks(tasks.filter(t => t._id !== taskId));
    } catch (err) {
      alert(err.message || 'Failed to delete task.');
    }
  };

  // Add Member to Project
  const handleAddProjectMember = async (e) => {
    e.preventDefault();
    if (selectedWorkspaceMemberIds.length === 0) return;
    setSubmittingMember(true);

    try {
      await api.addProjectMember(projectId, selectedWorkspaceMemberIds, memberRole);
      // Refresh project members
      const membersData = await api.getProjectMembers(projectId);
      setProjectMembers(membersData.members || []);
      setSelectedWorkspaceMemberIds([]);
      setMemberRole('member');
    } catch (err) {
      alert(err.message || 'Failed to add project member.');
    } finally {
      setSubmittingMember(false);
    }
  };

  // Remove Member from Project
  const handleRemoveProjectMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this member from the project?')) return;
    try {
      await api.removeProjectMember(projectId, memberId);
      setProjectMembers(projectMembers.filter(m => m._id !== memberId));
    } catch (err) {
      alert(err.message || 'Failed to remove project member.');
    }
  };

  // Filter tasks into their board columns
  const getTasksByStatus = (status) => {
    return tasks.filter(t => t.status === status);
  };

  // Check current project permissions
  const myWorkspaceMembership = workspaceMembers.find(m => m.user?._id === currentUser?.id || m.user?._id === currentUser?._id || m.user?.email === currentUser?.email);
  const isWorkspaceAdmin = myWorkspaceMembership && ['owner', 'manager'].includes(myWorkspaceMembership.role);
  
  const myProjectMembership = projectMembers.find(m => m.user?._id === currentUser?.id || m.user?._id === currentUser?._id || m.user?.email === currentUser?.email);
  const isProjectManager = myProjectMembership?.role === 'manager' || myProjectMembership?.role === 'owner';
  const hasEditRights = isWorkspaceAdmin || isProjectManager;

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // Filter workspace members to show only those who are NOT yet in the project
  const availableWorkspaceMembers = workspaceMembers.filter(
    (wm) => wm.user && !projectMembers.some((pm) => pm.user?._id === wm.user?._id)
  );

  return (
    <div className="space-y-6 animate-slide-in">
      
      {/* Project Meta Information Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/30 border border-slate-800/80 p-6 rounded-2xl">
        <div className="min-w-0">
          <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-full uppercase tracking-wider">
            {project?.status}
          </span>
          <h2 className="text-xl font-bold text-slate-100 mt-2 truncate flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-purple-400 shrink-0" />
            {project?.name}
          </h2>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            {project?.description || 'No project description.'}
          </p>
        </div>

        {/* Project members counter click to manage */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowMembersModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Users className="w-4 h-4 text-purple-400" />
            <span>Members ({projectMembers.length})</span>
          </button>
          
          <button
            onClick={() => handleOpenCreateTaskModal('pending')}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-slate-100 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-purple-900/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Column Generator Helper */}
        {[
          { key: 'pending', title: 'Pending', color: 'border-slate-800 bg-slate-950/20 text-slate-400' },
          { key: 'in-progress', title: 'In Progress', color: 'border-blue-800/40 bg-blue-950/10 text-blue-400' },
          { key: 'completed', title: 'Completed', color: 'border-emerald-800/40 bg-emerald-950/10 text-emerald-400' }
        ].map((col) => {
          const colTasks = getTasksByStatus(col.key);
          return (
            <div key={col.key} className="glass-panel border border-slate-800/80 rounded-2xl flex flex-col max-h-[80vh]">
              {/* Column Header */}
              <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    col.key === 'pending' ? 'bg-slate-500' : col.key === 'in-progress' ? 'bg-blue-500' : 'bg-emerald-500'
                  }`} />
                  <h3 className="font-bold text-slate-200 text-sm">{col.title}</h3>
                  <span className="text-xs text-slate-500 bg-slate-900/80 px-2 py-0.5 rounded-md font-semibold">
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => handleOpenCreateTaskModal(col.key)}
                  className="p-1 hover:bg-slate-800 text-slate-500 hover:text-slate-350 rounded-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Tasks List */}
              <div className="p-4 overflow-y-auto space-y-3.5 divide-y-0 min-h-[40vh]">
                {colTasks.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-slate-850 rounded-xl">
                    <p className="text-xs text-slate-600">No tasks in {col.title}</p>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div 
                      key={task._id} 
                      className="p-4 bg-slate-900/50 border border-slate-800/60 rounded-xl hover:border-slate-700/80 hover:bg-slate-900 transition-all group flex flex-col justify-between relative overflow-hidden"
                    >
                      {/* Priority strip */}
                      <div className={`absolute top-0 left-0 right-0 h-1 ${
                        task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-650'
                      }`} />

                      <div>
                        {/* Title & Actions */}
                        <div className="flex items-start justify-between gap-2 mt-1">
                          <Link
                            to={`/project/${projectId}/task/${task._id}`}
                            className="font-bold text-[var(--text-primary)] text-sm leading-snug hover:text-[var(--accent-primary)] transition-colors"
                          >
                            {task.title}
                          </Link>
                        </div>
                        {task.description && (
                          <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Meta info bottom */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-850">
                        {/* Due Date Indicator */}
                        <div className="flex items-center gap-1 text-[10px] text-slate-550">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'No date'}
                          </span>
                        </div>

                        {/* Assignees Avatars */}
                        <div className="flex items-center -space-x-1.5 overflow-hidden">
                          {Array.isArray(task.assignedTo) && task.assignedTo.length > 0 ? (
                            task.assignedTo.map((assignee, idx) => {
                              const name = typeof assignee === 'object' ? assignee?.name : 'User';
                              const initial = name ? name.charAt(0).toUpperCase() : 'U';
                              return (
                                <div
                                  key={typeof assignee === 'object' ? (assignee?._id || idx) : idx}
                                  className="w-5 h-5 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-[9px] text-purple-300 font-bold shrink-0 shadow-sm"
                                  title={`Assigned to ${name || 'member'}`}
                                >
                                  {initial}
                                </div>
                              );
                            })
                          ) : (
                            <div 
                              className="w-5 h-5 rounded-full bg-slate-950 flex items-center justify-center text-[10px] text-slate-600 border border-slate-800"
                              title="Unassigned"
                            >
                              <User className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons (Appear on hover) */}
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-850/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1">
                          {col.key !== 'pending' && (
                            <button
                              onClick={() => handleQuickStatusChange(task, 'pending')}
                              className="px-1.5 py-0.5 hover:bg-slate-800 rounded text-[9px] text-slate-400 font-semibold"
                            >
                              To Pending
                            </button>
                          )}
                          {col.key !== 'in-progress' && (
                            <button
                              onClick={() => handleQuickStatusChange(task, 'in-progress')}
                              className="px-1.5 py-0.5 hover:bg-slate-800 rounded text-[9px] text-blue-400 font-semibold"
                            >
                              To In Progress
                            </button>
                          )}
                          {col.key !== 'completed' && (
                            <button
                              onClick={() => handleQuickStatusChange(task, 'completed')}
                              className="px-1.5 py-0.5 hover:bg-slate-800 rounded text-[9px] text-emerald-400 font-semibold"
                            >
                              To Done
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditTaskModal(task)}
                            className="p-1 hover:bg-slate-800 hover:text-purple-400 text-slate-500 rounded transition-all"
                            title="Edit task"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="p-1 hover:bg-red-500/10 hover:text-red-400 text-slate-500 rounded transition-all"
                            title="Delete task"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* TASK MODAL (Create & Edit) */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-slide-in relative">
            <button 
              onClick={() => setShowTaskModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-lg font-bold text-slate-100 mb-6">
              {selectedTask ? 'Edit Task Details' : 'Create New Task'}
            </h3>

            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1">TASK TITLE</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full px-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1">DESCRIPTION (OPTIONAL)</label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Provide details about the task..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">PRIORITY</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-purple-500 text-sm cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">STATUS</label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-purple-500 text-sm cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1">DUE DATE</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-purple-500 text-sm cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1">
                  ASSIGNEES {taskAssignees.length > 0 && `(${taskAssignees.length} selected)`}
                </label>
                <div className="max-h-36 overflow-y-auto bg-slate-950/60 border border-slate-800 rounded-xl p-2 space-y-1">
                  {projectMembers.filter(m => m.user).length === 0 ? (
                    <p className="text-xs text-slate-500 p-1">No project members available</p>
                  ) : (
                    projectMembers.filter(m => m.user).map((m) => {
                      const uId = m.user._id;
                      const isSelected = taskAssignees.includes(uId);
                      return (
                        <label
                          key={uId}
                          className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                            isSelected ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-300 hover:bg-slate-800/60'
                          }`}
                        >
                          <span className="font-medium">{m.user.name}</span>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTaskAssignees([...taskAssignees, uId]);
                              } else {
                                setTaskAssignees(taskAssignees.filter(id => id !== uId));
                              }
                            }}
                            className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900 cursor-pointer"
                          />
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTask}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-900/20 cursor-pointer"
                >
                  {submittingTask && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {selectedTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROJECT MEMBERS MODAL */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-slide-in relative">
            <button 
              onClick={() => setShowMembersModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Project Members
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Manage who has access to this project board. Project members must be members of the workspace.
            </p>

            {/* Add Member Form */}
            {hasEditRights && availableWorkspaceMembers.length > 0 && (
              <form onSubmit={handleAddProjectMember} className="mb-6 p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3">
                <p className="text-xs font-semibold text-slate-350">
                  ADD WORKSPACE MEMBERS TO PROJECT {selectedWorkspaceMemberIds.length > 0 && `(${selectedWorkspaceMemberIds.length} selected)`}
                </p>
                <div className="space-y-3">
                  <div className="max-h-36 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl p-2 space-y-1">
                    {availableWorkspaceMembers.filter(m => m.user).map((m) => {
                      const uId = m.user._id;
                      const isSelected = selectedWorkspaceMemberIds.includes(uId);
                      return (
                        <label
                          key={uId}
                          className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                            isSelected ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-300 hover:bg-slate-850'
                          }`}
                        >
                          <div>
                            <span className="font-medium">{m.user.name}</span>
                            <span className="text-[10px] text-slate-500 ml-1">({m.user.email})</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedWorkspaceMemberIds([...selectedWorkspaceMemberIds, uId]);
                              } else {
                                setSelectedWorkspaceMemberIds(selectedWorkspaceMemberIds.filter((id) => id !== uId));
                              }
                            }}
                            className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900 cursor-pointer"
                          />
                        </label>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-slate-400">ASSIGN ROLE:</label>
                      <select
                        value={memberRole}
                        onChange={(e) => setMemberRole(e.target.value)}
                        className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-purple-500 text-xs cursor-pointer"
                      >
                        <option value="member">Member</option>
                        <option value="manager">Manager</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingMember || selectedWorkspaceMemberIds.length === 0}
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg cursor-pointer"
                    >
                      {submittingMember && <Loader2 className="w-3 h-3 animate-spin" />}
                      Add Selected ({selectedWorkspaceMemberIds.length})
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Members List Table */}
            <div className="max-h-60 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/20">
              <table className="w-full text-left text-xs text-slate-400">
                <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Role</th>
                    {hasEditRights && <th className="px-4 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {projectMembers.map((m) => {
                    const isSelf = m.user?._id === currentUser?.id || m.user?._id === currentUser?._id || m.user?.email === currentUser?.email;
                    const canRemove = hasEditRights && !isSelf && m.role !== 'owner';

                    return (
                      <tr key={m._id} className="hover:bg-slate-900/10">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-200">{m.user?.name || 'Unknown User'} {isSelf && <span className="text-[9px] text-purple-400 bg-purple-500/10 px-1 rounded-md ml-1">You</span>}</p>
                          <p className="text-[10px] text-slate-500">{m.user?.email || 'N/A'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.role === 'manager' || m.role === 'owner' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            <Shield className="w-2.5 h-2.5" />
                            {m.role}
                          </span>
                        </td>
                        {hasEditRights && (
                          <td className="px-4 py-3 text-right">
                            {canRemove && (
                              <button
                                type="button"
                                onClick={() => handleRemoveProjectMember(m._id)}
                                className="p-1 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded transition-all"
                                title="Remove member"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => setShowMembersModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-250 font-semibold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
