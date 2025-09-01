import React, { useState } from 'react';
import { CheckSquare, Trash2, Archive, Move, Flag, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppStore } from '@/store/useAppStore';
import { TaskStatus, TaskPriority, Task, List } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface BulkActionsProps {
  selectedTaskIds: string[];
  onTasksUpdated: () => void;
  onClearSelection: () => void;
}

type BulkActionType = 'complete' | 'delete' | 'move' | 'archive' | 'prioritize' | 'status';

export const BulkActions = ({ selectedTaskIds, onTasksUpdated, onClearSelection }: BulkActionsProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const [actionType, setActionType] = useState<BulkActionType | null>(null);
  const [targetListId, setTargetListId] = useState<string>('');
  const [targetPriority, setTargetPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [targetStatus, setTargetStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { tasks, lists, updateTask, deleteTask } = useAppStore();
  const { toast } = useToast();

  const selectedTasks = tasks.filter(task => selectedTaskIds.includes(task.id));
  const selectedCount = selectedTaskIds.length;

  const handleBulkAction = (type: BulkActionType) => {
    setActionType(type);
    
    if (type === 'complete' || type === 'archive') {
      // These actions don't need additional input
      executeBulkAction(type);
    } else {
      // These actions need user input
      setShowDialog(true);
    }
  };

  const executeBulkAction = async (type: BulkActionType) => {
    if (selectedCount === 0) return;
    
    setIsProcessing(true);
    
    try {
      switch (type) {
        case 'complete':
          await Promise.all(
            selectedTaskIds.map(taskId => 
              updateTask(taskId, { 
                status: TaskStatus.COMPLETED,
                completedAt: new Date()
              })
            )
          );
          toast({
            title: "Tasks completed",
            description: `${selectedCount} task${selectedCount !== 1 ? 's' : ''} marked as completed`,
          });
          break;
          
        case 'delete':
          await Promise.all(
            selectedTaskIds.map(taskId => deleteTask(taskId))
          );
          toast({
            title: "Tasks deleted", 
            description: `${selectedCount} task${selectedCount !== 1 ? 's' : ''} deleted`,
            variant: "destructive"
          });
          break;
          
        case 'move':
          if (!targetListId) return;
          await Promise.all(
            selectedTaskIds.map(taskId => 
              updateTask(taskId, { listId: targetListId })
            )
          );
          const targetList = lists.find(l => l.id === targetListId);
          toast({
            title: "Tasks moved",
            description: `${selectedCount} task${selectedCount !== 1 ? 's' : ''} moved to ${targetList?.name}`,
          });
          break;
          
        case 'archive':
          await Promise.all(
            selectedTaskIds.map(taskId => 
              updateTask(taskId, { archived: true })
            )
          );
          toast({
            title: "Tasks archived",
            description: `${selectedCount} task${selectedCount !== 1 ? 's' : ''} archived`,
          });
          break;
          
        case 'prioritize':
          await Promise.all(
            selectedTaskIds.map(taskId => 
              updateTask(taskId, { priority: targetPriority })
            )
          );
          const priorityNames = {
            [TaskPriority.URGENT]: 'Urgent',
            [TaskPriority.HIGH]: 'High',
            [TaskPriority.MEDIUM]: 'Medium', 
            [TaskPriority.LOW]: 'Low',
            [TaskPriority.LOWEST]: 'Lowest'
          };
          toast({
            title: "Priority updated",
            description: `${selectedCount} task${selectedCount !== 1 ? 's' : ''} set to ${priorityNames[targetPriority]} priority`,
          });
          break;
          
        case 'status':
          await Promise.all(
            selectedTaskIds.map(taskId => 
              updateTask(taskId, { status: targetStatus })
            )
          );
          const statusNames = {
            [TaskStatus.TODO]: 'To Do',
            [TaskStatus.IN_PROGRESS]: 'In Progress',
            [TaskStatus.COMPLETED]: 'Completed'
          };
          toast({
            title: "Status updated",
            description: `${selectedCount} task${selectedCount !== 1 ? 's' : ''} set to ${statusNames[targetStatus]}`,
          });
          break;
      }
      
      onTasksUpdated();
      onClearSelection();
      setShowDialog(false);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform bulk action. Please try again.",
        variant: "destructive"
      });
      console.error('Bulk action error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getPriorityName = (priority: TaskPriority) => {
    const names = {
      [TaskPriority.URGENT]: 'Urgent',
      [TaskPriority.HIGH]: 'High', 
      [TaskPriority.MEDIUM]: 'Medium',
      [TaskPriority.LOW]: 'Low',
      [TaskPriority.LOWEST]: 'Lowest'
    };
    return names[priority];
  };

  const getStatusName = (status: TaskStatus) => {
    const names = {
      [TaskStatus.TODO]: 'To Do',
      [TaskStatus.IN_PROGRESS]: 'In Progress',
      [TaskStatus.COMPLETED]: 'Completed'
    };
    return names[status];
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-card border rounded-lg shadow-floating p-4 min-w-96">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span className="font-medium">
                {selectedCount} task{selectedCount !== 1 ? 's' : ''} selected
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="default"
              className="gap-2"
              onClick={() => handleBulkAction('complete')}
              disabled={isProcessing}
            >
              <CheckSquare className="h-4 w-4" />
              Complete
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => handleBulkAction('move')}
              disabled={isProcessing}
            >
              <Move className="h-4 w-4" />
              Move
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => handleBulkAction('prioritize')}
              disabled={isProcessing}
            >
              <Flag className="h-4 w-4" />
              Priority
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => handleBulkAction('status')}
              disabled={isProcessing}
            >
              <Tag className="h-4 w-4" />
              Status
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => handleBulkAction('archive')}
              disabled={isProcessing}
            >
              <Archive className="h-4 w-4" />
              Archive
            </Button>
            
            <Button
              size="sm"
              variant="destructive"
              className="gap-2"
              onClick={() => handleBulkAction('delete')}
              disabled={isProcessing}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Action Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'move' && 'Move Tasks'}
              {actionType === 'prioritize' && 'Set Priority'}
              {actionType === 'status' && 'Change Status'}
              {actionType === 'delete' && 'Delete Tasks'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {actionType === 'delete' && (
              <Alert>
                <AlertDescription>
                  Are you sure you want to delete {selectedCount} task{selectedCount !== 1 ? 's' : ''}? 
                  This action cannot be undone.
                </AlertDescription>
              </Alert>
            )}
            
            {actionType === 'move' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Move to list:</label>
                <Select value={targetListId} onValueChange={setTargetListId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a list" />
                  </SelectTrigger>
                  <SelectContent>
                    {lists.map(list => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {actionType === 'prioritize' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Set priority:</label>
                <Select 
                  value={targetPriority.toString()} 
                  onValueChange={(value) => setTargetPriority(parseInt(value) as TaskPriority)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaskPriority.URGENT.toString()}>
                      {getPriorityName(TaskPriority.URGENT)}
                    </SelectItem>
                    <SelectItem value={TaskPriority.HIGH.toString()}>
                      {getPriorityName(TaskPriority.HIGH)}
                    </SelectItem>
                    <SelectItem value={TaskPriority.MEDIUM.toString()}>
                      {getPriorityName(TaskPriority.MEDIUM)}
                    </SelectItem>
                    <SelectItem value={TaskPriority.LOW.toString()}>
                      {getPriorityName(TaskPriority.LOW)}
                    </SelectItem>
                    <SelectItem value={TaskPriority.LOWEST.toString()}>
                      {getPriorityName(TaskPriority.LOWEST)}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {actionType === 'status' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Change status to:</label>
                <Select value={targetStatus} onValueChange={(value: TaskStatus) => setTargetStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaskStatus.TODO}>
                      {getStatusName(TaskStatus.TODO)}
                    </SelectItem>
                    <SelectItem value={TaskStatus.IN_PROGRESS}>
                      {getStatusName(TaskStatus.IN_PROGRESS)}
                    </SelectItem>
                    <SelectItem value={TaskStatus.COMPLETED}>
                      {getStatusName(TaskStatus.COMPLETED)}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Selected tasks preview */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Selected tasks ({selectedCount}):
              </label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {selectedTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="text-sm text-muted-foreground">
                    • {task.title}
                  </div>
                ))}
                {selectedTasks.length > 5 && (
                  <div className="text-sm text-muted-foreground">
                    ... and {selectedTasks.length - 5} more
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => executeBulkAction(actionType!)}
              disabled={isProcessing || (actionType === 'move' && !targetListId)}
              variant={actionType === 'delete' ? 'destructive' : 'default'}
            >
              {isProcessing ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};