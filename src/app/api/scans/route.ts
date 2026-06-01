import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const scans = await prisma.qrCode.findMany({
    where: { status: 'scanned' },
    orderBy: { scannedAt: 'asc' },
    select: {
      token: true,
      blessing: true,
      latitude: true,
      longitude: true,
      scannedAt: true,
    },
  });

  return NextResponse.json(scans);
}
