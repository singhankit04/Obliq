import * as workspaceService from '../services/workspace.service.js';

export const createWorkspace = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const workspace = await workspaceService.createWorkspace({ name, description, ownerId: req.user._id });
    res.status(201).json({ message: 'Workspace created successfully', workspace });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

export const getUserWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await workspaceService.getUserWorkspaces(req.user._id);
    res.json({ workspaces });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

export const getWorkspaceById = async (req, res, next) => {
  try {
    const workspace = await workspaceService.getWorkspaceById(req.params.workspaceId, req.user._id);
    res.json({ workspace });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

export const updateWorkspace = async (req, res, next) => {
  try {
    const workspace = await workspaceService.updateWorkspace(req.params.workspaceId, req.user._id, req.body);
    res.json({ message: 'Workspace updated successfully', workspace });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

export const deleteWorkspace = async (req, res, next) => {
  try {
    await workspaceService.deleteWorkspace(req.params.workspaceId, req.user._id);
    res.json({ message: 'Workspace deleted successfully' });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

export const getWorkspaceMembers = async (req, res, next) => {
  try {
    const members = await workspaceService.getWorkspaceMembers(req.params.workspaceId, req.user._id);
    res.json({ members });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

export const inviteMember = async (req, res, next) => {
  try {
    const member = await workspaceService.inviteMember(req.params.workspaceId, req.user._id, req.body);
    res.status(201).json({ message: 'Member invited successfully', member });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

export const updateMemberRole = async (req, res, next) => {
  try {
    const member = await workspaceService.updateMemberRole(
      req.params.workspaceId,
      req.user._id,
      req.params.memberId,
      req.body.role
    );
    res.json({ message: 'Member role updated', member });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    await workspaceService.removeMember(req.params.workspaceId, req.user._id, req.params.memberId);
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

export const getInviteByToken = async (req, res, next) => {
  try {
    const invite = await workspaceService.getInviteDetailsByToken(req.params.token);
    res.json({ invite });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

export const acceptInvite = async (req, res, next) => {
  try {
    const token = req.body.token || req.params.token;
    const result = await workspaceService.acceptWorkspaceInvite(token, req.user._id);
    res.json(result);
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

export const rejectInvite = async (req, res, next) => {
  try {
    console.log(req.body)
    const token = req.body.token || req.params.token;
    const result = await workspaceService.rejectWorkspaceInvite(token, req.user._id);
    res.json(result);
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};
