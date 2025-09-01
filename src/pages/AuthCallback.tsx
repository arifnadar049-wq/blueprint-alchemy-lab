import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        throw new Error('OAuth authorization denied');
      }

      if (!code) {
        throw new Error('No authorization code received');
      }

      // Exchange code for tokens
      const { data, error: authError } = await supabase.functions.invoke('google-calendar-auth', {
        body: { 
          action: 'callback',
          code: code
        }
      });

      if (authError || !data.success) {
        throw new Error('Failed to complete OAuth flow');
      }

      // Store tokens and user info
      localStorage.setItem('googleTokens', JSON.stringify(data.tokens));
      
      const googleSettings = {
        connected: true,
        email: data.user.email,
        lastSync: new Date().toISOString(),
        selectedCalendars: [],
        autoSync: true
      };
      
      localStorage.setItem('googleCalendarSettings', JSON.stringify(googleSettings));
      
      setStatus('success');
      toast.success('Google Calendar connected successfully!');
      
      // Redirect to app after a short delay
      setTimeout(() => {
        navigate('/app');
      }, 2000);

    } catch (error) {
      console.error('OAuth callback error:', error);
      setStatus('error');
      toast.error('Failed to connect Google Calendar');
      
      // Redirect to app after error
      setTimeout(() => {
        navigate('/app');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-elegant">
            {status === 'loading' && <Loader2 className="h-8 w-8 text-primary-foreground animate-spin" />}
            {status === 'success' && <CheckCircle className="h-8 w-8 text-primary-foreground" />}
            {status === 'error' && <XCircle className="h-8 w-8 text-primary-foreground" />}
          </div>
          <CardTitle>
            {status === 'loading' && 'Connecting Google Calendar...'}
            {status === 'success' && 'Connection Successful!'}
            {status === 'error' && 'Connection Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            {status === 'loading' && 'Please wait while we set up your Google Calendar integration.'}
            {status === 'success' && 'Your Google Calendar has been connected successfully. Redirecting to the app...'}
            {status === 'error' && 'There was an issue connecting your Google Calendar. Redirecting back to the app...'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;