// Pea bullet — small green circle with highlight
export function drawPea(ctx, x, y, r) {
  ctx.save();

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.arc(x + 1, y + 1, r, 0, Math.PI * 2);
  ctx.fill();

  // Pea body gradient
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  grad.addColorStop(0, '#88dd44');
  grad.addColorStop(0.5, '#55aa22');
  grad.addColorStop(1, '#337711');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.25, y - r * 0.3, r * 0.35, r * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();

  // Outline
  ctx.strokeStyle = '#226600';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

// Fire pea bullet — fiery orange-red with flame effect
export function drawFirePea(ctx, x, y, r) {
  ctx.save();

  // Outer flame glow
  ctx.fillStyle = 'rgba(255,100,0,0.2)';
  ctx.beginPath();
  ctx.arc(x, y, r * 1.6, 0, Math.PI * 2);
  ctx.fill();

  // Flame tendrils
  const flameCount = 6;
  for (let i = 0; i < flameCount; i++) {
    const angle = (i / flameCount) * Math.PI * 2 + (performance.now() * 0.003) % (Math.PI * 2);
    const sx = x + Math.cos(angle) * r;
    const sy = y + Math.sin(angle) * r;
    const ex = x + Math.cos(angle) * r * 1.7;
    const ey = y + Math.sin(angle) * r * 1.7;

    ctx.fillStyle = 'rgba(255,150,20,0.4)';
    ctx.beginPath();
    ctx.moveTo(sx - 3, sy);
    ctx.quadraticCurveTo(
      x + Math.cos(angle + 0.3) * r * 1.4, y + Math.sin(angle + 0.3) * r * 1.4,
      ex, ey
    );
    ctx.quadraticCurveTo(
      x + Math.cos(angle - 0.3) * r * 1.4, y + Math.sin(angle - 0.3) * r * 1.4,
      sx + 3, sy
    );
    ctx.fill();
  }

  // Inner fire glow
  const fireGrad = ctx.createRadialGradient(x - r * 0.1, y - r * 0.2, r * 0.1, x, y, r);
  fireGrad.addColorStop(0, '#ffee44');
  fireGrad.addColorStop(0.3, '#ffaa22');
  fireGrad.addColorStop(0.7, '#ff5500');
  fireGrad.addColorStop(1, '#cc2200');
  ctx.fillStyle = fireGrad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Core highlight
  ctx.fillStyle = 'rgba(255,255,200,0.5)';
  ctx.beginPath();
  ctx.arc(x - r * 0.2, y - r * 0.25, r * 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Sun — golden radiating star
export function drawSun(ctx, x, y, r) {
  ctx.save();

  // Outer glow
  const glowGrad = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 1.8);
  glowGrad.addColorStop(0, 'rgba(255,215,0,0.3)');
  glowGrad.addColorStop(1, 'rgba(255,215,0,0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Rays
  const rayCount = 10;
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2 - Math.PI / 2;
    const innerR = r * 0.85;
    const outerR = r * 1.5;

    ctx.fillStyle = '#ffdd44';
    ctx.beginPath();
    ctx.moveTo(
      x + Math.cos(angle - 0.08) * innerR,
      y + Math.sin(angle - 0.08) * innerR
    );
    ctx.lineTo(
      x + Math.cos(angle) * outerR,
      y + Math.sin(angle) * outerR
    );
    ctx.lineTo(
      x + Math.cos(angle + 0.08) * innerR,
      y + Math.sin(angle + 0.08) * innerR
    );
    ctx.closePath();
    ctx.fill();
  }

  // Main sun body
  const sunGrad = ctx.createRadialGradient(x - r * 0.15, y - r * 0.2, r * 0.05, x, y, r);
  sunGrad.addColorStop(0, '#ffffee');
  sunGrad.addColorStop(0.4, '#ffee44');
  sunGrad.addColorStop(0.8, '#ffcc00');
  sunGrad.addColorStop(1, '#dd9900');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Subtle face outline
  ctx.strokeStyle = 'rgba(180,130,0,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.25, y - r * 0.3, r * 0.3, r * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
