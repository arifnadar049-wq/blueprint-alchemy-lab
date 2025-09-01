import React, { useState, useRef } from 'react';
import { Plus, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
import { TaskStatus } from '@/types';
import { cn } from '@/lib/utils';

export const QuickAdd = () => {
  const [value, setValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { createTask, selectedListId, lists } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!value.trim() || !selectedListId) return;

    // Parse quick add syntax (optional): 
    // "Task title #30min @today" -> title with estimate and due date
    const titleMatch = value.match(/^([^#@]+)/);
    const estimateMatch = value.match(/#(\d+)min/);
    const dueDateMatch = value.match(/@(today|tomorrow)/);
    
    const title = titleMatch?.[1]?.trim() || value.trim();
    const estimateMinutes = estimateMatch ? parseInt(estimateMatch[1]) : null;
    
    let dueDate = null;
    if (dueDateMatch) {
      const dateType = dueDateMatch[1];
      if (dateType === 'today') {
        dueDate = new Date();
      } else if (dateType === 'tomorrow') {
        dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 1);
      }
    }

    await createTask({
      listId: selectedListId,
      title,
      notes: '',
      estimateMinutes,
      dueDate,
      dueTime: null,
      status: TaskStatus.TODO,
      recurrenceRule: null,
      parentRecurringId: null,
      subtasks: [],
      priority: 3,
      completedAt: null,
      archived: false,
      orderIndex: 0,
      tags: [],
      dependencies: []
    });

    setValue('');
    setIsExpanded(false);
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleBlur = () => {
    if (!value.trim()) {
      setIsExpanded(false);
    }
  };

  const selectedList = lists.find(list => list.id === selectedListId);

  return (
    <div className="relative flex-1 max-w-md">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Zap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={`Quick add to ${selectedList?.name || 'list'}...`}
            className={cn(
              "pl-10 pr-12 transition-all duration-200",
              isExpanded && "ring-2 ring-primary ring-offset-2"
            )}
          />
          {value.trim() && (
            <Button
              type="submit"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        {isExpanded && (
          <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-card border rounded-lg shadow-lg z-50">
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Quick syntax:</p>
              <p>• Add estimate: <code className="bg-muted px-1 rounded">#30min</code></p>
              <p>• Set due date: <code className="bg-muted px-1 rounded">@today</code> or <code className="bg-muted px-1 rounded">@tomorrow</code></p>
              <p className="pt-1">Example: <code className="bg-muted px-1 rounded">Review code #45min @today</code></p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};