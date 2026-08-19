import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../services/api';
import {
  FolderKanban, Plus, Rocket, CheckCircle2, Users, Clock3
} from 'lucide-react';
import { AvatarGroup } from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

export default function ProjectsView() {
  const { user: currentUser } = useAuth();
  const { activeWorkspace, projects: contextProjects, loading: wsLoading } = useWorkspace();
  const [workspaceProjects, setWorkspaceProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projectMembersMap, setProjectMembersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' | 'due' | 'completed'

  const currentUserId = currentUser?._id || currentUser?.id;

  useEffect(() => {
    let cancelled = false;

    async function loadProjectsData() {
      if (!activeWorkspace?._id) {
        if (!wsLoading) setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch projects directly for the active workspace
        const projData = await api.getProjects(activeWorkspace._id).catch(() => ({ projects: [] }));
        const currentProjects = (projData.projects && projData.projects.length > 0)
          ? projData.projects
          : (contextProjects || []);

        if (cancelled) return;
        setWorkspaceProjects(currentProjects);

        if (currentProjects.length === 0) {
          setTasks([]);
          setProjectMembersMap({});
          setLoading(false);
          return;
        }

        const results = await Promise.all([
          ...currentProjects.map((p) => api.getTasks(p._id).catch(() => ({ tasks: [] }))),
          ...currentProjects.map((p) => api.getProjectMembers(p._id).catch(() => ({ members: [] }))),
        ]);

        if (cancelled) return;

        const taskResults = results.slice(0, currentProjects.length);
        const memberResults = results.slice(currentProjects.length);

        const allTasks = taskResults.flatMap((res, index) =>
          (res.tasks || []).map((t) => ({
            ...t,
            projectId: currentProjects[index]._id,
          }))
        );
        setTasks(allTasks);

        const membersMap = {};
        currentProjects.forEach((p, idx) => {
          membersMap[p._id] = memberResults[idx]?.members || [];
        });
        setProjectMembersMap(membersMap);
      } catch (err) {
        console.error('Failed to load projects overview:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProjectsData();
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace?._id, contextProjects, wsLoading]);

  // Helper to calculate project status
  const getProjectStatus = (project, projectTasks) => {
    const doneTasks = projectTasks.filter((t) => t.status === 'completed').length;
    const isCompleted =
      project.status === 'completed' ||
      (projectTasks.length > 0 && doneTasks === projectTasks.length);
    if (isCompleted) return 'completed';

    const isDue =
      project.status === 'due' ||
      project.status === 'overdue' ||
      projectTasks.some(
        (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
      );
    if (isDue) return 'due';

    return 'active';
  };

  const isWorkspaceAdmin = useMemo(() => {
    if (!currentUser || !activeWorkspace) return false;
    const ownerId = typeof activeWorkspace.owner === 'object' ? activeWorkspace.owner?._id : activeWorkspace.owner;
    return (
      activeWorkspace.role === 'owner' ||
      activeWorkspace.role === 'manager' ||
      activeWorkspace.role === 'admin' ||
      ownerId === currentUserId
    );
  }, [currentUser, activeWorkspace, currentUserId]);

  const allProjects = workspaceProjects.length > 0 ? workspaceProjects : (contextProjects || []);

  // Filter to user's projects (backend already scoped to user-accessible projects; client-side keeps it robust)
  const myProjects = useMemo(() => {
    if (!allProjects || allProjects.length === 0) return [];
    return allProjects.filter((project) => {
      if (isWorkspaceAdmin) return true;
      if (!currentUserId) return true;

      const pMembers = projectMembersMap[project._id] || [];
      const strUserId = currentUserId.toString();

      const isMember = pMembers.some((pm) => {
        const memberUserId = (pm.user?._id || pm.user || pm._id)?.toString();
        return memberUserId === strUserId || (pm.user?.email && pm.user.email.toLowerCase() === currentUser?.email?.toLowerCase());
      });

      const createdById = (typeof project.createdBy === 'object' ? project.createdBy?._id : project.createdBy)?.toString();
      const managerId = (typeof project.manager === 'object' ? project.manager?._id : project.manager)?.toString();
      const isCreatorOrManager = (createdById && createdById === strUserId) || (managerId && managerId === strUserId);

      const hasAssignedTasks = tasks.some(
        (t) =>
          t.projectId?.toString() === project._id?.toString() &&
          (Array.isArray(t.assignedTo)
            ? t.assignedTo.some((a) => (typeof a === 'object' ? a._id?.toString() : a?.toString()) === strUserId)
            : (typeof t.assignedTo === 'object' ? t.assignedTo?._id?.toString() : t.assignedTo?.toString()) === strUserId)
      );

      // If member list not populated yet, trust backend return
      if (pMembers.length === 0 && !hasAssignedTasks && !isCreatorOrManager) {
        return true;
      }

      return isMember || isCreatorOrManager || hasAssignedTasks;
    });
  }, [allProjects, projectMembersMap, currentUserId, currentUser, tasks, isWorkspaceAdmin]);

  // Group by status
  const { activeProjects, dueProjects, completedProjects } = useMemo(() => {
    const active = [];
    const due = [];
    const completed = [];

    myProjects.forEach((project) => {
      const projectTasks = tasks.filter((t) => t.projectId === project._id);
      const st = getProjectStatus(project, projectTasks);
      if (st === 'completed') completed.push(project);
      else if (st === 'due') due.push(project);
      else active.push(project);
    });

    return { activeProjects: active, dueProjects: due, completedProjects: completed };
  }, [myProjects, tasks]);

  // Auto-switch to a tab that has projects if current tab has none
  useEffect(() => {
    if (!loading && myProjects.length > 0) {
      if (statusFilter === 'active' && activeProjects.length === 0) {
        if (dueProjects.length > 0) setStatusFilter('due');
        else if (completedProjects.length > 0) setStatusFilter('completed');
      } else if (statusFilter === 'due' && dueProjects.length === 0) {
        if (activeProjects.length > 0) setStatusFilter('active');
        else if (completedProjects.length > 0) setStatusFilter('completed');
      } else if (statusFilter === 'completed' && completedProjects.length === 0) {
        if (activeProjects.length > 0) setStatusFilter('active');
        else if (dueProjects.length > 0) setStatusFilter('due');
      }
    }
  }, [loading, myProjects.length, activeProjects.length, dueProjects.length, completedProjects.length, statusFilter]);

  const filteredProjects =
    statusFilter === 'completed'
      ? completedProjects
      : statusFilter === 'due'
      ? dueProjects
      : activeProjects;

  const openProjectModal = () => window.dispatchEvent(new CustomEvent('obliq:create-project'));

  return (
    <div className="space-y-6 animate-slide-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-100">
            My Projects
          </h1>
        </div>

        {isWorkspaceAdmin && (
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

      {/* Filter Tabs with Counts */}
      <div className="flex overflow-x-auto gap-2 pb-1">
        {[
          { id: 'active', label: 'Active', count: activeProjects.length },
          { id: 'due', label: 'Due', count: dueProjects.length },
          { id: 'completed', label: 'Completed', count: completedProjects.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer capitalize ${
              statusFilter === tab.id
                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 bg-white/[0.03] border border-white/[0.05]'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              statusFilter === tab.id ? 'bg-blue-500/20 text-blue-300' : 'bg-white/[0.06] text-zinc-400'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} className="h-48" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-[#0C0F14] border border-white/[0.06] rounded-xl p-8 text-center">
          <EmptyState
            icon={FolderKanban}
            title={`No ${statusFilter} projects`}
            description={`There are currently no ${statusFilter} projects in your workspace.`}
            actionLabel={isWorkspaceAdmin ? 'Create Project' : undefined}
            onAction={isWorkspaceAdmin ? openProjectModal : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project, idx) => {
            const projectTasks = tasks.filter((t) => t.projectId === project._id);
            const doneTasks = projectTasks.filter((t) => t.status === 'completed').length;
            const progress = projectTasks.length ? Math.round((doneTasks / projectTasks.length) * 100) : 0;
            const projectStatus = getProjectStatus(project, projectTasks);
            const projectMembers = projectMembersMap[project._id] || [];

            return (
              <Link
                key={project._id}
                to={`/project/${project._id}`}
                className="group flex flex-col justify-between bg-[#0C0F14] rounded-xl border border-white/[0.06] hover:border-white/[0.14] hover:bg-[#12151D] p-5 transition-all relative overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                        idx % 3 === 0
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : idx % 3 === 1
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}
                    >
                      <Rocket className="w-4 h-4" />
                    </div>
                    <Badge
                      variant={
                        projectStatus === 'completed'
                          ? 'success'
                          : projectStatus === 'due'
                          ? 'danger'
                          : 'neutral'
                      }
                      size="xs"
                      dot
                    >
                      {projectStatus === 'completed'
                        ? 'Completed'
                        : projectStatus === 'due'
                        ? 'Due'
                        : 'Active'}
                    </Badge>
                  </div>

                  <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-blue-400 transition-colors truncate">
                    {project.name}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed min-h-[32px]">
                    {project.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-white/[0.05]">
                  <div className="flex justify-between items-center text-[11px] font-mono text-zinc-400 mb-1.5">
                    <span>Progress</span>
                    <span className="text-blue-400 font-semibold">{progress}%</span>
                  </div>
                  <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden mb-2.5">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        projectStatus === 'completed'
                          ? 'bg-emerald-500'
                          : projectStatus === 'due'
                          ? 'bg-rose-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                    <span>
                      {doneTasks}/{projectTasks.length} tasks done
                    </span>
                    <div className="flex -space-x-1.5">
                      <AvatarGroup
                        users={projectMembers.map((m) => m.user || m)}
                        size="xs"
                        max={3}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
