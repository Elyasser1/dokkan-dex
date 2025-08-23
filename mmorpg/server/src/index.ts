import { WebSocketServer } from "ws";
import { v4 as uuid } from "uuid";
import { makeWorld, newPlayer, clampToWorld, toPublicMob, toPublicPlayer } from "./world.js";
import { ClientMsg, ServerMsg, Player, Mob, HitEvent } from "./types.js";
import { awardXpAndMaybeLevelUp, tryAttackMobAgainstPlayer, tryAttackPlayerAgainstMob } from "./systems/combat.js";
import { ensurePopulation, maybeSpawnBosses } from "./systems/spawn.js";
import { stepMobAI } from "./systems/ai.js";
import { LVL_CAP } from "./balance.js";

const TICK_HZ = 20;
const MS_PER_TICK = 1000 / TICK_HZ;

const world = makeWorld();

type Conn = { id: string; ws: import("ws").WebSocket; input: {up:boolean;down:boolean;left:boolean;right:boolean;attack:boolean} };
const conns = new Map<string, Conn>();

const wss = new WebSocketServer({ port: 8081 });
console.log("[server] listening ws://localhost:8081");

wss.on("connection", (ws) => {
  const id = uuid();
  const player = newPlayer(id, "Adventurer");
  world.players.set(id, player);

  const conn: Conn = { id, ws, input: { up:false, down:false, left:false, right:false, attack:false } };
  conns.set(id, conn);

  const welcome: ServerMsg = { type: "welcome", id, you: toPublicPlayer(player), lvlCap: LVL_CAP };
  ws.send(JSON.stringify(welcome));

  ws.on("message", (buf) => {
    let msg: ClientMsg;
    try { msg = JSON.parse(buf.toString()); } catch { return; }
    handleClientMessage(conn, msg);
  });

  ws.on("close", () => {
    const p = world.players.get(id);
    if (p) p.connected = false;
    conns.delete(id);
    world.players.delete(id);
  });
});

function handleClientMessage(conn: Conn, msg: ClientMsg) {
  const p = world.players.get(conn.id);
  if (!p) return;
  switch (msg.type) {
    case "hello":
      p.name = (msg.name && msg.name.slice(0,16)) || p.name;
      break;
    case "input":
      conn.input = { up: !!msg.up, down: !!msg.down, left: !!msg.left, right: !!msg.right, attack: !!msg.attack };
      break;
    case "ping":
      const pong: ServerMsg = { type: "pong", t: msg.t };
      conn.ws.send(JSON.stringify(pong));
      break;
  }
}

// ---- Game Loop ----
let last = Date.now();
setInterval(() => {
  const now = Date.now();
  const dt = Math.min(0.1, (now - last) / 1000); // seconds
  last = now;
  world.t = now;

  // Spawn control
  ensurePopulation(world);
  maybeSpawnBosses(world);

  // Move players
  for (const c of conns.values()) {
    const p = world.players.get(c.id);
    if (!p || p.hp <= 0) continue;
    const dirX = (c.input.right ? 1 : 0) + (c.input.left ? -1 : 0);
    const dirY = (c.input.down ? 1 : 0) + (c.input.up ? -1 : 0);
    const len = Math.hypot(dirX, dirY) || 1;
    const vx = (dirX / len) * p.spd * dt * 60; // tune to pixels/tick
    const vy = (dirY / len) * p.spd * dt * 60;
    p.pos.x += vx;
    p.pos.y += vy;
    if (dirX || dirY) p.dir = { x: dirX/len, y: dirY/len };

    clampToWorld(p.pos, world);

    // Player attack (targets nearest mob in a small arc)
    if (c.input.attack) {
      let best: Mob | undefined;
      let bestD2 = Infinity;
      for (const m of world.mobs.values()) {
        const d2 = (p.pos.x - m.pos.x)**2 + (p.pos.y - m.pos.y)**2;
        if (d2 < bestD2) { bestD2 = d2; best = m; }
      }
      if (best) {
        tryAttackPlayerAgainstMob(now, p, best);
      }
    }
  }

  // Mob AI + attack
  const hitFx: HitEvent[] = [];
  for (const m of world.mobs.values()) {
    if (m.hp <= 0) continue;
    stepMobAI(m, world, dt * 60);
    // attack nearest player if close
    let best: Player | undefined; let bestD2 = Infinity;
    for (const p of world.players.values()) {
      if (p.hp <= 0) continue;
      const d2 = (p.pos.x - m.pos.x)**2 + (p.pos.y - m.pos.y)**2;
      if (d2 < bestD2) { bestD2 = d2; best = p; }
    }
    if (best) {
      const { hit } = tryAttackMobAgainstPlayer(now, m, best);
      if (hit) hitFx.push({ id: `${m.id}:${now}`, x: best.pos.x, y: best.pos.y });
    }
  }

  // Deaths & XP
  for (const [id, m] of [...world.mobs.entries()]) {
    if (m.hp <= 0) {
      // Award XP to closest alive player (simple last-hitter approximation)
      let killer: Player | undefined; let bestD2 = Infinity;
      for (const p of world.players.values()) {
        const d2 = (p.pos.x - m.pos.x)**2 + (p.pos.y - m.pos.y)**2;
        if (d2 < bestD2) { bestD2 = d2; killer = p; }
      }
      if (killer) {
        const xp = awardXpAndMaybeLevelUp(killer, m.level, m.isBoss);
        const c = conns.get(killer.id);
        c?.ws.send(JSON.stringify({ type: "chat", text: `+${xp} XP (${m.kind} L${m.level})` }));
      }
      world.mobs.delete(id);
    }
  }

  // Broadcast
  const players = [...world.players.values()].map(toPublicPlayer);
  const mobs = [...world.mobs.values()].map(toPublicMob);
  const msg = JSON.stringify({ type: "state", t: now, players, mobs, hits: hitFx } as ServerMsg);
  for (const c of conns.values()) {
    if (c.ws.readyState === 1) c.ws.send(msg);
  }
}, MS_PER_TICK);
