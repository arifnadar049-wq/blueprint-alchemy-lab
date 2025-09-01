import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Habit } from '@/types';

interface HabitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => void;
  habit?: Habit;
}

const HABIT_ICONS = ['🎯', '💪', '📚', '🧘', '🏃', '💧', '🍎', '🌱', '✍️', '🎵'];
const HABIT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'];

export const HabitForm: React.FC<HabitFormProps> = ({ open, onOpenChange, onSave, habit }) => {
  const [name, setName] = useState(habit?.name || '');
  const [icon, setIcon] = useState(habit?.icon || '🎯');
  const [color, setColor] = useState(habit?.color || '#3b82f6');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>(habit?.frequency || 'daily');
  const [targetCount, setTargetCount] = useState(habit?.targetCount || 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      icon,
      color,
      frequency,
      targetCount
    });

    // Reset form
    setName('');
    setIcon('🎯');
    setColor('#3b82f6');
    setFrequency('daily');
    setTargetCount(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{habit ? 'Edit Habit' : 'Create New Habit'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Habit Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Drink 8 glasses of water"
              required
            />
          </div>

          <div>
            <Label>Icon</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {HABIT_ICONS.map((iconOption) => (
                <Button
                  key={iconOption}
                  type="button"
                  variant={icon === iconOption ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIcon(iconOption)}
                  className="h-10 text-lg"
                >
                  {iconOption}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label>Color</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {HABIT_COLORS.map((colorOption) => (
                <Button
                  key={colorOption}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setColor(colorOption)}
                  className="h-10 p-0"
                  style={{ backgroundColor: color === colorOption ? colorOption : 'transparent' }}
                >
                  <div 
                    className="w-full h-full rounded border-2"
                    style={{ 
                      backgroundColor: colorOption,
                      borderColor: color === colorOption ? 'white' : 'transparent'
                    }}
                  />
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="frequency">Frequency</Label>
            <Select value={frequency} onValueChange={(value: 'daily' | 'weekly') => setFrequency(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="target">Target ({frequency === 'daily' ? 'times per day' : 'times per week'})</Label>
            <Input
              id="target"
              type="number"
              min="1"
              max="10"
              value={targetCount}
              onChange={(e) => setTargetCount(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {habit ? 'Update' : 'Create'} Habit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};