// 用内存存储留言（Vercel免费版够用，重启会清空）
// 如果想永久保存，可以换成简单的JSON文件存储

let comments = [
  // 初始化两条示例留言
  {
    id: Date.now() - 100000,
    nick: '🌸 樱花使者',
    content: '愿每个人的每一天都被温柔以待～',
    time: new Date(Date.now() - 86400000).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\//g, '-')
  },
  {
    id: Date.now() - 50000,
    nick: '✨ 星光旅人',
    content: '希望大家都能开开心心的！',
    time: new Date(Date.now() - 43200000).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\//g, '-')
  }
];

// 随机昵称池
const nicknames = [
  '🌸 樱花使者', '✨ 星光旅人', '🍀 幸运草', '🌟 追光者',
  '🌈 彩虹糖', '🦋 蝴蝶结', '🌙 月下客', '⭐ 摘星人',
  '🎋 许愿竹', '🌺 听风者', '☁️ 云朵收藏家', '🌿 薄荷糖',
  '💫 流星划过', '🌼 小雏菊', '🍃 风之语', '🌻 向日葵',
  '🎐 风铃草', '🌊 海浪声声', '⛅ 半糖主义', '🌸 花开半夏'
];

export default async function handler(req, res) {
  // 设置CORS头，允许前端访问
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // GET请求：获取所有留言
  if (req.method === 'GET') {
    // 按时间倒序排列（最新的在前）
    const sortedComments = [...comments].sort((a, b) => b.id - a.id);
    res.status(200).json({ 
      success: true, 
      data: sortedComments,
      total: sortedComments.length
    });
    return;
  }

  // POST请求：添加新留言
  if (req.method === 'POST') {
    const { content } = req.body;
    
    // 验证留言内容
    if (!content || content.trim() === '') {
      res.status(400).json({ success: false, error: '留言内容不能为空' });
      return;
    }

    // 随机生成昵称
    const randomNick = nicknames[Math.floor(Math.random() * nicknames.length)];
    
    // 生成当前时间（格式：MM-DD HH:mm）
    const now = new Date();
    const timeStr = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 创建新留言
    const newComment = {
      id: Date.now(),
      nick: randomNick,
      content: content.trim(),
      time: timeStr
    };

    // 添加到数组最前面
    comments.unshift(newComment);

    // 限制留言总数（可选，防止内存无限增长）
    if (comments.length > 200) {
      comments = comments.slice(0, 200);
    }

    res.status(200).json({ 
      success: true, 
      data: newComment,
      message: '留言成功'
    });
    return;
  }

  // DELETE请求：删除留言（需要验证，简单起见用密码保护）
  if (req.method === 'DELETE') {
    const { id, adminKey } = req.body;
    
    // 简单的管理员验证（密码：bless2024）
    if (adminKey !== 'bless2024') {
      res.status(403).json({ success: false, error: '无权删除' });
      return;
    }

    const beforeLength = comments.length;
    comments = comments.filter(c => c.id !== id);
    
    if (comments.length === beforeLength) {
      res.status(404).json({ success: false, error: '留言不存在' });
      return;
    }

    res.status(200).json({ 
      success: true, 
      message: '删除成功' 
    });
    return;
  }

  // 其他方法不支持
  res.status(405).json({ success: false, error: '方法不支持' });
}