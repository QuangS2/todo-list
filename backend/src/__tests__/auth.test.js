import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../app';

// Mock module db.js để tránh truy cập cơ sở dữ liệu thật khi chạy test tự động
vi.mock('../db.js', () => {
  return {
    default: {
      query: vi.fn(),
      closePool: vi.fn()
    },
    query: vi.fn(),
    closePool: vi.fn()
  };
});

// Import mock db để tiêm giá trị trả về giả lập
import db from '../db.js';

describe('Kiểm thử API Xác thực & Cấp phát JWT (/api/auth)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/auth/register - Đăng ký người dùng', () => {
    it('Đăng ký thành công tài khoản hợp lệ', async () => {
      // 1. Giả lập email chưa tồn tại
      db.query.mockResolvedValueOnce({ rowCount: 0 });
      // 2. Giả lập INSERT user thành công
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 10, email: 'new@example.com', name: 'Thành viên mới' }]
      });
      // 3. Giả lập INSERT refresh token thành công
      db.query.mockResolvedValueOnce({ rowCount: 1 });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'new@example.com', password: 'password123', name: 'Thành viên mới' });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user).toEqual({ id: 10, email: 'new@example.com', name: 'Thành viên mới' });
      
      // Kiểm tra sự hiện diện của Cookie HTTP-Only refresh_token
      const cookies = res.headers['set-cookie'][0];
      expect(cookies).toContain('refresh_token=');
      expect(cookies).toContain('HttpOnly');
    });

    it('Báo lỗi 400 khi trùng email đăng ký', async () => {
      // Giả lập email đã tồn tại
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1 }] });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'duplicate@example.com', password: 'password123', name: 'Tên' });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Email này đã được sử dụng.');
    });
  });

  describe('POST /api/auth/login - Đăng nhập', () => {
    it('Đăng nhập thành công với thông tin đúng', async () => {
      const plainPassword = 'password123';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(plainPassword, salt);

      // 1. Giả lập tìm thấy người dùng
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 5, email: 'login@example.com', password_hash: hash, name: 'Người dùng Đăng nhập' }]
      });
      // 2. Giả lập lưu Refresh Token thành công
      db.query.mockResolvedValueOnce({ rowCount: 1 });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: plainPassword });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user.name).toBe('Người dùng Đăng nhập');
    });

    it('Báo lỗi 401 khi sai mật khẩu', async () => {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('correct_pass', salt);

      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 5, email: 'login@example.com', password_hash: hash, name: 'Tên' }]
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'wrong_pass' });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Email hoặc mật khẩu không chính xác.');
    });
  });

  describe('POST /api/auth/refresh - Gia hạn Access Token', () => {
    it('Gia hạn thành công khi gửi kèm Refresh Token hợp lệ', async () => {
      const mockUser = { id: 2, email: 'refresh@example.com', name: 'Gia hạn' };
      const refreshToken = jwt.sign({ id: mockUser.id }, 'super-secret-refresh-key', { expiresIn: '7d' });

      // Giả lập tìm thấy token hợp lệ trong DB
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ user_id: mockUser.id, email: mockUser.email, name: mockUser.name }]
      });

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refresh_token=${refreshToken}`]);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });

    it('Báo lỗi 401 khi thiếu cookie refresh token', async () => {
      const res = await request(app).post('/api/auth/refresh');
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Không tìm thấy Refresh Token.');
    });
  });

  describe('POST /api/auth/logout - Đăng xuất', () => {
    it('Xóa sạch cookie và vô hiệu hóa token trong database', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // Giả lập xóa token thành công

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', ['refresh_token=some_token_here']);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Đăng xuất thành công.');
      
      const cookies = res.headers['set-cookie'][0];
      // Kiểm tra cookie đã được dọn dẹp (Expires về mốc 1970)
      expect(cookies).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    });
  });
});
