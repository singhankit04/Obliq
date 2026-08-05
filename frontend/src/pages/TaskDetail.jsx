import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  ArrowLeft, Calendar, Clock, Edit3, Trash2, Eye, MoreHorizontal,
  UserPlus, Paperclip, CheckSquare, Tag, Flag, Zap, Target,
  MessageSquare, Activity, Bell, ChevronDown, ChevronRight,
  Send, Reply, X, Folder, Users, Timer,
  FileText, AlertCircle, CheckCircle2, Circle, Plus,
  ExternalLink, Copy, Share2, Bookmark, BarChart3,
} from 'lucide-react';

// UI Components
import Avatar, { AvatarGroup } from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Dialog from '../components/ui/Dialog';
import Breadcrumb from '../components/ui/Breadcrumb';
import { useToast } from '../components/ui/Toast';
import ProgressBar from '../components/ui/ProgressBar';
import { SkeletonTaskDetail } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import TabBar from '../components/ui/TabBar';
import Dropdown, { DropdownItem, DropdownDivider } from '../components/ui/Dropdown';
import FilePreview, { UploadZone } from '../components/ui/FilePreview';
import CommentSection from '../components/comments/CommentSection';

// ─── MOCK DATA ──────────────────────────────────────────────
const MOCK_COMMENTS = [
  {
    id: 'c1',
    user: { id: 'u1', name: 'Ankit Singh', role: 'Owner' },
    message: 'I\'ve started working on the authentication module. The JWT implementation is looking solid so far.',
    timestamp: '2 hours ago',
    edited: false,
    reactions: [
      { emoji: '🚀', count: 3, users: ['u2', 'u3', 'u4'] },
      { emoji: '👍', count: 2, users: ['u2', 'u5'] },
    ],
    replies: [
      {
        id: 'c1r1',
        user: { id: 'u2', name: 'Rahul Verma', role: 'Developer' },
        message: 'Looks great! Make sure to add refresh token rotation for security.',
        timestamp: '1 hour ago',
        edited: false,
        reactions: [{ emoji: '✅', count: 1, users: ['u1'] }],
      },
    ],
  },
];

const MOCK_ACTIVITY = [
  { id: 'a1', icon: 'created', user: 'Ankit Singh', action: 'created this task', time: '2 days ago', color: 'text-indigo-400' },
  { id: 'a2', icon: 'status', user: 'Ankit Singh', action: 'changed status from Pending to In Progress', time: '1 day ago', color: 'text-blue-400' },
  { id: 'a3', icon: 'assign', user: 'Rahul Verma', action: 'was assigned to this task', time: '1 day ago', color: 'text-cyan-400' },
  { id: 'a4', icon: 'priority', user: 'Priya Sharma', action: 'changed priority to High', time: '20 hours ago', color: 'text-rose-400' },
  { id: 'a5', icon: 'attachment', user: 'Dev Patel', action: 'uploaded design-mockup-v2.fig', time: '8 hours ago', color: 'text-amber-400' },
];

const MOCK_NOTIFICATIONS = [
  { id: 'n1', type: 'assign', message: 'Rahul assigned you to "API Integration"', time: '10 min ago', read: false },
  { id: 'n2', type: 'mention', message: 'Priya mentioned you in a comment', time: '1 hour ago', read: false },
  { id: 'n3', type: 'reply', message: 'Sara replied to your comment', time: '2 hours ago', read: false },
];

const MOCK_ATTACHMENTS = [
  { name: 'design-mockup-v2.fig', size: 2400000, uploadedAt: '8 hours ago' },
  { name: 'api-documentation.pdf', size: 450000, uploadedAt: '1 day ago' },
];

const MOCK_RELATED_TASKS = [
  { id: 'rt1', title: 'Database Schema Design', status: 'completed', priority: 'high' },
  { id: 'rt2', title: 'API Documentation', status: 'in-progress', priority: 'medium' },
];

const MOCK_TAGS = ['backend', 'auth', 'security', 'sprint-3'];

const MOCK_WATCHERS = [
  { id: 'u1', name: 'Ankit Singh' },
  { id: 'u2', name: 'Rahul Verma' },
  { id: 'u3', name: 'Priya Sharma' },
];

const MOCK_MEMBERS = [
  { id: 'u1', name: 'Ankit Singh', role: 'Owner', email: 'ankit@obliq.dev' },
  { id: 'u2', name: 'Rahul Verma', role: 'Developer', email: 'rahul@obliq.dev' },
  { id: 'u3', name: 'Priya Sharma', role: 'Lead', email: 'priya@obliq.dev' },
];

