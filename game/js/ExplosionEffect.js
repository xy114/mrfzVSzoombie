import { assetManager } from './AssetManager.js';
import { GifAnimator } from './GifAnimator.js';

export class ExplosionEffect {
  constructor(x, y, targetWidth, gifKey) {
    this.x = x;
    this.y = y;
    this.targetWidth = targetWidth;
    this.active = true;
    this.life = 0;

    const gifData = assetManager.getGifFrames(gifKey);
    if (gifData) {
      const frames = gifData.frames.map(f => ({ canvas: f.canvas, delay: f.delay }));
      this._animator = new GifAnimator(frames, gifData.width, gifData.height);
      this._animator.setLoop(false);
      this._gifWidth = gifData.width;
      this._gifHeight = gifData.height;
      this.maxLife = gifData.frames.reduce((sum, f) => sum + f.delay, 0) + 500;
    } else {
      this._animator = null;
      this.maxLife = 1000;
    }
  }

  update(deltaTime) {
    this.life += deltaTime;
    if (this._animator) {
      this._animator.update(deltaTime);
      if (!this._animator.isActive && this.life >= this.maxLife - 500) {
        this.active = false;
      }
    } else if (this.life >= this.maxLife) {
      this.active = false;
    }
  }

  render(ctx) {
    if (!this._animator || !this._animator.isActive) return;

    const progress = this.life / this.maxLife;
    const alpha = Math.max(0, 1 - progress * progress);

    ctx.save();
    ctx.globalAlpha = alpha;

    const frame = this._animator.getCurrentCanvas();
    const scale = this.targetWidth / this._gifWidth;
    const drawW = this.targetWidth;
    const drawH = Math.round(this._gifHeight * scale);
    const drawY = this.y + this.targetWidth * 0.5 - drawH;

    ctx.drawImage(frame, this.x, drawY, drawW, drawH);

    ctx.restore();
  }
}
