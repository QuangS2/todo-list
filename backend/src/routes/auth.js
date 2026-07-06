import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const router = express.Router();

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET || 'super-secret-jwt-key',
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key',
    { expiresIn: '7d' }
  );
};

// 1. ĐĂNG KÝ TÀI KHOẢN MỚI
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin (email, mật khẩu, họ tên).' });
  }

  try {
    // Parameterized Queries chống SQL Injection
    const userExist = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExist.rowCount > 0) {
      return res.status(400).json({ error: 'Email này đã được sử dụng.' });
    }

    // Băm mật khẩu bằng bcryptjs với saltRounds = 10 theo luật dự án
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await db.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, passwordHash, name]
    );

    const user = newUser.rows[0];
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Lưu trữ Refresh Token vào cơ sở dữ liệu để phục vụ thu hồi
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 ngày
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    // Thiết lập cookie an toàn chứa Refresh Token chống XSS và CSRF
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
    });

    return res.status(201).json({
      accessToken,
      user
    });
  } catch (error) {
    console.error('Lỗi khi đăng ký:', error.message);
    return res.status(500).json({ error: 'Lỗi máy chủ nội bộ khi khởi tạo tài khoản.' });
  }
});

// 2. ĐĂNG NHẬP
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ email và mật khẩu.' });
  }

  try {
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rowCount === 0) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
    }

    const user = userRes.rows[0];

    // So sánh mật khẩu băm
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
    }

    const payloadUser = { id: user.id, email: user.email, name: user.name };
    const accessToken = generateAccessToken(payloadUser);
    const refreshToken = generateRefreshToken(payloadUser);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 ngày
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      accessToken,
      user: payloadUser
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error.message);
    return res.status(500).json({ error: 'Lỗi máy chủ nội bộ.' });
  }
});

// 3. REFRESH TOKEN (Cấp lại Access Token mới)
router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Không tìm thấy Refresh Token.' });
  }

  try {
    // 1. Xác thực cấu trúc/chữ ký token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key');

    // 2. Đối chiếu trong database xem có tồn tại và còn hạn hay không (Chống phân phát lại token cũ)
    const tokenRes = await db.query(
      'SELECT r.*, u.email, u.name FROM refresh_tokens r JOIN users u ON r.user_id = u.id WHERE r.token = $1 AND r.expires_at > NOW()',
      [refreshToken]
    );

    if (tokenRes.rowCount === 0) {
      return res.status(403).json({ error: 'Refresh Token đã hết hạn hoặc bị vô hiệu hóa.' });
    }

    const user = {
      id: decoded.id,
      email: tokenRes.rows[0].email,
      name: tokenRes.rows[0].name
    };

    // 3. Tạo Access Token mới
    const accessToken = generateAccessToken(user);

    return res.json({ accessToken });
  } catch (error) {
    console.error('Lỗi refresh token:', error.message);
    return res.status(403).json({ error: 'Refresh Token không hợp lệ.' });
  }
});

// 4. ĐĂNG XUẤT (Vô hiệu hóa phiên làm việc)
router.post('/logout', async (req, res) => {
  const refreshToken = req.cookies.refresh_token;

  try {
    if (refreshToken) {
      // Xóa bản ghi refresh token trong cơ sở dữ liệu để vô hiệu hóa ngay lập tức
      await db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    }
  } catch (error) {
    console.error('Lỗi khi xóa refresh token trong DB khi logout:', error.message);
  } finally {
    // Xóa cookie ở phía client
    res.clearCookie('refresh_token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
    return res.json({ message: 'Đăng xuất thành công.' });
  }
});

export default router;
