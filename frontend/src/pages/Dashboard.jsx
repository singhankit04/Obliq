import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Users, Folder, Calendar, Plus, Mail, Shield, UserPlus, 
  Trash2, X, Loader2, Search, ArrowRight, UserCheck
} from 'lucide-react';

export default function Dashboard() {
  const { activeWorkspace, projects, refreshProjects } = useWorkspace();
  const { user: currentUser } = useAuth();
  
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviting, setInviting] = useState(false);

  // Invitation Search States
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [inviteRole, setInviteRole] = useState('member');

  // Load workspace members
  const fetchMembers = async () => {
    if (!activeWorkspace) return;
    setLoadingMembers(true);
    try {
      const data = await api.getWorkspaceMembers(activeWorkspace._id);
      setMembers(data.members || []);
    } catch (err) {
      console.error('Failed to load workspace members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [activeWorkspace]);

  // Search users as the user types email
  useEffect(() => {
    if (searchEmail.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delaySearch = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api.searchUsers(searchEmail);
        // Exclude users already in the members list or already selected
        const filtered = (data.users || []).filter(
          (u) => !members.some((m) => m.user?._id === u._id) && !selectedUsers.some((su) => su._id === u._id)
        );
        setSearchResults(filtered);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchEmail, members]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (selectedUsers.length === 0 || !activeWorkspace) return;
    setInviting(true);
    setInviteError('');
    setInviteSuccess('');

    try {
      const userIds = selectedUsers.map((u) => u._id);
      await api.inviteWorkspaceMember(activeWorkspace._id, userIds, inviteRole);
      setInviteSuccess(`Successfully invited ${selectedUsers.length} member(s)!`);
      setSelectedUsers([]);
      setSearchEmail('');
      await fetchMembers();
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteSuccess('');
      }, 1500);
    } catch (err) {
      setInviteError(err.message || 'Failed to send invite.');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    if (!activeWorkspace) return;
    try {
      await api.updateWorkspaceMemberRole(activeWorkspace._id, memberId, newRole);
      await fetchMembers();
    } catch (err) {
      alert(err.message || 'Failed to update member role.');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!activeWorkspace) return;
    if (!confirm('Are you sure you want to remove this member from the workspace?')) return;
    
    try {
      await api.removeWorkspaceMember(activeWorkspace._id, memberId);
      await fetchMembers();
    } catch (err) {
      alert(err.message || 'Failed to remove member.');
    }
  };

  // Determine current user's membership role
  const myMembership = members.find(m => m.user?._id === currentUser?.id || m.user?._id === currentUser?._id || m.user?.email === currentUser?.email);
  const isOwner = myMembership?.role === 'owner';
  const isManager = myMembership?.role === 'manager';
  const hasAdminRights = isOwner || isManager;

  return (
    <div className="space-y-8 animate-slide-in">
      
      {/* Workspace Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Workspace Info Card */}
        <div className="md:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
          <div>
            <span className="px-3 py-1 bg-purple-600/10 text-purple-400 border border-purple-500/20 text-xs font-semibold rounded-full uppercase tracking-wider">
              Workspace Overview
            </span>
            <h2 className="text-2xl font-bold text-slate-100 mt-4">{activeWorkspace?.name}</h2>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              {activeWorkspace?.description || 'No description provided. Click Workspace Settings to customize this space.'}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 mt-6 pt-4 border-t border-slate-800/50">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Created {activeWorkspace?.createdAt ? new Date(activeWorkspace.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>

        {/* Quick Stats Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Workspace Stats</h3>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-slate-900/60 border border-slate-800/50 p-4 rounded-xl text-center">
                <p className="text-2xl font-extrabold text-slate-200">{projects.length}</p>
                <p className="text-xs text-slate-500 font-semibold mt-1">Projects</p>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/50 p-4 rounded-xl text-center">
                <p className="text-2xl font-extrabold text-slate-200">{members.length}</p>
                <p className="text-xs text-slate-500 font-semibold mt-1">Members</p>
              </div>
            </div>
          </div>
          {hasAdminRights && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="w-full mt-6 py-2.5 bg-purple-600/10 hover:bg-purple-600/20 border border-dashed border-purple-500/20 text-purple-400 hover:text-purple-300 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Invite Team Member
            </button>
          )}
        </div>

      </div>

      {/* Projects Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <Folder className="w-5 h-5 text-slate-400" />
            Workspace Projects
          </h3>
        </div>
        {projects.length === 0 ? (
          <div className="glass-panel p-10 rounded-2xl border border-slate-800/80 text-center">
            <p className="text-slate-400 text-sm">This workspace has no projects yet.</p>
            <p className="text-xs text-slate-500 mt-1">Create one using the "+" icon in the sidebar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <Link
                key={proj._id}
                to={`/project/${proj._id}`}
                className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/20 transition-all flex flex-col justify-between group"
              >
                <div>
                  <h4 className="font-bold text-slate-200 group-hover:text-purple-400 transition-colors text-base truncate">
                    {proj.name}
                  </h4>
                  <p className="text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">
                    {proj.description || 'No description.'}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-6 pt-3 border-t border-slate-850 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  <span className={`px-2 py-0.5 rounded-full ${proj.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                    {proj.status}
                  </span>
                  <span className="flex items-center gap-1 group-hover:text-slate-300 transition-colors">
                    Open Board
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Members Management Table */}
      <div>
        <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-slate-400" />
          Workspace Members
        </h3>
        <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
          {loadingMembers ? (
            <div className="p-10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-900/40 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Invited By</th>
                    {hasAdminRights && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {members.map((m) => {
                    const isSelf = m.user?._id === currentUser?.id || m.user?._id === currentUser?._id || m.user?.email === currentUser?.email;
                    const canEditMember = hasAdminRights && m.role !== 'owner' && !isSelf;

                    return (
                      <tr key={m._id} className="hover:bg-slate-900/10">
                        <td className="px-6 py-4 font-semibold text-slate-200">{m.user?.name || 'Unknown'} {isSelf && <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-md ml-1.5">You</span>}</td>
                        <td className="px-6 py-4">{m.user?.email || 'N/A'}</td>
                        <td className="px-6 py-4">
                          {canEditMember && isOwner ? (
                            <select
                              value={m.role}
                              onChange={(e) => handleRoleChange(m._id, e.target.value)}
                              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer"
                            >
                              <option value="member">Member</option>
                              <option value="manager">Manager</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${m.role === 'owner' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : m.role === 'manager' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                              <Shield className="w-3 h-3" />
                              {m.role}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {m.invitedBy ? m.invitedBy.name : <span className="italic text-[10px]">Creator</span>}
                        </td>
                        {hasAdminRights && (
                          <td className="px-6 py-4 text-right">
                            {canEditMember && (
                              <button
                                onClick={() => handleRemoveMember(m._id)}
                                className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-all"
                                title="Remove member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* INVITE TEAM MEMBER MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-slide-in relative">
            <button 
              onClick={() => {
                setShowInviteModal(false);
                setSelectedUser(null);
                setSearchEmail('');
                setSearchResults([]);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-400" />
              Invite Team Member
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Search for user by email to invite them to this workspace.
            </p>
            
            {inviteError && (
              <div className="mb-4 p-3 bg-red-950/30 border border-red-500/20 rounded-xl text-xs text-red-200">
                {inviteError}
              </div>
            )}

            {inviteSuccess && (
              <div className="mb-4 p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400 animate-bounce" />
                {inviteSuccess}
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-4">
              <div className="relative">
                <label className="block text-slate-400 text-xs font-semibold mb-1.5">SEARCH MEMBER EMAIL</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchEmail}
                    onChange={(e) => {
                      setSearchEmail(e.target.value);
                      setSelectedUser(null);
                    }}
                    placeholder="Search by email..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-purple-500" />
                  )}
                </div>

                {/* Dropdown list of Search Results */}
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-slate-950 border border-slate-800 rounded-xl max-h-40 overflow-y-auto shadow-2xl z-50 p-1 divide-y divide-slate-850">
                    {searchResults.map((u) => (
                      <button
                        key={u._id}
                        type="button"
                        onClick={() => {
                          if (!selectedUsers.some((su) => su._id === u._id)) {
                            setSelectedUsers([...selectedUsers, u]);
                          }
                          setSearchEmail('');
                          setSearchResults([]);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-purple-600/10 text-left transition-all group"
                      >
                        <div>
                          <span className="text-xs font-bold text-slate-200 group-hover:text-purple-300">{u.name}</span>
                          <span className="text-[10px] text-slate-500 block">{u.email}</span>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}

                {searchEmail && searchResults.length === 0 && !searching && (
                  <p className="text-[10px] text-amber-500 mt-1">No matching users found. Make sure they have signed up first.</p>
                )}
              </div>

              {/* Selected Users Pill List */}
              {selectedUsers.length > 0 && (
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1.5">
                    SELECTED MEMBERS ({selectedUsers.length})
                  </label>
                  <div className="flex flex-wrap gap-2 p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl max-h-32 overflow-y-auto">
                    {selectedUsers.map((u) => (
                      <div
                        key={u._id}
                        className="px-2.5 py-1 bg-purple-600/15 border border-purple-500/30 rounded-lg flex items-center gap-1.5 animate-slide-in"
                      >
                        <div>
                          <p className="text-xs font-bold text-purple-300 leading-none">{u.name}</p>
                          <p className="text-[9px] text-purple-400/70 leading-tight">{u.email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedUsers(selectedUsers.filter((su) => su._id !== u._id))}
                          className="p-0.5 hover:bg-purple-500/20 rounded text-purple-400 hover:text-purple-200 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5">WORKSPACE ROLE</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-purple-500 text-sm cursor-pointer"
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setSelectedUsers([]);
                    setSearchEmail('');
                    setSearchResults([]);
                  }}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting || selectedUsers.length === 0}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-900/20 cursor-pointer"
                >
                  {inviting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Invite {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
