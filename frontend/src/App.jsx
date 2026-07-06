import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { TodoDashboard } from './components/TodoDashboard';

function AppContent() {
  const { user, loading } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

  // Theme state: 'cream' | 'dark' | 'gray'
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('todo-theme') || 'cream';
    }
    return 'cream';
  });

  // Sync theme class to body
  useEffect(() => {
    const body = document.body;
    body.className = `theme-${theme}`;
    localStorage.setItem('todo-theme', theme);
  }, [theme]);

  if (loading) {
    return (
      <div className="auth-card-container">
        <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>Đang tải cấu hình...</p>
        </div>
      </div>
    );
  }

  // Render Login/Register or TodoDashboard based on login status
  if (!user) {
    return isRegistering ? (
      <Register onSwitchToLogin={() => setIsRegistering(false)} />
    ) : (
      <Login onSwitchToRegister={() => setIsRegistering(true)} />
    );
  }

  return <TodoDashboard theme={theme} setTheme={setTheme} />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
