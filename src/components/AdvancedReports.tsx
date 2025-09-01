import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Target, TrendingUp, Download, Filter, PieChart, BarChart3, LineChart, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/store/useAppStore';
import { formatDuration } from '@/utils/helpers';
import { TaskStatus } from '@/types';

type TimeRange = 'day' | 'week' | 'month' | 'year';

export const AdvancedReports = () => {
  const { tasks, sessions, lists } = useAppStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [selectedList, setSelectedList] = useState<string>('all');

  // Calculate date range based on selection
  const dateRange = useMemo(() => {
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);
    
    switch (timeRange) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return { start, end };
  }, [timeRange]);

  // Filter data based on date range and list
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const taskDate = new Date(task.updatedAt);
      const inRange = taskDate >= dateRange.start && taskDate <= dateRange.end;
      const inList = selectedList === 'all' || task.listId === selectedList;
      return inRange && inList;
    });
  }, [tasks, dateRange, selectedList]);

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.startedAt);
      const inRange = sessionDate >= dateRange.start && sessionDate <= dateRange.end;
      if (selectedList === 'all') return inRange;
      
      const task = tasks.find(t => t.id === session.taskId);
      return inRange && task?.listId === selectedList;
    });
  }, [sessions, tasks, dateRange, selectedList]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const completedTasks = filteredTasks.filter(task => task.status === TaskStatus.COMPLETED);
    const totalTasks = filteredTasks.length;
    const totalWorkMinutes = Math.floor(
      filteredSessions.reduce((total, session) => total + session.workSeconds, 0) / 60
    );
    const totalBreakMinutes = Math.floor(
      filteredSessions.reduce((total, session) => total + session.breakSeconds, 0) / 60
    );
    const pomodoroSessions = filteredSessions.filter(session => session.mode === 'pomodoro').length;
    
    // Productivity scoring (based on tasks completed vs estimated time)
    const estimatedMinutes = completedTasks.reduce((total, task) => 
      total + (task.estimateMinutes || 0), 0
    );
    const actualMinutes = totalWorkMinutes;
    const estimateAccuracy = estimatedMinutes > 0 ? 
      Math.min(100, Math.round((estimatedMinutes / actualMinutes) * 100)) : 0;
    
    const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
    const focusEfficiency = (totalWorkMinutes + totalBreakMinutes) > 0 ? 
      Math.round((totalWorkMinutes / (totalWorkMinutes + totalBreakMinutes)) * 100) : 0;
    
    // Overall productivity score (weighted average)
    const productivityScore = Math.round(
      (completionRate * 0.4) + (estimateAccuracy * 0.3) + (focusEfficiency * 0.3)
    );

    return {
      completedTasks: completedTasks.length,
      totalTasks,
      totalWorkMinutes,
      totalBreakMinutes,
      pomodoroSessions,
      completionRate,
      estimateAccuracy,
      focusEfficiency,
      productivityScore,
      averageTaskTime: completedTasks.length > 0 ? Math.round(totalWorkMinutes / completedTasks.length) : 0
    };
  }, [filteredTasks, filteredSessions]);

  // Time by list breakdown
  const timeByList = useMemo(() => {
    const listTimes = new Map<string, number>();
    
    filteredSessions.forEach(session => {
      const task = tasks.find(t => t.id === session.taskId);
      if (task) {
        const listId = task.listId;
        const currentTime = listTimes.get(listId) || 0;
        listTimes.set(listId, currentTime + Math.floor(session.workSeconds / 60));
      }
    });

    return Array.from(listTimes.entries()).map(([listId, minutes]) => {
      const list = lists.find(l => l.id === listId);
      return {
        listName: list?.name || 'Unknown',
        color: list?.color || '#3b82f6',
        minutes,
        percentage: metrics.totalWorkMinutes > 0 ? 
          Math.round((minutes / metrics.totalWorkMinutes) * 100) : 0
      };
    }).sort((a, b) => b.minutes - a.minutes);
  }, [filteredSessions, tasks, lists, metrics.totalWorkMinutes]);

  // Daily breakdown for the current period
  const dailyBreakdown = useMemo(() => {
    const days = new Map<string, { tasks: number; minutes: number; sessions: number }>();
    
    // Initialize days in range
    const current = new Date(dateRange.start);
    while (current <= dateRange.end) {
      const dateStr = current.toISOString().split('T')[0];
      days.set(dateStr, { tasks: 0, minutes: 0, sessions: 0 });
      current.setDate(current.getDate() + 1);
    }
    
    // Add task completions
    filteredTasks.forEach(task => {
      if (task.status === TaskStatus.COMPLETED && task.completedAt) {
        const dateStr = task.completedAt.toISOString().split('T')[0];
        const day = days.get(dateStr);
        if (day) {
          day.tasks += 1;
        }
      }
    });
    
    // Add session times
    filteredSessions.forEach(session => {
      const dateStr = session.startedAt.toISOString().split('T')[0];
      const day = days.get(dateStr);
      if (day) {
        day.minutes += Math.floor(session.workSeconds / 60);
        day.sessions += 1;
      }
    });

    return Array.from(days.entries()).map(([date, data]) => ({
      date: new Date(date),
      ...data
    })).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [filteredTasks, filteredSessions, dateRange]);

  // Export functionality
  const exportToCSV = () => {
    const csvData = [
      ['Date', 'Tasks Completed', 'Focus Minutes', 'Sessions'],
      ...dailyBreakdown.map(day => [
        day.date.toLocaleDateString(),
        day.tasks.toString(),
        day.minutes.toString(),
        day.sessions.toString()
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `productivity-report-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Advanced Analytics</h1>
          <p className="text-muted-foreground">Comprehensive productivity insights and metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedList} onValueChange={setSelectedList}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lists</SelectItem>
              {lists.map(list => (
                <SelectItem key={list.id} value={list.id}>
                  {list.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Productivity Score</p>
                <p className="text-2xl font-bold text-foreground">{metrics.productivityScore}%</p>
              </div>
              <div className="p-2 bg-gradient-primary/10 rounded-lg">
                <Zap className="h-5 w-5 text-primary" />
              </div>
            </div>
            <Progress value={metrics.productivityScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tasks Completed</p>
                <p className="text-2xl font-bold text-foreground">
                  {metrics.completedTasks}/{metrics.totalTasks}
                </p>
              </div>
              <div className="p-2 bg-success/10 rounded-lg">
                <Target className="h-5 w-5 text-success" />
              </div>
            </div>
            <Progress value={metrics.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Focus Time</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatDuration(metrics.totalWorkMinutes)}
                </p>
              </div>
              <div className="p-2 bg-focus-active/10 rounded-lg">
                <Clock className="h-5 w-5 text-focus-active" />
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {metrics.pomodoroSessions} Pomodoro sessions
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estimate Accuracy</p>
                <p className="text-2xl font-bold text-foreground">{metrics.estimateAccuracy}%</p>
              </div>
              <div className="p-2 bg-warning/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-warning" />
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Avg: {formatDuration(metrics.averageTaskTime)} per task
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="time-breakdown">Time Breakdown</TabsTrigger>
          <TabsTrigger value="daily-trends">Daily Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-sm text-muted-foreground">{metrics.completionRate}%</span>
                  </div>
                  <Progress value={metrics.completionRate} />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Focus Efficiency</span>
                    <span className="text-sm text-muted-foreground">{metrics.focusEfficiency}%</span>
                  </div>
                  <Progress value={metrics.focusEfficiency} />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Estimate Accuracy</span>
                    <span className="text-sm text-muted-foreground">{metrics.estimateAccuracy}%</span>
                  </div>
                  <Progress value={metrics.estimateAccuracy} />
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-foreground">{metrics.totalWorkMinutes}</p>
                    <p className="text-xs text-muted-foreground">Total Minutes</p>
                  </div>
                  
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-foreground">{metrics.pomodoroSessions}</p>
                    <p className="text-xs text-muted-foreground">Pomodoros</p>
                  </div>
                  
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-foreground">{metrics.averageTaskTime}</p>
                    <p className="text-xs text-muted-foreground">Avg Task (min)</p>
                  </div>
                  
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-foreground">{metrics.totalBreakMinutes}</p>
                    <p className="text-xs text-muted-foreground">Break Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="time-breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Time by List
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeByList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No time tracking data available</p>
                  <p className="text-sm">Start a timer to see breakdown</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {timeByList.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate">{item.listName}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatDuration(item.minutes)} ({item.percentage}%)
                          </span>
                        </div>
                        <Progress value={item.percentage} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily-trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Daily Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dailyBreakdown.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <LineChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No daily data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dailyBreakdown.slice(-7).map((day, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                      <div className="w-20 text-sm font-medium">
                        {day.date.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>Tasks: {day.tasks}</span>
                          <span>Time: {formatDuration(day.minutes)}</span>
                          <span>Sessions: {day.sessions}</span>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Progress 
                              value={Math.min(100, (day.tasks / Math.max(1, Math.max(...dailyBreakdown.map(d => d.tasks)))) * 100)} 
                              className="h-1" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};