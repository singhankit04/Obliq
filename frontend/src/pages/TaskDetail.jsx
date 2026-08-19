import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Calendar, Trash2, Eye, MoreHorizontal,
  Paperclip, CheckSquare, Flag, Zap,
  MessageSquare, Activity,
  Folder, Users,
  FileText, AlertCircle, Circle, Plus,
  Copy, Share2
} from 'lucide-react';

// UI Components
import { AvatarGroup } from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Dialog, { DialogFooter } from '../components/ui/Dialog';
import Breadcrumb from '../components/ui/Breadcrumb';
import { useToast } from '../components/ui/Toast';
import ProgressBar from '../components/ui/ProgressBar';
import { SkeletonTaskDetail } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import TabBar from '../components/ui/TabBar';
import Dropdown, { DropdownItem, DropdownDivider } from '../components/ui/Dropdown';
import FilePreview, { UploadZone } from '../components/ui/FilePreview';
import CommentSection from '../components/comments/CommentSection';

const MOCK_ACTIVITY = [
  { id: 'a1', icon: 'created', user: 'Ankit Singh', action: 'created this task', time: '2 days ago', color: 'text-blue-400' },
  { id: 'a2', icon: 'status', user: 'Ankit Singh', action: 'changed status to In Progress', time: '1 day ago', color: 'text-amber-400' },
  { id: 'a3', icon: 'assign', user: 'Rahul Verma', action: 'was assigned to this task', time: '1 day ago', color: 'text-blue-400' },
  { id: 'a4', icon: 'priority', user: 'Priya Sharma', action: 'changed priority to High', time: '20 hours ago', color: 'text-rose-400' },
];

const MOCK_ATTACHMENTS = [
  { name: 'specification-v2.pdf', size: 450000, uploadedAt: '1 day ago' },
];

const MOCK_TAGS = ['core', 'feature', 'sprint-1'];

const CHECKLIST = [
  { id: 'cl1', text: 'Set up core module schema', done: true },
  { id: 'cl2', text: 'Implement service controllers & validators', done: true },
  { id: 'cl3', text: 'Connect frontend API & state hooks', done: false },
  { id: 'cl4', text: 'Write end-to-end integration tests', done: false },
];

const activityIconMap = {
  created: Plus,
  status: Zap,
  priority: Flag,
  attachment: Paperclip,
  comment: MessageSquare,
};

