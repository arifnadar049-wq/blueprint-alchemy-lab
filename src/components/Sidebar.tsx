import React, { useState } from 'react';
import { Plus, Settings as SettingsIcon, BarChart3, Inbox, Calendar, CalendarDays, CheckCircle, MoreHorizontal, Edit2, Activity, User, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { ListManager } from './ListManager';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const { lists, selectedListId, setSelectedListId, tasks } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);

  const getListIcon = (iconName: string) => {
    const icons = {
      Inbox,
      Calendar,
      CalendarDays,
      CheckCircle
    };
    return icons[iconName as keyof typeof icons] || Inbox;
  };

  const getTaskCount = (listId: string) => {
    return tasks.filter(task => task.listId === listId && task.status !== 'completed').length;
  };

  const handleListClick = (listId: string) => {
    setCurrentView('tasks');
    setSelectedListId(listId);
  };

  return (
    <div className={cn(
      "bg-gradient-surface border-r border-border transition-all duration-300",
      collapsed ? "w-14" : "w-64"
    )}>
      <div className="p-4">
        {!collapsed && (
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">G</span>
            </div>
            <span className="font-semibold text-foreground">GRIT</span>
          </div>
        )}

        {/* Quick Add */}
        <Button 
          variant="outline" 
          size={collapsed ? "icon" : "default"}
          className="w-full mb-4 justify-start gap-2"
        >
          <Plus className="h-4 w-4" />
          {!collapsed && "Quick Add"}
        </Button>

        {/* Navigation Section */}
        <div className="space-y-3 mb-6">
          {!collapsed && (
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
              Navigation
            </h3>
          )}
          
          <div className="space-y-1">
            <Button
              variant={currentView === 'tasks' ? "secondary" : "ghost"}
              size={collapsed ? "icon" : "default"}
              className={cn(
                "w-full justify-start gap-3 hover:bg-secondary/50 transition-colors",
                currentView === 'tasks' && "bg-secondary text-secondary-foreground"
              )}
              onClick={() => setCurrentView('tasks')}
            >
              <CheckCircle className="h-4 w-4" />
              {!collapsed && "Tasks"}
            </Button>

            <Button
              variant={currentView === 'habits' ? "secondary" : "ghost"}
              size={collapsed ? "icon" : "default"}
              className={cn(
                "w-full justify-start gap-3 hover:bg-secondary/50 transition-colors",
                currentView === 'habits' && "bg-secondary text-secondary-foreground"
              )}
              onClick={() => setCurrentView('habits')}
            >
              <Activity className="h-4 w-4" />
              {!collapsed && "Habits"}
            </Button>
            
            <Button
              variant={currentView === 'calendar' ? "secondary" : "ghost"}
              size={collapsed ? "icon" : "default"}
              className={cn(
                "w-full justify-start gap-3 hover:bg-secondary/50 transition-colors",
                currentView === 'calendar' && "bg-secondary text-secondary-foreground"
              )}
              onClick={() => setCurrentView('calendar')}
            >
              <CalendarIcon className="h-4 w-4" />
              {!collapsed && "Calendar"}
            </Button>

            <Button
              variant={currentView === 'reports' ? "secondary" : "ghost"}
              size={collapsed ? "icon" : "default"}
              className={cn(
                "w-full justify-start gap-3 hover:bg-secondary/50 transition-colors",
                currentView === 'reports' && "bg-secondary text-secondary-foreground"
              )}
              onClick={() => setCurrentView('reports')}
            >
              <BarChart3 className="h-4 w-4" />
              {!collapsed && "Reports"}
            </Button>

            <Button
              variant="ghost"
              size={collapsed ? "icon" : "default"}
              className="w-full justify-start gap-3 hover:bg-secondary/50 transition-colors"
              onClick={() => window.location.href = '/profile'}
            >
              <User className="h-4 w-4" />
              {!collapsed && "Profile"}
            </Button>

            <Button
              variant={currentView === 'settings' ? "secondary" : "ghost"}
              size={collapsed ? "icon" : "default"}
              className={cn(
                "w-full justify-start gap-3 hover:bg-secondary/50 transition-colors",
                currentView === 'settings' && "bg-secondary text-secondary-foreground"
              )}
              onClick={() => setCurrentView('settings')}
            >
              <SettingsIcon className="h-4 w-4" />
              {!collapsed && "Settings"}
            </Button>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Task Lists Section - Only show when in tasks view */}
        {currentView === 'tasks' && (
          <div className="space-y-3">
            {!collapsed && (
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
                Task Lists
              </h3>
            )}
            
            {/* Default Task Views */}
            <div className="space-y-1">
              <Button
                variant={selectedListId === 'backlog' ? "secondary" : "ghost"}
                size={collapsed ? "icon" : "default"}
                className={cn(
                  "w-full justify-start gap-3 h-10 hover:bg-secondary/50 transition-colors",
                  selectedListId === 'backlog' && "bg-secondary text-secondary-foreground"
                )}
                onClick={() => handleListClick('backlog')}
              >
                <Inbox className="h-4 w-4 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Backlog</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {tasks.filter(task => task.status !== 'completed').length}
                    </Badge>
                  </>
                )}
              </Button>

              <Button
                variant={selectedListId === 'today' ? "secondary" : "ghost"}
                size={collapsed ? "icon" : "default"}
                className={cn(
                  "w-full justify-start gap-3 h-10 hover:bg-secondary/50 transition-colors",
                  selectedListId === 'today' && "bg-secondary text-secondary-foreground"
                )}
                onClick={() => handleListClick('today')}
              >
                <Calendar className="h-4 w-4 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Today</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {tasks.filter(task => {
                        if (task.status === 'completed') return false;
                        if (!task.dueDate) return false;
                        const today = new Date();
                        const dueDate = new Date(task.dueDate);
                        return dueDate.toDateString() === today.toDateString();
                      }).length}
                    </Badge>
                  </>
                )}
              </Button>

              <Button
                variant={selectedListId === 'week' ? "secondary" : "ghost"}
                size={collapsed ? "icon" : "default"}
                className={cn(
                  "w-full justify-start gap-3 h-10 hover:bg-secondary/50 transition-colors",
                  selectedListId === 'week' && "bg-secondary text-secondary-foreground"
                )}
                onClick={() => handleListClick('week')}
              >
                <CalendarDays className="h-4 w-4 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">This Week</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {tasks.filter(task => {
                        if (task.status === 'completed') return false;
                        if (!task.dueDate) return false;
                        const now = new Date();
                        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
                        const weekEnd = new Date(now.setDate(weekStart.getDate() + 6));
                        const dueDate = new Date(task.dueDate);
                        return dueDate >= weekStart && dueDate <= weekEnd;
                      }).length}
                    </Badge>
                  </>
                )}
              </Button>
            </div>
            
            {!collapsed && (
              <Separator className="my-2" />
            )}

            {/* Custom Lists */}
            <div className="space-y-1">
              {lists.map((list) => {
                const Icon = getListIcon(list.icon);
                const count = getTaskCount(list.id);
                const isSelected = selectedListId === list.id;

                return (
                  <div key={list.id} className="group relative">
                    <Button
                      variant={isSelected ? "secondary" : "ghost"}
                      size={collapsed ? "icon" : "default"}
                      className={cn(
                        "w-full justify-start gap-3 h-10 hover:bg-secondary/50 transition-colors",
                        isSelected && "bg-secondary text-secondary-foreground"
                      )}
                      onClick={() => handleListClick(list.id)}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" style={{ color: list.color }} />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{list.name}</span>
                          {count > 0 && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {count}
                            </Badge>
                          )}
                        </>
                      )}
                    </Button>
                    
                    {/* List Actions Menu */}
                    {!collapsed && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 opacity-60 group-hover:opacity-100 hover:bg-secondary/50 transition-all duration-200"
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <ListManager
                            listId={list.id}
                            mode="edit"
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit List
                              </DropdownMenuItem>
                            }
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                );
              })}
              
              {/* Add List Button */}
              {!collapsed && (
                <ListManager
                  trigger={
                    <Button variant="outline" size="sm" className="w-full gap-2 mt-2">
                      <Plus className="h-4 w-4" />
                      New List
                    </Button>
                  }
                />
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};