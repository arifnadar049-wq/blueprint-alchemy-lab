import React, { useState } from 'react';
import { Plus, Settings, BarChart3, Inbox, Calendar, CalendarDays, CheckCircle, MoreHorizontal, Edit2, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { List } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { ListManager } from './ListManager';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileOptimizedSidebarProps {
  onNavigate?: (view: string) => void;
  currentView?: string;
}

export const MobileOptimizedSidebar = ({ onNavigate, currentView }: MobileOptimizedSidebarProps) => {
  const { lists, selectedListId, setSelectedListId, tasks } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

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
    setSelectedListId(listId);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleNavigate = (view: string) => {
    onNavigate?.(view);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const SidebarContent = () => (
    <div className={cn(
      "bg-gradient-surface border-r border-border transition-all duration-300 flex flex-col h-full",
      collapsed && !isMobile ? "w-14" : "w-64"
    )}>
      <div className="p-4 flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {(!collapsed || isMobile) && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">G</span>
              </div>
              <span className="font-semibold text-foreground">GRIT</span>
            </div>
          )}
          
          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="h-8 w-8 p-0"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {/* Quick Add */}
        <Button 
          variant="outline" 
          size={collapsed && !isMobile ? "icon" : "default"}
          className="w-full mb-4 justify-start gap-2"
        >
          <Plus className="h-4 w-4" />
          {(!collapsed || isMobile) && "Quick Add"}
        </Button>

        {/* Lists */}
        <div className="space-y-1">
          {lists.map((list) => {
            const Icon = getListIcon(list.icon);
            const count = getTaskCount(list.id);
            const isSelected = selectedListId === list.id;

            return (
              <div key={list.id} className="group relative">
                <Button
                  variant={isSelected ? "secondary" : "ghost"}
                  size={collapsed && !isMobile ? "icon" : "default"}
                  className={cn(
                    "w-full justify-start gap-3 h-10",
                    isSelected && "bg-secondary text-secondary-foreground"
                  )}
                  onClick={() => handleListClick(list.id)}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" style={{ color: list.color }} />
                  {(!collapsed || isMobile) && (
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
                {(!collapsed || isMobile) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
          {(!collapsed || isMobile) && (
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

        <Separator className="my-4" />

        {/* Navigation */}
        <div className="space-y-1">
          <Button
            variant={currentView === 'reports' ? "secondary" : "ghost"}
            size={collapsed && !isMobile ? "icon" : "default"}
            className="w-full justify-start gap-3"
            onClick={() => handleNavigate('reports')}
          >
            <BarChart3 className="h-4 w-4" />
            {(!collapsed || isMobile) && "Reports"}
          </Button>
          <Button
            variant={currentView === 'settings' ? "secondary" : "ghost"}
            size={collapsed && !isMobile ? "icon" : "default"}  
            className="w-full justify-start gap-3"
            onClick={() => handleNavigate('settings')}
          >
            <Settings className="h-4 w-4" />
            {(!collapsed || isMobile) && "Settings"}
          </Button>
        </div>
      </div>

      {/* Mobile Close Button */}
      {isMobile && (
        <div className="p-4 border-t">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" />
            Close
          </Button>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Trigger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return <SidebarContent />;
};