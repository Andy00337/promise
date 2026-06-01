import QRCode from 'qrcode';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const OUTPUT_DIR = path.join(process.cwd(), 'output');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000/r';

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const unusedCodes = await prisma.qrCode.findMany({
    where: { status: 'unused' },
    take: 200,
  });

  if (unusedCodes.length === 0) {
    console.log('数据库中没有 unused 状态的二维码，请先运行 npm run db:seed');
    process.exit(1);
  }

  console.log(`开始生成 ${unusedCodes.length} 个二维码图片...`);

  for (let i = 0; i < unusedCodes.length; i++) {
    const qr = unusedCodes[i];
    const url = `${BASE_URL}/${qr.token}`;
    const filename = `${String(i + 1).padStart(3, '0')}_${qr.token.slice(0, 6)}.png`;

    await QRCode.toFile(path.join(OUTPUT_DIR, filename), url, {
      width: 500,
      margin: 2,
      color: { dark: '#FF6B6B', light: '#FFF5F5' },
    });

    if ((i + 1) % 50 === 0) console.log(`已生成 ${i + 1} 个`);
  }

  console.log(`完成！图片保存在 ${OUTPUT_DIR}`);
  console.log('拿去打印店打印，建议 A4 排版 6x4=24 个/页');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
