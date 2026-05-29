import { Plant } from './Plant.js';
import { GAME_CONFIG } from './constants.js';
import { assetManager } from './AssetManager.js';
import { Dragon } from './Dragon.js';

const STATE = { IDLE: 'idle', LAUNCHING: 'launching', TRAVELING: 'traveling', DONE: 'done' };

export class Cart extends Plant {
  constructor(row, skinId = 'default') {
    super(0, 0, 1);
    this.row = row;
    this.col = -1;
    this.skinId = skinId;
    this.speed = 5;
    this.state = STATE.IDLE;
    this._attackTimer = 0;
    this._dragonSpawned = false;
    this._dragon = null;

    // Set bodyType-dependent dimensions (per 游戏基础设定)
    const bodyType = this.getBodyType();
    this.width = bodyType === 'humanoid' ? 125 : GAME_CONFIG.CELL_WIDTH;

    // Calculate height via aspect ratio from combat image
    const combatImg = assetManager.getSkinCombatImage('cart', skinId);
    if (combatImg) {
      const ratio = combatImg.naturalHeight / combatImg.naturalWidth;
      this.height = Math.round(this.width * ratio);
    } else {
      this.height = this.width;
    }

    // Position defaults — overridden by Game.initCarts()
    this.x = 0;
    this.y = 0;

    // Initialize animators for fireChen skin
    if (skinId === 'fireChen') {
      this._combatAnimator = assetManager.createAnimator('fireChen_combat');
      if (this._combatAnimator) this._combatAnimator.setLoop(true);
    }

    // Cart cannot be damaged
    this.health = 0;
    this.maxHealth = 0;
  }

  getBodyType() {
    return this.skinId === 'fireChen' ? 'humanoid' : 'plant';
  }

  getRenderSize() {
    return 80;
  }

  takeDamage(damage) {
    // Cart is invulnerable
  }

  update(deltaTime, game) {
    if (this.state === STATE.DONE) return;

    // Update animators
    if (this._combatAnimator) this._combatAnimator.update(deltaTime);
    if (this._attackAnimator) this._attackAnimator.update(deltaTime);

    switch (this.state) {
      case STATE.IDLE:
        this._checkTrigger(game);
        break;

      case STATE.LAUNCHING:
        this._attackTimer += deltaTime;
        // Spawn dragon at half the attack animation (~500ms)
        if (!this._dragonSpawned && this._attackTimer >= 500) {
          this._dragonSpawned = true;
          this._dragon = new Dragon(this.y);
          game.dragons.push(this._dragon);
        }
        // Attack animation ends at ~1000ms
        if (this._attackTimer >= 1000) {
          this._attackAnimator = null;
          this.state = STATE.TRAVELING;
        }
        break;

      case STATE.TRAVELING:
        if (this.skinId === 'fireChen') {
          // FireChen stays in place; dragon does the work
          if (!this._dragon || !this._dragon.active) {
            this.alive = false;
            this.state = STATE.DONE;
          }
        } else {
          // Default cart: drive right
          this.x += this.speed * (deltaTime / 16);
          this._hitZombiesInRow(game);
          if (this.x > GAME_CONFIG.CANVAS_WIDTH + this.width) {
            this.alive = false;
            this.state = STATE.DONE;
          }
        }
        break;
    }
  }

  _checkTrigger(game) {
    const cartCenter = this.x + this.width / 2;
    for (const z of game.zombies) {
      const zCenter = z.x + z.width / 2;
      if (z.row === this.row && z.alive && zCenter <= cartCenter) {
        this._activate();
        return;
      }
    }
  }

  _activate() {
    if (this.skinId === 'fireChen') {
      this.state = STATE.LAUNCHING;
      this._attackAnimator = assetManager.createAnimator('fireChen_attack');
      if (this._attackAnimator) this._attackAnimator.setLoop(false);
      this._attackTimer = 0;
      this._dragonSpawned = false;
    } else {
      this.state = STATE.TRAVELING;
    }
  }

  _hitZombiesInRow(game) {
    const cartCenterX = this.x + this.width / 2;
    const cartCenterY = this.y + this.height / 2;
    for (const z of game.zombies) {
      if (z.row === this.row && z.alive && !z._deathDeferred) {
        const zcx = z.x + z.width / 2;
        const zcy = z.y + z.height / 2;
        const dx = Math.abs(cartCenterX - zcx);
        const dy = Math.abs(cartCenterY - zcy);
        const collisionDist = (this.width + z.width) / 2;
        if (dx < collisionDist && dy < 60) {
          z.health = 0;
          z.alive = false;
          z._shouldSpawnDeathEffect = true;
        }
      }
    }
  }

  render(ctx) {
    if (this.state === STATE.DONE) return;

    const isFireChen = this.skinId === 'fireChen';
    const scale = isFireChen ? 1.0 : 0.5;

    ctx.save();
    if (scale !== 1) ctx.scale(scale, scale);
    const sx = this.x / scale;
    const sy = this.y / scale;

    // LAUNCHING: render attack GIF, fall back to combat GIF
    if (this.state === STATE.LAUNCHING) {
      if (this._attackAnimator) {
        const frame = this._attackAnimator.getCurrentCanvas();
        if (frame) {
          ctx.drawImage(frame, sx, sy, this.width, this.height);
          ctx.restore();
          return;
        }
      }
      // Fall through to combat/idle rendering below
    }

    // FireChen combat GIF
    if (isFireChen && this._combatAnimator) {
      const frame = this._combatAnimator.getCurrentCanvas();
      if (frame) {
        ctx.drawImage(frame, sx, sy, this.width, this.height);
      }
      ctx.restore();
      return;
    }

    // Default cart: static PNG
    const img = assetManager.getSkinCombatImage('cart', this.skinId);
    if (img) {
      ctx.drawImage(img, sx, sy, this.width, this.height);
    }
    ctx.restore();
  }

  renderBars(ctx) {
    // Cart has no health bar
  }
}
