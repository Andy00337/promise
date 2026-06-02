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

  if (error === 'ALREADY_USED') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-rose-50/30 p-5 select-none">
        <div className="text-center animate-fade-in">
          <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-200/40" />
            <span className="relative text-4xl">🔒</span>
          </div>
          <h1 className="text-lg font-bold text-gray-800">该祝福已被领取</h1>
          <p className="mt-2 text-xs text-gray-400">每个二维码仅限一人使用</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-5 select-none">
        <div className="text-center animate-fade-in">
          <div className="mb-4 text-4xl">⚠️</div>
          <h1 className="text-base font-semibold text-gray-700">无效的二维码</h1>
          <p className="mt-1 text-xs text-gray-400">请检查是否扫描正确</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-rose-50/60 to-white p-5 select-none">
        <div className="relative mb-6 flex h-16 w-16 items-center justify-center">
          <div className="absolute h-full w-full rounded-full border-[3px] border-rose-100" />
          <div className="absolute h-full w-full animate-spin rounded-full border-[3px] border-transparent border-t-rose-400" />
          <span className="relative text-2xl">✨</span>
        </div>
        <p className="text-sm font-medium tracking-wider text-rose-400/80 animate-pulse">
          正在解锁祝福
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-rose-50/40 via-white to-orange-50/20 p-5 pt-12 select-none">
      {/* 顶部品牌 */}
      <div className="mb-8 flex items-center gap-2">
        <span className="h-px w-6 bg-rose-200" />
        <span className="text-[10px] font-medium tracking-[0.3em] text-rose-300">TOGETHER HAPPINESS</span>
        <span className="h-px w-6 bg-rose-200" />
      </div>

      {/* 祝福卡片 */}
      <div className="animate-fade-in w-full max-w-xs">
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg shadow-rose-100/20 ring-1 ring-rose-50">
          <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-rose-50/60 blur-2xl" />
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-orange-50/60 blur-2xl" />

          <div className="relative text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-50 to-orange-50 text-2xl shadow-sm ring-1 ring-rose-100/40">
              🎐
            </div>

            <h1 className="mb-4 text-lg font-bold leading-relaxed text-gray-800">
              {data.blessing}
            </h1>

            <div className="mb-3 flex items-center justify-center gap-2">
              <span className="h-px w-4 bg-gray-200" />
              <span className="text-[11px] text-gray-400">
                {new Date(data.scannedAt).toLocaleString('zh-CN', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  timeZone: 'Asia/Shanghai'
                })}
              </span>
              <span className="h-px w-4 bg-gray-200" />
            </div>

            {/* 定位状态 */}
            <div className="flex justify-center">
              {locStatus === 'pending' && (
                <span className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[11px] text-rose-400 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  正在获取位置
                </span>
              )}
              {locStatus === 'success' && (
                <span className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-[11px] text-green-500">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  位置已记录
                </span>
              )}
              {locStatus === 'denied' && (
                <button onClick={retryLocation} className="flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-[11px] text-orange-500 active:scale-95 transition">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  定位被拒绝，点击重试
                </button>
              )}
              {locStatus === 'failed' && (
                <button onClick={retryLocation} className="flex items-center gap-1 rounded-full bg-gray-50 px-3 py-1 text-[11px] text-gray-400 active:scale-95 transition">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  定位失败，点击重试
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 抽奖区 */}
      <div className="animate-fade-in mt-6 w-full max-w-xs space-y-3" style={{ animationDelay: '0.1s' }}>
        <div className="rounded-2xl bg-white p-5 shadow-md shadow-gray-100/30 ring-1 ring-gray-100/60">
          <p className="mb-4 text-center text-xs text-gray-500">扫码成功！点击下方按钮参与抽奖</p>

 

          <a
            href={data.wxLink}
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#07C160] py-3 text-sm font-medium text-white shadow-sm shadow-green-200/20 active:scale-[0.98] transition hover:bg-[#06AD56]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.5 13.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm7 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              <path fillRule="evenodd" d="M12 2C6.48 2 2 6.03 2 11c0 2.76 1.36 5.23 3.5 6.87V22l4.09-2.24c.78.15 1.58.24 2.41.24 5.52 0 10-4.03 10-9s-4.48-9-10-9zm0 16c-.71 0-1.4-.07-2.07-.2l-.37-.08-2.56 1.4v-2.14l-.55-.38C4.95 15.92 4 13.57 4 11c0-3.87 3.58-7 8-7s8 3.13 8 7-3.58 7-8 7z" clipRule="evenodd" />
            </svg>
            收获你的幸运
          </a>
        </div>

        {/* 定位提醒 */}
<div className="mt-2 text-center text-[15px] text-red-600">
  ⚠️ 请确保已开启手机定位，以便记录扫码位置
</div>
      </div>

      <p className="mt-8 text-[10px] tracking-widest text-gray-300">ONE QR · ONE BLESSING</p>
    </div>
  );
}
