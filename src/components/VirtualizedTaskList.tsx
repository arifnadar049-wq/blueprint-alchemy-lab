import React, { useMemo } from 'react';
import { Task, TimerMode, TaskStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, Calendar, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { MobileGestures } from './MobileGestures';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';

interface VirtualizedTaskListProps {
  tasks: Task[];
  height?: number;
  itemHeight?: number;
  showCompleted?: boolean;
}

const TaskItem = React.memo(({ task, onTaskClick, onStartTimer, onCompleteTask }: {
  task: Task;
  onTaskClick: (task: Task) => void;
  onStartTimer: (taskId: string) => void;
  onCompleteTask: (taskId: string) => void;
}) => {
  const isMobile = useIsMobile();

  const TaskCard = (
    <Card className={`m-1 transition-all duration-200 hover:shadow-md ${
      task.status === 'completed' 
        ? 'opacity-60 bg-muted/50' 
        : 'hover:shadow-lg cursor-pointer'
    }`}>
      <CardContent 
        className="p-4"
        onClick={() => onTaskClick(task)}
        role="button"
        tabIndex={0}
        aria-label={`Task: ${task.title}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium truncate ${
              task.status === 'completed' ? 'line-through text-muted-foreground' : ''
            }`}>
              {task.title}
            </h3>
            
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              {task.estimateMinutes && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{task.estimateMinutes}m</span>
                </div>
              )}
              
              {task.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(task.dueDate), 'MMM d')}</span>
                </div>
              )}
              
              {task.subtasks.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-2">
            {task.status !== 'completed' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartTimer(task.id);
                  }}
                  className="h-8 w-8 p-0"
                  aria-label="Start timer"
                >
                  <Play className="h-3 w-3" />
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCompleteTask(task.id);
                  }}
                  className="h-8 w-8 p-0"
                  aria-label="Mark complete"
                >
                  <CheckCircle className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Wrap with mobile gestures on mobile devices
  if (isMobile) {
    return (
      <MobileGestures 
        task={task}
        onSwipeComplete={() => onCompleteTask(task.id)}
      >
        {TaskCard}
      </MobileGestures>
    );
  }

  return TaskCard;
});

TaskItem.displayName = 'TaskItem';

export const VirtualizedTaskList: React.FC<VirtualizedTaskListProps> = ({
  tasks,
  height = 600,
  showCompleted = false
}) => {
  const { startTimer, updateTask, setSelectedTask } = useAppStore();

  const filteredTasks = useMemo(() => {
    return showCompleted 
      ? tasks 
      : tasks.filter(task => task.status !== 'completed');
  }, [tasks, showCompleted]);

  const handleTaskClick = (task: Task) => setSelectedTask(task);
  const handleStartTimer = (taskId: string) => startTimer(taskId, TimerMode.CONTINUOUS);
  const handleCompleteTask = (taskId: string) => updateTask(taskId, { 
    status: TaskStatus.COMPLETED, 
    completedAt: new Date() 
  });

  if (filteredTasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        <p>No tasks to display</p>
      </div>
    );
  }

  return (
    <div 
      className="border rounded-lg overflow-hidden"
      role="list"
      aria-label="Tasks list"
    >
      <div 
        className="overflow-y-auto"
        style={{ height }}
      >
        {filteredTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onTaskClick={handleTaskClick}
            onStartTimer={handleStartTimer}
            onCompleteTask={handleCompleteTask}
          />
        ))}
      </div>
    </div>
  );
};