const CHECKLIST = [
  { id: 'cl1', text: 'Set up JWT authentication', done: true },
  { id: 'cl2', text: 'Implement refresh token rotation', done: true },
  { id: 'cl3', text: 'Add rate limiting middleware', done: false },
  { id: 'cl4', text: 'Write integration tests', done: false },
];

const activityIconMap = {
  created: Plus,
  status: Zap,
  assign: UserPlus,
  priority: Flag,
  attachment: Paperclip,
  comment: MessageSquare,
  commit: CheckCircle2,
};

export default function TaskDetail() {
  const { taskId, projectId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  // State
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const [checklist, setChecklist] = useState(CHECKLIST);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [mobileTab, setMobileTab] = useState('details');
  const [isWatching, setIsWatching] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch task
  useEffect(() => {
    const fetchTask = async () => {
      setLoading(true);
      try {
        const data = await api.getTaskById(taskId);
        setTask(data.task);
      } catch (err) {
        console.error('Failed to load task:', err);
        toast.error('Error', 'Failed to load task details.');
      } finally {
        setLoading(false);
      }
    };
    if (taskId) fetchTask();
  }, [taskId]);

  const handleChecklistToggle = (id) => {
    setChecklist(checklist.map((item) =>
      item.id === id ? { ...item, done: !item.done } : item
    ));
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    toast.success('Updated', 'All notifications marked as read.');
  };

  const handleDeleteTask = async () => {
    setDeleting(true);
    try {
      await api.deleteTask(taskId);
      toast.success('Deleted', 'Task has been deleted.');
      navigate(`/project/${projectId || task?.project?._id || task?.project}`);
    } catch (err) {
      toast.error('Error', err.message || 'Failed to delete task.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      setTask((prev) => ({ ...prev, status: newStatus }));
      toast.success('Status updated', `Task status set to ${newStatus}`);
    } catch (err) {
      toast.error('Error', err.message || 'Failed to update status.');
    }
  };

  const handlePriorityChange = async (newPriority) => {
    try {
      await api.updateTask(taskId, { priority: newPriority });
      setTask((prev) => ({ ...prev, priority: newPriority }));
      toast.success('Priority updated', `Task priority set to ${newPriority}`);
    } catch (err) {
      toast.error('Error', err.message || 'Failed to update priority.');
    }
  };

  const completedChecklist = checklist.filter((i) => i.done).length;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const taskData = task ? {
    ...task,
    taskId: `OBL-${String(task._id).slice(-4).toUpperCase()}`,
    sprint: 'Sprint 3',
    estimatedHours: 24,
    spentHours: 16,
    tags: MOCK_TAGS,
    watchers: MOCK_WATCHERS,
  } : null;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <SkeletonTaskDetail />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-7xl mx-auto">
        <EmptyState
          icon={AlertCircle}
          title="Task not found"
          description="This task may have been deleted or you don't have access."
          actionLabel="Go Back"
          onAction={() => navigate(-1)}
        />
      </div>
    );
  }

  const statusIcon = {
    'pending': Circle,
    'in-progress': Clock,
    'completed': CheckCircle2,
  };
  const StatusIcon = statusIcon[task.status] || Circle;

  const mobileTabs = [
    { key: 'details', label: 'Details', icon: FileText },
    { key: 'comments', label: 'Comments', icon: MessageSquare, count: comments.length },
    { key: 'activity', label: 'Activity', icon: Activity },
  ];

  const projectObj = typeof task.project === 'object' ? task.project : null;
  const projectName = projectObj?.name || 'Project Board';
  const resolvedProjectId = projectId || projectObj?._id;

  return (
    <div className="animate-fade-in space-y-6">
      
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/' },
          { label: projectName, href: resolvedProjectId ? `/project/${resolvedProjectId}` : undefined },
          { label: taskData.taskId },
        ]}
      />

      {/* Mobile Tab Bar */}
      <div className="lg:hidden">
        <TabBar tabs={mobileTabs} activeTab={mobileTab} onChange={setMobileTab} />
      </div>

      {/* Three Column Layout */}
      <div className="flex gap-6 items-start">

        {/* CENTER CONTENT */}
        <div className={`flex-1 min-w-0 space-y-6 ${mobileTab !== 'details' && mobileTab !== 'comments' ? 'hidden lg:block' : ''}`}>

          {/* Task Header */}
          <Card className={`p-6 space-y-5 ${mobileTab !== 'details' ? 'hidden lg:block' : ''}`}>
            
            {/* Title Row */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                    {taskData.taskId}
                  </span>
                  <Badge variant={task.priority} size="sm" dot>{task.priority}</Badge>
                  <Badge variant={task.status} size="sm" dot>{task.status?.replace('-', ' ')}</Badge>
                </div>
                <h1 className="text-2xl font-bold text-zinc-100 leading-tight tracking-tight">
                  {task.title}
                </h1>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant={isWatching ? 'secondary' : 'ghost'}
                  size="icon-sm"
                  icon={Eye}
                  onClick={() => {
                    setIsWatching(!isWatching);
                    toast.info('Watch status', isWatching ? 'Unwatched task' : 'Watching task');
                  }}
                  title={isWatching ? 'Unwatch' : 'Watch'}
                  className={isWatching ? 'text-indigo-400' : ''}
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  icon={Share2}
                  title="Share"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Copied', 'Task link copied to clipboard.');
                  }}
                />
                <Dropdown align="right" trigger={
                  <Button variant="ghost" size="icon-sm" icon={MoreHorizontal} title="More" />
                }>
                  <DropdownItem icon={Copy} onClick={() => {
                    navigator.clipboard.writeText(taskData.taskId);
                    toast.success('Copied', 'Task ID copied.');
                  }}>
                    Copy Task ID
                  </DropdownItem>
                  <DropdownDivider />
                  <DropdownItem icon={Trash2} variant="danger" onClick={() => setShowDeleteModal(true)}>
                    Delete Task
                  </DropdownItem>
                </Dropdown>
              </div>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
              
              {/* Status Selector */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Status</span>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-lg p-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Priority Selector */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Priority</span>
                <select
                  value={task.priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  className="w-full text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-lg p-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Due Date */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Due Date</span>
                <div className="flex items-center gap-1.5 pt-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-xs font-semibold text-zinc-200">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
                  </span>
                </div>
              </div>

              {/* Sprint */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Sprint</span>
                <div className="flex items-center gap-1.5 pt-1">
                  <Target className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-semibold text-zinc-200">{taskData.sprint}</span>
                </div>
              </div>

              {/* Assignees */}
              <div className="space-y-1 col-span-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Assignees</span>
                <div className="flex items-center gap-2 pt-1">
                  <AvatarGroup
                    users={
                      Array.isArray(task.assignedTo)
                        ? task.assignedTo.map((a) => ({ id: a._id || a, name: a.name || 'User' }))
                        : []
                    }
                    max={5}
                    size="sm"
                  />
                </div>
              </div>

              {/* Created By */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Created By</span>
                <div className="flex items-center gap-2 pt-1">
                  <Avatar name={typeof task.createdBy === 'object' ? task.createdBy.name : 'Creator'} size="xs" />
                  <span className="text-xs font-semibold text-zinc-200">
                    {typeof task.createdBy === 'object' ? task.createdBy.name : 'Creator'}
                  </span>
                </div>
              </div>

              {/* Project */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Project</span>
                <div className="flex items-center gap-1.5 pt-1">
                  <Folder className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-semibold text-indigo-400 truncate">
                    {projectName}
                  </span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-3.5 h-3.5 text-zinc-500" />
              {taskData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" size="xs">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Time Tracking & Progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5" />
                    Time Tracking
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-xl font-bold text-zinc-100">{taskData.spentHours}h</span>
                  <span className="text-xs text-zinc-500">/ {taskData.estimatedHours}h estimated</span>
                </div>
                <ProgressBar value={taskData.spentHours} max={taskData.estimatedHours} size="sm" showLabel={false} variant="cyan" />
              </div>

              <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5" />
                    Checklist
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400">{completedChecklist}/{checklist.length}</span>
                </div>
                <ProgressBar value={completedChecklist} max={checklist.length} size="sm" showLabel={false} variant="success" />
              </div>
            </div>
          </Card>

          {/* Description Card */}
          <Card className="p-6">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Description
            </h3>
            <div className="text-sm text-zinc-300 leading-relaxed">
              {task.description ? (
                <p>{task.description}</p>
              ) : (
                <p className="text-zinc-500 italic">No description provided for this task.</p>
              )}
            </div>
          </Card>

          {/* Checklist Card */}
          <Card className="p-6">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5" />
              Checklist ({completedChecklist}/{checklist.length})
            </h3>
            <div className="space-y-1">
              {checklist.map((item) => (
                <label
                  key={item.id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all hover:bg-zinc-800/50 group ${item.done ? 'opacity-60' : ''}`}
                >
                  <input
                    type="checkbox"
                    className="rounded border-zinc-700 text-indigo-600 focus:ring-indigo-500 bg-zinc-900 cursor-pointer"
                    checked={item.done}
                    onChange={() => handleChecklistToggle(item.id)}
                  />
                  <span className={`text-sm font-medium ${item.done ? 'line-through text-zinc-500' : 'text-zinc-200'} transition-all`}>
                    {item.text}
                  </span>
                </label>
              ))}
            </div>
          </Card>

          {/* Attachments Card */}
          <Card className="p-6">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" />
              Attachments ({MOCK_ATTACHMENTS.length})
            </h3>
            <div className="space-y-2">
              {MOCK_ATTACHMENTS.map((file) => (
                <FilePreview
                  key={file.name}
                  name={file.name}
                  size={file.size}
                  thumbnail={file.thumbnail}
                  uploadedAt={file.uploadedAt}
                  onDownload={() => toast.info('Download', `Downloading ${file.name}`)}
                  onDelete={() => toast.info('Notice', 'Attachment deletion disabled in demo.')}
                />
              ))}
            </div>
            <div className="mt-3">
              <UploadZone onDrop={() => toast.success('Upload', 'File uploaded.')} />
            </div>
          </Card>

          {/* Comments Section */}
          <Card className={`p-6 ${mobileTab !== 'details' && mobileTab !== 'comments' ? 'hidden lg:block' : ''}`}>
            <CommentSection
              taskId={taskId}
              projectId={resolvedProjectId}
              currentUser={currentUser}
            />
          </Card>

        </div>

        {/* RIGHT SIDEBAR */}
        <aside className={`w-80 shrink-0 space-y-4 sticky top-24 ${mobileTab !== 'activity' ? 'hidden lg:block' : ''}`}>

          {/* Activity Timeline */}
          <Card className="p-4">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Recent Activity
            </h3>
            <div className="space-y-0 relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-zinc-800" />
              {MOCK_ACTIVITY.map((item) => {
                const IconComp = activityIconMap[item.icon] || Circle;
                return (
                  <div key={item.id} className="flex gap-3 py-2 relative">
                    <div className={`w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 z-10 ${item.color}`}>
                      <IconComp className="w-3 h-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-zinc-300 leading-snug">
                        <span className="font-bold text-zinc-100">{item.user}</span>{' '}
                        {item.action}
                      </p>
                      <span className="text-[9px] text-zinc-500">{item.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Notifications */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" />
                Notifications
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-[9px] font-bold rounded-full min-w-[18px] text-center">
                    {unreadCount}
                  </span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[9px] font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-2.5 p-2 rounded-lg transition-all cursor-pointer ${notif.read ? 'opacity-60' : 'bg-indigo-500/10'} hover:bg-zinc-800`}
                >
                  {!notif.read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  )}
                  <div className={`min-w-0 flex-1 ${notif.read ? 'ml-4' : ''}`}>
                    <p className="text-[11px] text-zinc-300 leading-snug">{notif.message}</p>
                    <span className="text-[9px] text-zinc-500">{notif.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Watchers */}
          <Card className="p-4">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Watchers ({taskData.watchers.length})
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {taskData.watchers.map((w) => (
                <Avatar key={w.id} name={w.name} size="sm" className="hover:scale-110 transition-transform cursor-pointer" />
              ))}
            </div>
          </Card>

          {/* Related Tasks */}
          <Card className="p-4">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Related Tasks</h3>
            <div className="space-y-2">
              {MOCK_RELATED_TASKS.map((rt) => (
                <div key={rt.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-zinc-800 transition-all cursor-pointer group">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${rt.status === 'completed' ? 'bg-emerald-400' : rt.status === 'in-progress' ? 'bg-blue-400' : 'bg-zinc-500'}`} />
                  <span className="text-xs font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors truncate flex-1">
                    {rt.title}
                  </span>
                  <Badge variant={rt.priority} size="xs">{rt.priority}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Task Statistics */}
          <Card className="p-4">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              Statistics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Comments', value: comments.length, icon: MessageSquare },
                { label: 'Attachments', value: MOCK_ATTACHMENTS.length, icon: Paperclip },
                { label: 'Checklist', value: `${completedChecklist}/${checklist.length}`, icon: CheckSquare },
                { label: 'Watchers', value: taskData.watchers.length, icon: Eye },
              ].map((stat) => (
                <div key={stat.label} className="p-2.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl text-center">
                  <stat.icon className="w-3.5 h-3.5 text-zinc-500 mx-auto mb-1" />
                  <p className="text-sm font-bold text-zinc-100">{stat.value}</p>
                  <p className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </Card>

        </aside>
      </div>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" loading={deleting} onClick={handleDeleteTask}>
            Delete Task
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

