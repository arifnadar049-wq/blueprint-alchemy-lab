import { List, Task, Session, Streak, AppState, TimerSettings, TimerMode } from '@/types';

const STORAGE_KEYS = {
  LISTS: 'grit_lists',
  TASKS: 'grit_tasks', 
  SESSIONS: 'grit_sessions',
  STREAKS: 'grit_streaks',
  APP_STATE: 'grit_app_state',
  TIMER_SETTINGS: 'grit_timer_settings'
};

// Utility functions for local storage
export const storage = {
  // Lists
  getLists: (): List[] => {
    const data = localStorage.getItem(STORAGE_KEYS.LISTS);
    if (!data) return [];
    return JSON.parse(data).map((list: any) => ({
      ...list,
      createdAt: new Date(list.createdAt),
      updatedAt: new Date(list.updatedAt)
    }));
  },

  saveLists: (lists: List[]) => {
    localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(lists));
  },

  // Tasks
  getTasks: (): Task[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!data) return [];
    return JSON.parse(data).map((task: any) => ({
      ...task,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt)
    }));
  },

  saveTasks: (tasks: Task[]) => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  // Sessions
  getSessions: (): Session[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!data) return [];
    return JSON.parse(data).map((session: any) => ({
      ...session,
      startedAt: new Date(session.startedAt),
      endedAt: session.endedAt ? new Date(session.endedAt) : null,
      createdAt: new Date(session.createdAt)
    }));
  },

  saveSessions: (sessions: Session[]) => {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  },

  // App State
  getAppState: (): AppState => {
    const data = localStorage.getItem(STORAGE_KEYS.APP_STATE);
    if (!data) {
      return {
        currentTimer: {
          taskId: null,
          mode: TimerMode.CONTINUOUS,
          startTime: null,
          elapsed: 0,
          isRunning: false,
          isBreak: false,
          pomodoroCount: 0
        },
        selectedListId: null,
        selectedTaskId: null,
        timerSettings: getDefaultTimerSettings()
      };
    }
    const state = JSON.parse(data);
    return {
      ...state,
      currentTimer: {
        ...state.currentTimer,
        startTime: state.currentTimer.startTime ? new Date(state.currentTimer.startTime) : null
      }
    };
  },

  saveAppState: (state: AppState) => {
    localStorage.setItem(STORAGE_KEYS.APP_STATE, JSON.stringify(state));
  },

  // Timer Settings
  getTimerSettings: (): TimerSettings => {
    const data = localStorage.getItem(STORAGE_KEYS.TIMER_SETTINGS);
    if (!data) return getDefaultTimerSettings();
    return JSON.parse(data);
  },

  saveTimerSettings: (settings: TimerSettings) => {
    localStorage.setItem(STORAGE_KEYS.TIMER_SETTINGS, JSON.stringify(settings));
  },

  // Streaks
  getStreaks: (): Streak[] => {
    const data = localStorage.getItem(STORAGE_KEYS.STREAKS);
    if (!data) return [];
    return JSON.parse(data).map((streak: any) => ({
      ...streak,
      date: new Date(streak.date)
    }));
  },

  saveStreaks: (streaks: Streak[]) => {
    localStorage.setItem(STORAGE_KEYS.STREAKS, JSON.stringify(streaks));
  }
};

function getDefaultTimerSettings(): TimerSettings {
  return {
    pomodoroWorkMinutes: 25,
    pomodoroBreakMinutes: 5,
    pomodoroLongBreakMinutes: 15,
    pomodoroLongBreakAfter: 4,
    enableSounds: true,
    enableNotifications: true
  };
}