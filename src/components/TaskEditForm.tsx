import React, { useState } from 'react';
import { Edit2, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useAppStore } from '@/store/useAppStore';
import { Task, TaskStatus, Subtask } from '@/types';
import { generateId } from '@/utils/helpers';

interface TaskEditFormProps {
  task: Task;
  trigger?: React.ReactNode;
}

export const TaskEditForm = ({ task, trigger }: TaskEditFormProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: task.title,
    notes: task.notes,
    estimateMinutes: task.estimateMinutes?.toString() || '',
    dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
    dueTime: task.dueTime || '',
    status: task.status,
    subtasks: [...task.subtasks]
  });

  const { updateTask, deleteTask, lists } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await updateTask(task.id, {
      title: formData.title.trim(),
      notes: formData.notes.trim(),
      estimateMinutes: formData.estimateMinutes ? parseInt(formData.estimateMinutes) : null,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
      dueTime: formData.dueTime || null,
      status: formData.status,
      subtasks: formData.subtasks
    });

    setOpen(false);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      await deleteTask(task.id);
      setOpen(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addSubtask = () => {
    setFormData(prev => ({
      ...prev,
      subtasks: [
        ...prev.subtasks,
        { id: generateId(), title: '', completed: false }
      ]
    }));
  };

  const updateSubtask = (id: string, field: keyof Subtask, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(subtask =>
        subtask.id === id ? { ...subtask, [field]: value } : subtask
      )
    }));
  };

  const removeSubtask = (id: string) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter(subtask => subtask.id !== id)
    }));
  };

  const currentList = lists.find(list => list.id === task.listId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-2">
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            Edit Task
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: currentList?.color }}
            />
            <span>in {currentList?.name}</span>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Title */}
          <div className="space-y-2">
            <label htmlFor="edit-title" className="text-sm font-medium">
              Title *
            </label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter task title..."
              autoFocus
              required
            />
          </div>

          {/* Task Notes */}
          <div className="space-y-2">
            <label htmlFor="edit-notes" className="text-sm font-medium">
              Notes
            </label>
            <Textarea
              id="edit-notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any additional details..."
              rows={4}
            />
          </div>

          {/* Estimate and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="edit-estimate" className="text-sm font-medium">
                Estimate (minutes)
              </label>
              <Input
                id="edit-estimate"
                type="number"
                value={formData.estimateMinutes}
                onChange={(e) => handleInputChange('estimateMinutes', e.target.value)}
                placeholder="30"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-status" className="text-sm font-medium">
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

          {/* Due Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="edit-due-date" className="text-sm font-medium">
                Due Date
              </label>
              <Input
                id="edit-due-date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-due-time" className="text-sm font-medium">
                Due Time
              </label>
              <Input
                id="edit-due-time"
                type="time"
                value={formData.dueTime}
                onChange={(e) => handleInputChange('dueTime', e.target.value)}
              />
            </div>
          </div>

          {/* Subtasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Subtasks</label>
              <Button type="button" variant="outline" size="sm" onClick={addSubtask}>
                Add Subtask
              </Button>
            </div>
            
            <div className="space-y-2">
              {formData.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={subtask.completed}
                    onCheckedChange={(checked) => 
                      updateSubtask(subtask.id, 'completed', checked as boolean)
                    }
                  />
                  <Input
                    value={subtask.title}
                    onChange={(e) => updateSubtask(subtask.id, 'title', e.target.value)}
                    placeholder="Subtask title..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSubtask(subtask.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button type="button" variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Task
            </Button>
            
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!formData.title.trim()}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};