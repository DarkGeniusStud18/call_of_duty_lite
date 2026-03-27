import { GameEngine } from './gameEngine';

export function render(ctx: CanvasRenderingContext2D, game: GameEngine) {
  const { width, height, player, enemies, bullets, particles, screenShake } = game;

  ctx.save();
  
  // Screen Shake
  if (screenShake > 0) {
    ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
  }

  // Clear background
  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 0, width, height);

  // Draw Grid
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 1;
  const gridSize = 50;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Draw Particles
  particles.forEach(p => {
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.pos.x, p.pos.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Draw Bullets
  ctx.fillStyle = '#fbbf24';
  bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.pos.x, b.pos.y, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Bullet trail
    ctx.strokeStyle = '#fbbf24';
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.moveTo(b.pos.x, b.pos.y);
    ctx.lineTo(b.pos.x - b.vel.x * 2, b.pos.y - b.vel.y * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  });

  // Draw Enemies
  enemies.forEach(e => {
    ctx.save();
    ctx.translate(e.pos.x, e.pos.y);
    ctx.rotate(e.angle);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.arc(2, 2, e.radius, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
    ctx.fill();

    // Gun
    ctx.fillStyle = '#27272a';
    ctx.fillRect(10, -3, 15, 6);

    // Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(8, -5, 3, 0, Math.PI * 2);
    ctx.arc(8, 5, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Health Bar
    const barWidth = 30;
    const healthPercent = e.health / e.maxHealth;
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(e.pos.x - barWidth / 2, e.pos.y - 25, barWidth, 4);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(e.pos.x - barWidth / 2, e.pos.y - 25, barWidth * healthPercent, 4);
  });

  // Draw Player
  ctx.save();
  ctx.translate(player.pos.x, player.pos.y);
  ctx.rotate(player.angle);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.arc(2, 2, player.radius, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();

  // Gun
  ctx.fillStyle = '#27272a';
  ctx.fillRect(10, -4, 20, 8);

  // Helmet/Head detail
  ctx.fillStyle = '#1d4ed8';
  ctx.beginPath();
  ctx.arc(0, 0, player.radius * 0.7, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  ctx.restore();
}
