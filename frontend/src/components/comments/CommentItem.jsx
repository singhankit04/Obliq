import React, { useState } from 'react';
import { CornerDownRight, Edit2, Trash2, Check, X, FileText, Image as ImageIcon, Film, Download, ExternalLink } from 'lucide-react';
import Avatar from '../ui/Avatar';
import AttachmentViewer from './AttachmentViewer';

export default function CommentItem({
  comment,
  currentUser,
  isManager = false,
  onReply,
  onEdit,
  onDelete,
  projectMembers = [],
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content || '');
  const [selectedFileForViewer, setSelectedFileForViewer] = useState(null);

  const isAuthor = currentUser && (currentUser._id === comment.author?._id || currentUser.id === comment.author?._id);
  const canDelete = isAuthor || isManager;

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    await onEdit(comment._id, editContent.trim());
    setIsEditing(false);
  };

  // Helper to format relative timestamp
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Format content with highlighted @mentions
  const renderFormattedContent = (text) => {
    if (!text) return null;
    // Regex for matching @Words
    const parts = text.split(/(@[A-Za-z0-9._-]+(?:\s[A-Za-z0-9._-]+)?)/g);

    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={i}
            className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[var(--accent-primary-muted)] text-[var(--accent-primary)] font-semibold text-xs border border-[var(--accent-primary)]/20 mx-0.5"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className={`group py-3.5 transition-all ${comment.isDeleted ? 'opacity-60' : ''}`}>
      {/* Lightbox / Attachment Viewer */}
      {selectedFileForViewer && (
        <AttachmentViewer
          file={selectedFileForViewer}
          onClose={() => setSelectedFileForViewer(null)}
        />
      )}

      <div className="flex items-start gap-3">
        <Avatar name={comment.author?.name || 'User'} size="sm" />

        <div className="flex-1 min-w-0">
          {/* Header Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                {comment.author?.name || 'Unknown User'}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                {formatTime(comment.createdAt)}
              </span>
              {comment.isEdited && !comment.isDeleted && (
                <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded">
                  (edited)
                </span>
              )}
            </div>

            {/* Actions (Edit / Delete / Reply) */}
            {!comment.isDeleted && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onReply(comment)}
                  className="px-2 py-1 text-[11px] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary-muted)] rounded-lg transition-colors flex items-center gap-1"
                  title="Reply to comment"
                >
                  <CornerDownRight className="w-3 h-3" />
                  <span>Reply</span>
                </button>
                {isAuthor && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-elevated)] rounded-lg transition-colors"
                    title="Edit comment"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => onDelete(comment._id)}
                    className="p-1 text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Delete comment"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Comment Content / Edit Form */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={2}
                className="w-full p-2.5 bg-[var(--bg-card)] border border-[var(--accent-primary)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 bg-[var(--accent-primary)] text-white text-xs font-semibold rounded-lg hover:bg-[var(--accent-primary-hover)] flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  className="px-3 py-1 bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-xs rounded-lg hover:bg-[var(--border-primary)] flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-1 text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap break-words">
              {renderFormattedContent(comment.content)}
            </div>
          )}

          {/* Attachments Display */}
          {comment.attachments && comment.attachments.length > 0 && !comment.isDeleted && (
            <div className="flex flex-wrap gap-2.5 mt-3">
              {comment.attachments.map((file, idx) => (
                <div
                  key={file._id || idx}
                  onClick={() => setSelectedFileForViewer(file)}
                  className="group/attach relative flex items-center gap-2.5 p-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl hover:border-[var(--accent-primary)]/40 transition-all cursor-pointer overflow-hidden max-w-xs"
                >
                  {file.fileType === 'image' || file.mimeType?.startsWith('image/') ? (
                    <div className="w-12 h-12 rounded-lg bg-[var(--bg-elevated)] overflow-hidden shrink-0 relative">
                      <img
                        src={file.fileUrl}
                        alt={file.originalName}
                        className="w-full h-full object-cover group-hover/attach:scale-105 transition-transform"
                      />
                    </div>
                  ) : file.fileType === 'video' || file.mimeType?.startsWith('video/') ? (
                    <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                      <Film className="w-5 h-5 text-purple-400" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-sky-400" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-[11px] font-semibold text-[var(--text-primary)] truncate">
                      {file.originalName}
                    </p>
                    <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">
                      {file.fileType || 'File'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Nested Replies (1 level) */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 pl-4 border-l-2 border-[var(--accent-primary)]/30 space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  currentUser={currentUser}
                  isManager={isManager}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  projectMembers={projectMembers}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
