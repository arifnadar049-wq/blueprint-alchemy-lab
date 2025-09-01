import React from 'react';
import { TaskList } from './TaskList';
import { TaskDetail } from './TaskDetail';
import { useAppStore } from '@/store/useAppStore';

export const MainWorkspace = () => {
  const { selectedTask } = useAppStore();

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Task List */}
      <div className="flex-1 min-w-0">
        <TaskList />
      </div>
      
      {/* Task Detail Panel */}
      {selectedTask && (
        <div className="w-96 border-l border-border bg-card">
          <TaskDetail />
        </div>
      )}
    </div>
  );
};