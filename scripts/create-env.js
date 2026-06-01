const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');

const content = `DATABASE_URL=postgresql://neondb_owner:npg_KdQnA6NGO0sm@ep-still-sun-aqcxa0z8-pooler.c-8.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
BASE_URL=https://qr-happiness.vercel.app/r
WX_MINI_LINK=#小程序://抽奖/dJxkcfzhNpVdESo
TMAP_KEY=你的腾讯地图Key
`;

fs.writeFileSync(envPath, content, { encoding: 'utf8' });
console.log('.env 文件已生成，路径：' + envPath);
console.log('如果数据库URL或域名不同，请手动修改 .env 文件');
