import Workspace from '../models/workspace.model.js';
import WorkspaceMember from '../models/workspaceMember.model.js';

/**
 * Create a new workspace and assign the creator as owner.
 */
export const createWorkspace = async ({ name, description, ownerId }) => {
  const workspace = await Workspace.create({ name, description, owner: ownerId });

  // Auto-add the creator as 'owner' in WorkspaceMember
  await WorkspaceMember.create({
    workspace: workspace._id,
    user: ownerId,
    role: 'owner',
    invitedBy: null,
  });

  return workspace;
};

/**
 * Get all workspaces the authenticated user belongs to.
 */
export const getUserWorkspaces = async (userId) => {
  const memberships = await WorkspaceMember.find({ user: userId })
    .populate('workspace')
    .lean();

  return memberships.map((m) => ({ ...m.workspace, role: m.role }));
};

/**
 * Get a single workspace by ID (verifies membership).
 */
export const getWorkspaceById = async (workspaceId, userId) => {
  const membership = await WorkspaceMember.findOne({ workspace: workspaceId, user: userId });
  if (!membership) {
    const error = new Error('Workspace not found or access denied');
    error.statusCode = 404;
    throw error;
  }
  return Workspace.findById(workspaceId);
};

/**
 * Update workspace details (only owner or manager can update).
 */
export const updateWorkspace = async (workspaceId, userId, updates) => {
  const membership = await WorkspaceMember.findOne({ workspace: workspaceId, user: userId });
  if (!membership || !['owner', 'manager'].includes(membership.role)) {
    const error = new Error('Forbidden: insufficient permissions');
    error.statusCode = 403;
    throw error;
  }
  return Workspace.findByIdAndUpdate(workspaceId, {...updates,updatedBy: userId }, { new: true, runValidators: true });
};

/**
 * Delete a workspace (only owner can delete).
 */
export const deleteWorkspace = async (workspaceId, userId) => {
  const membership = await WorkspaceMember.findOne({ workspace: workspaceId, user: userId });
  if (!membership || membership.role !== 'owner') {
    const error = new Error('Forbidden: only the owner can delete the workspace');
    error.statusCode = 403;
    throw error;
  }
  await WorkspaceMember.deleteMany({ workspace: workspaceId });
  await Workspace.findByIdAndDelete(workspaceId);
};

/**
 * Get all members of a workspace.
 */
export const getWorkspaceMembers = async (workspaceId, userId) => {
  const membership = await WorkspaceMember.findOne({ workspace: workspaceId, user: userId });
  if (!membership) {
    const error = new Error('Workspace not found or access denied');
    error.statusCode = 404;
    throw error;
  }
  return WorkspaceMember.find({ workspace: workspaceId })
    .populate('user', 'name email')
    .populate('invitedBy', 'name email')
    .lean();
};

/**
 * Invite a user to a workspace (owner/manager only).
 */
export const inviteMember = async (workspaceId, inviterId, { userId, role = 'member' }) => {
  const inviterMembership = await WorkspaceMember.findOne({ workspace: workspaceId, user: inviterId });
  if (!inviterMembership || !['owner', 'manager'].includes(inviterMembership.role)) {
    const error = new Error('Forbidden: insufficient permissions');
    error.statusCode = 403;
    throw error;
  }

  const existing = await WorkspaceMember.findOne({ workspace: workspaceId, user: userId });
  if (existing) {
    const error = new Error('User is already a member of this workspace');
    error.statusCode = 409;
    throw error;
  }

  return WorkspaceMember.create({
    workspace: workspaceId,
    user: userId,
    role,
    invitedBy: inviterId,
  });
};

/**
 * Update a member's role (owner only).
 */
export const updateMemberRole = async (workspaceId, requesterId, memberId, role) => {
  const requesterMembership = await WorkspaceMember.findOne({ workspace: workspaceId, user: requesterId });
  if (!requesterMembership || requesterMembership.role !== 'owner') {
    const error = new Error('Forbidden: only the owner can change member roles');
    error.statusCode = 403;
    throw error;
  }
  const member = await WorkspaceMember.findByIdAndUpdate(
    memberId,
    { role },
    { new: true }
  ).populate('user', 'name email');

  if (!member) {
    const error = new Error('Member not found');
    error.statusCode = 404;
    throw error;
  }
  return member;
};

/**
 * Remove a member from a workspace (owner/manager can remove, or member removes themselves).
 */
export const removeMember = async (workspaceId, requesterId, memberId) => {
  const requesterMembership = await WorkspaceMember.findOne({ workspace: workspaceId, user: requesterId });
  if (!requesterMembership) {
    const error = new Error('Access denied');
    error.statusCode = 403;
    throw error;
  }

  const targetMember = await WorkspaceMember.findById(memberId);
  if (!targetMember || targetMember.workspace.toString() !== workspaceId) {
    const error = new Error('Member not found');
    error.statusCode = 404;
    throw error;
  }

  // Only owner/manager can remove others; members can remove only themselves
  const isSelf = targetMember.user.toString() === requesterId;
  const hasPrivilege = ['owner', 'manager'].includes(requesterMembership.role);

  if (!isSelf && !hasPrivilege) {
    const error = new Error('Forbidden: insufficient permissions');
    error.statusCode = 403;
    throw error;
  }

  // Prevent removing the owner
  if (targetMember.role === 'owner') {
    const error = new Error('Cannot remove the workspace owner');
    error.statusCode = 400;
    throw error;
  }

  await WorkspaceMember.findByIdAndDelete(memberId);
};
