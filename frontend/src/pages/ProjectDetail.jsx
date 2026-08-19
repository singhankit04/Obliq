import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Plus, Calendar, User, Trash2, Edit2,
  X, Loader2, Users, MessageSquare, ExternalLink,
  FolderOpen, Shield, Trash, AlertTriangle, Kanban,
  LayoutList, CheckCircle2, ChevronRight, MoreHorizontal,
  Clock, ArrowUpRight
} from 'lucide-react';
import CommentSection from '../components/comments/CommentSection';

// UI Components
import Avatar, { AvatarGroup } from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Dialog, { DialogFooter } from '../components/ui/Dialog';
import Input, { Textarea } from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useToast } from '../components/ui/Toast';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';

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

  // Active View Tab: 'board' | 'list'
  const [activeView, setActiveView] = useState('board');

  // Loading States
  const [loading, setLoading] = useState(true);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [submittingMember, setSubmittingMember] = useState(false);

  // Modals & Panels State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskModalTab, setTaskModalTab] = useState('details');
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
      api.getTasks(projectId).catch((err) => {
        console.warn('Failed to load tasks:', err);
        return { tasks: [] };
      }),
      api.getProjectMembers(projectId).catch((err) => {
        console.warn('Failed to load project members:', err);
        return { members: [] };
      }),
      activeWorkspace
        ? api.getWorkspaceMembers(activeWorkspace._id).catch((err) => {
            console.warn('Failed to load workspace members:', err);
            return { members: [] };
          })
        : Promise.resolve({ members: [] }),
    ])
      .then(([projData, taskData, membersData, wsMembersData]) => {
        if (!isMounted) return;
        setProject(projData?.project || projData);
        setTasks(taskData?.tasks || []);
        setProjectMembers(membersData?.members || []);
        setWorkspaceMembers(wsMembersData?.members || []);
      })
      .catch((err) => {
        console.error('Failed to load project details:', err);
        toast.error('Error', err.message || 'Failed to load project details.');
        if (isMounted) navigate('/');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
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

    if (task.dueDate) {
      setTaskDueDate(new Date(task.dueDate).toISOString().substring(0, 10));
    } else {
      setTaskDueDate('');
    }

    if (Array.isArray(task.assignedTo)) {
      setTaskAssignees(task.assignedTo.map((u) => (typeof u === 'object' ? u._id : u)));
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
        await api.updateTask(selectedTask._id, taskData);
        toast.success('Success', 'Task updated successfully.');
      } else {
        await api.createTask(projectId, taskData);
        toast.success('Success', 'Task created successfully.');
      }
      setShowTaskModal(false);
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
      setTasks(tasks.filter((t) => t._id !== taskToDelete));
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
      setProjectMembers(projectMembers.filter((m) => m._id !== memberToRemove));
      toast.success('Removed', 'Member removed from project.');
    } catch (err) {
      toast.error('Error', err.message || 'Failed to remove project member.');
    } finally {
      setMemberToRemove(null);
    }
  };

  const getTasksByStatus = (status) => tasks.filter((t) => t.status === status);

  const currentUserId = currentUser?._id || currentUser?.id;
  const myWorkspaceMembership = workspaceMembers.find(
    (m) =>
      m.user?._id === currentUserId ||
      m.user?.email === currentUser?.email
  );
  const isWorkspaceAdmin =
    (myWorkspaceMembership && ['owner', 'manager', 'admin'].includes(myWorkspaceMembership.role)) ||
    (activeWorkspace && ['owner', 'manager', 'admin'].includes(activeWorkspace.role)) ||
    ((typeof activeWorkspace?.owner === 'object' ? activeWorkspace.owner?._id : activeWorkspace?.owner) === currentUserId);

  const myProjectMembership = projectMembers.find(
    (m) =>
      m.user?._id === currentUserId ||
      m.user?.email === currentUser?.email
  );
  const isProjectManager =
    myProjectMembership?.role === 'manager' ||
    myProjectMembership?.role === 'owner' ||
    ((typeof project?.manager === 'object' ? project.manager?._id : project?.manager) === currentUserId) ||
    ((typeof project?.createdBy === 'object' ? project.createdBy?._id : project?.createdBy) === currentUserId);

  const hasEditRights = isWorkspaceAdmin || isProjectManager;

  const availableWorkspaceMembers = workspaceMembers.filter(
    (wm) => wm.user && !projectMembers.some((pm) => pm.user?._id === wm.user?._id)
  );

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 pb-12"
    >
      {/* Project Header Bar */}
      <div className="border-b border-white/[0.06] pb-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-zinc-400 mb-1.5 text-xs font-mono">
              <Link to="/" className="hover:text-blue-400 transition-colors">
                Workspace
              </Link>
              <span>/</span>
              <span className="text-zinc-200 font-medium">{project?.name || 'Project'}</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-100">
                {project?.name}
              </h1>
              <Badge
                variant={project?.status === 'active' ? 'success' : 'neutral'}
                size="xs"
                dot
              >
                {project?.status || 'active'}
              </Badge>
            </div>
            {project?.description && (
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex -space-x-1.5 mr-1">
              <AvatarGroup users={projectMembers.map((m) => m.user || m)} size="xs" max={4} />
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={Users}
              onClick={() => setShowMembersModal(true)}
            >
              Members ({projectMembers.length})
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => handleOpenCreateTaskModal('pending')}
            >
              Add Task
            </Button>
          </div>
        </div>

        {/* View Switchers */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 bg-[#0D0F14] border border-white/[0.06] rounded-lg p-0.5">
            <button
              onClick={() => setActiveView('board')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                activeView === 'board'
                  ? 'bg-[#1C202B] text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Board
            </button>
            <button
              onClick={() => setActiveView('list')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                activeView === 'list'
                  ? 'bg-[#1C202B] text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              List
            </button>
          </div>

          <span className="text-xs font-mono text-zinc-500 bg-white/[0.03] px-2.5 py-1 rounded-md border border-white/[0.06]">
            {tasks.length} total tasks
          </span>
        </div>
      </div>

      {/* Main Content: Board vs List */}
      {activeView === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {[
            {
              key: 'pending',
              title: 'To do',
              dot: 'bg-zinc-500',
              border: 'border-white/[0.06]',
            },
            {
              key: 'in-progress',
              title: 'In Progress',
              dot: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
              border: 'border-amber-500/20',
            },
            {
              key: 'completed',
              title: 'Completed',
              dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
              border: 'border-emerald-500/20',
            },
          ].map((col) => {
            const colTasks = getTasksByStatus(col.key);
            return (
              <div
                key={col.key}
                className={`flex flex-col bg-[#0A0D13] rounded-xl border ${col.border} shadow-lg overflow-hidden min-h-[500px]`}
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-white/[0.06] bg-[#0E1118] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <h3 className="font-semibold text-zinc-200 text-xs tracking-tight">
                      {col.title}
                    </h3>
                    <span className="bg-white/[0.06] text-zinc-400 px-1.5 py-0.2 rounded text-[10px] font-mono">
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenCreateTaskModal(col.key)}
                    className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] rounded transition-colors cursor-pointer"
                    aria-label={`Add task to ${col.title}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Column Tasks */}
                <div className="p-3 space-y-2.5 flex-1 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <EmptyState
                      icon={FolderOpen}
                      title={`No tasks in ${col.title}`}
                      description="Click + to add a task."
                      className="py-12"
                    />
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task._id}
                        className="bg-[#12151D] p-3.5 rounded-lg border border-white/[0.06] shadow-sm hover:border-white/[0.14] hover:bg-[#151923] transition-all group relative flex flex-col justify-between"
                      >
                        <div>
                          {/* Badges & Actions */}
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant={task.priority || 'medium'} size="xs" dot>
                              {task.priority || 'Medium'}
                            </Badge>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenEditTaskModal(task, 'details')}
                                className="p-1 text-zinc-400 hover:text-blue-400 hover:bg-white/[0.06] rounded transition-colors cursor-pointer"
                                title="Edit task"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setTaskToDelete(task._id)}
                                className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                                title="Delete task"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Title */}
                          <Link
                            to={`/project/${projectId}/task/${task._id}`}
                            className="font-medium text-zinc-200 text-xs leading-snug hover:text-blue-400 transition-colors block mb-1.5"
                          >
                            {task.title}
                          </Link>

                          {task.description && (
                            <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed mb-2.5">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Meta Footer */}
                        <div className="pt-2.5 border-t border-white/[0.04] flex items-center justify-between mt-1 text-xs text-zinc-400">
                          <div className="flex items-center gap-2.5">
                            <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                              <Calendar className="w-3 h-3" />
                              {task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : 'No date'}
                            </span>
                            <button
                              onClick={() => handleOpenEditTaskModal(task, 'comments')}
                              className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>{task.commentCount || 0}</span>
                            </button>
                          </div>

                          {/* Assignees */}
                          <div className="flex items-center">
                            {Array.isArray(task.assignedTo) && task.assignedTo.length > 0 ? (
                              <AvatarGroup
                                users={task.assignedTo.map((u) =>
                                  typeof u === 'object' ? u : { name: 'User' }
                                )}
                                size="xs"
                                max={2}
                              />
                            ) : (
                              <User className="w-3 h-3 text-zinc-600" />
                            )}
                          </div>
                        </div>

                        {/* Hover quick status move */}
                        <div className="mt-2 pt-2 border-t border-white/[0.04] hidden group-hover:flex items-center justify-between text-[11px]">
                          <span className="text-zinc-500 font-mono text-[10px]">Move:</span>
                          <div className="flex gap-1">
                            {col.key !== 'pending' && (
                              <button
                                onClick={() => handleQuickStatusChange(task, 'pending')}
                                className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-medium transition-colors cursor-pointer"
                              >
                                Todo
                              </button>
                            )}
                            {col.key !== 'in-progress' && (
                              <button
                                onClick={() => handleQuickStatusChange(task, 'in-progress')}
                                className="px-1.5 py-0.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded text-[10px] font-medium transition-colors cursor-pointer"
                              >
                                Progress
                              </button>
                            )}
                            {col.key !== 'completed' && (
                              <button
                                onClick={() => handleQuickStatusChange(task, 'completed')}
                                className="px-1.5 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded text-[10px] font-medium transition-colors cursor-pointer"
                              >
                                Done
                              </button>
                            )}
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
      ) : (
        /* List / Table View */
        <Card padding="none" className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Task Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Assignees</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-zinc-500">
                    No tasks found in this project.
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow key={task._id}>
                    <TableCell>
                      <Link
                        to={`/project/${projectId}/task/${task._id}`}
                        className="font-medium text-zinc-200 hover:text-blue-400 transition-colors"
                      >
                        {task.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={task.status || 'pending'} size="xs" dot>
                        {task.status || 'pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={task.priority || 'medium'} size="xs">
                        {task.priority || 'medium'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-400 font-mono text-[11px]">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {Array.isArray(task.assignedTo) && task.assignedTo.length > 0 ? (
                        <AvatarGroup
                          users={task.assignedTo.map((u) =>
                            typeof u === 'object' ? u : { name: 'User' }
                          )}
                          size="xs"
                          max={2}
                        />
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditTaskModal(task, 'details')}
                          className="p-1 text-zinc-400 hover:text-blue-400 hover:bg-white/[0.06] rounded cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setTaskToDelete(task._id)}
                          className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Task Modal (Create / Edit / Comments) */}
      <Dialog
        open={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        maxWidth="max-w-xl"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4 pr-8">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTaskModalTab('details')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                taskModalTab === 'details'
                  ? 'bg-[#1C202B] text-zinc-100 border border-white/[0.08]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {selectedTask ? 'Task Details' : 'New Task'}
            </button>
            {selectedTask && (
              <button
                type="button"
                onClick={() => setTaskModalTab('comments')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  taskModalTab === 'comments'
                    ? 'bg-[#1C202B] text-zinc-100 border border-white/[0.08]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Comments</span>
                <span className="ml-1 px-1.5 py-0.2 bg-white/[0.06] text-blue-300 text-[10px] rounded-full">
                  {selectedTask.commentCount || 0}
                </span>
              </button>
            )}
          </div>

          {selectedTask && (
            <Link
              to={`/project/${projectId}/task/${selectedTask._id}`}
              className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300"
            >
              <span>Full Page</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>

        {selectedTask && taskModalTab === 'comments' ? (
          <div className="overflow-y-auto max-h-[400px]">
            <CommentSection
              taskId={selectedTask._id}
              projectId={projectId}
              currentUser={currentUser}
              onCommentCountChange={(count) => {
                setSelectedTask((prev) => (prev ? { ...prev, commentCount: count } : prev));
                setTasks((prev) =>
                  prev.map((t) =>
                    t._id === selectedTask._id ? { ...t, commentCount: count } : t
                  )
                );
              }}
            />
          </div>
        ) : (
          <form onSubmit={handleTaskSubmit} className="space-y-4">
            <Input
              label="Task Title"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="What needs to be completed?"
            />

            <Textarea
              label="Description (Optional)"
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Add details, markdown, or notes..."
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Priority"
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </Select>

              <Select
                label="Status"
                value={taskStatus}
                onChange={(e) => setTaskStatus(e.target.value)}
              >
                <option value="pending">To do / Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </Select>
            </div>

            <Input
              label="Due Date"
              type="date"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
            />

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Assignees {taskAssignees.length > 0 && `(${taskAssignees.length} selected)`}
              </label>
              <div className="max-h-36 overflow-y-auto bg-[#0A0D13] border border-white/[0.08] rounded-lg p-2 space-y-1">
                {projectMembers.filter((m) => m.user).length === 0 ? (
                  <p className="text-xs text-zinc-500 p-1">No project members available</p>
                ) : (
                  projectMembers
                    .filter((m) => m.user)
                    .map((m) => {
                      const uId = m.user._id;
                      const isSelected = taskAssignees.includes(uId);
                      return (
                        <label
                          key={uId}
                          className={`flex items-center justify-between p-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                              : 'text-zinc-300 hover:bg-white/[0.04]'
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
                                setTaskAssignees(taskAssignees.filter((id) => id !== uId));
                              }
                            }}
                            className="rounded border-zinc-700 text-blue-600 bg-zinc-900 cursor-pointer"
                          />
                        </label>
                      );
                    })
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setShowTaskModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                loading={submittingTask}
              >
                {selectedTask ? 'Save Changes' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </Dialog>

      {/* Project Members Dialog */}
      <Dialog
        open={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        title="Project Members"
        description="Manage collaborators with access to this project board."
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          {hasEditRights && availableWorkspaceMembers.length > 0 && (
            <form
              onSubmit={handleAddProjectMember}
              className="p-3.5 bg-[#090C12] border border-white/[0.08] rounded-xl space-y-3"
            >
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Add Workspace Members
              </p>
              <div className="max-h-32 overflow-y-auto bg-[#0D1017] border border-white/[0.06] rounded-lg p-2 space-y-1">
                {availableWorkspaceMembers
                  .filter((m) => m.user)
                  .map((m) => {
                    const uId = m.user._id;
                    const isSelected = selectedWorkspaceMemberIds.includes(uId);
                    return (
                      <label
                        key={uId}
                        className={`flex items-center justify-between p-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                            : 'text-zinc-300 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div>
                          <span className="font-medium">{m.user.name}</span>
                          <span className="text-[11px] text-zinc-500 ml-1">
                            ({m.user.email})
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedWorkspaceMemberIds([
                                ...selectedWorkspaceMemberIds,
                                uId,
                              ]);
                            } else {
                              setSelectedWorkspaceMemberIds(
                                selectedWorkspaceMemberIds.filter((id) => id !== uId)
                              );
                            }
                          }}
                          className="rounded border-zinc-700 text-blue-600 bg-zinc-900 cursor-pointer"
                        />
                      </label>
                    );
                  })}
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <Select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="viewer">Viewer</option>
                </Select>

                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  loading={submittingMember}
                  disabled={selectedWorkspaceMemberIds.length === 0}
                >
                  Add Selected ({selectedWorkspaceMemberIds.length})
                </Button>
              </div>
            </form>
          )}

          {/* Members Table */}
          <div className="border border-white/[0.08] rounded-lg overflow-hidden bg-[#0A0D13]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  {hasEditRights && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectMembers.map((m) => {
                  const isSelf =
                    m.user?._id === currentUser?.id ||
                    m.user?._id === currentUser?._id ||
                    m.user?.email === currentUser?.email;
                  const canRemove = hasEditRights && !isSelf && m.role !== 'owner';

                  return (
                    <TableRow key={m._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar name={m.user?.name || 'User'} size="xs" />
                          <div>
                            <p className="font-medium text-zinc-200">
                              {m.user?.name || 'Unknown'}{' '}
                              {isSelf && (
                                <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1 py-0.2 rounded ml-1">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-zinc-500">{m.user?.email || '—'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            m.role === 'manager' || m.role === 'owner' ? 'medium' : 'secondary'
                          }
                          size="xs"
                        >
                          {m.role}
                        </Badge>
                      </TableCell>
                      {hasEditRights && (
                        <TableCell className="text-right">
                          {canRemove && (
                            <button
                              type="button"
                              onClick={() => setMemberToRemove(m._id)}
                              className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                              title="Remove member"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMembersModal(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Confirm Task Delete Dialog */}
      <Dialog
        open={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        title="Delete Task"
        description="Are you sure you want to permanently delete this task?"
      >
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => setTaskToDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={confirmDeleteTask}>
            Delete Task
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Confirm Member Remove Dialog */}
      <Dialog
        open={Boolean(memberToRemove)}
        onClose={() => setMemberToRemove(null)}
        title="Remove Member"
        description="Are you sure you want to remove this member from the project board?"
      >
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => setMemberToRemove(null)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={confirmRemoveProjectMember}>
            Remove Member
          </Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  );
}
