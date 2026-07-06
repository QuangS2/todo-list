import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

// Mock localStorage theo đúng quy chuẩn dự án
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

describe('Kiểm thử Giao diện & Tính năng Todo List (Mốc 1 sau khi đăng nhập)', () => {
  beforeEach(() => {
    document.body.className = '';
    localStorage.clear();
    // Giả lập trạng thái đã đăng nhập trước cho các test case CRUD của Mốc 1
    localStorage.setItem('todo_user', JSON.stringify({ id: 1, email: 'user@example.com', name: 'Lê Anh Quang' }));
  });

  it('Hiển thị tiêu đề chào mừng chứa tên user và số lượng công việc', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /Chào buổi sáng, Lê Anh Quang!/i })).toBeInTheDocument();
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
    
    // Bấm Enter để lưu
    fireEvent.keyDown(editInput, { key: 'Enter', code: 'Enter' });

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
    fireEvent.change(searchInput, { target: { value: 'frontend' } });

    // Chỉ hiển thị công việc khớp từ khóa
    expect(screen.getByText('Viết unit test cho các màn hình frontend')).toBeInTheDocument();
  });
});

describe('Kiểm thử Luồng Đăng nhập, Đăng ký & Đăng xuất (Mốc 2)', () => {
  beforeEach(() => {
    document.body.className = '';
    localStorage.clear();
  });

  it('Yêu cầu đăng nhập khi chưa có phiên làm việc', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /Đăng nhập/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Mật khẩu')).toBeInTheDocument();
  });

  it('Hiển thị thông báo lỗi khi đăng nhập sai thông tin', async () => {
    render(<App />);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText('Mật khẩu');
    const submitBtn = screen.getByRole('button', { name: /Đăng nhập/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitBtn);

    const errorMessage = await screen.findByText('Email hoặc mật khẩu không chính xác.');
    expect(errorMessage).toBeInTheDocument();
  });

  it('Đăng nhập thành công với thông tin đúng và mở ra Dashboard', async () => {
    render(<App />);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText('Mật khẩu');
    const submitBtn = screen.getByRole('button', { name: /Đăng nhập/i });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    // Chờ màn hình TodoDashboard hiển thị tên đăng nhập của user
    const heading = await screen.findByRole('heading', { name: /Chào buổi sáng, Lê Anh Quang!/i });
    expect(heading).toBeInTheDocument();
  });

  it('Cho phép chuyển đổi giữa màn hình Đăng ký và Đăng nhập', () => {
    render(<App />);
    
    // Nhấp liên kết để sang Đăng ký
    const toRegisterLink = screen.getByRole('button', { name: /Đăng ký ngay/i });
    fireEvent.click(toRegisterLink);
    expect(screen.getByRole('heading', { name: /Đăng ký tài khoản/i })).toBeInTheDocument();

    // Nhấp liên kết để quay về Đăng nhập
    const toLoginLink = screen.getByRole('button', { name: /Đăng nhập ngay/i });
    fireEvent.click(toLoginLink);
    expect(screen.getByRole('heading', { name: /Đăng nhập/i })).toBeInTheDocument();
  });

  it('Cho phép đăng ký tài khoản mới thành công', async () => {
    render(<App />);
    
    // Sang màn hình đăng ký
    fireEvent.click(screen.getByRole('button', { name: /Đăng ký ngay/i }));

    const nameInput = screen.getByLabelText(/Họ và tên/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText('Mật khẩu');
    const confirmPasswordInput = screen.getByLabelText(/Xác nhận mật khẩu/i);
    const submitBtn = screen.getByRole('button', { name: /Đăng ký tài khoản/i });

    fireEvent.change(nameInput, { target: { value: 'Nguyễn Văn A' } });
    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'mypassword' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'mypassword' } });
    fireEvent.click(submitBtn);

    // Đăng ký xong sẽ tự động đăng nhập và đưa vào dashboard
    const heading = await screen.findByRole('heading', { name: /Chào buổi sáng, Nguyễn Văn A!/i });
    expect(heading).toBeInTheDocument();
  });

  it('Cho phép người dùng Đăng xuất (Thoát) khỏi Dashboard', async () => {
    // Khởi tạo ở trạng thái đã đăng nhập
    localStorage.setItem('todo_user', JSON.stringify({ id: 1, email: 'user@example.com', name: 'Lê Anh Quang' }));
    render(<App />);

    const logoutBtn = screen.getByRole('button', { name: /Đăng xuất/i });
    fireEvent.click(logoutBtn);

    // Quay lại màn hình đăng nhập
    const loginHeading = await screen.findByRole('heading', { name: /Đăng nhập/i });
    expect(loginHeading).toBeInTheDocument();
    expect(localStorage.getItem('todo_user')).toBeNull();
  });
});
