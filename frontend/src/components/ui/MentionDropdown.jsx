import Avatar from './Avatar';

export default function MentionDropdown({ 
  users = [], 
  searchTerm = '', 
  onSelect, 
  className = '' 
}) {
  const filtered = users.filter((u) =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filtered.length === 0) return null;

  return (
    <div className={`bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl shadow-xl max-h-48 overflow-y-auto py-1 animate-scale-in ${className}`}>
      {filtered.slice(0, 8).map((user) => (
        <button
          key={user.id}
          onClick={() => onSelect(user)}
          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--accent-primary-muted)] transition-all text-left cursor-pointer group"
        >
          <Avatar name={user.name} size="xs" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-primary)] transition-colors">
              {user.name}
            </p>
            {user.role && (
              <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">{user.role}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
