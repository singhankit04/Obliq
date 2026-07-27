import React from 'react';
import { X, Download, FileText, ExternalLink } from 'lucide-react';
import Button from '../ui/Button';

export default function AttachmentViewer({ file, onClose }) {
  if (!file) return null;

  const { fileUrl, originalName, fileType, mimeType, fileSize } = file;

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative max-w-4xl w-full max-h-[90vh] bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)] bg-[var(--bg-elevated)]">
          <div className="min-w-0 flex-1 pr-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">{originalName}</h3>
            {fileSize > 0 && <p className="text-xs text-[var(--text-muted)]">{formatSize(fileSize)}</p>}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary-muted)] rounded-xl transition-colors"
              title="Download or Open original"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-[var(--text-secondary)] hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-black/20 min-h-[300px]">
          {fileType === 'image' || (mimeType && mimeType.startsWith('image/')) ? (
            <img
              src={fileUrl}
              alt={originalName}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
            />
          ) : fileType === 'video' || (mimeType && mimeType.startsWith('video/')) ? (
            <video
              src={fileUrl}
              controls
              autoPlay
              className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
            >
              Your browser does not support HTML5 video playback.
            </video>
          ) : (
            <div className="flex flex-col items-center text-center p-8 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-2xl max-w-md">
              <FileText className="w-16 h-16 text-[var(--accent-primary)] mb-4" />
              <h4 className="text-base font-semibold text-[var(--text-primary)] mb-1">{originalName}</h4>
              <p className="text-xs text-[var(--text-muted)] mb-6">PDF Document</p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-primary)] text-white text-xs font-semibold rounded-xl hover:bg-[var(--accent-primary-hover)] transition-all shadow-md"
              >
                <ExternalLink className="w-4 h-4" /> View PDF Document
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
