import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import CommentInput from './CommentInput';
import CommentItem from './CommentItem';
import EmptyState from '../ui/EmptyState';

export default function CommentSection({
  taskId,
  projectId,
  currentUser,
  isManager = false,
  className = '',
  onCommentCountChange,
}) {
  const [comments, setComments] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);

  const onCommentCountChangeRef = useRef(onCommentCountChange);
  useEffect(() => {
    onCommentCountChangeRef.current = onCommentCountChange;
  }, [onCommentCountChange]);

  // Fetch comments for task
  const fetchComments = useCallback(async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTaskComments(taskId);
      setComments(data || []);
      if (onCommentCountChangeRef.current && Array.isArray(data)) {
        const count = data.reduce((acc, c) => acc + 1 + (c.replies ? c.replies.length : 0), 0);
        onCommentCountChangeRef.current(count);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
      setError(err.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  // Fetch project members for @mentions
  const fetchMembers = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await api.getProjectMembers(projectId);
      setProjectMembers(data || []);
    } catch (err) {
      console.error('Failed to load project members for mentions:', err);
    }
  }, [projectId]);

  useEffect(() => {
    fetchComments();
    fetchMembers();
  }, [fetchComments, fetchMembers]);

  // Handle submit comment or reply
  const handleSubmitComment = async (formData) => {
    const newComment = await api.createTaskComment(taskId, formData);
    
    // Refresh comments list
    await fetchComments();
    setReplyingTo(null);
  };

  // Handle edit comment
  const handleEditComment = async (commentId, newContent) => {
    await api.updateComment(commentId, newContent);
    await fetchComments();
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await api.deleteComment(commentId);
      await fetchComments();
    }
  };

  // Calculate total comment count including replies
  const totalCount = comments.reduce((acc, c) => acc + 1 + (c.replies ? c.replies.length : 0), 0);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-primary)]">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[var(--accent-primary)]" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">Comments</h3>
          <span className="px-2 py-0.5 bg-[var(--accent-primary-muted)] text-[var(--accent-primary)] font-semibold text-xs rounded-full border border-[var(--accent-primary)]/20">
            {totalCount}
          </span>
        </div>

        <button
          onClick={fetchComments}
          disabled={loading}
          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-elevated)] rounded-lg transition-colors cursor-pointer"
          title="Refresh comments"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Comment Input */}
      <CommentInput
        projectMembers={projectMembers}
        onSubmit={handleSubmitComment}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />

      {/* Error state */}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && comments.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-[var(--text-muted)] gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-primary)]" />
          <span className="text-xs">Loading comments...</span>
        </div>
      ) : comments.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No comments yet"
          description="Be the first to share an update, attach a file, or tag a teammate!"
          className="py-8"
        />
      ) : (
        /* Comment List */
        <div className="divide-y divide-[var(--border-secondary)]">
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              currentUser={currentUser}
              isManager={isManager}
              onReply={(c) => setReplyingTo(c)}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              projectMembers={projectMembers}
            />
          ))}
        </div>
      )}
    </div>
  );
}
