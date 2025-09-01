import { supabase } from '@/integrations/supabase/client';
import { List, Task, Session, Streak, TimerSettings, TimerMode, TaskStatus, Subtask } from '@/types';

// Utility functions for Supabase storage
export const supabaseStorage = {
  // Lists
  getLists: async (): Promise<List[]> => {
    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .order('order', { ascending: true });
    
    if (error) {
      console.error('Error fetching lists:', error);
      return [];
    }
    
    return data.map(list => ({
      ...list,
      createdAt: new Date(list.created_at),
      updatedAt: new Date(list.updated_at)
    }));
  },

  saveList: async (list: Omit<List, 'id' | 'createdAt' | 'updatedAt'>): Promise<List | null> => {
    const { data, error } = await supabase
      .from('lists')
      .insert([{
        name: list.name,
        color: list.color,
        icon: list.icon,
        order: list.order
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating list:', error);
      return null;
    }

    return {
      ...data,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  updateList: async (id: string, updates: Partial<List>): Promise<List | null> => {
    const { data, error } = await supabase
      .from('lists')
      .update({
        name: updates.name,
        color: updates.color,
        icon: updates.icon,
        order: updates.order
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating list:', error);
      return null;
    }

    return {
      ...data,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  deleteList: async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('lists')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting list:', error);
      return false;
    }

    return true;
  },

  // Tasks
  getTasks: async (): Promise<Task[]> => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }

    return data.map(task => ({
      id: task.id,
      listId: task.list_id,
      title: task.title,
      notes: task.notes || '',
      estimateMinutes: task.estimate_minutes,
      dueDate: task.due_date ? new Date(task.due_date) : null,
      dueTime: task.due_time,
      status: task.status as TaskStatus,
      recurrenceRule: task.recurrence_rule,
      parentRecurringId: task.parent_recurring_id,
      subtasks: (task.subtasks as unknown as Subtask[]) || [],
      priority: task.priority || 3,
      completedAt: task.completed_at ? new Date(task.completed_at) : null,
      archived: task.archived || false,
      orderIndex: task.order_index || 0,
      tags: [], // Will be populated by joins later
      dependencies: [], // Will be populated by joins later
      createdAt: new Date(task.created_at),
      updatedAt: new Date(task.updated_at)
    }));
  },

  saveTask: async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task | null> => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        list_id: task.listId,
        title: task.title,
        notes: task.notes,
        estimate_minutes: task.estimateMinutes,
        due_date: task.dueDate?.toISOString().split('T')[0] || null,
        due_time: task.dueTime,
        status: task.status,
        recurrence_rule: task.recurrenceRule,
        parent_recurring_id: task.parentRecurringId,
        subtasks: JSON.parse(JSON.stringify(task.subtasks)),
        priority: task.priority,
        archived: task.archived,
        order_index: task.orderIndex
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return null;
    }

    return {
      id: data.id,
      listId: data.list_id,
      title: data.title,
      notes: data.notes || '',
      estimateMinutes: data.estimate_minutes,
      dueDate: data.due_date ? new Date(data.due_date) : null,
      dueTime: data.due_time,
      status: data.status as TaskStatus,
      recurrenceRule: data.recurrence_rule,
      parentRecurringId: data.parent_recurring_id,
      subtasks: (data.subtasks as unknown as Subtask[]) || [],
      priority: data.priority || 3,
      completedAt: data.completed_at ? new Date(data.completed_at) : null,
      archived: data.archived || false,
      orderIndex: data.order_index || 0,
      tags: [], // Will be populated by joins later
      dependencies: [], // Will be populated by joins later
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  updateTask: async (id: string, updates: Partial<Task>): Promise<Task | null> => {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        list_id: updates.listId,
        title: updates.title,
        notes: updates.notes,
        estimate_minutes: updates.estimateMinutes,
        due_date: updates.dueDate?.toISOString().split('T')[0] || null,
        due_time: updates.dueTime,
        status: updates.status,
        recurrence_rule: updates.recurrenceRule,
        parent_recurring_id: updates.parentRecurringId,
        subtasks: updates.subtasks ? JSON.parse(JSON.stringify(updates.subtasks)) : undefined,
        priority: updates.priority,
        archived: updates.archived,
        order_index: updates.orderIndex
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return null;
    }

    return {
      id: data.id,
      listId: data.list_id,
      title: data.title,
      notes: data.notes || '',
      estimateMinutes: data.estimate_minutes,
      dueDate: data.due_date ? new Date(data.due_date) : null,
      dueTime: data.due_time,
      status: data.status as TaskStatus,
      recurrenceRule: data.recurrence_rule,
      parentRecurringId: data.parent_recurring_id,
      subtasks: (data.subtasks as unknown as Subtask[]) || [],
      priority: data.priority || 3,
      completedAt: data.completed_at ? new Date(data.completed_at) : null,
      archived: data.archived || false,
      orderIndex: data.order_index || 0,
      tags: [], // Will be populated by joins later
      dependencies: [], // Will be populated by joins later
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  deleteTask: async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      return false;
    }

    return true;
  },

  // Sessions
  getSessions: async (): Promise<Session[]> => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }

    return data.map(session => ({
      id: session.id,
      taskId: session.task_id,
      mode: session.mode as TimerMode,
      startedAt: new Date(session.started_at),
      endedAt: session.ended_at ? new Date(session.ended_at) : null,
      workSeconds: session.work_seconds,
      breakSeconds: session.break_seconds,
      createdAt: new Date(session.created_at)
    }));
  },

  saveSession: async (session: Omit<Session, 'id' | 'createdAt'>): Promise<Session | null> => {
    const { data, error } = await supabase
      .from('sessions')
      .insert([{
        task_id: session.taskId,
        mode: session.mode,
        started_at: session.startedAt.toISOString(),
        ended_at: session.endedAt?.toISOString() || null,
        work_seconds: session.workSeconds,
        break_seconds: session.breakSeconds
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return null;
    }

    return {
      id: data.id,
      taskId: data.task_id,
      mode: data.mode as TimerMode,
      startedAt: new Date(data.started_at),
      endedAt: data.ended_at ? new Date(data.ended_at) : null,
      workSeconds: data.work_seconds,
      breakSeconds: data.break_seconds,
      createdAt: new Date(data.created_at)
    };
  },

  // Streaks
  getStreaks: async (): Promise<Streak[]> => {
    const { data, error } = await supabase
      .from('streaks')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching streaks:', error);
      return [];
    }

    return data.map(streak => ({
      id: streak.id,
      date: new Date(streak.date),
      tasksCompleted: streak.tasks_completed
    }));
  },

  saveStreak: async (streak: Omit<Streak, 'id'>): Promise<Streak | null> => {
    const { data, error } = await supabase
      .from('streaks')
      .upsert([{
        date: streak.date.toISOString().split('T')[0],
        tasks_completed: streak.tasksCompleted
      }])
      .select()
      .single();

    if (error) {
      console.error('Error saving streak:', error);
      return null;
    }

    return {
      id: data.id,
      date: new Date(data.date),
      tasksCompleted: data.tasks_completed
    };
  },

  // Timer Settings (stored in localStorage for now)
  getTimerSettings: (): TimerSettings => {
    const data = localStorage.getItem('grit_timer_settings');
    if (!data) return getDefaultTimerSettings();
    return JSON.parse(data);
  },

  saveTimerSettings: (settings: TimerSettings) => {
    localStorage.setItem('grit_timer_settings', JSON.stringify(settings));
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