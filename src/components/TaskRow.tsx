import { motion } from 'motion/react';
import {
  AlertTriangle,
  Calendar,
  Check,
  Flag,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import type { Priority, Task } from '../types/task.ts';
import { formatDueDateLabel, formatShortDate } from '../utils/taskHelpers.ts';

interface TaskRowProps {
  task: Task;
  busy?: boolean;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  showRestoreButton?: boolean;
}

const PRIORITY_META: Record<
  Priority,
  { label: string; textClass: string }
> = {
  high: {
    label: 'High priority',
    textClass: 'text-rose-600 dark:text-rose-400 font-medium',
  },
  medium: {
    label: 'Medium priority',
    textClass: 'text-amber-600 dark:text-amber-400 font-medium',
  },
  low: {
    label: 'Low priority',
    textClass: 'text-slate-500 dark:text-slate-400',
  },
};

export function TaskRow({
  task,
  busy = false,
  onToggleComplete,
  onEdit,
  onDelete,
  showRestoreButton = false,
}: TaskRowProps) {
  const dueInfo = formatDueDateLabel(task.dueDate, task.completed);
  const priorityInfo = PRIORITY_META[task.priority];

  const dueToneClass =
    dueInfo.tone === 'overdue'
      ? 'text-rose-600 dark:text-rose-400 font-medium'
      : dueInfo.tone === 'today'
        ? 'text-amber-600 dark:text-amber-400 font-medium'
        : 'text-slate-500 dark:text-slate-400';

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      className={`group rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3.5 transition-colors hover:border-slate-300 dark:hover:border-slate-700 ${
        busy ? 'opacity-60 pointer-events-none' : ''
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Completion checkbox with generous 40px accessible touch target */}
        <button
          type="button"
          onClick={() => onToggleComplete(task)}
          disabled={busy}
          aria-label={
            task.completed
              ? `Restore "${task.title}" to pending`
              : `Mark "${task.title}" as completed`
          }
          aria-pressed={task.completed}
          className="mt-0.5 -ml-1.5 flex items-center justify-center w-9 h-9 rounded-lg shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-2 focus-visible:outline-indigo-600"
        >
          <span
            className={`flex items-center justify-center w-5 h-5 rounded-md border transition-colors ${
              task.completed
                ? 'bg-emerald-600 border-emerald-600 text-white dark:bg-emerald-500 dark:border-emerald-500'
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 group-hover:border-indigo-500 dark:group-hover:border-indigo-400'
            }`}
          >
            {task.completed && <Check className="w-3.5 h-3.5 stroke-[2.75]" aria-hidden="true" />}
          </span>
        </button>

        {/* Primary content */}
        <div className="min-w-0 flex-1 pt-1">
          <div className="flex items-start justify-between gap-3">
            <h3
              className={`text-[15px] font-semibold leading-snug break-words ${
                task.completed
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {task.title}
            </h3>

            {/* Row actions */}
            <div className="flex items-center gap-1 shrink-0 -mr-1 -mt-1">
              {showRestoreButton && task.completed && (
                <button
                  type="button"
                  onClick={() => onToggleComplete(task)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-indigo-600"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  Restore
                </button>
              )}

              <button
                type="button"
                onClick={() => onEdit(task)}
                disabled={busy}
                aria-label={`Edit "${task.title}"`}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-2 focus-visible:outline-indigo-600"
              >
                <Pencil className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onDelete(task)}
                disabled={busy}
                aria-label={`Delete "${task.title}"`}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors focus-visible:outline-2 focus-visible:outline-rose-600"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {task.description && (
            <p
              className={`mt-1 text-sm leading-relaxed line-clamp-2 ${
                task.completed
                  ? 'text-slate-400 dark:text-slate-500'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {task.description}
            </p>
          )}

          {/* Clean unboxed inline metadata separated by typographic dots */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
            <span className={`inline-flex items-center gap-1 ${priorityInfo.textClass}`}>
              <Flag className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{priorityInfo.label}</span>
            </span>

            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
              ·
            </span>

            <span className="text-slate-600 dark:text-slate-400">{task.category}</span>

            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
              ·
            </span>

            <span className={`inline-flex items-center gap-1 tabular-nums ${dueToneClass}`}>
              {dueInfo.tone === 'overdue' ? (
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              )}
              <span>{dueInfo.label}</span>
            </span>

            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
              ·
            </span>

            <span className="text-slate-400 dark:text-slate-500 tabular-nums">
              Created {formatShortDate(task.createdAt)}
            </span>

            {task.completed && (
              <>
                <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                  ·
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Completed
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
