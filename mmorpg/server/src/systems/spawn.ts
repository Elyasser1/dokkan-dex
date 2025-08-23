import { v4 as uuid } from "uuid";
import { World, Mob } from "../types.js";
import { BOSS_TEMPLATES, LVL_CAP, MOB_TEMPLATES, scaleMob } from "../balance.js";

export function spawnMob(world: World, level: number, isBoss = false): Mob {
  const tmpl = isBoss
    ? (BOSS_TEMPLATES[level] ?? { kind: "Unknown Boss", hpMult: 3, atkMult: 2, defMult: 1.5, spdMult: 1 })
    : MOB_TEMPLATES[Math.floor(Math.random() * MOB_TEMPLATES.length)];
  const s = scaleMob(level, tmpl, isBoss);
  const margin = 200;
  const m: Mob = {
    id: uuid(),
    kind: tmpl.kind,
    pos: {
      x: world.size.x + margin + Math.random() * (world.size.w - 2*margin),
      y: world.size.y + margin + Math.random() * (world.size.h - 2*margin)
    },
    hp: s.maxHp,
    maxHp: s.maxHp,
    atk: s.atk,
    def: s.def,
    spd: s.spd,
    level,
    isBoss,
    nextAttackAt: 0
  };
  world.mobs.set(m.id, m);
  return m;
}

export function ensurePopulation(world: World) {
  // Target population scales with average player level
  const players = [...world.players.values()];
  const avgLevel = players.length ? Math.floor(players.reduce((a,p)=>a+p.level,0)/players.length) : 1;
  const base = 40 + Math.floor(avgLevel * 0.8);
  const want = Math.min(150, base);

  while (world.mobs.size < want) {
    const lvl = Math.max(1, Math.min(LVL_CAP, avgLevel + (Math.random()*10-5)|0));
    spawnMob(world, lvl, false);
  }
}

export function maybeSpawnBosses(world: World) {
  // Keep one boss per bracket (10,20,...,100)
  for (let bracket = 10; bracket <= 100; bracket += 10) {
    const exists = [...world.mobs.values()].some(m => m.isBoss && m.level === bracket);
    if (!exists) {
      spawnMob(world, bracket, true);
    }
  }
}
