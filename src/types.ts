export interface Vector {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  pos: Vector;
  vel: Vector;
  radius: number;
  health: number;
  maxHealth: number;
  angle: number;
}

export interface Player extends Entity {
  ammo: number;
  maxAmmo: number;
  score: number;
  weapon: Weapon;
}

export interface Enemy extends Entity {
  type: 'grunt' | 'tank' | 'scout';
  lastShot: number;
}

export interface Bullet {
  id: string;
  pos: Vector;
  vel: Vector;
  ownerId: string;
  damage: number;
  life: number;
}

export interface Particle {
  id: string;
  pos: Vector;
  vel: Vector;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export interface Weapon {
  name: string;
  fireRate: number; // ms between shots
  damage: number;
  bulletSpeed: number;
  reloadTime: number;
  spread: number;
}

export const WEAPONS: Record<string, Weapon> = {
  pistol: {
    name: 'M1911',
    fireRate: 250,
    damage: 20,
    bulletSpeed: 12,
    reloadTime: 1000,
    spread: 0.05,
  },
  rifle: {
    name: 'M4A1',
    fireRate: 100,
    damage: 15,
    bulletSpeed: 15,
    reloadTime: 1500,
    spread: 0.1,
  },
  shotgun: {
    name: 'R870',
    fireRate: 800,
    damage: 10, // per pellet
    bulletSpeed: 10,
    reloadTime: 2000,
    spread: 0.4,
  }
};