export default function TaskDetail() {
  const { taskId, projectId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState(CHECKLIST);
  const [mobileTab, setMobileTab] = useState('details');
  const [isWatching, setIsWatching] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
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

  const taskData = task
    ? {
        ...task,
        taskId: `OBL-${String(task._id).slice(-4).toUpperCase()}`,
        tags: MOCK_TAGS,
      }
    : null;

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
          description="This task may have been removed or you may not have access."
          actionLabel="Go Back"
          onAction={() => navigate(-1)}
        />
      </div>
    );
  }

  const mobileTabs = [
    { key: 'details', label: 'Details', icon: FileText },
    { key: 'comments', label: 'Comments', icon: MessageSquare },
    { key: 'activity', label: 'Activity', icon: Activity },
  ];

  const projectObj = typeof task.project === 'object' ? task.project : null;
  const projectName = projectObj?.name || 'Project Board';
  const resolvedProjectId = projectId || projectObj?._id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 pb-12"
    >
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: 'Workspace', href: '/' },
          { label: projectName, href: resolvedProjectId ? `/project/${resolvedProjectId}` : undefined },
          { label: taskData.taskId },
        ]}
      />

      {/* Mobile Tab Bar */}
      <div className="lg:hidden">
        <TabBar tabs={mobileTabs} activeTab={mobileTab} onChange={setMobileTab} />
      </div>

      {/* Two Column Layout (Linear Inspector Pattern) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Main Task Body (8 Cols) */}
        <div
          className={`lg:col-span-8 space-y-5 ${
            mobileTab !== 'details' && mobileTab !== 'comments' ? 'hidden lg:block' : ''
          }`}
        >
          {/* Header Card */}
          <Card padding="default" className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono font-medium text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                    {taskData.taskId}
                  </span>
                  <Badge variant={task.priority} size="xs" dot>
                    {task.priority}
                  </Badge>
                  <Badge variant={task.status} size="xs" dot>
                    {task.status?.replace('-', ' ')}
                  </Badge>
                </div>
                <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100 tracking-tight leading-snug">
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
                  className={isWatching ? 'text-blue-400' : ''}
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  icon={Share2}
                  title="Share Link"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Copied', 'Task link copied to clipboard.');
                  }}
                />
                <Dropdown
                  align="right"
                  trigger={
                    <Button variant="ghost" size="icon-sm" icon={MoreHorizontal} title="More" />
                  }
                >
                  <DropdownItem
                    icon={Copy}
                    onClick={() => {
                      navigator.clipboard.writeText(taskData.taskId);
                      toast.success('Copied', 'Task ID copied.');
                    }}
                  >
                    Copy Task ID
                  </DropdownItem>
                  <DropdownDivider />
                  <DropdownItem
                    icon={Trash2}
                    variant="danger"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Delete Task
                  </DropdownItem>
                </Dropdown>
              </div>
            </div>

            {/* Description */}
            <div className="pt-2 border-t border-white/[0.06]">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Description
              </h3>
              <div className="text-xs text-zinc-300 leading-relaxed bg-[#0A0D13] border border-white/[0.06] rounded-lg p-3.5">
                {task.description ? (
                  <p className="whitespace-pre-line">{task.description}</p>
                ) : (
                  <p className="text-zinc-500 italic">No description provided for this task.</p>
                )}
              </div>
            </div>
          </Card>

          {/* Subtasks Checklist */}
          <Card padding="default" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5" />
                Checklist ({completedChecklist}/{checklist.length})
              </h3>
              <span className="text-[11px] font-mono text-zinc-500">
                {Math.round((completedChecklist / checklist.length) * 100)}% complete
              </span>
            </div>

            <ProgressBar
              value={completedChecklist}
              max={checklist.length}
              size="sm"
              variant="success"
            />

            <div className="space-y-1 pt-1">
              {checklist.map((item) => (
                <label
                  key={item.id}
                  className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all hover:bg-white/[0.03] ${
                    item.done ? 'opacity-60' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    className="custom-check"
                    checked={item.done}
                    onChange={() => handleChecklistToggle(item.id)}
                  />
                  <span
                    className={`text-xs ${
                      item.done ? 'line-through text-zinc-500' : 'text-zinc-200'
                    }`}
                  >
                    {item.text}
                  </span>
                </label>
              ))}
            </div>
          </Card>

          {/* Attachments */}
          <Card padding="default" className="space-y-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
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
                  onDelete={() => toast.info('Notice', 'Attachment deletion disabled.')}
                />
              ))}
            </div>
            <UploadZone onDrop={() => toast.success('Upload', 'File uploaded.')} />
          </Card>

          {/* Comments Thread */}
          <Card
            padding="default"
            className={`${mobileTab !== 'details' && mobileTab !== 'comments' ? 'hidden lg:block' : ''}`}
          >
            <CommentSection
              taskId={taskId}
              projectId={resolvedProjectId}
              currentUser={currentUser}
            />
          </Card>
        </div>

        {/* RIGHT COLUMN: Metadata Property Inspector (4 Cols) */}
        <aside
          className={`lg:col-span-4 space-y-5 sticky top-20 ${
            mobileTab !== 'activity' ? 'hidden lg:block' : ''
          }`}
        >
          {/* Properties Panel */}
          <Card padding="default" className="space-y-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Properties
            </h3>

            <div className="space-y-3 divide-y divide-white/[0.05]">
              {/* Status */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <Circle className="w-3.5 h-3.5 text-zinc-500" />
                  Status
                </span>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="text-xs font-medium bg-[#0D1017] border border-white/[0.08] text-zinc-200 rounded-md px-2 py-1 focus:outline-none focus:border-blue-500/60 cursor-pointer"
                >
                  <option value="pending">To do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Priority */}
              <div className="flex items-center justify-between pt-3">
                <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-zinc-500" />
                  Priority
                </span>
                <select
                  value={task.priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  className="text-xs font-medium bg-[#0D1017] border border-white/[0.08] text-zinc-200 rounded-md px-2 py-1 focus:outline-none focus:border-blue-500/60 cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Due Date */}
              <div className="flex items-center justify-between pt-3">
                <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  Due Date
                </span>
                <span className="text-xs font-mono text-zinc-200">
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'No deadline'}
                </span>
              </div>

              {/* Project */}
              <div className="flex items-center justify-between pt-3">
                <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-zinc-500" />
                  Project
                </span>
                <span className="text-xs font-medium text-blue-400 truncate max-w-[140px]">
                  {projectName}
                </span>
              </div>

              {/* Assignees */}
              <div className="flex items-center justify-between pt-3">
                <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-zinc-500" />
                  Assignees
                </span>
                <div>
                  {Array.isArray(task.assignedTo) && task.assignedTo.length > 0 ? (
                    <AvatarGroup
                      users={task.assignedTo.map((a) => ({
                        id: a._id || a,
                        name: a.name || 'User',
                      }))}
                      max={3}
                      size="xs"
                    />
                  ) : (
                    <span className="text-xs text-zinc-500">Unassigned</span>
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="pt-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {taskData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" size="xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>

          {/* Activity Stream */}
          <Card padding="default" className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Activity Feed
            </h3>

            <div className="space-y-3 relative pt-1">
              <div className="absolute left-2.5 top-3 bottom-3 w-px bg-white/[0.06]" />
              {MOCK_ACTIVITY.map((item) => {
                const IconComp = activityIconMap[item.icon] || Circle;
                return (
                  <div key={item.id} className="flex items-start gap-2.5 text-xs relative">
                    <div
                      className={`w-5 h-5 rounded-full bg-[#0E1118] border border-white/[0.08] flex items-center justify-center shrink-0 z-10 ${item.color}`}
                    >
                      <IconComp className="w-2.5 h-2.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-zinc-300 leading-tight">
                        <span className="font-medium text-zinc-100">{item.user}</span>{' '}
                        <span className="text-zinc-400">{item.action}</span>
                      </p>
                      <span className="text-[10px] text-zinc-500">{item.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </aside>
      </div>

      {/* Confirm Delete Dialog */}
      <Dialog
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Task"
        description="Are you sure you want to permanently remove this task? This action cannot be undone."
      >
        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={deleting}
            onClick={handleDeleteTask}
          >
            Delete Task
          </Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  );
}
