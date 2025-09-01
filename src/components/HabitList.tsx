import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Edit2, Trash2, Flame } from 'lucide-react';
import { Habit, HabitCompletion } from '@/types';

interface HabitListProps {
  habits: Habit[];
  completions: HabitCompletion[];
  onToggleCompletion: (habitId: string, isCompleted: boolean) => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
}

export const HabitList: React.FC<HabitListProps> = ({
  habits,
  completions,
  onToggleCompletion,
  onEditHabit,
  onDeleteHabit
}) => {
  const getTodayCompletions = (habitId: string) => {
    const today = new Date().toDateString();
    return completions.filter(c => 
      c.habitId === habitId && 
      new Date(c.date).toDateString() === today
    ).length;
  };

  const getStreak = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return 0;

    const habitCompletions = completions
      .filter(c => c.habitId === habitId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (habitCompletions.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toDateString();
      
      const dayCompletions = habitCompletions.filter(c => 
        new Date(c.date).toDateString() === dateString
      ).length;
      
      if (habit.frequency === 'daily') {
        if (dayCompletions >= habit.targetCount) {
          streak++;
        } else if (i > 0) { // Allow today to be incomplete
          break;
        }
      }
    }
    
    return streak;
  };

  if (habits.length === 0) {
    return (
      <div className="text-center py-8">
        <Circle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">No habits yet</p>
        <p className="text-sm text-muted-foreground">Create your first habit to start tracking</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {habits.map((habit) => {
        const todayCompletions = getTodayCompletions(habit.id);
        const isCompleted = todayCompletions >= habit.targetCount;
        const streak = getStreak(habit.id);

        return (
          <Card key={habit.id} className="group p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleCompletion(habit.id, isCompleted)}
                className="h-8 w-8 p-0"
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </Button>

              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: habit.color }}
              >
                {habit.icon}
              </div>

              <div className="flex-1">
                <h3 className="font-medium text-card-foreground">{habit.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {todayCompletions}/{habit.targetCount} {habit.frequency === 'daily' ? 'today' : 'this week'}
                  </Badge>
                  {streak > 0 && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <Flame className="h-3 w-3 text-orange-500" />
                      {streak} day{streak > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditHabit(habit)}
                  className="h-8 w-8 p-0"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteHabit(habit.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};