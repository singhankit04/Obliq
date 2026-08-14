import Task from '../models/task.model.js';
import Project from '../models/project.model.js';
import ProjectMember from '../models/projectMember.model.js';
import WorkspaceMember from '../models/workspaceMember.model.js';
import Comment from '../models/comment.model.js';
import { createNotification } from './notification.service.js';
import { NOTIFICATION_TYPES } from '../models/notification.model.js';

/**
 * Helper: assert that user has access to the project.
 */
const assertProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
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

  return { project, workspaceMembership, projectMembership };
};

/**
 * Create a task in a project.
 */
export const createTask = async (projectId, creatorId, taskData) => {
  const { project, workspaceMembership, projectMembership } = await assertProjectAccess(projectId, creatorId);

  // Viewers cannot create tasks
  if (projectMembership && projectMembership.role === 'viewer') {
    const error = new Error('Forbidden: viewers cannot create tasks');
    error.statusCode = 403;
    throw error;
  }

  const assignedTo = taskData.assignedTo || [];
  const task = await Task.create({
    project: projectId,
    createdBy: creatorId,
    ...taskData,
    assignedTo,
  });

  // Trigger TASK_ASSIGNED notifications to assignees asynchronously
  if (Array.isArray(assignedTo) && assignedTo.length > 0) {
    assignedTo.forEach((assigneeId) => {
      createNotification({
        recipient: assigneeId,
        sender: creatorId,
        type: NOTIFICATION_TYPES.TASK_ASSIGNED,
        title: 'Task Assigned',
        message: `You were assigned to task "${task.title}".`,
        workspace: project.workspace,
        project: projectId,
        task: task._id,
      }).catch((err) => console.error('Notification error:', err.message));
    });
  }

  return task;
};

/**
 * Get all tasks in a project.
 */
export const getProjectTasks = async (projectId, userId) => {
  await assertProjectAccess(projectId, userId);
  const tasks = await Task.find({ project: projectId })
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .lean();

  const taskIds = tasks.map(t => t._id);
  const commentCounts = await Comment.aggregate([
    { $match: { task: { $in: taskIds }, isDeleted: false } },
    { $group: { _id: '$task', count: { $sum: 1 } } }
  ]);

  const countMap = new Map(commentCounts.map(c => [c._id.toString(), c.count]));

  return tasks.map(task => ({
    ...task,
    commentCount: countMap.get(task._id.toString()) || 0,
  }));
};

/**
 * Get a single task by ID.
 */
export const getTaskById = async (taskId, userId) => {
  const task = await Task.findById(taskId)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .lean();

  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  await assertProjectAccess(task.project, userId);
  const commentCount = await Comment.countDocuments({ task: taskId, isDeleted: false });

  return {
    ...task,
    commentCount,
  };
};

/**
 * Update a task (project members except viewers can update).
 */
export const updateTask = async (taskId, userId, updates) => {
  const oldTask = await Task.findById(taskId);
  if (!oldTask) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  const { project, workspaceMembership, projectMembership } = await assertProjectAccess(oldTask.project, userId);

  if (projectMembership && projectMembership.role === 'viewer') {
    const error = new Error('Forbidden: viewers cannot update tasks');
    error.statusCode = 403;
    throw error;
  }

  const updatedTask = await Task.findByIdAndUpdate(taskId, updates, { returnDocument: 'after', runValidators: true })
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email');

  // Trigger Notifications asynchronously
  const oldAssignees = new Set((oldTask.assignedTo || []).map((id) => id.toString()));
  const newAssignees = (updatedTask.assignedTo || []).map((u) => (u._id || u).toString());

  // 1. Send TASK_ASSIGNED to newly added assignees
  newAssignees.forEach((assigneeId) => {
    if (!oldAssignees.has(assigneeId)) {
      createNotification({
        recipient: assigneeId,
        sender: userId,
        type: NOTIFICATION_TYPES.TASK_ASSIGNED,
        title: 'Task Assigned',
        message: `You were assigned to task "${updatedTask.title}".`,
        workspace: project.workspace,
        project: oldTask.project,
        task: updatedTask._id,
      }).catch((err) => console.error('Notification error:', err.message));
    }
  });

  // 2. Send TASK_UPDATED to all existing assignees & task creator
  const recipientsToNotify = new Set([
    ...newAssignees,
    oldTask.createdBy.toString(),
  ]);

  recipientsToNotify.forEach((recipientId) => {
    createNotification({
      recipient: recipientId,
      sender: userId,
      type: NOTIFICATION_TYPES.TASK_UPDATED,
      title: 'Task Updated',
      message: `Task "${updatedTask.title}" was updated.`,
      workspace: project.workspace,
      project: oldTask.project,
      task: updatedTask._id,
      data: { updates },
    }).catch((err) => console.error('Notification error:', err.message));
  });

  return updatedTask;
};

/**
 * Delete a task (project manager or workspace owner/manager only).
 */
export const deleteTask = async (taskId, userId) => {
  const task = await Task.findById(taskId);
  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  const { workspaceMembership, projectMembership } = await assertProjectAccess(task.project, userId);

  const isWorkspaceAdmin = workspaceMembership && ['owner', 'manager'].includes(workspaceMembership.role);
  const isProjectManager = projectMembership && projectMembership.role === 'manager';
  const isCreator = task.createdBy.toString() === userId;

  if (!isWorkspaceAdmin && !isProjectManager && !isCreator) {
    const error = new Error('Forbidden: insufficient permissions to delete this task');
    error.statusCode = 403;
    throw error;
  }

  await Task.findByIdAndDelete(taskId);
};
