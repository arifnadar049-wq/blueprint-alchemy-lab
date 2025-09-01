import { supabase } from '@/integrations/supabase/client';
import { Habit, HabitCompletion } from '@/types';

export const habitStorage = {
  // Habits
  getHabits: async (): Promise<Habit[]> => {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching habits:', error);
      return [];
    }
    
    return data.map(habit => ({
      id: habit.id,
      name: habit.name,
      icon: habit.icon,
      color: habit.color,
      frequency: habit.frequency as 'daily' | 'weekly',
      targetCount: habit.target_count,
      createdAt: new Date(habit.created_at),
      updatedAt: new Date(habit.updated_at)
    }));
  },

  saveHabit: async (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>): Promise<Habit | null> => {
    const { data, error } = await supabase
      .from('habits')
      .insert([{
        name: habit.name,
        icon: habit.icon,
        color: habit.color,
        frequency: habit.frequency,
        target_count: habit.targetCount
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating habit:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      icon: data.icon,
      color: data.color,
      frequency: data.frequency as 'daily' | 'weekly',
      targetCount: data.target_count,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  updateHabit: async (id: string, updates: Partial<Habit>): Promise<Habit | null> => {
    const { data, error } = await supabase
      .from('habits')
      .update({
        name: updates.name,
        icon: updates.icon,
        color: updates.color,
        frequency: updates.frequency,
        target_count: updates.targetCount
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating habit:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      icon: data.icon,
      color: data.color,
      frequency: data.frequency as 'daily' | 'weekly',
      targetCount: data.target_count,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  deleteHabit: async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting habit:', error);
      return false;
    }

    return true;
  },

  // Habit Completions
  getHabitCompletions: async (): Promise<HabitCompletion[]> => {
    const { data, error } = await supabase
      .from('habit_completions')
      .select('*')
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching habit completions:', error);
      return [];
    }

    return data.map(completion => ({
      id: completion.id,
      habitId: completion.habit_id,
      completedAt: new Date(completion.completed_at),
      date: new Date(completion.date),
      createdAt: new Date(completion.created_at)
    }));
  },

  addHabitCompletion: async (habitId: string): Promise<HabitCompletion | null> => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('habit_completions')
      .insert([{
        habit_id: habitId,
        date: today
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding habit completion:', error);
      return null;
    }

    return {
      id: data.id,
      habitId: data.habit_id,
      completedAt: new Date(data.completed_at),
      date: new Date(data.date),
      createdAt: new Date(data.created_at)
    };
  },

  removeHabitCompletion: async (habitId: string): Promise<boolean> => {
    const today = new Date().toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('habit_completions')
      .delete()
      .eq('habit_id', habitId)
      .eq('date', today);

    if (error) {
      console.error('Error removing habit completion:', error);
      return false;
    }

    return true;
  }
};