import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../services/api';
import {
  Activity, Shield, CheckCircle2, Clock3, MessageSquare,
  UserPlus, FolderKanban, Plus, Filter, Info, Lock
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

export default function ActivityLog() {
  const { user } = useAuth();
  const { activeWorkspace, projects } = useWorkspace();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    let cancelled = false;
    async function loadWorkspaceData() {
      if (!activeWorkspace?._id) return;
      setLoading(true);
      try {
        const [membersRes, ...taskResList] = await Promise.all([
          api.getWorkspaceMembers(activeWorkspace._id),
          ...projects.map((p) => api.getTasks(p._id)),
        ]);
        if (cancelled) return;

        setMembers(membersRes.members || []);
        const allTasks = taskResList.flatMap((res, index) =>
          (res.tasks || []).map((t) => ({
            ...t,
            project: { _id: projects[index]._id, name: projects[index].name },
          }))
        );
        setTasks(allTasks);
      } catch (err) {
        console.error('Failed to load activity logs:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadWorkspaceData();
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace?._id, projects]);

  // Determine user's role in the current workspace
  const currentMember = members.find(
    (m) =>
      m.user?._id === user?.id ||
      m.user?._id === user?._id ||
      m.user?.email === user?.email
  );
  const userRole = currentMember?.role || (activeWorkspace?.owner === user?._id ? 'owner' : 'member');

  // Build activity feed
  const rawActivities = useMemo(() => {
    const list = [];

    // Task events
    tasks.forEach((t) => {
      const isAssignedToMe =
        Array.isArray(t.assignedTo) &&
        t.assignedTo.some(
          (u) =>
            (typeof u === 'object' ? u._id : u) === user?._id ||
            (typeof u === 'object' && u.email === user?.email)
        );

      list.push({
        id: `task-${t._id}`,
        type: 'task',
        title: t.title,
        status: t.status,
        project: t.project?.name,
        projectId: t.project?._id,
        user: t.assignedTo?.[0]?.name || 'Teammate',
        action:
          t.status === 'completed'
            ? 'completed task'
            : t.status === 'in-progress'
            ? 'moved task to In Progress'
            : 'created task',
        date: new Date(t.updatedAt || t.createdAt || Date.now()),
        isRelevantToUser: isAssignedToMe,
      });
    });

    // Member joins
    members.forEach((m) => {
      list.push({
        id: `member-${m._id}`,
        type: 'member',
        title: m.user?.name || 'New Member',
        user: m.user?.name || 'User',
        role: m.role,
        action: `joined workspace as ${m.role}`,
        date: new Date(m.joinedAt || Date.now()),
        isRelevantToUser: true,
      });
    });

    // Project creates
    projects.forEach((p) => {
      list.push({
        id: `project-${p._id}`,
        type: 'project',
        title: p.name,
        user: 'Workspace Lead',
        action: 'created project',
        date: new Date(p.createdAt || Date.now()),
        isRelevantToUser: true,
      });
    });

    return list.sort((a, b) => b.date - a.date);
  }, [tasks, members, projects, user]);

  // Apply Role-Based Filtering
  const roleFilteredActivities = useMemo(() => {
    if (userRole === 'owner') {
      // Owner sees all activities
      return rawActivities;
    }
    if (userRole === 'manager') {
      // Manager sees project and team task activity
      return rawActivities.filter((a) => a.type === 'task' || a.type === 'project');
    }
    // Member sees relevant tasks & workspace join info
    return rawActivities.filter((a) => a.isRelevantToUser || a.type === 'project');
  }, [rawActivities, userRole]);

  const displayActivities = useMemo(() => {
    if (filterType === 'all') return roleFilteredActivities;
    return roleFilteredActivities.filter((a) => a.type === filterType);
  }, [roleFilteredActivities, filterType]);

  return (
    <div className="space-y-6 animate-slide-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400 mb-1.5 uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5" />
            Audit & Live Activity Feed
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Activity Log</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
              Role: {userRole}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time workspace timeline filtered for your access tier.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 bg-[#0c121e] p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterType === 'all' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Activity
          </button>
          <button
            onClick={() => setFilterType('task')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterType === 'task' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => setFilterType('project')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterType === 'project' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Projects
          </button>
          {userRole === 'owner' && (
            <button
              onClick={() => setFilterType('member')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterType === 'member' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Members
            </button>
          )}
        </div>
      </div>

      {/* Role Permission Banner */}
      <div className="bg-[#0c121e] border border-slate-800/80 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 text-xs">
          <Shield className="w-5 h-5 text-blue-400 shrink-0" />
          <div>
            <span className="font-semibold text-slate-200 uppercase font-mono text-[11px] mr-2">
              {userRole} Tier
            </span>
            <span className="text-slate-400">
              {userRole === 'owner'
                ? 'Full workspace visibility: you can view all activity, member events, and roles.'
                : userRole === 'manager'
                ? 'Manager visibility: view team task updates, status changes, and project activity.'
                : 'Member visibility: view personal task activity and project notifications.'}
            </span>
          </div>
        </div>
      </div>

      {/* Activity Timeline Feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : displayActivities.length === 0 ? (
        <div className="bg-[#0c121e] border border-slate-800 rounded-xl p-8 text-center">
          <EmptyState
            icon={Activity}
            title="No activity recorded"
            description="Recent workspace actions and task updates will appear here."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {displayActivities.map((act) => (
            <div
              key={act.id}
              className="p-4 bg-[#0c121e] rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors flex items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <Avatar name={act.user} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-300 leading-snug">
                    <span className="font-semibold text-slate-100">{act.user}</span>{' '}
                    <span className="text-slate-400">{act.action}</span>{' '}
                    <span className="font-medium text-blue-400">{act.title}</span>
                    {act.project && (
                      <span className="text-slate-500 font-mono text-[11px] ml-2">
                        [{act.project}]
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1 font-mono">
                    <Clock3 className="w-3 h-3" />
                    {act.date.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {act.projectId && (
                <Link
                  to={`/project/${act.projectId}`}
                  className="text-xs text-slate-400 hover:text-blue-400 transition-colors font-medium shrink-0"
                >
                  View →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
