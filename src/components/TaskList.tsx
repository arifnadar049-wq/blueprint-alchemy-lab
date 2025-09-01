import React from 'react';
import { Plus, Play, Clock, Calendar, CheckCircle2, Circle, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/store/useAppStore';
import { TaskStatus } from '@/types';
import { formatDate, formatDuration, getTaskProgress, isOverdue, sortTasksByPriority } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import { TaskForm } from './TaskForm';
import { TaskEditForm } from './TaskEditForm';
import { format, isToday } from 'date-fns';

export const TaskList = () => {
  const { 
    tasks, 
    lists, 
    selectedListId, 
    selectedTask,
    setSelectedTask, 
    startTimer,
    completeTask,
    deleteTask,
    currentTimer
  } = useAppStore();

  const selectedList = lists.find(list => list.id === selectedListId);
  
  const filteredTasks = (() => {
    if (selectedListId === 'backlog') {
      return tasks; // All tasks
    } else if (selectedListId === 'today') {
      return tasks.filter(task => {
        if (!task.dueDate) return false;
        const today = new Date();
        const dueDate = new Date(task.dueDate);
        return dueDate.toDateString() === today.toDateString();
      });
    } else if (selectedListId === 'week') {
      return tasks.filter(task => {
        if (!task.dueDate) return false;
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const weekEnd = new Date(now.setDate(weekStart.getDate() + 6));
        const dueDate = new Date(task.dueDate);
        return dueDate >= weekStart && dueDate <= weekEnd;
      });
    } else if (selectedListId === 'completed') {
      // Show only today's completed tasks
      return tasks.filter(task => 
        task.status === TaskStatus.COMPLETED && 
        task.completedAt && 
        isToday(new Date(task.completedAt))
      );
    } else {
      return tasks.filter(task => task.listId === selectedListId);
    }
  })();
  
  const sortedTasks = sortTasksByPriority(filteredTasks);

  const handleTaskClick = (task: typeof tasks[0]) => {
    setSelectedTask(task);
  };

  const handleStartTimer = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    startTimer(taskId, currentTimer.mode);
  };

  const handleCompleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    completeTask(taskId);
  };

  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      await deleteTask(taskId);
    }
  };

  const getStatusIcon = (status: TaskStatus, taskId: string) => {
    if (status === TaskStatus.COMPLETED) {
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    }
    
    if (currentTimer.taskId === taskId && currentTimer.isRunning) {
      return <Play className="h-4 w-4 text-focus-active animate-pulse-focus" />;
    }
    
    return <Circle className="h-4 w-4 text-muted-foreground" />;
  };

  const renderTask = (task: typeof tasks[0]) => {
    const progress = getTaskProgress(task);
    const overdue = isOverdue(task);
    const isSelected = selectedTask?.id === task.id;
    const isActive = currentTimer.taskId === task.id;

    return (
      <Card
        key={task.id}
        className={cn(
          "group p-4 cursor-pointer transition-all duration-200 hover:shadow-medium",
          isSelected && "ring-2 ring-primary ring-offset-2",
          isActive && "bg-primary-light/10 border-primary/30",
          overdue && task.status !== TaskStatus.COMPLETED && "border-destructive/30 bg-destructive/5"
        )}
        onClick={() => handleTaskClick(task)}
      >
        <div className="flex items-start gap-3">
          {/* Status Icon */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 mt-0.5"
            onClick={(e) => handleCompleteTask(task.id, e)}
          >
            {getStatusIcon(task.status, task.id)}
          </Button>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  "font-medium text-card-foreground leading-5",
                  task.status === TaskStatus.COMPLETED && "line-through text-muted-foreground"
                )}>
                  {task.title}
                </h3>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Timer Button - only for incomplete tasks */}
                {task.status !== TaskStatus.COMPLETED && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => handleStartTimer(task.id, e)}
                    title="Start Timer"
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                )}
                
                {/* Edit Button - for all tasks except completed section */}
                {selectedListId !== 'completed' && (
                  <TaskEditForm task={task} trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      title="Edit Task"
                    >
                      <Calendar className="h-3 w-3" />
                    </Button>
                  } />
                )}
                
                {/* Delete Button - only for non-completed sections */}
                {selectedListId !== 'completed' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:text-destructive"
                    onClick={(e) => handleDeleteTask(task.id, e)}
                    title="Delete Task"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Task Details */}
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              {/* Estimate */}
              {task.estimateMinutes && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDuration(task.estimateMinutes)}</span>
                </div>
              )}

              {/* Due Date */}
              {task.dueDate && (
                <div className={cn(
                  "flex items-center gap-1",
                  overdue && "text-destructive"
                )}>
                  {overdue && <AlertTriangle className="h-3 w-3" />}
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(task.dueDate)}</span>
                  {task.dueTime && <span>at {task.dueTime}</span>}
                </div>
              )}

              {/* Status Badge */}
              {task.status === TaskStatus.IN_PROGRESS && (
                <Badge variant="secondary" className="text-xs bg-focus-active/10 text-focus-active">
                  In Progress
                </Badge>
              )}
            </div>

            {/* Subtasks Progress */}
            {task.subtasks.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>
                    {task.subtasks.filter(s => s.completed).length} of {task.subtasks.length} subtasks
                  </span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-1" />
              </div>
            )}

            {/* Notes Preview */}
            {task.notes && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {task.notes}
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">
              {selectedListId === 'backlog' ? 'Backlog' : 
               selectedListId === 'today' ? 'Today' :
               selectedListId === 'week' ? 'This Week' :
               selectedListId === 'completed' ? 'Completed Today' :
               selectedList?.name || 'Tasks'}
            </h1>
            <Badge variant="secondary">
              {selectedListId === 'completed' 
                ? filteredTasks.length 
                : filteredTasks.filter(t => t.status !== TaskStatus.COMPLETED).length
              }
            </Badge>
          </div>
          {/* Only show TaskForm for non-completed sections */}
          {selectedListId !== 'completed' && <TaskForm />}
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-6">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              {selectedListId === 'completed' ? (
                <>
                  <p className="text-lg">No tasks completed today</p>
                  <p className="text-sm">Complete some tasks to see them here</p>
                </>
              ) : (
                <>
                  <p className="text-lg">No tasks in this list</p>
                  <p className="text-sm">Create your first task to get started</p>
                </>
              )}
            </div>
            {/* Only show TaskForm for non-completed sections */}
            {selectedListId !== 'completed' && <TaskForm />}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTasks.map(renderTask)}
          </div>
        )}
      </div>
    </div>
  );
};