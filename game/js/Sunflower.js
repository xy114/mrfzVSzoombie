import { Plant } from './Plant.js';
import { Sun } from './Sun.js';
import { SUN_CONFIG, STAR_CONFIG } from './constants.js';
import { assetManager } from './AssetManager.js';
import { drawSunflower } from './PlantRenderer.js';
import { GifAnimator } from './GifAnimator.js';

export class Sunflower extends Plant {
  constructor(x, y, starLevel = 1) {
    super(x, y, starLevel);
    this.plantType = 'sunflower';
    this.sunTimer = 0;
    this.baseSunInterval = SUN_CONFIG.SUNFLOWER_INTERVAL;
    const m = STAR_CONFIG[this.starLevel] || STAR_CONFIG[1];
    this.sunInterval = Math.floor(this.baseSunInterval * m.cooldownMult);
    this._animator = assetManager.createAnimator('sunflower');
  }

  update(deltaTime, game) {
    if (this._animator) this._animator.update(deltaTime);
    this.sunTimer += deltaTime;
    if (this.sunTimer >= this.sunInterval) {
      this.sunTimer = 0;
      const sunX = this.x + 10 + Math.random() * 60;
      const startY = this.y - 30 - Math.random() * 20;
      const targetY = this.y + 20 + Math.random() * 30;
      game.addSun(new Sun(sunX, startY, targetY));
    }
  }

  render(ctx) {
    if (this._animator) {
      const frame = this._animator.getCurrentCanvas();
      const scale = this.width / this._animator.naturalWidth;
      const drawW = this.width;
      const drawH = Math.round(this._animator.naturalHeight * scale);
      const drawY = this.y + this.height - drawH;
      this._barAnchorY = drawY;
      ctx.drawImage(frame, this.x, drawY, drawW, drawH);
      return;
    }
    const img = assetManager.getImage('sunflower');
    if (img) {
      ctx.drawImage(img, this.x, this.y, this.width, this.height);
    } else {
      drawSunflower(ctx, this.x, this.y, this.width, this.height);
    }
  }

}
