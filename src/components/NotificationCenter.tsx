import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  Settings,
  X,
} from 'lucide-react';
import type { Task, TaskNotification, UserSettings } from '../types/task.ts';

interface NotificationCenterProps {
  notifications: TaskNotification[];
  tasks: Task[];
  settings: UserSettings;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onSelectTask: (task: Task) => void;
  onNavigateToSettings: () => void;
}

export function NotificationCenter({
  notifications,
  tasks,
  settings,
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectTask,
  onNavigateToSettings,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleTaskClick = (n: TaskNotification) => {
    onMarkAsRead(n.id);
    const targetTask = tasks.find((t) => t._id === n.taskId);
    if (targetTask) {
      onSelectTask(targetTask);
      setOpen(false);
    }
  };

  const getAlertIcon = (type: TaskNotification['type']) => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" aria-hidden="true" />;
      case 'due_now':
        return <BellRing className="w-4 h-4 text-amber-500 animate-pulse shrink-0" aria-hidden="true" />;
      case 'due_soon':
      default:
        return <Clock className="w-4 h-4 text-indigo-500 shrink-0" aria-hidden="true" />;
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={open}
        className={`relative p-2 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-indigo-600 ${
          open
            ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
        }`}
      >
        <Bell className="w-5 h-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs animate-in zoom-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-950/10 dark:shadow-black/40 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-sm text-slate-900 dark:text-slate-100">
                  Task Alerts
                </span>
                {notifications.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    {notifications.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllAsRead}
                    title="Mark all as read"
                    className="p-1 rounded-md text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onNavigateToSettings();
                  }}
                  title="Notification settings"
                  className="p-1 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {notifications.length === 0 ? (
                <div className="py-10 px-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-2.5">
                    <Check className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    All caught up!
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    No active due date alerts or overdue tasks right now.
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start justify-between gap-3 p-3.5 transition-colors cursor-pointer group ${
                      n.read
                        ? 'opacity-70 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        : 'bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40'
                    }`}
                    onClick={() => handleTaskClick(n)}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="mt-0.5">{getAlertIcon(n.type)}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {n.taskTitle}
                        </p>
                        <p
                          className={`text-xs mt-0.5 ${
                            n.type === 'overdue'
                              ? 'text-rose-600 dark:text-rose-400 font-medium'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {n.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead(n.id);
                        }}
                        title="Dismiss alert"
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                Alert timing:{' '}
                <strong className="text-slate-700 dark:text-slate-300 font-medium">
                  {settings.alertTiming === 'at_due'
                    ? 'At due time'
                    : settings.alertTiming === '15m'
                    ? '15m before'
                    : settings.alertTiming === '30m'
                    ? '30m before'
                    : settings.alertTiming === '1h'
                    ? '1h before'
                    : settings.alertTiming === '1d'
                    ? '1d before'
                    : 'Off'}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onNavigateToSettings();
                }}
                className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
              >
                Settings
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
