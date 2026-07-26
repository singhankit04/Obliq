import Project from '../models/project.model.js';
import ProjectMember from '../models/projectMember.model.js';
import WorkspaceMember from '../models/workspaceMember.model.js';
import Task from '../models/task.model.js';

/**
 * Helper: assert that the user is a member of the workspace.
 */
const assertWorkspaceMember = async (workspaceId, userId) => {
  const membership = await WorkspaceMember.findOne({ workspace: workspaceId, user: userId });
  if (!membership) {
    const error = new Error('Workspace not found or access denied');
    error.statusCode = 404;
    throw error;
  }
  return membership;
};

/**
 * Create a new project in a workspace (workspace owner/manager only).
 */
export const createProject = async (workspaceId, creatorId, { name, description, managerId }) => {
  const membership = await assertWorkspaceMember(workspaceId, creatorId);
  if (!['owner', 'manager'].includes(membership.role)) {
    const error = new Error('Forbidden: only workspace owner or manager can create projects');
    error.statusCode = 403;
    throw error;
  }

  const targetManagerId = managerId || creatorId;

  // Verify chosen manager is a member of the workspace
  if (targetManagerId.toString() !== creatorId.toString()) {
    await assertWorkspaceMember(workspaceId, targetManagerId);
  }

  const project = await Project.create({
    workspace: workspaceId,
    name,
    description,
    manager: targetManagerId,
  });

  // Auto-add chosen manager as project manager
  await ProjectMember.create({
    project: project._id,
    user: targetManagerId,
    role: 'manager',
    invitedBy: creatorId,
  });

  // If creator is different from chosen manager, also auto-add creator as project manager
  if (targetManagerId.toString() !== creatorId.toString()) {
    await ProjectMember.create({
      project: project._id,
      user: creatorId,
      role: 'manager',
      invitedBy: creatorId,
    });
  }

  return project;
};

/**
 * Get all projects in a workspace the user has access to.
 */
export const getWorkspaceProjects = async (workspaceId, userId) => {
  const workspaceMembership = await assertWorkspaceMember(workspaceId, userId);

  // Workspace owners & workspace managers can view all workspace projects
  if (['owner', 'manager'].includes(workspaceMembership.role)) {
    return Project.find({ workspace: workspaceId }).lean();
  }

  // Regular members can only view projects in which they are a ProjectMember
  const projectMemberships = await ProjectMember.find({ user: userId }).select('project');
  const userProjectIds = projectMemberships.map((pm) => pm.project);

  return Project.find({
    workspace: workspaceId,
    _id: { $in: userProjectIds },
  }).lean();
};

/**
 * Get a single project by ID (must be a project member).
 */
export const getProjectById = async (projectId, userId) => {
  const project = await Project.findById(projectId).lean();
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  const workspaceMembership = await WorkspaceMember.findOne({ workspace: project.workspace, user: userId });
  if (!workspaceMembership) {
    const error = new Error('Access denied');
    error.statusCode = 403;
    throw error;
  }

  const isWorkspaceAdmin = ['owner', 'manager'].includes(workspaceMembership.role);
  const projectMembership = await ProjectMember.findOne({ project: projectId, user: userId });

  if (!projectMembership && !isWorkspaceAdmin) {
    const error = new Error('Access denied: you are not a member of this project');
    error.statusCode = 403;
    throw error;
  }
  return project;
};

/**
 * Update project details (project manager or workspace owner/manager).
 */
export const updateProject = async (projectId, userId, updates) => {
  const project = await Project.findById(projectId);
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  const workspaceMembership = await WorkspaceMember.findOne({ workspace: project.workspace, user: userId });
  const projectMembership = await ProjectMember.findOne({ project: projectId, user: userId });

  const isWorkspaceAdmin = workspaceMembership && ['owner', 'manager'].includes(workspaceMembership.role);
  const isProjectManager = projectMembership && projectMembership.role === 'manager';

  if (!isWorkspaceAdmin && !isProjectManager) {
    const error = new Error('Forbidden: insufficient permissions');
    error.statusCode = 403;
    throw error;
  }

  return Project.findByIdAndUpdate(projectId, {...updates,updatedBy: userId }, { new: true, runValidators: true });
};

/**
 * Delete a project (workspace owner/manager or project manager only).
 */
export const deleteProject = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  const workspaceMembership = await WorkspaceMember.findOne({ workspace: project.workspace, user: userId });
  const projectMembership = await ProjectMember.findOne({ project: projectId, user: userId });

  const isWorkspaceAdmin = workspaceMembership && ['owner', 'manager'].includes(workspaceMembership.role);
  const isProjectManager = projectMembership && projectMembership.role === 'manager';

  if (!isWorkspaceAdmin && !isProjectManager) {
    const error = new Error('Forbidden: insufficient permissions');
    error.statusCode = 403;
    throw error;
  }

  await Task.deleteMany({ project: projectId });
  await ProjectMember.deleteMany({ project: projectId });
  await Project.findByIdAndDelete(projectId);
};

