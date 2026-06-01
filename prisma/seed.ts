import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

const BLESSINGS = [
  "愿你今天比昨天更勇敢一点",
  "听说看到这句话的人，今天会收到好消息",
  "累了就歇会儿，你已经很棒了",
  "今天的风很温柔，就像你的努力一样",
  "幸福不是目的地，是你此刻的呼吸",
  "你扫到了隐藏款祝福，幸运+1",
  "记得给爸妈打个电话，他们也在想你",
  "这堂课的签到，你一定不会错过",
  "食堂阿姨今天手不抖，专为你留的",
  "你的努力，宇宙都看在眼里",
  "偶尔摆烂，经常偶尔，但此刻要认真幸福",
  "图书馆靠窗的位置，永远有一束光为你亮着",
  "你今天穿的这件衣服，真的很好看",
  "实验数据会好看的，论文会过的，你会幸福的",
  "北洋园的海棠开了，记得去看看"
];

const WX_LINK = process.env.WX_MINI_LINK || '#小程序://抽奖/dJxkcfzhNpVdESo';
const COUNT = 200;

async function main() {
  console.log(`开始创建 ${COUNT} 个二维码记录...`);

  const data = Array.from({ length: COUNT }).map((_, i) => ({
    token: nanoid(16),
    blessing: BLESSINGS[i % BLESSINGS.length],
    wxLink: WX_LINK,
  }));

  await prisma.qrCode.createMany({ data, skipDuplicates: true });

  console.log(`已创建 ${COUNT} 条记录`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
