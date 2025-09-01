import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { HabitForm } from './HabitForm';
import { HabitList } from './HabitList';
import { habitStorage } from '@/utils/habitStorage';
import { Habit, HabitCompletion } from '@/types';
import { toast } from 'sonner';

export const Habits = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [habitsData, completionsData] = await Promise.all([
        habitStorage.getHabits(),
        habitStorage.getHabitCompletions()
      ]);
      setHabits(habitsData);
      setCompletions(completionsData);
    } catch (error) {
      console.error('Error loading habits data:', error);
      toast.error('Failed to load habits');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHabit = async (habitData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingHabit) {
        const updated = await habitStorage.updateHabit(editingHabit.id, habitData);
        if (updated) {
          setHabits(habits.map(h => h.id === editingHabit.id ? updated : h));
          toast.success('Habit updated');
        }
      } else {
        const created = await habitStorage.saveHabit(habitData);
        if (created) {
          setHabits([...habits, created]);
          toast.success('Habit created');
        }
      }
      setEditingHabit(undefined);
    } catch (error) {
      console.error('Error saving habit:', error);
      toast.error('Failed to save habit');
    }
  };

  const handleToggleCompletion = async (habitId: string, isCompleted: boolean) => {
    try {
      if (isCompleted) {
        await habitStorage.removeHabitCompletion(habitId);
        setCompletions(completions.filter(c => {
          const today = new Date().toDateString();
          return !(c.habitId === habitId && new Date(c.date).toDateString() === today);
        }));
        toast.success('Completion removed');
      } else {
        const completion = await habitStorage.addHabitCompletion(habitId);
        if (completion) {
          setCompletions([...completions, completion]);
          toast.success('Great job! 🎉');
        }
      }
    } catch (error) {
      console.error('Error toggling completion:', error);
      toast.error('Failed to update completion');
    }
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setShowForm(true);
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (confirm('Are you sure you want to delete this habit?')) {
      try {
        await habitStorage.deleteHabit(habitId);
        setHabits(habits.filter(h => h.id !== habitId));
        setCompletions(completions.filter(c => c.habitId !== habitId));
        toast.success('Habit deleted');
      } catch (error) {
        console.error('Error deleting habit:', error);
        toast.error('Failed to delete habit');
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Habits</h1>
          <p className="text-muted-foreground">Build consistent daily routines</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Habit
        </Button>
      </div>

      <HabitList
        habits={habits}
        completions={completions}
        onToggleCompletion={handleToggleCompletion}
        onEditHabit={handleEditHabit}
        onDeleteHabit={handleDeleteHabit}
      />

      <HabitForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingHabit(undefined);
        }}
        onSave={handleSaveHabit}
        habit={editingHabit}
      />
    </div>
  );
};