import { assetManager } from './AssetManager.js';
import { drawPea, drawFirePea } from './ProjectileRenderer.js';

export class Bullet {
  constructor(x, y, row, damage = 20) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.speed = 5;
    this.damage = damage;
    this.damageType = 'physical';
    this.width = 20;
    this.height = 20;
    this.active = true;
  }

  update(deltaTime) {
    this.x += this.speed * (deltaTime / 16);
  }

  render(ctx) {
    const img = assetManager.getImage('pea');
    if (img) {
      ctx.drawImage(img, this.x, this.y, 20, 20);
    } else {
      drawPea(ctx, this.x + 10, this.y + 10, 10);
    }
  }
}

export class FireBullet {
  constructor(x, y, row, damage = 50) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.speed = 7;
    this.damage = damage;
    this.damageType = 'magic';
    this.explosionRadius = 1.5;
    this.width = 25;
    this.height = 25;
    this.active = true;
    this.exploded = false;
  }

  update(deltaTime, game) {
    if (this.exploded) {
      this.active = false;
      return;
    }

    this.x += this.speed * (deltaTime / 16);

    const hitZombie = game.zombies.find(z =>
      z.row === this.row &&
      z.x < this.x + 30 &&
      z.x > this.x - 30
    );

    if (hitZombie) {
      this.explode(game);
    }

    if (this.x > game.canvas.width) {
      this.active = false;
    }
  }

  explode(game) {
    this.exploded = true;
    this.active = false;

    const cellWidth = 100;
    const centerCol = Math.floor(this.x / cellWidth);
    const centerRow = this.row;
    const hit = new Set();

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const targetRow = centerRow + dr;
        const targetCol = centerCol + dc;

        game.zombies.forEach(zombie => {
          if (hit.has(zombie)) return;
          if (zombie.row === targetRow) {
            const zombieCol = Math.floor(zombie.x / cellWidth);
            if (Math.abs(zombieCol - targetCol) <= 1) {
              hit.add(zombie);
              zombie.takeDamage(this.damage, this.damageType);
            }
          }
        });
      }
    }

    game.collectZombieKillsInRadius(centerRow, centerCol);
  }

  render(ctx) {
    const img = assetManager.getImage('fire_pea');
    if (img) {
      ctx.drawImage(img, this.x - 5, this.y, 30, 25);
    } else {
      drawFirePea(ctx, this.x + 10, this.y + 12, 12);
    }
    if (this.exploded) {
      // Draw explosion
      ctx.save();
      const ex = this.x + 10;
      const ey = this.y + 12;
      const expGrad = ctx.createRadialGradient(ex, ey, 2, ex, ey, 30);
      expGrad.addColorStop(0, 'rgba(255,255,100,0.8)');
      expGrad.addColorStop(0.4, 'rgba(255,150,20,0.5)');
      expGrad.addColorStop(0.7, 'rgba(255,50,0,0.2)');
      expGrad.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = expGrad;
      ctx.beginPath();
      ctx.arc(ex, ey, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
