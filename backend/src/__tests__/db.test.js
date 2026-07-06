import { vi, describe, it, expect } from 'vitest';

// Mock module 'pg' trước khi import db.js để tránh kết nối đến server thật
vi.mock('pg', () => {
  const mockQuery = vi.fn().mockImplementation((text, params) => {
    if (text.includes('SELECT * FROM users')) {
      return Promise.resolve({
        rowCount: 1,
        rows: [{ id: 1, email: 'user@example.com', name: 'Test User' }]
      });
    }
    return Promise.resolve({ rowCount: 0, rows: [] });
  });

  const mockEnd = vi.fn().mockResolvedValue();
  const mockPool = vi.fn().mockImplementation(() => ({
    query: mockQuery,
    on: vi.fn(),
    end: mockEnd,
  }));

  return {
    default: {
      Pool: mockPool
    },
    Pool: mockPool
  };
});

// Import module kết nối sau khi mock đã được áp dụng
import { query, closePool } from '../db';

describe('Kiểm thử Module kết nối Cơ sở dữ liệu (db.js - Mocked)', () => {
  it('Hàm query() ủy quyền câu lệnh cho pg.Pool thực thi thành công', async () => {
    const res = await query('SELECT * FROM users WHERE id = $1', [1]);
    
    expect(res.rowCount).toBe(1);
    expect(res.rows[0].email).toBe('user@example.com');
    expect(res.rows[0].name).toBe('Test User');
  });

  it('Hàm closePool() đóng kết nối pool thành công', async () => {
    await expect(closePool()).resolves.toBeUndefined();
  });
});
