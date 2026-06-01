export function formatDate(date: Date | string | null) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

export function getRandomColor(index: number) {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
  return colors[index % colors.length];
}
