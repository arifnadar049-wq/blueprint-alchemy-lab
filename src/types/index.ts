export interface List {
  id: string;
  name: string;
  color: string;
  icon: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  listId: string;
  title: string;
  notes: string;
  estimateMinutes: number | null;
  dueDate: Date | null;
  dueTime: string | null;
  status: TaskStatus;
  recurrenceRule: string | null;
  parentRecurringId: string | null;
  subtasks: Subtask[];
  priority: number; // 1-5, 1 = highest
  completedAt: Date | null;
  archived: boolean;
  orderIndex: number;
  tags: Tag[];
  dependencies: TaskDependency[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export interface Session {
  id: string;
  taskId: string;
  mode: TimerMode;
  startedAt: Date;
  endedAt: Date | null;
  workSeconds: number;
  breakSeconds: number;
  createdAt: Date;
}

export enum TimerMode {
  CONTINUOUS = 'continuous',
  COUNTDOWN = 'countdown',
  POMODORO = 'pomodoro'
}

export interface TimerSettings {
  pomodoroWorkMinutes: number;
  pomodoroBreakMinutes: number;
  pomodoroLongBreakMinutes: number;
  pomodoroLongBreakAfter: number;
  enableSounds: boolean;
  enableNotifications: boolean;
}

export interface Streak {
  id: string;
  date: Date;
  tasksCompleted: number;
}

export interface AppState {
  currentTimer: {
    taskId: string | null;
    mode: TimerMode;
    startTime: Date | null;
    elapsed: number;
    isRunning: boolean;
    isBreak: boolean;
    pomodoroCount: number;
  };
  selectedListId: string | null;
  selectedTaskId: string | null;
  timerSettings: TimerSettings;
}

export interface DailyStats {
  date: Date;
  tasksCompleted: number;
  totalMinutes: number;
  averageTaskMinutes: number;
  punctualityPercent: number;
}

export interface ReportData {
  dailyStats: DailyStats[];
  timeByList: { listName: string; minutes: number; color: string }[];
  productiveHours: { hour: number; tasks: number }[];
  streakData: Streak[];
}

// New interfaces for enhanced features
export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependsOnTask?: Task;
  createdAt: Date;
}

export interface DailyProductivity {
  id: string;
  date: Date;
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  tasksCompleted: number;
  pomodoroSessions: number;
  productivityScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BulkAction {
  type: 'complete' | 'delete' | 'move' | 'archive' | 'prioritize';
  taskIds: string[];
  data?: any; // For move (listId), prioritize (priority), etc.
}

export interface ProductivityMetrics {
  dailyAverage: number;
  weeklyTotal: number;
  monthlyTotal: number;
  completionRate: number;
  estimateAccuracy: number;
  focusEfficiency: number;
}

export enum TaskPriority {
  URGENT = 1,
  HIGH = 2,
  MEDIUM = 3,
  LOW = 4,
  LOWEST = 5
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every X days/weeks/months/years
  daysOfWeek?: number[]; // 0-6, Sunday = 0
  endDate?: Date;
  count?: number; // Number of occurrences
}

export interface UndoRedoState {
  undoStack: UndoRedoAction[];
  redoStack: UndoRedoAction[];
}

export interface UndoRedoAction {
  type: 'create' | 'update' | 'delete' | 'bulk';
  entity: 'task' | 'list' | 'tag';
  data: any;
  timestamp: Date;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekly';
  targetCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  completedAt: Date;
  date: Date;
  createdAt: Date;
}