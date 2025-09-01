import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { MainWorkspace } from '@/components/MainWorkspace';
import { Sidebar } from '@/components/Sidebar';
import { MobileOptimizedSidebar } from '@/components/MobileOptimizedSidebar';
import { Reports } from '@/components/Reports';
import { Settings } from '@/components/Settings';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const Index = () => {
  const [currentView, setCurrentView] = useState('tasks');
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const initializeStore = useAppStore(state => state.initializeStore);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeStore();
      } catch (error) {
        console.error('Error initializing store:', error);
      }
    };
    
    init();
  }, [initializeStore]);

  const renderContent = () => {
    switch (currentView) {
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <MainWorkspace />;
    }
  };

  const SidebarComponent = isMobile ? MobileOptimizedSidebar : Sidebar;

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <SidebarComponent 
        onNavigate={setCurrentView} 
        currentView={currentView}
        setCurrentView={setCurrentView}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Index;
