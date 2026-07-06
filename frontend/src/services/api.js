let accessToken = null;
let onTokenRefreshed = null;

export const getAccessToken = () => accessToken;
export const setAccessToken = (token) => {
  accessToken = token;
};
export const setOnTokenRefreshed = (callback) => {
  onTokenRefreshed = callback;
};

// Hàm gửi request dùng chung với cơ chế tự động Silent Refresh
export const apiRequest = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Đính kèm Access Token trong tiêu đề Authorization nếu tồn tại trong RAM
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const fetchOptions = {
    ...options,
    headers,
    // Bắt buộc đính kèm credentials để gửi/nhận Cookie HTTP-Only refresh_token
    credentials: 'include',
  };

  let response = await fetch(url, fetchOptions);

  // Nếu trả về lỗi 401 Unauthorized (Access Token hết hạn), thực hiện tự động Silent Refresh
  if (response.status === 401 && !url.includes('/api/auth/refresh') && !url.includes('/api/auth/login')) {
    try {
      console.log('[API Client] Access Token hết hạn, đang tự động gia hạn phiên...');
      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        const newToken = data.accessToken;
        
        // Cập nhật Token mới vào bộ nhớ RAM
        setAccessToken(newToken);
        if (onTokenRefreshed) {
          onTokenRefreshed(newToken);
        }

        // Thực hiện lại request ban đầu với Access Token mới
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, { ...fetchOptions, headers });
        console.log('[API Client] Gia hạn phiên thành công và đã thử lại request.');
      } else {
        console.warn('[API Client] Phiên làm việc đã hết hạn. Yêu cầu đăng nhập lại.');
        setAccessToken(null);
        if (onTokenRefreshed) {
          onTokenRefreshed(null);
        }
      }
    } catch (error) {
      console.error('[API Client] Lỗi kết nối khi gia hạn phiên:', error.message);
    }
  }

  return response;
};

// 1. ĐĂNG NHẬP
export const login = async (email, password) => {
  const res = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Đăng nhập thất bại.');
  }
  
  setAccessToken(data.accessToken);
  return data;
};

// 2. ĐĂNG KÝ
export const register = async (email, password, name) => {
  const res = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
  
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Đăng ký thất bại.');
  }
  
  setAccessToken(data.accessToken);
  return data;
};

// 3. ĐĂNG XUẤT
export const logout = async () => {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' });
  } catch (error) {
    console.error('Lỗi khi đăng xuất trên server:', error.message);
  } finally {
    setAccessToken(null);
    if (onTokenRefreshed) {
      onTokenRefreshed(null);
    }
  }
};

// 4. LẤY DANH SÁCH TODOS
export const getTodos = async () => {
  const res = await apiRequest('/api/todos');
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Không thể lấy danh sách công việc.');
  }
  return data;
};

// 5. TẠO TODO MỚI
export const createTodo = async (title) => {
  const res = await apiRequest('/api/todos', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Không thể thêm công việc mới.');
  }
  return data;
};

// 6. CẬP NHẬT TODO
export const updateTodo = async (id, title, completed) => {
  const res = await apiRequest(`/api/todos/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ title, completed }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Không thể cập nhật công việc.');
  }
  return data;
};

// 7. XÓA TODO
export const deleteTodo = async (id) => {
  const res = await apiRequest(`/api/todos/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Không thể xóa công việc.');
  }
  return data;
};

export default {
  getAccessToken,
  setAccessToken,
  setOnTokenRefreshed,
  apiRequest,
  login,
  register,
  logout,
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
};
