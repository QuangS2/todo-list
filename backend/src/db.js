import pg from 'pg';
import dotenv from 'dotenv';

// Khởi chạy dotenv để đảm bảo các biến môi trường luôn được nạp đầy đủ (kể cả khi chạy unit test độc lập)
dotenv.config();

const { Pool } = pg;

const poolConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'todolist',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432', 10),
};

const pool = new Pool(poolConfig);

// Lắng nghe sự kiện lỗi trên các client rảnh rỗi trong pool để tránh crash tiến trình
pool.on('error', (err) => {
  console.error('Lỗi Pool kết nối PostgreSQL ngoài dự kiến:', err.message);
});

export const query = async (text, params) => {
  const start = Date.now();
  try {
    // Bắt buộc sử dụng truy vấn tham số hóa (Parameterized Queries) để chống SQL Injection
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log thời gian thực thi ở môi trường development phục vụ tối ưu hiệu năng
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Database Query] Thực thi: ${text.replace(/\s+/g, ' ').substring(0, 100)}... | Thời gian: ${duration}ms | Số hàng: ${res.rowCount}`);
    }
    return res;
  } catch (error) {
    console.error(`[Database Error] Truy vấn thất bại: ${text} | Chi tiết:`, error.message);
    throw error;
  }
};

export const closePool = async () => {
  await pool.end();
};

export default {
  query,
  closePool
};
