import { useEffect, useState, type FormEvent } from 'react';
import {
  Bell,
  Check,
  Clock,
  Loader2,
  Moon,
  ShieldCheck,
  Sun,
  Trash2,
  Volume2,
} from 'lucide-react';
import {
  ALERT_TIMING_OPTIONS,
  DEFAULT_CATEGORIES,
  type AlertTiming,
  type Priority,
  type UserSettings,
} from '../types/task.ts';
import {
  getBrowserNotificationPermission,
  playAlertSound,
  requestBrowserNotificationPermission,
  showBrowserNotification,
} from '../utils/notificationService.ts';

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
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    settings.notificationsEnabled ?? true
  );
  const [alertTiming, setAlertTiming] = useState<AlertTiming>(
    settings.alertTiming ?? '15m'
  );
  const [alertOverdue, setAlertOverdue] = useState(
    settings.alertOverdue ?? true
  );
  const [soundEnabled, setSoundEnabled] = useState(
    settings.soundEnabled ?? true
  );
  const [browserPermission, setBrowserPermission] = useState(
    getBrowserNotificationPermission()
  );
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(settings.displayName);
    setEmail(settings.email);
    setRole(settings.role);
    setDefaultPriority(settings.defaultPriority);
    setDefaultCategory(settings.defaultCategory);
    setNotificationsEnabled(settings.notificationsEnabled ?? true);
    setAlertTiming(settings.alertTiming ?? '15m');
    setAlertOverdue(settings.alertOverdue ?? true);
    setSoundEnabled(settings.soundEnabled ?? true);
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
    setSaveSuccess(false);
    try {
      await onSaveSettings({
        displayName: trimmedName,
        email: email.trim(),
        role: role.trim(),
        defaultPriority,
        defaultCategory: defaultCategory.trim() || 'Work',
        notificationsEnabled,
        alertTiming,
        alertOverdue,
        soundEnabled,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestPermission = async () => {
    const res = await requestBrowserNotificationPermission();
    setBrowserPermission(res);
    if (res === 'granted') {
      showBrowserNotification('TaskFlow Notifications Enabled', {
        body: 'You will receive desktop alerts when tasks are due!',
      });
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

          {/* Notification & Alert Preferences */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Task Alerts & Notifications
              </h3>
            </div>

            {/* Master Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 mb-4">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Enable Task Due Alerts
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Receive in-app alerts and notifications when scheduled tasks are approaching
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {notificationsEnabled && (
              <div className="space-y-4 pl-1">
                {/* When to Alert */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="settings-alert-timing"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Default Alert Timing
                    </label>
                    <select
                      id="settings-alert-timing"
                      value={alertTiming}
                      onChange={(e) => setAlertTiming(e.target.value as AlertTiming)}
                      className="w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {ALERT_TIMING_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      When TaskFlow should notify you before a task is due.
                    </p>
                  </div>

                  {/* Overdue alert toggle */}
                  <div>
                    <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Overdue Reminders
                    </span>
                    <label className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alertOverdue}
                        onChange={(e) => setAlertOverdue(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        Alert when tasks pass due date
                      </span>
                    </label>
                  </div>
                </div>

                {/* Sound and Desktop Notification row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Sound alert */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          Chime Sound
                        </p>
                        <p className="text-[11px] text-slate-500">Play tone on alert</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={playAlertSound}
                        className="px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        Test
                      </button>
                      <input
                        type="checkbox"
                        checked={soundEnabled}
                        onChange={(e) => setSoundEnabled(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                    </div>
                  </div>

                  {/* Desktop Browser Notification */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          Desktop Alerts
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Status:{' '}
                          <span className="font-medium capitalize text-indigo-600 dark:text-indigo-400">
                            {browserPermission}
                          </span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRequestPermission}
                      className="px-2.5 py-1 text-xs font-medium rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                    >
                      {browserPermission === 'granted' ? 'Send Test' : 'Enable'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between">
            {saveSuccess ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                Settings saved successfully!
              </span>
            ) : (
              <span />
            )}
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
