import React, { useState } from 'react';
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
  const [currentView, setCurrentView] = useState('tasks');

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
    <div className="dark min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header />
        {renderMainContent()}
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