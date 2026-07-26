import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../services/api';
import {
  Activity, AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, Circle,
  ChevronRight, Clock3, FolderKanban, Grid2X2, LayoutList, Plus, Search,
  Sparkles, Target, TrendingUp, UserPlus,
} from 'lucide-react';
import Avatar, { AvatarGroup } from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

const statusConfig = {
  pending: { label: 'To do', dot: 'bg-slate-400', badge: 'pending' },
  'in-progress': { label: 'In progress', dot: 'bg-amber-400', badge: 'medium' },
  completed: { label: 'Complete', dot: 'bg-emerald-400', badge: 'completed' },
};

function Sparkline({ color = 'text-indigo-400', values = [14, 20, 18, 28, 22, 34, 31] }) {
  const points = values.map((value, index) => `${index * 16.66},${42 - value}`).join(' ');
  return (
    <svg viewBox="0 0 100 44" className={`h-11 w-24 ${color}`} aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`spark-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity=".35" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M0,44 L${points.replaceAll(' ', ' L')} L100,44 Z`} fill={`url(#spark-${color})`} />
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MetricCard({ label, value, detail, icon: Icon, tone, trend, values }) {
  return (
    <Card interactive className="relative overflow-hidden p-5">
      <div className={`absolute -right-5 -top-5 h-24 w-24 rounded-full blur-2xl ${tone}`} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white">{value}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-slate-950/50">
          <Icon className="h-4.5 w-4.5 text-white" />
        </span>
      </div>
      <div className="relative mt-4 flex items-end justify-between">
        <p className="flex items-center gap-1 text-[11px] text-slate-500">
          {trend && <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />}
          <span className={trend ? 'text-emerald-400' : ''}>{trend}</span>{trend && ' vs. last week'}
          {!trend && detail}
        </p>
        <Sparkline color={tone.includes('rose') ? 'text-rose-400' : tone.includes('emerald') ? 'text-emerald-400' : tone.includes('amber') ? 'text-amber-400' : 'text-indigo-400'} values={values} />
      </div>
    </Card>
  );
}

function TaskCard({ task, compact = false }) {
  const projectId = task.project?._id || task.projectId;
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const overdue = dueDate && dueDate < new Date() && task.status !== 'completed';
  const assignees = Array.isArray(task.assignedTo) ? task.assignedTo.map((member) => (
    typeof member === 'object' ? member : { name: 'Unassigned' }
  )) : [];

  if (!projectId) return null;

  return (
    <Link
      to={`/project/${projectId}/task/${task._id}`}
      className="group block rounded-xl border border-white/[0.07] bg-slate-950/45 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-400/40 hover:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-100 group-hover:text-white">{task.title}</p>
          {!compact && <p className="mt-1.5 truncate text-[11px] text-slate-500">{task.project?.name || 'Project task'}</p>}
        </div>
        <Badge variant={task.priority || 'medium'} size="xs">{task.priority || 'medium'}</Badge>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className={`flex items-center gap-1 text-[11px] ${overdue ? 'text-rose-400' : 'text-slate-500'}`}>
          <CalendarDays className="h-3.5 w-3.5" />
          {dueDate ? dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No deadline'}
        </span>
        {assignees.length > 0 ? <AvatarGroup users={assignees} size="xs" max={3} /> : <Circle className="h-4 w-4 text-slate-700" />}
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { activeWorkspace, projects } = useWorkspace();
  const { user: currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('board');
  const [taskQuery, setTaskQuery] = useState('');
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
        setTasks(taskData.flatMap((response, index) => (response.tasks || []).map((task) => ({
          ...task,
          project: { _id: projects[index]._id, name: projects[index].name },
        }))));
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
    return () => { cancelled = true; };
  }, [activeWorkspace?._id, projects]);

  useEffect(() => {
    if (inviteEmail.trim().length < 2) {
      return undefined;
    }
    const timer = window.setTimeout(async () => {
      try {
        const data = await api.searchUsers(inviteEmail);
        const selectedIds = new Set(selectedUsers.map((u) => u._id));
        const memberIds = new Set(members.map((m) => m.user?._id));
        setInviteResults((data.users || []).filter((u) => !selectedIds.has(u._id) && !memberIds.has(u._id)));
      } catch {
        setInviteResults([]);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [inviteEmail, members, selectedUsers]);

  const filteredTasks = useMemo(() => tasks.filter((task) => (
    `${task.title} ${task.project?.name || ''}`.toLowerCase().includes(taskQuery.toLowerCase())
  )), [tasks, taskQuery]);

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.status === 'completed').length;
    const active = tasks.filter((task) => task.status !== 'completed').length;
    const overdue = tasks.filter((task) => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed').length;
    const velocity = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    return { completed, active, overdue, velocity };
  }, [tasks]);

  const activity = useMemo(() => tasks
    .slice()
    .sort((first, second) => new Date(second.updatedAt || second.createdAt || 0) - new Date(first.updatedAt || first.createdAt || 0))
    .slice(0, 5)
    .map((task, index) => ({
      id: task._id,
      name: task.assignedTo?.[0]?.name || (index % 2 ? 'A teammate' : currentUser?.name || 'You'),
      action: task.status === 'completed' ? 'completed' : task.status === 'in-progress' ? 'moved forward' : 'created',
      task: task.title,
      time: task.updatedAt || task.createdAt,
    })), [tasks, currentUser?.name]);

  const openProjectModal = () => window.dispatchEvent(new CustomEvent('obliq:create-project'));
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
      await api.inviteWorkspaceMember(activeWorkspace._id, selectedUsers.map((user) => user._id), inviteRole);
      setInviteStatus({ type: 'success', message: `Invite sent to ${selectedUsers.length} ${selectedUsers.length === 1 ? 'person' : 'people'}.` });
      setSelectedUsers([]);
      setInviteEmail('');
    } catch (error) {
      setInviteStatus({ type: 'error', message: error.message || 'Could not send the invite.' });
    } finally {
      setInviting(false);
    }
  };

  const firstName = currentUser?.name?.split(' ')[0] || 'there';

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 animate-slide-in">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" />
            Mission control
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Good morning, {firstName}.</h1>
          <p className="mt-1.5 text-sm text-slate-400">Here’s the latest across <span className="font-medium text-slate-200">{activeWorkspace?.name || 'your workspace'}</span>.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={UserPlus} onClick={() => setShowInvite(true)}>Invite people</Button>
          <Button variant="gradient" icon={Plus} onClick={openProjectModal}>New project</Button>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <SkeletonCard key={item} />)}
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total projects" value={projects.length} detail="Across this workspace" icon={FolderKanban} tone="bg-indigo-500/25" trend="12%" values={[12, 16, 13, 22, 19, 27, 30]} />
          <MetricCard label="Active tasks" value={stats.active} detail="Ready to move" icon={Target} tone="bg-cyan-500/20" trend="8%" values={[17, 13, 20, 22, 19, 30, 27]} />
          <MetricCard label="Team velocity" value={`${stats.velocity}%`} detail={`${stats.completed} completed tasks`} icon={TrendingUp} tone="bg-emerald-500/20" trend="18%" values={[8, 13, 16, 20, 25, 28, 34]} />
          <MetricCard label="Overdue alerts" value={stats.overdue} detail={stats.overdue ? 'Needs attention today' : 'All clear for today'} icon={AlertTriangle} tone="bg-rose-500/20" values={[28, 24, 22, 17, 20, 12, 8]} />
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card padding="none" className="min-w-0 overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-white/[0.08] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Task pulse</h2>
              <p className="mt-1 text-xs text-slate-500">A live view of work across every project.</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="relative hidden sm:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input value={taskQuery} onChange={(event) => setTaskQuery(event.target.value)} placeholder="Filter tasks" className="h-8 w-36 rounded-lg border border-white/[0.08] bg-slate-950/55 pl-8 pr-2 text-xs text-slate-200 outline-none transition focus:border-indigo-400/60 sm:w-44" />
              </label>
              <div className="flex rounded-lg border border-white/[0.08] bg-slate-950/55 p-0.5" role="group" aria-label="Task layout">
                <button onClick={() => setView('board')} aria-label="Board view" aria-pressed={view === 'board'} className={`grid h-7 w-7 place-items-center rounded-md transition ${view === 'board' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-200'}`}><Grid2X2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => setView('list')} aria-label="List view" aria-pressed={view === 'list'} className={`grid h-7 w-7 place-items-center rounded-md transition ${view === 'list' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-200'}`}><LayoutList className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>

          {tasks.length === 0 && !loading ? (
            <EmptyState icon={CheckCircle2} title="Your task board is ready" description="Create a project, then add the first task to start your team’s momentum." actionLabel={projects.length ? 'Create first task' : 'Create a project'} onAction={openFirstProject} />
          ) : view === 'board' ? (
            <div className="grid min-h-[390px] gap-0 lg:grid-cols-3">
              {['pending', 'in-progress', 'completed'].map((status) => {
                const config = statusConfig[status];
                const columnTasks = filteredTasks.filter((task) => task.status === status);
                return (
                  <div key={status} className="border-b border-white/[0.06] p-4 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0">
                    <div className="mb-4 flex items-center justify-between px-1">
                      <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${config.dot}`} /><h3 className="text-xs font-bold text-slate-300">{config.label}</h3></div>
                      <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{columnTasks.length}</span>
                    </div>
                    <div className="space-y-3">
                      {columnTasks.length ? columnTasks.slice(0, 5).map((task) => <TaskCard key={task._id} task={task} compact />) : <div className="rounded-xl border border-dashed border-white/[0.08] p-5 text-center text-xs text-slate-600">No tasks here</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {filteredTasks.map((task) => {
                const config = statusConfig[task.status] || statusConfig.pending;
                const projectId = task.project?._id;
                return projectId ? <Link key={task._id} to={`/project/${projectId}/task/${task._id}`} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-white/[0.025]">
                  <span className={`h-2 w-2 rounded-full ${config.dot}`} />
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-200">{task.title}</p>
                  <span className="hidden text-xs text-slate-500 sm:block">{task.project?.name}</span>
                  <Badge variant={task.priority || 'medium'} size="xs">{task.priority || 'medium'}</Badge>
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </Link> : null;
              })}
              {!filteredTasks.length && <p className="p-10 text-center text-sm text-slate-500">No tasks match your filter.</p>}
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between">
              <div><h2 className="text-base font-bold text-white">Team momentum</h2><p className="mt-1 text-xs text-slate-500">People moving work forward.</p></div>
              <button onClick={() => setShowInvite(true)} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white" aria-label="Invite teammate"><UserPlus className="h-4 w-4" /></button>
            </div>
            <div className="mt-5 flex items-center justify-between rounded-xl border border-white/[0.07] bg-slate-950/35 p-3">
              <div className="flex -space-x-2">{members.slice(0, 4).map((member, index) => <Avatar key={member._id || index} name={member.user?.name || 'Member'} size="sm" className="border-2 border-slate-900" />)}</div>
              <span className="text-xs font-medium text-slate-400">{members.length} member{members.length === 1 ? '' : 's'}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-emerald-500/[0.07] p-3"><p className="text-lg font-bold text-emerald-300">{stats.completed}</p><p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400/70">Done</p></div>
              <div className="rounded-xl bg-indigo-500/[0.07] p-3"><p className="text-lg font-bold text-indigo-300">{stats.active}</p><p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-400/70">In flight</p></div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between"><div><h2 className="text-base font-bold text-white">Recent activity</h2><p className="mt-1 text-xs text-slate-500">The latest project updates.</p></div><Activity className="h-4 w-4 text-indigo-400" /></div>
            <div className="mt-5 space-y-4">
              {activity.length ? activity.map((item) => <div key={item.id} className="flex gap-3"><Avatar name={item.name} size="xs" /><div className="min-w-0 flex-1"><p className="text-xs leading-5 text-slate-400"><span className="font-semibold text-slate-200">{item.name}</span> {item.action} <span className="font-medium text-slate-200">{item.task}</span></p><p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-600"><Clock3 className="h-3 w-3" />{item.time ? new Date(item.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Just now'}</p></div></div>) : <p className="py-4 text-center text-xs text-slate-600">Activity will appear as your team starts working.</p>}
            </div>
          </Card>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between"><div><h2 className="text-base font-bold text-white">Projects</h2><p className="mt-1 text-xs text-slate-500">Jump back into the work that matters.</p></div><button onClick={openProjectModal} className="flex items-center gap-1 text-xs font-semibold text-indigo-300 transition hover:text-indigo-200">View all <ArrowRight className="h-3.5 w-3.5" /></button></div>
        {projects.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{projects.slice(0, 6).map((project, index) => {
          const projectTasks = tasks.filter((task) => task.project?._id === project._id);
          const done = projectTasks.filter((task) => task.status === 'completed').length;
          const completion = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0;
          return <Card key={project._id} interactive as={Link} to={`/project/${project._id}`} className="group block p-5"><div className="flex items-start justify-between gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl border border-white/10 ${index % 3 === 0 ? 'bg-indigo-500/15 text-indigo-300' : index % 3 === 1 ? 'bg-cyan-500/15 text-cyan-300' : 'bg-violet-500/15 text-violet-300'}`}><FolderKanban className="h-4.5 w-4.5" /></span><Badge variant={project.status === 'active' ? 'success' : 'neutral'} size="xs" dot>{project.status || 'active'}</Badge></div><h3 className="mt-5 truncate text-sm font-bold text-white transition group-hover:text-indigo-200">{project.name}</h3><p className="mt-1.5 line-clamp-2 min-h-9 text-xs leading-5 text-slate-500">{project.description || 'No description yet — add one to give the team shared context.'}</p><div className="mt-5"><div className="mb-2 flex justify-between text-[11px] font-medium text-slate-500"><span>{done}/{projectTasks.length || 0} tasks done</span><span className="text-slate-300">{completion}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400" style={{ width: `${completion}%` }} /></div></div></Card>;
        })}</div> : <Card><EmptyState icon={FolderKanban} title="Build your first project" description="Projects give tasks a home, visibility, and a shared finish line." actionLabel="Create project" onAction={openProjectModal} /></Card>}
      </section>

      {showInvite && <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="invite-title"><button aria-label="Close invite dialog" className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowInvite(false)} /><Card className="relative w-full max-w-md p-0 shadow-2xl shadow-black/50"><div className="border-b border-white/[0.08] p-6"><h2 id="invite-title" className="text-lg font-bold text-white">Invite your team</h2><p className="mt-1 text-sm text-slate-400">Bring collaborators into {activeWorkspace?.name}.</p></div><form onSubmit={handleInvite} className="space-y-4 p-6"><div><label htmlFor="invite-email" className="mb-1.5 block text-xs font-semibold text-slate-300">Search by email</label><input id="invite-email" autoFocus value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="teammate@company.com" className="w-full rounded-xl border border-white/[0.09] bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/60" />{inviteResults.length > 0 && <div className="mt-2 overflow-hidden rounded-xl border border-white/[0.09] bg-slate-950/90">{inviteResults.map((user) => <button type="button" key={user._id} onClick={() => { setSelectedUsers([...selectedUsers, user]); setInviteEmail(''); setInviteResults([]); }} className="flex w-full items-center justify-between px-3 py-2.5 text-left transition hover:bg-white/[0.05]"><span><span className="block text-xs font-semibold text-white">{user.name}</span><span className="block text-[11px] text-slate-500">{user.email}</span></span><Plus className="h-4 w-4 text-indigo-300" /></button>)}</div>}</div>{selectedUsers.length > 0 && <div className="flex flex-wrap gap-2">{selectedUsers.map((user) => <button type="button" key={user._id} onClick={() => setSelectedUsers(selectedUsers.filter((candidate) => candidate._id !== user._id))} className="rounded-lg border border-indigo-400/25 bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-200">{user.name} ×</button>)}</div>}<div><label htmlFor="invite-role" className="mb-1.5 block text-xs font-semibold text-slate-300">Role</label><select id="invite-role" value={inviteRole} onChange={(event) => setInviteRole(event.target.value)} className="w-full rounded-xl border border-white/[0.09] bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400/60"><option value="member">Member</option><option value="manager">Manager</option></select></div>{inviteStatus.message && <p className={`rounded-lg px-3 py-2 text-xs ${inviteStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>{inviteStatus.message}</p>}<div className="flex justify-end gap-2 pt-2"><Button variant="ghost" onClick={() => setShowInvite(false)}>Cancel</Button><Button variant="gradient" type="submit" loading={inviting} disabled={!selectedUsers.length}>Send invite</Button></div></form></Card></div>}
    </div>
  );
}
