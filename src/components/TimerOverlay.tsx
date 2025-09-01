import React, { useState } from 'react';
import { X, Minimize2, Maximize2, Play, Pause, Square, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { formatTime } from '@/utils/helpers';
import { cn } from '@/lib/utils';

export const TimerOverlay = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDocked, setIsDocked] = useState(false);
  const [position, setPosition] = useState({ top: 100, right: 100 });
  
  const {
    currentTimer,
    startTimer,
    pauseTimer,
    stopTimer,
    resetTimer,
    tasks
  } = useAppStore();

  const getCurrentTask = () => {
    if (!currentTimer.taskId) return null;
    return tasks.find(task => task.id === currentTimer.taskId);
  };

  const currentTask = getCurrentTask();

  if (!currentTimer.taskId) return null;

  const handleTimerToggle = () => {
    if (currentTimer.isRunning) {
      pauseTimer();
    } else {
      startTimer(currentTimer.taskId!, currentTimer.mode);
    }
  };

  const getTimerModeColor = () => {
    if (currentTimer.isBreak) return 'bg-focus-break';
    return currentTimer.isRunning ? 'bg-focus-active' : 'bg-focus-paused';
  };

  const getTimerModeText = () => {
    if (currentTimer.isBreak) return 'Break';
    return currentTimer.mode.charAt(0).toUpperCase() + currentTimer.mode.slice(1);
  };

  if (isMinimized) {
    return (
      <Card 
        className={cn(
          "timer-floating w-48 p-3 bg-card/95 backdrop-blur-md border",
          isDocked ? "top-4 right-4" : ""
        )}
        style={!isDocked ? { top: position.top, right: position.right } : {}}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              getTimerModeColor(),
              currentTimer.isRunning && "animate-pulse-focus"
            )} />
            <span className="text-sm font-mono font-medium">
              {formatTime(currentTimer.elapsed)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(false)}
            className="h-6 w-6 p-0"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "timer-floating w-80 p-4 bg-card/95 backdrop-blur-md border",
        isDocked ? "top-4 right-4" : ""
      )}
      style={!isDocked ? { top: position.top, right: position.right } : {}}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <Badge variant="outline" className={cn("text-xs", getTimerModeColor(), "text-white")}>
          {getTimerModeText()}
        </Badge>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(true)}
            className="h-6 w-6 p-0"
          >
            <Minimize2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={stopTimer}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Task Info */}
      <div className="mb-4">
        <h3 className="font-medium text-foreground truncate">
          {currentTask?.title || 'Unknown Task'}
        </h3>
        {currentTask?.estimateMinutes && (
          <p className="text-sm text-muted-foreground">
            Estimated: {currentTask.estimateMinutes}m
          </p>
        )}
      </div>

      {/* Timer Display */}
      <div className="text-center mb-4">
        <div className="text-3xl font-mono font-bold text-foreground">
          {formatTime(currentTimer.elapsed)}
        </div>
        {currentTimer.mode === 'pomodoro' && (
          <div className="text-sm text-muted-foreground mt-1">
            Cycle {currentTimer.pomodoroCount + 1}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleTimerToggle}
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
              Start
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={stopTimer}
          className="gap-2"
        >
          <Square className="h-4 w-4" />
          Stop
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={resetTimer}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      {/* Pomodoro Progress */}
      {currentTimer.mode === 'pomodoro' && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{currentTimer.pomodoroCount}/4</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1">
            <div 
              className="bg-focus-active h-1 rounded-full transition-all duration-300"
              style={{ width: `${(currentTimer.pomodoroCount / 4) * 100}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  );
};