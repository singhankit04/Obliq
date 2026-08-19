import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../services/api';
import {
  Users, UserPlus, Shield, Trash2, Search, Check,
  ChevronDown, FolderKanban, CheckSquare, AlertCircle
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Dialog from '../components/ui/Dialog';
import { useToast } from '../components/ui/Toast';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

export default function MembersView() {
  const { user } = useAuth();
  const { activeWorkspace, projects } = useWorkspace();
  const { addToast } = useToast();
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState(null);

  const fetchMembersAndTasks = async () => {
    if (!activeWorkspace?._id) return;
    setLoading(true);
    try {
      const [membersRes, ...taskResList] = await Promise.all([
        api.getWorkspaceMembers(activeWorkspace._id),
        ...projects.map((p) => api.getTasks(p._id)),
      ]);
      setMembers(membersRes.members || []);
      const allTasks = taskResList.flatMap((res, index) =>
        (res.tasks || []).map((t) => ({
          ...t,
          project: { _id: projects[index]._id, name: projects[index].name },
        }))
      );
      setTasks(allTasks);
    } catch (err) {
      console.error('Failed to load workspace members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembersAndTasks();
  }, [activeWorkspace?._id, projects]);

  // Current user's membership and role in this workspace
  const currentMember = members.find(
    (m) =>
      m.user?._id === user?.id ||
      m.user?._id === user?._id ||
      m.user?.email === user?.email
  );
  const isOwner = currentMember?.role === 'owner' || activeWorkspace?.owner === user?._id;
  const isManager = currentMember?.role === 'manager';

  // Filter members by search query
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const name = m.user?.name || '';
      const email = m.user?.email || '';
      const query = searchQuery.toLowerCase();
      return name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
    });
  }, [members, searchQuery]);

  // Handle role update (Owner only)
  const handleUpdateRole = async (memberId, newRole) => {
    if (!isOwner) return;
    setUpdatingRoleId(memberId);
    try {
      await api.updateWorkspaceMemberRole(activeWorkspace._id, memberId, newRole);
      addToast({
        title: 'Role Updated',
        message: `Member role changed to ${newRole}`,
        type: 'success',
      });
      await fetchMembersAndTasks();
    } catch (err) {
      addToast({
        title: 'Update Failed',
        message: err.message || 'Could not update role',
        type: 'error',
      });
    } finally {
      setUpdatingRoleId(null);
    }
  };

  // Handle member removal (Owner only)
  const handleRemoveMember = async (memberId, memberName) => {
    if (!isOwner) return;
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this workspace?`)) return;
    try {
      await api.removeWorkspaceMember(activeWorkspace._id, memberId);
      addToast({
        title: 'Member Removed',
        message: `${memberName} has been removed from the workspace`,
        type: 'success',
      });
      setMembers((prev) => prev.filter((m) => m._id !== memberId));
    } catch (err) {
      addToast({
        title: 'Removal Failed',
        message: err.message || 'Could not remove member',
        type: 'error',
      });
    }
  };

  // Handle Invite
  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeWorkspace?._id) return;
    setInviting(true);
    try {
      // Search user by email first
      const searchRes = await api.searchUsers(inviteEmail);
      const targetUser = searchRes.users?.find(
        (u) => u.email.toLowerCase() === inviteEmail.trim().toLowerCase()
      );
      if (!targetUser) {
        throw new Error('User not found with this email. Please ensure they have registered an account.');
      }
      await api.inviteWorkspaceMember(activeWorkspace._id, [targetUser._id], inviteRole);
      addToast({
        title: 'Invite Sent',
        message: `Invitation successfully sent to ${inviteEmail}`,
        type: 'success',
      });
      setShowInviteModal(false);
      setInviteEmail('');
      await fetchMembersAndTasks();
    } catch (err) {
      addToast({
        title: 'Invite Failed',
        message: err.message || 'Could not send invitation',
        type: 'error',
      });
    } finally {
      setInviting(false);
    }
  };

  // Calculate task counts per member
  const getMemberStats = (memberUserId) => {
    const memberTasks = tasks.filter((t) => {
      if (!t.assignedTo) return false;
      if (Array.isArray(t.assignedTo)) {
        return t.assignedTo.some((u) => (typeof u === 'object' ? u._id : u) === memberUserId);
      }
      return (typeof t.assignedTo === 'object' ? t.assignedTo._id : t.assignedTo) === memberUserId;
    });

    const openTasks = memberTasks.filter((t) => t.status !== 'completed').length;
    const completedTasks = memberTasks.filter((t) => t.status === 'completed').length;
    return { openTasks, completedTasks };
  };

  return (
    <div className="space-y-6 animate-slide-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400 mb-1.5 uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" />
            Workspace Directory
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Team Members</h1>
          <p className="text-sm text-slate-400 mt-1">
            {members.length} members collaborating across {projects.length} active projects.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isOwner && (
            <Button
              variant="gradient"
              icon={UserPlus}
              onClick={() => setShowInviteModal(true)}
              className="shadow-[0_0_15px_rgba(77,142,255,0.25)]"
            >
              Add Member
            </Button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-[#0c121e] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Member Cards Bento Grid */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-[#0c121e] border border-slate-800 rounded-xl p-8 text-center">
          <EmptyState
            icon={Users}
            title={searchQuery ? 'No matching members' : 'No members found'}
            description="Invite teammates to start collaborating on projects."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredMembers.map((member) => {
            const memberId = member._id;
            const memberUserId = member.user?._id || member.user?.id;
            const { openTasks, completedTasks } = getMemberStats(memberUserId);

            return (
              <div
                key={memberId}
                className="bg-[#0c121e] rounded-xl border border-slate-800/80 p-5 hover:border-slate-700 transition-all shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
              >
                {/* Member Info */}
                <div className="flex items-center gap-4 w-full md:w-1/3 min-w-[220px]">
                  <Avatar name={member.user?.name} size="md" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-100 truncate">
                      {member.user?.name || 'Unnamed User'}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">{member.user?.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700 font-semibold">
                      {member.role || 'Member'}
                    </span>
                  </div>
                </div>

                {/* Task Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 w-full md:w-auto items-center text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">Open Tasks</span>
                    <span className="text-sm font-bold text-slate-200">{openTasks}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">Completed</span>
                    <span className="text-sm font-bold text-emerald-400">{completedTasks}</span>
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">Joined</span>
                    <span className="text-xs font-mono text-slate-400">
                      {new Date(member.joinedAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Role Actions (Owner Controls) */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {isOwner && member.user?._id !== user?._id && (
                    <>
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member._id, e.target.value)}
                        disabled={updatingRoleId === member._id}
                        className="bg-[#090d16] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-blue-500 transition-colors"
                      >
                        <option value="member">Member</option>
                        <option value="manager">Manager</option>
                        <option value="owner">Owner</option>
                      </select>

                      <button
                        onClick={() => handleRemoveMember(member._id, member.user?.name || 'Member')}
                        className="p-1.5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                        title="Remove from workspace"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <Dialog open={showInviteModal} onClose={() => setShowInviteModal(false)} maxWidth="max-w-md">
          <div className="border-b border-slate-800 pb-4 mb-4">
            <h2 className="text-lg font-bold text-slate-100">Invite Team Member</h2>
            <p className="text-xs text-slate-400 mt-1">Add a new collaborator to {activeWorkspace?.name}.</p>
          </div>
          <form onSubmit={handleSendInvite} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">User Email</label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="w-full bg-[#090d16] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Workspace Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full bg-[#090d16] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="member">Member - Work on assigned projects & tasks</option>
                <option value="manager">Manager - Manage assigned projects & team</option>
                <option value="owner">Owner - Full workspace control</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowInviteModal(false)}>
                Cancel
              </Button>
              <Button variant="gradient" type="submit" loading={inviting}>
                Send Invite
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
