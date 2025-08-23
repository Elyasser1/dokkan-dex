import { Net } from "./net.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const hud = {
  name: document.getElementById("name"),
  level: document.getElementById("level"),
  hp: document.getElementById("hp"),
  maxhp: document.getElementById("maxhp"),
  ping: document.getElementById("ping")
};

const net = new Net("ws://localhost:8081");
let youId = null;
let state = { players: [], mobs: [], t: 0, hits: [] };
let lastPing = performance.now();

net.onMessage = (msg) => {
  if (msg.type === "welcome") {
    youId = msg.id;
    hud.name.textContent = msg.you.name;
    hud.level.textContent = msg.you.level;
    hud.hp.textContent = msg.you.hp;
    hud.maxhp.textContent = msg.you.maxHp;
  } else if (msg.type === "state") {
    state = msg;
    const you = state.players.find(p => p.id === youId);
    if (you) {
      hud.level.textContent = you.level;
      hud.hp.textContent = you.hp;
      hud.maxhp.textContent = you.maxHp;
    }
  } else if (msg.type === "pong") {
    const rtt = Math.round(performance.now() - msg.t);
    hud.ping.textContent = rtt;
  } else if (msg.type === "chat") {
    // simple toast
    console.log(msg.text);
  }
};

// Input
const keys = new Set();
window.addEventListener("keydown", (e) => {
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();
  keys.add(e.key.toLowerCase());
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

function pressed(...alts) {
  return alts.some(k => keys.has(k));
}

function sendInput() {
  const msg = {
    type: "input",
    up: pressed("w","z","arrowup"),
    down: pressed("s","arrowdown"),
    left: pressed("a","q","arrowleft"),
    right: pressed("d","arrowright"),
    attack: pressed(" ")
  };
  net.send(msg);
}
setInterval(() => {
  sendInput();
  net.send({ type: "ping", t: performance.now() });
}, 100);

// Camera follows you
const cam = { x: 0, y: 0 };
function worldToScreen(x, y) {
  return { x: Math.round(x - cam.x + canvas.width/2), y: Math.round(y - cam.y + canvas.height/2) };
}

// Render
function draw() {
  // clear
  ctx.fillStyle = "#0b0b0b";
  ctx.fillRect(0,0,canvas.width, canvas.height);

  const you = state.players.find(p => p.id === youId);
  if (you) {
    cam.x = you.x;
    cam.y = you.y;
  }

  // grid
  ctx.globalAlpha = .2;
  ctx.strokeStyle = "#2a2a2a";
  for (let x=-1000; x<1000; x+=50) {
    const a = worldToScreen(x+cam.x - (cam.x%50), 0).x;
    ctx.beginPath(); ctx.moveTo(a, 0); ctx.lineTo(a, canvas.height); ctx.stroke();
  }
  for (let y=-1000; y<1000; y+=50) {
    const b = worldToScreen(0, y+cam.y - (cam.y%50)).y;
    ctx.beginPath(); ctx.moveTo(0, b); ctx.lineTo(canvas.width, b); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // mobs
  for (const m of state.mobs) {
    const {x,y} = worldToScreen(m.x, m.y);
    ctx.beginPath();
    ctx.fillStyle = m.isBoss ? "#7d2" : "#3da";
    ctx.arc(x, y, m.isBoss ? 16 : 10, 0, Math.PI*2);
    ctx.fill();

    // hp bar
    const ratio = Math.max(0, m.hp / m.maxHp);
    ctx.fillStyle = "#222"; ctx.fillRect(x-16, y-20, 32, 4);
    ctx.fillStyle = "#d33"; ctx.fillRect(x-16, y-20, 32*ratio, 4);

    ctx.fillStyle = "#ccc";
    ctx.font = "11px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(`${m.kind} L${m.level}`, x, y-28);
  }

  // players
  for (const p of state.players) {
    const {x,y} = worldToScreen(p.x, p.y);
    ctx.beginPath();
    ctx.fillStyle = p.id === youId ? "#58f" : "#aaa";
    ctx.arc(x, y, 10, 0, Math.PI*2);
    ctx.fill();
    // hp
    const r = Math.max(0, p.hp / p.maxHp);
    ctx.fillStyle = "#222"; ctx.fillRect(x-14, y-18, 28, 4);
    ctx.fillStyle = "#4c4"; ctx.fillRect(x-14, y-18, 28*r, 4);
    // name
    ctx.fillStyle = "#ddd";
    ctx.font = "12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(`${p.id===youId?"You":p.name} (L${p.level})`, x, y-28);
  }

  // hit FX
  ctx.fillStyle = "#fff";
  for (const h of state.hits) {
    const s = worldToScreen(h.x, h.y);
    ctx.globalAlpha = .4;
    ctx.beginPath(); ctx.arc(s.x, s.y, 20, 0, Math.PI*2); ctx.strokeStyle = "#fff"; ctx.stroke();
    ctx.globalAlpha = 1;
  }

  requestAnimationFrame(draw);
}
draw();
