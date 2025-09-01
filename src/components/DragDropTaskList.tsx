import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Play, CheckCircle2, Clock, Calendar, Flag, GripVertical, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/store/useAppStore';
import { Task, TaskStatus, TaskPriority, TimerMode } from '@/types';
import { formatDuration, isOverdue } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface SortableTaskItemProps {
  task: Task;
  isActive?: boolean;
  isSelected?: boolean;
  onTaskClick: (task: Task) => void;
  onStartTimer: (task: Task) => void;
  onCompleteTask: (task: Task) => void;
  onSelectionChange: (taskId: string, selected: boolean) => void;
  showSelection?: boolean;
}

const SortableTaskItem = ({
  task,
  isActive,
  isSelected,
  onTaskClick,
  onStartTimer,
  onCompleteTask,
  onSelectionChange,
  showSelection = false
}: SortableTaskItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const { currentTimer } = useAppStore();
  const isTimerActive = currentTimer.taskId === task.id && currentTimer.isRunning;
  const overdue = task.dueDate && new Date() > task.dueDate;
  const completed = task.status === TaskStatus.COMPLETED;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case TaskPriority.URGENT: return 'text-red-600 bg-red-50';
      case TaskPriority.HIGH: return 'text-orange-600 bg-orange-50';
      case TaskPriority.MEDIUM: return 'text-blue-600 bg-blue-50';
      case TaskPriority.LOW: return 'text-green-600 bg-green-50';
      case TaskPriority.LOWEST: return 'text-gray-600 bg-gray-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getPriorityName = (priority: number) => {
    switch (priority) {
      case TaskPriority.URGENT: return 'Urgent';
      case TaskPriority.HIGH: return 'High';
      case TaskPriority.MEDIUM: return 'Medium';
      case TaskPriority.LOW: return 'Low';
      case TaskPriority.LOWEST: return 'Lowest';
      default: return 'Medium';
    }
  };

  const subtasksCompleted = task.subtasks.filter(st => st.completed).length;
  const subtasksTotal = task.subtasks.length;
  const subtasksProgress = subtasksTotal > 0 ? (subtasksCompleted / subtasksTotal) * 100 : 0;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group transition-all duration-200 hover:shadow-md",
        isActive && "ring-2 ring-primary ring-offset-2",
        isTimerActive && "bg-focus-active/5 border-focus-active",
        overdue && !completed && "border-destructive/50 bg-destructive/5",
        completed && "opacity-75",
        isSelected && "ring-2 ring-primary/50",
        isDragging && "shadow-lg scale-105"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Selection Checkbox */}
          {showSelection && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelectionChange(task.id, !!checked)}
              className="mt-1"
            />
          )}

          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3 
                  className={cn(
                    "font-medium text-sm cursor-pointer hover:text-primary transition-colors",
                    completed && "line-through text-muted-foreground"
                  )}
                  onClick={() => onTaskClick(task)}
                >
                  {task.title}
                </h3>
                
                {task.notes && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {task.notes}
                  </p>
                )}
              </div>

              {/* Priority Badge */}
              {task.priority !== TaskPriority.MEDIUM && (
                <Badge variant="secondary" className={cn("text-xs", getPriorityColor(task.priority))}>
                  <Flag className="h-3 w-3 mr-1" />
                  {getPriorityName(task.priority)}
                </Badge>
              )}
            </div>

            {/* Metadata Row */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
              {task.estimateMinutes && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(task.estimateMinutes)}
                </div>
              )}
              
              {task.dueDate && (
                <div className={cn(
                  "flex items-center gap-1",
                  overdue && !completed && "text-destructive font-medium"
                )}>
                  <Calendar className="h-3 w-3" />
                  {task.dueDate.toLocaleDateString()}
                  {task.dueTime && ` ${task.dueTime}`}
                </div>
              )}

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  {task.tags.slice(0, 2).map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="text-xs px-1 py-0"
                      style={{ borderColor: tag.color, color: tag.color }}
                    >
                      #{tag.name}
                    </Badge>
                  ))}
                  {task.tags.length > 2 && (
                    <span className="text-xs">+{task.tags.length - 2}</span>
                  )}
                </div>
              )}
            </div>

            {/* Subtasks Progress */}
            {subtasksTotal > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Subtasks</span>
                  <span>{subtasksCompleted}/{subtasksTotal}</span>
                </div>
                <Progress value={subtasksProgress} className="h-1" />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {!completed && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartTimer(task);
                      }}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCompleteTask(task);
                      }}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskClick(task);
                  }}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>

              {/* Status Badge */}
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs",
                  task.status === TaskStatus.COMPLETED && "bg-success/10 text-success",
                  task.status === TaskStatus.IN_PROGRESS && "bg-focus-active/10 text-focus-active",
                  isTimerActive && "bg-focus-active text-focus-active-foreground animate-pulse"
                )}
              >
                {isTimerActive ? 'Active' : task.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface DragDropTaskListProps {
  listId: string;
  tasks: Task[];
  selectedTaskIds?: string[];
  showSelection?: boolean;
  onSelectionChange?: (taskId: string, selected: boolean) => void;
}

export const DragDropTaskList = ({ 
  listId, 
  tasks, 
  selectedTaskIds = [], 
  showSelection = false,
  onSelectionChange = () => {}
}: DragDropTaskListProps) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const { 
    selectedTask, 
    setSelectedTask, 
    startTimer, 
    completeTask, 
    updateTask,
    lists
  } = useAppStore();
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const sortedTasks = [...tasks].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    // Handle moving between lists
    const overContainer = over.data.current?.sortable?.containerId || over.id;
    if (overContainer !== listId && typeof overContainer === 'string') {
      // Moving to different list
      updateTask(activeTask.id, { 
        listId: overContainer,
        orderIndex: 0 // Place at top of new list
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeIndex = sortedTasks.findIndex(task => task.id === active.id);
    const overIndex = sortedTasks.findIndex(task => task.id === over.id);

    if (activeIndex === overIndex) return;

    // Reorder tasks within the same list
    const reorderedTasks = [...sortedTasks];
    const [movedTask] = reorderedTasks.splice(activeIndex, 1);
    reorderedTasks.splice(overIndex, 0, movedTask);

    // Update order indices
    reorderedTasks.forEach((task, index) => {
      updateTask(task.id, { orderIndex: index });
    });

    const listName = lists.find(l => l.id === listId)?.name || 'list';
    toast({
      title: "Task reordered",
      description: `"${movedTask.title}" moved within ${listName}`,
    });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleStartTimer = (task: Task) => {
    startTimer(task.id, TimerMode.CONTINUOUS);
    toast({
      title: "Timer started",
      description: `Working on "${task.title}"`,
    });
  };

  const handleCompleteTask = async (task: Task) => {
    await completeTask(task.id);
    toast({
      title: "Task completed",
      description: `"${task.title}" marked as complete`,
    });
  };

  if (sortedTasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No tasks in this list</p>
        <p className="text-sm">Create a new task to get started</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sortedTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {sortedTasks.map((task) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              isActive={selectedTask?.id === task.id}
              isSelected={selectedTaskIds.includes(task.id)}
              onTaskClick={handleTaskClick}
              onStartTimer={handleStartTimer}
              onCompleteTask={handleCompleteTask}
              onSelectionChange={onSelectionChange}
              showSelection={showSelection}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeTask ? (
          <div className="rotate-6 opacity-90">
            <SortableTaskItem
              task={activeTask}
              onTaskClick={() => {}}
              onStartTimer={() => {}}
              onCompleteTask={() => {}}
              onSelectionChange={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};