import React, { useState, useEffect } from 'react';
import { BarChart3, Clock, Target, TrendingUp, Calendar, Activity, Flame, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/store/useAppStore';
import { formatDuration } from '@/utils/helpers';
import { habitStorage } from '@/utils/habitStorage';
import { Habit, HabitCompletion } from '@/types';
import { toast } from 'sonner';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths, parseISO } from 'date-fns';

type TimeRange = 'daily' | 'weekly' | 'monthly';

export const Reports = () => {
  const { tasks, sessions } = useAppStore();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly'); // Default to monthly
  const [selectedMonth, setSelectedMonth] = useState(new Date()); // Track selected month
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHabitsData();
  }, []);

  const loadHabitsData = async () => {
    try {
      const [habitsData, completionsData] = await Promise.all([
        habitStorage.getHabits(),
        habitStorage.getHabitCompletions()
      ]);
      setHabits(habitsData);
      setCompletions(completionsData);
    } catch (error) {
      console.error('Error loading habits data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate basic stats
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const totalSessions = sessions.length;
  const totalMinutesWorked = Math.floor(
    sessions.reduce((total, session) => total + session.workSeconds, 0) / 60
  );
  const averageTaskTime = completedTasks.length > 0 
    ? Math.floor(totalMinutesWorked / completedTasks.length)
    : 0;

  const today = new Date();
  const todayTasks = completedTasks.filter(task => {
    const completedDate = new Date(task.updatedAt);
    return completedDate.toDateString() === today.toDateString();
  });

  // Calculate habit stats
  const todayCompletions = completions.filter(c => {
    const completionDate = new Date(c.date);
    return completionDate.toDateString() === today.toDateString();
  });

  const completedHabitsToday = habits.filter(habit => {
    const todayHabitCompletions = todayCompletions.filter(c => c.habitId === habit.id).length;
    return todayHabitCompletions >= habit.targetCount;
  }).length;

  const habitCompletionRate = habits.length > 0 ? 
    Math.round((completedHabitsToday / habits.length) * 100) : 0;

  // Month navigation functions
  const goToPreviousMonth = () => {
    setSelectedMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setSelectedMonth(prev => addMonths(prev, 1));
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return selectedMonth.getMonth() === now.getMonth() && selectedMonth.getFullYear() === now.getFullYear();
  };

  // Generate charts data based on selected time range and month
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case 'daily':
        start.setDate(end.getDate() - 6); // Last 7 days
        break;
      case 'weekly':
        start.setDate(end.getDate() - 27); // Last 4 weeks
        break;
      case 'monthly':
        // Use selected month for monthly view
        return {
          start: startOfMonth(selectedMonth),
          end: endOfMonth(selectedMonth)
        };
    }
    
    return { start, end };
  };

  const { start, end } = getDateRange();

  // Task completion chart data
  const taskStatusData = [
    { name: 'Completed', value: completedTasks.length, color: '#10b981' },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: '#f59e0b' },
    { name: 'Todo', value: tasks.filter(t => t.status === 'todo').length, color: '#6b7280' }
  ].filter(item => item.value > 0);

  // Habit progress data
  const habitProgressData = habits.map(habit => {
    const habitCompletions = completions.filter(c => c.habitId === habit.id);
    const recentCompletions = habitCompletions.filter(c => {
      const date = new Date(c.date);
      return date >= start && date <= end;
    });
    
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const expectedCompletions = habit.frequency === 'daily' ? 
      totalDays * habit.targetCount : 
      Math.ceil(totalDays / 7) * habit.targetCount;
    
    const completionRate = expectedCompletions > 0 ? 
      Math.round((recentCompletions.length / expectedCompletions) * 100) : 0;

    return {
      name: habit.name,
      rate: completionRate,
      color: habit.color
    };
  });

  // Progress trend data based on time range
  const getProgressTrendData = () => {
    if (timeRange === 'monthly') {
      // Monthly view: show daily data for the selected month
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
      
      return daysInMonth.map(date => {
        const dateStr = date.toDateString();
        
        const dayTasks = completedTasks.filter(task => {
          if (!task.completedAt) return false;
          const taskDate = new Date(task.completedAt);
          return taskDate.toDateString() === dateStr;
        }).length;
        
        const dayHabits = habits.filter(habit => {
          const dayCompletions = completions.filter(c => 
            c.habitId === habit.id && 
            new Date(c.date).toDateString() === dateStr
          ).length;
          return dayCompletions >= habit.targetCount;
        }).length;

        const daySessions = sessions.filter(session => {
          const sessionDate = new Date(session.startedAt);
          return sessionDate.toDateString() === dateStr;
        });

        const dayProductiveMinutes = daySessions.reduce((total, session) => 
          total + (session.workSeconds / 60), 0
        );
        
        return {
          date: format(date, 'MMM d'),
          day: format(date, 'd'),
          tasks: dayTasks,
          habits: dayHabits,
          productiveHours: Math.round((dayProductiveMinutes / 60) * 10) / 10
        };
      });
    } else {
      // Weekly view: show last 7 days
      const weeklyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toDateString();
        
        const dayTasks = completedTasks.filter(task => {
          if (!task.completedAt) return false;
          const taskDate = new Date(task.completedAt);
          return taskDate.toDateString() === dateStr;
        }).length;
        
        const dayHabits = habits.filter(habit => {
          const dayCompletions = completions.filter(c => 
            c.habitId === habit.id && 
            new Date(c.date).toDateString() === dateStr
          ).length;
          return dayCompletions >= habit.targetCount;
        }).length;
        
        weeklyData.push({
          date: format(date, 'MMM d'),
          day: date.toLocaleDateString('en', { weekday: 'short' }),
          tasks: dayTasks,
          habits: dayHabits
        });
      }
      return weeklyData;
    }
  };

  const progressTrendData = getProgressTrendData();
  
  const exportChartsToCSV = () => {
    try {
      // Task status data
      const taskCSV = [
        ['Task Status', 'Count'],
        ...taskStatusData.map(item => [item.name, item.value])
      ].map(row => row.join(',')).join('\n');
      
      // Habit progress data  
      const habitCSV = [
        ['Habit Name', 'Completion Rate %'],
        ...habitProgressData.map(item => [item.name, item.rate])
      ].map(row => row.join(',')).join('\n');
      
      // Progress trend data
      const trendCSV = [
        ['Period', 'Tasks Completed', 'Habits Completed', 'Productive Hours'],
        ...progressTrendData.map(item => [
          item.date || item.day, 
          item.tasks, 
          item.habits, 
          item.productiveHours || 0
        ])
      ].map(row => row.join(',')).join('\n');
      
      // Combine all data
      const fullCSV = [
        'TASK STATUS REPORT',
        taskCSV,
        '',
        'HABIT COMPLETION REPORT', 
        habitCSV,
        '',
        `${timeRange.toUpperCase()} TREND REPORT`,
        trendCSV
      ].join('\n');
      
      const blob = new Blob([fullCSV], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `grit-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Analytics data exported to CSV!');
    } catch (error) {
      console.error('CSV export failed:', error);
      toast.error('Failed to export CSV. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-background animate-fade-in">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto bg-background animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Track your productivity and identify patterns</p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Month Navigation for Monthly View */}
          {timeRange === 'monthly' && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center text-foreground">
                {format(selectedMonth, 'MMMM yyyy')}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToNextMonth}
                disabled={isCurrentMonth()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <Button onClick={exportChartsToCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          
          <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-scale-in">
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border hover:shadow-medium transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tasks Today</p>
              <p className="text-2xl font-bold text-foreground">{todayTasks.length}</p>
            </div>
            <Target className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border hover:shadow-medium transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Habits Progress</p>
              <p className="text-2xl font-bold text-foreground">{habitCompletionRate}%</p>
            </div>
            <Activity className="h-8 w-8 text-accent" />
          </div>
        </Card>

        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border hover:shadow-medium transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Focus Sessions</p>
              <p className="text-2xl font-bold text-foreground">{totalSessions}</p>
            </div>
            <Clock className="h-8 w-8 text-success" />
          </div>
        </Card>

        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border hover:shadow-medium transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Task Time</p>
              <p className="text-2xl font-bold text-foreground">{averageTaskTime}m</p>
            </div>
            <TrendingUp className="h-8 w-8 text-warning" />
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-scale-in">
        {/* Task Status Pie Chart */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border hover:shadow-medium transition-all duration-300">
          <h3 className="text-lg font-medium text-foreground mb-4">Task Status Distribution</h3>
          {taskStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  animationDuration={800}
                  animationBegin={0}
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No task data available
            </div>
          )}
        </Card>

        {/* Habits Progress */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border hover:shadow-medium transition-all duration-300">
          <h3 className="text-lg font-medium text-foreground mb-4">Habit Completion Rates</h3>
          {habitProgressData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={habitProgressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Completion Rate']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Bar 
                  dataKey="rate" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]}
                  animationDuration={800}
                  animationBegin={300}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No habit data available
            </div>
          )}
        </Card>
      </div>

      {/* Progress Trend */}
      <Card className="p-6 mb-8 bg-card/50 backdrop-blur-sm border-border hover:shadow-medium transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-foreground">
            {timeRange === 'monthly' ? `${format(selectedMonth, 'MMMM yyyy')} Progress Trend` : 'Weekly Progress Trend'}
          </h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportChartsToCSV}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          {timeRange === 'monthly' ? (
            <AreaChart data={progressTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => `Day ${value}`}
                formatter={(value, name) => [
                  value, 
                  name === 'tasks' ? 'Tasks Completed' : 
                  name === 'habits' ? 'Habits Completed' : 'Productive Hours'
                ]}
              />
              <Area type="monotone" dataKey="tasks" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Area type="monotone" dataKey="habits" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              <Line type="monotone" dataKey="productiveHours" stroke="#f59e0b" strokeWidth={2} name="Productive Hours" />
            </AreaChart>
          ) : (
            <LineChart data={progressTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="tasks" stroke="#3b82f6" name="Tasks Completed" />
              <Line type="monotone" dataKey="habits" stroke="#10b981" name="Habits Completed" />
            </LineChart>
          )}
        </ResponsiveContainer>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border hover:shadow-medium transition-all duration-300">
        <h3 className="text-lg font-medium text-foreground mb-4">Recent Activity</h3>
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No focus sessions yet</p>
            <p className="text-sm text-muted-foreground">Start a timer to see your productivity data</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.slice(-5).reverse().map((session) => {
              const task = tasks.find(t => t.id === session.taskId);
              const duration = Math.floor(session.workSeconds / 60);
              
              return (
                <div key={session.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{task?.title || 'Unknown task'}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(session.startedAt).toLocaleDateString()} • {session.mode}
                    </p>
                  </div>
                  <Badge variant="secondary">{formatDuration(duration)}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};