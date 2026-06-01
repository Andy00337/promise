import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="mb-4 text-4xl font-bold text-rose-500">一起幸福</h1>
      <p className="mb-8 max-w-md text-gray-600">
        校园里的每一张二维码，都藏着一句专属祝福。<br />
        扫码即阅，一人一次。
      </p>
      <div className="flex gap-4">
        <Link href="/admin" className="rounded-xl bg-gray-900 px-6 py-3 text-white hover:bg-gray-700 transition">
          后台数据 & 轨迹导出
        </Link>
      </div>
    </main>
  );
}
