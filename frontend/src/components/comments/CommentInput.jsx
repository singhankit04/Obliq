import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Send, X, Image as ImageIcon, Film, FileText, CornerDownRight } from 'lucide-react';
import MentionDropdown from '../ui/MentionDropdown';
import Button from '../ui/Button';

export default function CommentInput({
  projectMembers = [],
  onSubmit,
  replyingTo = null,
  onCancelReply,
  placeholder = 'Write a comment... (use @ to mention teammates)',
}) {
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // @Mention Dropdown state
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-focus when replyingTo changes
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  // Track cursor and @ symbol for mentions
  const handleTextChange = (e) => {
    const text = e.target.value;
    const pos = e.target.selectionStart;
    setContent(text);
    setCursorPos(pos);

    // Look backward from cursor position to find '@'
    const lastAtPos = text.lastIndexOf('@', pos - 1);
    if (lastAtPos !== -1) {
      const query = text.slice(lastAtPos + 1, pos);
      // Ensure no spaces inside query
      if (!query.includes(' ') && !query.includes('\n')) {
        setMentionSearch(query);
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  };

  const handleSelectMention = (user) => {
    const text = content;
    const lastAtPos = text.lastIndexOf('@', cursorPos - 1);
    if (lastAtPos !== -1) {
      const beforeAt = text.slice(0, lastAtPos);
      const afterCursor = text.slice(cursorPos);
      const newText = `${beforeAt}@${user.name} ${afterCursor}`;
      setContent(newText);
    }
    setShowMentions(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles].slice(0, 5)); // Limit to 5 files
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && selectedFiles.length === 0) return;

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('content', content.trim());

      if (replyingTo) {
        formData.append('parentCommentId', replyingTo._id);
      }

      selectedFiles.forEach((file) => {
        formData.append('attachments', file);
      });

      await onSubmit(formData);

      // Reset state
      setContent('');
      setSelectedFiles([]);
      if (onCancelReply) onCancelReply();
    } catch (err) {
      console.error('Comment submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="relative bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-4 shadow-sm focus-within:border-[var(--accent-primary)]/40 transition-all">
      {/* Replying Banner */}
      {replyingTo && (
        <div className="flex items-center justify-between bg-[var(--accent-primary-muted)] px-3 py-1.5 rounded-xl mb-3 border border-[var(--accent-primary)]/20 text-xs">
          <div className="flex items-center gap-2 text-[var(--accent-primary)] font-medium">
            <CornerDownRight className="w-3.5 h-3.5" />
            <span>Replying to <strong>{replyingTo.author?.name || 'Comment'}</strong></span>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 hover:bg-rose-500/10 text-[var(--text-tertiary)] hover:text-rose-400 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Mention Dropdown Suggestion */}
      {showMentions && (
        <div className="absolute bottom-full left-4 mb-2 z-30 w-64">
          <MentionDropdown
            users={projectMembers.map((m) => m.user || m)}
            searchTerm={mentionSearch}
            onSelect={handleSelectMention}
          />
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              handleSubmit(e);
            }
          }}
          placeholder={placeholder}
          rows={3}
          className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none resize-none"
        />

        {/* Selected File Badges */}
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 my-2 pt-2 border-t border-[var(--border-secondary)]">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-2.5 py-1 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg text-xs text-[var(--text-secondary)]"
              >
                {file.type.startsWith('image/') ? (
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                ) : file.type.startsWith('video/') ? (
                  <Film className="w-3.5 h-3.5 text-purple-400" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                )}
                <span className="max-w-[140px] truncate font-medium">{file.name}</span>
                <span className="text-[10px] text-[var(--text-muted)]">({formatSize(file.size)})</span>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="p-0.5 hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-400 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-secondary)] mt-2">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/mp4,video/webm,video/quicktime,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary-muted)] rounded-xl transition-all cursor-pointer"
              title="Attach Images, Video, or PDF"
            >
              <Paperclip className="w-4 h-4" />
              <span>Attach Media / PDF</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-muted)] hidden sm:inline">Ctrl+Enter to post</span>
            <Button
              type="submit"
              size="sm"
              loading={isSubmitting}
              disabled={!content.trim() && selectedFiles.length === 0}
              className="gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Comment</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
