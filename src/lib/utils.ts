export function formatDate(date: Date | string | null) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Shanghai'
  });
}
