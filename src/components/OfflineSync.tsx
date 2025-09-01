import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/useAppStore';

interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'task' | 'list' | 'session';
  data: any;
  timestamp: Date;
  retryCount: number;
}

export const OfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { toast } = useToast();
  const { tasks, lists, sessions } = useAppStore();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back online",
        description: "Connection restored. Syncing changes...",
        variant: "default",
      });
      syncPendingOperations();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "You're offline",
        description: "Changes will be saved locally and synced when connection is restored.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load pending operations from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('pendingOperations');
    if (stored) {
      try {
        const operations = JSON.parse(stored).map((op: any) => ({
          ...op,
          timestamp: new Date(op.timestamp)
        }));
        setPendingOperations(operations);
      } catch (error) {
        console.error('Failed to load pending operations:', error);
      }
    }

    const lastSync = localStorage.getItem('lastSyncTime');
    if (lastSync) {
      setLastSyncTime(new Date(lastSync));
    }
  }, []);

  // Save pending operations to localStorage
  useEffect(() => {
    localStorage.setItem('pendingOperations', JSON.stringify(pendingOperations));
  }, [pendingOperations]);

  const addPendingOperation = (operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount'>) => {
    const newOperation: PendingOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      retryCount: 0
    };

    setPendingOperations(prev => [...prev, newOperation]);

    if (!isOnline) {
      toast({
        title: "Saved offline",
        description: "Changes saved locally. Will sync when online.",
        variant: "default",
      });
    }
  };

  const syncPendingOperations = async () => {
    if (!isOnline || isSyncing || pendingOperations.length === 0) {
      return;
    }

    setIsSyncing(true);
    const successfulOperations: string[] = [];
    const failedOperations: PendingOperation[] = [];

    for (const operation of pendingOperations) {
      try {
        await executeOperation(operation);
        successfulOperations.push(operation.id);
      } catch (error) {
        console.error('Sync operation failed:', error);
        
        if (operation.retryCount < 3) {
          failedOperations.push({
            ...operation,
            retryCount: operation.retryCount + 1
          });
        } else {
          // Give up after 3 retries
          toast({
            title: "Sync failed",
            description: `Failed to sync ${operation.type} ${operation.entity} after 3 attempts.`,
            variant: "destructive",
          });
        }
      }
    }

    // Update pending operations
    setPendingOperations(prev => [
      ...prev.filter(op => !successfulOperations.includes(op.id)),
      ...failedOperations
    ]);

    if (successfulOperations.length > 0) {
      setLastSyncTime(new Date());
      localStorage.setItem('lastSyncTime', new Date().toISOString());
      
      toast({
        title: "Sync completed",
        description: `Successfully synced ${successfulOperations.length} operations.`,
        variant: "default",
      });
    }

    setIsSyncing(false);
  };

  const executeOperation = async (operation: PendingOperation) => {
    // This would normally call your Supabase sync functions
    // For now, we'll simulate the API calls
    
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    await delay(Math.random() * 1000 + 500); // Simulate network delay
    
    // Simulate occasional failures for testing
    if (Math.random() < 0.1) {
      throw new Error('Simulated network error');
    }

    // Here you would implement actual Supabase operations
    console.log('Executing operation:', operation);
  };

  const clearPendingOperations = () => {
    setPendingOperations([]);
    localStorage.removeItem('pendingOperations');
    toast({
      title: "Operations cleared",
      description: "All pending operations have been cleared.",
      variant: "default",
    });
  };

  const forceSync = () => {
    if (isOnline) {
      syncPendingOperations();
    } else {
      toast({
        title: "Can't sync",
        description: "No internet connection available.",
        variant: "destructive",
      });
    }
  };

  const getConflictStatus = () => {
    // Simple conflict detection based on local vs server timestamps
    // In a real app, you'd compare with server data
    const hasConflicts = pendingOperations.some(op => op.retryCount > 0);
    return hasConflicts;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-600" />
          )}
          Sync Status
          <Badge variant={isOnline ? "secondary" : "destructive"}>
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sync Status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {lastSyncTime ? (
                <>Last synced: {lastSyncTime.toLocaleTimeString()}</>
              ) : (
                "Never synced"
              )}
            </p>
            {pendingOperations.length > 0 && (
              <p className="text-sm text-amber-600">
                {pendingOperations.length} operations pending
              </p>
            )}
          </div>
          
          <Button
            onClick={forceSync}
            disabled={!isOnline || isSyncing}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>

        {/* Conflict Warning */}
        {getConflictStatus() && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Some operations failed to sync. They will be retried automatically.
            </AlertDescription>
          </Alert>
        )}

        {/* Offline Alert */}
        {!isOnline && (
          <Alert>
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              You're working offline. Changes are being saved locally and will sync when connection is restored.
            </AlertDescription>
          </Alert>
        )}

        {/* Success State */}
        {isOnline && pendingOperations.length === 0 && lastSyncTime && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              All changes are synced. You're up to date!
            </AlertDescription>
          </Alert>
        )}

        {/* Pending Operations List */}
        {pendingOperations.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Pending Operations:</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {pendingOperations.slice(0, 5).map((op) => (
                <div key={op.id} className="text-xs p-2 bg-muted rounded flex justify-between">
                  <span>{op.type} {op.entity}</span>
                  <Badge variant="outline">
                    {op.retryCount > 0 ? `Retry ${op.retryCount}` : 'Pending'}
                  </Badge>
                </div>
              ))}
              {pendingOperations.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{pendingOperations.length - 5} more...
                </p>
              )}
            </div>
            
            <Button
              onClick={clearPendingOperations}
              size="sm"
              variant="outline"
              className="w-full"
            >
              Clear All Pending
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Hook to use offline sync functionality
export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const queueOperation = (operation: any) => {
    // Add operation to queue
    const event = new CustomEvent('queueOperation', { detail: operation });
    window.dispatchEvent(event);
  };
  
  return { isOnline, queueOperation };
};