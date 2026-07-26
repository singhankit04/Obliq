import { FileText, Image, Film, Download, Trash2, File } from 'lucide-react';

const iconMap = {
  image: Image,
  video: Film,
  pdf: FileText,
  default: File,
};

const typeFromName = (name) => {
  const ext = name?.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  if (['mp4', 'webm', 'mov'].includes(ext)) return 'video';
  if (['pdf'].includes(ext)) return 'pdf';
  return 'default';
};

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function FilePreview({
  name,
  size,
  url,
  thumbnail,
  uploadedAt,
  onDownload,
  onDelete,
  className = '',
}) {
  const type = typeFromName(name);
  const IconComponent = iconMap[type] || iconMap.default;
  const imageSrc = thumbnail || (type === 'image' ? url : null);
  const handleDownload = onDownload || (url ? () => window.open(url, '_blank') : null);

  return (
    <div className={`group flex items-center gap-3 p-3 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl hover:border-[var(--accent-primary)]/20 transition-all hover-lift ${className}`}>
      {/* Thumbnail or Icon */}
      <div className="w-10 h-10 rounded-lg bg-[var(--bg-card)] border border-[var(--border-secondary)] flex items-center justify-center overflow-hidden shrink-0">
        {imageSrc ? (
          <img src={imageSrc} alt={name} className="w-full h-full object-cover" />
        ) : (
          <IconComponent className="w-5 h-5 text-[var(--text-tertiary)]" />
        )}
      </div>

      {/* File info */}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{name}</p>
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
          {size && <span>{formatSize(size)}</span>}
          {uploadedAt && <span>• {uploadedAt}</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {handleDownload && (
          <button
            onClick={handleDownload}
            className="p-1.5 hover:bg-[var(--accent-primary-muted)] text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] rounded-lg transition-all"
            title="Download"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-rose-500/10 text-[var(--text-tertiary)] hover:text-rose-400 rounded-lg transition-all"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function UploadZone({ onDrop, className = '' }) {
  return (
    <div
      className={`
        border-2 border-dashed border-[var(--border-primary)] rounded-xl p-6
        flex flex-col items-center justify-center text-center
        hover:border-[var(--accent-primary)]/40 hover:bg-[var(--accent-primary-muted)]
        transition-all cursor-pointer group
        ${className}
      `}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDrop?.(e.dataTransfer.files);
      }}
      onClick={onDrop}
    >
      <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-primary)] flex items-center justify-center mb-2 group-hover:border-[var(--accent-primary)]/30 transition-all">
        <File className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors" />
      </div>
      <p className="text-xs font-semibold text-[var(--text-secondary)]">
        Drop files here or <span className="text-[var(--accent-primary)]">browse</span>
      </p>
      <p className="text-[10px] text-[var(--text-muted)] mt-1">
        PNG, JPG, PDF up to 10MB
      </p>
    </div>
  );
}
