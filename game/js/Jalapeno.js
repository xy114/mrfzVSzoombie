import { Plant } from './Plant.js';
import { assetManager } from './AssetManager.js';

export class Jalapeno extends Plant {
  constructor(x, y, starLevel = 1) {
    super(x, y, starLevel);
    this.plantType = 'jalapeno';
    this.width = 80;
    this.height = 80;
    this.baseDamage = 180;
    this._deployTime = 1500;
    this._deployTimer = 0;
    this._exploded = false;
    this._deploying = true;
    this._invulnerable = true;
    this._animator = assetManager.createAnimator('jalapeno');
    if (this._animator) this._animator.setLoop(false);
    this._fireAnimator = null;
    this.row = 0;
  }

  update(deltaTime, game) {
    if (this._animator) this._animator.update(deltaTime);
    if (this._fireAnimator) this._fireAnimator.update(deltaTime);

    if (this._deploying) {
      this._deployTimer += deltaTime;
      if (this._deployTimer >= this._deployTime) {
        this._deploying = false;
        this._explode(game);
      }
      return;
    }

    if (this._exploded && this._fireAnimator && !this._fireAnimator.isActive) {
      this.alive = false;
    }
  }

  _explode(game) {
    this._exploded = true;
    this._fireAnimator = assetManager.createAnimator('jalapeno_fire');
    if (this._fireAnimator) this._fireAnimator.setLoop(false);

    for (const z of game.zombies) {
      if (z.alive && z.row === this.row) {
        const dmg = Math.floor(60 + this.baseDamage * 2);
        z.takeDamage(dmg, 'magic');
      }
    }
  }

  useSkill() { return false; }

  render(ctx) {
    if (this._exploded) {
      if (this._fireAnimator) {
        const frame = this._fireAnimator.getCurrentCanvas();
        if (frame) {
          const lawnH = 100;
          const fireY = this.y + this.height / 2 - lawnH / 2;
          ctx.drawImage(frame, 0, fireY, 900, lawnH);
        }
      }
      return;
    }

    if (this._animator) {
      const frame = this._animator.getCurrentCanvas();
      if (frame) {
        const nw = this._animator.naturalWidth;
        const nh = this._animator.naturalHeight;
        const s = Math.min(this.width / nw, this.height / nh);
        const dw = Math.round(nw * s);
        const dh = Math.round(nh * s);
        const dx = this.x + (this.width - dw) / 2;
        const dy = this.y + (this.height - dh) / 2;
        this._barAnchorY = dy;
        ctx.drawImage(frame, dx, dy, dw, dh);
        return;
      }
    }
  }

  getBodyType() { return 'plant'; }
  getRenderSize() { return 80; }
  getAspectRatio() { return 1.0; }
}
