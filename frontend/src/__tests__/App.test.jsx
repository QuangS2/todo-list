import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

// Mock localStorage ở đầu tệp test theo đúng quy chuẩn dự án
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key) => { delete store[key]; }
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

describe('Kiểm thử Giao diện & Tính năng Todo List (Mốc 1)', () => {
  beforeEach(() => {
    // Reset body classes và local storage trước mỗi lần chạy test
    document.body.className = '';
    localStorage.clear();
  });

  it('Hiển thị tiêu đề chào mừng và số lượng công việc', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /Chào buổi sáng!/i })).toBeInTheDocument();
    expect(screen.getByText(/Hôm nay bạn có 1 công việc cần hoàn thành/i)).toBeInTheDocument();
  });

  it('Cho phép chuyển đổi linh hoạt giữa 3 tông màu giao diện (Cream, Dark, Gray)', () => {
    render(<App />);

    const creamBtn = screen.getByLabelText('Giao diện Kem Sữa');
    const darkBtn = screen.getByLabelText('Giao diện Tối');
    const grayBtn = screen.getByLabelText('Giao diện Xám');

    // Click chọn giao diện Tối
    fireEvent.click(darkBtn);
    expect(document.body.className).toBe('theme-dark');
    expect(localStorage.getItem('todo-theme')).toBe('dark');

    // Click chọn giao diện Xám
    fireEvent.click(grayBtn);
    expect(document.body.className).toBe('theme-gray');
    expect(localStorage.getItem('todo-theme')).toBe('gray');

    // Click trả về giao diện Kem Sữa
    fireEvent.click(creamBtn);
    expect(document.body.className).toBe('theme-cream');
    expect(localStorage.getItem('todo-theme')).toBe('cream');
  });

  it('Cho phép thêm công việc mới vào danh sách', () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/Nhập việc bạn muốn làm hôm nay.../i);
    const addButton = screen.getByRole('button', { name: /Thêm việc/i });

    fireEvent.change(input, { target: { value: 'Chạy bộ 30 phút buổi chiều' } });
    fireEvent.click(addButton);

    expect(screen.getByText('Chạy bộ 30 phút buổi chiều')).toBeInTheDocument();
  });

  it('Cho phép người dùng đánh dấu check để hoàn thành công việc', () => {
    render(<App />);
    const checkbox = screen.getByRole('checkbox', { name: /Đánh dấu Viết unit test cho các màn hình frontend/i });

    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(screen.getByText(/Tuyệt vời! Bạn đã hoàn thành tất cả công việc hôm nay./i)).toBeInTheDocument();
  });

  it('Cho phép chỉnh sửa tiêu đề công việc trực tiếp trên dòng (inline edit)', () => {
    render(<App />);
    const editBtn = screen.getByRole('button', { name: /Chỉnh sửa Viết unit test cho các màn hình frontend/i });
    
    // Nhấp vào nút sửa để bật input
    fireEvent.click(editBtn);

    const editInput = screen.getByLabelText(/Chỉnh sửa tiêu đề cho Viết unit test cho các màn hình frontend/i);
    fireEvent.change(editInput, { target: { value: 'Viết unit test màn hình đăng nhập' } });
    
    // Bấm lưu chỉnh sửa
    const saveBtn = screen.getByRole('button', { name: /Lưu chỉnh sửa/i });
    fireEvent.click(saveBtn);

    expect(screen.getByText('Viết unit test màn hình đăng nhập')).toBeInTheDocument();
    expect(screen.queryByText('Viết unit test cho các màn hình frontend')).not.toBeInTheDocument();
  });

  it('Cho phép xóa một công việc khỏi danh sách', () => {
    render(<App />);
    const deleteBtn = screen.getByRole('button', { name: /Xóa Viết unit test cho các màn hình frontend/i });

    fireEvent.click(deleteBtn);
    expect(screen.queryByText('Viết unit test cho các màn hình frontend')).not.toBeInTheDocument();
  });

  it('Lọc và tìm kiếm công việc theo từ khóa', () => {
    render(<App />);
    const searchInput = screen.getByPlaceholderText(/Tìm kiếm công việc.../i);

    fireEvent.change(searchInput, { target: { value: 'giao diện' } });

    // Chỉ hiển thị công việc khớp từ khóa
    expect(screen.getByText('Thiết kế giao diện tối giản, dịu mắt')).toBeInTheDocument();
    expect(screen.queryByText('Viết unit test cho các màn hình frontend')).not.toBeInTheDocument();
  });
});
