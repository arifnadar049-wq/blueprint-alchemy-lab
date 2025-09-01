import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { useAppStore } from '@/store/useAppStore';

const Index = () => {
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

  return <AppShell />;
};

export default Index;
