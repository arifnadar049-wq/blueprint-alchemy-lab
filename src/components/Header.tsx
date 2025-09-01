import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Play, Pause, Square, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { formatTime } from '@/utils/helpers';
import { QuickAdd } from './QuickAdd';
import { BrandLogo } from './BrandLogo';
import { cn } from '@/lib/utils';

export const Header = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { 
    currentTimer, 
    startTimer, 
    pauseTimer, 
    stopTimer,
    tasks,
    selectedTask 
  } = useAppStore();

  const handleGlobalTimerToggle = () => {
    if (currentTimer.isRunning) {
      pauseTimer();
    } else if (currentTimer.taskId) {
      startTimer(currentTimer.taskId, currentTimer.mode);
    }
  };

  const handleGlobalTimerStop = () => {
    stopTimer();
  };

  const getCurrentTask = () => {
    if (!currentTimer.taskId) return null;
    return tasks.find(task => task.id === currentTimer.taskId);
  };

  const currentTask = getCurrentTask();

  return (
    <div className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Brand, Quick Add & Search */}
        <div className="flex items-center gap-4 flex-1">
          <BrandLogo size="sm" showText={false} />
          <QuickAdd />
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks, habits, or lists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-[250px] bg-muted/50 border-border focus:bg-background"
            />
          </div>
        </div>

        {/* Center: Current Timer Info */}
        {currentTimer.taskId && (
          <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
            <div className={cn(
              "w-2 h-2 rounded-full",
              currentTimer.isRunning ? "bg-focus-active animate-pulse-focus" : "bg-focus-paused"
            )} />
            <div className="text-sm">
              <div className="font-medium text-foreground truncate max-w-[200px]">
                {currentTask?.title || 'Unknown Task'}
              </div>
              <div className="text-muted-foreground font-mono">
                {formatTime(currentTimer.elapsed)}
              </div>
            </div>
          </div>
        )}

        {/* Right: Timer Controls & Actions */}
        <div className="flex items-center gap-2">
          {currentTimer.taskId && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGlobalTimerToggle}
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
                onClick={handleGlobalTimerStop}
                className="gap-2"
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
            </>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2 text-foreground hover:bg-muted"
            onClick={() => navigate('/profile')}
          >
            <User className="h-4 w-4" />
            Profile
          </Button>
          
          <Badge variant="secondary" className="bg-gradient-primary text-primary-foreground font-semibold">
            GRIT Mode
          </Badge>
        </div>
      </div>
    </div>
  );
};