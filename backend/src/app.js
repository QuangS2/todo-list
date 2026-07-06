import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.js';
import todosRouter from './routes/todos.js';

const app = express();

// 1. Chống DoS bằng giới hạn payload body
app.use(express.json({ limit: '1mb' }));

// 2. Middleware đọc cookie
app.use(cookieParser());

const allowedOrigins = [
  'http://localhost:5173', // Cổng mặc định của Vite Frontend
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS Policy: Origin không được phép truy cập.'));
    }
  },
  credentials: true
}));

// 4. API Routes
app.use('/api/auth', authRouter);
app.use('/api/todos', todosRouter);

// 5. Global Error Handling
app.use((err, req, res, next) => {
  console.error('[Global Error Handler] Chi tiết lỗi:', err.stack || err.message);
  
  if (err.message && err.message.includes('CORS Policy')) {
    return res.status(403).json({ error: err.message });
  }
  
  res.status(500).json({ error: 'Đã xảy ra lỗi hệ thống nghiêm trọng phía Server.' });
});

export default app;
