// Debug component to help troubleshoot loading issues
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

const AuthDebugger = () => {
  const { 
    user, 
    profile, 
    loading, 
    profileLoading, 
    canHost, 
    canGuest, 
    isVerified 
  } = useAuth();
  
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    const newLog = `${new Date().toLocaleTimeString()}: User=${!!user}, Profile=${!!profile}, Loading=${loading}`;
    setLogs(prev => [...prev.slice(-4), newLog]); // Keep last 5 logs
  }, [user, profile, loading]);

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 9999,
        maxWidth: '300px'
      }}
    >
      <h4>Auth Debug Info</h4>
      <div>Loading: {loading ? 'YES' : 'NO'}</div>
      <div>Profile Loading: {profileLoading ? 'YES' : 'NO'}</div>
      <div>Has User: {user ? 'YES' : 'NO'}</div>
      <div>Has Profile: {profile ? 'YES' : 'NO'}</div>
      <div>Can Host: {canHost ? 'YES' : 'NO'}</div>
      <div>Can Guest: {canGuest ? 'YES' : 'NO'}</div>
      <div>Is Verified: {isVerified ? 'YES' : 'NO'}</div>
      <div>User Email: {user?.email || 'None'}</div>
      <div style={{ marginTop: '10px', fontSize: '10px' }}>
        <div>Recent Events:</div>
        {logs.map((log, idx) => (
          <div key={idx} style={{ opacity: 0.7 }}>{log}</div>
        ))}
      </div>
    </div>
  );
};

export default AuthDebugger;
