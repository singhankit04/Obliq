import Project from '../models/project.model.js';
import ProjectMember from '../models/projectMember.model.js';
import WorkspaceMember from '../models/workspaceMember.model.js';

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
export const createProject = async (workspaceId, creatorId, { name, description }) => {
  const membership = await assertWorkspaceMember(workspaceId, creatorId);
  if (!['owner', 'manager'].includes(membership.role)) {
    const error = new Error('Forbidden: only workspace owner or manager can create projects');
    error.statusCode = 403;
    throw error;
  }

  const project = await Project.create({
    workspace: workspaceId,
    name,
    description,
    manager: creatorId,
  });

  // Auto-add creator as project manager
  await ProjectMember.create({
    project: project._id,
    user: creatorId,
    role: 'manager',
    invitedBy: null,
  });

  return project;
};

/**
 * Get all projects in a workspace the user has access to.
 */
export const getWorkspaceProjects = async (workspaceId, userId) => {
  await assertWorkspaceMember(workspaceId, userId);
  return Project.find({ workspace: workspaceId }).lean();
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
  // Verify the user is a workspace member or a project member
  const projectMembership = await ProjectMember.findOne({ project: projectId, user: userId });
  const workspaceMembership = await WorkspaceMember.findOne({ workspace: project.workspace, user: userId });
  if (!projectMembership && !workspaceMembership) {
    const error = new Error('Access denied');
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
  await assertWorkspaceMember(project.workspace, userId);

  return ProjectMember.find({ project: projectId })
    .populate('user', 'name email')
    .populate('invitedBy', 'name email')
    .lean();
};

/**
 * Add a member to a project (project manager or workspace owner/manager).
 */
export const addProjectMember = async (projectId, inviterId, { userId, role = 'member' }) => {
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

  // Invitee must be a workspace member
  await assertWorkspaceMember(project.workspace, userId);

  const existing = await ProjectMember.findOne({ project: projectId, user: userId });
  if (existing) {
    const error = new Error('User is already a member of this project');
    error.statusCode = 409;
    throw error;
  }

  return ProjectMember.create({
    project: projectId,
    user: userId,
    role,
    invitedBy: inviterId,
  });
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
