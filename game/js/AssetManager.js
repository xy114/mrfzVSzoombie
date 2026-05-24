export class AssetManager {
  constructor() {
    this.images = {};
    this.loaded = false;
    this.imagePaths = {
      // Plants — combat sprites
      sunflower: 'resources/plants/向日葵.gif',
      peashooter: 'resources/plants/豌豆射手.gif',
      nut: 'resources/plants/坚果.gif',
      cherrybomb: 'resources/plants/火爆辣椒·.gif',
      // Plants — portraits (reuse combat sprites, drawn at portrait size)
      sunflower_portrait: 'resources/plants/向日葵.gif',
      peashooter_portrait: 'resources/plants/豌豆射手.gif',
      nut_portrait: 'resources/plants/坚果.gif',
      cherrybomb_portrait: 'resources/plants/火爆辣椒·.gif',
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
      fire_pea: 'resources/plants/火豆.gif',
      sun: 'resources/tools/太阳.gif',
      // Lawn background
      lawn_bg: 'resources/tools/白天.jpg',
      // Almanac card backgrounds
      plant_card_bg: 'resources/others/Almanac_PlantCard.png',
      zombie_card_bg: 'resources/others/Almanac_ZombieCard.png'
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
