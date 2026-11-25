import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ListChecks,
  Loader2,
  Plus,
} from 'lucide-react';
import type {
  CreateTaskInput,
  PageRoute,
  Task,
  TaskStatusFilter,
  UserSettings,
} from '../types/task.ts';
import {
  getGreeting,
  getTodayHeadingDate,
  type TaskStats,
} from '../utils/taskHelpers.ts';
import { TaskRow } from '../components/TaskRow.tsx';

interface DashboardPageProps {
  tasks: Task[];
  stats: TaskStats;
  loading: boolean;
  busyIds: Set<string>;
  settings: UserSettings;
  onQuickCreate: (input: CreateTaskInput) => Promise<void>;
  onOpenNewTaskModal: () => void;
  onToggleComplete: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onNavigateFiltered: (page: PageRoute, status?: TaskStatusFilter) => void;
}

export function DashboardPage({
  tasks,
  stats,
  loading,
  busyIds,
  settings,
  onQuickCreate,
  onOpenNewTaskModal,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onNavigateFiltered,
}: DashboardPageProps) {
  const [quickTitle, setQuickTitle] = useState('');
  const [quickError, setQuickError] = useState<string | null>(null);
  const [quickSaving, setQuickSaving] = useState(false);

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const firstName = settings.displayName.trim().split(/\s+/)[0] || 'there';

  const handleQuickAdd = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = quickTitle.trim();
    if (!trimmed) {
      setQuickError('Enter a task title to add it.');
      return;
    }
    setQuickError(null);
    setQuickSaving(true);
    try {
      await onQuickCreate({
        title: trimmed,
        description: '',
        priority: settings.defaultPriority,
        category: settings.defaultCategory || 'Work',
        dueDate: null,
      });
      setQuickTitle('');
    } catch (err) {
      setQuickError(err instanceof Error ? err.message : 'Could not create task.');
    } finally {
      setQuickSaving(false);
    }
  };

  const summaryCards: Array<{
    label: string;
    value: number;
    helper: string;
    icon: typeof ListChecks;
    iconTone: string;
    onClick: () => void;
  }> = [
    {
      label: 'Total Tasks',
      value: stats.total,
      helper: 'All workspace items',
      icon: ListChecks,
      iconTone: 'text-indigo-600 dark:text-indigo-400',
      onClick: () => onNavigateFiltered('tasks', 'all'),
    },
    {
      label: 'Pending',
      value: stats.pending,
      helper: 'Active in progress',
      icon: Clock,
      iconTone: 'text-amber-600 dark:text-amber-400',
      onClick: () => onNavigateFiltered('tasks', 'pending'),
    },
    {
      label: 'Completed',
      value: stats.completed,
      helper: 'Finished tasks',
      icon: CheckCircle2,
      iconTone: 'text-emerald-600 dark:text-emerald-400',
      onClick: () => onNavigateFiltered('completed'),
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      helper: stats.overdue > 0 ? 'Needs attention' : 'All caught up',
      icon: AlertCircle,
      iconTone:
        stats.overdue > 0
          ? 'text-rose-600 dark:text-rose-400'
          : 'text-slate-400 dark:text-slate-500',
      onClick: () => onNavigateFiltered('tasks', 'overdue'),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {getTodayHeadingDate()}
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 text-balance">
            {getGreeting()}, {firstName}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
            {stats.pending === 0
              ? 'Your schedule is clear. Add a task to plan your next step.'
              : `You have ${stats.pending} pending ${stats.pending === 1 ? 'task' : 'tasks'}${
                  stats.overdue > 0 ? ` and ${stats.overdue} overdue` : ''
                }.`}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewTaskModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-sm shadow-indigo-600/20 transition-all whitespace-nowrap shrink-0 self-start sm:self-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Quick Add Task
        </button>
      </section>

      {/* 4 Summary KPI cards */}
      <section aria-label="Task summary metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={card.onClick}
              className="group text-left rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 transition-colors hover:border-indigo-300 dark:hover:border-indigo-500/40 focus-visible:outline-2 focus-visible:outline-indigo-600"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {card.label}
                </span>
                <Icon className={`w-4 h-4 shrink-0 ${card.iconTone}`} aria-hidden="true" />
              </div>
              <p className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 tabular-nums">
                {loading ? '—' : card.value}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {card.helper}
              </p>
            </button>
          );
        })}
      </section>

      {/* Task completion progress */}
      <section
        aria-label="Task completion progress"
        className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
              Completion Progress
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {stats.completed} of {stats.total} {stats.total === 1 ? 'task' : 'tasks'} completed
            </p>
          </div>
          <span className="font-mono text-2xl font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
            {stats.completionRate}%
          </span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={stats.completionRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Overall task completion percentage"
          className="mt-4 h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
        >
          <motion.div
            initial={false}
            animate={{ scaleX: stats.completionRate / 100 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'left center' }}
            className="h-full w-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500"
          />
        </div>
      </section>

      {/* Inline quick task composer */}
      <section aria-label="Quick capture">
        <form onSubmit={handleQuickAdd} noValidate>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <label htmlFor="quick-task-input" className="sr-only">
                Add a task quickly
              </label>
              <input
                id="quick-task-input"
                type="text"
                maxLength={200}
                value={quickTitle}
                onChange={(e) => {
                  setQuickTitle(e.target.value);
                  if (quickError) setQuickError(null);
                }}
                placeholder="Quickly add a task and press Enter..."
                className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={quickSaving}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-indigo-600"
            >
              {quickSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="w-4 h-4" aria-hidden="true" />
              )}
              Add Task
            </button>
          </div>
          {quickError && (
            <p role="alert" className="mt-2 text-xs text-rose-600 dark:text-rose-400">
              {quickError}
            </p>
          )}
        </form>
      </section>

      {/* Recent tasks */}
      <section aria-label="Recent tasks" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
            Recent Tasks
          </h2>
          {tasks.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigateFiltered('tasks', 'all')}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-indigo-600 rounded-md"
            >
              View all tasks
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading recent tasks">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[88px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 animate-pulse"
              >
                <div className="h-4 w-2/5 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="mt-3 h-3 w-3/5 rounded bg-slate-100 dark:bg-slate-800/70" />
              </div>
            ))}
          </div>
        ) : recentTasks.length === 0 ? (
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-12 text-center">
            <div className="mx-auto flex items-center justify-center w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
              <ListChecks className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              No tasks yet
            </h3>
            <p className="mt-1.5 max-w-sm mx-auto text-sm text-slate-500 dark:text-slate-400">
              Create your first task with a priority, due date, and category to start tracking your progress.
            </p>
            <button
              type="button"
              onClick={onOpenNewTaskModal}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Create First Task
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence initial={false}>
              {recentTasks.map((task) => (
                <TaskRow
                  key={task._id}
                  task={task}
                  busy={busyIds.has(task._id)}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}
