// ---- Level cap and XP curve (100 levels) ----
export const LVL_CAP = 100;

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  // Smooth quadratic XP curve with a soft ramp (feels like classic mobile MMOs)
  return Math.floor(50 * level * level + 200 * level);
}

export function xpToNext(level: number): number {
  const cur = xpForLevel(level);
  const nxt = xpForLevel(level + 1);
  return Math.max(0, nxt - cur);
}

// ---- Stat scaling ----
export function baseStatsForLevel(level: number) {
  const maxHp = Math.floor(80 + level * 20 + Math.pow(level, 1.3));
  const atk = Math.floor(8 + level * 2.2);
  const def = Math.floor(2 + level * 1.2);
  const spd = 3 + Math.min(6, level * 0.03); // tiles/sec
  return { maxHp, atk, def, spd };
}

// ---- Mob templates ----
export type MobTemplate = { kind: string; hpMult: number; atkMult: number; defMult: number; spdMult: number; };

export const MOB_TEMPLATES: MobTemplate[] = [
  { kind: "Slime",    hpMult: 1.0, atkMult: 0.9, defMult: 0.8, spdMult: 0.8 },
  { kind: "Skeleton", hpMult: 0.9, atkMult: 1.2, defMult: 0.9, spdMult: 1.0 },
  { kind: "Wolf",     hpMult: 0.8, atkMult: 1.1, defMult: 0.7, spdMult: 1.3 },
  { kind: "Orc",      hpMult: 1.4, atkMult: 1.3, defMult: 1.1, spdMult: 0.9 },
  { kind: "Mage",     hpMult: 0.7, atkMult: 1.6, defMult: 0.6, spdMult: 1.0 }
];

export const BOSS_TEMPLATES: Record<number, MobTemplate> = {
  10: { kind: "King Slime",  hpMult: 3.0, atkMult: 2.0, defMult: 1.5, spdMult: 0.9 },
  20: { kind: "Lich",        hpMult: 3.2, atkMult: 2.2, defMult: 1.6, spdMult: 1.0 },
  30: { kind: "Alpha Wolf",  hpMult: 3.1, atkMult: 2.0, defMult: 1.4, spdMult: 1.3 },
  40: { kind: "Warlord",     hpMult: 3.5, atkMult: 2.3, defMult: 1.8, spdMult: 1.0 },
  50: { kind: "Archmage",    hpMult: 2.6, atkMult: 2.8, defMult: 1.2, spdMult: 1.1 },
  60: { kind: "Ancient Treant", hpMult: 3.8, atkMult: 2.4, defMult: 2.0, spdMult: 0.9 },
  70: { kind: "Hydra",       hpMult: 4.2, atkMult: 2.6, defMult: 2.1, spdMult: 1.0 },
  80: { kind: "Demon Lord",  hpMult: 4.5, atkMult: 2.9, defMult: 2.3, spdMult: 1.1 },
  90: { kind: "Titan",       hpMult: 5.0, atkMult: 3.0, defMult: 2.5, spdMult: 1.0 },
  100:{ kind: "Elder Dragon",hpMult: 6.0, atkMult: 3.5, defMult: 2.7, spdMult: 1.2 }
};

// Build mob stats at a given level
export function scaleMob(level: number, tmpl: MobTemplate, isBoss = false) {
  const s = baseStatsForLevel(level);
  const bossBonus = isBoss ? 1.0 : 0.0;
  return {
    maxHp: Math.floor(s.maxHp * (tmpl.hpMult + bossBonus)),
    atk:   Math.floor(s.atk   * (tmpl.atkMult + bossBonus * 0.5)),
    def:   Math.floor(s.def   * (tmpl.defMult + bossBonus * 0.4)),
    spd:   s.spd * (tmpl.spdMult + (isBoss ? 0.1 : 0))
  };
}

// Simple damage formula (RPG-lite)
export function damage(atk: number, def: number): number {
  const raw = atk - def * 0.5;
  return Math.max(1, Math.floor(raw + Math.random() * 3));
}

// XP reward for mob kill
export function mobXpReward(mobLevel: number, isBoss: boolean): number {
  const base = Math.floor(20 + mobLevel * 12);
  return isBoss ? Math.floor(base * 6) : base;
}
