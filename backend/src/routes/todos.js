import express from 'express';
import db from '../db.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Bọc middleware auth để bảo vệ tất cả các endpoints bên dưới
router.use(auth);

// LẤY DANH SÁCH TODOS CỦA USER ĐANG ĐĂNG NHẬP
router.get('/', async (req, res) => {
  try {
    const todosRes = await db.query(
      'SELECT id, title, completed, created_at FROM todos WHERE user_id = $1 ORDER BY created_at ASC',
      [req.user.id]
    );
    return res.json(todosRes.rows);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách todos:', error.message);
    return res.status(500).json({ error: 'Lỗi máy chủ nội bộ khi tải danh sách công việc.' });
  }
});

// THÊM TODO MỚI
router.post('/', async (req, res) => {
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Tiêu đề công việc không được để trống.' });
  }

  try {
    const newTodo = await db.query(
      'INSERT INTO todos (user_id, title) VALUES ($1, $2) RETURNING id, title, completed, created_at',
      [req.user.id, title.trim()]
    );
    return res.status(201).json(newTodo.rows[0]);
  } catch (error) {
    console.error('Lỗi khi tạo todo:', error.message);
    return res.status(500).json({ error: 'Lỗi máy chủ nội bộ khi tạo công việc mới.' });
  }
});

// CẬP NHẬT TODO
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;

  try {
    // Kiểm tra sự tồn tại và quyền sở hữu để tránh lỗi lỗ hổng ID Harvesting (IDOR)
    const checkRes = await db.query('SELECT id FROM todos WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (checkRes.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy công việc này hoặc bạn không có quyền cập nhật.' });
    }

    // Tiến hành cập nhật động dựa vào các trường được gửi lên
    const currentRes = await db.query('SELECT title, completed FROM todos WHERE id = $1', [id]);
    const currentTodo = currentRes.rows[0];

    const finalTitle = title !== undefined ? title.trim() : currentTodo.title;
    const finalCompleted = completed !== undefined ? completed : currentTodo.completed;

    if (title !== undefined && !finalTitle) {
      return res.status(400).json({ error: 'Tiêu đề công việc không được để trống.' });
    }

    const updateRes = await db.query(
      'UPDATE todos SET title = $1, completed = $2 WHERE id = $3 AND user_id = $4 RETURNING id, title, completed, created_at',
      [finalTitle, finalCompleted, id, req.user.id]
    );

    return res.json(updateRes.rows[0]);
  } catch (error) {
    console.error('Lỗi khi cập nhật todo:', error.message);
    return res.status(500).json({ error: 'Lỗi máy chủ nội bộ khi cập nhật công việc.' });
  }
});

// XÓA TODO
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Kiểm tra quyền sở hữu
    const checkRes = await db.query('SELECT id FROM todos WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (checkRes.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy công việc này hoặc bạn không có quyền xóa.' });
    }

    await db.query('DELETE FROM todos WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    return res.json({ message: 'Xóa công việc thành công.', id: parseInt(id, 10) });
  } catch (error) {
    console.error('Lỗi khi xóa todo:', error.message);
    return res.status(500).json({ error: 'Lỗi máy chủ nội bộ khi xóa công việc.' });
  }
});

export default router;
