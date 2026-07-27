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
import ProgressBar from '../components/ui/ProgressBar';
import { SkeletonTaskDetail } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import TypingIndicator from '../components/ui/TypingIndicator';
import TabBar from '../components/ui/TabBar';
import Dropdown, { DropdownItem, DropdownDivider } from '../components/ui/Dropdown';
import { ReactionBar } from '../components/ui/EmojiPicker';
import MentionDropdown from '../components/ui/MentionDropdown';
import FilePreview, { UploadZone } from '../components/ui/FilePreview';
import RichTextToolbar from '../components/ui/RichTextToolbar';
import CommentSection from '../components/comments/CommentSection';


// ─── MOCK DATA ──────────────────────────────────────────────
const MOCK_COMMENTS = [
  {
    id: 'c1',
    user: { id: 'u1', name: 'Ankit Singh', role: 'Owner' },
    message: 'I\'ve started working on the authentication module. The JWT implementation is looking solid so far. Here\'s the approach:\n\n```javascript\nconst token = jwt.sign({ userId }, secret, {\n  expiresIn: \'7d\'\n});\n```\n\nLet me know if you want to review the PR.',
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
      {
        id: 'c1r2',
        user: { id: 'u3', name: 'Priya Sharma', role: 'Lead' },
        message: 'Agreed with @Rahul. Also consider adding rate limiting on the auth endpoints.',
        timestamp: '45 min ago',
        edited: true,
        reactions: [],
      },
    ],
  },
  {
    id: 'c2',
    user: { id: 'u4', name: 'Dev Patel', role: 'Designer' },
    message: 'Updated the login screen mockups based on the feedback. The new design uses a glassmorphism card with subtle animations. Uploading the Figma link shortly.',
    timestamp: '4 hours ago',
    edited: false,
    reactions: [
      { emoji: '❤️', count: 4, users: ['u1', 'u2', 'u3', 'u5'] },
      { emoji: '🔥', count: 2, users: ['u1', 'u3'] },
    ],
    replies: [],
  },
  {
    id: 'c3',
    user: { id: 'u5', name: 'Sara Khan', role: 'QA' },
    message: 'Found a bug in the password reset flow — the token expiry check is off by one hour. Created a separate issue for tracking.',
    timestamp: '6 hours ago',
    edited: false,
    reactions: [{ emoji: '👀', count: 1, users: ['u1'] }],
    replies: [
      {
        id: 'c3r1',
        user: { id: 'u1', name: 'Ankit Singh', role: 'Owner' },
        message: 'Good catch! I\'ll fix this in the next commit.',
        timestamp: '5 hours ago',
        edited: false,
        reactions: [{ emoji: '🎉', count: 1, users: ['u5'] }],
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
  { id: 'a6', icon: 'comment', user: 'Sara Khan', action: 'added a comment', time: '6 hours ago', color: 'text-emerald-400' },
  { id: 'a7', icon: 'commit', user: 'Ankit Singh', action: 'linked commit feat/auth-module', time: '3 hours ago', color: 'text-purple-400' },
];

const MOCK_NOTIFICATIONS = [
  { id: 'n1', type: 'assign', message: 'Rahul assigned you to "API Integration"', time: '10 min ago', read: false },
  { id: 'n2', type: 'mention', message: 'Priya mentioned you in a comment', time: '1 hour ago', read: false },
  { id: 'n3', type: 'reply', message: 'Sara replied to your comment', time: '2 hours ago', read: false },
  { id: 'n4', type: 'complete', message: '"Database Schema" was marked complete', time: '5 hours ago', read: true },
  { id: 'n5', type: 'deadline', message: '"Auth Module" deadline is tomorrow', time: 'Yesterday', read: true },
  { id: 'n6', type: 'invite', message: 'You were invited to Project Alpha', time: 'Yesterday', read: true },
];

const MOCK_ATTACHMENTS = [
  { name: 'design-mockup-v2.fig', size: 2400000, uploadedAt: '8 hours ago' },
  { name: 'api-documentation.pdf', size: 450000, uploadedAt: '1 day ago' },
  { name: 'screenshot-login.png', size: 180000, uploadedAt: '2 days ago', thumbnail: '' },
  { name: 'requirements.md', size: 12000, uploadedAt: '3 days ago' },
];

const MOCK_RELATED_TASKS = [
  { id: 'rt1', title: 'Database Schema Design', status: 'completed', priority: 'high' },
  { id: 'rt2', title: 'API Documentation', status: 'in-progress', priority: 'medium' },
  { id: 'rt3', title: 'Unit Test Coverage', status: 'pending', priority: 'medium' },
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
  { id: 'u4', name: 'Dev Patel', role: 'Designer', email: 'dev@obliq.dev' },
  { id: 'u5', name: 'Sara Khan', role: 'QA', email: 'sara@obliq.dev' },
];

const CHECKLIST = [
  { id: 'cl1', text: 'Set up JWT authentication', done: true },
  { id: 'cl2', text: 'Implement refresh token rotation', done: true },
  { id: 'cl3', text: 'Add rate limiting middleware', done: false },
  { id: 'cl4', text: 'Write integration tests', done: false },
  { id: 'cl5', text: 'Update API documentation', done: false },
];

// ─── ACTIVITY ICON MAP ──────────────────────────────────────
const activityIconMap = {
  created: Plus,
  status: Zap,
  assign: UserPlus,
  priority: Flag,
  attachment: Paperclip,
  comment: MessageSquare,
  commit: CheckCircle2,
};

// ─── MAIN COMPONENT ─────────────────────────────────────────
export default function TaskDetail() {
  const { taskId, projectId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // State
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const [newComment, setNewComment] = useState('');
  const [expandedThreads, setExpandedThreads] = useState(new Set(['c1']));
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [checklist, setChecklist] = useState(CHECKLIST);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [mobileTab, setMobileTab] = useState('details');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [isWatching, setIsWatching] = useState(true);
  const commentInputRef = useRef(null);

  // Fetch task
  useEffect(() => {
    const fetchTask = async () => {
      setLoading(true);
      try {
        const data = await api.getTaskById(taskId);
        setTask(data.task);
      } catch (err) {
        console.error('Failed to load task:', err);
      } finally {
        setLoading(false);
      }
    };
    if (taskId) fetchTask();
  }, [taskId]);

  // Handlers
  const toggleThread = (commentId) => {
    setExpandedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment = {
      id: `c${Date.now()}`,
      user: { id: currentUser?.id || 'u1', name: currentUser?.name || 'You', role: 'Member' },
      message: newComment,
      timestamp: 'Just now',
      edited: false,
      reactions: [],
      replies: [],
    };
    setComments([comment, ...comments]);
    setNewComment('');
  };

  const handleAddReply = (commentId) => {
    if (!replyText.trim()) return;
    const reply = {
      id: `r${Date.now()}`,
      user: { id: currentUser?.id || 'u1', name: currentUser?.name || 'You', role: 'Member' },
      message: replyText,
      timestamp: 'Just now',
      edited: false,
      reactions: [],
    };
    setComments(comments.map((c) =>
      c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c
    ));
    setReplyText('');
    setReplyingTo(null);
    setExpandedThreads((prev) => new Set([...prev, commentId]));
  };

  const handleToggleReaction = (commentId, emoji, isReply = false, parentId = null) => {
    const userId = currentUser?.id || 'u1';
    const updateReactions = (reactions) => {
      const existing = reactions.find((r) => r.emoji === emoji);
      if (existing) {
        if (existing.users.includes(userId)) {
          const newUsers = existing.users.filter((u) => u !== userId);
          if (newUsers.length === 0) return reactions.filter((r) => r.emoji !== emoji);
          return reactions.map((r) => r.emoji === emoji ? { ...r, count: newUsers.length, users: newUsers } : r);
        }
        return reactions.map((r) => r.emoji === emoji ? { ...r, count: r.count + 1, users: [...r.users, userId] } : r);
      }
      return [...reactions, { emoji, count: 1, users: [userId] }];
    };

    if (isReply && parentId) {
      setComments(comments.map((c) =>
        c.id === parentId ? {
          ...c,
          replies: c.replies.map((r) =>
            r.id === commentId ? { ...r, reactions: updateReactions(r.reactions) } : r
          )
        } : c
      ));
    } else {
      setComments(comments.map((c) =>
        c.id === commentId ? { ...c, reactions: updateReactions(c.reactions) } : c
      ));
    }
  };

  const handleChecklistToggle = (id) => {
    setChecklist(checklist.map((item) =>
      item.id === id ? { ...item, done: !item.done } : item
    ));
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const handleCommentInput = (e) => {
    const value = e.target.value;
    setNewComment(value);
    // Check for @mention
    const lastAt = value.lastIndexOf('@');
    if (lastAt !== -1 && lastAt === value.length - 1 || (lastAt !== -1 && !value.substring(lastAt).includes(' '))) {
      setShowMentionDropdown(true);
      setMentionSearch(value.substring(lastAt + 1));
    } else {
      setShowMentionDropdown(false);
    }
  };

  const handleMentionSelect = (user) => {
    const lastAt = newComment.lastIndexOf('@');
    const before = newComment.substring(0, lastAt);
    setNewComment(`${before}@${user.name} `);
    setShowMentionDropdown(false);
    commentInputRef.current?.focus();
  };

  // Auto-expand textarea
  const handleTextareaResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  // Derived
  const completedChecklist = checklist.filter((i) => i.done).length;
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Mock task data enrichment
  const taskData = task ? {
    ...task,
    taskId: `OBL-${String(task._id).slice(-4).toUpperCase()}`,
    sprint: 'Sprint 3',
    estimatedHours: 24,
    spentHours: 16,
    tags: MOCK_TAGS,
    watchers: MOCK_WATCHERS,
  } : null;

  // Loading state
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

  // ─── MOBILE TABS ────────────────────────────────────────────
  const mobileTabs = [
    { key: 'details', label: 'Details', icon: FileText },
    { key: 'comments', label: 'Comments', icon: MessageSquare, count: comments.length },
    { key: 'activity', label: 'Activity', icon: Activity },
  ];

  // ─── RENDER ─────────────────────────────────────────────────
  return (
    <div className="animate-fade-in">
      {/* ── Breadcrumb & Back ── */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => navigate(`/project/${projectId}`)}
          className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Board
        </button>
        <ChevronRight className="w-3 h-3 text-[var(--text-muted)]" />
        <span className="text-xs font-medium text-[var(--text-tertiary)]">{taskData.taskId}</span>
      </div>

      {/* ── Mobile Tab Bar ── */}
      <div className="lg:hidden mb-4">
        <TabBar tabs={mobileTabs} activeTab={mobileTab} onChange={setMobileTab} />
      </div>

      {/* ── Three Column Layout ── */}
      <div className="flex gap-6 items-start">

        {/* ════════ CENTER CONTENT ════════ */}
        <div className={`flex-1 min-w-0 space-y-6 ${mobileTab !== 'details' && mobileTab !== 'comments' ? 'hidden lg:block' : ''}`}>

          {/* ── Task Header ── */}
          <div className={`${mobileTab !== 'details' ? 'hidden lg:block' : ''}`}>
            <div className="space-y-4">
              {/* Title Row */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded-md border border-[var(--border-secondary)]">
                      {taskData.taskId}
                    </span>
                    <Badge variant={task.priority} size="sm" dot>{task.priority}</Badge>
                    <Badge variant={task.status} size="sm" dot>{task.status?.replace('-', ' ')}</Badge>
                  </div>
                  <h1 className="text-2xl font-bold text-[var(--text-primary)] leading-tight tracking-tight">
                    {task.title}
                  </h1>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant={isWatching ? 'secondary' : 'ghost'}
                    size="icon-sm"
                    icon={Eye}
                    onClick={() => setIsWatching(!isWatching)}
                    title={isWatching ? 'Unwatch' : 'Watch'}
                    className={isWatching ? 'text-[var(--accent-primary)]' : ''}
                  />
                  <Button variant="ghost" size="icon-sm" icon={Share2} title="Share" />
                  <Button variant="ghost" size="icon-sm" icon={Bookmark} title="Bookmark" />
                  <Dropdown align="right" trigger={
                    <Button variant="ghost" size="icon-sm" icon={MoreHorizontal} title="More" />
                  }>
                    <DropdownItem icon={Edit3} onClick={() => {}}>Edit Task</DropdownItem>
                    <DropdownItem icon={Copy}>Copy Link</DropdownItem>
                    <DropdownItem icon={ExternalLink}>Open in New Tab</DropdownItem>
                    <DropdownItem icon={UserPlus}>Assign Members</DropdownItem>
                    <DropdownItem icon={Paperclip}>Add Attachment</DropdownItem>
                    <DropdownDivider />
                    <DropdownItem icon={Trash2} variant="danger">Delete Task</DropdownItem>
                  </Dropdown>
                </div>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl">
                {/* Status */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Status</span>
                  <div className="flex items-center gap-1.5">
                    <StatusIcon className={`w-3.5 h-3.5 ${task.status === 'completed' ? 'text-emerald-400' : task.status === 'in-progress' ? 'text-blue-400' : 'text-[var(--text-tertiary)]'}`} />
                    <span className="text-sm font-semibold text-[var(--text-primary)] capitalize">{task.status?.replace('-', ' ')}</span>
                  </div>
                </div>

                {/* Priority */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Priority</span>
                  <div className="flex items-center gap-1.5">
                    <Flag className={`w-3.5 h-3.5 ${task.priority === 'high' ? 'text-rose-400' : task.priority === 'medium' ? 'text-amber-400' : 'text-[var(--text-tertiary)]'}`} />
                    <span className="text-sm font-semibold text-[var(--text-primary)] capitalize">{task.priority}</span>
                  </div>
                </div>

                {/* Due Date */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Due Date</span>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
                    </span>
                  </div>
                </div>

                {/* Sprint */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Sprint</span>
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{taskData.sprint}</span>
                  </div>
                </div>

                {/* Assignees */}
                <div className="space-y-1 col-span-2">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Assignees</span>
                  <div className="flex items-center gap-2">
                    <AvatarGroup
                      users={
                        Array.isArray(task.assignedTo)
                          ? task.assignedTo.map((a) => ({ id: a._id || a, name: a.name || 'User' }))
                          : []
                      }
                      max={5}
                      size="sm"
                    />
                    <button className="w-8 h-8 rounded-xl border-2 border-dashed border-[var(--border-primary)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/30 transition-all cursor-pointer">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Created By */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Created By</span>
                  <div className="flex items-center gap-2">
                    <Avatar name={typeof task.createdBy === 'object' ? task.createdBy.name : 'Creator'} size="xs" />
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {typeof task.createdBy === 'object' ? task.createdBy.name : 'Creator'}
                    </span>
                  </div>
                </div>

                {/* Project */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Project</span>
                  <div className="flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                    <span className="text-sm font-semibold text-[var(--accent-primary)]">
                      {typeof task.project === 'object' ? task.project.name : 'Project'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                {taskData.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 bg-[var(--accent-primary-muted)] text-[var(--accent-primary)] text-[10px] font-bold rounded-lg border border-[var(--accent-primary)]/15 uppercase tracking-wider">
                    {tag}
                  </span>
                ))}
                <button className="px-2 py-1 text-[10px] font-semibold text-[var(--text-muted)] hover:text-[var(--accent-primary)] border border-dashed border-[var(--border-primary)] hover:border-[var(--accent-primary)]/30 rounded-lg transition-all cursor-pointer">
                  + Add
                </button>
              </div>

              {/* Time Tracking & Progress */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5" />
                      Time Tracking
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-xl font-bold text-[var(--text-primary)]">{taskData.spentHours}h</span>
                    <span className="text-xs text-[var(--text-muted)]">/ {taskData.estimatedHours}h estimated</span>
                  </div>
                  <ProgressBar value={taskData.spentHours} max={taskData.estimatedHours} size="sm" showLabel={false} variant="cyan" />
                </div>

                <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5" />
                      Checklist
                    </span>
                    <span className="text-[10px] font-bold text-[var(--text-secondary)]">{completedChecklist}/{checklist.length}</span>
                  </div>
                  <ProgressBar value={completedChecklist} max={checklist.length} size="sm" showLabel={false} variant="success" />
                </div>
              </div>
            </div>

            {/* ── Description ── */}
            <div className="mt-6 p-5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl">
              <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Description
              </h3>
              <div className="prose-content text-sm text-[var(--text-secondary)] leading-relaxed">
                {task.description ? (
                  <div>
                    <p>{task.description}</p>
                    <h3>Implementation Details</h3>
                    <p>This task covers the complete authentication flow including:</p>
                    <ul>
                      <li>JWT token generation and validation</li>
                      <li>Refresh token rotation for enhanced security</li>
                      <li>Rate limiting on authentication endpoints</li>
                      <li>Password hashing with bcrypt</li>
                    </ul>
                    <blockquote>Security is the top priority for this module. All tokens must be stored in HTTP-only cookies.</blockquote>
                    <pre><code>{`// Token generation example
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};`}</code></pre>
                  </div>
                ) : (
                  <p className="text-[var(--text-muted)] italic">No description provided.</p>
                )}
              </div>
            </div>

            {/* ── Checklist ── */}
            <div className="mt-6 p-5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl">
              <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5" />
                Checklist ({completedChecklist}/{checklist.length})
              </h3>
              <div className="space-y-1">
                {checklist.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all hover:bg-[var(--bg-elevated)] group ${item.done ? 'opacity-60' : ''}`}
                  >
                    <input
                      type="checkbox"
                      className="custom-check"
                      checked={item.done}
                      onChange={() => handleChecklistToggle(item.id)}
                    />
                    <span className={`text-sm font-medium ${item.done ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'} transition-all`}>
                      {item.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* ── Attachments ── */}
            <div className="mt-6 p-5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl">
              <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
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
                    onDownload={() => {}}
                    onDelete={() => {}}
                  />
                ))}
              </div>
              <div className="mt-3">
                <UploadZone onDrop={() => {}} />
              </div>
            </div>
          </div>

          {/* ── Comments Section ── */}
          <div className={`${mobileTab !== 'details' && mobileTab !== 'comments' ? 'hidden lg:block' : ''}`}>
            <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl">
              <CommentSection
                taskId={taskId}
                projectId={projectId || task?.project?._id || task?.project}
                currentUser={currentUser}
              />
            </div>
          </div>

        </div>

        {/* ════════ RIGHT SIDEBAR ════════ */}
        <aside className={`w-80 shrink-0 space-y-4 sticky top-24 ${mobileTab !== 'activity' ? 'hidden lg:block' : ''}`}>

          {/* ── Activity Timeline ── */}
          <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl">
            <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Recent Activity
            </h3>
            <div className="space-y-0 relative">
              {/* Timeline line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[var(--border-secondary)]" />

              {MOCK_ACTIVITY.map((item) => {
                const IconComp = activityIconMap[item.icon] || Circle;
                return (
                  <div key={item.id} className="flex gap-3 py-2 relative">
                    <div className={`w-6 h-6 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-primary)] flex items-center justify-center shrink-0 z-10 ${item.color}`}>
                      <IconComp className="w-3 h-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-[var(--text-secondary)] leading-snug">
                        <span className="font-bold text-[var(--text-primary)]">{item.user}</span>{' '}
                        {item.action}
                      </p>
                      <span className="text-[9px] text-[var(--text-muted)]">{item.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Notifications ── */}
          <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" />
                Notifications
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-[var(--accent-primary)] text-white text-[9px] font-bold rounded-full min-w-[18px] text-center">
                    {unreadCount}
                  </span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[9px] font-semibold text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] cursor-pointer transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-2.5 p-2 rounded-lg transition-all cursor-pointer ${notif.read ? 'opacity-60' : 'bg-[var(--accent-primary-muted)]'} hover:bg-[var(--bg-elevated)]`}
                >
                  {!notif.read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] mt-1.5 shrink-0" />
                  )}
                  <div className={`min-w-0 flex-1 ${notif.read ? 'ml-4' : ''}`}>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-snug">{notif.message}</p>
                    <span className="text-[9px] text-[var(--text-muted)]">{notif.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Quick Actions ── */}
          <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl">
            <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="xs" icon={Edit3} className="justify-start w-full">Edit</Button>
              <Button variant="secondary" size="xs" icon={UserPlus} className="justify-start w-full">Assign</Button>
              <Button variant="secondary" size="xs" icon={Paperclip} className="justify-start w-full">Attach</Button>
              <Button variant="secondary" size="xs" icon={Copy} className="justify-start w-full">Copy ID</Button>
            </div>
          </div>

          {/* ── Watchers ── */}
          <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl">
            <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Watchers ({taskData.watchers.length})
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {taskData.watchers.map((w) => (
                <Avatar key={w.id} name={w.name} size="sm" className="hover:scale-110 transition-transform cursor-pointer" />
              ))}
              <button className="w-8 h-8 rounded-xl border-2 border-dashed border-[var(--border-primary)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/30 transition-all cursor-pointer">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ── Related Tasks ── */}
          <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl">
            <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Related Tasks</h3>
            <div className="space-y-2">
              {MOCK_RELATED_TASKS.map((rt) => (
                <div key={rt.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-all cursor-pointer group">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${rt.status === 'completed' ? 'bg-emerald-400' : rt.status === 'in-progress' ? 'bg-blue-400' : 'bg-[var(--text-muted)]'}`} />
                  <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors truncate flex-1">
                    {rt.title}
                  </span>
                  <Badge variant={rt.priority} size="xs">{rt.priority}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* ── Task Statistics ── */}
          <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl">
            <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
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
                <div key={stat.label} className="p-2.5 bg-[var(--bg-elevated)] rounded-xl text-center">
                  <stat.icon className="w-3.5 h-3.5 text-[var(--text-muted)] mx-auto mb-1" />
                  <p className="text-sm font-bold text-[var(--text-primary)]">{stat.value}</p>
                  <p className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Project Members ── */}
          <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl">
            <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Project Members
            </h3>
            <div className="space-y-1.5">
              {MOCK_MEMBERS.slice(0, 5).map((member) => (
                <div key={member.id} className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] transition-all cursor-pointer">
                  <Avatar name={member.name} size="xs" status="online" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-[var(--text-primary)] truncate">{member.name}</p>
                    <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </aside>
      </div>

      {/* ── Mobile Floating Comment Button ── */}
      <button
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-[var(--accent-primary)] text-white rounded-2xl shadow-lg shadow-indigo-900/30 flex items-center justify-center z-40 hover:scale-105 active:scale-95 transition-transform animate-glow-pulse"
        onClick={() => setMobileTab('comments')}
        aria-label="Add comment"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    </div>
  );
}
