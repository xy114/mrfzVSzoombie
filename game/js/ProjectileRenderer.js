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

// Wishadel pea — purple-red shell (half-dome head + cylinder body)
export function drawWishadelPea(ctx, x, y, w, h) {
  ctx.save();
  const cx = x + w / 2;
  const cy = y + h / 2;
  const domeR = h / 2;      // half-sphere radius
  const bodyLen = w - domeR; // cylinder length behind dome

  // Glow
  const glowGrad = ctx.createRadialGradient(cx + domeR * 0.3, cy, domeR * 0.2, cx, cy, domeR * 1.8);
  glowGrad.addColorStop(0, 'rgba(200, 40, 80, 0.35)');
  glowGrad.addColorStop(1, 'rgba(200, 40, 80, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, domeR * 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Body cylinder (left of center)
  const bodyGrad = ctx.createLinearGradient(x, 0, x + bodyLen, 0);
  bodyGrad.addColorStop(0, '#6b1030');
  bodyGrad.addColorStop(0.4, '#8b1840');
  bodyGrad.addColorStop(1, '#b82858');
  ctx.fillStyle = bodyGrad;
  ctx.fillRect(x, y + domeR * 0.3, bodyLen, domeR * 1.4);

  // Body highlight
  const hlGrad = ctx.createLinearGradient(0, y, 0, y + h);
  hlGrad.addColorStop(0, 'rgba(255, 180, 200, 0.4)');
  hlGrad.addColorStop(0.5, 'rgba(220, 60, 100, 0.15)');
  hlGrad.addColorStop(1, 'rgba(100, 10, 30, 0.3)');
  ctx.fillStyle = hlGrad;
  ctx.fillRect(x, y + domeR * 0.3, bodyLen, domeR * 1.4);

  // Dome (right half-sphere)
  const domeGrad = ctx.createRadialGradient(cx - domeR * 0.2, cy - domeR * 0.2, domeR * 0.05, cx, cy, domeR);
  domeGrad.addColorStop(0, '#ff6090');
  domeGrad.addColorStop(0.4, '#d03060');
  domeGrad.addColorStop(0.8, '#8b1840');
  domeGrad.addColorStop(1, '#5a0a28');
  ctx.fillStyle = domeGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, domeR, -Math.PI / 2, Math.PI / 2);
  ctx.fill();

  // Dome specular highlight
  ctx.fillStyle = 'rgba(255, 200, 220, 0.5)';
  ctx.beginPath();
  ctx.ellipse(cx - domeR * 0.15, cy - domeR * 0.35, domeR * 0.25, domeR * 0.18, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Outline
  ctx.strokeStyle = '#3a0818';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, domeR, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.strokeRect(x, y + domeR * 0.3, bodyLen, domeR * 1.4);

  ctx.restore();
}

// Fire pea — orange-red flame bullet with flicker
export function drawFirePea(ctx, x, y, r) {
  ctx.save();

  // Outer flame glow
  const glowGrad = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 2);
  glowGrad.addColorStop(0, 'rgba(255, 140, 30, 0.5)');
  glowGrad.addColorStop(0.5, 'rgba(255, 80, 10, 0.2)');
  glowGrad.addColorStop(1, 'rgba(255, 40, 0, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(x, y, r * 2, 0, Math.PI * 2);
  ctx.fill();

  // Flame body gradient
  const bodyGrad = ctx.createRadialGradient(x - r * 0.2, y - r * 0.25, r * 0.05, x, y, r);
  bodyGrad.addColorStop(0, '#ffdd66');
  bodyGrad.addColorStop(0.3, '#ff9933');
  bodyGrad.addColorStop(0.7, '#ee5511');
  bodyGrad.addColorStop(1, '#cc2200');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Flicker highlights
  for (let i = 0; i < 3; i++) {
    const angle = (Date.now() / 80 + i * 2.1) % (Math.PI * 2);
    const dist = r * (0.4 + 0.35 * Math.sin(Date.now() / 150 + i));
    const fx = x + Math.cos(angle) * dist;
    const fy = y + Math.sin(angle) * dist;
    ctx.fillStyle = 'rgba(255, 255, 180, 0.45)';
    ctx.beginPath();
    ctx.arc(fx, fy, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Outline
  ctx.strokeStyle = '#992200';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

// Fire pea explosion effect
export function drawFireExplosion(ctx, cx, cy, r, alpha) {
  ctx.save();

  // Outer shockwave
  const shockGrad = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
  shockGrad.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
  shockGrad.addColorStop(0.2, `rgba(255, 160, 40, ${alpha * 0.9})`);
  shockGrad.addColorStop(0.5, `rgba(255, 60, 10, ${alpha * 0.6})`);
  shockGrad.addColorStop(0.8, `rgba(180, 20, 0, ${alpha * 0.3})`);
  shockGrad.addColorStop(1, 'rgba(80, 0, 0, 0)');
  ctx.fillStyle = shockGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Inner bright core
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.4);
  coreGrad.addColorStop(0, `rgba(255, 255, 240, ${alpha})`);
  coreGrad.addColorStop(0.5, `rgba(255, 200, 60, ${alpha * 0.8})`);
  coreGrad.addColorStop(1, 'rgba(255, 100, 20, 0)');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Floating embers
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const dist = r * (0.4 + Math.random() * 0.5);
    const ex = cx + Math.cos(angle) * dist;
    const ey = cy + Math.sin(angle) * dist;
    ctx.fillStyle = `rgba(255, ${180 + Math.random() * 75}, ${20 + Math.random() * 40}, ${alpha * 0.7})`;
    ctx.beginPath();
    ctx.arc(ex, ey, 2 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }

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
