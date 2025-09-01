import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as BigCalendar, momentLocalizer, Views, View } from 'react-big-calendar';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, Plus, Settings, ExternalLink, RefreshCw, Clock, Target } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { Task, Habit, TaskStatus } from '@/types';
import { TaskForm } from './TaskForm';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'task' | 'habit' | 'google';
  data?: any;
  color?: string;
}

interface GoogleCalendarSettings {
  connected: boolean;
  email?: string;
  lastSync?: string;
  selectedCalendars: string[];
  autoSync: boolean;
}

export const Calendar = () => {
  const { tasks, sessions } = useAppStore();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitCompletions, setHabitCompletions] = useState<any[]>([]);
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);
  const [googleSettings, setGoogleSettings] = useState<GoogleCalendarSettings>({
    connected: false,
    selectedCalendars: [],
    autoSync: false
  });
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCalendarData();
    loadGoogleSettings();
  }, []);

  const loadCalendarData = async () => {
    try {
      // Load habits data
      const { data: habitsData } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (habitsData) {
        const mappedHabits = habitsData.map(habit => ({
          ...habit,
          targetCount: habit.target_count,
          frequency: habit.frequency as 'daily' | 'weekly',
          createdAt: new Date(habit.created_at),
          updatedAt: new Date(habit.updated_at)
        }));
        setHabits(mappedHabits);
      }

      // Load habit completions
      const { data: completionsData } = await supabase
        .from('habit_completions')
        .select('*');
      
      if (completionsData) {
        setHabitCompletions(completionsData);
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
    }
  };

  const loadGoogleSettings = () => {
    const settings = localStorage.getItem('googleCalendarSettings');
    if (settings) {
      setGoogleSettings(JSON.parse(settings));
    }
  };

  const saveGoogleSettings = (settings: GoogleCalendarSettings) => {
    localStorage.setItem('googleCalendarSettings', JSON.stringify(settings));
    setGoogleSettings(settings);
  };

  const connectGoogleCalendar = async () => {
    setLoading(true);
    try {
      // Call our Edge Function to initiate OAuth
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { action: 'connect' }
      });

      if (error) throw error;

      if (data.authUrl) {
        // Open OAuth URL in current window
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error connecting Google Calendar:', error);
      toast.error('Failed to connect Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  const syncGoogleCalendar = async () => {
    if (!googleSettings.connected) return;
    
    const tokens = JSON.parse(localStorage.getItem('googleTokens') || '{}');
    if (!tokens.access_token) {
      toast.error('Please reconnect your Google Calendar');
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { 
          action: 'sync',
          startDate: startOfDay(new Date()).toISOString(),
          endDate: endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0)).toISOString(),
          accessToken: tokens.access_token
        }
      });

      if (error) throw error;

      if (data.needsReauth) {
        // Token expired, need to reconnect
        saveGoogleSettings({ ...googleSettings, connected: false });
        localStorage.removeItem('googleTokens');
        toast.error('Google Calendar access expired. Please reconnect.');
        return;
      }

      const events = data.events?.map((event: any) => ({
        id: event.id,
        title: event.summary || 'Untitled Event',
        start: new Date(event.start.dateTime || event.start.date),
        end: new Date(event.end.dateTime || event.end.date),
        type: 'google' as const,
        data: event,
        color: '#4285f4'
      })) || [];

      setGoogleEvents(events);
      
      saveGoogleSettings({
        ...googleSettings,
        lastSync: new Date().toISOString()
      });
      
      toast.success(`Synced ${events.length} Google Calendar events`);
    } catch (error) {
      console.error('Error syncing Google Calendar:', error);
      toast.error('Failed to sync Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  // Auto-sync if enabled and online/offline events
  useEffect(() => {
    if (googleSettings.connected && googleSettings.autoSync) {
      syncGoogleCalendar();
    }
  }, [date, googleSettings.connected, googleSettings.autoSync]);

  // Auto-sync when coming back online
  useEffect(() => {
    const handleOnline = () => {
      if (googleSettings.connected && googleSettings.autoSync) {
        console.log('Device back online, syncing Google Calendar...');
        syncGoogleCalendar();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [googleSettings.connected, googleSettings.autoSync]);

  // Convert tasks to calendar events
  const taskEvents: CalendarEvent[] = useMemo(() => {
    return tasks
      .filter(task => task.dueDate)
      .map(task => ({
        id: `task-${task.id}`,
        title: task.title,
        start: new Date(task.dueDate!),
        end: new Date(new Date(task.dueDate!).getTime() + (task.estimateMinutes || 30) * 60000),
        type: 'task',
        data: task,
        color: task.status === TaskStatus.COMPLETED ? '#10b981' : 
               task.status === TaskStatus.IN_PROGRESS ? '#f59e0b' : '#6b7280'
      }));
  }, [tasks]);

  // Convert habits to calendar events (for today)
  const habitEvents: CalendarEvent[] = useMemo(() => {
    const today = new Date();
    return habits
      .filter(h => h.frequency === 'daily')
      .map(habit => {
        const isCompleted = habitCompletions.some(c => 
          c.habit_id === habit.id && 
          new Date(c.date).toDateString() === today.toDateString()
        );
        
        return {
          id: `habit-${habit.id}`,
          title: `📋 ${habit.name}`,
          start: today,
          end: new Date(today.getTime() + 30 * 60000), // 30 minutes
          type: 'habit',
          data: habit,
          color: isCompleted ? habit.color : `${habit.color}80`
        };
      });
  }, [habits, habitCompletions]);

  // Combine all events
  const allEvents = [...taskEvents, ...habitEvents, ...googleEvents];

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDialog(true);
  };

  const getEventStyle = (event: CalendarEvent) => ({
    backgroundColor: event.color,
    borderColor: event.color,
    color: '#fff'
  });

  return (
    <div className="h-full flex flex-col bg-gradient-surface">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Calendar</h1>
              <p className="text-muted-foreground">Manage tasks, habits and Google Calendar events</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Add Task Button */}
            <Button variant="outline" size="sm" onClick={() => setShowTaskForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
            
            {/* Google Calendar Controls */}
            {googleSettings.connected ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  Connected
                </Badge>
                <Button variant="outline" size="sm" onClick={syncGoogleCalendar} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Sync
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={connectGoogleCalendar} disabled={loading}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Connect Google Calendar
              </Button>
            )}
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Calendar Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Auto-sync Google Calendar</label>
                    <Switch 
                      checked={googleSettings.autoSync}
                      onCheckedChange={(checked) => 
                        saveGoogleSettings({ ...googleSettings, autoSync: checked })
                      }
                    />
                  </div>
                  {googleSettings.connected && (
                    <div className="text-sm text-muted-foreground">
                      Connected as: {googleSettings.email}
                      <br />
                      Last sync: {googleSettings.lastSync ? 
                        format(new Date(googleSettings.lastSync), 'MMM d, yyyy h:mm a') : 
                        'Never'
                      }
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Calendar Stats */}
      <div className="p-6 border-b border-border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Today's Tasks</div>
                <div className="text-xl font-semibold">{taskEvents.filter(e => 
                  new Date(e.start).toDateString() === new Date().toDateString()
                ).length}</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Daily Habits</div>
                <div className="text-xl font-semibold">{habitEvents.length}</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Google Events</div>
                <div className="text-xl font-semibold">{googleEvents.length}</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gradient-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-xs">%</span>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Completion</div>
                <div className="text-xl font-semibold">
                  {tasks.length > 0 ? 
                    Math.round((tasks.filter(t => t.status === TaskStatus.COMPLETED).length / tasks.length) * 100) 
                    : 0}%
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Calendar Component */}
      <div className="flex-1 p-6">
        <div className="h-[600px] bg-card rounded-lg p-4">
          <BigCalendar
            localizer={localizer}
            events={allEvents}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            onSelectEvent={handleEventClick}
            eventPropGetter={getEventStyle}
            className="dark-calendar"
            style={{ height: '100%' }}
            views={['month', 'week', 'day', 'agenda']}
          />
        </div>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={selectedEvent.type === 'task' ? 'default' : 
                              selectedEvent.type === 'habit' ? 'secondary' : 'outline'}>
                  {selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {format(selectedEvent.start, 'MMM d, yyyy h:mm a')}
                </span>
              </div>
              
              {selectedEvent.type === 'task' && (
                <div className="space-y-2">
                  <div><strong>Status:</strong> {selectedEvent.data.status}</div>
                  <div><strong>Priority:</strong> {
                    selectedEvent.data.priority === 1 ? 'High' :
                    selectedEvent.data.priority === 2 ? 'Medium' : 'Low'
                  }</div>
                  {selectedEvent.data.notes && (
                    <div><strong>Notes:</strong> {selectedEvent.data.notes}</div>
                  )}
                  {selectedEvent.data.estimateMinutes && (
                    <div><strong>Estimate:</strong> {selectedEvent.data.estimateMinutes} minutes</div>
                  )}
                </div>
              )}
              
              {selectedEvent.type === 'habit' && (
                <div className="space-y-2">
                  <div><strong>Frequency:</strong> {selectedEvent.data.frequency}</div>
                  <div><strong>Target:</strong> {selectedEvent.data.targetCount}x per day</div>
                </div>
              )}
              
              {selectedEvent.type === 'google' && selectedEvent.data.description && (
                <div>
                  <strong>Description:</strong>
                  <p className="text-sm mt-1">{selectedEvent.data.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Custom Styles */}
      <style>{`
        .dark-calendar {
          background: hsl(var(--card));
          color: hsl(var(--card-foreground));
        }
        
        .dark-calendar .rbc-header {
          background: hsl(var(--muted));
          color: hsl(var(--muted-foreground));
          border-color: hsl(var(--border));
        }
        
        .dark-calendar .rbc-today {
          background-color: hsl(var(--primary) / 0.1);
        }
        
        .dark-calendar .rbc-off-range-bg {
          background-color: hsl(var(--muted) / 0.5);
        }
        
        .dark-calendar .rbc-event {
          border: none;
          border-radius: 4px;
          font-size: 12px;
        }
        
        .dark-calendar .rbc-month-view,
        .dark-calendar .rbc-time-view {
          border-color: hsl(var(--border));
        }
        
        .dark-calendar .rbc-day-bg,
        .dark-calendar .rbc-month-row {
          border-color: hsl(var(--border));
        }
      `}</style>
      
      {/* Task Form Dialog */}
      {showTaskForm && (
        <TaskForm
          onClose={() => setShowTaskForm(false)}
        />
      )}
    </div>
  );
};