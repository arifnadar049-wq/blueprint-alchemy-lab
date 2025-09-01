import React from 'react';
import { X, Play, Clock, Calendar, CheckCircle2, Circle, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store/useAppStore';
import { TaskStatus, TimerMode } from '@/types';
import { formatDate, formatDuration, getTaskProgress } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import { TaskEditForm } from './TaskEditForm';

export const TaskDetail = () => {
  const { 
    selectedTask, 
    setSelectedTask, 
    updateTask, 
    startTimer,
    currentTimer,
    completeTask,
    lists
  } = useAppStore();

  if (!selectedTask) return null;

  const progress = getTaskProgress(selectedTask);
  const isActive = currentTimer.taskId === selectedTask.id;
  const currentList = lists.find(list => list.id === selectedTask.listId);

  const handleClose = () => {
    setSelectedTask(null);
  };

  const handleStartTimer = (mode: TimerMode = TimerMode.CONTINUOUS) => {
    startTimer(selectedTask.id, mode);
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    const updatedSubtasks = selectedTask.subtasks.map(subtask =>
      subtask.id === subtaskId 
        ? { ...subtask, completed: !subtask.completed }
        : subtask
    );
    await updateTask(selectedTask.id, { subtasks: updatedSubtasks });
  };

  const renderNotes = (notes: string) => {
    if (!notes) return null;
    
    // Simple markdown-like rendering
    return notes.split('\n').map((line, index) => {
      // Bold text
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italic text
      formattedLine = formattedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');
      // URLs
      formattedLine = formattedLine.replace(
        /(https?:\/\/[^\s]+)/g, 
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>'
      );
      
      return (
        <div 
          key={index} 
          dangerouslySetInnerHTML={{ __html: formattedLine }} 
          className={line.startsWith('#') ? 'font-semibold text-lg mt-3 mb-1' : ''}
        />
      );
    });
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="flex-1 mr-4">
            <h2 className="text-lg font-medium text-foreground leading-6">
              {selectedTask.title}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: currentList?.color }}
              />
              <span>in {currentList?.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TaskEditForm 
              task={selectedTask}
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Status and Quick Actions */}
        <div className="flex items-center gap-3 mt-4">
          <Badge 
            variant={selectedTask.status === TaskStatus.COMPLETED ? "default" : "secondary"}
            className={cn(
              selectedTask.status === TaskStatus.IN_PROGRESS && "bg-focus-active/10 text-focus-active",
              selectedTask.status === TaskStatus.COMPLETED && "bg-success/10 text-success"
            )}
          >
            {selectedTask.status.replace('_', ' ')}
          </Badge>
          
          {selectedTask.status !== TaskStatus.COMPLETED && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStartTimer(TimerMode.CONTINUOUS)}
              className={cn(
                "gap-2",
                isActive && "bg-focus-active/10 border-focus-active/30"
              )}
            >
              <Play className="h-3 w-3" />
              {isActive ? 'Running' : 'Start'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => completeTask(selectedTask.id)}
              className="gap-2"
            >
              <CheckCircle2 className="h-3 w-3" />
              Complete
            </Button>
          </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Task Details */}
          <div className="grid grid-cols-2 gap-4">
            {/* Estimate */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Estimate</label>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {selectedTask.estimateMinutes ? formatDuration(selectedTask.estimateMinutes) : 'Not set'}
                </span>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Due Date</label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {selectedTask.dueDate ? (
                    <>
                      {formatDate(selectedTask.dueDate)}
                      {selectedTask.dueTime && ` at ${selectedTask.dueTime}`}
                    </>
                  ) : (
                    'Not set'
                  )}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Notes</label>
            <div className="mt-2 text-sm text-foreground whitespace-pre-wrap">
              {selectedTask.notes ? renderNotes(selectedTask.notes) : (
                <span className="text-muted-foreground italic">No notes added</span>
              )}
            </div>
          </div>

          {/* Subtasks */}
          {selectedTask.subtasks.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-muted-foreground">
                    Subtasks ({selectedTask.subtasks.filter(s => s.completed).length}/{selectedTask.subtasks.length})
                  </label>
                  <span className="text-xs text-muted-foreground">{progress}% complete</span>
                </div>
                
                <div className="space-y-2">
                  {selectedTask.subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleToggleSubtask(subtask.id)}
                    >
                      {subtask.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={cn(
                        "text-sm",
                        subtask.completed && "line-through text-muted-foreground"
                      )}>
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Timer Modes */}
          {selectedTask.status !== TaskStatus.COMPLETED && (
            <>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Focus Modes</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStartTimer(TimerMode.CONTINUOUS)}
                    className="gap-2"
                  >
                    <Play className="h-3 w-3" />
                    Continuous
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStartTimer(TimerMode.COUNTDOWN)}
                    className="gap-2"
                    disabled={!selectedTask.estimateMinutes}
                  >
                    <Clock className="h-3 w-3" />
                    Countdown
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStartTimer(TimerMode.POMODORO)}
                    className="gap-2"
                  >
                    <Circle className="h-3 w-3" />
                    Pomodoro
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Choose a focus mode to start tracking time on this task
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};