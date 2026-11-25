import { useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  ArrowDownUp,
  ListTodo,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type {
  Priority,
  SortField,
  SortOrder,
  Task,
  TaskStatusFilter,
} from '../types/task.ts';
import { isOverdue, sortTaskList } from '../utils/taskHelpers.ts';
import { TaskRow } from '../components/TaskRow.tsx';

interface AllTasksPageProps {
  tasks: Task[];
  loading: boolean;
  busyIds: Set<string>;
  searchQuery: string;
  statusFilter: TaskStatusFilter;
  priorityFilter: Priority | 'all';
  sortBy: SortField;
  sortOrder: SortOrder;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: TaskStatusFilter) => void;
  onPriorityFilterChange: (value: Priority | 'all') => void;
  onSortByChange: (value: SortField) => void;
  onSortOrderToggle: () => void;
  onResetFilters: () => void;
  onOpenNewTaskModal: () => void;
  onToggleComplete: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onClearCompleted: () => void;
}

const STATUS_TABS: Array<{ id: TaskStatusFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'completed', label: 'Completed' },
  { id: 'overdue', label: 'Overdue' },
];

export function AllTasksPage({
  tasks,
  loading,
  busyIds,
  searchQuery,
  statusFilter,
  priorityFilter,
  sortBy,
  sortOrder,
  onSearchChange,
  onStatusFilterChange,
  onPriorityFilterChange,
  onSortByChange,
  onSortOrderToggle,
  onResetFilters,
  onOpenNewTaskModal,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onClearCompleted,
}: AllTasksPageProps) {
  const completedCount = useMemo(
    () => tasks.filter((t) => t.completed).length,
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matched = tasks.filter((task) => {
      if (query) {
        const inTitle = task.title.toLowerCase().includes(query);
        const inDesc = task.description.toLowerCase().includes(query);
        const inCat = task.category.toLowerCase().includes(query);
        if (!inTitle && !inDesc && !inCat) return false;
      }
      if (statusFilter === 'pending' && task.completed) return false;
      if (statusFilter === 'completed' && !task.completed) return false;
      if (statusFilter === 'overdue' && !isOverdue(task)) return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      return true;
    });
    return sortTaskList(matched, sortBy, sortOrder);
  }, [tasks, searchQuery, statusFilter, priorityFilter, sortBy, sortOrder]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            All Tasks
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 tabular-nums">
            Showing {filteredTasks.length} of {tasks.length}{' '}
            {tasks.length === 1 ? 'task' : 'tasks'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {completedCount > 0 && (
            <button
              type="button"
              onClick={onClearCompleted}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-200 dark:hover:border-rose-500/30 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-rose-600"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              Clear Completed ({completedCount})
            </button>
          )}
        </div>
      </div>

      {/* Filter & search toolbar */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <label htmlFor="tasks-search" className="sr-only">
              Search tasks by title
            </label>
            <input
              id="tasks-search"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tasks by title, description, or category..."
              className="w-full rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-10 pr-9 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Priority filter + Sort controls */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            <label htmlFor="priority-filter" className="sr-only">
              Filter by priority
            </label>
            <select
              id="priority-filter"
              value={priorityFilter}
              onChange={(e) => onPriorityFilterChange(e.target.value as Priority | 'all')}
              className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            <label htmlFor="sort-by" className="sr-only">
              Sort tasks by
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as SortField)}
              className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="createdAt">Sort: Created Date</option>
              <option value="dueDate">Sort: Due Date</option>
              <option value="priority">Sort: Priority</option>
            </select>

            <button
              type="button"
              onClick={onSortOrderToggle}
              title={`Order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-indigo-600"
            >
              <ArrowDownUp className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{sortOrder === 'asc' ? 'Asc' : 'Desc'}</span>
            </button>
          </div>
        </div>

        {/* Status segmented filter tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div
            role="tablist"
            aria-label="Filter by task status"
            className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 overflow-x-auto max-w-full"
          >
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onStatusFilterChange(tab.id)}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-indigo-600 ${
                    active
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Task list */}
      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading tasks">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[88px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 animate-pulse"
            >
              <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="mt-3 h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800/70" />
            </div>
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-14 text-center">
          <div className="mx-auto flex items-center justify-center w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            <ListTodo className="w-5 h-5" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            {tasks.length === 0 ? 'Your task list is empty' : 'No matching tasks found'}
          </h2>
          <p className="mt-1.5 max-w-sm mx-auto text-sm text-slate-500 dark:text-slate-400">
            {tasks.length === 0
              ? 'Add a task to organize your priorities, categories, and upcoming deadlines.'
              : 'Try adjusting your search query, status filter, or priority selection.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={onResetFilters}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
              >
                Reset Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenNewTaskModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                Create Task
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence initial={false}>
            {filteredTasks.map((task) => (
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
    </div>
  );
}
