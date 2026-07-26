
const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-14 h-14 text-lg',
};

const statusColors = {
  online: 'bg-emerald-500',
  away: 'bg-amber-500',
  busy: 'bg-rose-500',
  offline: 'bg-slate-400',
};

const colorPalette = [
  'from-indigo-500 to-purple-500',
  'from-cyan-500 to-blue-500',
  'from-emerald-500 to-teal-500',
  'from-rose-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-violet-500 to-fuchsia-500',
];

export default function Avatar({ 
  name = '', 
  src, 
  size = 'md', 
  status, 
  className = '',
  ring = false,
}) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const colorIndex = name ? name.charCodeAt(0) % colorPalette.length : 0;
  const gradient = colorPalette[colorIndex];

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeMap[size]} rounded-xl object-cover ${ring ? 'ring-2 ring-[var(--accent-primary)] ring-offset-2 ring-offset-[var(--bg-card)]' : ''}`}
        />
      ) : (
        <div
          className={`${sizeMap[size]} rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold shadow-sm ${ring ? 'ring-2 ring-[var(--accent-primary)] ring-offset-2 ring-offset-[var(--bg-card)]' : ''}`}
          title={name}
        >
          {initial}
        </div>
      )}
      {status && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${statusColors[status]} rounded-full border-2 border-[var(--bg-card)]`}
        />
      )}
    </div>
  );
}

export function AvatarGroup({ users = [], max = 4, size = 'sm' }) {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((user, idx) => (
        <Avatar
          key={user.id || idx}
          name={user.name}
          src={user.avatar}
          size={size}
          className="border-2 border-[var(--bg-card)] hover:z-10 hover:scale-110 transition-transform cursor-pointer"
        />
      ))}
      {remaining > 0 && (
        <div
          className={`${sizeMap[size]} rounded-xl bg-[var(--bg-elevated)] border-2 border-[var(--bg-card)] flex items-center justify-center text-[var(--text-tertiary)] font-bold`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
