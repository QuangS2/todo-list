import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
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

import db from '../db.js';

describe('Kiểm thử API CRUD Todos được bảo vệ (/api/todos)', () => {
  const mockUser = { id: 1, email: 'user@example.com', name: 'Lê Anh Quang' };
  let mockToken;

  beforeEach(() => {
    vi.restoreAllMocks();
    // Tạo Access Token hợp lệ phục vụ xác thực
    mockToken = jwt.sign(mockUser, process.env.JWT_SECRET || 'super-secret-jwt-key', { expiresIn: '15m' });
  });

  it('Báo lỗi 401 khi không gửi kèm Token', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toContain('Token xác thực không tồn tại');
  });

  it('GET /api/todos - Trả về danh sách todo của user', async () => {
    db.query.mockResolvedValueOnce({
      rowCount: 2,
      rows: [
        { id: 1, title: 'Viết unit tests', completed: true, created_at: new Date() },
        { id: 2, title: 'Tích hợp Docker', completed: false, created_at: new Date() }
      ]
    });

    const res = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${mockToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].title).toBe('Viết unit tests');
    expect(res.body[1].completed).toBe(false);
  });

  it('POST /api/todos - Tạo mới một todo hợp lệ', async () => {
    db.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ id: 3, title: 'Học viết API test bằng Supertest', completed: false, created_at: new Date() }]
    });

    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({ title: 'Học viết API test bằng Supertest' });

    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBe(3);
    expect(res.body.title).toBe('Học viết API test bằng Supertest');
    expect(res.body.completed).toBe(false);
  });

  it('POST /api/todos - Báo lỗi 400 khi tiêu đề bị bỏ trống', async () => {
    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({ title: '   ' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Tiêu đề công việc không được để trống.');
  });

  it('PUT /api/todos/:id - Cập nhật trạng thái và tiêu đề todo (Chính chủ)', async () => {
    // 1. Giả lập kiểm tra quyền sở hữu: trả về có quyền (rowCount = 1)
    db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1 }] });
    // 2. Giả lập lấy thông tin hiện tại
    db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ title: 'Viết test', completed: false }] });
    // 3. Giả lập UPDATE thành công
    db.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ id: 1, title: 'Đã hoàn tất viết test', completed: true }]
    });

    const res = await request(app)
      .put('/api/todos/1')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({ title: 'Đã hoàn tất viết test', completed: true });

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Đã hoàn tất viết test');
    expect(res.body.completed).toBe(true);
  });

  it('PUT /api/todos/:id - Báo lỗi 404 khi cập nhật todo không phải của mình (IDOR Protection)', async () => {
    // Giả lập kiểm tra sở hữu: trả về không có quyền (rowCount = 0)
    db.query.mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(app)
      .put('/api/todos/999')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({ title: 'Hack tiêu đề', completed: true });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toContain('Không tìm thấy công việc này hoặc bạn không có quyền cập nhật.');
  });

  it('DELETE /api/todos/:id - Xóa một todo hiện có (Chính chủ)', async () => {
    // 1. Giả lập kiểm tra quyền sở hữu: trả về có quyền (rowCount = 1)
    db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 2 }] });
    // 2. Giả lập DELETE thành công
    db.query.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app)
      .delete('/api/todos/2')
      .set('Authorization', `Bearer ${mockToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Xóa công việc thành công.');
    expect(res.body.id).toBe(2);
  });
});
