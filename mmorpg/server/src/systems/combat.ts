import { Mob, Player } from "../types.js";
import { damage, mobXpReward, xpForLevel, LVL_CAP, baseStatsForLevel } from "../balance.js";

export function tryAttackPlayerAgainstMob(now: number, p: Player, m: Mob) {
  const dist2 = (p.pos.x - m.pos.x)**2 + (p.pos.y - m.pos.y)**2;
  const inRange = dist2 <= 40*40; // melee range
  if (!inRange) return { hit: false, dmg: 0 };
  if (now < p.nextAttackAt) return { hit: false, dmg: 0 };
  p.nextAttackAt = now + 350; // ms cooldown
  const dmg = damage(p.atk, m.def);
  m.hp -= dmg;
  return { hit: true, dmg };
}

export function tryAttackMobAgainstPlayer(now: number, m: Mob, p: Player) {
  const dist2 = (p.pos.x - m.pos.x)**2 + (p.pos.y - m.pos.y)**2;
  const inRange = dist2 <= 35*35;
  if (!inRange) return { hit: false, dmg: 0 };
  if (now < m.nextAttackAt) return { hit: false, dmg: 0 };
  m.nextAttackAt = now + 600;
  const dmg = damage(m.atk, p.def);
  p.hp -= dmg;
  return { hit: true, dmg };
}

export function awardXpAndMaybeLevelUp(p: Player, mobLevel: number, isBoss: boolean) {
  const gain = mobXpReward(mobLevel, isBoss);
  p.xp += gain;
  // Level up loop (can chain)
  while (p.level < LVL_CAP && p.xp >= xpForLevel(p.level + 1)) {
    p.level++;
    const b = baseStatsForLevel(p.level);
    p.maxHp = b.maxHp;
    p.atk = b.atk;
    p.def = b.def;
    p.spd = b.spd;
    p.hp = p.maxHp; // heal on level up
  }
  return gain;
}
