'use client';

import { useEffect, useRef, useState } from 'react';
import { formatDate } from '@/lib/utils';

declare const TMap: any;

type Scan = {
  token: string;
  blessing: string;
  latitude: number | null;
  longitude: number | null;
  scannedAt: string;
};

export default function AdminPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);

  useEffect(() => {
    fetch('/api/scans')
      .then((r) => r.json())
      .then((data) => {
        setScans(data.filter((s: Scan) => s.latitude && s.longitude));
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!mapRef.current || scans.length === 0) return;
    const center = new TMap.LatLng(scans[0].latitude, scans[0].longitude);
    mapInstance.current = new TMap.Map(mapRef.current, { center, zoom: 16 });
    return () => { mapInstance.current?.destroy(); };
  }, [scans]);

  const playAnimation = () => {
    if (isPlaying || scans.length === 0) return;
    setIsPlaying(true);
    setCurrentIndex(0);
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    polylineRef.current?.setMap(null);

    let i = 0;
    const path: any[] = [];
    const interval = setInterval(() => {
      if (i >= scans.length) { clearInterval(interval); setIsPlaying(false); return; }
      const s = scans[i];
      const latlng = new TMap.LatLng(s.latitude, s.longitude);
      path.push(latlng);
      const marker = new TMap.MultiMarker({
        map: mapInstance.current,
        styles: { default: new TMap.MarkerStyle({ width: 20, height: 20, color: '#FF6B6B' }) },
        geometries: [{ id: String(i), position: latlng, properties: { time: formatDate(s.scannedAt) } }],
      });
      markersRef.current.push(marker);
      if (path.length > 1) {
        polylineRef.current?.setMap(null);
        polylineRef.current = new TMap.MultiPolyline({
          map: mapInstance.current,
          styles: { line: new TMap.PolylineStyle({ color: '#FF6B6B', width: 4 }) },
          geometries: [{ id: 'line', paths: path }],
        });
      }
      mapInstance.current.setCenter(latlng);
      setCurrentIndex(i);
      i++;
    }, 800);
  };

  const exportVideo = () => {
    const canvas = mapRef.current?.querySelector('canvas');
    if (!canvas) return alert('地图未加载完成');
    const stream = (canvas as HTMLCanvasElement).captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `幸福轨迹_${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    };
    recorder.start();
    alert('开始录制，请确保动画正在播放。10秒后自动停止。');
    setTimeout(() => recorder.stop(), 10000);
  };

  if (loading) return <div className="p-10 text-sm text-gray-500">加载数据中...</div>;

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold mb-2">扫码轨迹后台</h1>
      <p className="text-xs text-gray-500 mb-4">共 {scans.length} 条有效定位记录</p>
      <div className="flex gap-3 mb-4">
        <button onClick={playAnimation} disabled={isPlaying} className="rounded-lg bg-rose-500 px-4 py-2 text-sm text-white disabled:opacity-50">
          {isPlaying ? `播放中 (${currentIndex + 1}/${scans.length})` : '播放轨迹动画'}
        </button>
        <button onClick={exportVideo} className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-white">导出视频 (WebM)</button>
      </div>
      <div ref={mapRef} style={{ width: '100%', height: '500px', borderRadius: '12px', overflow: 'hidden' }} className="border border-gray-200 shadow-sm" />
      <div className="mt-6 overflow-auto max-h-64 rounded-lg border border-gray-200">
        <table className="w-full text-xs text-left">
          <thead className="bg-gray-50 sticky top-0">
            <tr><th className="px-4 py-2">时间</th><th className="px-4 py-2">祝福</th><th className="px-4 py-2">坐标</th></tr>
          </thead>
          <tbody>
            {scans.map((s) => (
              <tr key={s.token} className="border-t">
                <td className="px-4 py-2">{formatDate(s.scannedAt)}</td>
                <td className="px-4 py-2 max-w-xs truncate">{s.blessing}</td>
                <td className="px-4 py-2 text-gray-500">{s.latitude?.toFixed(4)}, {s.longitude?.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
