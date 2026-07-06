import { query, closePool } from './db.js';

async function testConnection() {
  console.log('=== BẮT ĐẦU KIỂM TRA KẾT NỐI DATABASE BACKEND ===');
  console.log('Đang kết nối đến PostgreSQL container...');
  try {
    // Kiểm tra thời gian từ PostgreSQL
    const timeRes = await query('SELECT NOW()');
    console.log('✓ Kết nối thành công!');
    console.log(`- Thời gian hiện tại của Database: ${timeRes.rows[0].now}`);

    // Liệt kê danh sách các bảng trong schema public
    const tablesRes = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('- Các bảng được khởi tạo trong database todolist:');
    if (tablesRes.rows.length === 0) {
      console.log('  ⚠️ Không tìm thấy bảng nào. Hãy kiểm tra lại khởi tạo container.');
    } else {
      tablesRes.rows.forEach(row => {
        console.log(`  + [Bảng] ${row.table_name}`);
      });
    }

  } catch (err) {
    console.error('❌ Lỗi kết nối đến PostgreSQL database:', err.message);
    console.error('Hãy đảm bảo Docker container đang chạy và các cấu hình trong tệp .env là chính xác.');
  } finally {
    // Đóng kết nối Pool
    await closePool();
    console.log('Đã đóng kết nối Pool.');
    console.log('=================================================');
  }
}

testConnection();
