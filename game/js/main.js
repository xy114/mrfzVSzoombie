document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 900;
  canvas.height = 540;
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(0, 0, 900, 540);
  ctx.font = '24px Arial';
  ctx.fillStyle = '#fff';
  ctx.fillText('游戏加载中...', 400, 270);
  window.game = { canvas, ctx };
});