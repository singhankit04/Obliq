import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../services/api';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock3,
  FolderKanban, AlertTriangle, CheckCircle2
} from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { SkeletonCard } from '../components/ui/Skeleton';

export default function CalendarView() {
  const { user } = useAuth();
  const { activeWorkspace, projects } = useWorkspace();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    let cancelled = false;
    async function loadTasks() {
      if (!activeWorkspace?._id) return;
      setLoading(true);
      try {
        const results = await Promise.all(projects.map((p) => api.getTasks(p._id)));
        if (cancelled) return;
        const all = results.flatMap((res, index) =>
          (res.tasks || []).map((t) => ({
            ...t,
            project: { _id: projects[index]._id, name: projects[index].name },
          }))
        );
        setTasks(all.filter((t) => t.dueDate));
      } catch (err) {
        console.error('Failed to load tasks for calendar:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadTasks();
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace?._id, projects]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const totalDaysPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, totalDaysPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getTasksForDate = (date) => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const d = new Date(task.dueDate);
      return (
        d.getDate() === date.getDate() &&
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear()
      );
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 pb-12"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400 mb-1">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Schedule & Deadlines</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-100">
            {monthNames[month]} {year}
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Deadlines across all active workspace projects.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={goToToday}>
            Today
          </Button>
          <div className="flex items-center gap-0.5 bg-[#0D1017] border border-white/[0.08] rounded-lg p-0.5">
            <button
              onClick={prevMonth}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <SkeletonCard className="h-[600px] w-full" />
      ) : (
        <div className="bg-[#0A0D13] border border-white/[0.08] rounded-xl overflow-hidden shadow-xl specular-border">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 border-b border-white/[0.06] bg-[#0E1118] text-center text-xs font-medium text-zinc-400 py-2.5">
            <div>SUN</div>
            <div>MON</div>
            <div>TUE</div>
            <div>WED</div>
            <div>THU</div>
            <div>FRI</div>
            <div>SAT</div>
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-white/[0.05] bg-[#0A0D13]">
            {calendarDays.map((item, index) => {
              const dayTasks = getTasksForDate(item.date);
              const today = isToday(item.date);
              return (
                <div
                  key={index}
                  className={`min-h-[110px] p-2 transition-colors flex flex-col justify-between ${
                    item.isCurrentMonth ? 'bg-[#0E1118]/60' : 'bg-[#080B10]/40 opacity-35'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span
                      className={`text-xs font-mono w-5 h-5 rounded-full flex items-center justify-center ${
                        today
                          ? 'bg-blue-500 text-white font-bold shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                          : item.isCurrentMonth
                          ? 'text-zinc-300'
                          : 'text-zinc-600'
                      }`}
                    >
                      {item.date.getDate()}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Task Chips */}
                  <div className="space-y-1 overflow-y-auto max-h-[80px]">
                    {dayTasks.slice(0, 3).map((task) => (
                      <Link
                        key={task._id}
                        to={`/project/${task.project?._id}/task/${task._id}`}
                        className={`block text-[11px] px-1.5 py-0.5 rounded truncate font-medium border transition-colors ${
                          task.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 line-through'
                            : task.priority === 'urgent' || task.priority === 'high'
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                        }`}
                        title={`${task.title} (${task.project?.name})`}
                      >
                        {task.title}
                      </Link>
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="text-[10px] text-zinc-500 block text-center font-mono">
                        +{dayTasks.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
