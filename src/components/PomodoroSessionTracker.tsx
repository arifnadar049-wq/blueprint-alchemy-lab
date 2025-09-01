import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw, Target, Coffee } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { TimerMode } from '@/types';

export const PomodoroSessionTracker = () => {
  const { 
    currentTimer, 
    appState,
    sessions, 
    startTimer, 
    pauseTimer, 
    stopTimer,
    tasks
  } = useAppStore();

  const timerSettings = appState.timerSettings;

  const [displayTime, setDisplayTime] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    todayPomodoros: 0,
    todayWorkMinutes: 0,
    todayBreakMinutes: 0,
    currentStreak: 0
  });

  // Update display time
  useEffect(() => {
    if (currentTimer.isRunning) {
      const interval = setInterval(() => {
        const now = new Date();
        const elapsed = currentTimer.startTime 
          ? Math.floor((now.getTime() - currentTimer.startTime.getTime()) / 1000)
          : 0;
        setDisplayTime(elapsed);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentTimer.isRunning, currentTimer.startTime]);

  // Calculate session stats
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySessions = sessions.filter(session => {
      const sessionDate = new Date(session.startedAt);
      return sessionDate >= today && sessionDate < tomorrow;
    });

    const pomodoroSessions = todaySessions.filter(s => 
      s.mode === TimerMode.POMODORO && s.endedAt
    );

    const workMinutes = todaySessions.reduce((acc, session) => 
      acc + (session.workSeconds / 60), 0
    );

    const breakMinutes = todaySessions.reduce((acc, session) => 
      acc + (session.breakSeconds / 60), 0
    );

    setSessionStats({
      todayPomodoros: pomodoroSessions.length,
      todayWorkMinutes: Math.round(workMinutes),
      todayBreakMinutes: Math.round(breakMinutes),
      currentStreak: calculateStreak()
    });
  }, [sessions]);

  const calculateStreak = () => {
    // Calculate current pomodoro streak
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date;
    }).reverse();

    let streak = 0;
    for (const date of last7Days) {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const daySessions = sessions.filter(session => {
        const sessionDate = new Date(session.startedAt);
        return sessionDate >= date && sessionDate < nextDay &&
               session.mode === TimerMode.POMODORO && session.endedAt;
      });

      if (daySessions.length >= 1) { // At least 1 pomodoro per day
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const selectedTask = appState.selectedTaskId ? tasks.find(t => t.id === appState.selectedTaskId) : null;
  const isPomodoro = currentTimer.mode === TimerMode.POMODORO;
  const workDuration = timerSettings.pomodoroWorkMinutes * 60;
  const breakDuration = currentTimer.pomodoroCount % timerSettings.pomodoroLongBreakAfter === 0
    ? timerSettings.pomodoroLongBreakMinutes * 60
    : timerSettings.pomodoroBreakMinutes * 60;

  const targetDuration = currentTimer.isBreak ? breakDuration : workDuration;
  const progressPercent = Math.min(100, (displayTime / targetDuration) * 100);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartPomodoro = () => {
    if (appState.selectedTaskId) {
      startTimer(appState.selectedTaskId, TimerMode.POMODORO);
    }
  };

  const getRemainingTime = () => {
    return Math.max(0, targetDuration - displayTime);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Timer className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold">Pomodoro Sessions</h2>
      </div>

      {/* Active Timer Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {currentTimer.isBreak ? (
              <><Coffee className="h-4 w-4" /> Break Time</>
            ) : (
              <><Target className="h-4 w-4" /> Focus Time</>
            )}
          </CardTitle>
          {selectedTask && (
            <p className="text-sm text-muted-foreground">{selectedTask.title}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timer Display */}
          <div className="text-center">
            <div className="text-6xl font-mono font-bold text-primary mb-2">
              {formatTime(getRemainingTime())}
            </div>
            <Progress 
              value={progressPercent} 
              className="h-3 mb-4"
            />
            
            {isPomodoro && (
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <span>Session {currentTimer.pomodoroCount + 1}</span>
                <span>•</span>
                <span>{currentTimer.isBreak ? 'Break' : 'Work'} Phase</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-3">
            {!currentTimer.isRunning ? (
              <Button 
                onClick={handleStartPomodoro}
                size="lg"
                disabled={!appState.selectedTaskId}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                {currentTimer.taskId ? 'Resume' : 'Start'} Pomodoro
              </Button>
            ) : (
              <Button 
                onClick={pauseTimer}
                size="lg"
                variant="secondary"
                className="gap-2"
              >
                <Pause className="h-4 w-4" />
                Pause
              </Button>
            )}
            
            <Button 
              onClick={stopTimer}
              size="lg"
              variant="outline"
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>

          {!appState.selectedTaskId && (
            <p className="text-center text-sm text-muted-foreground">
              Select a task to start a pomodoro session
            </p>
          )}
        </CardContent>
      </Card>

      {/* Today's Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today's Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {sessionStats.todayPomodoros}
              </div>
              <div className="text-sm text-muted-foreground">Pomodoros</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {sessionStats.todayWorkMinutes}m
              </div>
              <div className="text-sm text-muted-foreground">Focus Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {sessionStats.todayBreakMinutes}m
              </div>
              <div className="text-sm text-muted-foreground">Break Time</div>
            </div>
            <div className="text-center">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {sessionStats.currentStreak} day streak
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};