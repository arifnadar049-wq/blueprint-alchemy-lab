import React, { useEffect, useState } from 'react';
import { Trophy, Flame, Target, Clock, CheckCircle, Star, Award, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
import { TaskStatus } from '@/types';
import { cn } from '@/lib/utils';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface Streak {
  current: number;
  longest: number;
  lastDate: Date | null;
}

export const Gamification = () => {
  const { tasks, sessions } = useAppStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [streak, setStreak] = useState<Streak>({ current: 0, longest: 0, lastDate: null });
  const [todayStats, setTodayStats] = useState({
    tasksCompleted: 0,
    focusMinutes: 0,
    pomodoroSessions: 0
  });

  // Calculate daily stats
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTasks = tasks.filter(task => 
      task.status === TaskStatus.COMPLETED && 
      task.updatedAt >= today
    );
    
    const todaySessions = sessions.filter(session => 
      session.startedAt >= today
    );
    
    const focusMinutes = todaySessions.reduce((total, session) => 
      total + Math.floor(session.workSeconds / 60), 0
    );
    
    const pomodoroSessions = todaySessions.filter(session => 
      session.mode === 'pomodoro'
    ).length;

    setTodayStats({
      tasksCompleted: todayTasks.length,
      focusMinutes,
      pomodoroSessions
    });
  }, [tasks, sessions]);

  // Calculate achievements
  useEffect(() => {
    const completedTasks = tasks.filter(task => task.status === TaskStatus.COMPLETED).length;
    const totalFocusHours = Math.floor(
      sessions.reduce((total, session) => total + session.workSeconds, 0) / 3600
    );
    const pomodoroCount = sessions.filter(session => session.mode === 'pomodoro').length;
    
    const newAchievements: Achievement[] = [
      {
        id: 'first-task',
        title: 'Getting Started',
        description: 'Complete your first task',
        icon: CheckCircle,
        unlocked: completedTasks >= 1,
        progress: Math.min(completedTasks, 1),
        maxProgress: 1,
        rarity: 'common'
      },
      {
        id: 'task-master-10',
        title: 'Task Master',
        description: 'Complete 10 tasks',
        icon: Target,
        unlocked: completedTasks >= 10,
        progress: Math.min(completedTasks, 10),
        maxProgress: 10,
        rarity: 'common'
      },
      {
        id: 'task-champion-50',
        title: 'Task Champion',
        description: 'Complete 50 tasks',
        icon: Award,
        unlocked: completedTasks >= 50,
        progress: Math.min(completedTasks, 50),
        maxProgress: 50,
        rarity: 'rare'
      },
      {
        id: 'focus-warrior',
        title: 'Focus Warrior',
        description: 'Focus for 10 hours total',
        icon: Clock,
        unlocked: totalFocusHours >= 10,
        progress: Math.min(totalFocusHours, 10),
        maxProgress: 10,
        rarity: 'rare'
      },
      {
        id: 'pomodoro-master',
        title: 'Pomodoro Master',
        description: 'Complete 25 Pomodoro sessions',
        icon: Zap,
        unlocked: pomodoroCount >= 25,
        progress: Math.min(pomodoroCount, 25),
        maxProgress: 25,
        rarity: 'epic'
      },
      {
        id: 'daily-warrior',
        title: 'Daily Warrior',
        description: 'Complete 5 tasks in one day',
        icon: Star,
        unlocked: todayStats.tasksCompleted >= 5,
        progress: Math.min(todayStats.tasksCompleted, 5),
        maxProgress: 5,
        rarity: 'rare'
      },
      {
        id: 'productivity-legend',
        title: 'Productivity Legend',
        description: 'Complete 100 tasks',
        icon: Trophy,
        unlocked: completedTasks >= 100,
        progress: Math.min(completedTasks, 100),
        maxProgress: 100,
        rarity: 'legendary'
      }
    ];

    setAchievements(newAchievements);
  }, [tasks, sessions, todayStats]);

  // Calculate streak
  useEffect(() => {
    const today = new Date();
    const dates = new Set();
    
    // Get unique dates when tasks were completed
    tasks.filter(task => task.status === TaskStatus.COMPLETED).forEach(task => {
      const date = new Date(task.updatedAt);
      dates.add(date.toDateString());
    });
    
    const sortedDates = Array.from(dates).sort().reverse();
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;
    
    // Calculate current streak (consecutive days from today backwards)
    for (let i = 0; i < sortedDates.length; i++) {
      const dateStr = sortedDates[i] as string;
      const date = new Date(dateStr);
      const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (i === 0 && daysDiff <= 1) {
        currentStreak = 1;
        lastDate = date;
      } else if (currentStreak > 0 && daysDiff === currentStreak) {
        currentStreak++;
        lastDate = date;
      } else if (currentStreak > 0) {
        break;
      }
    }
    
    // Calculate longest streak
    for (let i = 0; i < sortedDates.length; i++) {
      const dateStr = sortedDates[i] as string;
      const date = new Date(dateStr);
      const prevDateStr = i > 0 ? sortedDates[i - 1] as string : null;
      const prevDate = prevDateStr ? new Date(prevDateStr) : null;
      
      if (!prevDate || Math.floor((prevDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)) === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
    
    setStreak({ current: currentStreak, longest: longestStreak, lastDate });
  }, [tasks]);

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 border-gray-200';
      case 'rare': return 'text-blue-600 border-blue-200';
      case 'epic': return 'text-purple-600 border-purple-200';
      case 'legendary': return 'text-yellow-600 border-yellow-200';
      default: return 'text-gray-600 border-gray-200';
    }
  };

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);

  return (
    <div className="space-y-6">
      {/* Daily Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tasks Today</p>
                <p className="text-2xl font-bold">{todayStats.tasksCompleted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-focus-active/10 rounded-lg">
                <Clock className="h-5 w-5 text-focus-active" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Focus Time</p>
                <p className="text-2xl font-bold">{todayStats.focusMinutes}m</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Flame className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold">{streak.current} days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Streak Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-600" />
            Productivity Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-2xl font-bold text-orange-600">{streak.current} days</p>
              <p className="text-sm text-muted-foreground">Current streak</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold">{streak.longest} days</p>
              <p className="text-sm text-muted-foreground">Personal best</p>
            </div>
          </div>
          
          {streak.current > 0 ? (
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                🔥 You're on fire! Keep completing tasks to maintain your streak.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Complete a task today to start your productivity streak!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Achievements
            <Badge variant="secondary" className="ml-auto">
              {unlockedAchievements.length}/{achievements.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Unlocked Achievements */}
            {unlockedAchievements.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Unlocked</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {unlockedAchievements.map((achievement) => {
                    const Icon = achievement.icon;
                    return (
                      <div
                        key={achievement.id}
                        className={cn(
                          "flex items-center gap-3 p-3 border rounded-lg bg-card animate-bounce-soft",
                          getRarityColor(achievement.rarity)
                        )}
                      >
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{achievement.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {achievement.description}
                          </p>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={cn("text-xs", getRarityColor(achievement.rarity))}
                        >
                          {achievement.rarity}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Locked Achievements */}
            {lockedAchievements.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">In Progress</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {lockedAchievements.map((achievement) => {
                    const Icon = achievement.icon;
                    const progressPercent = (achievement.progress / achievement.maxProgress) * 100;
                    
                    return (
                      <div
                        key={achievement.id}
                        className="flex items-center gap-3 p-3 border border-dashed rounded-lg opacity-60"
                      >
                        <div className="p-2 bg-muted rounded-lg">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{achievement.title}</p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {achievement.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Progress value={progressPercent} className="h-1 flex-1" />
                            <span className="text-xs text-muted-foreground">
                              {achievement.progress}/{achievement.maxProgress}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};