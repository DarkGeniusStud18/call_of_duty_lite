import { Vector, Bullet, Entity, Player, Enemy, Particle, WEAPONS } from './types';

export class GameEngine {
  player: Player;
  enemies: Enemy[] = [];
  bullets: Bullet[] = [];
  particles: Particle[] = [];
  
  width: number = 0;
  height: number = 0;
  
  keys: Set<string> = new Set();
  mousePos: Vector = { x: 0, y: 0 };
  isMouseDown: boolean = false;
  
  lastShotTime: number = 0;
  isReloading: boolean = false;
  reloadStartTime: number = 0;
  
  screenShake: number = 0;
  wave: number = 1;
  enemiesToSpawn: number = 5;
  
  constructor() {
    this.player = {
      id: 'player',
      pos: { x: 400, y: 300 },
      vel: { x: 0, y: 0 },
      radius: 15,
      health: 100,
      maxHealth: 100,
      angle: 0,
      ammo: 30,
      maxAmmo: 30,
      score: 0,
      weapon: WEAPONS.rifle
    };
  }

  init(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.player.pos = { x: width / 2, y: height / 2 };
    this.spawnWave();
  }

  spawnWave() {
    for (let i = 0; i < this.enemiesToSpawn; i++) {
      this.spawnEnemy();
    }
  }

  spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = Math.random() * this.width; y = -50; }
    else if (side === 1) { x = this.width + 50; y = Math.random() * this.height; }
    else if (side === 2) { x = Math.random() * this.width; y = this.height + 50; }
    else { x = -50; y = Math.random() * this.height; }

    this.enemies.push({
      id: Math.random().toString(36).substr(2, 9),
      pos: { x, y },
      vel: { x: 0, y: 0 },
      radius: 15,
      health: 50,
      maxHealth: 50,
      angle: 0,
      type: 'grunt',
      lastShot: 0
    });
  }

  update(dt: number) {
    // Player Movement
    const speed = 4;
    let dx = 0;
    let dy = 0;
    if (this.keys.has('w') || this.keys.has('ArrowUp')) dy -= 1;
    if (this.keys.has('s') || this.keys.has('ArrowDown')) dy += 1;
    if (this.keys.has('a') || this.keys.has('ArrowLeft')) dx -= 1;
    if (this.keys.has('d') || this.keys.has('ArrowRight')) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const mag = Math.sqrt(dx * dx + dy * dy);
      this.player.pos.x += (dx / mag) * speed;
      this.player.pos.y += (dy / mag) * speed;
    }

    // Keep player in bounds
    this.player.pos.x = Math.max(this.player.radius, Math.min(this.width - this.player.radius, this.player.pos.x));
    this.player.pos.y = Math.max(this.player.radius, Math.min(this.height - this.player.radius, this.player.pos.y));

    // Player Angle
    this.player.angle = Math.atan2(this.mousePos.y - this.player.pos.y, this.mousePos.x - this.player.pos.x);

    // Shooting
    const now = Date.now();
    if (this.isMouseDown && !this.isReloading && now - this.lastShotTime > this.player.weapon.fireRate) {
      if (this.player.ammo > 0) {
        this.shoot();
        this.lastShotTime = now;
      } else {
        this.reload();
      }
    }

    // Reloading
    if (this.isReloading && now - this.reloadStartTime > this.player.weapon.reloadTime) {
      this.player.ammo = this.player.maxAmmo;
      this.isReloading = false;
    }

    // Update Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.pos.x += b.vel.x;
      b.pos.y += b.vel.y;
      b.life -= dt;

      if (b.life <= 0 || b.pos.x < 0 || b.pos.x > this.width || b.pos.y < 0 || b.pos.y > this.height) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Collision with enemies
      if (b.ownerId === 'player') {
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          const dist = Math.sqrt((b.pos.x - e.pos.x) ** 2 + (b.pos.y - e.pos.y) ** 2);
          if (dist < e.radius) {
            e.health -= b.damage;
            this.createBlood(b.pos.x, b.pos.y);
            this.bullets.splice(i, 1);
            if (e.health <= 0) {
              this.enemies.splice(j, 1);
              this.player.score += 100;
              this.createExplosion(e.pos.x, e.pos.y, '#ef4444');
            }
            break;
          }
        }
      } else {
        // Collision with player
        const dist = Math.sqrt((b.pos.x - this.player.pos.x) ** 2 + (b.pos.y - this.player.pos.y) ** 2);
        if (dist < this.player.radius) {
          this.player.health -= b.damage;
          this.screenShake = 10;
          this.createBlood(this.player.pos.x, this.player.pos.y);
          this.bullets.splice(i, 1);
        }
      }
    }

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const angle = Math.atan2(this.player.pos.y - e.pos.y, this.player.pos.x - e.pos.x);
      e.angle = angle;
      
      const distToPlayer = Math.sqrt((this.player.pos.y - e.pos.y) ** 2 + (this.player.pos.x - e.pos.x) ** 2);
      
      if (distToPlayer > 150) {
        e.pos.x += Math.cos(angle) * 2;
        e.pos.y += Math.sin(angle) * 2;
      } else {
        // Enemy shooting
        if (now - e.lastShot > 1000) {
          this.enemyShoot(e);
          e.lastShot = now;
        }
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.pos.x += p.vel.x;
      p.pos.y += p.vel.y;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Screen Shake decay
    if (this.screenShake > 0) this.screenShake *= 0.9;

    // Next Wave
    if (this.enemies.length === 0) {
      this.wave++;
      this.enemiesToSpawn = 5 + this.wave * 2;
      this.spawnWave();
    }
  }

  shoot() {
    this.player.ammo--;
    this.screenShake = 3;
    const spread = (Math.random() - 0.5) * this.player.weapon.spread;
    const angle = this.player.angle + spread;
    
    this.bullets.push({
      id: Math.random().toString(),
      pos: { ...this.player.pos },
      vel: {
        x: Math.cos(angle) * this.player.weapon.bulletSpeed,
        y: Math.sin(angle) * this.player.weapon.bulletSpeed
      },
      ownerId: 'player',
      damage: this.player.weapon.damage,
      life: 2000
    });

    // Muzzle flash particles
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        id: Math.random().toString(),
        pos: { 
          x: this.player.pos.x + Math.cos(this.player.angle) * 20,
          y: this.player.pos.y + Math.sin(this.player.angle) * 20
        },
        vel: {
          x: (Math.random() - 0.5) * 5 + Math.cos(this.player.angle) * 5,
          y: (Math.random() - 0.5) * 5 + Math.sin(this.player.angle) * 5
        },
        color: '#fbbf24',
        life: 100,
        maxLife: 100,
        size: Math.random() * 3 + 1
      });
    }
  }

  enemyShoot(e: Enemy) {
    this.bullets.push({
      id: Math.random().toString(),
      pos: { ...e.pos },
      vel: {
        x: Math.cos(e.angle) * 8,
        y: Math.sin(e.angle) * 8
      },
      ownerId: e.id,
      damage: 10,
      life: 2000
    });
  }

  reload() {
    if (this.isReloading) return;
    this.isReloading = true;
    this.reloadStartTime = Date.now();
  }

  createBlood(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        id: Math.random().toString(),
        pos: { x, y },
        vel: {
          x: (Math.random() - 0.5) * 6,
          y: (Math.random() - 0.5) * 6
        },
        color: '#ef4444',
        life: 300,
        maxLife: 300,
        size: Math.random() * 4 + 2
      });
    }
  }

  createExplosion(x: number, y: number, color: string) {
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        id: Math.random().toString(),
        pos: { x, y },
        vel: {
          x: (Math.random() - 0.5) * 10,
          y: (Math.random() - 0.5) * 10
        },
        color,
        life: 500,
        maxLife: 500,
        size: Math.random() * 6 + 2
      });
    }
  }
}
