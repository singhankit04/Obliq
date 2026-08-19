import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../services/api';
import {
  Activity, AlertTriangle, ArrowRight, CheckCircle2, Circle,
  ChevronRight, Clock3, FolderKanban, Plus,
  Sparkles, Target, TrendingUp, UserPlus, ArrowUpRight,
  SlidersHorizontal, Check, X
} from 'lucide-react';
import Avatar, { AvatarGroup } from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Dialog, { DialogFooter } from '../components/ui/Dialog';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

function MetricCard({ label, value, detail, icon: Icon, tone = 'blue', trend, subtext, active = false, onClick }) {
  const toneGradients = {
    blue: 'from-blue-500/10 to-transparent border-blue-500/20 text-blue-400',
    amber: 'from-amber-500/10 to-transparent border-amber-500/20 text-amber-400',
    emerald: 'from-emerald-500/10 to-transparent border-emerald-500/20 text-emerald-400',
    purple: 'from-purple-500/10 to-transparent border-purple-500/20 text-purple-400',
  };

  const activeBorders = {
    blue: 'border-blue-500/70 bg-blue-500/[0.04] ring-1 ring-blue-500/30',
    amber: 'border-amber-500/70 bg-amber-500/[0.04] ring-1 ring-amber-500/30',
    emerald: 'border-emerald-500/70 bg-emerald-500/[0.04] ring-1 ring-emerald-500/30',
    purple: 'border-purple-500/70 bg-purple-500/[0.04] ring-1 ring-purple-500/30',
  };

  return (
    <Card
      onClick={onClick}
      className={`relative overflow-hidden p-5 group transition-all select-none ${
        onClick ? 'cursor-pointer hover:border-white/[0.2] hover:scale-[1.01] active:scale-[0.99]' : ''
      } ${active ? activeBorders[tone] : 'hover:border-white/[0.14]'}`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${toneGradients[tone]} rounded-bl-full pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity`} />
      <div className="relative flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400 tracking-tight flex items-center gap-1.5">
          {label}
          {active && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          )}
        </span>
        <div className={`p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] ${toneGradients[tone]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-100">{value}</span>
        {trend && (
          <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>
      <p className="mt-2 text-xs text-zinc-500">{detail || subtext}</p>
    </Card>
  );
}

export default function Dashboard() {
  const { activeWorkspace, projects } = useWorkspace();
  const { user: currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState('all'); // 'all' | 'active' | 'completed' | 'overdue'
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteResults, setInviteResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteStatus, setInviteStatus] = useState({ type: '', message: '' });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadDashboard() {
      if (!activeWorkspace?._id) return;
      setLoading(true);
      try {
        const [memberData, ...taskData] = await Promise.all([
          api.getWorkspaceMembers(activeWorkspace._id),
          ...projects.map((project) => api.getTasks(project._id)),
        ]);
        if (cancelled) return;
        setMembers(memberData.members || []);
        setTasks(
          taskData.flatMap((response, index) =>
            (response.tasks || []).map((task) => ({
              ...task,
              project: { _id: projects[index]._id, name: projects[index].name },
            }))
          )
        );
      } catch {
        if (!cancelled) {
          setMembers([]);
          setTasks([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace?._id, projects]);

  useEffect(() => {
    if (inviteEmail.trim().length < 2) return;
    const timer = window.setTimeout(async () => {
      try {
        const data = await api.searchUsers(inviteEmail);
        const selectedIds = new Set(selectedUsers.map((u) => u._id));
        const memberIds = new Set(members.map((m) => m.user?._id));
        setInviteResults(
          (data.users || []).filter(
            (u) => !selectedIds.has(u._id) && !memberIds.has(u._id)
          )
        );
      } catch {
        setInviteResults([]);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [inviteEmail, members, selectedUsers]);



  const stats = useMemo(() => {
    const currentUserId = currentUser?._id || currentUser?.id;
    // Active tasks: in-progress tasks (or active tasks for current user)
    const activeTasks = tasks.filter((task) => {
      if (task.status !== 'in-progress') return false;
      if (!currentUserId || !task.assignedTo) return true;
      if (Array.isArray(task.assignedTo)) {
        return task.assignedTo.some((u) => (typeof u === 'object' ? u._id : u) === currentUserId);
      }
      return (typeof task.assignedTo === 'object' ? task.assignedTo._id : task.assignedTo) === currentUserId;
    }).length || tasks.filter((task) => task.status === 'in-progress').length;

    // Total active tasks across the entire workspace
    const totalActiveTasks = tasks.filter((task) => task.status !== 'completed').length;

    // Completed projects
    const completedProjects = projects.filter((project) => {
      if (project.status === 'completed') return true;
      const projTasks = tasks.filter((t) => t.project?._id === project._id);
      return projTasks.length > 0 && projTasks.every((t) => t.status === 'completed');
    }).length;

    // Overdue projects
    const overdueProjects = projects.filter((project) => {
      if (project.status === 'overdue') return true;
      const projTasks = tasks.filter((t) => t.project?._id === project._id);
      return projTasks.some((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed');
    }).length;

    // Active projects
    const activeProjects = projects.filter((p) => p.status !== 'completed' && p.status !== 'archived').length || projects.length;

    return { activeProjects, activeTasks, totalActiveTasks, completedProjects, overdueProjects };
  }, [tasks, projects, currentUser]);

  const displayedProjects = useMemo(() => {
    return projects.filter((project) => {
      const projectTasks = tasks.filter((t) => t.project?._id === project._id);
      const isCompleted =
        project.status === 'completed' ||
        (projectTasks.length > 0 && projectTasks.every((t) => t.status === 'completed'));
      const isOverdue =
        project.status === 'overdue' ||
        projectTasks.some(
          (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
        );
      const isActive = !isCompleted;

      if (projectFilter === 'completed') return isCompleted;
      if (projectFilter === 'overdue') return isOverdue;
      if (projectFilter === 'active') return isActive;
      return true;
    });
  }, [projects, tasks, projectFilter]);

  const activity = useMemo(
    () =>
      tasks
        .slice()
        .sort(
          (first, second) =>
            new Date(second.updatedAt || second.createdAt || 0) -
            new Date(first.updatedAt || first.createdAt || 0)
        )
        .slice(0, 5)
        .map((task, index) => ({
          id: task._id,
          name:
            task.assignedTo?.[0]?.name ||
            (index % 2 ? 'Teammate' : currentUser?.name || 'You'),
          action:
            task.status === 'completed'
              ? 'completed'
              : task.status === 'in-progress'
              ? 'in progress with'
              : 'created',
          task: task.title,
          time: task.updatedAt || task.createdAt,
        })),
    [tasks, currentUser?.name]
  );

  const openProjectModal = () =>
    window.dispatchEvent(new CustomEvent('obliq:create-project'));
  const openFirstProject = () => {
    if (projects[0]?._id) window.location.assign(`/project/${projects[0]._id}`);
    else openProjectModal();
  };

  const handleInvite = async (event) => {
    event.preventDefault();
    if (!activeWorkspace?._id || selectedUsers.length === 0) return;
    setInviting(true);
    setInviteStatus({ type: '', message: '' });
    try {
      await api.inviteWorkspaceMember(
        activeWorkspace._id,
        selectedUsers.map((user) => user._id),
        inviteRole
      );
      setInviteStatus({
        type: 'success',
        message: `Invite sent to ${selectedUsers.length} ${
          selectedUsers.length === 1 ? 'member' : 'members'
        }.`,
      });
      setSelectedUsers([]);
      setInviteEmail('');
    } catch (error) {
      setInviteStatus({
        type: 'error',
        message: error.message || 'Could not send the invite.',
      });
    } finally {
      setInviting(false);
    }
  };

  const firstName = currentUser?.name?.split(' ')[0] || 'there';

  const isManagerOrAdmin = useMemo(() => {
    if (!currentUser || !activeWorkspace) return false;
    const currentUserId = currentUser._id || currentUser.id;
    const ownerId = typeof activeWorkspace.owner === 'object' ? activeWorkspace.owner?._id : activeWorkspace.owner;
    return (
      activeWorkspace.role === 'owner' ||
      activeWorkspace.role === 'manager' ||
      activeWorkspace.role === 'admin' ||
      ownerId === currentUserId
    );
  }, [currentUser, activeWorkspace]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="w-full h-full flex flex-col min-h-0 space-y-4 overflow-hidden"
    >
      {/* Header Section */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-3.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-100">
            Welcome, {firstName}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          {isManagerOrAdmin && (
            <Button
              variant="secondary"
              size="sm"
              icon={UserPlus}
              onClick={() => setShowInvite(true)}
            >
              Invite Member
            </Button>
          )}
          {isManagerOrAdmin && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={openProjectModal}
            >
              New Project
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <SkeletonCard key={item} />
          ))}
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <MetricCard
              label="Active Projects"
              value={stats.activeProjects}
              detail={`${members.length} team members involved`}
              icon={FolderKanban}
              tone="blue"
              active={projectFilter === 'active'}
              onClick={() => setProjectFilter(projectFilter === 'active' ? 'all' : 'active')}
            />
            <MetricCard
              label="Completed Projects"
              value={stats.completedProjects}
              detail={`${projects.length} total projects`}
              icon={CheckCircle2}
              tone="emerald"
              active={projectFilter === 'completed'}
              onClick={() => setProjectFilter(projectFilter === 'completed' ? 'all' : 'completed')}
            />
            <MetricCard
              label="Overdue Projects"
              value={stats.overdueProjects}
              detail={stats.overdueProjects > 0 ? "Requires attention" : "All on schedule"}
              icon={Clock3}
              tone={stats.overdueProjects > 0 ? "amber" : "blue"}
              active={projectFilter === 'overdue'}
              onClick={() => setProjectFilter(projectFilter === 'overdue' ? 'all' : 'overdue')}
            />
            <MetricCard
              label="Tasks"
              value={tasks.length}
              detail={`${stats.totalActiveTasks} active, ${tasks.filter(t => t.status === 'completed').length} completed`}
              icon={Target}
              tone="purple"
              active={projectFilter === 'all'}
              onClick={() => setProjectFilter('all')}
            />
          </div>

          {/* Main Grid */}
          <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12 gap-4 overflow-hidden">
            {/* Left 8 Cols: Projects & Task Board */}
            <div className="xl:col-span-8 h-full flex flex-col min-h-0 overflow-hidden">
              {/* Projects Overview */}
              <Card padding="none" className="h-full flex flex-col min-h-0 overflow-hidden p-4">
                <div className="shrink-0 flex items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-zinc-400" />
                    <h2 className="text-sm font-semibold text-zinc-200">
                      {projectFilter === 'completed'
                        ? 'Completed Projects'
                        : projectFilter === 'overdue'
                        ? 'Overdue Projects'
                        : projectFilter === 'active'
                        ? 'Active Projects'
                        : 'Projects'}
                    </h2>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      ({displayedProjects.length})
                    </span>
                    {projectFilter !== 'all' && (
                      <button
                        onClick={() => setProjectFilter('all')}
                        className="text-[10px] text-zinc-400 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] px-2 py-0.5 rounded border border-white/[0.08] transition-colors cursor-pointer"
                      >
                        Clear filter ×
                      </button>
                    )}
                  </div>
                  {isManagerOrAdmin && (
                    <button
                      onClick={openProjectModal}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer flex items-center gap-1 font-medium"
                    >
                      Create Project <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {displayedProjects.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <EmptyState
                      icon={FolderKanban}
                      title={
                        projectFilter === 'completed'
                          ? 'No completed projects'
                          : projectFilter === 'overdue'
                          ? 'No overdue projects'
                          : projectFilter === 'active'
                          ? 'No active projects'
                          : 'No projects yet'
                      }
                      description={
                        projectFilter !== 'all'
                          ? 'Try clearing the active filter.'
                          : isManagerOrAdmin
                          ? 'Create a project to organize tasks, assign collaborators, and track progress.'
                          : 'No projects found in this workspace.'
                      }
                      actionLabel={projectFilter !== 'all' ? 'Show all projects' : isManagerOrAdmin ? 'Create project' : undefined}
                      onAction={projectFilter !== 'all' ? () => setProjectFilter('all') : isManagerOrAdmin ? openProjectModal : undefined}
                    />
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
                    {displayedProjects.map((project, idx) => {
                      const projectTasks = tasks.filter((t) => t.project?._id === project._id);
                      const doneTasks = projectTasks.filter((t) => t.status === 'completed').length;
                      const pct = projectTasks.length
                        ? Math.round((doneTasks / projectTasks.length) * 100)
                        : 0;

                      return (
                        <Link
                          key={project._id}
                          to={`/project/${project._id}`}
                          className="group flex items-center justify-between p-3 rounded-lg border border-white/[0.05] bg-[#0C0F14] hover:bg-[#131720] hover:border-white/[0.12] transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                              <FolderKanban className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-zinc-200 group-hover:text-white transition-colors truncate">
                                {project.name}
                              </p>
                              <p className="text-[11px] text-zinc-500 truncate">
                                {project.description || 'No description'}
                              </p>
                            </div>
                          </div>

                          <div className="hidden sm:block w-36 px-2">
                            <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1">
                              <span>{pct}%</span>
                              <span>{doneTasks}/{projectTasks.length} tasks</span>
                            </div>
                            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          <div className="hidden md:flex items-center">
                            <AvatarGroup users={members.map((m) => m.user || m)} size="xs" max={3} />
                          </div>

                          {(() => {
                            const isCompleted = project.status === 'completed' || (projectTasks.length > 0 && doneTasks === projectTasks.length);
                            const isDue = project.status === 'overdue' || project.status === 'due' || projectTasks.some((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed');
                            const statusLabel = isCompleted ? 'Completed' : isDue ? 'Due' : 'Active';
                            const statusStyle = isCompleted
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                              : isDue
                              ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                              : 'text-zinc-400 bg-white/[0.04] border-white/[0.06]';

                            return (
                              <div className={`text-[10px] font-mono px-2 py-0.5 rounded border ${statusStyle}`}>
                                {statusLabel}
                              </div>
                            );
                          })()}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* Right 4 Cols: Upcoming & Workspace Activity */}
            <div className="xl:col-span-4 h-full flex flex-col gap-4 min-h-0 overflow-hidden">
              {/* Upcoming Deadlines */}
              <Card padding="none" className="flex-1 min-h-0 flex flex-col overflow-hidden p-4">
                <div className="shrink-0 flex items-center justify-between pb-2.5">
                  <div className="flex items-center gap-2">
                    <Clock3 className="w-4 h-4 text-zinc-400" />
                    <h2 className="text-sm font-semibold text-zinc-200">Upcoming Deadlines</h2>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {tasks.filter((t) => t.status !== 'completed' && t.dueDate).length} tasks
                  </span>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
                  {tasks
                    .filter((t) => t.status !== 'completed' && t.dueDate)
                    .map((task) => {
                      const isOverdue = new Date(task.dueDate) < new Date();
                      return (
                        <Link
                          key={task._id}
                          to={`/project/${task.project?._id}/task/${task._id}`}
                          className="block p-2.5 rounded-lg border border-white/[0.05] bg-[#0C0F14] hover:bg-[#131720] hover:border-white/[0.1] transition-colors"
                        >
                          <div className="text-xs font-medium text-zinc-200 truncate mb-1">
                            {task.title}
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-zinc-500 truncate max-w-[120px]">
                              {task.project?.name}
                            </span>
                            <span className={`font-mono ${isOverdue ? 'text-rose-400' : 'text-amber-400'}`}>
                              {new Date(task.dueDate).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </Link>
                      );
                    })}

                  {tasks.filter((t) => t.status !== 'completed' && t.dueDate).length === 0 && (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-xs text-zinc-500 py-4 text-center">
                        No upcoming task deadlines.
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Workspace Activity Stream */}
              <Card padding="none" className="flex-1 min-h-0 flex flex-col overflow-hidden p-4">
                <div className="shrink-0 flex items-center gap-2 pb-2.5">
                  <Activity className="w-4 h-4 text-zinc-400" />
                  <h2 className="text-sm font-semibold text-zinc-200">Recent Stream</h2>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto space-y-3 px-1 pr-1">
                  {activity.map((item) => (
                    <div key={item.id} className="flex items-start gap-2.5 text-xs text-zinc-400">
                      <Avatar name={item.name} size="xs" className="mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="leading-snug">
                          <span className="font-medium text-zinc-200">{item.name}</span>{' '}
                          <span className="text-zinc-400">{item.action}</span>{' '}
                          <span className="text-zinc-300 font-medium">{item.task}</span>
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          {item.time
                            ? new Date(item.time).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'Recently'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {activity.length === 0 && (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-xs text-zinc-500 py-4 text-center">
                        No recent activity yet.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Invite Member Dialog */}
      <Dialog
        open={showInvite}
        onClose={() => setShowInvite(false)}
        title="Invite Team Member"
        description={`Bring collaborators into "${activeWorkspace?.name || 'Workspace'}"`}
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <Input
              label="Search by Email or Name"
              id="invite-email"
              autoFocus
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="name@company.com"
            />
            {inviteResults.length > 0 && (
              <div className="mt-2 divide-y divide-white/[0.06] rounded-lg border border-white/[0.08] bg-[#0A0D13] max-h-40 overflow-y-auto">
                {inviteResults.map((user) => (
                  <button
                    type="button"
                    key={user._id}
                    onClick={() => {
                      setSelectedUsers([...selectedUsers, user]);
                      setInviteEmail('');
                      setInviteResults([]);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-white/[0.04] transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-medium text-zinc-200">{user.name}</p>
                      <p className="text-[11px] text-zinc-500">{user.email}</p>
                    </div>
                    <Plus className="w-3.5 h-3.5 text-blue-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedUsers.map((user) => (
                <span
                  key={user._id}
                  className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/25 rounded-md px-2 py-1 text-xs text-blue-300"
                >
                  {user.name}
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedUsers(selectedUsers.filter((u) => u._id !== user._id))
                    }
                    className="hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <Select
            label="Role"
            id="invite-role"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
          >
            <option value="member">Member (Can edit tasks and projects)</option>
            <option value="manager">Manager (Can manage members and settings)</option>
          </Select>

          {inviteStatus.message && (
            <div
              className={`p-2.5 rounded-lg text-xs font-medium border ${
                inviteStatus.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/25 text-rose-300'
              }`}
            >
              {inviteStatus.message}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setShowInvite(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={inviting}
              disabled={!selectedUsers.length}
            >
              Send Invite
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </motion.div>
  );
}
