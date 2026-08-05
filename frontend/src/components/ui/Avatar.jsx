import { cn } from '../../lib/cn';

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

const colorPool = [
  'bg-blue-600/20 text-blue-300',
  'bg-emerald-600/20 text-emerald-300',
  'bg-amber-600/20 text-amber-300',
  'bg-violet-600/20 text-violet-300',
  'bg-rose-600/20 text-rose-300',
  'bg-cyan-600/20 text-cyan-300',
  'bg-indigo-600/20 text-indigo-300',
  'bg-pink-600/20 text-pink-300',
];

function getColor(name) {
  if (!name) return colorPool[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colorPool[Math.abs(hash) % colorPool.length];
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function Avatar({ name, src, size = 'md', className, ...props }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn(
          'rounded-full object-cover shrink-0',
          sizeMap[size],
          className
        )}
        {...props}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold shrink-0 select-none',
        sizeMap[size],
        getColor(name),
        className
      )}
      title={name}
      {...props}
    >
      {getInitials(name)}
    </div>
  );
}

/**
 * AvatarGroup — stacked avatar list with overflow count.
 */
export function AvatarGroup({ users = [], size = 'sm', max = 3, className }) {
  const shown = users.slice(0, max);
  const rest = users.length - max;

  return (
    <div className={cn('flex -space-x-2', className)}>
      {shown.map((user, i) => (
        <Avatar
          key={user._id || user.id || i}
          name={user.name}
          src={user.avatar}
          size={size}
          className="ring-2 ring-zinc-900"
        />
      ))}
      {rest > 0 && (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-semibold ring-2 ring-zinc-900 bg-zinc-700 text-zinc-300 shrink-0',
            sizeMap[size]
          )}
        >
          +{rest}
        </div>
      )}
    </div>
  );
}
