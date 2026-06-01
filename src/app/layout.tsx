export const metadata = {
  title: '一起幸福',
  description: '扫码领取专属祝福',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <script src="https://map.qq.com/api/gljs?v=1.exp&key=2ASBZ-H23WI-QIRGS-UYIAQ-GGWOJ-RVF23" defer></script>
      </head>
      <body className="antialiased text-gray-900 bg-white">{children}</body>
    </html>
  );
}
