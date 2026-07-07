import * as projectService from '../services/project.service.js';

export const createProject = async (req, res, next) => {
  try {
    const project = await projectService.createProject(req.params.workspaceId, req.user._id, req.body);
    res.status(201).json({ message: 'Project created successfully', project });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

export const getWorkspaceProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getWorkspaceProjects(req.params.workspaceId, req.user._id);
    res.json({ projects });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(req.params.projectId, req.user._id);
    res.json({ project });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

export const    updateProject = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.params.projectId, req.user._id, req.body);
    res.json({ message: 'Project updated successfully', project });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    await projectService.deleteProject(req.params.projectId, req.user._id);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

export const getProjectMembers = async (req, res, next) => {
  try {
    const members = await projectService.getProjectMembers(req.params.projectId, req.user._id);
    res.json({ members });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

export const addProjectMember = async (req, res, next) => {
  try {
    const member = await projectService.addProjectMember(req.params.projectId, req.user._id, req.body);
    res.status(201).json({ message: 'Member added to project successfully', member });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

export const updateProjectMemberRole = async (req, res, next) => {
  try {
    const member = await projectService.updateProjectMemberRole(
      req.params.projectId,
      req.user._id,
      req.params.memberId,
      req.body.role
    );
    res.json({ message: 'Project member role updated', member });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

export const removeProjectMember = async (req, res, next) => {
  try {
    await projectService.removeProjectMember(req.params.projectId, req.user._id, req.params.memberId);
    res.json({ message: 'Project member removed successfully' });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};
