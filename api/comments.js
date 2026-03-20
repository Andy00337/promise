import { Pool } from 'pg';

// 从环境变量读取数据库连接
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 初始化数据库表（如果不存在）
async function initTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id BIGINT PRIMARY KEY,
        nick VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        time VARCHAR(50) NOT NULL
      )
    `);
  } finally {
    client.release();
  }
}
// 启动时初始化表
initTable();

// 随机昵称池
const nicknames = [
  '🌸 樱花使者', '✨ 星光旅人', '🍀 幸运草', '🌟 追光者',
  '🌈 彩虹糖', '🦋 蝴蝶结', '🌙 月下客', '⭐ 摘星人',
  '🎋 许愿竹', '🌺 听风者', '☁️ 云朵收藏家', '🌿 薄荷糖',
  '💫 流星划过', '🌼 小雏菊', '🍃 风之语', '🌻 向日葵'
];

export default async function handler(req, res) {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET：获取所有留言
  if (req.method === 'GET') {
    try {
      const client = await pool.connect();
      const result = await client.query(
        'SELECT * FROM comments ORDER BY id DESC'
      );
      client.release();
      
      return res.status(200).json({ 
        success: true, 
        data: result.rows,
        total: result.rows.length
      });
    } catch (error) {
      console.error('数据库查询错误:', error);
      return res.status(500).json({ success: false, error: '数据库错误' });
    }
  }

  // POST：添加新留言
  if (req.method === 'POST') {
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, error: '留言内容不能为空' });
    }

    try {
      // 随机生成昵称
      const randomNick = nicknames[Math.floor(Math.random() * nicknames.length)];
      
      // 生成时间
      const now = new Date();
      const timeStr = `${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      
      const id = Date.now();
      
      const client = await pool.connect();
      await client.query(
        'INSERT INTO comments (id, nick, content, time) VALUES ($1, $2, $3, $4)',
        [id, randomNick, content.trim(), timeStr]
      );
      client.release();
      
      return res.status(200).json({ 
        success: true, 
        data: { id, nick: randomNick, content: content.trim(), time: timeStr }
      });
    } catch (error) {
      console.error('数据库插入错误:', error);
      return res.status(500).json({ success: false, error: '保存失败' });
    }
  }

  // 其他方法不支持
  return res.status(405).json({ success: false, error: '方法不支持' });
}
