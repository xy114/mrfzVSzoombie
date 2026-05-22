export class AssetManager {
  constructor() {
    this.images = {};
    this.loaded = false;
    this.imagePaths = {
      sunflower: 'assets/plants/sunflower.png',
      peashooter: 'assets/plants/peashooter.png',
      peashooter_shoot: 'assets/plants/peashooter_shoot.png',
      normal_zombie: 'assets/zombies/normal_zombie.png',
      normal_zombie_attack: 'assets/zombies/normal_zombie_attack.png',
      cone_zombie: 'assets/zombies/cone_zombie.png',
      cone_zombie_attack: 'assets/zombies/cone_zombie_attack.png',
      pea: 'assets/projectiles/pea.png',
      fire_pea: 'assets/projectiles/fire_pea.png'
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
