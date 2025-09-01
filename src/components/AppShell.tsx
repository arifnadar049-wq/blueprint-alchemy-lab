import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MainWorkspace } from './MainWorkspace';
import { EnhancedTimerOverlay } from './EnhancedTimerOverlay';
import { CommandPalette } from './CommandPalette';
import { NotificationSystem } from './NotificationSystem';
import { Reports } from './Reports';
import { Settings } from './Settings';
import { Habits } from './Habits';
import { Calendar } from './Calendar';

export const AppShell = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentView, setCurrentView] = useState(() => {
    return searchParams.get('view') || 'tasks';
  });

  // Sync URL params with view state
  useEffect(() => {
    const view = searchParams.get('view') || 'tasks';
    setCurrentView(view);
  }, [searchParams]);

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    setSearchParams({ view });
  };

  const renderMainContent = () => {
    switch (currentView) {
      case 'tasks':
        return <MainWorkspace />;
      case 'habits':
        return <Habits />;
      case 'calendar':
        return <Calendar />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <MainWorkspace />;
    }
  };

  return (
    <div className="dark min-h-screen bg-background flex animate-fade-in">
      {/* Sidebar */}
      <Sidebar currentView={currentView} setCurrentView={handleViewChange} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1 animate-scale-in">
          {renderMainContent()}
        </div>
      </div>
      
      {/* Enhanced Floating Timer */}
      <EnhancedTimerOverlay />
      
      {/* Command Palette */}
      <CommandPalette />
      
      {/* Notification System */}
      <NotificationSystem />
    </div>
  );
};