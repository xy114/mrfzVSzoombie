export class DamageNumber {
  constructor(x, y, value, isCrit = false) {
    this.x = x;
    this.y = y;
    this.value = Math.round(value);
    this.isCrit = isCrit;
    this.active = true;
    this.life = 0;
    this.maxLife = isCrit ? 900 : 600;
    this.scale = isCrit ? 2.0 : 1.0;
    this.vy = -1.2;
  }

  update(deltaTime) {
    this.life += deltaTime;
    this.y += this.vy * deltaTime;
    if (this.isCrit && this.life < 150) {
      this.scale = 2.0 + (this.life / 150) * 0.5;
    } else if (this.isCrit) {
      this.scale = Math.max(1.0, 2.5 - (this.life - 150) / 300);
    }
    if (this.life >= this.maxLife) {
      this.active = false;
    }
  }

  render(ctx) {
    const alpha = Math.max(0, 1 - this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${Math.round(this.isCrit ? 28 : 20) * this.scale}px "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(String(this.value), this.x, this.y);

    ctx.fillStyle = this.isCrit ? '#ff3333' : '#e03030';
    ctx.fillText(String(this.value), this.x, this.y);

    if (this.isCrit && this.life < 200) {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = alpha * (1 - this.life / 200);
      ctx.fillText(String(this.value), this.x, this.y);
    }

    ctx.restore();
  }
}
