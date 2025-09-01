import React, { useState, useEffect } from 'react';
import { Plus, Calendar, CheckCircle2, Clock, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday, startOfDay, endOfDay } from 'date-fns';
import { Task, Habit, TaskStatus } from '@/types';

const Today = () => {
  const { tasks, initializeStore } = useAppStore();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitCompletions, setHabitCompletions] = useState<any[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load store data
    await initializeStore();
    
    // Load habits
    const { data: habitsData } = await supabase
      .from('habits')
      .select('*')
      .order('created_at', { ascending: true });
    if (habitsData) {
      const mappedHabits = habitsData.map(habit => ({
        ...habit,
        targetCount: habit.target_count,
        frequency: habit.frequency as 'daily' | 'weekly',
        createdAt: new Date(habit.created_at),
        updatedAt: new Date(habit.updated_at)
      }));
      setHabits(mappedHabits);
    }

    // Load today's habit completions
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data: completionsData } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('date', today);
    if (completionsData) setHabitCompletions(completionsData);

    // Load today's sessions
    const { data: sessionsData } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .gte('started_at', startOfDay(new Date()).toISOString())
      .lte('started_at', endOfDay(new Date()).toISOString());
    if (sessionsData) setSessions(sessionsData);
  };

  const toggleHabit = async (habitId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const isCompleted = habitCompletions.some(c => c.habit_id === habitId);

    if (isCompleted) {
      // Remove completion
      await supabase
        .from('habit_completions')
        .delete()
        .eq('habit_id', habitId)
        .eq('date', today);
      
      setHabitCompletions(prev => prev.filter(c => c.habit_id !== habitId));
    } else {
      // Add completion
      const { data } = await supabase
        .from('habit_completions')
        .insert([{ habit_id: habitId, date: today }])
        .select()
        .single();
      
      if (data) {
        setHabitCompletions(prev => [...prev, data]);
      }
    }
  };

  // Calculate today's stats
  const todayTasks = tasks.filter(task => {
    if (task.status === TaskStatus.COMPLETED && task.completedAt) {
      return isToday(new Date(task.completedAt));
    }
    return task.status !== TaskStatus.COMPLETED; // Include pending tasks
  });

  const completedTasks = todayTasks.filter(task => task.status === TaskStatus.COMPLETED);
  const pendingTasks = todayTasks.filter(task => task.status !== TaskStatus.COMPLETED);

  const completedHabits = habitCompletions.length;
  const totalHabits = habits.filter(h => h.frequency === 'daily').length;

  const productiveMinutes = sessions.reduce((acc, session) => acc + (session.work_seconds / 60), 0);
  const productiveHours = productiveMinutes / 60;

  const taskCompletionRate = todayTasks.length > 0 ? (completedTasks.length / todayTasks.length) * 100 : 0;
  const habitCompletionRate = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-surface p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              Today's Focus
            </h1>
            <p className="text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <Button onClick={() => setShowTaskForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>

        {/* Daily Dashboard */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-primary mx-auto" />
                <div className="text-2xl font-bold">{completedTasks.length}</div>
                <div className="text-sm text-muted-foreground">Tasks Completed</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <Target className="h-8 w-8 text-primary mx-auto" />
                <div className="text-2xl font-bold">{completedHabits}</div>
                <div className="text-sm text-muted-foreground">Habits Done</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <Clock className="h-8 w-8 text-primary mx-auto" />
                <div className="text-2xl font-bold">{productiveHours.toFixed(1)}h</div>
                <div className="text-sm text-muted-foreground">Productive Time</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <TrendingUp className="h-8 w-8 text-primary mx-auto" />
                <div className="text-2xl font-bold">{Math.round((taskCompletionRate + habitCompletionRate) / 2)}%</div>
                <div className="text-sm text-muted-foreground">Overall Progress</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tasks Completion</span>
                <span>{completedTasks.length}/{todayTasks.length}</span>
              </div>
              <Progress value={taskCompletionRate} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Habits Completion</span>
                <span>{completedHabits}/{totalHabits}</span>
              </div>
              <Progress value={habitCompletionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Today's Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className={`w-2 h-2 rounded-full ${
                    task.priority === 1 ? 'bg-red-500' :
                    task.priority === 2 ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1">
                  <div className="font-medium">{task.title}</div>
                  {task.notes && (
                    <div className="text-sm text-muted-foreground">{task.notes}</div>
                  )}
                  </div>
                  {task.estimateMinutes && (
                    <Badge variant="outline">{task.estimateMinutes}m</Badge>
                  )}
                </div>
              ))}
              {pendingTasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No pending tasks for today
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Habits */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Habits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {habits.filter(h => h.frequency === 'daily').map((habit) => {
                const isCompleted = habitCompletions.some(c => c.habit_id === habit.id);
                return (
                  <div 
                    key={habit.id} 
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                      isCompleted ? 'bg-secondary/50' : 'hover:bg-secondary/20'
                    }`}
                    onClick={() => toggleHabit(habit.id)}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isCompleted ? 'bg-primary border-primary' : 'border-muted-foreground'
                    }`}>
                      {isCompleted && <CheckCircle2 className="h-4 w-4 text-primary-foreground" />}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                        {habit.name}
                      </div>
                    </div>
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: habit.color }}
                    />
                  </div>
                );
              })}
              {habits.filter(h => h.frequency === 'daily').length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No daily habits set up
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Task Button Dialog - simplified for now */}
        {showTaskForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md m-4">
              <CardHeader>
                <CardTitle>Add New Task</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Task creation will be available soon. For now, please use the main app to add tasks.
                </p>
                <Button onClick={() => setShowTaskForm(false)} className="w-full">
                  Close
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Today;