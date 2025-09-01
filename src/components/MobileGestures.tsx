import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskStatus } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { CheckCircle, Trash2 } from 'lucide-react';

interface MobileGesturesProps {
  task: Task;
  children: React.ReactNode;
  onSwipeComplete?: () => void;
  onSwipeDelete?: () => void;
  onLongPress?: () => void;
}

export const MobileGestures: React.FC<MobileGesturesProps> = ({
  task,
  children,
  onSwipeComplete,
  onSwipeDelete,
  onLongPress
}) => {
  const { updateTask, deleteTask } = useAppStore();
  const [dragState, setDragState] = useState({
    isDragging: false,
    startX: 0,
    currentX: 0,
    deltaX: 0
  });
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startTimer = setTimeout(() => {
      // Long press detected
      onLongPress?.();
      // Add haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, 500);

    setLongPressTimer(startTimer);
    setDragState({
      isDragging: true,
      startX: touch.clientX,
      currentX: touch.clientX,
      deltaX: 0
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    if (!dragState.isDragging) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - dragState.startX;
    
    setDragState(prev => ({
      ...prev,
      currentX: touch.clientX,
      deltaX
    }));

    // Apply transform with resistance
    if (containerRef.current) {
      const resistance = Math.abs(deltaX) > 100 ? 0.7 : 1;
      const translateX = deltaX * resistance;
      containerRef.current.style.transform = `translateX(${translateX}px)`;
      
      // Update opacity based on swipe distance
      const opacity = Math.max(0.3, 1 - Math.abs(deltaX) / 200);
      containerRef.current.style.opacity = opacity.toString();
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    const { deltaX } = dragState;
    const threshold = 120;

    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        // Swipe right - complete task
        handleSwipeComplete();
      } else {
        // Swipe left - delete task
        handleSwipeDelete();
      }
    } else {
      // Reset position
      resetPosition();
    }

    setDragState({
      isDragging: false,
      startX: 0,
      currentX: 0,
      deltaX: 0
    });
  };

  const handleSwipeComplete = () => {
    if (task.status !== TaskStatus.COMPLETED) {
      updateTask(task.id, { 
        status: TaskStatus.COMPLETED,
        completedAt: new Date()
      });
    }
    onSwipeComplete?.();
    animateAndReset();
  };

  const handleSwipeDelete = () => {
    deleteTask(task.id);
    onSwipeDelete?.();
    animateAndReset();
  };

  const animateAndReset = () => {
    if (containerRef.current) {
      containerRef.current.style.transition = 'all 0.3s ease-out';
      containerRef.current.style.transform = 'translateX(0)';
      containerRef.current.style.opacity = '1';
      
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.transition = '';
        }
      }, 300);
    }
  };

  const resetPosition = () => {
    if (containerRef.current) {
      containerRef.current.style.transition = 'all 0.2s ease-out';
      containerRef.current.style.transform = 'translateX(0)';
      containerRef.current.style.opacity = '1';
      
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.transition = '';
        }
      }, 200);
    }
  };

  const getSwipeIndicator = () => {
    const { deltaX } = dragState;
    const threshold = 120;
    
    if (Math.abs(deltaX) < 50) return null;

    if (deltaX > 50) {
      return (
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          {deltaX > threshold && <span className="text-sm font-medium">Complete</span>}
        </div>
      );
    } else if (deltaX < -50) {
      return (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2 text-red-600">
          {deltaX < -threshold && <span className="text-sm font-medium">Delete</span>}
          <Trash2 className="h-5 w-5" />
        </div>
      );
    }

    return null;
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  return (
    <div className="relative overflow-hidden">
      {/* Swipe Indicators */}
      {dragState.isDragging && getSwipeIndicator()}
      
      {/* Main Content */}
      <div
        ref={containerRef}
        className="relative z-10 bg-background"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          touchAction: 'pan-y', // Allow vertical scrolling but capture horizontal
          userSelect: 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
};