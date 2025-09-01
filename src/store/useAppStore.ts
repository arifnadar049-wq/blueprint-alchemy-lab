import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { List, Task, Session, AppState, TimerMode, TaskStatus } from '@/types';
import { supabaseStorage } from '@/utils/supabaseStorage';
import { generateId, playNotificationSound, showNotification } from '@/utils/helpers';

interface AppStore {
  // State
  lists: List[];
  tasks: Task[];
  sessions: Session[];
  appState: AppState;
  selectedListId: string | null;
  selectedTask: Task | null;
  currentTimer: AppState['currentTimer'];
  
  // Timer Actions
  startTimer: (taskId: string, mode: TimerMode) => void;
  pauseTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  updateTimerElapsed: (elapsed: number) => void;
  
  // List Actions
  setSelectedListId: (listId: string | null) => void;
    createList: (name: string, color: string, icon: string) => Promise<void>;
    updateList: (id: string, updates: Partial<List>) => Promise<void>;
    deleteList: (id: string) => Promise<void>;
  
  // Task Actions  
  setSelectedTask: (task: Task | null) => void;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  moveTask: (id: string, listId: string) => Promise<void>;
  
  // Session Actions
  createSession: (session: Omit<Session, 'id' | 'createdAt'>) => Promise<void>;
  
  // Initialization
  initializeStore: () => Promise<void>;
}

let timerInterval: NodeJS.Timeout | null = null;

export const useAppStore = create<AppStore>()(
  devtools((set, get) => ({
    // Initial State
    lists: [],
    tasks: [],
    sessions: [],
    appState: {
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
      timerSettings: supabaseStorage.getTimerSettings()
    },
    selectedListId: null,
    selectedTask: null,
    currentTimer: {
      taskId: null,
      mode: TimerMode.CONTINUOUS,
      startTime: null,
      elapsed: 0,
      isRunning: false,
      isBreak: false,
      pomodoroCount: 0
    },

    // Timer Actions
    startTimer: (taskId: string, mode: TimerMode) => {
      const state = get();
      const startTime = new Date();
      
      set((state) => ({
        currentTimer: {
          ...state.currentTimer,
          taskId,
          mode,
          startTime,
          isRunning: true
        }
      }));

      // Update task status to in progress
      get().updateTask(taskId, { status: TaskStatus.IN_PROGRESS });

      // Start timer interval
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        get().updateTimerElapsed(elapsed);
      }, 1000);

      // Play notification sound
      if (state.appState.timerSettings.enableSounds) {
        playNotificationSound();
      }

      // Show notification
      if (state.appState.timerSettings.enableNotifications) {
        const task = state.tasks.find(t => t.id === taskId);
        showNotification(`Started timer for: ${task?.title || 'Unknown task'}`);
      }
    },

    pauseTimer: () => {
      set((state) => ({
        currentTimer: {
          ...state.currentTimer,
          isRunning: false
        }
      }));

      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    },

    stopTimer: () => {
      const state = get();
      
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }

      // Create session record
      if (state.currentTimer.taskId && state.currentTimer.startTime) {
        get().createSession({
          taskId: state.currentTimer.taskId,
          mode: state.currentTimer.mode,
          startedAt: state.currentTimer.startTime,
          endedAt: new Date(),
          workSeconds: state.currentTimer.elapsed,
          breakSeconds: 0
        });
      }

      set((state) => ({
        currentTimer: {
          taskId: null,
          mode: TimerMode.CONTINUOUS,
          startTime: null,
          elapsed: 0,
          isRunning: false,
          isBreak: false,
          pomodoroCount: 0
        }
      }));
    },

    resetTimer: () => {
      set((state) => ({
        currentTimer: {
          ...state.currentTimer,
          elapsed: 0,
          startTime: state.currentTimer.isRunning ? new Date() : null
        }
      }));
    },

    updateTimerElapsed: (elapsed: number) => {
      set((state) => ({
        currentTimer: {
          ...state.currentTimer,
          elapsed
        }
      }));
    },

    // List Actions
    setSelectedListId: (listId: string | null) => {
      set({ selectedListId: listId });
    },

    createList: async (name: string, color: string, icon: string) => {
      const listData = {
        name,
        color,
        icon,
        order: get().lists.length
      };

      const newList = await supabaseStorage.saveList(listData);
      if (newList) {
        set((state) => ({
          lists: [...state.lists, newList]
        }));
      }
    },

    updateList: async (id: string, updates: Partial<List>) => {
      const updatedList = await supabaseStorage.updateList(id, updates);
      if (updatedList) {
        set((state) => ({
          lists: state.lists.map(list =>
            list.id === id ? updatedList : list
          )
        }));
      }
    },

    deleteList: async (id: string) => {
      const success = await supabaseStorage.deleteList(id);
      if (success) {
        set((state) => ({
          lists: state.lists.filter(list => list.id !== id),
          tasks: state.tasks.filter(task => task.listId !== id)
        }));
      }
    },

    // Task Actions
    setSelectedTask: (task: Task | null) => {
      set({ selectedTask: task });
    },

    createTask: async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newTask = await supabaseStorage.saveTask(taskData);
      if (newTask) {
        set((state) => ({
          tasks: [...state.tasks, newTask]
        }));
      }
    },

    updateTask: async (id: string, updates: Partial<Task>) => {
      const updatedTask = await supabaseStorage.updateTask(id, updates);
      if (updatedTask) {
        set((state) => ({
          tasks: state.tasks.map(task =>
            task.id === id ? updatedTask : task
          )
        }));
      }
    },

    deleteTask: async (id: string) => {
      const success = await supabaseStorage.deleteTask(id);
      if (success) {
        set((state) => ({
          tasks: state.tasks.filter(task => task.id !== id),
          selectedTask: state.selectedTask?.id === id ? null : state.selectedTask
        }));
      }
    },

    completeTask: async (id: string) => {
      await get().updateTask(id, { status: TaskStatus.COMPLETED });

      // Move completed task to completed list
      const completedList = get().lists.find(list => list.name === 'Completed');
      if (completedList) {
        await get().moveTask(id, completedList.id);
      }
    },

    moveTask: async (id: string, listId: string) => {
      await get().updateTask(id, { listId });
    },

    // Session Actions
    createSession: async (sessionData: Omit<Session, 'id' | 'createdAt'>) => {
      const newSession = await supabaseStorage.saveSession(sessionData);
      if (newSession) {
        set((state) => ({
          sessions: [...state.sessions, newSession]
        }));
      }
    },

    // Initialization
    initializeStore: async () => {
      try {
        const [lists, tasks, sessions] = await Promise.all([
          supabaseStorage.getLists(),
          supabaseStorage.getTasks(),
          supabaseStorage.getSessions()
        ]);

        set({
          lists,
          tasks,
          sessions,
          selectedListId: 'backlog', // Default to backlog view
          currentTimer: {
            taskId: null,
            mode: TimerMode.CONTINUOUS,
            startTime: null,
            elapsed: 0,
            isRunning: false,
            isBreak: false,
            pomodoroCount: 0
          }
        });
      } catch (error) {
        console.error('Error initializing store:', error);
      }
    }
  }))
);