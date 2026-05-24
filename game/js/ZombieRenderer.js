// Normal Zombie — combat (60x80), PvZ style
export function drawNormalZombie(ctx, x, y, w, h, attacking) {
  const cx = x + w / 2;
  const headR = 12;
  const headY = y + 10;
  const bodyTop = headY + headR;
  const bodyBottom = y + 64;

  ctx.save();

  // Legs — dark brown pants
  ctx.fillStyle = '#3d2b1a';
  ctx.fillRect(cx - 14, y + 58, 10, 18);
  ctx.fillRect(cx + 4, y + 58, 10, 18);

  // Shoes — black
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.roundRect(cx - 16, y + 72, 14, 8, 3);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(cx + 2, y + 72, 14, 8, 3);
  ctx.fill();

  // Arms
  ctx.fillStyle = '#98b888';
  if (attacking) {
    // Arms reaching forward (left)
    ctx.save();
    ctx.translate(cx - 6, bodyTop + 4);
    ctx.rotate(-0.6);
    ctx.fillRect(-16, -3, 22, 7);
    ctx.restore();
    ctx.save();
    ctx.translate(cx + 6, bodyTop + 4);
    ctx.rotate(-0.4);
    ctx.fillRect(-16, -3, 22, 7);
    ctx.restore();
    // Hands
    ctx.fillStyle = '#88a878';
    ctx.beginPath(); ctx.arc(cx - 28, bodyTop + 16, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - 10, bodyTop + 20, 4, 0, Math.PI * 2); ctx.fill();
  } else {
    // Arms hanging down at sides
    ctx.fillRect(cx - 18, bodyTop, 8, 42);
    ctx.fillRect(cx + 10, bodyTop, 8, 42);
    // Hands
    ctx.fillStyle = '#88a878';
    ctx.beginPath(); ctx.arc(cx - 14, bodyTop + 44, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 14, bodyTop + 44, 4, 0, Math.PI * 2); ctx.fill();
  }

  // Body — tattered brown jacket
  ctx.fillStyle = '#6b4423';
  ctx.beginPath();
  ctx.moveTo(cx - 17, bodyTop);
  ctx.lineTo(cx + 17, bodyTop);
  ctx.lineTo(cx + 18, bodyBottom);
  ctx.lineTo(cx + 8, bodyBottom - 8);
  ctx.lineTo(cx, bodyBottom + 2);
  ctx.lineTo(cx - 8, bodyBottom - 8);
  ctx.lineTo(cx - 18, bodyBottom);
  ctx.closePath();
  ctx.fill();

  // Jacket darker shading
  ctx.fillStyle = '#5a3520';
  ctx.fillRect(cx - 6, bodyTop + 6, 12, 26);

  // White shirt collar
  ctx.fillStyle = '#ede8d8';
  ctx.beginPath();
  ctx.moveTo(cx - 10, bodyTop - 1);
  ctx.lineTo(cx, bodyTop + 7);
  ctx.lineTo(cx + 10, bodyTop - 1);
  ctx.closePath();
  ctx.fill();

  // Red tie
  ctx.fillStyle = '#b82020';
  ctx.beginPath();
  ctx.moveTo(cx, bodyTop + 2);
  ctx.lineTo(cx - 4, bodyTop + 14);
  ctx.lineTo(cx, bodyTop + 20);
  ctx.lineTo(cx + 4, bodyTop + 14);
  ctx.closePath();
  ctx.fill();

  // Head — light gray-green skin (PvZ zombie color)
  const headG = ctx.createRadialGradient(cx - 2, headY - 2, 2, cx, headY, headR);
  headG.addColorStop(0, '#b5c8a8');
  headG.addColorStop(0.6, '#a0b898');
  headG.addColorStop(1, '#889880');
  ctx.fillStyle = headG;
  ctx.beginPath();
  ctx.arc(cx, headY, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#708068';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Hair — messy dark brown
  ctx.fillStyle = '#2a1a10';
  ctx.beginPath();
  ctx.arc(cx - 6, headY - 8, 8, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 6, headY - 7, 7, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, headY - 10, 7, Math.PI, 0);
  ctx.fill();

  // Eye sockets — dark hollow
  ctx.fillStyle = '#1a1815';
  ctx.beginPath();
  ctx.ellipse(cx - 7, headY - 1, 4, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 7, headY - 1, 4, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tiny red pupils (PvZ signature)
  ctx.fillStyle = '#441111';
  ctx.beginPath();
  ctx.arc(cx - 6, headY, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 8, headY, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Mouth — open groan
  ctx.fillStyle = '#1a0a0a';
  ctx.beginPath();
  ctx.ellipse(cx, headY + 6, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // Teeth
  ctx.fillStyle = '#e8e0d0';
  ctx.fillRect(cx - 3, headY + 5, 2, 2);
  ctx.fillRect(cx + 1, headY + 5, 2, 2);

  // Nose
  ctx.fillStyle = '#889878';
  ctx.beginPath();
  ctx.arc(cx, headY + 3, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Normal Zombie — portrait (200x260), detailed PvZ style
export function drawNormalZombiePortrait(ctx, x, y, w, h) {
  const cx = x + w / 2;
  const headR = 38;
  const headY = y + 48;

  ctx.save();

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, y + 248, 40, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs with gradient
  const legG = ctx.createLinearGradient(0, y + 180, 0, y + 248);
  legG.addColorStop(0, '#4d3820');
  legG.addColorStop(1, '#302010');
  ctx.fillStyle = legG;
  ctx.fillRect(cx - 28, y + 178, 18, 56);
  ctx.fillRect(cx + 10, y + 178, 18, 56);

  // Knee wrinkles
  ctx.strokeStyle = '#2a1a0a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 26, y + 200); ctx.lineTo(cx - 12, y + 200);
  ctx.moveTo(cx + 12, y + 200); ctx.lineTo(cx + 26, y + 200);
  ctx.moveTo(cx - 26, y + 215); ctx.lineTo(cx - 12, y + 215);
  ctx.moveTo(cx + 12, y + 215); ctx.lineTo(cx + 26, y + 215);
  ctx.stroke();

  // Shoes
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.roundRect(cx - 32, y + 230, 26, 18, 5);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(cx + 6, y + 230, 26, 18, 5);
  ctx.fill();
  // Shoe highlights
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.roundRect(cx - 30, y + 232, 22, 6, 3);
  ctx.fill();

  // Arms
  const armG = ctx.createLinearGradient(0, y + 100, 0, y + 195);
  armG.addColorStop(0, '#b5c8a8');
  armG.addColorStop(1, '#98b088');
  ctx.fillStyle = armG;
  // Left arm hanging
  ctx.save();
  ctx.translate(cx - 30, y + 105);
  ctx.rotate(0.12);
  ctx.fillRect(-6, 0, 14, 82);
  ctx.restore();
  // Right arm hanging
  ctx.save();
  ctx.translate(cx + 30, y + 105);
  ctx.rotate(-0.12);
  ctx.fillRect(-8, 0, 14, 82);
  ctx.restore();
  // Hands
  ctx.fillStyle = '#98b088';
  ctx.beginPath(); ctx.arc(cx - 36, y + 195, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 36, y + 195, 9, 0, Math.PI * 2); ctx.fill();
  // Fingers
  ctx.strokeStyle = '#7a9070';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - 40, y + 192); ctx.lineTo(cx - 44, y + 200); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 36, y + 190); ctx.lineTo(cx - 38, y + 200); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 36, y + 190); ctx.lineTo(cx + 38, y + 200); ctx.stroke();

  // Body — tattered brown jacket
  const jGrad = ctx.createLinearGradient(cx, y + 88, cx, y + 185);
  jGrad.addColorStop(0, '#8b5a30');
  jGrad.addColorStop(0.4, '#6b4423');
  jGrad.addColorStop(1, '#4a2a14');
  ctx.fillStyle = jGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 46, y + 88);
  ctx.lineTo(cx + 46, y + 88);
  ctx.lineTo(cx + 52, y + 185);
  ctx.lineTo(cx + 22, y + 172);
  ctx.lineTo(cx + 4, y + 188);
  ctx.lineTo(cx - 4, y + 175);
  ctx.lineTo(cx - 22, y + 188);
  ctx.lineTo(cx - 52, y + 172);
  ctx.closePath();
  ctx.fill();

  // Jacket lapels
  ctx.fillStyle = '#7a4a20';
  ctx.beginPath();
  ctx.moveTo(cx - 18, y + 88);
  ctx.lineTo(cx, y + 125);
  ctx.lineTo(cx + 18, y + 88);
  ctx.closePath();
  ctx.fill();

  // White shirt
  ctx.fillStyle = '#ede8d8';
  ctx.beginPath();
  ctx.moveTo(cx - 22, y + 88);
  ctx.lineTo(cx - 8, y + 105);
  ctx.lineTo(cx + 8, y + 105);
  ctx.lineTo(cx + 22, y + 88);
  ctx.closePath();
  ctx.fill();

  // Red tie
  const tieG = ctx.createLinearGradient(cx, y + 92, cx, y + 155);
  tieG.addColorStop(0, '#d83030');
  tieG.addColorStop(1, '#901818');
  ctx.fillStyle = tieG;
  ctx.beginPath();
  ctx.moveTo(cx, y + 94);
  ctx.lineTo(cx - 8, y + 142);
  ctx.lineTo(cx, y + 160);
  ctx.lineTo(cx + 8, y + 142);
  ctx.closePath();
  ctx.fill();

  // Tear details on jacket
  ctx.strokeStyle = '#3a1a08';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 34, y + 125);
  ctx.lineTo(cx - 26, y + 140);
  ctx.lineTo(cx - 36, y + 150);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 30, y + 155);
  ctx.lineTo(cx + 38, y + 170);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 40, y + 160);
  ctx.lineTo(cx - 32, y + 168);
  ctx.stroke();

  // Head — light gray-green skin gradient
  const hG = ctx.createRadialGradient(cx - 5, headY - 5, 5, cx, headY, headR);
  hG.addColorStop(0, '#c5d8b8');
  hG.addColorStop(0.5, '#b0c4a0');
  hG.addColorStop(0.85, '#98a888');
  hG.addColorStop(1, '#7a9070');
  ctx.fillStyle = hG;
  ctx.beginPath();
  ctx.arc(cx, headY, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#6a8060';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Hair — messy dark brown
  ctx.fillStyle = '#2a1810';
  // Left patch
  ctx.beginPath();
  ctx.arc(cx - 18, headY - 18, 18, Math.PI + 0.2, 2 * Math.PI - 0.3);
  ctx.fill();
  // Right patch
  ctx.beginPath();
  ctx.arc(cx + 16, headY - 16, 16, Math.PI + 0.1, 2 * Math.PI - 0.2);
  ctx.fill();
  // Top
  ctx.beginPath();
  ctx.arc(cx, headY - 24, 14, Math.PI + 0.2, 2 * Math.PI - 0.2);
  ctx.fill();
  // Stray hairs
  ctx.strokeStyle = '#2a1810';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - 30, headY - 20); ctx.lineTo(cx - 34, headY - 28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 28, headY - 18); ctx.lineTo(cx + 32, headY - 26); ctx.stroke();

  // Eye sockets — deep hollow black
  ctx.fillStyle = '#151210';
  ctx.beginPath();
  ctx.ellipse(cx - 18, headY - 4, 12, 14, -0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 18, headY - 4, 12, 14, 0.05, 0, Math.PI * 2);
  ctx.fill();

  // Red pupils
  ctx.fillStyle = '#551515';
  ctx.beginPath();
  ctx.arc(cx - 16, headY - 2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 20, headY - 2, 4, 0, Math.PI * 2);
  ctx.fill();
  // Pupil highlights
  ctx.fillStyle = '#882222';
  ctx.beginPath();
  ctx.arc(cx - 15, headY - 3, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 21, headY - 3, 2, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#90a080';
  ctx.beginPath();
  ctx.arc(cx, headY + 4, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#708060';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Mouth — open, groaning
  ctx.fillStyle = '#150808';
  ctx.beginPath();
  ctx.ellipse(cx, headY + 18, 12, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Teeth — uneven, some missing
  ctx.fillStyle = '#e0d8c8';
  ctx.beginPath();
  ctx.moveTo(cx - 8, headY + 14); ctx.lineTo(cx - 11, headY + 21); ctx.lineTo(cx - 5, headY + 22); ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 8, headY + 14); ctx.lineTo(cx + 5, headY + 22); ctx.lineTo(cx + 11, headY + 21); ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - 2, headY + 14); ctx.lineTo(cx - 2, headY + 18); ctx.lineTo(cx + 2, headY + 18); ctx.lineTo(cx + 2, headY + 14);
  ctx.closePath();
  ctx.fill();

  // Wrinkles around mouth
  ctx.strokeStyle = '#7a9070';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx - 14, headY + 10, 8, 0.3, 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 14, headY + 10, 8, 1.6, 2.8);
  ctx.stroke();

  // Forehead wrinkles
  ctx.beginPath();
  ctx.moveTo(cx - 14, headY - 12); ctx.lineTo(cx - 4, headY - 10);
  ctx.moveTo(cx + 4, headY - 10); ctx.lineTo(cx + 14, headY - 12);
  ctx.stroke();

  // Cheekbone shadows
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath(); ctx.arc(cx - 26, headY + 6, 12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 26, headY + 6, 12, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

// Cone Zombie — combat (60x80)
export function drawConeZombie(ctx, x, y, w, h, attacking) {
  drawNormalZombie(ctx, x, y, w, h, attacking);

  const cx = x + w / 2;

  ctx.save();

  // Traffic cone
  const cTop = y - 6;
  const cBot = y + 16;
  const cTopW = 5;
  const cBotW = 26;

  // Cone gradient — bright PvZ orange
  const cG = ctx.createLinearGradient(cx, cTop, cx, cBot);
  cG.addColorStop(0, '#ff9930');
  cG.addColorStop(0.3, '#ff8820');
  cG.addColorStop(0.7, '#ee6610');
  cG.addColorStop(1, '#cc4400');
  ctx.fillStyle = cG;
  ctx.beginPath();
  ctx.moveTo(cx - cTopW / 2, cTop);
  ctx.lineTo(cx + cTopW / 2, cTop);
  ctx.lineTo(cx + cBotW / 2, cBot);
  ctx.lineTo(cx - cBotW / 2, cBot);
  ctx.closePath();
  ctx.fill();

  // White reflective stripes
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - 9, cBot - 14, 18, 3);
  ctx.fillRect(cx - 12, cBot - 6, 24, 3);

  // Cone highlight (left side)
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.moveTo(cx - cTopW / 2, cTop);
  ctx.lineTo(cx - 4, cTop);
  ctx.lineTo(cx - 6, cBot);
  ctx.lineTo(cx - cBotW / 2, cBot);
  ctx.closePath();
  ctx.fill();

  // Outline
  ctx.strokeStyle = '#883300';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - cTopW / 2, cTop);
  ctx.lineTo(cx + cTopW / 2, cTop);
  ctx.lineTo(cx + cBotW / 2, cBot);
  ctx.lineTo(cx - cBotW / 2, cBot);
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
}

