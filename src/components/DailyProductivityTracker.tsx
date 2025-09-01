import React, { useState, useEffect } from 'react';
import { Calendar, Clock, TrendingUp, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
import { format, isToday, startOfDay, endOfDay } from 'date-fns';

export const DailyProductivityTracker = () => {
  const { sessions, tasks } = useAppStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyGoal, setDailyGoal] = useState(8); // 8 hours default

  const getDailyStats = (date: Date) => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    // Get sessions for the day
    const daySessions = sessions.filter(session => {
      const sessionDate = new Date(session.startedAt);
      return sessionDate >= dayStart && sessionDate <= dayEnd;
    });

    // Calculate total productive time
    const totalMinutes = daySessions.reduce((acc, session) => {
      return acc + (session.workSeconds / 60 || 0);
    }, 0);

    // Get completed tasks for the day
    const completedTasks = tasks.filter(task => {
      if (!task.completedAt) return false;
      const completedDate = new Date(task.completedAt);
      return completedDate >= dayStart && completedDate <= dayEnd;
    });

    // Calculate productivity score
    const estimatedMinutes = completedTasks.reduce((acc, task) => {
      return acc + (task.estimateMinutes || 0);
    }, 0);

    const productivityScore = estimatedMinutes > 0 
      ? Math.min(100, Math.round((totalMinutes / estimatedMinutes) * 100))
      : totalMinutes > 0 ? 75 : 0;

    return {
      totalMinutes,
      totalHours: totalMinutes / 60,
      sessionsCount: daySessions.length,
      completedTasks: completedTasks.length,
      productivityScore,
      goalProgress: (totalMinutes / (dailyGoal * 60)) * 100
    };
  };

  const stats = getDailyStats(selectedDate);
  const isCurrentDay = isToday(selectedDate);

  const getStreakData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date,
        stats: getDailyStats(date),
        isToday: isToday(date)
      };
    }).reverse();

    return last7Days;
  };

  const streakData = getStreakData();
  const currentStreak = streakData.reduce((streak, day) => {
    if (day.stats.totalMinutes >= 60) return streak + 1; // At least 1 hour
    return 0;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Daily Productivity</h2>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Award className="h-3 w-3" />
          {currentStreak} day streak
        </Badge>
      </div>

      {/* Date Selector */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const yesterday = new Date(selectedDate);
                  yesterday.setDate(yesterday.getDate() - 1);
                  setSelectedDate(yesterday);
                }}
              >
                Previous
              </Button>
              {!isCurrentDay && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Today
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const tomorrow = new Date(selectedDate);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setSelectedDate(tomorrow);
                }}
                disabled={isCurrentDay}
              >
                Next
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.totalHours.toFixed(1)}h
              </div>
              <div className="text-sm text-muted-foreground">Total Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.sessionsCount}
              </div>
              <div className="text-sm text-muted-foreground">Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.completedTasks}
              </div>
              <div className="text-sm text-muted-foreground">Tasks Done</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.productivityScore}%
              </div>
              <div className="text-sm text-muted-foreground">Efficiency</div>
            </div>
          </div>

          {/* Daily Goal Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Daily Goal Progress</span>
              <span>{stats.totalHours.toFixed(1)}h / {dailyGoal}h</span>
            </div>
            <Progress value={Math.min(100, stats.goalProgress)} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Weekly Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            7-Day Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {streakData.map((day, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg border text-center transition-all cursor-pointer ${
                  day.isToday 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : day.stats.totalMinutes >= 60
                    ? 'bg-secondary border-secondary'
                    : 'bg-muted border-border'
                }`}
                onClick={() => setSelectedDate(day.date)}
              >
                <div className="text-xs mb-1">
                  {format(day.date, 'EEE')}
                </div>
                <div className="text-sm font-medium">
                  {day.stats.totalHours.toFixed(1)}h
                </div>
                <div className="text-xs opacity-70">
                  {day.stats.completedTasks} tasks
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};