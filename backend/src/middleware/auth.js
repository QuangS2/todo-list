import jwt from 'jsonwebtoken';

// Middleware bảo mật xác thực Access Token
export const auth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  // Kiểm tra sự hiện diện của Authorization Header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Truy cập bị từ chối. Token xác thực không tồn tại.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Xác thực tính hợp lệ của Access Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-jwt-key');
    
    // Gắn thông tin người dùng giải mã được vào request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access Token đã hết hạn. Vui lòng refresh token.' });
    }
    return res.status(401).json({ error: 'Access Token không hợp lệ.' });
  }
};

export default auth;
