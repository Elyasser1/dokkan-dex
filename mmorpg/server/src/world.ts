import { World, Player, Mob, PublicPlayer, PublicMob } from "./types.js";
import { LVL_CAP, baseStatsForLevel } from "./balance.js";

export function makeWorld(): World {
  return {
    size: { x: 0, y: 0, w: 3000, h: 3000 },
    players: new Map<string, Player>(),
    mobs: new Map<string, Mob>(),
    t: 0
  };
}

export function newPlayer(id: string, name: string): Player {
  const level = 1;
  const b = baseStatsForLevel(level);
  return {
    id,
    name,
    pos: { x: 1500 + (Math.random()*100-50), y: 1500 + (Math.random()*100-50) },
    vel: { x: 0, y: 0 },
    dir: { x: 1, y: 0 },
    hp: b.maxHp,
    maxHp: b.maxHp,
    atk: b.atk,
    def: b.def,
    spd: b.spd,
    level,
    xp: 0,
    nextAttackAt: 0,
    connected: true
  };
}

export function clampToWorld(p: {x:number;y:number}, world: World) {
  p.x = Math.max(world.size.x, Math.min(world.size.x + world.size.w, p.x));
  p.y = Math.max(world.size.y, Math.min(world.size.y + world.size.h, p.y));
}

export function toPublicPlayer(p: Player): PublicPlayer {
  return { id: p.id, name: p.name, x: p.pos.x, y: p.pos.y, hp: p.hp, maxHp: p.maxHp, level: p.level };
}

export function toPublicMob(m: Mob): PublicMob {
  return { id: m.id, kind: m.kind, x: m.pos.x, y: m.pos.y, hp: m.hp, maxHp: m.maxHp, level: m.level, isBoss: m.isBoss };
}
