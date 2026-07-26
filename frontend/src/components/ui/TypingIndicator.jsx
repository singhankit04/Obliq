export default function TypingIndicator({ userName = 'Someone' }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 animate-fade-in">
      <div className="flex items-center gap-0.5">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
      <span className="text-xs text-[var(--text-tertiary)] italic">
        {userName} is typing...
      </span>
    </div>
  );
}
