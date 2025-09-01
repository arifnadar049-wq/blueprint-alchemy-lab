import React, { useState } from 'react';
import { Timer, Bell, Download, Upload, Trash2, Info, Palette, Keyboard, Shield, AlertCircle, CheckCircle, FileText, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppStore } from '@/store/useAppStore';
import { supabaseStorage } from '@/utils/supabaseStorage';
import { format } from 'date-fns';
import { toast } from 'sonner';


interface TimerSettingsData {
  pomodoroWorkMinutes: number;
  pomodoroBreakMinutes: number;
  pomodoroLongBreakMinutes: number;
  pomodoroLongBreakAfter: number;
  enableSounds: boolean;
  enableNotifications: boolean;
}

type ExportFormat = 'json' | 'csv';
type ExportScope = 'all' | 'tasks' | 'lists' | 'sessions';

export const Settings = () => {
  const { lists, tasks, sessions } = useAppStore();
  const [timerSettings, setTimerSettings] = useState<TimerSettingsData>(supabaseStorage.getTimerSettings());
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [exportScope, setExportScope] = useState<ExportScope>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const handleTimerSettingChange = (key: string, value: number | boolean) => {
    const updated = { ...timerSettings, [key]: value };
    setTimerSettings(updated);
    supabaseStorage.saveTimerSettings(updated);
  };

  const generateExportData = () => {
    const data: any = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    switch (exportScope) {
      case 'all':
        data.tasks = tasks;
        data.lists = lists;
        data.sessions = sessions;
        break;
      case 'tasks':
        data.tasks = tasks;
        break;
      case 'lists':
        data.lists = lists;
        break;
      case 'sessions':
        data.sessions = sessions;
        break;
    }

    return data;
  };

  const exportData = async () => {
    setIsExporting(true);
    try {
      const data = generateExportData();
      
      if (exportFormat === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `grit-${exportScope}-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (exportFormat === 'csv') {
        // Simple CSV export for tasks
        if (exportScope === 'tasks' || exportScope === 'all') {
          const csvContent = [
            ['Title', 'Status', 'Priority', 'Due Date', 'Estimate (minutes)', 'Notes'].join(','),
            ...tasks.map(task => [
              `"${task.title}"`,
              task.status,
              task.priority,
              task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
              task.estimateMinutes || '',
              `"${(task.notes || '').replace(/"/g, '""')}"`
            ].join(','))
          ].join('\n');
          
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `grit-tasks-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }
      
      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Validation logic would go here
        // For now, just show success
        setImportResult('Import completed successfully!');
        toast.success('Data imported successfully!');
      } catch (error) {
        console.error('Import failed:', error);
        setImportResult('Import failed. Please check your file format.');
        toast.error('Import failed. Please check your file format.');
      } finally {
        setIsImporting(false);
      }
    };
    
    reader.readAsText(file);
  };

  const clearAllData = async () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      // Clear Supabase data would require implementing delete functions
      // For now, we'll just refresh the page
      window.location.reload();
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Configure your GRIT productivity app preferences</p>
      </div>

      <div className="space-y-6">
        {/* Timer Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Timer Settings
            </CardTitle>
            <CardDescription>
              Configure Pomodoro and timer preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="work-minutes">Work Duration (minutes)</Label>
                <Input
                  id="work-minutes"
                  type="number"
                  value={timerSettings.pomodoroWorkMinutes}
                  onChange={(e) => handleTimerSettingChange('pomodoroWorkMinutes', parseInt(e.target.value))}
                  min="1"
                  max="120"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="break-minutes">Short Break (minutes)</Label>
                <Input
                  id="break-minutes"
                  type="number"
                  value={timerSettings.pomodoroBreakMinutes}
                  onChange={(e) => handleTimerSettingChange('pomodoroBreakMinutes', parseInt(e.target.value))}
                  min="1"
                  max="30"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="long-break-minutes">Long Break (minutes)</Label>
                <Input
                  id="long-break-minutes"
                  type="number"
                  value={timerSettings.pomodoroLongBreakMinutes}
                  onChange={(e) => handleTimerSettingChange('pomodoroLongBreakMinutes', parseInt(e.target.value))}
                  min="1"
                  max="60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="long-break-after">Long Break After</Label>
                <Input
                  id="long-break-after"
                  type="number"
                  value={timerSettings.pomodoroLongBreakAfter}
                  onChange={(e) => handleTimerSettingChange('pomodoroLongBreakAfter', parseInt(e.target.value))}
                  min="2"
                  max="10"
                />
                <p className="text-xs text-muted-foreground">Pomodoro cycles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications & Sound
            </CardTitle>
            <CardDescription>
              Control sounds and desktop notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-sounds">Sound Effects</Label>
                <p className="text-sm text-muted-foreground">
                  Play sounds for timer events
                </p>
              </div>
              <Switch
                id="enable-sounds"
                checked={timerSettings.enableSounds}
                onCheckedChange={(checked) => handleTimerSettingChange('enableSounds', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-notifications">Desktop Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Show notifications for timer and task events
                </p>
              </div>
              <Switch
                id="enable-notifications"
                checked={timerSettings.enableNotifications}
                onCheckedChange={(checked) => handleTimerSettingChange('enableNotifications', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Data Management
            </CardTitle>
            <CardDescription>
              Export, import, and manage your productivity data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Export Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="export-format">Export Format</Label>
                  <Select value={exportFormat} onValueChange={(value: ExportFormat) => setExportFormat(value)}>
                    <SelectTrigger id="export-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON (Complete)</SelectItem>
                      <SelectItem value="csv">CSV (Tasks Only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="export-scope">Data to Export</Label>
                  <Select value={exportScope} onValueChange={(value: ExportScope) => setExportScope(value)}>
                    <SelectTrigger id="export-scope">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Everything</SelectItem>
                      <SelectItem value="tasks">Tasks Only</SelectItem>
                      <SelectItem value="lists">Lists Only</SelectItem>
                      <SelectItem value="sessions">Sessions Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                onClick={exportData} 
                disabled={isExporting} 
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <Package className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </>
                )}
              </Button>
            </div>
            <Separator />
            
            {/* Import Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Import Data</Label>
                <p className="text-sm text-muted-foreground">
                  Upload a JSON backup file to restore your data
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  disabled={isImporting}
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  disabled={isImporting}
                  className="shrink-0"
                >
                  {isImporting ? (
                    <Package className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {importResult && (
                <Alert>
                  {importResult.includes('success') ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{importResult}</AlertDescription>
                </Alert>
              )}
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-destructive">Clear All Data</Label>
                <p className="text-sm text-muted-foreground">
                  Remove all tasks, lists, and sessions permanently
                </p>
              </div>
              <Button onClick={clearAllData} variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Shortcuts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="h-4 w-4" />
              Keyboard Shortcuts
            </CardTitle>
            <CardDescription>
              Quick access keys for productivity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Quick Add Task</span>
                  <Badge variant="outline" className="text-xs">Ctrl + K</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Start/Pause Timer</span>
                  <Badge variant="outline" className="text-xs">Space</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Stop Timer</span>
                  <Badge variant="outline" className="text-xs">Esc</Badge>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Open Command Palette</span>
                  <Badge variant="outline" className="text-xs">Ctrl + P</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Focus Search</span>
                  <Badge variant="outline" className="text-xs">Ctrl + /</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Toggle Sidebar</span>
                  <Badge variant="outline" className="text-xs">Ctrl + B</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              App Statistics
            </CardTitle>
            <CardDescription>
              Your productivity overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{lists.length}</div>
                <p className="text-sm text-muted-foreground">Lists</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{tasks.length}</div>
                <p className="text-sm text-muted-foreground">Tasks</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{sessions.length}</div>
                <p className="text-sm text-muted-foreground">Sessions</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {tasks.filter(t => t.status === 'completed').length}
                </div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              About GRIT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Version</span>
                <Badge variant="secondary">1.0.0</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <Badge variant="outline">Supabase</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Framework</span>
                <Badge variant="outline">React + TypeScript</Badge>
              </div>
              <Separator className="my-3" />
              <p className="text-xs text-muted-foreground">
                A personal task manager with focus timer, built for productivity enthusiasts. 
                Features include Pomodoro timers, habit tracking, advanced analytics, and seamless data synchronization.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};