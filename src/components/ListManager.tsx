import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Palette, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

const COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Yellow', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Orange', value: '#f97316' }
];

const ICONS = [
  'Circle', 'Square', 'Star', 'Heart', 'Inbox', 'Calendar', 'CheckCircle', 
  'Clock', 'Target', 'Zap', 'Home', 'Briefcase', 'Book', 'Coffee'
];

interface ListFormProps {
  listId?: string;
  trigger?: React.ReactNode;
  mode?: 'create' | 'edit';
}

export const ListManager = ({ listId, trigger, mode = 'create' }: ListFormProps) => {
  const [open, setOpen] = useState(false);
  const { lists, createList, updateList, deleteList } = useAppStore();
  
  const existingList = listId ? lists.find(l => l.id === listId) : null;
  
  const [formData, setFormData] = useState({
    name: existingList?.name || '',
    color: existingList?.color || COLORS[0].value,
    icon: existingList?.icon || ICONS[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    if (mode === 'edit' && listId) {
      await updateList(listId, formData);
    } else {
      await createList(formData.name.trim(), formData.color, formData.icon);
    }

    if (mode === 'create') {
      setFormData({
        name: '',
        color: COLORS[0].value,
        icon: ICONS[0]
      });
    }
    
    setOpen(false);
  };

  const handleDelete = async () => {
    if (!listId) return;
    
    if (confirm('Are you sure you want to delete this list? All tasks in this list will also be deleted.')) {
      await deleteList(listId);
      setOpen(false);
    }
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
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New List
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            {mode === 'edit' ? 'Edit List' : 'Create New List'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Update your list settings and organization'
              : 'Create a new list to organize your tasks'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* List Name */}
          <div className="space-y-2">
            <Label htmlFor="list-name">List Name *</Label>
            <Input
              id="list-name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter list name..."
              autoFocus
              required
            />
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <Label>Color Theme</Label>
            <div className="grid grid-cols-4 gap-3">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleInputChange('color', color.value)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border-2 transition-all hover:scale-105",
                    formData.color === color.value
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: color.value }}
                  />
                  <span className="text-sm font-medium">{color.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selection */}
          <div className="space-y-3">
            <Label>Icon</Label>
            <Select value={formData.icon} onValueChange={(value) => handleInputChange('icon', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ICONS.map((icon) => (
                  <SelectItem key={icon} value={icon}>
                    {icon}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: formData.color }}
                >
                  {formData.icon.charAt(0)}
                </div>
                <span className="font-medium">
                  {formData.name || 'List Preview'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <div>
              {mode === 'edit' && (
                <Button type="button" variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete List
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!formData.name.trim()}>
                {mode === 'edit' ? 'Update List' : 'Create List'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};