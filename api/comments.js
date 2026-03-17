// api/comments.js
let comments = [
  {
    id: Date.now() - 100000,
    nick: '🌸 樱花使者',
    content: '愿每个人的每一天都被温柔以待～',
    time: new Date(Date.now() - 86400000).toLocaleString('zh-CN', {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
    }).replace(/\//g, '-')
  },
  {
    id: Date.now() - 50000,
    nick: '✨ 星光旅人',
    content: '希望大家都能开开心心的！',
    time: new Date(Date.now() - 43200000).toLocaleString('zh-CN', {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
    }).replace(/\//g, '-')
  }
];

const nicknames = [
  '🌸 樱花使者', '✨ 星光旅人', '🍀 幸运草', '🌟 追光者',
  '🌈 彩虹糖', '🦋 蝴蝶结', '🌙 月下客', '⭐ 摘星人',
  '🎋 许愿竹', '🌺 听风者', '☁️ 云朵收藏家', '🌿 薄荷糖',
  '💫 流星划过', '🌼 小雏菊', '🍃 风之语', '🌻 向日葵',
  '🎐 风铃草', '🌊 海浪声声', '⛅ 半糖主义', '🌸 花开半夏'
];

export default async function handler(req, res) {
  // ✅ 完整的 CORS 头设置
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400'); // 缓存预检请求24小时

  // ✅ 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // GET 请求：获取所有留言
  if (req.method === 'GET') {
    const sortedComments = [...comments].sort((a, b) => b.id - a.id);
    return res.status(200).json({ 
      success: true, 
      data: sortedComments,
      total: sortedComments.length
    });
  }

  // POST 请求：添加新留言
  if (req.method === 'POST') {
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, error: '留言内容不能为空' });
    }

    const randomNick = nicknames[Math.floor(Math.random() * nicknames.length)];
    
    const now = new Date();
    const timeStr = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newComment = {
      id: Date.now(),
      nick: randomNick,
      content: content.trim(),
      time: timeStr
    };

    comments.unshift(newComment);
    if (comments.length > 200) comments = comments.slice(0, 200);

    return res.status(200).json({ 
      success: true, 
      data: newComment,
      message: '留言成功'
    });
  }

  // 其他方法不支持
  return res.status(405).json({ success: false, error: '方法不支持' });
}
