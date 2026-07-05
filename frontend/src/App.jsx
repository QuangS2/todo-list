import React, { useState, useEffect, useMemo } from 'react';

function App() {
  // Theme state: 'cream' | 'dark' | 'gray'
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('todo-theme') || 'cream';
    }
    return 'cream';
  });

  // Local state for Todos
  const [todos, setTodos] = useState([
    { id: 1, title: 'Đọc tài liệu hướng dẫn và quy chuẩn dự án', completed: true },
    { id: 2, title: 'Thiết kế giao diện tối giản, dịu mắt', completed: true },
    { id: 3, title: 'Viết unit test cho các màn hình frontend', completed: false }
  ]);

  // Input states
  const [newTitle, setNewTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'PENDING' | 'COMPLETED'

  // Inline editing states
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  // Sync theme class to body
  useEffect(() => {
    const body = document.body;
    body.className = `theme-${theme}`;
    localStorage.setItem('todo-theme', theme);
  }, [theme]);

  // Handlers for Todos (Immutable state updates to prevent mutation bugs)
  const handleAddTodo = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTodo = {
      id: Date.now(),
      title: newTitle.trim(),
      completed: false
    };

    setTodos(prev => [...prev, newTodo]);
    setNewTitle('');
  };

  const handleToggleTodo = (id) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleDeleteTodo = (id) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const startEdit = (todo) => {
    setEditingId(todo.id);
    setEditingText(todo.title);
  };

  const saveEdit = (id) => {
    if (!editingText.trim()) return;
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, title: editingText.trim() } : todo
      )
    );
    setEditingId(null);
    setEditingText('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  // Memoized filter and search
  const filteredTodos = useMemo(() => {
    return todos.filter(todo => {
      const matchesSearch = todo.title.toLowerCase().includes(searchQuery.toLowerCase());
      if (filterStatus === 'COMPLETED') {
        return matchesSearch && todo.completed;
      }
      if (filterStatus === 'PENDING') {
        return matchesSearch && !todo.completed;
      }
      return matchesSearch;
    });
  }, [todos, searchQuery, filterStatus]);

  // Calculate pending tasks count
  const pendingCount = useMemo(() => {
    return todos.filter(todo => !todo.completed).length;
  }, [todos]);

  return (
    <div className="app-container">
      {/* Header & Theme switcher */}
      <header className="header-wrapper">
        <div className="welcome-section">
          <h1>Chào buổi sáng!</h1>
          <p>
            {pendingCount > 0
              ? `Hôm nay bạn có ${pendingCount} công việc cần hoàn thành.`
              : 'Tuyệt vời! Bạn đã hoàn thành tất cả công việc hôm nay.'}
          </p>
        </div>

        <div className="theme-picker" aria-label="Bộ chọn giao diện màu">
          <button
            className={`theme-btn ${theme === 'cream' ? 'active' : ''}`}
            onClick={() => setTheme('cream')}
            title="Giao diện Kem Sữa"
            aria-label="Giao diện Kem Sữa"
          >
            {/* Sun icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4"></circle>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
            </svg>
          </button>
          <button
            className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => setTheme('dark')}
            title="Giao diện Tối"
            aria-label="Giao diện Tối"
          >
            {/* Moon icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </button>
          <button
            className={`theme-btn ${theme === 'gray' ? 'active' : ''}`}
            onClick={() => setTheme('gray')}
            title="Giao diện Xám"
            aria-label="Giao diện Xám"
          >
            {/* Cloud/Gray icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42-1.89-1.74-3.5-3.5-3.5a5.5 5.5 0 0 0-5.5 5.5c0 .33.03.66.08.98C4.54 14.5 3 16.03 3 18a3 3 0 0 0 3 3h11.5z"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Form thêm việc */}
      <section aria-label="Thêm việc cần làm">
        <form onSubmit={handleAddTodo} className="todo-form">
          <div className="input-group">
            <input
              type="text"
              className="form-input"
              placeholder="Nhập việc bạn muốn làm hôm nay..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              aria-label="Nội dung công việc mới"
            />
          </div>
          <button type="submit" className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Thêm việc
          </button>
        </form>
      </section>

      {/* Bộ lọc và Tìm kiếm */}
      <section aria-label="Bộ lọc và tìm kiếm" className="control-bar">
        <input
          type="text"
          className="form-input search-input"
          placeholder="Tìm kiếm công việc..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Tìm kiếm công việc"
        />

        <div className="filter-group" role="tablist">
          <button
            className={`filter-btn ${filterStatus === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterStatus('ALL')}
            role="tab"
            aria-selected={filterStatus === 'ALL'}
          >
            Tất cả
          </button>
          <button
            className={`filter-btn ${filterStatus === 'PENDING' ? 'active' : ''}`}
            onClick={() => setFilterStatus('PENDING')}
            role="tab"
            aria-selected={filterStatus === 'PENDING'}
          >
            Chờ làm
          </button>
          <button
            className={`filter-btn ${filterStatus === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setFilterStatus('COMPLETED')}
            role="tab"
            aria-selected={filterStatus === 'COMPLETED'}
          >
            Đã xong
          </button>
        </div>
      </section>

      {/* Danh sách Todos */}
      <section aria-label="Danh sách công việc thực tế">
        <div className="todo-list">
          {filteredTodos.length > 0 ? (
            filteredTodos.map(todo => (
              <div key={todo.id} className="todo-card">
                <div className="todo-left">
                  {/* Checkbox hình tròn lớn */}
                  <label className="custom-checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggleTodo(todo.id)}
                      aria-label={`Đánh dấu ${todo.title}`}
                    />
                    <span className="checkmark"></span>
                  </label>

                  <div className="todo-title-container">
                    {editingId === todo.id ? (
                      <input
                        type="text"
                        className="edit-input-field"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onBlur={() => saveEdit(todo.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(todo.id);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        autoFocus
                        aria-label={`Chỉnh sửa tiêu đề cho ${todo.title}`}
                      />
                    ) : (
                      <>
                        <div className={`todo-title ${todo.completed ? 'completed' : ''}`}>
                          {todo.title}
                        </div>
                        <span className={`badge ${todo.completed ? 'badge-success' : 'badge-pending'}`}>
                          {todo.completed ? 'Đã hoàn thành' : 'Chờ làm'}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Các nút hành động bên phải */}
                <div className="todo-actions">
                  {editingId === todo.id ? (
                    <>
                      <button
                        className="action-btn action-btn-save"
                        onClick={() => saveEdit(todo.id)}
                        title="Lưu"
                        aria-label="Lưu chỉnh sửa"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </button>
                      <button
                        className="action-btn action-btn-cancel"
                        onClick={cancelEdit}
                        title="Hủy"
                        aria-label="Hủy chỉnh sửa"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="action-btn action-btn-edit"
                        onClick={() => startEdit(todo)}
                        title="Chỉnh sửa"
                        aria-label={`Chỉnh sửa ${todo.title}`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9"></path>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                      </button>
                      <button
                        className="action-btn action-btn-delete"
                        onClick={() => handleDeleteTodo(todo.id)}
                        title="Xóa"
                        aria-label={`Xóa ${todo.title}`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>Không tìm thấy công việc nào.</p>
              <span style={{ fontSize: '0.9rem' }}>Hãy nhập việc cần làm và nhấn nút Thêm ở trên nhé!</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default App;
