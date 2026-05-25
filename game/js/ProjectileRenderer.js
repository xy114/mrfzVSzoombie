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
