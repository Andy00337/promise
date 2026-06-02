import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-rose-50 to-white p-6 text-center">
      <div className="mb-4 text-5xl">✨</div>
      <h1 className="mb-2 text-3xl font-bold text-rose-500">一起幸福</h1>
      <p className="mb-8 max-w-xs text-sm leading-relaxed text-gray-500">
        校园里的每一张二维码，都藏着一句专属祝福
      </p>
      <Link href="/admin" className="rounded-xl bg-gray-900 px-6 py-3 text-sm text-white hover:bg-gray-700 transition">
        后台数据 & 轨迹导出
      </Link>
    </main>
  );
}
