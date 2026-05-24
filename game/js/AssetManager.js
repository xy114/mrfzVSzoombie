export class AssetManager {
  constructor() {
    this.images = {};
    this.loaded = false;
    this.imagePaths = {
      // Plants — combat sprites
      sunflower: 'resources/plants/sunflower.png',
      peashooter: 'resources/plants/peashooter.png',
      nut: 'resources/plants/nut.png',
      cherrybomb: 'resources/plants/cherrybomb.png',
      // Plants — portraits
      sunflower_portrait: 'resources/plants/sunflower_portrait.png',
      peashooter_portrait: 'resources/plants/peashooter_portrait.png',
      nut_portrait: 'resources/plants/nut_portrait.png',
      cherrybomb_portrait: 'resources/plants/cherrybomb_portrait.png',
      // Zombies — combat sprites
      normal: 'resources/zombies/normal.png',
      cone: 'resources/zombies/cone.png',
      shield: 'resources/zombies/shield.png',
      imp: 'resources/zombies/imp.png',
      // Zombies — portraits
      normal_portrait: 'resources/zombies/normal_portrait.png',
      cone_portrait: 'resources/zombies/cone_portrait.png',
      shield_portrait: 'resources/zombies/shield_portrait.png',
      imp_portrait: 'resources/zombies/imp_portrait.png',
      // Projectiles
      pea: 'resources/projectiles/pea.png',
      fire_pea: 'resources/projectiles/fire_pea.png',
      sun: 'resources/projectiles/sun.png'
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

  hasImage(name) {
    return !!this.images[name];
  }
}

export const assetManager = new AssetManager();
