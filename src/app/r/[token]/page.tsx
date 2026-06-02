'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';

// 后端更新坐标（静默补传，失败不影响主流程）
async function updateLocation(token: string, lat: number, lng: number) {
  try {
    await fetch('/api/scan', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, latitude: lat, longitude: lng }),
    });
  } catch {
    // 静默失败，不影响用户
  }
}

export default function ScanPage() {
  const { token } = useParams() as { token: string };
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [locating, setLocating] = useState(true);

  // 主流程：立即核销，不阻塞定位
  useEffect(() => {
    const block = (e: Event) => { e.preventDefault(); };
    document.addEventListener('contextmenu', block);
    document.addEventListener('selectstart', block);

    // 1. 立即核销（不带定位，保证速度）
    fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setData(json);
      })
      .catch((e) => setError(e.message));

    // 2. 后台静默获取定位（成功后补传坐标）
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocating(false);
          updateLocation(token, pos.coords.latitude, pos.coords.longitude);
        },
        () => setLocating(false),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 120000 }
      );
    } else {
      setLocating(false);
    }

    return () => {
      document.removeEventListener('contextmenu', block);
      document.removeEventListener('selectstart', block);
    };
  }, [token]);

  const handleCopy = useCallback(() => {
    if (!data?.wxLink) return;
    navigator.clipboard.writeText(data.wxLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [data]);

  // ===== 错误状态：已被使用 =====
  if (error === 'ALREADY_USED') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 via-white to-orange-50 p-6 select-none">
        <div className="text-center animate-fade-in">
          <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-200 opacity-30" />
            <span className="relative text-5xl">🔒</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800">该祝福已被领取</h1>
          <p className="mt-2 text-sm text-gray-500">每个二维码仅限一人使用</p>
        </div>
      </div>
    );
  }

  // ===== 错误状态：无效 =====
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 select-none">
        <div className="text-center animate-fade-in">
          <div className="mb-4 text-5xl">⚠️</div>
          <h1 className="text-lg font-semibold text-gray-700">无效的二维码</h1>
          <p className="mt-1 text-sm text-gray-400">请检查是否扫描正确</p>
        </div>
      </div>
    );
  }

  // ===== 加载状态（现在最多 1~2 秒） =====
  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-white to-orange-50 p-6 select-none">
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
          <div className="absolute h-full w-full rounded-full border-4 border-rose-100" />
          <div className="absolute h-full w-full animate-spin rounded-full border-4 border-transparent border-t-rose-400" />
          <span className="relative text-2xl">✨</span>
        </div>
        <p className="text-sm font-medium tracking-widest text-rose-400 animate-pulse">
          正在解锁祝福
        </p>
        <p className="mt-1 text-xs text-gray-300">请稍候...</p>
      </div>
    );
  }

  // ===== 主页面：祝福 + 抽奖 =====
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-white to-orange-50 p-5 select-none">
      {/* 顶部装饰 */}
      <div className="mb-6 flex items-center gap-2 text-rose-300">
        <span className="inline-block h-px w-8 bg-rose-200" />
        <span className="text-xs tracking-[0.3em] uppercase">一起幸福</span>
        <span className="inline-block h-px w-8 bg-rose-200" />
      </div>

      {/* 祝福卡片 */}
      <div className="animate-fade-in w-full max-w-sm rounded-3xl bg-white/80 p-8 shadow-xl shadow-rose-100/50 ring-1 ring-rose-100 backdrop-blur-sm">
        <div className="mb-6 text-center text-5xl">🎐</div>

        <h1 className="mb-6 text-center text-xl font-bold leading-relaxed text-gray-800">
          {data.blessing}
        </h1>

        <div className="mb-6 flex items-center justify-center gap-2 text-xs text-gray-400">
          <span className="inline-block h-px w-4 bg-gray-200" />
          <span>{new Date(data.scannedAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          <span className="inline-block h-px w-4 bg-gray-200" />
        </div>
      </div>

      {/* 抽奖操作区 */}
      <div className="animate-fade-in mt-6 w-full max-w-sm space-y-3" style={{ animationDelay: '0.15s' }}>
        <div className="rounded-2xl bg-white p-5 shadow-lg shadow-gray-100/60 ring-1 ring-gray-100">
          <p className="mb-4 text-center text-sm font-medium text-gray-600">
            扫码成功！复制链接参与抽奖
          </p>

          <button
            onClick={handleCopy}
            className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-rose-400 to-orange-400 py-3.5 font-medium text-white shadow-md shadow-rose-200 transition-all active:scale-[0.98] hover:shadow-lg hover:shadow-rose-200"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {copied ? (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  已复制，去微信粘贴
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  复制抽奖链接
                </>
              )}
            </span>
          </button>

          <a
            href={data.wxLink}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-3.5 font-medium text-white shadow-md shadow-green-200 transition-all active:scale-[0.98] hover:bg-green-600"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.5 13.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm7 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              <path fillRule="evenodd" d="M12 2C6.48 2 2 6.03 2 11c0 2.76 1.36 5.23 3.5 6.87V22l4.09-2.24c.78.15 1.58.24 2.41.24 5.52 0 10-4.03 10-9s-4.48-9-10-9zm0 16c-.71 0-1.4-.07-2.07-.2l-.37-.08-2.56 1.4v-2.14l-.55-.38C4.95 15.92 4 13.57 4 11c0-3.87 3.58-7 8-7s8 3.13 8 7-3.58 7-8 7z" clipRule="evenodd" />
            </svg>
            在微信内打开
          </a>
        </div>

        {/* 提示 */}
        <div className="rounded-xl bg-white/60 p-3 text-center text-xs leading-relaxed text-gray-400 ring-1 ring-white/50 backdrop-blur-sm">
          若直接打开无反应，请点击上方按钮复制链接，
          <br />
          粘贴到微信聊天窗口后点击进入
        </div>
      </div>

      {/* 底部 */}
      <p className="mt-8 text-[10px] tracking-wider text-gray-300">
        ONE QR · ONE BLESSING
      </p>
    </div>
  );
}
