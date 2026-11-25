import type { AlertTiming, Task, TaskNotification, UserSettings } from '../types/task.ts';

// Web Audio API chime generator for zero-asset sound alerts
let audioCtx: AudioContext | null = null;

export function playAlertSound(): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // First chime note: E5 (659.25 Hz)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second chime note: A5 (880 Hz)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.09, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch {
    // Gracefully ignore audio errors (e.g. browser autoplay restriction)
  }
}

// Browser desktop notification helpers
export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export function getBrowserNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return 'denied';
  }
}

export function showBrowserNotification(title: string, options?: NotificationOptions): void {
  if (getBrowserNotificationPermission() === 'granted') {
    try {
      new Notification(title, {
        badge: '/favicon.ico',
        icon: '/favicon.ico',
        ...options,
      });
    } catch {
      // Ignore background or notification errors
    }
  }
}

// Convert alert timing setting into minutes
export function getAlertOffsetMinutes(timing: AlertTiming): number {
  switch (timing) {
    case 'at_due':
      return 0;
    case '15m':
      return 15;
    case '30m':
      return 30;
    case '1h':
      return 60;
    case '1d':
      return 1440;
    case 'never':
    default:
      return -1;
  }
}

export interface TaskAlertCheckResult {
  type: 'due_soon' | 'due_now' | 'overdue';
  message: string;
  dueDate: string;
}

export function checkTaskAlert(
  task: Task,
  settings: UserSettings,
  now = new Date()
): TaskAlertCheckResult | null {
  if (task.completed || !task.dueDate) return null;
  if (settings.notificationsEnabled === false) return null;

  const due = new Date(task.dueDate);
  if (Number.isNaN(due.getTime())) return null;

  const timing: AlertTiming =
    task.reminderTiming && task.reminderTiming !== 'default'
      ? task.reminderTiming
      : settings.alertTiming ?? '15m';

  if (timing === 'never') return null;

  const offsetMinutes = getAlertOffsetMinutes(timing);
  const diffMs = due.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  // Overdue check
  if (diffMs < 0) {
    if (settings.alertOverdue !== false) {
      const overdueMinutes = Math.abs(diffMinutes);
      let overdueLabel = '';
      if (overdueMinutes < 60) {
        overdueLabel = `${overdueMinutes}m ago`;
      } else if (overdueMinutes < 1440) {
        overdueLabel = `${Math.round(overdueMinutes / 60)}h ago`;
      } else {
        overdueLabel = `${Math.round(overdueMinutes / 1440)}d ago`;
      }
      return {
        type: 'overdue',
        message: `Overdue (was due ${overdueLabel})`,
        dueDate: task.dueDate,
      };
    }
    return null;
  }

  // Due right now (within 1 minute)
  if (diffMinutes <= 1 && diffMinutes >= 0) {
    return {
      type: 'due_now',
      message: 'Due right now!',
      dueDate: task.dueDate,
    };
  }

  // Due soon (within configured alert window)
  if (diffMinutes <= offsetMinutes) {
    let dueSoonLabel = '';
    if (diffMinutes < 60) {
      dueSoonLabel = `in ${diffMinutes} min${diffMinutes === 1 ? '' : 's'}`;
    } else if (diffMinutes < 1440) {
      const hours = Math.round(diffMinutes / 60);
      dueSoonLabel = `in ~${hours} hour${hours === 1 ? '' : 's'}`;
    } else {
      const days = Math.round(diffMinutes / 1440);
      dueSoonLabel = `in ${days} day${days === 1 ? '' : 's'}`;
    }
    return {
      type: 'due_soon',
      message: `Due ${dueSoonLabel}`,
      dueDate: task.dueDate,
    };
  }

  return null;
}
