import { useState } from 'react';

const allEmojis = [
  { emoji: '👍', label: 'thumbs up' },
  { emoji: '❤️', label: 'heart' },
  { emoji: '🚀', label: 'rocket' },
  { emoji: '🎉', label: 'party' },
  { emoji: '🔥', label: 'fire' },
  { emoji: '👀', label: 'eyes' },
  { emoji: '😂', label: 'laugh' },
  { emoji: '🤔', label: 'thinking' },
  { emoji: '✅', label: 'check' },
  { emoji: '❌', label: 'cross' },
  { emoji: '💯', label: 'hundred' },
  { emoji: '⭐', label: 'star' },
];

export default function EmojiPicker({ onSelect, className = '' }) {
  return (
    <div className={`bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl shadow-xl p-2 animate-scale-in ${className}`}>
      <div className="grid grid-cols-6 gap-0.5">
        {allEmojis.map(({ emoji, label }) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-[var(--bg-elevated)] rounded-lg transition-all hover:scale-125 cursor-pointer"
            title={label}
            aria-label={label}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReactionBar({ reactions = [], onToggle, onAdd, currentUserId }) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {reactions.map((reaction) => {
        const hasReacted = reaction.users?.includes(currentUserId);
        return (
          <button
            key={reaction.emoji}
            onClick={() => onToggle(reaction.emoji)}
            className={`
              inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium transition-all cursor-pointer
              ${hasReacted
                ? 'bg-[var(--accent-primary-muted)] border border-[var(--accent-primary)]/30 text-[var(--accent-primary)]'
                : 'bg-[var(--bg-elevated)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/30'
              }
            `}
          >
            <span className="animate-pop" style={{ display: 'inline-block' }}>{reaction.emoji}</span>
            <span>{reaction.count}</span>
          </button>
        );
      })}
      
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/30 transition-all cursor-pointer text-sm"
          title="Add reaction"
        >
          +
        </button>
        {showPicker && (
          <div className="absolute bottom-full left-0 mb-2 z-50">
            <EmojiPicker
              onSelect={(emoji) => {
                onAdd(emoji);
                setShowPicker(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
