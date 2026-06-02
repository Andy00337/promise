'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';

export default function ScanPage() {
  const { token } = useParams() as { token: string };
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [locStatus, setLocStatus] = useState<'pending' | 'success' | 'denied' | 'failed'>('pending');

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

    // 2. 获取定位
    if (!navigator.geolocation) {
      setLocStatus('failed');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocStatus('success');
        fetch('/api/scan', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, latitude, longitude }),
        });
      },
      (err) => {
        if (err.code === 1) setLocStatus('denied');
        else setLocStatus('failed');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

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

  const retryLocation = () => {
    setLocStatus('pending');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocStatus('success');
        fetch('/api/scan', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, latitude, longitude }),
        });
      },
      (err) => {
        if (err.code === 1) setLocStatus('denied');
        else setLocStatus('failed');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ===== 错误状态：已被使用 =====
  if (error === 'ALREADY_USED') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-rose-50/30 to-orange-50/30 p-6 select-none">
        <div className="text-center animate-fade-in">
          <div className="relative mx-auto mb-8 flex h-28 w-28 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-200/40" />
            <span className="relative text-6xl drop-shadow-sm">🔒</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">该祝福已被领取</h1>
          <p className="mt-3 text-sm text-gray-400">每个二维码仅限一人使用，期待下一次相遇</p>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/80 px-5 py-2 text-xs text-gray-400 shadow-sm ring-1 ring-gray-100 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            一起幸福 · 一人一码
          </div>
        </div>
      </div>
    );
  }

  // ===== 错误状态：无效 =====
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 p-6 select-none">
        <div className="text-center animate-fade-in">
          <div className="mb-6 text-5xl">⚠️</div>
          <h1 className="text-lg font-semibold text-gray-700">无效的二维码</h1>
          <p className="mt-2 text-sm text-gray-400">请检查是否扫描正确，或联系活动主办方</p>
        </div>
      </div>
    );
  }

  // ===== 加载状态 =====
  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-rose-50/60 via-white to-orange-50/40 p-6 select-none">
        <div className="relative mb-8 flex h-24 w-24 items-center justify-center">
          <div className="absolute h-full w-full rounded-full border-[3px] border-rose-100" />
          <div className="absolute h-full w-full animate-spin rounded-full border-[3px] border-transparent border-t-rose-400" />
          <span className="relative text-3xl">✨</span>
        </div>
        <p className="text-sm font-medium tracking-[0.2em] text-rose-400/80 animate-pulse">
          正在解锁祝福
        </p>
        <p className="mt-2 text-xs text-gray-300">请稍候...</p>
      </div>
    );
  }

  // ===== 主页面 =====
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-rose-50/50 via-white to-orange-50/30 p-5 select-none">
      {/* 顶部装饰线 */}
      <div className="mb-8 flex items-center gap-3">
        <span className="inline-block h-px w-10 bg-gradient-to-r from-transparent to-rose-200" />
        <span className="text-[10px] font-medium tracking-[0.35em] text-rose-300 uppercase">Together Happiness</span>
        <span className="inline-block h-px w-10 bg-gradient-to-l from-transparent to-rose-200" />
      </div>

      {/* 祝福卡片 */}
      <div className="animate-fade-in w-full max-w-sm">
        <div className="relative overflow-hidden rounded-[2rem] bg-white/90 p-8 shadow-[0_8px_40px_-12px_rgba(244,63,94,0.15)] ring-1 ring-rose-100/60 backdrop-blur-xl">
          {/* 卡片顶部装饰 */}
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-rose-50/50 blur-2xl" />
          <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-orange-50/50 blur-2xl" />

          <div className="relative">
            {/* 图标 */}
            <div className="mb-6 text-center">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 text-3xl shadow-sm ring-1 ring-rose-100/50">
                🎐
              </span>
            </div>

            {/* 祝福文字 */}
            <h1 className="mb-6 text-center text-[1.35rem] font-bold leading-relaxed tracking-tight text-gray-800">
              {data.blessing}
            </h1>

            {/* 时间戳 */}
            <div className="mb-5 flex items-center justify-center gap-2">
              <span className="inline-block h-px w-5 bg-gradient-to-r from-transparent to-gray-200" />
              <span className="text-[11px] font-medium text-gray-400">
                {new Date(data.scannedAt).toLocaleString('zh-CN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className="inline-block h-px w-5 bg-gradient-to-l from-transparent to-gray-200" />
            </div>

            {/* 定位状态 */}
            <div className="flex items-center justify-center">
              {locStatus === 'pending' && (
                <span className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-[11px] font-medium text-rose-400 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  正在获取位置...
                </span>
              )}
              {locStatus === 'success' && (
                <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-[11px] font-medium text-green-500">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  位置已记录
                </span>
              )}
              {locStatus === 'denied' && (
                <button
                  onClick={retryLocation}
                  className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-medium text-orange-500 transition-colors hover:bg-orange-100 active:scale-95"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  定位被拒绝，点击重试
                </button>
              )}
              {locStatus === 'failed' && (
                <button
                  onClick={retryLocation}
                  className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-[11px] font-medium text-gray-400 transition-colors hover:bg-gray-100 active:scale-95"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  定位失败，点击重试
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 抽奖操作区 */}
      <div className="animate-fade-in mt-7 w-full max-w-sm space-y-3" style={{ animationDelay: '0.15s' }}>
        <div className="rounded-[1.5rem] bg-white/80 p-5 shadow-lg shadow-gray-100/40 ring-1 ring-gray-100/60 backdrop-blur-xl">
          <p className="mb-4 text-center text-[13px] font-medium text-gray-500">
            扫码成功！复制链接参与抽奖
          </p>

          {/* 复制按钮 */}
          <button
            onClick={handleCopy}
            className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-rose-400 to-orange-400 py-3.5 text-[15px] font-medium text-white shadow-md shadow-rose-200/40 transition-all active:scale-[0.98] hover:shadow-lg hover:shadow-rose-200/50"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {copied ? (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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

          {/* 微信打开按钮 */}
          <a
            href={data.wxLink}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#07C160] py-3.5 text-[15px] font-medium text-white shadow-md shadow-green-200/30 transition-all active:scale-[0.98] hover:bg-[#06AD56]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.5 13.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm7 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              <path fillRule="evenodd" d="M12 2C6.48 2 2 6.03 2 11c0 2.76 1.36 5.23 3.5 6.87V22l4.09-2.24c.78.15 1.58.24 2.41.24 5.52 0 10-4.03 10-9s-4.48-9-10-9zm0 16c-.71 0-1.4-.07-2.07-.2l-.37-.08-2.56 1.4v-2.14l-.55-.38C4.95 15.92 4 13.57 4 11c0-3.87 3.58-7 8-7s8 3.13 8 7-3.58 7-8 7z" clipRule="evenodd" />
            </svg>
            在微信内打开
          </a>
        </div>

        {/* 提示卡片 */}
        <div className="rounded-xl bg-white/50 p-3.5 text-center text-[11px] leading-relaxed text-gray-400 ring-1 ring-white/60 backdrop-blur-sm">
          若直接打开无反应，请点击上方按钮复制链接，
          <br />
          粘贴到微信聊天窗口后点击进入
        </div>
      </div>

      {/* 底部 */}
      <p className="mt-10 text-[10px] font-medium tracking-[0.25em] text-gray-300">
        ONE QR · ONE BLESSING
      </p>
    </div>
  );
}
