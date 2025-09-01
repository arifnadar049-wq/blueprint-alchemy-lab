import { supabase } from '@/integrations/supabase/client';
import { List, Task, Session, Streak, TimerSettings, TimerMode, TaskStatus, Subtask } from '@/types';

// Utility functions for Supabase storage
export const supabaseStorage = {
  // Lists
  getLists: async (): Promise<List[]> => {
    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching lists:', error);
      return [];
    }
    
    return data.map(list => ({
      id: list.id,
      name: list.name,
      color: list.color,
      icon: list.icon,
      order: (list as any).order || 0, // Handle potentially missing order field
      createdAt: new Date(list.created_at),
      updatedAt: new Date(list.updated_at)
    }));
  },

  saveList: async (list: Omit<List, 'id' | 'createdAt' | 'updatedAt'>): Promise<List | null> => {
    const insertData: any = {
      name: list.name,
      color: list.color,
      icon: list.icon
    };
    
    // Only add order if it exists
    if (list.order !== undefined) {
      insertData.order = list.order;
    }

    const { data, error } = await supabase
      .from('lists')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating list:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      color: data.color,
      icon: data.icon,
      order: (data as any).order || 0,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  updateList: async (id: string, updates: Partial<List>): Promise<List | null> => {
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.color !== undefined) updateData.color = updates.color;
    if (updates.icon !== undefined) updateData.icon = updates.icon;
    if (updates.order !== undefined) updateData.order = updates.order;

    const { data, error } = await supabase
      .from('lists')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating list:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      color: data.color,
      icon: data.icon,
      order: (data as any).order || 0,
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

    return data.map(task => {
      const taskData = task as any;
      
      // Handle priority - convert string to number if needed
      let priority = 3;
      if (typeof taskData.priority === 'number') {
        priority = taskData.priority;
      } else if (typeof taskData.priority === 'string') {
        switch (taskData.priority) {
          case 'urgent': priority = 1; break;
          case 'high': priority = 2; break;
          case 'medium': priority = 3; break;
          case 'low': priority = 4; break;
          case 'lowest': priority = 5; break;
          default: priority = 3;
        }
      }

      return {
        id: taskData.id,
        listId: taskData.list_id || '',
        title: taskData.title,
        notes: taskData.notes || taskData.description || '',
        estimateMinutes: taskData.estimate_minutes || null,
        dueDate: taskData.due_date ? new Date(taskData.due_date) : null,
        dueTime: taskData.due_time || null,
        status: taskData.status as TaskStatus,
        recurrenceRule: taskData.recurrence_rule || null,
        parentRecurringId: taskData.parent_recurring_id || null,
        subtasks: taskData.subtasks || [],
        priority,
        completedAt: taskData.completed_at ? new Date(taskData.completed_at) : null,
        archived: taskData.archived || false,
        orderIndex: taskData.order_index || 0,
        tags: [], // Will be populated by joins later
        dependencies: [], // Will be populated by joins later
        createdAt: new Date(taskData.created_at),
        updatedAt: new Date(taskData.updated_at)
      };
    });
  },

  saveTask: async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task | null> => {
    const insertData: any = {
      list_id: task.listId,
      title: task.title,
      description: task.notes, // Use description as fallback
      estimate_minutes: task.estimateMinutes,
      due_date: task.dueDate?.toISOString().split('T')[0] || null,
      status: task.status,
      priority: task.priority
    };

    // Add optional fields if they exist in the schema
    if (task.notes) insertData.notes = task.notes;
    if (task.dueTime) insertData.due_time = task.dueTime;
    if (task.recurrenceRule) insertData.recurrence_rule = task.recurrenceRule;
    if (task.parentRecurringId) insertData.parent_recurring_id = task.parentRecurringId;
    if (task.subtasks) insertData.subtasks = JSON.parse(JSON.stringify(task.subtasks));
    if (task.archived !== undefined) insertData.archived = task.archived;
    if (task.orderIndex !== undefined) insertData.order_index = task.orderIndex;

    const { data, error } = await supabase
      .from('tasks')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return null;
    }

    const taskData = data as any;
    let priority = 3;
    if (typeof taskData.priority === 'number') {
      priority = taskData.priority;
    } else if (typeof taskData.priority === 'string') {
      switch (taskData.priority) {
        case 'urgent': priority = 1; break;
        case 'high': priority = 2; break;
        case 'medium': priority = 3; break;
        case 'low': priority = 4; break;
        case 'lowest': priority = 5; break;
        default: priority = 3;
      }
    }

    return {
      id: taskData.id,
      listId: taskData.list_id || '',
      title: taskData.title,
      notes: taskData.notes || taskData.description || '',
      estimateMinutes: taskData.estimate_minutes || null,
      dueDate: taskData.due_date ? new Date(taskData.due_date) : null,
      dueTime: taskData.due_time || null,
      status: taskData.status as TaskStatus,
      recurrenceRule: taskData.recurrence_rule || null,
      parentRecurringId: taskData.parent_recurring_id || null,
      subtasks: taskData.subtasks || [],
      priority,
      completedAt: taskData.completed_at ? new Date(taskData.completed_at) : null,
      archived: taskData.archived || false,
      orderIndex: taskData.order_index || 0,
      tags: [],
      dependencies: [],
      createdAt: new Date(taskData.created_at),
      updatedAt: new Date(taskData.updated_at)
    };
  },

  updateTask: async (id: string, updates: Partial<Task>): Promise<Task | null> => {
    const updateData: any = {};
    
    if (updates.listId !== undefined) updateData.list_id = updates.listId;
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.notes !== undefined) {
      updateData.notes = updates.notes;
      updateData.description = updates.notes; // Keep description in sync
    }
    if (updates.estimateMinutes !== undefined) updateData.estimate_minutes = updates.estimateMinutes;
    if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate?.toISOString().split('T')[0] || null;
    if (updates.dueTime !== undefined) updateData.due_time = updates.dueTime;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.recurrenceRule !== undefined) updateData.recurrence_rule = updates.recurrenceRule;
    if (updates.parentRecurringId !== undefined) updateData.parent_recurring_id = updates.parentRecurringId;
    if (updates.subtasks !== undefined) updateData.subtasks = JSON.parse(JSON.stringify(updates.subtasks));
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.archived !== undefined) updateData.archived = updates.archived;
    if (updates.orderIndex !== undefined) updateData.order_index = updates.orderIndex;

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return null;
    }

    const taskData = data as any;
    let priority = 3;
    if (typeof taskData.priority === 'number') {
      priority = taskData.priority;
    } else if (typeof taskData.priority === 'string') {
      switch (taskData.priority) {
        case 'urgent': priority = 1; break;
        case 'high': priority = 2; break;
        case 'medium': priority = 3; break;
        case 'low': priority = 4; break;
        case 'lowest': priority = 5; break;
        default: priority = 3;
      }
    }

    return {
      id: taskData.id,
      listId: taskData.list_id || '',
      title: taskData.title,
      notes: taskData.notes || taskData.description || '',
      estimateMinutes: taskData.estimate_minutes || null,
      dueDate: taskData.due_date ? new Date(taskData.due_date) : null,
      dueTime: taskData.due_time || null,
      status: taskData.status as TaskStatus,
      recurrenceRule: taskData.recurrence_rule || null,
      parentRecurringId: taskData.parent_recurring_id || null,
      subtasks: taskData.subtasks || [],
      priority,
      completedAt: taskData.completed_at ? new Date(taskData.completed_at) : null,
      archived: taskData.archived || false,
      orderIndex: taskData.order_index || 0,
      tags: [],
      dependencies: [],
      createdAt: new Date(taskData.created_at),
      updatedAt: new Date(taskData.updated_at)
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

  // Sessions - use pomodoro_sessions table
  getSessions: async (): Promise<Session[]> => {
    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }

    return data.map((session: any) => ({
      id: session.id,
      taskId: session.task_id || '',
      mode: (session.mode as TimerMode) || TimerMode.CONTINUOUS,
      startedAt: new Date(session.started_at),
      endedAt: session.ended_at ? new Date(session.ended_at) : null,
      workSeconds: session.work_seconds || 0,
      breakSeconds: session.break_seconds || 0,
      createdAt: new Date(session.created_at)
    }));
  },

  saveSession: async (session: Omit<Session, 'id' | 'createdAt'>): Promise<Session | null> => {
    const insertData = {
      task_id: session.taskId,
      mode: session.mode,
      started_at: session.startedAt.toISOString(),
      ended_at: session.endedAt?.toISOString() || null,
      work_seconds: session.workSeconds,
      break_seconds: session.breakSeconds
    };

    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return null;
    }

    const sessionData = data as any;
    return {
      id: sessionData.id,
      taskId: sessionData.task_id || '',
      mode: (sessionData.mode as TimerMode) || TimerMode.CONTINUOUS,
      startedAt: new Date(sessionData.started_at),
      endedAt: sessionData.ended_at ? new Date(sessionData.ended_at) : null,
      workSeconds: sessionData.work_seconds || 0,
      breakSeconds: sessionData.break_seconds || 0,
      createdAt: new Date(sessionData.created_at)
    };
  },

  // Streaks - fallback to localStorage since table doesn't exist
  getStreaks: async (): Promise<Streak[]> => {
    console.log('Using localStorage for streaks (table not available)');
    return getStreaksFromLocalStorage();
  },

  saveStreak: async (streak: Omit<Streak, 'id'>): Promise<Streak | null> => {
    console.log('Using localStorage for streaks (table not available)');
    return saveStreakToLocalStorage(streak);
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

// LocalStorage fallback functions for streaks
function getStreaksFromLocalStorage(): Streak[] {
  try {
    const data = localStorage.getItem('grit_streaks');
    if (!data) return [];
    return JSON.parse(data).map((streak: any) => ({
      ...streak,
      date: new Date(streak.date)
    }));
  } catch (error) {
    console.error('Error reading streaks from localStorage:', error);
    return [];
  }
}

function saveStreakToLocalStorage(streak: Omit<Streak, 'id'>): Streak | null {
  try {
    const existing = getStreaksFromLocalStorage();
    const id = `streak_${Date.now()}`;
    const newStreak: Streak = {
      id,
      date: streak.date,
      tasksCompleted: streak.tasksCompleted
    };
    
    // Remove existing streak for the same date
    const filtered = existing.filter(s => s.date.toDateString() !== streak.date.toDateString());
    const updated = [...filtered, newStreak];
    
    localStorage.setItem('grit_streaks', JSON.stringify(updated.map(s => ({
      ...s,
      date: s.date.toISOString()
    }))));
    
    return newStreak;
  } catch (error) {
    console.error('Error saving streak to localStorage:', error);
    return null;
  }
}