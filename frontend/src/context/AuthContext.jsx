import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Khôi phục phiên làm việc giả định từ memory (state). Không sử dụng localStorage cho token.
    const storedUser = localStorage.getItem('todo_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken('mock-jwt-access-token-xyz'); // Gán token giả lập vào bộ nhớ state
      } catch (e) {
        localStorage.removeItem('todo_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Giả lập độ trễ mạng (0ms khi chạy test)
    await new Promise((resolve) => setTimeout(resolve, process.env.NODE_ENV === 'test' ? 0 : 500));

    if (!email || !password) {
      throw new Error('Vui lòng nhập đầy đủ thông tin đăng nhập.');
    }

    // Tài khoản kiểm thử mặc định
    if (email === 'user@example.com' && password === 'password123') {
      const mockUser = { id: 1, email, name: 'Lê Anh Quang' };
      setUser(mockUser);
      setToken('mock-jwt-access-token-xyz');
      localStorage.setItem('todo_user', JSON.stringify(mockUser));
      return mockUser;
    } else {
      throw new Error('Email hoặc mật khẩu không chính xác.');
    }
  };

  const register = async (email, password, name) => {
    await new Promise((resolve) => setTimeout(resolve, process.env.NODE_ENV === 'test' ? 0 : 500));

    if (!email || !password || !name) {
      throw new Error('Vui lòng điền đầy đủ tất cả các trường.');
    }

    if (email === 'user@example.com') {
      throw new Error('Email này đã được sử dụng để đăng ký tài khoản.');
    }

    const mockUser = { id: Date.now(), email, name };
    setUser(mockUser);
    setToken('mock-jwt-access-token-xyz');
    localStorage.setItem('todo_user', JSON.stringify(mockUser));
    return mockUser;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('todo_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!token }}>
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
