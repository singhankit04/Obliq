import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../services/api';
import {
  CheckSquare, Calendar, Clock3, FolderKanban, Search,
  ChevronRight, Filter, AlertCircle, CheckCircle2, Circle
} from 'lucide-react';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

export default function MyTasks() {
  const { user } = useAuth();
  const { activeWorkspace, projects } = useWorkspace();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadUserTasks() {
      if (!activeWorkspace?._id) return;
      setLoading(true);
      try {
        const taskPromises = projects.map((p) => api.getTasks(p._id));
        const results = await Promise.all(taskPromises);
        if (cancelled) return;

        const allTasks = results.flatMap((res, index) =>
          (res.tasks || []).map((t) => ({
            ...t,
            project: { _id: projects[index]._id, name: projects[index].name },
          }))
        );

        // Filter tasks assigned to current user
        const currentUserId = user?._id || user?.id;
        const myTasks = allTasks.filter((t) => {
          if (!t.assignedTo) return false;
          if (Array.isArray(t.assignedTo)) {
            return t.assignedTo.some((u) => {
              const id = typeof u === 'object' ? u._id : u;
              return id === currentUserId || (typeof u === 'object' && u.email === user?.email);
            });
          }
          const singleId = typeof t.assignedTo === 'object' ? t.assignedTo._id : t.assignedTo;
          return singleId === currentUserId;
        });

        setTasks(myTasks);
      } catch (err) {
        console.error('Failed to load my tasks:', err);
        if (!cancelled) setTasks([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadUserTasks();
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace?._id, projects, user]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesQuery =
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.project?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [tasks, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const todo = tasks.filter((t) => t.status === 'pending').length;
    const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    return { todo, inProgress, completed, total: tasks.length };
  }, [tasks]);

  const getDaysRemainingText = (dueDateStr) => {
    if (!dueDateStr) return null;
    const dueDate = new Date(dueDateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((dueDate - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        text: `${Math.abs(diffDays)}d overdue`,
        className: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      };
    }
    if (diffDays === 0) {
      return {
        text: 'Due today',
        className: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      };
    }
    if (diffDays === 1) {
      return {
        text: 'Due tomorrow',
        className: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      };
    }
    return {
      text: `Due in ${diffDays}d`,
      className: 'text-zinc-400 bg-white/[0.04] border-white/[0.06]',
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 pb-12"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400 mb-1">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Assigned Tasks</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-100">
            My Queue
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Tasks assigned to you across{' '}
            <span className="text-zinc-200 font-medium">
              {activeWorkspace?.name || 'this workspace'}
            </span>
            .
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-[#0D1017] p-1 rounded-lg border border-white/[0.06]">
          {[
            { key: 'all', label: `All (${stats.total})` },
            { key: 'pending', label: `Todo (${stats.todo})` },
            { key: 'in-progress', label: `In Progress (${stats.inProgress})` },
            { key: 'completed', label: `Done (${stats.completed})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-[#1C202B] text-zinc-100 shadow-sm border border-white/[0.08]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search my tasks..."
            className="w-full bg-[#0D1017] border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/60 transition-colors"
          />
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card padding="lg" className="text-center">
          <EmptyState
            icon={CheckCircle2}
            title={searchQuery ? 'No matching tasks' : 'No tasks in your queue'}
            description={
              searchQuery
                ? 'Try a different search term.'
                : 'Tasks assigned to you will appear in this list.'
            }
          />
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => {
            const daysInfo = getDaysRemainingText(task.dueDate);
            return (
              <Link
                key={task._id}
                to={`/project/${task.project?._id}/task/${task._id}`}
                className="group block p-3.5 bg-[#0C0F14] rounded-lg border border-white/[0.06] hover:border-white/[0.14] hover:bg-[#12151D] transition-all shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5">
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : task.status === 'in-progress' ? (
                        <Circle className="w-4 h-4 text-blue-400 fill-blue-400/20" />
                      ) : (
                        <Circle className="w-4 h-4 text-zinc-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-zinc-200 group-hover:text-white transition-colors truncate">
                        {task.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500">
                        <span className="flex items-center gap-1 font-mono text-blue-400">
                          <FolderKanban className="w-3 h-3" />
                          {task.project?.name}
                        </span>
                        {task.description && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-md">{task.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {daysInfo && (
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${daysInfo.className}`}
                      >
                        <Clock3 className="w-3 h-3" />
                        {daysInfo.text}
                      </span>
                    )}
                    <Badge variant={task.priority || 'medium'} size="xs" dot>
                      {task.priority || 'medium'}
                    </Badge>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
