import React, { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/useAppStore';
import { TaskStatus } from '@/types';
import { CheckCircle, Clock, Zap, Trophy, Target } from 'lucide-react';

export const NotificationSystem = () => {
  const { toast } = useToast();
  const { tasks, currentTimer, sessions } = useAppStore();

  // Task completion notifications
  useEffect(() => {
    const completedTasks = tasks.filter(task => task.status === TaskStatus.COMPLETED);
    const lastCompleted = completedTasks[completedTasks.length - 1];
    
    if (lastCompleted) {
      const timeSinceCompletion = Date.now() - new Date(lastCompleted.updatedAt).getTime();
      
      // Only show notification if task was completed in the last 5 seconds
      if (timeSinceCompletion < 5000) {
        toast({
          title: "Task Completed! 🎉",
          description: `Great job completing "${lastCompleted.title}"`,
          duration: 4000,
        });

        // Check for streak milestones
        const todayCompleted = tasks.filter(task => {
          const today = new Date();
          const taskDate = new Date(task.updatedAt);
          return task.status === TaskStatus.COMPLETED && 
                 taskDate.toDateString() === today.toDateString();
        });

        if (todayCompleted.length === 5) {
          toast({
            title: "Daily Warrior! 🏆",
            description: "You've completed 5 tasks today!",
            duration: 6000,
          });
        } else if (todayCompleted.length === 10) {
          toast({
            title: "Productivity Legend! 👑",
            description: "Amazing! 10 tasks completed today!",
            duration: 6000,
          });
        }
      }
    }
  }, [tasks, toast]);

  // Timer notifications
  useEffect(() => {
    if (!currentTimer.isRunning) return;

    let notificationTimeout: NodeJS.Timeout;

    // Pomodoro notifications
    if (currentTimer.mode === 'pomodoro') {
      const workDuration = 25 * 60; // 25 minutes in seconds
      const breakDuration = 5 * 60; // 5 minutes in seconds
      
      if (!currentTimer.isBreak && currentTimer.elapsed >= workDuration) {
        toast({
          title: "Pomodoro Complete! 🍅",
          description: "Time for a well-deserved break!",
          duration: 5000,
        });
      } else if (currentTimer.isBreak && currentTimer.elapsed >= breakDuration) {
        toast({
          title: "Break's Over! ⚡",
          description: "Ready to focus again?",
          duration: 5000,
        });
      }
    }

    // Long session notifications
    const sessionMinutes = Math.floor(currentTimer.elapsed / 60);
    if (sessionMinutes > 0 && sessionMinutes % 30 === 0) { // Every 30 minutes
      toast({
        title: `${sessionMinutes} Minutes Focused! 🔥`,
        description: "Keep up the great work!",
        duration: 3000,
      });
    }

    return () => {
      if (notificationTimeout) clearTimeout(notificationTimeout);
    };
  }, [currentTimer, toast]);

  // Achievement notifications
  useEffect(() => {
    const completedTasksCount = tasks.filter(task => task.status === TaskStatus.COMPLETED).length;
    const totalFocusHours = Math.floor(
      sessions.reduce((total, session) => total + session.workSeconds, 0) / 3600
    );

    // Achievement milestones
    const achievements = [
      { count: 1, title: "First Steps! 🎯", description: "You completed your first task!" },
      { count: 5, title: "Getting Started! 🚀", description: "5 tasks completed!" },
      { count: 10, title: "Task Master! 💪", description: "10 tasks under your belt!" },
      { count: 25, title: "Productivity Pro! ⭐", description: "25 tasks completed!" },
      { count: 50, title: "Achievement Hunter! 🏆", description: "50 tasks conquered!" },
      { count: 100, title: "Productivity Legend! 👑", description: "100 tasks completed!" }
    ];

    const currentAchievement = achievements.find(achievement => 
      achievement.count === completedTasksCount
    );

    if (currentAchievement) {
      toast({
        title: currentAchievement.title,
        description: currentAchievement.description,
        duration: 6000,
      });
    }

    // Focus time achievements
    const focusAchievements = [
      { hours: 1, title: "Focus Beginner! ⏱️", description: "1 hour of focused work!" },
      { hours: 5, title: "Focus Warrior! ⚔️", description: "5 hours of deep focus!" },
      { hours: 10, title: "Focus Master! 🧠", description: "10 hours of concentrated work!" },
      { hours: 25, title: "Focus Legend! 🌟", description: "25 hours of pure focus!" }
    ];

    const currentFocusAchievement = focusAchievements.find(achievement => 
      achievement.hours === totalFocusHours
    );

    if (currentFocusAchievement) {
      toast({
        title: currentFocusAchievement.title,
        description: currentFocusAchievement.description,
        duration: 6000,
      });
    }
  }, [tasks, sessions, toast]);

  // Due date reminders
  useEffect(() => {
    const now = new Date();
    const upcomingTasks = tasks.filter(task => {
      if (!task.dueDate || task.status === TaskStatus.COMPLETED) return false;
      
      const dueDate = new Date(task.dueDate);
      const timeDiff = dueDate.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 3600);
      
      // Notify for tasks due in 1 hour or overdue
      return hoursDiff <= 1 && hoursDiff >= -24;
    });

    upcomingTasks.forEach(task => {
      const dueDate = new Date(task.dueDate!);
      const timeDiff = dueDate.getTime() - now.getTime();
      const isOverdue = timeDiff < 0;
      
      if (isOverdue) {
        toast({
          title: "Overdue Task! ⚠️",
          description: `"${task.title}" was due ${Math.abs(Math.floor(timeDiff / (1000 * 3600)))} hours ago`,
          duration: 8000,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Task Due Soon! 📅",
          description: `"${task.title}" is due in ${Math.ceil(timeDiff / (1000 * 3600))} hour(s)`,
          duration: 6000,
        });
      }
    });
  }, [tasks, toast]);

  return null; // This component doesn't render anything visible
};