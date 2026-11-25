import { useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { CheckCircle2, Search, Trash2, X } from 'lucide-react';
import type { Task } from '../types/task.ts';
import { TaskRow } from '../components/TaskRow.tsx';

interface CompletedTasksPageProps {
  tasks: Task[];
  loading: boolean;
  busyIds: Set<string>;
  onToggleComplete: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onClearCompleted: () => void;
}

export function CompletedTasksPage({
  tasks,
  loading,
  busyIds,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onClearCompleted,
}: CompletedTasksPageProps) {
  const [search, setSearch] = useState('');

  const completedTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks
      .filter((t) => t.completed)
      .filter((t) =>
        q
          ? t.title.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q)
          : true
      )
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [tasks, search]);

  const totalCompleted = useMemo(
    () => tasks.filter((t) => t.completed).length,
    [tasks]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Completed Tasks
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 tabular-nums">
            {totalCompleted} completed {totalCompleted === 1 ? 'task' : 'tasks'} — restore any item back to pending at any time.
          </p>
        </div>

        {totalCompleted > 0 && (
          <button
            type="button"
            onClick={onClearCompleted}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-200 dark:hover:border-rose-500/30 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto focus-visible:outline-2 focus-visible:outline-rose-600"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            Clear Completed ({totalCompleted})
          </button>
        )}
      </div>

      {totalCompleted > 0 && (
        <div className="relative max-w-md">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <label htmlFor="completed-search" className="sr-only">
            Search completed tasks
          </label>
          <input
            id="completed-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search completed tasks..."
            className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 pl-10 pr-9 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading completed tasks">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[88px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 animate-pulse"
            >
              <div className="h-4 w-2/5 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="mt-3 h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800/70" />
            </div>
          ))}
        </div>
      ) : completedTasks.length === 0 ? (
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-14 text-center">
          <div className="mx-auto flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            {totalCompleted === 0
              ? 'No completed tasks yet'
              : 'No completed tasks match your search'}
          </h2>
          <p className="mt-1.5 max-w-sm mx-auto text-sm text-slate-500 dark:text-slate-400">
            {totalCompleted === 0
              ? 'Finished tasks appear here so you can review your accomplishments or restore items if needed.'
              : 'Try a different keyword or clear the search filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence initial={false}>
            {completedTasks.map((task) => (
              <TaskRow
                key={task._id}
                task={task}
                busy={busyIds.has(task._id)}
                onToggleComplete={onToggleComplete}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                showRestoreButton
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
