import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';

export const useRealTimeUpdates = () => {
  const { initializeStore } = useAppStore();

  useEffect(() => {
    // Listen for task updates
    const taskChannel = supabase
      .channel('task-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('Task change detected:', payload);
          // Re-initialize store to get fresh data
          initializeStore();
        }
      )
      .subscribe();

    // Listen for habit completion updates
    const habitChannel = supabase
      .channel('habit-completion-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'habit_completions'
        },
        (payload) => {
          console.log('Habit completion change detected:', payload);
          // Re-initialize store to get fresh data
          initializeStore();
        }
      )
      .subscribe();

    // Listen for pomodoro session updates
    const sessionChannel = supabase
      .channel('session-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pomodoro_sessions'
        },
        (payload) => {
          console.log('Pomodoro session change detected:', payload);
          // Re-initialize store to get fresh data
          initializeStore();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(habitChannel);
      supabase.removeChannel(sessionChannel);
    };
  }, [initializeStore]);
};