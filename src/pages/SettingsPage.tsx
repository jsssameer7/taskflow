import { useEffect, useState, type FormEvent } from 'react';
import { Check, Loader2, Moon, Sun, Trash2 } from 'lucide-react';
import {
  DEFAULT_CATEGORIES,
  type Priority,
  type UserSettings,
} from '../types/task.ts';

interface SettingsPageProps {
  theme: 'light' | 'dark';
  onSetTheme: (theme: 'light' | 'dark') => void;
  settings: UserSettings;
  completedCount: number;
  onSaveSettings: (input: Omit<UserSettings, 'updatedAt'>) => Promise<void>;
  onClearCompleted: () => void;
}

export function SettingsPage({
  theme,
  onSetTheme,
  settings,
  completedCount,
  onSaveSettings,
  onClearCompleted,
}: SettingsPageProps) {
  const [displayName, setDisplayName] = useState(settings.displayName);
  const [email, setEmail] = useState(settings.email);
  const [role, setRole] = useState(settings.role);
  const [defaultPriority, setDefaultPriority] = useState<Priority>(settings.defaultPriority);
  const [defaultCategory, setDefaultCategory] = useState(settings.defaultCategory);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(settings.displayName);
    setEmail(settings.email);
    setRole(settings.role);
    setDefaultPriority(settings.defaultPriority);
    setDefaultCategory(settings.defaultCategory);
  }, [settings]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError('Display name is required.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSaveSettings({
        displayName: trimmedName,
        email: email.trim(),
        role: role.trim(),
        defaultPriority,
        defaultCategory: defaultCategory.trim() || 'Work',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Customize workspace appearance, profile details, and default task behavior.
        </p>
      </div>

      {/* Appearance */}
      <section className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
          Appearance
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Choose between light and dark color themes.
        </p>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onSetTheme('light')}
            aria-pressed={theme === 'light'}
            className={`flex items-center justify-between gap-3 p-4 rounded-xl border text-left transition-colors focus-visible:outline-2 focus-visible:outline-indigo-600 ${
              theme === 'light'
                ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-500/10'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <Sun className="w-5 h-5 text-amber-500 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Light Mode
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Crisp bright surfaces for daytime focus
                </p>
              </div>
            </div>
            {theme === 'light' && (
              <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onSetTheme('dark')}
            aria-pressed={theme === 'dark'}
            className={`flex items-center justify-between gap-3 p-4 rounded-xl border text-left transition-colors focus-visible:outline-2 focus-visible:outline-indigo-600 ${
              theme === 'dark'
                ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-500/10'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Dark Mode
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Low-glare deep slate palette
                </p>
              </div>
            </div>
            {theme === 'dark' && (
              <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            )}
          </button>
        </div>
      </section>

      {/* Profile & Task Defaults */}
      <section className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
          Profile & Defaults
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Update your profile information and default settings for newly created tasks.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 px-3.5 py-2.5 text-sm text-rose-700 dark:text-rose-300"
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="settings-name"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Display Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="settings-name"
                type="text"
                required
                maxLength={80}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="settings-email"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Email Address
              </label>
              <input
                id="settings-email"
                type="email"
                maxLength={120}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="settings-role"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Role / Title
              </label>
              <input
                id="settings-role"
                type="text"
                maxLength={80}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g., Software Engineer"
                className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="settings-priority"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Default Priority
              </label>
              <select
                id="settings-priority"
                value={defaultPriority}
                onChange={(e) => setDefaultPriority(e.target.value as Priority)}
                className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="settings-category"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Default Category
              </label>
              <input
                id="settings-category"
                type="text"
                list="settings-category-list"
                maxLength={60}
                value={defaultCategory}
                onChange={(e) => setDefaultCategory(e.target.value)}
                className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <datalist id="settings-category-list">
                {DEFAULT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              Save Changes
            </button>
          </div>
        </form>
      </section>

      {/* Task Data Management */}
      <section className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
              Clear Completed Tasks
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 tabular-nums">
              {completedCount === 0
                ? 'There are currently no completed tasks to remove.'
                : `Permanently delete ${completedCount} completed ${
                    completedCount === 1 ? 'task' : 'tasks'
                  } from your workspace.`}
            </p>
          </div>

          <button
            type="button"
            onClick={onClearCompleted}
            disabled={completedCount === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10 disabled:opacity-45 disabled:pointer-events-none transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-rose-600"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            Clear Completed
          </button>
        </div>
      </section>
    </div>
  );
}
