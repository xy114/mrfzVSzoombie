export class Sun {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.targetY = y + 50;
    this.width = 40;
    this.height = 40;
    this.active = true;
    this.lifetime = 10000;
    this.timer = 0;
    this.falling = true;
  }

  update(deltaTime) {
    this.timer += deltaTime;

    if (this.falling) {
      this.y += 1;
      if (this.y >= this.targetY) {
        this.falling = false;
      }
    }

    if (this.timer >= this.lifetime) {
      this.active = false;
    }
  }

  collect() {
    this.active = false;
    return 25;
  }

  render(ctx) {
    ctx.font = '35px Arial';
    ctx.fillText('☀️', this.x, this.y + 25);
  }
}