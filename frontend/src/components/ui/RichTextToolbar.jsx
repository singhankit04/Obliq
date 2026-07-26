import { Bold, Italic, Code, Link, List, ListOrdered, ImageIcon, Paperclip, Smile, AtSign } from 'lucide-react';

const tools = [
  { icon: Bold, label: 'Bold', action: 'bold' },
  { icon: Italic, label: 'Italic', action: 'italic' },
  { icon: Code, label: 'Code', action: 'code' },
  { icon: Link, label: 'Link', action: 'link' },
  { icon: List, label: 'List', action: 'list' },
  { icon: ListOrdered, label: 'Ordered List', action: 'ordered-list' },
];

export default function RichTextToolbar({ onAction, className = '' }) {
  return (
    <div className={`flex items-center gap-0.5 px-2 py-1.5 border-t border-[var(--border-secondary)] ${className}`}>
      {/* Formatting tools */}
      <div className="flex items-center gap-0.5">
        {tools.map((tool) => (
          <button
            key={tool.action}
            onClick={() => onAction(tool.action)}
            className="p-1.5 hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] rounded-lg transition-all cursor-pointer"
            title={tool.label}
            aria-label={tool.label}
          >
            <tool.icon className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>

      <div className="w-px h-4 bg-[var(--border-secondary)] mx-1" />

      {/* Attachment tools */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onAction('image')}
          className="p-1.5 hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] rounded-lg transition-all cursor-pointer"
          title="Add image"
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onAction('attach')}
          className="p-1.5 hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] rounded-lg transition-all cursor-pointer"
          title="Attach file"
        >
          <Paperclip className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onAction('emoji')}
          className="p-1.5 hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] rounded-lg transition-all cursor-pointer"
          title="Emoji"
        >
          <Smile className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onAction('mention')}
          className="p-1.5 hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] rounded-lg transition-all cursor-pointer"
          title="Mention someone"
        >
          <AtSign className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
