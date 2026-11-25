import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Calendar, Flag, Loader2, X } from 'lucide-react';
import {
  DEFAULT_CATEGORIES,
  type CreateTaskInput,
  type Priority,
  type Task,
  type UpdateTaskInput,
} from '../types/task.ts';
import { fromDateInputValue, toDateInputValue } from '../utils/taskHelpers.ts';

interface TaskModalProps {
  open: boolean;
  editingTask: Task | null;
  defaultPriority: Priority;
  defaultCategory: string;
  onClose: () => void;
  onSubmit: (payload: CreateTaskInput | UpdateTaskInput, taskId?: string) => Promise<void>;
}

const PRIORITY_OPTIONS: Array<{ value: Priority; label: string; activeClass: string }> = [
  {
    value: 'low',
    label: 'Low',
    activeClass:
      'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900',
  },
  {
    value: 'medium',
    label: 'Medium',
    activeClass:
      'bg-amber-600 text-white dark:bg-amber-500 dark:text-slate-950',
  },
  {
    value: 'high',
    label: 'High',
    activeClass:
      'bg-rose-600 text-white dark:bg-rose-500 dark:text-white',
  },
];

function offsetDateInput(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toDateInputValue(d.toISOString());
}

export function TaskModal({
  open,
  editingTask,
  defaultPriority,
  defaultCategory,
  onClose,
  onSubmit,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(defaultPriority);
  const [category, setCategory] = useState(defaultCategory);
  const [dueDateInput, setDueDateInput] = useState('');
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description);
      setPriority(editingTask.priority);
      setCategory(editingTask.category);
      setDueDateInput(toDateInputValue(editingTask.dueDate));
      setCompleted(editingTask.completed);
    } else {
      setTitle('');
      setDescription('');
      setPriority(defaultPriority);
      setCategory(defaultCategory || 'Work');
      setDueDateInput('');
      setCompleted(false);
    }
    setError(null);
    const timer = window.setTimeout(() => {
      titleInputRef.current?.focus();
    }, 50);
    return () => window.clearTimeout(timer);
  }, [open, editingTask, defaultPriority, defaultCategory]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, submitting, onClose]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please enter a task title before saving.');
      titleInputRef.current?.focus();
      return;
    }
    if (trimmedTitle.length > 200) {
      setError('Task title cannot exceed 200 characters.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        title: trimmedTitle,
        description: description.trim(),
        priority,
        category: category.trim() || 'General',
        dueDate: fromDateInputValue(dueDateInput),
        ...(editingTask ? { completed } : {}),
      };
      await onSubmit(payload, editingTask?._id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save task.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-modal-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={() => !submitting && onClose()}
            className="fixed inset-0 bg-slate-950/55 backdrop-blur-[2px]"
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-900/15 dark:shadow-black/50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2
                id="task-modal-title"
                className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50"
              >
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                aria-label="Close modal"
                className="p-2 -mr-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-2 focus-visible:outline-indigo-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">
              {error && (
                <div
                  role="alert"
                  className="rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 px-3.5 py-2.5 text-sm text-rose-700 dark:text-rose-300"
                >
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="task-title"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={titleInputRef}
                  id="task-title"
                  type="text"
                  required
                  maxLength={200}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g., Prepare Q4 product roadmap presentation"
                  className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="task-description"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Description
                </label>
                <textarea
                  id="task-description"
                  rows={3}
                  maxLength={2000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add notes, links, or acceptance criteria..."
                  className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none"
                />
              </div>

              {/* Priority */}
              <div>
                <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  <Flag className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  Priority
                </span>
                <div className="grid grid-cols-3 gap-2 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80">
                  {PRIORITY_OPTIONS.map((option) => {
                    const active = priority === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPriority(option.value)}
                        aria-pressed={active}
                        className={`py-2 px-3 rounded-md text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-indigo-600 ${
                          active
                            ? `${option.activeClass} shadow-xs`
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Due date & Category side-by-side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="task-due-date"
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                    Due Date
                  </label>
                  <input
                    id="task-due-date"
                    type="date"
                    value={dueDateInput}
                    onChange={(e) => setDueDateInput(e.target.value)}
                    className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 tabular-nums focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                  />
                  <div className="mt-1.5 flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setDueDateInput(offsetDateInput(0))}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap"
                    >
                      Today
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <button
                      type="button"
                      onClick={() => setDueDateInput(offsetDateInput(1))}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap"
                    >
                      Tomorrow
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <button
                      type="button"
                      onClick={() => setDueDateInput(offsetDateInput(7))}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap"
                    >
                      Next week
                    </button>
                    {dueDateInput && (
                      <>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <button
                          type="button"
                          onClick={() => setDueDateInput('')}
                          className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:underline whitespace-nowrap"
                        >
                          Clear
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="task-category"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Category
                  </label>
                  <input
                    id="task-category"
                    type="text"
                    list="taskflow-categories"
                    maxLength={60}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Work, Personal, Design..."
                    className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                  />
                  <datalist id="taskflow-categories">
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>

              {editingTask && (
                <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={completed}
                    onChange={(e) => setCompleted(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Mark this task as completed
                  </span>
                </label>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-indigo-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 shadow-sm shadow-indigo-600/20 transition-all whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
