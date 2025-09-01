import React, { useState } from 'react';
import { Repeat, Calendar, Clock, Plus, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppStore } from '@/store/useAppStore';
import { RecurrenceRule, TaskStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface RecurringTaskManagerProps {
  trigger?: React.ReactNode;
  taskId?: string; // For editing existing recurring task
  defaultValues?: Partial<RecurrenceRule>;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

export const RecurringTaskManager = ({ 
  trigger, 
  taskId, 
  defaultValues 
}: RecurringTaskManagerProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<RecurrenceRule>({
    frequency: defaultValues?.frequency || 'daily',
    interval: defaultValues?.interval || 1,
    daysOfWeek: defaultValues?.daysOfWeek || [],
    endDate: defaultValues?.endDate || undefined,
    count: defaultValues?.count || undefined,
    ...defaultValues
  });

  const { tasks, createTask, updateTask, selectedListId, lists } = useAppStore();
  const { toast } = useToast();

  const task = taskId ? tasks.find(t => t.id === taskId) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedListId) {
      toast({
        title: "Error",
        description: "Please select a list first",
        variant: "destructive"
      });
      return;
    }

    try {
      const recurrenceString = generateRecurrenceString(formData);
      
      if (taskId && task) {
        // Update existing task
        await updateTask(taskId, {
          recurrenceRule: recurrenceString
        });
        
        // Generate next instances
        await generateRecurringInstances(task, formData);
        
        toast({
          title: "Recurring task updated",
          description: `"${task.title}" recurrence pattern updated`,
        });
      } else {
        // Create new recurring task template
        const templateTask = {
          listId: selectedListId,
          title: `Recurring Task Template`,
          notes: 'This is a recurring task template. Edit the details as needed.',
          estimateMinutes: 30,
          dueDate: null,
          dueTime: null,
          status: TaskStatus.TODO,
          recurrenceRule: recurrenceString,
          parentRecurringId: null,
          subtasks: [],
          priority: 3,
          completedAt: null,
          archived: false,
          orderIndex: 0,
          tags: [],
          dependencies: []
        };
        
        await createTask(templateTask);
        
        toast({
          title: "Recurring task created",
          description: "Template created. Edit the task details and instances will be generated.",
        });
      }
      
      setOpen(false);
      resetForm();
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create recurring task. Please try again.",
        variant: "destructive"
      });
      console.error('Recurring task error:', error);
    }
  };

  const generateRecurrenceString = (rule: RecurrenceRule): string => {
    let rrule = `FREQ=${rule.frequency.toUpperCase()}`;
    
    if (rule.interval > 1) {
      rrule += `;INTERVAL=${rule.interval}`;
    }
    
    if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
      const days = rule.daysOfWeek.map(day => {
        const dayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        return dayNames[day];
      }).join(',');
      rrule += `;BYDAY=${days}`;
    }
    
    if (rule.endDate) {
      const endDateStr = rule.endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      rrule += `;UNTIL=${endDateStr}`;
    }
    
    if (rule.count) {
      rrule += `;COUNT=${rule.count}`;
    }
    
    return rrule;
  };

  const generateRecurringInstances = async (baseTask: any, rule: RecurrenceRule) => {
    // This is a simplified instance generation
    // In a real app, you'd use a proper RRULE library like 'rrule'
    
    const instances = [];
    const now = new Date();
    let currentDate = new Date(now);
    
    // Generate next 10 instances as an example
    for (let i = 0; i < 10; i++) {
      switch (rule.frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + (rule.interval || 1));
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (7 * (rule.interval || 1)));
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + (rule.interval || 1));
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + (rule.interval || 1));
          break;
      }
      
      // Check if we've passed the end date
      if (rule.endDate && currentDate > rule.endDate) break;
      if (rule.count && i >= rule.count) break;
      
      // Check day of week filter
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        if (!rule.daysOfWeek.includes(currentDate.getDay())) {
          continue;
        }
      }
      
      const instanceTask = {
        ...baseTask,
        id: undefined, // Will be generated
        title: `${baseTask.title} - ${currentDate.toLocaleDateString()}`,
        dueDate: new Date(currentDate),
        parentRecurringId: baseTask.id,
        recurrenceRule: null, // Instances don't have their own recurrence
        createdAt: undefined,
        updatedAt: undefined
      };
      
      instances.push(instanceTask);
    }
    
    // Create the instances
    for (const instance of instances) {
      await createTask(instance);
    }
    
    toast({
      title: "Instances generated",
      description: `Created ${instances.length} recurring task instances`,
    });
  };

  const resetForm = () => {
    setFormData({
      frequency: 'daily',
      interval: 1,
      daysOfWeek: [],
      endDate: undefined,
      count: undefined
    });
  };

  const handleDayToggle = (dayValue: number) => {
    const currentDays = formData.daysOfWeek || [];
    const newDays = currentDays.includes(dayValue)
      ? currentDays.filter(d => d !== dayValue)
      : [...currentDays, dayValue].sort();
    
    setFormData(prev => ({
      ...prev,
      daysOfWeek: newDays
    }));
  };

  const getRecurrencePreview = () => {
    const { frequency, interval, daysOfWeek } = formData;
    
    let preview = `Every ${interval > 1 ? interval : ''} ${frequency}`;
    
    if (frequency === 'weekly' && daysOfWeek && daysOfWeek.length > 0) {
      const dayNames = daysOfWeek.map(d => DAYS_OF_WEEK[d].short).join(', ');
      preview += ` on ${dayNames}`;
    }
    
    if (formData.endDate) {
      preview += ` until ${formData.endDate.toLocaleDateString()}`;
    } else if (formData.count) {
      preview += ` for ${formData.count} occurrences`;
    }
    
    return preview;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Repeat className="h-4 w-4" />
            Set Recurring
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            {taskId ? 'Edit Recurring Task' : 'Create Recurring Task'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Frequency */}
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select 
              value={formData.frequency} 
              onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'yearly') => 
                setFormData(prev => ({ ...prev, frequency: value, daysOfWeek: [] }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Interval */}
          <div className="space-y-2">
            <Label>Repeat every</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="100"
                value={formData.interval}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  interval: parseInt(e.target.value) || 1 
                }))}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">
                {formData.frequency}
                {formData.interval > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Days of Week (for weekly) */}
          {formData.frequency === 'weekly' && (
            <div className="space-y-2">
              <Label>On these days</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={formData.daysOfWeek?.includes(day.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleDayToggle(day.value)}
                  >
                    {day.short}
                  </Button>
                ))}
              </div>
              {formData.daysOfWeek?.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Select at least one day of the week
                </p>
              )}
            </div>
          )}

          {/* End Condition */}
          <div className="space-y-3">
            <Label>End condition</Label>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="no-end"
                  checked={!formData.endDate && !formData.count}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData(prev => ({ ...prev, endDate: undefined, count: undefined }));
                    }
                  }}
                />
                <Label htmlFor="no-end">Never (continues indefinitely)</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="end-date"
                  checked={!!formData.endDate}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData(prev => ({ 
                        ...prev, 
                        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                        count: undefined 
                      }));
                    } else {
                      setFormData(prev => ({ ...prev, endDate: undefined }));
                    }
                  }}
                />
                <Label htmlFor="end-date">End by date</Label>
                {formData.endDate && (
                  <Input
                    type="date"
                    value={formData.endDate.toISOString().split('T')[0]}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      endDate: new Date(e.target.value) 
                    }))}
                    className="w-40"
                  />
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="end-count"
                  checked={!!formData.count}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData(prev => ({ 
                        ...prev, 
                        count: 10,
                        endDate: undefined 
                      }));
                    } else {
                      setFormData(prev => ({ ...prev, count: undefined }));
                    }
                  }}
                />
                <Label htmlFor="end-count">End after</Label>
                {formData.count && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="1000"
                      value={formData.count}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        count: parseInt(e.target.value) || 1 
                      }))}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">occurrences</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Preview</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {getRecurrencePreview()}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={formData.frequency === 'weekly' && (!formData.daysOfWeek || formData.daysOfWeek.length === 0)}
            >
              {taskId ? 'Update Recurrence' : 'Create Recurring Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};