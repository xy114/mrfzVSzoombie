import { Plant } from './Plant.js';
import { assetManager } from './AssetManager.js';

export class Squash extends Plant {
  constructor(x, y, starLevel = 1) {
    super(x, y, starLevel);
    this.plantType = 'squash';
    this.baseMaxHealth = 150;
    this._doHealthScaling();
    this.baseDamage = 80;
    this.width = 80; this.height = 80;
    this._stunned = false; this._stunTimer = 0;
    this._attackBoost = 1.0;
    this._squashing = false;
    this._squashAnim = null;
    this._squashTarget = null;
    this._squashTargets = [];
    this._damageDealt = false;

    this._idleAnim = assetManager.createAnimator('squash_idle');
    this.skillCooldown = 0; this.skillMaxCooldown = 15000;
    this.row = 0;
  }

  update(deltaTime, game) {
    if (!this.alive) return;
    if (this.skillCooldown > 0) this.skillCooldown -= deltaTime;
    if (this._stunned) {
      this._stunTimer -= deltaTime;
      if (this._stunTimer <= 0) { this._stunned = false; this._attackBoost = 1.5; }
      if (this._idleAnim) this._idleAnim.update(deltaTime);
      return;
    }
    if (this._idleAnim) this._idleAnim.update(deltaTime);

    if (this._squashing) {
      if (this._squashAnim) {
        this._squashAnim.update(deltaTime);
        if (!this._damageDealt && this._squashAnim._currentIndex >= Math.floor(this._squashAnim.frameCount * 0.8)) {
          this._damageDealt = true;
          const dmg = Math.floor(this.baseDamage * 3 * this._attackBoost);
          for (const oz of this._squashTargets) {
            if (oz.alive) { oz._squashed = true; oz.takeDamage(dmg, 'physical'); }
          }
        }
        if (!this._squashAnim.isActive) {
          this.alive = false;
          if (this.row !== undefined && this.col !== undefined) game.lawn.removePlant(this.row, this.col);
        }
      }
      return;
    }

    for (const z of game.zombies) {
      if (z.alive && z.row === this.row) {
        const dx = z.x + z.width/2 - (this.x + this.width/2);
        if (dx > 0 && dx < 80) {
          this._squashing = true;
          this._squashAnim = assetManager.createAnimator('squash_jump');
          if (this._squashAnim) {
            this._squashAnim.setLoop(false);
            for (const f of this._squashAnim._frames) { if (f.delay < 100) f.delay = 100; }
          }
          this._squashTarget = z;
          this._squashTargets = [];
          this._damageDealt = false;
          this._invulnerable = true;
          // Find all zombies within 1 cell of target and pause them
          const cellW = game.lawn.standardCell.w;
          const cx = z.x + z.width / 2, cy = z.y + z.height / 2;
          for (const oz of game.zombies) {
            if (oz.alive && Math.abs(oz.x + oz.width/2 - cx) < cellW && Math.abs(oz.y + oz.height/2 - cy) < cellW) {
              oz._pauseTimer = 2000;
              this._squashTargets.push(oz);
            }
          }
          break;
        }
      }
    }
  }

  useSkill(game) {
    if (this.skillCooldown > 0 || this._stunned) return false;
    this._stunned = true; this._stunTimer = 10000;
    this.skillCooldown = this.skillMaxCooldown; return true;
  }

  render(ctx) {
    if (!this.alive || this._squashing) return;
    if (this._idleAnim) {
      const frame = this._idleAnim.getCurrentCanvas();
      if (frame) {
        const nw = this._idleAnim.naturalWidth, nh = this._idleAnim.naturalHeight;
        const s = Math.min(this.width/nw, this.height/nh);
        const dw = Math.round(nw*s), dh = Math.round(nh*s);
        this._barAnchorY = this.y + this.height - dh;
        ctx.drawImage(frame, this.x+(this.width-dw)/2, this._barAnchorY, dw, dh);
      }
    }
  }

  renderJump(ctx) {
    if (!this._squashing || !this._squashTarget || !this._squashAnim) return;
    const frame = this._squashAnim.getCurrentCanvas();
    if (!frame) return;
    const t = this._squashTarget;
    const JUMP_W = 80;
    const nw = this._squashAnim.naturalWidth;
    const nh = this._squashAnim.naturalHeight;
    const s = JUMP_W / nw;
    const dw = JUMP_W, dh = Math.round(nh * s);
    ctx.drawImage(frame, t.x + t.width/2 - dw/2, t.y + t.height - dh, dw, dh);
  }

  renderBars(ctx) {
    if (this._squashing) return;
    super.renderBars(ctx);
  }

  getBodyType() { return 'plant'; }
}
