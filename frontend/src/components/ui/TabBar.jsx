export default function TabBar({ tabs = [], activeTab, onChange, className = '' }) {
  return (
    <div className={`flex items-center border-b border-[var(--border-primary)] ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`
              relative flex items-center gap-1.5 px-4 py-3 text-xs font-semibold transition-all cursor-pointer
              ${isActive 
                ? 'text-[var(--accent-primary)]' 
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }
            `}
          >
            {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`
                px-1.5 py-0.5 rounded-full text-[9px] font-bold
                ${isActive 
                  ? 'bg-[var(--accent-primary-muted)] text-[var(--accent-primary)]' 
                  : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                }
              `}>
                {tab.count}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)] rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
