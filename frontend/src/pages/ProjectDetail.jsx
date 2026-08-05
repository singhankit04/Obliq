import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Plus, Calendar, User, Trash2, Edit2, 
  X, Loader2, Users, MessageSquare, ExternalLink,
  FolderOpen, Shield, Trash, AlertTriangle
} from 'lucide-react';
import CommentSection from '../components/comments/CommentSection';

// UI Components
import Avatar, { AvatarGroup } from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Dialog from '../components/ui/Dialog';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Breadcrumb from '../components/ui/Breadcrumb';
import { useToast } from '../components/ui/Toast';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

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
  const [taskModalTab, setTaskModalTab] = useState('details'); // 'details' | 'comments'
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [memberToRemove, setMemberToRemove] = useState(null);

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
      toast.error('Error', 'Failed to load project details.');
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
    setTaskModalTab('details');
    setShowTaskModal(true);
  };

  // Open task modal for editing or commenting
  const handleOpenEditTaskModal = (task, tab = 'details') => {
    setSelectedTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskPriority(task.priority || 'medium');
    setTaskStatus(task.status || 'pending');
    
    // Format date for date input: YYYY-MM-DD
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
    setTaskModalTab(tab);
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
        toast.success('Success', 'Task updated successfully.');
      } else {
        // Create Mode
        await api.createTask(projectId, taskData);
        toast.success('Success', 'Task created successfully.');
      }
      setShowTaskModal(false);
      // Refresh tasks
      const res = await api.getTasks(projectId);
      setTasks(res.tasks || []);
    } catch (err) {
      toast.error('Error', err.message || 'Failed to save task.');
    } finally {
      setSubmittingTask(false);
    }
  };

  // Quick switch status buttons
  const handleQuickStatusChange = async (task, newStatus) => {
    try {
      await api.updateTask(task._id, { status: newStatus });
      toast.success('Updated', `Status moved to ${newStatus}`);
      const res = await api.getTasks(projectId);
      setTasks(res.tasks || []);
    } catch (err) {
      toast.error('Error', err.message || 'Failed to update task status.');
    }
  };

  // Delete Task Confirm
  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await api.deleteTask(taskToDelete);
      setTasks(tasks.filter(t => t._id !== taskToDelete));
      toast.success('Deleted', 'Task removed successfully.');
    } catch (err) {
      toast.error('Error', err.message || 'Failed to delete task.');
    } finally {
      setTaskToDelete(null);
    }
  };

  // Add Member to Project
  const handleAddProjectMember = async (e) => {
    e.preventDefault();
    if (selectedWorkspaceMemberIds.length === 0) return;
    setSubmittingMember(true);

    try {
      await api.addProjectMember(projectId, selectedWorkspaceMemberIds, memberRole);
      toast.success('Success', 'Member(s) added to project.');
      const membersData = await api.getProjectMembers(projectId);
      setProjectMembers(membersData.members || []);
      setSelectedWorkspaceMemberIds([]);
      setMemberRole('member');
    } catch (err) {
      toast.error('Error', err.message || 'Failed to add project member.');
    } finally {
      setSubmittingMember(false);
    }
  };

  // Remove Member Confirm
  const confirmRemoveProjectMember = async () => {
    if (!memberToRemove) return;
    try {
      await api.removeProjectMember(projectId, memberToRemove);
      setProjectMembers(projectMembers.filter(m => m._id !== memberToRemove));
      toast.success('Removed', 'Member removed from project.');
    } catch (err) {
      toast.error('Error', err.message || 'Failed to remove project member.');
    } finally {
      setMemberToRemove(null);
    }
  };

  // Filter tasks into board columns
  const getTasksByStatus = (status) => {
    return tasks.filter(t => t.status === status);
  };

  // Check project permissions
  const myWorkspaceMembership = workspaceMembers.find(m => m.user?._id === currentUser?.id || m.user?._id === currentUser?._id || m.user?.email === currentUser?.email);
  const isWorkspaceAdmin = myWorkspaceMembership && ['owner', 'manager'].includes(myWorkspaceMembership.role);
  
  const myProjectMembership = projectMembers.find(m => m.user?._id === currentUser?.id || m.user?._id === currentUser?._id || m.user?.email === currentUser?.email);
  const isProjectManager = myProjectMembership?.role === 'manager' || myProjectMembership?.role === 'owner';
  const hasEditRights = isWorkspaceAdmin || isProjectManager;

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard className="h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonCard className="h-96" />
          <SkeletonCard className="h-96" />
          <SkeletonCard className="h-96" />
        </div>
      </div>
    );
  }

  // Filter workspace members to show only those who are NOT yet in the project
  const availableWorkspaceMembers = workspaceMembers.filter(
    (wm) => wm.user && !projectMembers.some((pm) => pm.user?._id === wm.user?._id)
  );

  return (
    <div className="space-y-6 animate-slide-in">
      
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/' },
          { label: project?.name || 'Project Board' },
        ]}
      />

      {/* Project Meta Information Panel */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant={project?.status === 'active' ? 'completed' : 'secondary'} size="sm">
                {project?.status || 'active'}
              </Badge>
            </div>
            <h2 className="text-xl font-bold text-zinc-100 mt-2 truncate flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-indigo-400 shrink-0" />
              {project?.name}
            </h2>
            <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
              {project?.description || 'No project description.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              icon={Users}
              onClick={() => setShowMembersModal(true)}
            >
              Members ({projectMembers.length})
            </Button>
            
            <Button
              variant="gradient"
              size="sm"
              icon={Plus}
              onClick={() => handleOpenCreateTaskModal('pending')}
            >
              New Task
            </Button>
          </div>
        </div>
      </Card>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {[
          { key: 'pending', title: 'Pending', dot: 'bg-zinc-500' },
          { key: 'in-progress', title: 'In Progress', dot: 'bg-blue-500' },
          { key: 'completed', title: 'Completed', dot: 'bg-emerald-500' }
        ].map((col) => {
          const colTasks = getTasksByStatus(col.key);
          return (
            <div key={col.key} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-col max-h-[80vh]">
              {/* Column Header */}
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <h3 className="font-bold text-zinc-200 text-sm">{col.title}</h3>
                  <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md font-semibold">
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => handleOpenCreateTaskModal(col.key)}
                  className="p-1 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 rounded-lg transition-all"
                  aria-label={`Add task to ${col.title}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Tasks List */}
              <div className="p-4 overflow-y-auto space-y-3 min-h-[40vh]">
                {colTasks.length === 0 ? (
                  <EmptyState
                    icon={FolderOpen}
                    title={`No tasks in ${col.title}`}
                    description="Create a task to get started."
                    className="py-8"
                  />
                ) : (
                  colTasks.map((task) => (
                    <Card
                      key={task._id}
                      interactive
                      className="p-4 relative group flex flex-col justify-between overflow-hidden"
                    >
                      {/* Priority strip */}
                      <div className={`absolute top-0 left-0 right-0 h-1 ${
                        task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-zinc-700'
                      }`} />

                      <div>
                        <div className="flex items-start justify-between gap-2 mt-1">
                          <Link
                            to={`/project/${projectId}/task/${task._id}`}
                            className="font-bold text-zinc-100 text-sm leading-snug hover:text-indigo-400 transition-colors"
                          >
                            {task.title}
                          </Link>
                          <Badge variant={task.priority || 'medium'} size="xs">
                            {task.priority || 'medium'}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Meta info bottom */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800/60">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'No date'}
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditTaskModal(task, 'comments');
                            }}
                            className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-lg transition-all cursor-pointer font-medium"
                            title="View & Add Comments"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>{task.commentCount || 0}</span>
                          </button>
                        </div>

                        <div className="flex items-center">
                          {Array.isArray(task.assignedTo) && task.assignedTo.length > 0 ? (
                            <AvatarGroup
                              users={task.assignedTo.map(u => typeof u === 'object' ? u : { name: 'User' })}
                              size="xs"
                              max={3}
                            />
                          ) : (
                            <div 
                              className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500"
                              title="Unassigned"
                            >
                              <User className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick Action controls on hover */}
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-zinc-800/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1">
                          {col.key !== 'pending' && (
                            <button
                              onClick={() => handleQuickStatusChange(task, 'pending')}
                              className="px-1.5 py-0.5 hover:bg-zinc-800 rounded text-[10px] text-zinc-400 font-semibold"
                            >
                              To Pending
                            </button>
                          )}
                          {col.key !== 'in-progress' && (
                            <button
                              onClick={() => handleQuickStatusChange(task, 'in-progress')}
                              className="px-1.5 py-0.5 hover:bg-zinc-800 rounded text-[10px] text-blue-400 font-semibold"
                            >
                              To In Progress
                            </button>
                          )}
                          {col.key !== 'completed' && (
                            <button
                              onClick={() => handleQuickStatusChange(task, 'completed')}
                              className="px-1.5 py-0.5 hover:bg-zinc-800 rounded text-[10px] text-emerald-400 font-semibold"
                            >
                              To Done
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditTaskModal(task, 'details')}
                            className="p-1 hover:bg-zinc-800 hover:text-indigo-400 text-zinc-500 rounded transition-all"
                            title="Edit task"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setTaskToDelete(task._id)}
                            className="p-1 hover:bg-red-500/10 hover:text-red-400 text-zinc-500 rounded transition-all"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* TASK DIALOG (Create, Edit & Comments) */}
      <Dialog
        open={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        maxWidth="max-w-xl"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-5 pr-8">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTaskModalTab('details')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                taskModalTab === 'details'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {selectedTask ? 'Task Details' : 'New Task'}
            </button>
            {selectedTask && (
              <button
                type="button"
                onClick={() => setTaskModalTab('comments')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  taskModalTab === 'comments'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Comments</span>
                <span className="ml-1 px-1.5 py-0.5 bg-zinc-800 text-indigo-300 text-[10px] rounded-full">
                  {selectedTask.commentCount || 0}
                </span>
              </button>
            )}
          </div>

          {selectedTask && (
            <Link
              to={`/project/${projectId}/task/${selectedTask._id}`}
              className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:underline"
              title="Open full page view of this task"
            >
              <span>Full View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {selectedTask && taskModalTab === 'comments' ? (
          <div className="overflow-y-auto pr-1 flex-1 min-h-[350px]">
            <CommentSection
              taskId={selectedTask._id}
              projectId={projectId}
              currentUser={currentUser}
              onCommentCountChange={(count) => {
                setSelectedTask(prev => {
                  if (!prev || prev.commentCount === count) return prev;
                  return { ...prev, commentCount: count };
                });
                setTasks(prev => prev.map(t => {
                  if (t._id !== selectedTask._id || t.commentCount === count) return t;
                  return { ...t, commentCount: count };
                }));
              }}
            />
          </div>
        ) : (
          <form onSubmit={handleTaskSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
            <Input
              label="Task Title"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="What needs to be done?"
            />

            <div>
              <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                Description (Optional)
              </label>
              <textarea
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                placeholder="Provide details about the task..."
                rows={3}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Priority"
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                ]}
              />
              <Select
                label="Status"
                value={taskStatus}
                onChange={(e) => setTaskStatus(e.target.value)}
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'in-progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                ]}
              />
            </div>

            <Input
              label="Due Date"
              type="date"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
            />

            <div>
              <label className="block text-zinc-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                Assignees {taskAssignees.length > 0 && `(${taskAssignees.length} selected)`}
              </label>
              <div className="max-h-36 overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-xl p-2 space-y-1">
                {projectMembers.filter(m => m.user).length === 0 ? (
                  <p className="text-xs text-zinc-500 p-1">No project members available</p>
                ) : (
                  projectMembers.filter(m => m.user).map((m) => {
                    const uId = m.user._id;
                    const isSelected = taskAssignees.includes(uId);
                    return (
                      <label
                        key={uId}
                        className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 'text-zinc-300 hover:bg-zinc-800'
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
                          className="rounded border-zinc-700 text-indigo-600 focus:ring-indigo-500 bg-zinc-900 cursor-pointer"
                        />
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setShowTaskModal(false)}>
                Cancel
              </Button>
              <Button variant="gradient" type="submit" loading={submittingTask}>
                {selectedTask ? 'Save Changes' : 'Create Task'}
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* PROJECT MEMBERS DIALOG */}
      <Dialog
        open={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        title="Project Members"
        description="Manage who has access to this project board."
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          {hasEditRights && availableWorkspaceMembers.length > 0 && (
            <form onSubmit={handleAddProjectMember} className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-3">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Add Workspace Members {selectedWorkspaceMemberIds.length > 0 && `(${selectedWorkspaceMemberIds.length} selected)`}
              </p>
              <div className="space-y-3">
                <div className="max-h-36 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-xl p-2 space-y-1">
                  {availableWorkspaceMembers.filter(m => m.user).map((m) => {
                    const uId = m.user._id;
                    const isSelected = selectedWorkspaceMemberIds.includes(uId);
                    return (
                      <label
                        key={uId}
                        className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 'text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        <div>
                          <span className="font-medium">{m.user.name}</span>
                          <span className="text-[10px] text-zinc-500 ml-1">({m.user.email})</span>
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
                          className="rounded border-zinc-700 text-indigo-600 focus:ring-indigo-500 bg-zinc-900 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <Select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                    options={[
                      { value: 'member', label: 'Member' },
                      { value: 'manager', label: 'Manager' },
                      { value: 'viewer', label: 'Viewer' },
                    ]}
                  />

                  <Button
                    variant="gradient"
                    size="sm"
                    type="submit"
                    loading={submittingMember}
                    disabled={selectedWorkspaceMemberIds.length === 0}
                  >
                    Add Selected ({selectedWorkspaceMemberIds.length})
                  </Button>
                </div>
              </div>
            </form>
          )}

          <div className="max-h-60 overflow-y-auto border border-zinc-800 rounded-xl bg-zinc-950/40">
            <table className="w-full text-left text-xs text-zinc-400">
              <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Role</th>
                  {hasEditRights && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {projectMembers.map((m) => {
                  const isSelf = m.user?._id === currentUser?.id || m.user?._id === currentUser?._id || m.user?.email === currentUser?.email;
                  const canRemove = hasEditRights && !isSelf && m.role !== 'owner';

                  return (
                    <tr key={m._id} className="hover:bg-zinc-800/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={m.user?.name || 'User'} size="xs" />
                          <div>
                            <p className="font-semibold text-zinc-200">{m.user?.name || 'Unknown User'} {isSelf && <span className="text-[9px] text-indigo-400 bg-indigo-500/10 px-1 rounded ml-1">You</span>}</p>
                            <p className="text-[10px] text-zinc-500">{m.user?.email || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={m.role === 'manager' || m.role === 'owner' ? 'medium' : 'secondary'} size="xs">
                          {m.role}
                        </Badge>
                      </td>
                      {hasEditRights && (
                        <td className="px-4 py-3 text-right">
                          {canRemove && (
                            <button
                              type="button"
                              onClick={() => setMemberToRemove(m._id)}
                              className="p-1 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded transition-all"
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

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setShowMembersModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>

      {/* CONFIRM TASK DELETE DIALOG */}
      <Dialog
        open={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={() => setTaskToDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeleteTask}>
            Delete Task
          </Button>
        </div>
      </Dialog>

      {/* CONFIRM MEMBER REMOVE DIALOG */}
      <Dialog
        open={Boolean(memberToRemove)}
        onClose={() => setMemberToRemove(null)}
        title="Remove Member"
        description="Are you sure you want to remove this member from the project?"
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={() => setMemberToRemove(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmRemoveProjectMember}>
            Remove Member
          </Button>
        </div>
      </Dialog>

    </div>
  );
}

