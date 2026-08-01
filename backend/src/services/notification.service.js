import Notification from '../models/notification.model.js';
import { getIO } from '../config/socket.js';

/**
 * Creates and persists a notification in DB, then broadcasts via Socket.IO
 * @param {Object} params
 * @param {string|Object} params.recipient - Target User ID receiving notification
 * @param {string|Object} [params.sender=null] - User ID who triggered notification
 * @param {string} params.type - WORKSPACE_INVITE | TASK_ASSIGNED | COMMENT_ADDED | TASK_UPDATED | ROLE_CHANGED
 * @param {string} params.title
 * @param {string} params.message
 * @param {string|Object} [params.workspace=null]
 * @param {string|Object} [params.project=null]
 * @param {string|Object} [params.task=null]
 * @param {string|Object} [params.comment=null]
 * @param {Object} [params.data={}]
 * @returns {Promise<Object|null>}
 */
export const createNotification = async ({
  recipient,
  sender = null,
  type,
  title,
  message,
  workspace = null,
  project = null,
  task = null,
  comment = null,
  data = {},
}) => {
  try {
    if (!recipient) return null;

    const recipientStr = recipient.toString();
    const senderStr = sender ? sender.toString() : null;

    // Do not notify self
    if (senderStr && senderStr === recipientStr) {
      return null;
    }

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      workspace,
      project,
      task,
      comment,
      data,
    });

    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender', 'name email avatar')
      .populate('workspace', 'name slug')
      .populate('project', 'name')
      .populate('task', 'title status')
      .populate('comment', 'content');

    // Real-time broadcast via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`user:${recipientStr}`).emit('new_notification', populatedNotification);
    }

    return populatedNotification;
  } catch (error) {
    console.error('❌ [NotificationService] Failed to create notification:', error.message);
    // Non-blocking failure
    return null;
  }
};

/**
 * Retrieves paginated notifications feed for a user
 */
export const getUserNotifications = async (userId, { page = 1, limit = 20, unreadOnly = false } = {}) => {
  const query = { recipient: userId };
  if (unreadOnly) {
    query.isRead = false;
  }

  const skip = (Math.max(1, page) - 1) * limit;

  const [notifications, total] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name email avatar')
      .populate('workspace', 'name slug')
      .populate('project', 'name')
      .populate('task', 'title status')
      .populate('comment', 'content'),
    Notification.countDocuments(query),
  ]);

  return {
    notifications,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Returns total count of unread notifications for a user
 */
export const getUnreadCount = async (userId) => {
  const count = await Notification.countDocuments({ recipient: userId, isRead: false });
  return { unreadCount: count };
};

/**
 * Marks a single notification as read
 */
export const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    throw error;
  }

  return notification;
};

/**
 * Marks all notifications for a user as read
 */
export const markAllAsRead = async (userId) => {
  await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  return { message: 'All notifications marked as read' };
};

/**
 * Deletes a single notification
 */
export const deleteNotification = async (notificationId, userId) => {
  const result = await Notification.findOneAndDelete({ _id: notificationId, recipient: userId });
  if (!result) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    throw error;
  }

  return { message: 'Notification deleted successfully' };
};
