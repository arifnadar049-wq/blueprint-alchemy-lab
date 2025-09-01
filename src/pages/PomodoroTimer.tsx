import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, RotateCcw, Settings, ArrowLeft, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PomodoroTimer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [totalCycles, setTotalCycles] = useState(4);
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [totalWorkSeconds, setTotalWorkSeconds] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
        
        // Track work time
        if (!isBreak) {
          setTotalWorkSeconds(prev => prev + 1);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, isBreak]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    
    // Play notification sound (if supported)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(isBreak ? 'Break time is over!' : 'Work session complete!', {
        body: isBreak ? 'Time to get back to work' : 'Take a well-deserved break',
        icon: '/favicon.ico'
      });
    }

    if (isBreak) {
      // Break is over, start next work session
      setIsBreak(false);
      setTimeLeft(workDuration * 60);
      setCurrentCycle(prev => prev + 1);
      toast({
        title: "Break finished!",
        description: "Ready for your next work session?",
      });
    } else {
      // Work session is over, start break
      setIsBreak(true);
      const isLongBreak = currentCycle % 4 === 0;
      const breakTime = isLongBreak ? longBreakDuration : breakDuration;
      setTimeLeft(breakTime * 60);
      toast({
        title: "Work session complete!",
        description: `Time for a ${isLongBreak ? 'long' : 'short'} break`,
      });
    }
  };

  const startTimer = () => {
    setIsRunning(true);
    if (!sessionStartTime) {
      setSessionStartTime(new Date());
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(workDuration * 60);
    setCurrentCycle(1);
    setSessionStartTime(null);
    setTotalWorkSeconds(0);
  };

  const stopTimer = async () => {
    setIsRunning(false);
    
    // Save session to database if there was work time
    if (totalWorkSeconds > 0 && sessionStartTime) {
      try {
        await supabase
          .from('pomodoro_sessions')
          .insert([{
            work_seconds: totalWorkSeconds,
            break_seconds: 0, // We don't track break time separately for now
            started_at: sessionStartTime.toISOString(),
            ended_at: new Date().toISOString()
          }]);
          
        toast({
          title: "Session saved!",
          description: `${Math.round(totalWorkSeconds / 60)} minutes of productive work recorded.`,
        });
      } catch (error) {
        console.error('Error saving session:', error);
      }
    }
    
    navigate('/');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const totalTime = isBreak 
      ? (currentCycle % 4 === 0 ? longBreakDuration : breakDuration) * 60
      : workDuration * 60;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Pomodoro Timer</h1>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Timer Card */}
        <Card className="bg-card/95 backdrop-blur-md border shadow-elegant">
          <CardContent className="p-8 text-center space-y-6">
            {/* Status Badge */}
            <div className="flex justify-center">
              <Badge 
                variant={isBreak ? "secondary" : "default"} 
                className="gap-2 text-sm px-4 py-2"
              >
                {isBreak ? (
                  <>
                    <Coffee className="h-4 w-4" />
                    {currentCycle % 4 === 0 ? 'Long Break' : 'Short Break'}
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Work Session
                  </>
                )}
              </Badge>
            </div>

            {/* Timer Display */}
            <div className="space-y-4">
              <div className="text-6xl font-mono font-bold text-foreground">
                {formatTime(timeLeft)}
              </div>
              
              {/* Progress Bar */}
              <Progress value={getProgress()} className="h-2" />
              
              <div className="text-sm text-muted-foreground">
                Cycle {currentCycle} of {totalCycles}
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-3">
              <Button
                size="lg"
                onClick={isRunning ? pauseTimer : startTimer}
                className="gap-2 px-8"
              >
                {isRunning ? (
                  <>
                    <Pause className="h-5 w-5" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    Start
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={resetTimer}
                className="gap-2"
              >
                <RotateCcw className="h-5 w-5" />
                Reset
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={stopTimer}
                className="gap-2"
              >
                <Square className="h-5 w-5" />
                Stop
              </Button>
            </div>

            {/* Session Stats */}
            {totalWorkSeconds > 0 && (
              <div className="pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Productive time this session: {Math.round(totalWorkSeconds / 60)} minutes
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cycle Progress */}
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: totalCycles }, (_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-colors ${
                index < currentCycle - 1
                  ? 'bg-primary'
                  : index === currentCycle - 1
                  ? 'bg-primary/50'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;