// Cone Zombie — portrait (200x260)
export function drawConeZombiePortrait(ctx, x, y, w, h) {
  drawNormalZombiePortrait(ctx, x, y + 16, w, h - 16);

  const cx = x + w / 2;
  const cTop = y + 8;
  const cBot = y + 64;
  const cTopW = 18;
  const cBotW = 80;

  ctx.save();

  // Cone shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.moveTo(cx - cBotW / 2, cBot + 4);
  ctx.lineTo(cx + cBotW / 2, cBot + 4);
  ctx.lineTo(cx + cTopW / 2, cTop + 4);
  ctx.lineTo(cx - cTopW / 2, cTop + 4);
  ctx.closePath();
  ctx.fill();

  // Cone body gradient
  const cG = ctx.createLinearGradient(cx, cTop, cx, cBot);
  cG.addColorStop(0, '#ffaa40');
  cG.addColorStop(0.25, '#ff8820');
  cG.addColorStop(0.6, '#ee6010');
  cG.addColorStop(1, '#aa3800');
  ctx.fillStyle = cG;
  ctx.beginPath();
  ctx.moveTo(cx - cTopW / 2, cTop);
  ctx.lineTo(cx + cTopW / 2, cTop);
  ctx.lineTo(cx + cBotW / 2, cBot);
  ctx.lineTo(cx - cBotW / 2, cBot);
  ctx.closePath();
  ctx.fill();

  // Highlight strip (left side)
  const hl = ctx.createLinearGradient(cx - 25, 0, cx + 15, 0);
  hl.addColorStop(0, 'rgba(255,255,255,0.2)');
  hl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hl;
  ctx.beginPath();
  ctx.moveTo(cx - cTopW / 2, cTop);
  ctx.lineTo(cx + cTopW / 2, cTop);
  ctx.lineTo(cx + cBotW / 2, cBot);
  ctx.lineTo(cx - cBotW / 2, cBot);
  ctx.closePath();
  ctx.fill();

  // Reflective white stripes
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.15)';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetY = 1;
  ctx.fillRect(cx - 28, cBot - 24, 56, 4);
  ctx.fillRect(cx - 34, cBot - 12, 68, 4);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Stripe edge shading
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(cx - 28, cBot - 22, 56, 2);
  ctx.fillRect(cx - 34, cBot - 10, 68, 2);

  // Outline
  ctx.strokeStyle = '#661800';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - cTopW / 2, cTop);
  ctx.lineTo(cx + cTopW / 2, cTop);
  ctx.lineTo(cx + cBotW / 2, cBot);
  ctx.lineTo(cx - cBotW / 2, cBot);
  ctx.closePath();
  ctx.stroke();

  // Scratches / wear
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx - 20, cBot - 32); ctx.lineTo(cx - 12, cBot - 22);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 16, cBot - 36); ctx.lineTo(cx + 26, cBot - 28);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 30, cBot - 16); ctx.lineTo(cx + 36, cBot - 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 32, cBot - 8); ctx.lineTo(cx - 26, cBot - 2);
  ctx.stroke();

  // Rim highlight at the bottom of cone
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - cBotW / 2 + 4, cBot);
  ctx.lineTo(cx + cBotW / 2 - 4, cBot);
  ctx.stroke();

  ctx.restore();
}

