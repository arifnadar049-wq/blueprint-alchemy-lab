import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Clock, BarChart3, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/store/useAppStore';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay } from 'date-fns';
import { Task, TaskStatus } from '@/types';

const ThisWeek = () => {
  const { tasks, initializeStore } = useAppStore();
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await initializeStore();
    
    // Load this week's sessions
    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());
    
    const { data: sessionsData } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .gte('started_at', weekStart.toISOString())
      .lte('started_at', weekEnd.toISOString());
    
    if (sessionsData) setSessions(sessionsData);
  };

  // Get week days
  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Calculate daily stats
  const getDayStats = (date: Date) => {
    const dayTasks = tasks.filter(task => {
      if (task.completedAt) {
        return isSameDay(new Date(task.completedAt), date);
      }
      // For incomplete tasks, show them for today only
      return isToday(date) && task.status !== TaskStatus.COMPLETED;
    });

    const completedTasks = dayTasks.filter(task => task.status === TaskStatus.COMPLETED);
    const pendingTasks = dayTasks.filter(task => task.status !== TaskStatus.COMPLETED);

    const daySessions = sessions.filter(session => 
      isSameDay(new Date(session.started_at), date)
    );
    
    const productiveMinutes = daySessions.reduce((acc, session) => acc + (session.work_seconds / 60), 0);

    return {
      date,
      totalTasks: dayTasks.length,
      completedTasks: completedTasks.length,
      pendingTasks: pendingTasks.length,
      productiveHours: productiveMinutes / 60,
      completionRate: dayTasks.length > 0 ? (completedTasks.length / dayTasks.length) * 100 : 0,
      tasks: dayTasks
    };
  };

  const weekStats = weekDays.map(getDayStats);

  // Calculate week totals
  const weekTotals = weekStats.reduce((acc, day) => ({
    totalTasks: acc.totalTasks + day.totalTasks,
    completedTasks: acc.completedTasks + day.completedTasks,
    pendingTasks: acc.pendingTasks + day.pendingTasks,
    productiveHours: acc.productiveHours + day.productiveHours
  }), { totalTasks: 0, completedTasks: 0, pendingTasks: 0, productiveHours: 0 });

  const weekCompletionRate = weekTotals.totalTasks > 0 ? (weekTotals.completedTasks / weekTotals.totalTasks) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-surface p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => window.location.href = '/'} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              This Week Overview
            </h1>
            <p className="text-muted-foreground">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </p>
          </div>
          <div className="w-20"></div>
        </div>

        {/* Week Summary */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-primary mx-auto" />
                <div className="text-2xl font-bold">{weekTotals.completedTasks}</div>
                <div className="text-sm text-muted-foreground">Tasks Completed</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <Clock className="h-8 w-8 text-primary mx-auto" />
                <div className="text-2xl font-bold">{weekTotals.pendingTasks}</div>
                <div className="text-sm text-muted-foreground">Tasks Remaining</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <BarChart3 className="h-8 w-8 text-primary mx-auto" />
                <div className="text-2xl font-bold">{weekTotals.productiveHours.toFixed(1)}h</div>
                <div className="text-sm text-muted-foreground">Productive Time</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                  <span className="text-primary-foreground font-bold text-sm">%</span>
                </div>
                <div className="text-2xl font-bold">{Math.round(weekCompletionRate)}%</div>
                <div className="text-sm text-muted-foreground">Completion Rate</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Week Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Week Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Completion</span>
                <span>{weekTotals.completedTasks}/{weekTotals.totalTasks} tasks</span>
              </div>
              <Progress value={weekCompletionRate} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Daily Breakdown */}
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {weekStats.map((dayStats, index) => (
            <Card key={index} className={isToday(dayStats.date) ? 'ring-2 ring-primary/20' : ''}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{format(dayStats.date, 'EEEE')}</span>
                  {isToday(dayStats.date) && <Badge variant="secondary">Today</Badge>}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{format(dayStats.date, 'MMM d')}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Day Stats */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-primary">{dayStats.completedTasks}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-muted-foreground">{dayStats.pendingTasks}</div>
                    <div className="text-xs text-muted-foreground">Remaining</div>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Progress</span>
                    <span>{Math.round(dayStats.completionRate)}%</span>
                  </div>
                  <Progress value={dayStats.completionRate} className="h-1" />
                </div>

                {/* Productive Time */}
                <div className="text-center">
                  <div className="text-sm font-medium">{dayStats.productiveHours.toFixed(1)}h</div>
                  <div className="text-xs text-muted-foreground">Productive Time</div>
                </div>

                {/* Task List */}
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {dayStats.tasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${
                        task.status === TaskStatus.COMPLETED ? 'bg-primary' : 'bg-muted-foreground'
                      }`} />
                      <span className={`flex-1 truncate ${
                        task.status === TaskStatus.COMPLETED ? 'line-through text-muted-foreground' : ''
                      }`}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                  {dayStats.tasks.length > 5 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayStats.tasks.length - 5} more tasks
                    </div>
                  )}
                  {dayStats.tasks.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-2">
                      No tasks
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThisWeek;