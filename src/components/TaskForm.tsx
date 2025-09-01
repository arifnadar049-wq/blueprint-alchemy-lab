import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAppStore } from '@/store/useAppStore';
import { TaskStatus } from '@/types';

interface TaskFormProps {
  listId?: string;
  trigger?: React.ReactNode;
}

export const TaskForm = ({ listId, trigger }: TaskFormProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    estimateMinutes: '',
    dueDate: '',
    dueTime: '',
    status: TaskStatus.TODO
  });

  const { createTask, selectedListId } = useAppStore();
  const targetListId = listId || selectedListId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !targetListId) return;

    await createTask({
      listId: targetListId,
      title: formData.title.trim(),
      notes: formData.notes.trim(),
      estimateMinutes: formData.estimateMinutes ? parseInt(formData.estimateMinutes) : null,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
      dueTime: formData.dueTime || null,
      status: formData.status,
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

    // Reset form
    setFormData({
      title: '',
      notes: '',
      estimateMinutes: '',
      dueDate: '',
      dueTime: '',
      status: TaskStatus.TODO
    });
    
    setOpen(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title *
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter task title..."
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes
            </label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any additional details..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="estimate" className="text-sm font-medium">
                Estimate (minutes)
              </label>
              <Input
                id="estimate"
                type="number"
                value={formData.estimateMinutes}
                onChange={(e) => handleInputChange('estimateMinutes', e.target.value)}
                placeholder="30"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                  <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="due-date" className="text-sm font-medium">
                Due Date
              </label>
              <Input
                id="due-date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="due-time" className="text-sm font-medium">
                Due Time
              </label>
              <Input
                id="due-time"
                type="time"
                value={formData.dueTime}
                onChange={(e) => handleInputChange('dueTime', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.title.trim()}>
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};