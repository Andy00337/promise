import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST：核销（立即返回祝福，定位可选）
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, latitude, longitude } = body;

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]
            || req.headers.get('x-real-ip')
            || 'unknown';

    const result = await prisma.$transaction(async (tx) => {
      const qr = await tx.qrCode.findUnique({ where: { token } });

      if (!qr) throw new Error('INVALID');
      if (qr.status === 'scanned') throw new Error('USED');

      return await tx.qrCode.update({
        where: { token },
        data: {
          status: 'scanned',
          scannedAt: new Date(),
          latitude: latitude ?? null,
          longitude: longitude ?? null,
          ipAddress: ip,
        },
      });
    });

    return NextResponse.json({
      blessing: result.blessing,
      wxLink: result.wxLink,
      scannedAt: result.scannedAt,
    });
  } catch (err: any) {
    const status = err.message === 'USED' ? 409 : 400;
    const code = err.message === 'USED' ? 'ALREADY_USED' : 'INVALID';
    return NextResponse.json({ error: code }, { status });
  }
}

// PATCH：静默补传坐标（已核销的码更新定位）
export async function PATCH(req: Request) {
  try {
    const { token, latitude, longitude } = await req.json();

    if (!token || latitude == null || longitude == null) {
      return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
    }

    const updated = await prisma.qrCode.updateMany({
      where: { token, status: 'scanned' },
      data: { latitude, longitude },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: 'NOT_FOUND_OR_UNUSED' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'FAILED' }, { status: 500 });
  }
}
