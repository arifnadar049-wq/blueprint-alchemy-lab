import React, { useState, useEffect } from 'react';
import { Search, Command, Play, Plus, Check, List, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { TaskStatus, TimerMode } from '@/types';
import { cn } from '@/lib/utils';

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  
  const { 
    tasks, 
    lists, 
    startTimer, 
    completeTask, 
    setSelectedListId, 
    setSelectedTask,
    createTask,
    selectedListId
  } = useAppStore();

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(query.toLowerCase()) ||
    task.notes.toLowerCase().includes(query.toLowerCase())
  );

  const filteredLists = lists.filter(list =>
    list.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectTask = (task: typeof tasks[0]) => {
    setSelectedTask(task);
    setSelectedListId(task.listId);
    setOpen(false);
    setQuery('');
  };

  const handleStartTimer = (task: typeof tasks[0]) => {
    startTimer(task.id, TimerMode.CONTINUOUS);
    setOpen(false);
    setQuery('');
  };

  const handleCompleteTask = async (task: typeof tasks[0]) => {
    await completeTask(task.id);
    setOpen(false);
    setQuery('');
  };

  const handleSelectList = (list: typeof lists[0]) => {
    setSelectedListId(list.id);
    setOpen(false);
    setQuery('');
  };

  const handleQuickAdd = async () => {
    if (!query.trim() || !selectedListId) return;
    
    await createTask({
      listId: selectedListId,
      title: query.trim(),
      notes: '',
      estimateMinutes: null,
      dueDate: null,
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
    
    setOpen(false);
    setQuery('');
  };

  const renderResults = () => {
    if (!query) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          <Command className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Type to search tasks and lists</p>
          <p className="text-xs mt-1">
            Press <kbd className="bg-muted px-1 rounded">⌘K</kbd> or <kbd className="bg-muted px-1 rounded">Ctrl+K</kbd> to open
          </p>
        </div>
      );
    }

    const hasResults = filteredTasks.length > 0 || filteredLists.length > 0;

    if (!hasResults) {
      return (
        <div className="p-4">
          <div className="text-center text-muted-foreground mb-4">
            <p>No results found for "{query}"</p>
          </div>
          
          {selectedListId && (
            <Button 
              onClick={handleQuickAdd}
              className="w-full gap-2"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              Create task "{query}"
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="max-h-96 overflow-y-auto">
        {/* Tasks */}
        {filteredTasks.length > 0 && (
          <div className="p-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2 py-1">
              Tasks ({filteredTasks.length})
            </h3>
            <div className="space-y-1">
              {filteredTasks.slice(0, 6).map((task) => {
                const list = lists.find(l => l.id === task.listId);
                return (
                  <div
                    key={task.id}
                    className="group flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => handleSelectTask(task)}
                  >
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: list?.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">in {list?.name}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {task.status !== TaskStatus.COMPLETED && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartTimer(task);
                            }}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteTask(task);
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-xs",
                        task.status === TaskStatus.COMPLETED && "bg-success/10 text-success",
                        task.status === TaskStatus.IN_PROGRESS && "bg-focus-active/10 text-focus-active"
                      )}
                    >
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lists */}
        {filteredLists.length > 0 && (
          <div className="p-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2 py-1">
              Lists ({filteredLists.length})
            </h3>
            <div className="space-y-1">
              {filteredLists.map((list) => {
                const taskCount = tasks.filter(t => t.listId === list.id && t.status !== TaskStatus.COMPLETED).length;
                return (
                  <div
                    key={list.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => handleSelectList(list)}
                  >
                    <List className="h-4 w-4 flex-shrink-0" style={{ color: list.color }} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{list.name}</p>
                    </div>
                    {taskCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {taskCount}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0">
        <div className="border-b border-border">
          <div className="flex items-center gap-3 p-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks, lists, or type to create..."
              className="border-0 shadow-none focus-visible:ring-0"
              autoFocus
            />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <kbd className="bg-muted px-1 rounded">⌘K</kbd>
            </div>
          </div>
        </div>
        
        {renderResults()}
      </DialogContent>
    </Dialog>
  );
};