import React, { createContext, useState, useContext, useEffect } from 'react';
import api, { setAccessToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lắng nghe sự thay đổi của Token từ API Client (để xử lý logout tự động nếu refresh hết hạn)
  useEffect(() => {
    api.setOnTokenRefreshed((newToken) => {
      if (!newToken) {
        setUser(null);
        localStorage.removeItem('todo_user');
      }
    });
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('todo_user');
    if (storedUser) {
      const restoreSession = async () => {
        try {
          // Gọi API refresh token ngầm khi khởi động để nạp access token vào RAM
          const res = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });
          
          if (res.ok) {
            const data = await res.json();
            setAccessToken(data.accessToken);
            setUser(JSON.parse(storedUser));
          } else {
            // Nếu refresh token đã hết hạn, xóa phiên cũ
            localStorage.removeItem('todo_user');
          }
        } catch (e) {
          console.error('Lỗi khi tự động phục hồi phiên làm việc:', e.message);
        } finally {
          setLoading(false);
        }
      };
      restoreSession();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setUser(data.user);
    localStorage.setItem('todo_user', JSON.stringify(data.user));
    return data.user;
  };

  const register = async (email, password, name) => {
    const data = await api.register(email, password, name);
    setUser(data.user);
    localStorage.setItem('todo_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    localStorage.removeItem('todo_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong một AuthProvider');
  }
  return context;
};
