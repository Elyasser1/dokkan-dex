export type Vec2 = { x: number; y: number };

export type ClientMsg =
  | { type: "hello"; name?: string }
  | { type: "input"; up: boolean; down: boolean; left: boolean; right: boolean; attack: boolean }
  | { type: "ping"; t: number };

export type ServerMsg =
  | { type: "welcome"; id: string; you: PublicPlayer; lvlCap: number }
  | { type: "state"; t: number; players: PublicPlayer[]; mobs: PublicMob[]; hits: HitEvent[] }
  | { type: "chat"; text: string }
  | { type: "pong"; t: number }
  | { type: "drop"; text: string };

export type Player = {
  id: string;
  name: string;
  pos: Vec2;
  vel: Vec2;
  dir: Vec2;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  level: number;
  xp: number;
  nextAttackAt: number;
  connected: boolean;
};

export type PublicPlayer = {
  id: string;
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  level: number;
};

export type Mob = {
  id: string;
  kind: string;
  pos: Vec2;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  level: number;
  isBoss: boolean;
  targetPlayerId?: string;
  nextAttackAt: number;
};

export type PublicMob = {
  id: string;
  kind: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  level: number;
  isBoss: boolean;
};

export type HitEvent = {
  id: string; // unique for short-lived effect client-side
  x: number; y: number;
};

export type Rect = { x: number; y: number; w: number; h: number };

export type World = {
  size: Rect; // simple open map
  players: Map<string, Player>;
  mobs: Map<string, Mob>;
  t: number;
};
