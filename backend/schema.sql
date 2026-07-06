-- ==============================================================================
-- SCHEMA KHỞI TẠO CƠ SỞ DỮ LIỆU POSTGRESQL (Todo List App Stack)
-- ==============================================================================

-- 1. Bảng lưu trữ người dùng
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng lưu trữ công việc (todos)
CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    completed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bắt buộc tạo Index cho cột user_id để tăng tốc câu lệnh truy vấn WHERE user_id = $1
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);

-- 3. Bảng lưu trữ Refresh Tokens (Quản lý thu hồi token & chống tấn công CSRF)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bắt buộc tạo Index cho cột token để tìm kiếm và xác minh khi refresh token nhanh hơn
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
