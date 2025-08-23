import { Mob, Player, World } from "../types.js";

function findClosestPlayer(m: Mob, world: World): Player | undefined {
  let best: Player | undefined; let bestD2 = Infinity;
  for (const p of world.players.values()) {
    if (!p.connected || p.hp <= 0) continue;
    const d2 = (p.pos.x - m.pos.x)**2 + (p.pos.y - m.pos.y)**2;
    if (d2 < bestD2) { bestD2 = d2; best = p; }
  }
  return best;
}

export function stepMobAI(m: Mob, world: World, dt: number) {
  const target = findClosestPlayer(m, world);
  if (!target) return;
  const dx = target.pos.x - m.pos.x;
  const dy = target.pos.y - m.pos.y;
  const d = Math.hypot(dx, dy);

  const aggroDist = m.isBoss ? 600 : 400;
  if (d > aggroDist) return;

  const vx = (dx / (d || 1)) * m.spd * dt;
  const vy = (dy / (d || 1)) * m.spd * dt;
  m.pos.x += vx;
  m.pos.y += vy;
}
