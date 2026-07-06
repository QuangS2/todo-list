import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const Register = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setSubmitting(true);
    try {
      await register(email, password, name);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi đăng ký tài khoản.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-card-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Đăng ký tài khoản</h2>
          <p className="auth-subtitle">Tạo tài khoản mới để bắt đầu lưu trữ công việc</p>
        </div>

        {error && (
          <div className="alert-message alert-danger" role="alert">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group-block">
            <label htmlFor="register-name">Họ và tên</label>
            <input
              id="register-name"
              type="text"
              className="form-input"
              placeholder="nhập họ và tên của bạn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group-block">
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              className="form-input"
              placeholder="nhập địa chỉ email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group-block">
            <label htmlFor="register-password">Mật khẩu</label>
            <input
              id="register-password"
              type="password"
              className="form-input"
              placeholder="nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group-block">
            <label htmlFor="register-confirm-password">Xác nhận mật khẩu</label>
            <input
              id="register-confirm-password"
              type="password"
              className="form-input"
              placeholder="nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <button type="submit" className="btn-primary auth-submit-btn" disabled={submitting}>
            {submitting ? 'Đang khởi tạo tài khoản...' : 'Đăng ký tài khoản'}
          </button>
        </form>

        <div className="auth-footer">
          <span>Đã có tài khoản? </span>
          <button 
            type="button" 
            className="btn-link" 
            onClick={onSwitchToLogin}
            disabled={submitting}
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    </div>
  );
};
