import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/store/useAppStore';
import { TaskStatus } from '@/types';
import { Plus, X } from 'lucide-react';

interface TaskFormProps {
  onClose?: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ onClose }) => {
  const { createTask, lists } = useAppStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [listId, setListId] = useState('');
  const [priority, setPriority] = useState('medium');
  const [estimateMinutes, setEstimateMinutes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await createTask({
        title: title.trim(),
        notes: description.trim() || '',
        listId: listId || null,
        status: TaskStatus.TODO,
        priority: priority === 'high' ? 1 : priority === 'medium' ? 2 : 3,
        estimateMinutes: estimateMinutes ? parseInt(estimateMinutes) : null,
        dueDate: new Date(),
        dueTime: null,
        recurrenceRule: null,
        parentRecurringId: null,
        subtasks: [],
        completedAt: null,
        archived: false,
        orderIndex: 0,
        tags: [],
        dependencies: [],
      });
      onClose?.();
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!onClose) {
    // If no onClose prop provided, render a simple button to open a dialog
    return (
      <Button variant="outline" size="sm" className="gap-2">
        <Plus className="h-4 w-4" />
        Add Task
      </Button>
    );
  }
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Add New Task</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onClose?.()}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                placeholder="Task title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                required
              />
            </div>
            
            <div>
              <Textarea
                placeholder="Description (optional)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Input
                  type="number"
                  placeholder="Minutes"
                  value={estimateMinutes}
                  onChange={(e) => setEstimateMinutes(e.target.value)}
                  min="1"
                />
              </div>
            </div>

            {lists.length > 0 && (
              <div>
                <Select value={listId} onValueChange={setListId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select list (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {lists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1" disabled={!title.trim() || isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Task'}
              </Button>
              <Button type="button" variant="outline" onClick={() => onClose?.()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};