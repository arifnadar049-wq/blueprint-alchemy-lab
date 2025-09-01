import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Minimize2, 
  Maximize2, 
  X, 
  Clock,
  Coffee,
  Target,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/store/useAppStore';
import { TimerMode } from '@/types';
import { formatTime } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import { supabaseStorage } from '@/utils/supabaseStorage';

interface Position {
  x: number;
  y: number;
}

export const EnhancedTimerOverlay = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 20, y: 20 });
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  const {
    currentTimer,
    tasks,
    startTimer,
    pauseTimer,
    stopTimer,
    resetTimer
  } = useAppStore();

  const currentTask = tasks.find(task => task.id === currentTimer.taskId);
  const timerSettings = supabaseStorage.getTimerSettings();

  // Show overlay when timer is active
  useEffect(() => {
    setIsVisible(currentTimer.taskId !== null);
  }, [currentTimer.taskId]);

  // Calculate progress for different timer modes
  const getProgress = () => {
    if (currentTimer.mode === TimerMode.COUNTDOWN && currentTask?.estimateMinutes) {
      return Math.min((currentTimer.elapsed / (currentTask.estimateMinutes * 60)) * 100, 100);
    }
    if (currentTimer.mode === TimerMode.POMODORO) {
      const workMinutes = currentTimer.isBreak 
        ? timerSettings.pomodoroBreakMinutes 
        : timerSettings.pomodoroWorkMinutes;
      return Math.min((currentTimer.elapsed / (workMinutes * 60)) * 100, 100);
    }
    return 0;
  };

  const getTimeRemaining = () => {
    if (currentTimer.mode === TimerMode.COUNTDOWN && currentTask?.estimateMinutes) {
      const remaining = (currentTask.estimateMinutes * 60) - currentTimer.elapsed;
      return Math.max(remaining, 0);
    }
    if (currentTimer.mode === TimerMode.POMODORO) {
      const workMinutes = currentTimer.isBreak 
        ? timerSettings.pomodoroBreakMinutes 
        : timerSettings.pomodoroWorkMinutes;
      const remaining = (workMinutes * 60) - currentTimer.elapsed;
      return Math.max(remaining, 0);
    }
    return currentTimer.elapsed;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMinimized) return;
    
    setIsDragging(true);
    const rect = (e.target as HTMLElement).closest('[data-timer-overlay]')?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Constrain to viewport
    const maxX = window.innerWidth - 300;
    const maxY = window.innerHeight - 200;
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Dock to edges when near screen boundaries
  useEffect(() => {
    if (!isDragging && isVisible) {
      const threshold = 50;
      const newPosition = { ...position };
      
      if (position.x < threshold) newPosition.x = 20;
      if (position.x > window.innerWidth - 300 - threshold) newPosition.x = window.innerWidth - 320;
      if (position.y < threshold) newPosition.y = 20;
      if (position.y > window.innerHeight - 200 - threshold) newPosition.y = window.innerHeight - 220;
      
      if (newPosition.x !== position.x || newPosition.y !== position.y) {
        setPosition(newPosition);
      }
    }
  }, [isDragging, position, isVisible]);

  const handleToggleTimer = () => {
    if (currentTimer.isRunning) {
      pauseTimer();
    } else if (currentTimer.taskId) {
      startTimer(currentTimer.taskId, currentTimer.mode);
    }
  };

  const handleStopTimer = () => {
    stopTimer();
    setIsVisible(false);
  };

  const getTimerIcon = () => {
    if (currentTimer.mode === TimerMode.POMODORO) {
      return currentTimer.isBreak ? Coffee : Target;
    }
    return Clock;
  };

  const getTimerLabel = () => {
    if (currentTimer.mode === TimerMode.POMODORO) {
      if (currentTimer.isBreak) {
        return `Break ${currentTimer.pomodoroCount + 1}`;
      }
      return `Pomodoro ${currentTimer.pomodoroCount + 1}`;
    }
    if (currentTimer.mode === TimerMode.COUNTDOWN) {
      return 'Countdown';
    }
    return 'Focus Time';
  };

  if (!isVisible) return null;

  const TimerIcon = getTimerIcon();
  const progress = getProgress();
  const timeDisplay = currentTimer.mode === TimerMode.CONTINUOUS 
    ? formatTime(currentTimer.elapsed)
    : formatTime(getTimeRemaining());

  // Minimized view
  if (isMinimized) {
    return (
      <Card 
        className={cn(
          "fixed z-50 p-2 shadow-xl bg-card/95 backdrop-blur-sm border-primary/20 cursor-pointer hover:scale-105 transition-all duration-200",
          currentTimer.isRunning && "animate-pulse-focus"
        )}
        style={{ 
          left: position.x, 
          top: position.y,
          userSelect: 'none'
        }}
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center gap-2">
          <TimerIcon className={cn(
            "h-4 w-4",
            currentTimer.isRunning ? "text-focus-active" : "text-focus-paused"
          )} />
          <span className="text-sm font-mono font-medium">
            {timeDisplay}
          </span>
          {progress > 0 && (
            <div className="w-8 h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Full view
  return (
    <Card 
      data-timer-overlay
      className={cn(
        "fixed z-50 w-80 shadow-2xl bg-card/95 backdrop-blur-sm border-primary/20 transition-all duration-300 animate-fade-in",
        isDragging && "cursor-grabbing",
        !isDragging && "cursor-grab"
      )}
      style={{ 
        left: position.x, 
        top: position.y,
        userSelect: 'none'
      }}
    >
      {/* Header */}
      <div 
        className="p-4 border-b border-border"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TimerIcon className={cn(
              "h-5 w-5",
              currentTimer.isRunning ? "text-focus-active" : "text-focus-paused"
            )} />
            <div>
              <h3 className="font-semibold text-sm">{getTimerLabel()}</h3>
              <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                {currentTask?.title || 'No task selected'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsMinimized(true)}
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleStopTimer}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Timer Display */}
      <div className="p-6 text-center">
        <div className="mb-4">
          <div className={cn(
            "text-4xl font-mono font-bold transition-colors duration-200",
            currentTimer.isRunning ? "text-focus-active" : "text-foreground"
          )}>
            {timeDisplay}
          </div>
          
          {currentTimer.mode !== TimerMode.CONTINUOUS && (
            <div className="mt-2">
              <Progress 
                value={progress} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(progress)}% complete
              </p>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="mb-4">
          <Badge 
            variant={currentTimer.isRunning ? "default" : "secondary"}
            className={cn(
              "gap-2",
              currentTimer.isRunning && "bg-focus-active/10 text-focus-active border-focus-active/20",
              currentTimer.isBreak && "bg-orange-500/10 text-orange-600 border-orange-500/20"
            )}
          >
            {currentTimer.isRunning ? (
              currentTimer.isBreak ? 'Break Time' : 'Focusing...'
            ) : (
              'Paused'
            )}
          </Badge>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleTimer}
            className="gap-2"
          >
            {currentTimer.isRunning ? (
              <>
                <Pause className="h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Resume
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={resetTimer}
            className="gap-2"
          >
            Reset
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={handleStopTimer}
            className="gap-2"
          >
            <Square className="h-4 w-4" />
            Stop
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      {currentTimer.mode === TimerMode.POMODORO && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Session {currentTimer.pomodoroCount + 1}</span>
            <span>
              Next: {currentTimer.isBreak ? 'Work' : 'Break'}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};