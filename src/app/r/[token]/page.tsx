'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function ScanPage() {
  const { token } = useParams() as { token: string };
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const block = (e: Event) => { e.preventDefault(); };
    document.addEventListener('contextmenu', block);
    document.addEventListener('selectstart', block);

    navigator.geolocation.getCurrentPosition(
      (pos) => verify(pos.coords.latitude, pos.coords.longitude),
      () => verify(),
      { enableHighAccuracy: true, timeout: 10000 }
    );

    return () => {
      document.removeEventListener('contextmenu', block);
      document.removeEventListener('selectstart', block);
    };
  }, [token]);

  const verify = async (lat?: number, lng?: number) => {
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, latitude: lat, longitude: lng }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (error === 'ALREADY_USED') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 select-none">
        <div className="text-center animate-fade-in">
          <div className="mb-4 text-6xl">🚫</div>
          <h1 className="text-xl font-bold text-gray-700">该二维码已被使用</h1>
          <p className="mt-2 text-sm text-gray-400">每个祝福只能被领取一次</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        无效的二维码
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">
        核验中...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-rose-50 to-white p-6 text-center select-none animate-fade-in">
      <div className="mb-6 text-6xl">✨</div>

      <h1 className="mb-8 max-w-md text-2xl font-bold leading-relaxed text-gray-800">
        {data.blessing}
      </h1>

      <div className="w-full max-w-xs rounded-2xl bg-white p-6 shadow-lg border border-rose-100">
        <p className="mb-4 text-sm text-gray-600">扫码成功！复制下方链接参与抽奖</p>

        <button
          onClick={() => {
            navigator.clipboard.writeText(data.wxLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="w-full rounded-xl bg-rose-500 py-3 font-medium text-white shadow-md active:scale-95 transition"
        >
          {copied ? '✅ 已复制，去微信粘贴' : '复制抽奖链接'}
        </button>

        <a
          href={data.wxLink}
          className="mt-3 block w-full rounded-xl bg-green-500 py-3 font-medium text-white shadow-md active:scale-95 transition"
        >
          尝试直接打开
        </a>
      </div>

      <p className="mt-8 text-xs text-gray-300">
        一起幸福 · {new Date(data.scannedAt).toLocaleString('zh-CN')}
      </p>
    </div>
  );
}
