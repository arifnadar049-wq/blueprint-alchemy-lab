import { Task, TaskStatus } from '@/types';

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export const formatDate = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateStr = date.toDateString();
  const todayStr = today.toDateString();
  const yesterdayStr = yesterday.toDateString();
  const tomorrowStr = tomorrow.toDateString();

  if (dateStr === todayStr) return 'Today';
  if (dateStr === yesterdayStr) return 'Yesterday';
  if (dateStr === tomorrowStr) return 'Tomorrow';

  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
  });
};

export const formatDateTime = (date: Date, time?: string): string => {
  let result = formatDate(date);
  if (time) {
    result += ` at ${time}`;
  }
  return result;
};

export const getTaskProgress = (task: Task): number => {
  if (task.subtasks.length === 0) {
    return task.status === TaskStatus.COMPLETED ? 100 : 0;
  }
  const completed = task.subtasks.filter(subtask => subtask.completed).length;
  return Math.round((completed / task.subtasks.length) * 100);
};

export const getTaskStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.TODO:
      return 'hsl(var(--muted-foreground))';
    case TaskStatus.IN_PROGRESS:
      return 'hsl(var(--focus-active))';
    case TaskStatus.COMPLETED:
      return 'hsl(var(--success))';
    default:
      return 'hsl(var(--muted-foreground))';
  }
};

export const isOverdue = (task: Task): boolean => {
  if (!task.dueDate || task.status === TaskStatus.COMPLETED) return false;
  
  const now = new Date();
  const due = new Date(task.dueDate);
  
  if (task.dueTime) {
    const [hours, minutes] = task.dueTime.split(':').map(Number);
    due.setHours(hours, minutes, 0, 0);
  } else {
    due.setHours(23, 59, 59, 999); // End of day if no time specified
  }
  
  return now > due;
};

export const sortTasksByPriority = (tasks: Task[]): Task[] => {
  return tasks.sort((a, b) => {
    // First: overdue tasks
    const aOverdue = isOverdue(a);
    const bOverdue = isOverdue(b);
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    
    // Second: in progress tasks
    if (a.status === TaskStatus.IN_PROGRESS && b.status !== TaskStatus.IN_PROGRESS) return -1;
    if (a.status !== TaskStatus.IN_PROGRESS && b.status === TaskStatus.IN_PROGRESS) return 1;
    
    // Third: due date/time
    if (a.dueDate && b.dueDate) {
      const aDue = new Date(a.dueDate);
      const bDue = new Date(b.dueDate);
      
      if (a.dueTime) {
        const [hours, minutes] = a.dueTime.split(':').map(Number);
        aDue.setHours(hours, minutes);
      }
      if (b.dueTime) {
        const [hours, minutes] = b.dueTime.split(':').map(Number);
        bDue.setHours(hours, minutes);
      }
      
      return aDue.getTime() - bDue.getTime();
    }
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    
    // Finally: creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

export const playNotificationSound = () => {
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmsmBiwAQx8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmsmBg==');
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Ignore audio play errors (user interaction required)
    });
  } catch (error) {
    // Ignore audio errors
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const showNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });
  }
};