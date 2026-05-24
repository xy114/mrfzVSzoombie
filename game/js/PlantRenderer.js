// Sunflower — combat (80x80), PvZ style: bright yellow petals, happy face
export function drawSunflower(ctx, x, y, w, h) {
  const cx = x + w / 2;
  const cy = y + 36;
  const petalCount = 12;

  ctx.save();

  // Stem
  ctx.fillStyle = '#5cb338';
  ctx.fillRect(cx - 5, cy + 18, 10, y + h - cy - 18);
  ctx.fillStyle = '#6cc948';
  ctx.fillRect(cx - 2, cy + 18, 4, y + h - cy - 18);

  // Leaves
  ctx.fillStyle = '#4da830';
  ctx.beginPath();
  ctx.ellipse(cx - 12, cy + 30, 14, 5, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 12, cy + 26, 14, 5, 0.5, 0, Math.PI * 2);
  ctx.fill();
  // Leaf veins
  ctx.strokeStyle = '#3a8820';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 4, cy + 29); ctx.lineTo(cx - 22, cy + 27); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 4, cy + 25); ctx.lineTo(cx + 22, cy + 23); ctx.stroke();

  // Outer petals (larger, lighter)
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2 - Math.PI / 2;
    const px = cx + Math.cos(angle) * 22;
    const py = cy + Math.sin(angle) * 22;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.fillStyle = '#ffe860';
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e8c820';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.restore();
  }

  // Inner petals
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2 - Math.PI / 2 + 0.15;
    const px = cx + Math.cos(angle) * 14;
    const py = cy + Math.sin(angle) * 14;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.fillStyle = '#ffed80';
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Center
  const cg = ctx.createRadialGradient(cx - 1, cy - 1, 2, cx, cy, 12);
  cg.addColorStop(0, '#daa830');
  cg.addColorStop(0.4, '#c09020');
  cg.addColorStop(0.8, '#8a6010');
  cg.addColorStop(1, '#503008');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#604010';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Seed texture dots
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Face — big white eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(cx - 4, cy - 2, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 4, cy - 2, 3.5, 0, Math.PI * 2); ctx.fill();
  // Pupils
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(cx - 3, cy - 1, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 5, cy - 1, 1.8, 0, Math.PI * 2); ctx.fill();
  // Smile
  ctx.strokeStyle = '#402008';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy + 3, 5, 0.15, Math.PI - 0.15);
  ctx.stroke();
  // Cheeks
  ctx.fillStyle = 'rgba(255,120,120,0.3)';
  ctx.beginPath(); ctx.arc(cx - 9, cy + 2, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 9, cy + 2, 3, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

// Sunflower portrait (200x260) — detailed Arknights-style card art
export function drawSunflowerPortrait(ctx, x, y, w, h) {
  const cx = x + w / 2;
  const cy = y + 110;

  ctx.save();

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(cx, y + 245, 45, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pot
  const potGrad = ctx.createLinearGradient(cx, y + 215, cx, y + 252);
  potGrad.addColorStop(0, '#b87840');
  potGrad.addColorStop(0.5, '#a06830');
  potGrad.addColorStop(1, '#704020');
  ctx.fillStyle = potGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 35, y + 215);
  ctx.lineTo(cx - 26, y + 245);
  ctx.lineTo(cx + 26, y + 245);
  ctx.lineTo(cx + 35, y + 215);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8a5020';
  ctx.fillRect(cx - 37, y + 243, 74, 10);
  ctx.strokeStyle = '#5a3010';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 37, y + 243, 74, 10);

  // Stem with gradient
  const stemG = ctx.createLinearGradient(0, cy + 30, 0, y + 215);
  stemG.addColorStop(0, '#6cc948');
  stemG.addColorStop(1, '#4a9828');
  ctx.fillStyle = stemG;
  ctx.fillRect(cx - 8, cy + 30, 16, y + 215 - cy - 30);
  ctx.fillStyle = '#7ce958';
  ctx.fillRect(cx - 3, cy + 30, 5, y + 215 - cy - 30);

  // Leaves
  ctx.fillStyle = '#5cb338';
  ctx.beginPath(); ctx.ellipse(cx - 24, cy + 75, 36, 12, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 24, cy + 65, 36, 12, 0.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3a8820';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 10, cy + 73); ctx.lineTo(cx - 52, cy + 68); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 10, cy + 63); ctx.lineTo(cx + 52, cy + 58); ctx.stroke();
  // Vein branches
  ctx.beginPath(); ctx.moveTo(cx - 20, cy + 71); ctx.lineTo(cx - 34, cy + 66); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 20, cy + 61); ctx.lineTo(cx + 34, cy + 56); ctx.stroke();

  // Back petals
  const petalCount = 14;
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2 - Math.PI / 2;
    const px = cx + Math.cos(angle) * 50;
    const py = cy + Math.sin(angle) * 50;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    const pg = ctx.createLinearGradient(0, -14, 0, 14);
    pg.addColorStop(0, '#ffed60');
    pg.addColorStop(0.5, '#ffe040');
    pg.addColorStop(1, '#e8c020');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,140,20,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  // Middle petals
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2 - Math.PI / 2 + 0.12;
    const px = cx + Math.cos(angle) * 34;
    const py = cy + Math.sin(angle) * 34;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.fillStyle = '#fff8a0';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Center face disc
  const discG = ctx.createRadialGradient(cx - 2, cy - 2, 4, cx, cy, 28);
  discG.addColorStop(0, '#e8c040');
  discG.addColorStop(0.3, '#d0a830');
  discG.addColorStop(0.7, '#a07018');
  discG.addColorStop(1, '#503008');
  ctx.fillStyle = discG;
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#604010';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Seed pattern
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let r = 8; r <= 22; r += 7) {
    const count = Math.floor(r / 3);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Big expressive PvZ eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(cx - 10, cy - 4, 10, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 10, cy - 4, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(cx - 8, cy - 2, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 12, cy - 2, 5, 0, Math.PI * 2); ctx.fill();
  // Eye highlights
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(cx - 10, cy - 6, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 10, cy - 6, 2.5, 0, Math.PI * 2); ctx.fill();

  // Smile
  ctx.strokeStyle = '#402008';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy + 8, 12, 0.1, Math.PI - 0.1);
  ctx.stroke();

  // Cheeks
  ctx.fillStyle = 'rgba(255,130,130,0.25)';
  ctx.beginPath(); ctx.arc(cx - 22, cy + 4, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 22, cy + 4, 9, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

// Peashooter — combat (80x80), PvZ style: bright green pod, big eye, clear barrel
export function drawPeashooter(ctx, x, y, w, h, shooting) {
  const cx = x + w / 2;
  const headCY = y + 28;
  const headRX = 22;
  const headRY = 20;

  ctx.save();

  // Stem
  ctx.fillStyle = '#5cb338';
  ctx.fillRect(cx - 6, headCY + headRY - 4, 12, y + h - headCY - headRY + 4);
  ctx.fillStyle = '#6cc948';
  ctx.fillRect(cx - 3, headCY + headRY - 4, 5, y + h - headCY - headRY + 4);

  // Base leaf
  ctx.fillStyle = '#4da830';
  ctx.beginPath();
  ctx.ellipse(cx + 10, y + 62, 14, 6, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Back leaf
  ctx.fillStyle = '#4da830';
  ctx.beginPath();
  ctx.ellipse(cx - 12, y + 55, 14, 5, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // Head — bright green pea pod
  const headG = ctx.createRadialGradient(cx - 5, headCY - 5, 3, cx, headCY, 25);
  headG.addColorStop(0, '#8ce848');
  headG.addColorStop(0.3, '#6cd030');
  headG.addColorStop(0.7, '#4ab820');
  headG.addColorStop(1, '#2a8010');
  ctx.fillStyle = headG;
  ctx.beginPath();
  ctx.ellipse(cx, headCY, headRX, headRY, 0, 0, Math.PI * 2);
  ctx.fill();

  // Outline
  ctx.strokeStyle = '#1a6010';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Top leaves
  ctx.fillStyle = '#5cb338';
  ctx.beginPath();
  ctx.ellipse(cx - 8, headCY - 18, 14, 5, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 8, headCY - 18, 14, 5, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, headCY - 21, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Barrel / mouth
  const mX = cx + headRX - 3;
  const mY = headCY;
  // Barrel outer
  ctx.fillStyle = '#4ab820';
  ctx.beginPath();
  ctx.ellipse(mX, mY, 8, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1a6010';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (shooting) {
    // Open barrel — large dark opening
    ctx.fillStyle = '#0a1a00';
    ctx.beginPath();
    ctx.ellipse(mX, mY, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Muzzle flash
    ctx.fillStyle = '#ffff99';
    ctx.beginPath();
    ctx.arc(mX + 3, mY, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Slight opening
    ctx.fillStyle = '#0a2000';
    ctx.beginPath();
    ctx.ellipse(mX, mY, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Big eye (PvZ signature)
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx - 4, headCY - 6, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(cx - 3, headCY - 5, 4, 0, Math.PI * 2);
  ctx.fill();
  // Eye highlight
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx - 5, headCY - 8, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Peashooter portrait (200x260) — detailed Arknights-style card art
export function drawPeashooterPortrait(ctx, x, y, w, h) {
  const cx = x + w / 2;
  const headCY = y + 90;
  const headRX = 55;
  const headRY = 48;

  ctx.save();

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(cx, y + 245, 45, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pot
  const potG = ctx.createLinearGradient(cx, y + 215, cx, y + 252);
  potG.addColorStop(0, '#b87840');
  potG.addColorStop(0.5, '#a06830');
  potG.addColorStop(1, '#704020');
  ctx.fillStyle = potG;
  ctx.beginPath();
  ctx.moveTo(cx - 35, y + 215);
  ctx.lineTo(cx - 26, y + 245);
  ctx.lineTo(cx + 26, y + 245);
  ctx.lineTo(cx + 35, y + 215);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8a5020';
  ctx.fillRect(cx - 37, y + 243, 74, 10);
  ctx.strokeStyle = '#5a3010';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 37, y + 243, 74, 10);

  // Stem
  const stemG = ctx.createLinearGradient(0, headCY + headRY, 0, y + 215);
  stemG.addColorStop(0, '#6cc948');
  stemG.addColorStop(1, '#4a9828');
  ctx.fillStyle = stemG;
  ctx.fillRect(cx - 10, headCY + headRY - 4, 20, y + 215 - headCY - headRY + 4);
  ctx.fillStyle = '#7ce958';
  ctx.fillRect(cx - 4, headCY + headRY - 4, 6, y + 215 - headCY - headRY + 4);

  // Large leaves
  ctx.fillStyle = '#5cb338';
  ctx.beginPath(); ctx.ellipse(cx - 30, y + 145, 38, 14, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 30, y + 135, 38, 14, 0.5, 0, Math.PI * 2); ctx.fill();
  // Veins
  ctx.strokeStyle = '#3a8820';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - 12, y + 143); ctx.lineTo(cx - 60, y + 137); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 22, y + 140); ctx.lineTo(cx - 40, y + 132); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 12, y + 133); ctx.lineTo(cx + 60, y + 127); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 22, y + 130); ctx.lineTo(cx + 40, y + 122); ctx.stroke();

  // Head — large pea pod
  const headG = ctx.createRadialGradient(cx - 10, headCY - 10, 8, cx, headCY, 55);
  headG.addColorStop(0, '#98f858');
  headG.addColorStop(0.3, '#78e040');
  headG.addColorStop(0.6, '#50c020');
  headG.addColorStop(1, '#1a7010');
  ctx.fillStyle = headG;
  ctx.beginPath();
  ctx.ellipse(cx, headCY, headRX, headRY, 0, 0, Math.PI * 2);
  ctx.fill();

  // Outline
  ctx.strokeStyle = '#104008';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Pod segment lines
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 1;
  for (let i = -1; i <= 1; i += 2) {
    ctx.beginPath();
    ctx.arc(cx, headCY, headRX - 6, -0.6 * i, -2.5 * i, i > 0);
    ctx.stroke();
  }

  // Top leaves
  ctx.fillStyle = '#5cb338';
  ctx.beginPath(); ctx.ellipse(cx - 16, headCY - 44, 26, 9, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 16, headCY - 44, 26, 9, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx, headCY - 48, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3a8820';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Barrel
  const mX = cx + headRX - 2;
  const mY = headCY;
  ctx.fillStyle = '#50c020';
  ctx.beginPath();
  ctx.ellipse(mX, mY, 18, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#104008';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Barrel opening
  ctx.fillStyle = '#071000';
  ctx.beginPath();
  ctx.ellipse(mX, mY, 13, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Inner highlight
  ctx.fillStyle = 'rgba(255,255,200,0.15)';
  ctx.beginPath();
  ctx.ellipse(mX - 2, mY - 3, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Big expressive eye
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx - 12, headCY - 14, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#104008';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Pupil
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(cx - 10, headCY - 12, 9, 0, Math.PI * 2);
  ctx.fill();
  // Highlights
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(cx - 14, headCY - 18, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx - 6, headCY - 10, 2, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

// Nut (Wall-nut) — combat (80x80)
export function drawNut(ctx, x, y, w, h, skillActive) {
  const cx = x + w / 2, cy = y + h / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(cx, y + h - 4, 30, 6, 0, 0, Math.PI * 2); ctx.fill();
  const bodyG = ctx.createRadialGradient(cx - 8, cy - 10, 5, cx, cy, 36);
  bodyG.addColorStop(0, '#d4a860'); bodyG.addColorStop(0.4, '#c89848'); bodyG.addColorStop(0.7, '#a07030'); bodyG.addColorStop(1, '#6b4020');
  ctx.fillStyle = bodyG; ctx.beginPath(); ctx.ellipse(cx, cy, 35, 38, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#4a2810'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 20, cy - 25); ctx.quadraticCurveTo(cx - 15, cy, cx - 22, cy + 20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 18, cy - 22); ctx.quadraticCurveTo(cx + 12, cy - 5, cx + 16, cy + 18); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.ellipse(cx - 4, cy - 14, 18, 8, 0, 0, Math.PI * 2); ctx.fill();
  if (skillActive) {
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx - 12, cy - 8, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 12, cy - 8, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(cx - 11, cy - 7, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 13, cy - 7, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 20, cy - 14); ctx.lineTo(cx - 8, cy - 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 20, cy - 14); ctx.lineTo(cx + 8, cy - 10); ctx.stroke();
    ctx.strokeStyle = '#3a1808'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy + 6, 8, 0.2, Math.PI - 0.2); ctx.stroke();
  } else {
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx - 10, cy - 6, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 10, cy - 6, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(cx - 9, cy - 5, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 11, cy - 5, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3a1808'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy + 6, 6, 0.2, Math.PI - 0.2); ctx.stroke();
  }
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx - 11, cy - 8, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 9, cy - 8, 2, 0, Math.PI * 2); ctx.fill();
  if (skillActive) {
    ctx.strokeStyle = 'rgba(100,180,255,0.6)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(cx, cy, 38, 41, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(150,210,255,0.3)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(cx, cy, 42, 45, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

// Nut portrait (200x260)
export function drawNutPortrait(ctx, x, y, w, h) {
  const cx = x + w / 2, cy = y + 130;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(cx, y + 245, 36, 8, 0, 0, Math.PI * 2); ctx.fill();
  const bodyG = ctx.createRadialGradient(cx - 12, cy - 16, 8, cx, cy, 70);
  bodyG.addColorStop(0, '#e8c870'); bodyG.addColorStop(0.3, '#d4a858'); bodyG.addColorStop(0.6, '#b08038'); bodyG.addColorStop(1, '#5a3018');
  ctx.fillStyle = bodyG; ctx.beginPath(); ctx.ellipse(cx, cy, 68, 74, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3a1808'; ctx.lineWidth = 4; ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - 30, cy - 60); ctx.quadraticCurveTo(cx - 26, cy, cx - 32, cy + 50); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 28, cy - 55); ctx.quadraticCurveTo(cx + 22, cy - 5, cx + 26, cy + 48); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 10, cy - 68); ctx.quadraticCurveTo(cx - 6, cy - 20, cx - 8, cy + 30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 14, cy - 62); ctx.quadraticCurveTo(cx + 10, cy, cx + 12, cy + 40); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.ellipse(cx - 6, cy - 32, 34, 16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx - 22, cy - 16, 14, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 22, cy - 16, 14, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3a1808'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx - 22, cy - 16, 14, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx + 22, cy - 16, 14, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(cx - 20, cy - 14, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 24, cy - 14, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx - 24, cy - 20, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 20, cy - 20, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3a1808'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, cy + 16, 16, 0.2, Math.PI - 0.2); ctx.stroke();
  ctx.fillStyle = 'rgba(200,140,100,0.2)'; ctx.beginPath(); ctx.arc(cx - 36, cy + 8, 12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 36, cy + 8, 12, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// Cherry Bomb — combat (80x80)
export function drawCherryBomb(ctx, x, y, w, h, armed) {
  const cx = x + w / 2, cy = y + 40;
  ctx.save();
  ctx.fillStyle = '#4a8828'; ctx.fillRect(cx - 3, y + 6, 6, 16);
  ctx.fillStyle = '#6ab840'; ctx.fillRect(cx - 1, y + 6, 3, 14);
  ctx.fillStyle = '#5cb338'; ctx.beginPath(); ctx.ellipse(cx - 6, y + 4, 10, 4, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 6, y + 4, 10, 4, 0.5, 0, Math.PI * 2); ctx.fill();
  if (armed) {
    ctx.fillStyle = 'rgba(255,50,0,0.4)'; ctx.beginPath(); ctx.arc(cx, cy, 32, 0, Math.PI * 2); ctx.fill();
  }
  const lG = ctx.createRadialGradient(cx - 14, cy - 6, 3, cx - 12, cy + 4, 20);
  lG.addColorStop(0, '#ff4455'); lG.addColorStop(0.5, '#dd1a2a'); lG.addColorStop(1, '#8a0010');
  ctx.fillStyle = lG; ctx.beginPath(); ctx.arc(cx - 12, cy + 4, 20, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#600010'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(cx - 18, cy - 4, 5, 3, -0.3, 0, Math.PI * 2); ctx.fill();
  const rG = ctx.createRadialGradient(cx + 12, cy - 6, 3, cx + 14, cy + 4, 20);
  rG.addColorStop(0, '#ff4455'); rG.addColorStop(0.5, '#dd1a2a'); rG.addColorStop(1, '#8a0010');
  ctx.fillStyle = rG; ctx.beginPath(); ctx.arc(cx + 12, cy + 4, 20, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#600010'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(cx + 6, cy - 4, 5, 3, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#4a8828'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(cx - 12, cy - 8); ctx.quadraticCurveTo(cx - 4, cy - 16, cx, cy - 14); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 12, cy - 8); ctx.quadraticCurveTo(cx + 4, cy - 16, cx, cy - 14); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx - 18, cy, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx - 6, cy, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(cx - 17, cy + 1, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx - 5, cy + 1, 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + 6, cy, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 18, cy, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(cx + 7, cy + 1, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 19, cy + 1, 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// Cherry Bomb portrait (200x260)
export function drawCherryBombPortrait(ctx, x, y, w, h) {
  const cx = x + w / 2, cy = y + 120;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(cx, y + 248, 50, 10, 0, 0, Math.PI * 2); ctx.fill();
  const stemG = ctx.createLinearGradient(0, y + 30, 0, y + 80);
  stemG.addColorStop(0, '#5cb338'); stemG.addColorStop(1, '#3a7020');
  ctx.fillStyle = stemG; ctx.fillRect(cx - 6, y + 30, 12, 50);
  ctx.fillStyle = '#7ce958'; ctx.fillRect(cx - 2, y + 30, 4, 46);
  const sparkG = ctx.createRadialGradient(cx, y + 24, 2, cx, y + 24, 12);
  sparkG.addColorStop(0, 'rgba(255,200,50,0.9)'); sparkG.addColorStop(0.4, 'rgba(255,100,20,0.5)'); sparkG.addColorStop(1, 'rgba(255,50,0,0)');
  ctx.fillStyle = sparkG; ctx.beginPath(); ctx.arc(cx, y + 24, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5cb338'; ctx.beginPath(); ctx.ellipse(cx - 18, y + 28, 22, 8, -0.7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 18, y + 28, 22, 8, 0.7, 0, Math.PI * 2); ctx.fill();
  const auraG = ctx.createRadialGradient(cx, cy, 30, cx, cy, 80);
  auraG.addColorStop(0, 'rgba(255,80,40,0.08)'); auraG.addColorStop(1, 'rgba(255,0,0,0)');
  ctx.fillStyle = auraG; ctx.beginPath(); ctx.arc(cx, cy, 80, 0, Math.PI * 2); ctx.fill();
  const lG = ctx.createRadialGradient(cx - 28, cy - 18, 6, cx - 24, cy + 8, 48);
  lG.addColorStop(0, '#ff5566'); lG.addColorStop(0.4, '#ee2030'); lG.addColorStop(0.8, '#aa0018'); lG.addColorStop(1, '#600010');
  ctx.fillStyle = lG; ctx.beginPath(); ctx.arc(cx - 24, cy + 8, 48, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#400008'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.ellipse(cx - 40, cy - 14, 12, 7, -0.3, 0, Math.PI * 2); ctx.fill();
  const rG = ctx.createRadialGradient(cx + 24, cy - 18, 6, cx + 28, cy + 8, 48);
  rG.addColorStop(0, '#ff5566'); rG.addColorStop(0.4, '#ee2030'); rG.addColorStop(0.8, '#aa0018'); rG.addColorStop(1, '#600010');
  ctx.fillStyle = rG; ctx.beginPath(); ctx.arc(cx + 24, cy + 8, 48, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#400008'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.ellipse(cx + 10, cy - 14, 12, 7, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#4a8828'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(cx - 24, cy - 24); ctx.quadraticCurveTo(cx - 8, cy - 36, cx - 2, cy - 50); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 24, cy - 24); ctx.quadraticCurveTo(cx + 8, cy - 36, cx + 2, cy - 50); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx - 42, cy - 6, 10, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx - 16, cy - 6, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(cx - 40, cy - 4, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx - 14, cy - 4, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx - 44, cy - 10, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx - 18, cy - 10, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + 16, cy - 6, 10, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 42, cy - 6, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(cx + 18, cy - 4, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 44, cy - 4, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + 14, cy - 10, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 40, cy - 10, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#400008'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx - 30, cy + 10, 8, 0.2, Math.PI - 0.2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx + 30, cy + 10, 8, 0.2, Math.PI - 0.2); ctx.stroke();
  ctx.restore();
}