/**
 * Get all members of a project.
 */
export const getProjectMembers = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  const workspaceMembership = await assertWorkspaceMember(project.workspace, userId);
  const isWorkspaceAdmin = ['owner', 'manager'].includes(workspaceMembership.role);
  const projectMembership = await ProjectMember.findOne({ project: projectId, user: userId });

  if (!projectMembership && !isWorkspaceAdmin) {
    const error = new Error('Access denied: you are not a member of this project');
    error.statusCode = 403;
    throw error;
  }
  return ProjectMember.find({ project: projectId })
    .populate('user', 'name email')
    .populate('invitedBy', 'name email')
    .lean();
};

/**
 * Add a member to a project (project manager or workspace owner/manager).
 */
export const addProjectMember = async (projectId, inviterId, { userIds, role = 'member' }) => {
  const project = await Project.findById(projectId);
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  const workspaceMembership = await WorkspaceMember.findOne({ workspace: project.workspace, user: inviterId });
  const inviterProjectMembership = await ProjectMember.findOne({ project: projectId, user: inviterId });

  const isWorkspaceAdmin = workspaceMembership && ['owner', 'manager'].includes(workspaceMembership.role);
  const isProjectManager = inviterProjectMembership && inviterProjectMembership.role === 'manager';

  if (!isWorkspaceAdmin && !isProjectManager) {
    const error = new Error('Forbidden: insufficient permissions');
    error.statusCode = 403;
    throw error;
  }

  if (!Array.isArray(userIds) || userIds.length === 0) {
    const error = new Error('At least one user must be selected');
    error.statusCode = 400;
    throw error;
  }

  // Ensure invitees belong to workspace
  const wsMemberships = await WorkspaceMember.find({
    workspace: project.workspace,
    user: { $in: userIds },
  }).select('user');

  const validWsUserIds = new Set(wsMemberships.map((m) => m.user.toString()));
  const validIds = userIds.filter((id) => validWsUserIds.has(id.toString()));

  if (validIds.length === 0) {
    const error = new Error('Selected users must be members of the workspace first');
    error.statusCode = 400;
    throw error;
  }

  const existingMembers = await ProjectMember.find({
    project: projectId,
    user: { $in: validIds },
  }).select('user');

  const existingUserIds = new Set(existingMembers.map((m) => m.user.toString()));
  const newIdsToAdd = validIds.filter((id) => !existingUserIds.has(id.toString()));

  if (newIdsToAdd.length === 0) {
    const error = new Error('All selected users are already members of this project');
    error.statusCode = 409;
    throw error;
  }

  const newMembers = newIdsToAdd.map((id) => ({
    project: projectId,
    user: id,
    role,
    invitedBy: inviterId,
  }));

  return ProjectMember.insertMany(newMembers);
};

/**
 * Update a project member's role (project manager or workspace owner/manager).
 */
export const updateProjectMemberRole = async (projectId, requesterId, memberId, role) => {
  const project = await Project.findById(projectId);
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  const workspaceMembership = await WorkspaceMember.findOne({ workspace: project.workspace, user: requesterId });
  const requesterProjectMembership = await ProjectMember.findOne({ project: projectId, user: requesterId });

  const isWorkspaceAdmin = workspaceMembership && ['owner', 'manager'].includes(workspaceMembership.role);
  const isProjectManager = requesterProjectMembership && requesterProjectMembership.role === 'manager';

  if (!isWorkspaceAdmin && !isProjectManager) {
    const error = new Error('Forbidden: insufficient permissions');
    error.statusCode = 403;
    throw error;
  }

  const member = await ProjectMember.findByIdAndUpdate(memberId, { role }, { new: true })
    .populate('user', 'name email');

  if (!member) {
    const error = new Error('Member not found');
    error.statusCode = 404;
    throw error;
  }
  return member;
};

/**
 * Remove a member from a project.
 */
export const removeProjectMember = async (projectId, requesterId, memberId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  const workspaceMembership = await WorkspaceMember.findOne({ workspace: project.workspace, user: requesterId });
  const requesterProjectMembership = await ProjectMember.findOne({ project: projectId, user: requesterId });

  const targetMember = await ProjectMember.findById(memberId);
  if (!targetMember || targetMember.project.toString() !== projectId) {
    const error = new Error('Member not found');
    error.statusCode = 404;
    throw error;
  }

  const isSelf = targetMember.user.toString() === requesterId;
  const isWorkspaceAdmin = workspaceMembership && ['owner', 'manager'].includes(workspaceMembership.role);
  const isProjectManager = requesterProjectMembership && requesterProjectMembership.role === 'manager';

  if (!isSelf && !isWorkspaceAdmin && !isProjectManager) {
    const error = new Error('Forbidden: insufficient permissions');
    error.statusCode = 403;
    throw error;
  }

  await ProjectMember.findByIdAndDelete(memberId);
};
