import Comment from '../models/comment.model.js';
import Task from '../models/task.model.js';
import Project from '../models/project.model.js';
import ProjectMember from '../models/projectMember.model.js';
import User from '../models/user.model.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { addMentionEmailJob } from '../queues/email.queue.js';
import { createNotification } from '../services/notification.service.js';
import { NOTIFICATION_TYPES } from '../models/notification.model.js';

/**
 * Helper to check if a user is authorized for a project (Manager or Member)
 */
const isUserProjectMember = async (userId, projectId) => {
  const project = await Project.findById(projectId);
  if (!project) return false;

  if (project.manager.toString() === userId.toString()) {
    return true;
  }

  const member = await ProjectMember.findOne({
    project: projectId,
    user: userId,
  });

  return !!member;
};

/**
 * Extract @mentions from content text
 * Supports @userId, @email, or matching member names/emails in project
 */
const extractMentions = async (content, projectId) => {
  if (!content) return [];

  // Get all members of the project + project manager
  const project = await Project.findById(projectId);
  const projectMembers = await ProjectMember.find({ project: projectId }).select('user');
  
  const memberUserIds = projectMembers.map((m) => m.user.toString());
  if (project) {
    memberUserIds.push(project.manager.toString());
  }

  const users = await User.find({ _id: { $in: memberUserIds } }).select('_id name email');

  const mentionedUserIds = new Set();

  users.forEach((user) => {
    const handleRegex = new RegExp(`@${user.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}`, 'gi');
    const emailRegex = new RegExp(`@${user.email.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}`, 'gi');
    const idRegex = new RegExp(`@${user._id.toString()}`, 'g');

    if (handleRegex.test(content) || emailRegex.test(content) || idRegex.test(content)) {
      mentionedUserIds.add(user._id.toString());
    }
  });

  return Array.from(mentionedUserIds);
};

/**
 * Create a new task comment or reply
 */
export const createTaskComment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.user._id;

    // 1. Check if Task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // 2. Check Project Authorization
    const hasAccess = await isUserProjectMember(userId, task.project);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this project.' });
    }

    // 3. Handle 1-level reply restriction
    let resolvedParentId = null;
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
      // If parent is already a reply, attach to top-level parent to maintain 1-level depth
      resolvedParentId = parentComment.parentComment ? parentComment.parentComment : parentComment._id;
    }

    // 4. Upload files to Cloudinary if provided
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        let fileType = 'raw';
        if (file.mimetype.startsWith('image/')) {
          fileType = 'image';
        } else if (file.mimetype.startsWith('video/')) {
          fileType = 'video';
        } else if (file.mimetype === 'application/pdf') {
          fileType = 'pdf';
        }

        const uploadResult = await uploadToCloudinary(
          file.buffer,
          file.originalname,
          file.mimetype
        );

        attachments.push({
          originalName: file.originalname,
          fileUrl: uploadResult.fileUrl,
          publicId: uploadResult.publicId,
          fileType,
          mimeType: file.mimetype,
          fileSize: file.size,
        });
      }
    }

    // 5. Extract mentions
    const mentions = await extractMentions(content, task.project);

    // 6. Create comment
    const comment = await Comment.create({
      task: taskId,
      project: task.project,
      author: userId,
      content,
      parentComment: resolvedParentId,
      attachments,
      mentions,
    });

    // 7. Trigger mention email notifications
    if (mentions.length > 0) {
      const mentionedUsers = await User.find({ _id: { $in: mentions } });
      for (const user of mentionedUsers) {
        if (user._id.toString() !== userId.toString()) {
          try {
            await addMentionEmailJob({
              email: user.email,
              name: user.name,
              authorName: req.user.name,
              taskTitle: task.title,
              commentContent: content,
            });
          } catch (queueErr) {
            console.error('Failed to queue mention email:', queueErr);
          }
        }
      }
    }

    // 8. Trigger In-App & Socket.IO COMMENT_ADDED Notifications
    const commentRecipients = new Set([
      ...(mentions || []),
      ...(task.assignedTo || []).map((id) => id.toString()),
      task.createdBy.toString(),
    ]);

    const projectObj = await Project.findById(task.project).select('workspace');
    const workspaceId = projectObj ? projectObj.workspace : null;

    commentRecipients.forEach((recipientId) => {
      createNotification({
        recipient: recipientId,
        sender: userId,
        type: NOTIFICATION_TYPES.COMMENT_ADDED,
        title: 'New Comment',
        message: `${req.user.name} commented on task "${task.title}".`,
        workspace: workspaceId,
        project: task.project,
        task: taskId,
        comment: comment._id,
      }).catch((err) => console.error('Notification error:', err.message));
    });

    // 8. Populate author and mentions for response
    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name email')
      .populate('mentions', 'name email');

    res.status(201).json(populatedComment);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all comments for a task (Top-level comments + 1-level nested replies)
 */
export const getTaskComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id;

    // 1. Check if Task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // 2. Check Project Authorization
    const hasAccess = await isUserProjectMember(userId, task.project);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this project.' });
    }

    // 3. Fetch all comments for the task
    const allComments = await Comment.find({ task: taskId })
      .populate('author', 'name email')
      .populate('mentions', 'name email')
      .sort({ createdAt: 1 });

    // 4. Separate top-level comments and replies
    const topLevelComments = [];
    const repliesMap = new Map();

    allComments.forEach((c) => {
      if (c.parentComment) {
        const pId = c.parentComment.toString();
        if (!repliesMap.has(pId)) {
          repliesMap.set(pId, []);
        }
        repliesMap.get(pId).push(c);
      } else {
        topLevelComments.push(c);
      }
    });

    // Combine into hierarchical structure
    const structuredComments = topLevelComments.map((comment) => {
      const cObj = comment.toObject();
      cObj.replies = repliesMap.get(comment._id.toString()) || [];
      return cObj;
    });

    res.status(200).json(structuredComments);
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing comment (author only)
 */
export const updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only the comment author can edit this comment' });
    }

    if (comment.isDeleted) {
      return res.status(400).json({ message: 'Cannot edit a deleted comment' });
    }

    // Re-extract mentions if content changed
    const mentions = await extractMentions(content, comment.project);

    comment.content = content;
    comment.mentions = mentions;
    comment.isEdited = true;
    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
      .populate('author', 'name email')
      .populate('mentions', 'name email');

    res.status(200).json(updatedComment);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a comment (soft delete, author or project manager only)
 */
export const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const project = await Project.findById(comment.project);
    const isManager = project && project.manager.toString() === userId.toString();
    const isAuthor = comment.author.toString() === userId.toString();

    if (!isAuthor && !isManager) {
      return res.status(403).json({ message: 'Only the author or project manager can delete this comment' });
    }

    comment.isDeleted = true;
    comment.content = '[This comment has been deleted]';
    comment.attachments = [];
    await comment.save();

    res.status(200).json({ message: 'Comment deleted successfully', commentId });
  } catch (error) {
    next(error);
  }
};