// Shield Zombie — combat (60x80)
export function drawShieldZombie(ctx, x, y, w, h, attacking) {
  drawNormalZombie(ctx, x, y, w, h, attacking);
  const cx = x + w / 2;
  const bodyTop = y + 22;

  ctx.save();

  // Riot shield on left side (facing incoming fire from plants)
  const sX = cx - 24;
  const sY = bodyTop - 2;
  const sW = 28;
  const sH = 42;

  // Shield body
  const sG = ctx.createLinearGradient(sX, 0, sX + sW, 0);
  sG.addColorStop(0, '#556677');
  sG.addColorStop(0.3, '#778899');
  sG.addColorStop(0.5, '#8899aa');
  sG.addColorStop(0.7, '#667788');
  sG.addColorStop(1, '#445566');
  ctx.fillStyle = sG;
  ctx.beginPath();
  ctx.roundRect(sX, sY, sW, sH, 4);
  ctx.fill();

  // Shield edge
  ctx.strokeStyle = '#2a3a4a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(sX, sY, sW, sH, 4);
  ctx.stroke();

  // Shield center boss
  ctx.fillStyle = '#8899aa';
  ctx.beginPath();
  ctx.arc(sX + sW / 2, sY + sH / 2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2a3a4a';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Shield highlight
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.roundRect(sX + 3, sY + 2, sW - 6, sH / 2 - 4, 2);
  ctx.fill();

  // Vertical bar on shield
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(sX + sW / 2 - 2, sY + 6, 4, sH - 12);

  ctx.restore();
}

// Shield Zombie — portrait (200x260)
export function drawShieldZombiePortrait(ctx, x, y, w, h) {
  drawNormalZombiePortrait(ctx, x, y + 6, w, h - 6);

  const cx = x + w / 2;
  const sX = cx - 16;
  const sY = y + 100;
  const sW = 76;
  const sH = 110;

  ctx.save();

  // Shield shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.roundRect(sX + 2, sY + 2, sW, sH, 6);
  ctx.fill();

  // Shield body gradient
  const sG = ctx.createLinearGradient(sX, 0, sX + sW, 0);
  sG.addColorStop(0, '#4a5a6a');
  sG.addColorStop(0.25, '#6a7a8a');
  sG.addColorStop(0.5, '#8a9aaa');
  sG.addColorStop(0.75, '#6a7a8a');
  sG.addColorStop(1, '#3a4a5a');
  ctx.fillStyle = sG;
  ctx.beginPath();
  ctx.roundRect(sX, sY, sW, sH, 6);
  ctx.fill();

  // Shield edge
  ctx.strokeStyle = '#1a2a3a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(sX, sY, sW, sH, 6);
  ctx.stroke();

  // Inner border
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(sX + 6, sY + 6, sW - 12, sH - 12, 3);
  ctx.stroke();

  // Center emblem
  ctx.fillStyle = '#7a8a9a';
  ctx.beginPath();
  ctx.arc(cx, sY + sH / 2, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2a3a4a';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Emblem star
  ctx.fillStyle = '#8a9aaa';
  ctx.beginPath();
  ctx.moveTo(cx, sY + sH / 2 - 8);
  for (let i = 1; i <= 5; i++) {
    const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? 8 : 4;
    ctx.lineTo(cx + Math.cos(a) * r, sY + sH / 2 + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();

  // Highlight streak
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(sX + 10, sY + 10, 8, sH - 20);

  // Dents / scratches
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(sX + 20, sY + 30); ctx.lineTo(sX + 30, sY + 40); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(sX + 50, sY + 70); ctx.lineTo(sX + 60, sY + 80); ctx.stroke();

  ctx.restore();
}

// Imp Zombie — combat (45x60), smaller and faster
export function drawImpZombie(ctx, x, y, w, h, attacking) {
  const cx = x + w / 2;
  const headR = 9;
  const headY = y + 8;
  const bodyTop = headY + headR;
  const bodyBottom = y + 50;

  ctx.save();

  // Legs
  ctx.fillStyle = '#3d2b1a';
  ctx.fillRect(cx - 10, y + 44, 7, 14);
  ctx.fillRect(cx + 3, y + 44, 7, 14);

  // Shoes
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.roundRect(cx - 12, y + 54, 10, 6, 2); ctx.fill();
  ctx.beginPath(); ctx.roundRect(cx + 2, y + 54, 10, 6, 2); ctx.fill();

  // Arms
  ctx.fillStyle = '#98b888';
  if (attacking) {
    ctx.fillRect(cx - 14, bodyTop, 20, 5);
    ctx.fillRect(cx - 2, bodyTop, 20, 5);
  } else {
    ctx.fillRect(cx - 14, bodyTop, 5, 28);
    ctx.fillRect(cx + 9, bodyTop, 5, 28);
  }

  // Body
  ctx.fillStyle = '#6b4423';
  ctx.beginPath();
  ctx.moveTo(cx - 13, bodyTop); ctx.lineTo(cx + 13, bodyTop);
  ctx.lineTo(cx + 14, bodyBottom); ctx.lineTo(cx + 5, bodyBottom - 6);
  ctx.lineTo(cx, bodyBottom + 2); ctx.lineTo(cx - 5, bodyBottom - 6);
  ctx.lineTo(cx - 14, bodyBottom); ctx.closePath();
  ctx.fill();

  // Head — smaller
  const hG = ctx.createRadialGradient(cx - 1, headY - 1, 1, cx, headY, headR);
  hG.addColorStop(0, '#b5c8a8'); hG.addColorStop(0.6, '#a0b898'); hG.addColorStop(1, '#889880');
  ctx.fillStyle = hG; ctx.beginPath(); ctx.arc(cx, headY, headR, 0, Math.PI * 2); ctx.fill();

  // Hair tuft
  ctx.fillStyle = '#2a1a10';
  ctx.beginPath(); ctx.arc(cx - 3, headY - 6, 5, Math.PI, 0); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 3, headY - 5, 4, Math.PI, 0); ctx.fill();

  // Eyes
  ctx.fillStyle = '#1a1815';
  ctx.beginPath(); ctx.ellipse(cx - 4, headY - 1, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 4, headY - 1, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#441111';
  ctx.beginPath(); ctx.arc(cx - 3, headY, 1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 5, headY, 1, 0, Math.PI * 2); ctx.fill();

  // Mouth
  ctx.fillStyle = '#1a0a0a';
  ctx.beginPath(); ctx.ellipse(cx, headY + 4, 3, 2, 0, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

// Imp Zombie — portrait (200x260)
export function drawImpZombiePortrait(ctx, x, y, w, h) {
  const cx = x + w / 2;
  const headR = 30;
  const headY = y + 55;

  ctx.save();

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(cx, y + 248, 30, 6, 0, 0, Math.PI * 2); ctx.fill();

  // Legs
  const legG = ctx.createLinearGradient(0, y + 185, 0, y + 248);
  legG.addColorStop(0, '#4d3820'); legG.addColorStop(1, '#302010');
  ctx.fillStyle = legG;
  ctx.fillRect(cx - 20, y + 185, 13, 52);
  ctx.fillRect(cx + 7, y + 185, 13, 52);

  // Shoes
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.roundRect(cx - 23, y + 233, 19, 14, 3); ctx.fill();
  ctx.beginPath(); ctx.roundRect(cx + 4, y + 233, 19, 14, 3); ctx.fill();

  // Arms
  ctx.fillStyle = '#b5c8a8';
  ctx.save(); ctx.translate(cx - 22, y + 115); ctx.rotate(0.15); ctx.fillRect(-5, 0, 12, 64); ctx.restore();
  ctx.save(); ctx.translate(cx + 22, y + 115); ctx.rotate(-0.15); ctx.fillRect(-7, 0, 12, 64); ctx.restore();
  ctx.fillStyle = '#98b088';
  ctx.beginPath(); ctx.arc(cx - 26, y + 185, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 26, y + 185, 7, 0, Math.PI * 2); ctx.fill();

  // Body
  const jGrad = ctx.createLinearGradient(cx, y + 95, cx, y + 190);
  jGrad.addColorStop(0, '#8b5a30'); jGrad.addColorStop(0.4, '#6b4423'); jGrad.addColorStop(1, '#4a2a14');
  ctx.fillStyle = jGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 34, y + 95); ctx.lineTo(cx + 34, y + 95);
  ctx.lineTo(cx + 38, y + 190); ctx.lineTo(cx + 14, y + 178);
  ctx.lineTo(cx + 2, y + 190); ctx.lineTo(cx - 2, y + 180);
  ctx.lineTo(cx - 14, y + 190); ctx.lineTo(cx - 38, y + 178);
  ctx.closePath();
  ctx.fill();

  // Head
  const hG = ctx.createRadialGradient(cx - 4, headY - 4, 4, cx, headY, headR);
  hG.addColorStop(0, '#c5d8b8'); hG.addColorStop(0.5, '#b0c4a0'); hG.addColorStop(0.85, '#98a888'); hG.addColorStop(1, '#7a9070');
  ctx.fillStyle = hG; ctx.beginPath(); ctx.arc(cx, headY, headR, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#6a8060'; ctx.lineWidth = 2; ctx.stroke();

  // Hair tuft
  ctx.fillStyle = '#2a1810';
  ctx.beginPath(); ctx.arc(cx - 10, headY - 14, 12, Math.PI + 0.3, 2 * Math.PI - 0.3); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 8, headY - 12, 10, Math.PI + 0.2, 2 * Math.PI - 0.2); ctx.fill();

  // Eyes
  ctx.fillStyle = '#151210';
  ctx.beginPath(); ctx.ellipse(cx - 12, headY - 3, 9, 11, -0.05, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 12, headY - 3, 9, 11, 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#551515';
  ctx.beginPath(); ctx.arc(cx - 10, headY - 1, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 14, headY - 1, 3, 0, Math.PI * 2); ctx.fill();

  // Nose
  ctx.fillStyle = '#90a080';
  ctx.beginPath(); ctx.arc(cx, headY + 3, 4, 0, Math.PI * 2); ctx.fill();

  // Mouth
  ctx.fillStyle = '#150808';
  ctx.beginPath(); ctx.ellipse(cx, headY + 14, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
  // Small teeth
  ctx.fillStyle = '#e0d8c8';
  ctx.fillRect(cx - 4, headY + 12, 3, 2);
  ctx.fillRect(cx + 1, headY + 12, 3, 2);

  ctx.restore();
}
