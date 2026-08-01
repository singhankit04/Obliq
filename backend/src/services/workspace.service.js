import Workspace from '../models/workspace.model.js';
import WorkspaceMember from '../models/workspaceMember.model.js';
import WorkspaceInvite from '../models/workspaceInvite.model.js';
import Project from '../models/project.model.js';
import ProjectMember from '../models/projectMember.model.js';
import Task from '../models/task.model.js';
import User from '../models/user.model.js';
import { createNotification } from './notification.service.js';
import { NOTIFICATION_TYPES } from '../models/notification.model.js';
import { addWorkspaceInviteEmailJob, addWorkspaceInviteAcceptedEmailJob } from '../queues/email.queue.js';

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

  // Find all projects in this workspace
  const projects = await Project.find({ workspace: workspaceId }).select('_id');
  const projectIds = projects.map((p) => p._id);

  if (projectIds.length > 0) {
    // Delete all tasks associated with these projects
    await Task.deleteMany({ project: { $in: projectIds } });

    // Delete all project members associated with these projects
    await ProjectMember.deleteMany({ project: { $in: projectIds } });

    // Delete all projects in this workspace
    await Project.deleteMany({ workspace: workspaceId });
  }

  // Delete all workspace members
  await WorkspaceMember.deleteMany({ workspace: workspaceId });
  await WorkspaceInvite.deleteMany({ workspace: workspaceId });

  // Delete the workspace document
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
 * Invite user(s) to a workspace via Email (owner/manager only).
 */
export const inviteMember = async (workspaceId, inviterId, { userIds = [], emails = [], role = 'member' }) => {
  const inviterMembership = await WorkspaceMember.findOne({ workspace: workspaceId, user: inviterId }).populate('user', 'name email');
  if (!inviterMembership || !['owner', 'manager'].includes(inviterMembership.role)) {
    const error = new Error('Forbidden: insufficient permissions to invite members');
    error.statusCode = 403;
    throw error;
  }

  const workspace = await Workspace.findById(workspaceId).select('name');
  if (!workspace) {
    const error = new Error('Workspace not found');
    error.statusCode = 404;
    throw error;
  }

  // Combine userIds and raw emails
  const targetEmailsSet = new Set(emails.map((e) => e.toLowerCase().trim()));

  if (Array.isArray(userIds) && userIds.length > 0) {
    const users = await User.find({ _id: { $in: userIds } }).select('email');
    users.forEach((u) => targetEmailsSet.add(u.email.toLowerCase().trim()));
  }

  if (targetEmailsSet.size === 0) {
    const error = new Error('At least one valid user or email must be provided');
    error.statusCode = 400;
    throw error;
  }

  const targetEmails = Array.from(targetEmailsSet);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const inviterName = inviterMembership.user ? inviterMembership.user.name : 'A team member';

  const createdInvites = [];

  for (const email of targetEmails) {
    // 1. Check if user is already a member
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const isAlreadyMember = await WorkspaceMember.findOne({ workspace: workspaceId, user: existingUser._id });
      if (isAlreadyMember) {
        continue; // Skip existing members
      }
    }

    // 2. Upsert invitation
    let invite = await WorkspaceInvite.findOne({ workspace: workspaceId, inviteeEmail: email, status: 'pending' });
    if (!invite) {
      invite = await WorkspaceInvite.create({
        workspace: workspaceId,
        inviter: inviterId,
        inviteeEmail: email,
        role,
      });
    }

    const acceptUrl = `${frontendUrl}/workspace/invite/accept?token=${invite.token}`;
    const rejectUrl = `${frontendUrl}/workspace/invite/reject?token=${invite.token}`;

    // 3. Queue invitation email job
    await addWorkspaceInviteEmailJob({
      email,
      inviterName,
      workspaceName: workspace.name,
      role,
      acceptUrl,
      rejectUrl,
    });

    // 4. If registered user, trigger in-app notification
    if (existingUser) {
      createNotification({
        recipient: existingUser._id,
        sender: inviterId,
        type: NOTIFICATION_TYPES.WORKSPACE_INVITE,
        title: 'Workspace Invitation',
        message: `${inviterName} invited you to join "${workspace.name}" as a ${role}.`,
        workspace: workspaceId,
        data: { role, inviteToken: invite.token },
      }).catch((err) => console.error('Notification error:', err.message));
    }

    createdInvites.push(invite);
  }

  return createdInvites;
};

