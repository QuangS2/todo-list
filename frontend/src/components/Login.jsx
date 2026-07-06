import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const Login = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi đăng nhập.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-card-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Đăng nhập</h2>
          <p className="auth-subtitle">Chào mừng bạn quay trở lại với Todo List</p>
        </div>

        {error && (
          <div className="alert-message alert-danger" role="alert">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group-block">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="nhập email của bạn (vd: user@example.com)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group-block">
            <label htmlFor="login-password">Mật khẩu</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="nhập mật khẩu (vd: password123)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <button type="submit" className="btn-primary auth-submit-btn" disabled={submitting}>
            {submitting ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="auth-footer">
          <span>Chưa có tài khoản? </span>
          <button 
            type="button" 
            className="btn-link" 
            onClick={onSwitchToRegister}
            disabled={submitting}
          >
            Đăng ký ngay
          </button>
        </div>
      </div>
    </div>
  );
};
