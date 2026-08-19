import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

/**
 * Tabs — shadcn-inspired horizontal tab bar with Framer Motion layout pill.
 */
export default function Tabs({ tabs, activeTab, onChange, className }) {
  return (
    <div className={cn('flex items-center gap-1 p-1 bg-[#0D0F14] border border-white/[0.06] rounded-xl', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const Icon = tab.icon;

        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none',
              isActive
                ? 'text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-[#1C202B] rounded-lg border border-white/[0.08] shadow-sm"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-semibold',
                    isActive
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-white/[0.05] text-zinc-500'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
