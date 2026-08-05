import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Folder, ChevronRight, LayoutGrid, Plus } from 'lucide-react';
import { useCommandStore } from '../../store/useCommandStore';
import { useWorkspace } from '../../context/WorkspaceContext';
import { cn } from '../../lib/cn';

/**
 * CommandPalette — Ctrl+K search and quick actions.
 */
export default function CommandPalette() {
  const { isOpen, query, close, setQuery } = useCommandStore();
  const { projects } = useWorkspace();
  const navigate = useNavigate();

  // Keyboard shortcut registration
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, close]);

  // Filter projects
  const filteredProjects = useMemo(
    () =>
      projects.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      ),
    [projects, query]
  );

  const quickActions = [
    {
      label: 'Go to Dashboard',
      icon: LayoutGrid,
      action: () => { navigate('/'); close(); },
    },
    {
      label: 'Create New Project',
      icon: Plus,
      action: () => {
        window.dispatchEvent(new CustomEvent('obliq:create-project'));
        close();
      },
    },
  ];

  const handleSelect = (projectId) => {
    navigate(`/project/${projectId}`);
    close();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh] sm:pt-[18vh]"
          role="dialog"
          aria-modal="true"
          aria-label="Quick search"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={close}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
              <Search className="h-5 w-5 text-blue-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects, navigate, or take action..."
                className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
              />
              <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto p-2">
              {/* Quick Actions */}
              {!query && (
                <>
                  <p className="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                    Quick Actions
                  </p>
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={action.action}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-zinc-800"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/10 text-blue-400">
                        <action.icon className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-medium text-zinc-300">{action.label}</span>
                    </button>
                  ))}
                </>
              )}

              {/* Projects */}
              <p className="px-2 pb-2 pt-3 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                Projects
              </p>
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <button
                    key={project._id}
                    onClick={() => handleSelect(project._id)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-zinc-800 group"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-800 text-zinc-400 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
                      <Folder className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-zinc-200">
                        {project.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-zinc-600">
                        {project.description || 'Open project board'}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                  </button>
                ))
              ) : (
                <div className="px-3 py-8 text-center text-sm text-zinc-600">
                  No matching projects.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2.5 text-[10px] text-zinc-600">
              <span>Navigate your workspace faster</span>
              <span>↵ to open</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
