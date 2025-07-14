import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

interface AuthMonitorState {
  sessionHealth: 'healthy' | 'warning' | 'error';
  lastChecked: Date | null;
  issues: string[];
  sessionExpiresAt: Date | null;
}

export const useAuthMonitor = () => {
  const { user, session, loading } = useAuth();
  const [monitorState, setMonitorState] = useState<AuthMonitorState>({
    sessionHealth: 'healthy',
    lastChecked: null,
    issues: [],
    sessionExpiresAt: null
  });

  useEffect(() => {
    if (loading || !user) return;

    let monitorInterval: NodeJS.Timeout;
    let warningShown = false;

    const checkSessionHealth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        const now = new Date();
        const issues: string[] = [];
        let health: 'healthy' | 'warning' | 'error' = 'healthy';

        // Check for session errors
        if (error) {
          issues.push(`Session error: ${error.message}`);
          health = 'error';
        }

        // Check if session exists when user is logged in
        if (user && !currentSession) {
          issues.push('User exists but session is missing');
          health = 'error';
        }

        // Check session expiration
        if (currentSession) {
          const expiresAt = new Date(currentSession.expires_at * 1000);
          const timeUntilExpiry = expiresAt.getTime() - now.getTime();
          const minutesUntilExpiry = Math.floor(timeUntilExpiry / 1000 / 60);

          if (timeUntilExpiry < 5 * 60 * 1000) { // Less than 5 minutes
            issues.push(`Session expires in ${minutesUntilExpiry} minutes`);
            health = 'warning';
            
            // Show warning toast once
            if (!warningShown && minutesUntilExpiry > 0) {
              toast.warning(`Tu sesión expira en ${minutesUntilExpiry} minutos`);
              warningShown = true;
            }
          } else if (timeUntilExpiry < 0) {
            issues.push('Session has expired');
            health = 'error';
          }

          setMonitorState({
            sessionHealth: health,
            lastChecked: now,
            issues,
            sessionExpiresAt: expiresAt
          });
        }

        // Log issues if any
        if (issues.length > 0) {
          logger.warn('Auth monitor detected issues:', issues);
        }

      } catch (error) {
        logger.error('Auth monitor error:', error);
        setMonitorState(prev => ({
          ...prev,
          sessionHealth: 'error',
          issues: [...prev.issues, 'Monitor check failed'],
          lastChecked: new Date()
        }));
      }
    };

    // Initial check
    checkSessionHealth();

    // Check every 30 seconds
    monitorInterval = setInterval(checkSessionHealth, 30 * 1000);

    return () => {
      if (monitorInterval) {
        clearInterval(monitorInterval);
      }
    };
  }, [user, session, loading]);

  // Handle session recovery
  const recoverSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      if (!data.session) {
        // Try to refresh the session
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          throw refreshError;
        }
      }
      
      toast.success('Sesión recuperada exitosamente');
      return true;
    } catch (error) {
      logger.error('Session recovery failed:', error);
      toast.error('No se pudo recuperar la sesión. Por favor, inicia sesión nuevamente.');
      return false;
    }
  };

  return {
    ...monitorState,
    recoverSession
  };
};

// Optional: AuthMonitor component for debugging
export const AuthMonitorDebug: React.FC = () => {
  const { sessionHealth, lastChecked, issues, sessionExpiresAt, recoverSession } = useAuthMonitor();
  const { user } = useAuth();

  // Only show in development
  if (import.meta.env.VITE_ENVIRONMENT === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-4 text-xs max-w-xs shadow-lg z-50">
      <h4 className="font-semibold mb-2">Auth Monitor</h4>
      
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            sessionHealth === 'healthy' ? 'bg-green-500' :
            sessionHealth === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className="capitalize">{sessionHealth}</span>
        </div>
        
        <div>User: {user ? '✅' : '❌'}</div>
        
        {sessionExpiresAt && (
          <div>
            Expires: {Math.floor((sessionExpiresAt.getTime() - Date.now()) / 1000 / 60)}min
          </div>
        )}
        
        <div>
          Last check: {lastChecked ? lastChecked.toLocaleTimeString() : 'Never'}
        </div>
        
        {issues.length > 0 && (
          <div className="mt-2">
            <div className="text-red-600 font-medium">Issues:</div>
            {issues.map((issue, index) => (
              <div key={index} className="text-red-600">• {issue}</div>
            ))}
            
            {sessionHealth === 'error' && (
              <button 
                onClick={recoverSession}
                className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs"
              >
                Recover Session
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