/**
 * Get details of a workspace invitation by token
 */
export const getInviteDetailsByToken = async (token) => {
  const invite = await WorkspaceInvite.findOne({ token })
    .populate('workspace', 'name description')
    .populate('inviter', 'name email')
    .lean();

  if (!invite) {
    const error = new Error('Invitation not found');
    error.statusCode = 404;
    throw error;
  }

  if (invite.status !== 'pending') {
    const error = new Error(`Invitation has already been ${invite.status}`);
    error.statusCode = 400;
    throw error;
  }

  if (new Date(invite.expiresAt) < new Date()) {
    invite.status = 'expired';
    await WorkspaceInvite.updateOne({ _id: invite._id }, { status: 'expired' });
    const error = new Error('Invitation has expired');
    error.statusCode = 400;
    throw error;
  }

  return invite;
};

/**
 * Accept a workspace invitation
 */
export const acceptWorkspaceInvite = async (token, userId) => {
  const invite = await WorkspaceInvite.findOne({ token });

  if (!invite) {
    const error = new Error('Invitation not found');
    error.statusCode = 404;
    throw error;
  }

  if (invite.status === 'accepted') {
    return { message: 'Invitation was already accepted', workspaceId: invite.workspace };
  }

  if (invite.status !== 'pending') {
    const error = new Error(`Invitation is ${invite.status}`);
    error.statusCode = 400;
    throw error;
  }

  if (new Date(invite.expiresAt) < new Date()) {
    invite.status = 'expired';
    await invite.save();
    const error = new Error('Invitation has expired');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Ensure user email matches inviteeEmail
  if (user.email.toLowerCase() !== invite.inviteeEmail.toLowerCase()) {
    const error = new Error(`This invitation was sent to ${invite.inviteeEmail}, but you are logged in as ${user.email}`);
    error.statusCode = 403;
    throw error;
  }

  // Add user to WorkspaceMember if not already added
  const existingMembership = await WorkspaceMember.findOne({ workspace: invite.workspace, user: userId });
  if (!existingMembership) {
    await WorkspaceMember.create({
      workspace: invite.workspace,
      user: userId,
      role: invite.role,
      invitedBy: invite.inviter,
    });
  }

  invite.status = 'accepted';
  await invite.save();

  // Send notification back to inviter
  const workspaceObj = await Workspace.findById(invite.workspace).select('name');
  const workspaceName = workspaceObj ? workspaceObj.name : 'Workspace';

  createNotification({
    recipient: invite.inviter,
    sender: userId,
    type: NOTIFICATION_TYPES.WORKSPACE_INVITE,
    title: 'Invitation Accepted',
    message: `${user.name} accepted your invitation to join "${workspaceName}".`,
    workspace: invite.workspace,
  }).catch((err) => console.error('Notification error:', err.message));

  // Queue confirmation email to the acceptor
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const workspaceUrl = `${frontendUrl}/workspace/${invite.workspace}`;

  addWorkspaceInviteAcceptedEmailJob({
    email: user.email,
    userName: user.name,
    workspaceName,
    role: invite.role,
    workspaceUrl,
  }).catch((err) => console.error('Failed to queue invite accepted email:', err.message));

  return { message: 'Workspace invitation accepted successfully', workspaceId: invite.workspace };
};

/**
 * Reject a workspace invitation
 */
export const rejectWorkspaceInvite = async (token, userId) => {
  const invite = await WorkspaceInvite.findOne({ token });

  if (!invite) {
    const error = new Error('Invitation not found');
    error.statusCode = 404;
    throw error;
  }

  if (invite.status !== 'pending') {
    const error = new Error(`Invitation is already ${invite.status}`);
    error.statusCode = 400;
    throw error;
  }

  invite.status = 'rejected';
  await invite.save();

  return { message: 'Workspace invitation declined' };
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

  // Trigger Notification asynchronously
  const workspaceObj = await Workspace.findById(workspaceId).select('name');
  const workspaceName = workspaceObj ? workspaceObj.name : 'Workspace';

  if (member.user && member.user._id) {
    createNotification({
      recipient: member.user._id,
      sender: requesterId,
      type: NOTIFICATION_TYPES.ROLE_CHANGED,
      title: 'Workspace Role Updated',
      message: `Your role in "${workspaceName}" was updated to ${role}.`,
      workspace: workspaceId,
      data: { newRole: role },
    }).catch((err) => console.error('Notification error:', err.message));
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
