import React, { createContext, useContext, useCallback, useState } from 'react';
import { Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { UndoRedoState, UndoRedoAction, Task, List } from '@/types';

interface UndoRedoContextType {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  addAction: (action: Omit<UndoRedoAction, 'timestamp'>) => void;
  clearHistory: () => void;
}

const UndoRedoContext = createContext<UndoRedoContextType | null>(null);

export const useUndoRedo = () => {
  const context = useContext(UndoRedoContext);
  if (!context) {
    throw new Error('useUndoRedo must be used within UndoRedoProvider');
  }
  return context;
};

interface UndoRedoProviderProps {
  children: React.ReactNode;
  maxHistorySize?: number;
}

export const UndoRedoProvider = ({ children, maxHistorySize = 50 }: UndoRedoProviderProps) => {
  const [state, setState] = useState<UndoRedoState>({
    undoStack: [],
    redoStack: []
  });
  const { toast } = useToast();

  const addAction = useCallback((action: Omit<UndoRedoAction, 'timestamp'>) => {
    setState(prevState => {
      const newAction: UndoRedoAction = {
        ...action,
        timestamp: new Date()
      };

      const newUndoStack = [...prevState.undoStack, newAction];
      
      // Limit stack size
      if (newUndoStack.length > maxHistorySize) {
        newUndoStack.shift();
      }

      return {
        undoStack: newUndoStack,
        redoStack: [] // Clear redo stack when new action is added
      };
    });
  }, [maxHistorySize]);

  const undo = useCallback(() => {
    setState(prevState => {
      if (prevState.undoStack.length === 0) return prevState;

      const actionToUndo = prevState.undoStack[prevState.undoStack.length - 1];
      const newUndoStack = prevState.undoStack.slice(0, -1);
      const newRedoStack = [...prevState.redoStack, actionToUndo];

      // Execute undo logic based on action type
      executeUndoAction(actionToUndo);

      toast({
        title: "Action undone",
        description: getActionDescription(actionToUndo, true),
      });

      return {
        undoStack: newUndoStack,
        redoStack: newRedoStack
      };
    });
  }, [toast]);

  const redo = useCallback(() => {
    setState(prevState => {
      if (prevState.redoStack.length === 0) return prevState;

      const actionToRedo = prevState.redoStack[prevState.redoStack.length - 1];
      const newRedoStack = prevState.redoStack.slice(0, -1);
      const newUndoStack = [...prevState.undoStack, actionToRedo];

      // Execute redo logic based on action type
      executeRedoAction(actionToRedo);

      toast({
        title: "Action redone",
        description: getActionDescription(actionToRedo, false),
      });

      return {
        undoStack: newUndoStack,
        redoStack: newRedoStack
      };
    });
  }, [toast]);

  const clearHistory = useCallback(() => {
    setState({
      undoStack: [],
      redoStack: []
    });
  }, []);

  const executeUndoAction = (action: UndoRedoAction) => {
    // This would need to integrate with your app store
    // For now, this is a placeholder implementation
    console.log('Executing undo:', action);
    
    switch (action.type) {
      case 'create':
        // Delete the created entity
        if (action.entity === 'task') {
          // deleteTask(action.data.id);
        } else if (action.entity === 'list') {
          // deleteList(action.data.id);
        }
        break;
      case 'update':
        // Restore previous state
        if (action.entity === 'task') {
          // updateTask(action.data.id, action.data.previousState);
        } else if (action.entity === 'list') {
          // updateList(action.data.id, action.data.previousState);
        }
        break;
      case 'delete':
        // Recreate the deleted entity
        if (action.entity === 'task') {
          // createTask(action.data);
        } else if (action.entity === 'list') {
          // createList(action.data);
        }
        break;
      case 'bulk':
        // Reverse bulk operation
        action.data.actions.reverse().forEach((subAction: any) => {
          executeUndoAction(subAction);
        });
        break;
    }
  };

  const executeRedoAction = (action: UndoRedoAction) => {
    // This would need to integrate with your app store
    console.log('Executing redo:', action);
    
    switch (action.type) {
      case 'create':
        // Recreate the entity
        if (action.entity === 'task') {
          // createTask(action.data);
        } else if (action.entity === 'list') {
          // createList(action.data);
        }
        break;
      case 'update':
        // Apply the update again
        if (action.entity === 'task') {
          // updateTask(action.data.id, action.data.newState);
        } else if (action.entity === 'list') {
          // updateList(action.data.id, action.data.newState);
        }
        break;
      case 'delete':
        // Delete the entity again
        if (action.entity === 'task') {
          // deleteTask(action.data.id);
        } else if (action.entity === 'list') {
          // deleteList(action.data.id);
        }
        break;
      case 'bulk':
        // Execute bulk operation again
        action.data.actions.forEach((subAction: any) => {
          executeRedoAction(subAction);
        });
        break;
    }
  };

  const getActionDescription = (action: UndoRedoAction, isUndo: boolean): string => {
    const verb = isUndo ? 'Undid' : 'Redid';
    const entityName = action.entity === 'task' ? 'task' : 'list';
    
    switch (action.type) {
      case 'create':
        return `${verb} creation of ${entityName}`;
      case 'update':
        return `${verb} update to ${entityName}`;
      case 'delete':
        return `${verb} deletion of ${entityName}`;
      case 'bulk':
        return `${verb} bulk operation on ${action.data.actions.length} items`;
      default:
        return `${verb} action`;
    }
  };

  const value: UndoRedoContextType = {
    canUndo: state.undoStack.length > 0,
    canRedo: state.redoStack.length > 0,
    undo,
    redo,
    addAction,
    clearHistory
  };

  return (
    <UndoRedoContext.Provider value={value}>
      {children}
    </UndoRedoContext.Provider>
  );
};

// Keyboard shortcuts hook
export const useUndoRedoKeyboard = () => {
  const { undo, redo, canUndo, canRedo } = useUndoRedo();

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
        event.preventDefault();
        if (event.shiftKey && canRedo) {
          redo();
        } else if (canUndo) {
          undo();
        }
      }
      
      // Alternative redo shortcut
      if ((event.metaKey || event.ctrlKey) && event.key === 'y' && canRedo) {
        event.preventDefault();
        redo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);
};

// Undo/Redo toolbar component
export const UndoRedoToolbar = () => {
  const { canUndo, canRedo, undo, redo } = useUndoRedo();

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={!canUndo}
              className="h-8 w-8 p-0"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Undo (Ctrl+Z)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={!canRedo}
              className="h-8 w-8 p-0"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Redo (Ctrl+Shift+Z)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};