export class AssetManager {
  constructor() {
    this.images = {};
    this._noBgCache = {};
    this.loaded = false;
    this.imagePaths = {
      // Plants — combat sprites
      sunflower: 'resources/plants/向日葵.gif',
      peashooter: 'resources/plants/豌豆射手.gif',
      nut: 'resources/plants/坚果.gif',
      cherrybomb: 'resources/plants/樱桃炸弹.gif',
      // Plants — portraits (reuse combat sprites, drawn at portrait size)
      sunflower_portrait: 'resources/plants/向日葵.gif',
      peashooter_portrait: 'resources/plants/豌豆射手.gif',
      nut_portrait: 'resources/plants/坚果.gif',
      cherrybomb_portrait: 'resources/plants/樱桃炸弹.gif',
      // Zombies — combat sprites
      normal: 'resources/zombies/普通僵尸走路.gif',
      normal_attack: 'resources/zombies/普通僵尸啃食.gif',
      cone: 'resources/zombies/路障僵尸.gif',
      cone_attack: 'resources/zombies/路障僵尸啃食.gif',
      shield: 'resources/zombies/铁门僵尸.gif',
      shield_attack: 'resources/zombies/铁门僵尸啃食.gif',
      imp: 'resources/zombies/小鬼僵尸.gif',
      imp_attack: 'resources/zombies/小鬼啃食.gif',
      // Zombies — portraits (reuse combat sprites)
      normal_portrait: 'resources/zombies/普通僵尸走路.gif',
      cone_portrait: 'resources/zombies/路障僵尸.gif',
      shield_portrait: 'resources/zombies/铁门僵尸.gif',
      imp_portrait: 'resources/zombies/小鬼僵尸.gif',
      // Projectiles
      pea: 'resources/plants/豆.gif',
      sun: 'resources/tools/太阳.gif',
      // Lawn backgrounds — scenes
      lawn_bg: 'resources/scene/主页.png',
      lawn_bg_day: 'resources/scene/白天.jpg',
      lawn_bg_night: 'resources/scene/晚上.jpg',
      lawn_bg_pool: 'resources/scene/泳池.jpg',
      lawn_bg_fog: 'resources/scene/迷雾.jpg',
      lawn_bg_one: 'resources/scene/一条.jpg',
      lawn_bg_three: 'resources/scene/三条.jpg',
      lawn_bg_ground: 'resources/scene/土地.jpg',
      lawn_bg_dayRoof: 'resources/scene/白天屋顶.jpg',
      lawn_bg_nightRoof: 'resources/scene/晚上屋顶.jpg',
      // Almanac card backgrounds
      plant_card_bg: 'resources/others/Almanac_PlantCard.png',
      zombie_card_bg: 'resources/others/Almanac_ZombieCard.png',
      // Crystal icon
      crystal_icon: 'resources/others/浅蓝正八面体.png',
      // Visitor resources
      visitor_katana_zero: 'resources/special/Katana_Zero.png',
      visitor_katana_zero_time: 'resources/special/Katana_Zero_time.png',
      visitor_slash: 'resources/special/刀光.png',
      // Wishadel skin
      wishadel_combat: 'resources/special/维什戴尔战斗形象.png',
      wishadel_shell: 'resources/special/维什戴尔技能释放的炮弹.png',
      wishadel_portrait: 'resources/special/立绘_维什戴尔.png',
      peashooter_skin_wishadel_portrait: 'resources/special/立绘_维什戴尔.png',
      peashooter_skin_wishadel_headshot: 'resources/special/维什戴尔大头像.png',
      peashooter_skin_wishadel_combat: 'resources/special/维什戴尔战斗形象.png'
    };
  }

  async loadImages() {
    const promises = Object.entries(this.imagePaths).map(([key, path]) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          this.images[key] = img;
          resolve();
        };
        img.onerror = () => {
          console.warn(`Failed to load image: ${path}`);
          resolve();
        };
        img.src = path;
      });
    });

    await Promise.all(promises);
    this.loaded = true;
  }

  getImage(name) {
    return this.images[name] || null;
  }

  // Returns a processed version of the image with pure-black background removed.
  // Uses flood-fill from edges so dark pixels inside the character are preserved.
  getImageNoBg(name) {
    if (this._noBgCache[name]) return this._noBgCache[name];
    const src = this.images[name];
    if (!src) return null;

    const w = src.naturalWidth, h = src.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(src, 0, 0);
    const data = ctx.getImageData(0, 0, w, h);
    const pixels = data.data;

    // Build visited mask for flood fill from edges
    const visited = new Uint8Array(w * h);
    const queue = [];

    const isBlack = (idx) => {
      const i = idx * 4;
      return pixels[i] === 0 && pixels[i + 1] === 0 && pixels[i + 2] === 0;
    };

    // Seed from all 4 edges
    for (let x = 0; x < w; x++) {
      const top = x, bottom = (h - 1) * w + x;
      if (isBlack(top) && !visited[top]) { visited[top] = 1; queue.push(top); }
      if (isBlack(bottom) && !visited[bottom]) { visited[bottom] = 1; queue.push(bottom); }
    }
    for (let y = 1; y < h - 1; y++) {
      const left = y * w, right = y * w + (w - 1);
      if (isBlack(left) && !visited[left]) { visited[left] = 1; queue.push(left); }
      if (isBlack(right) && !visited[right]) { visited[right] = 1; queue.push(right); }
    }

    // BFS flood fill
    let head = 0;
    while (head < queue.length) {
      const idx = queue[head++];
      const x = idx % w, y = Math.floor(idx / w);
      for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
        const ni = ny * w + nx;
        if (!visited[ni] && isBlack(ni)) {
          visited[ni] = 1;
          queue.push(ni);
        }
      }
    }

    // Make visited (background) pixels transparent
    for (let i = 0; i < w * h; i++) {
      if (visited[i]) pixels[i * 4 + 3] = 0;
    }
    ctx.putImageData(data, 0, 0);

    // Canvas doesn't have naturalWidth/naturalHeight, callers expect these
    canvas.naturalWidth = w;
    canvas.naturalHeight = h;

    this._noBgCache[name] = canvas;
    return canvas;
  }

  hasImage(name) {
    return !!this.images[name];
  }
}

export const assetManager = new AssetManager();
