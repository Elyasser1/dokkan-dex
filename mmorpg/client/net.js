export class Net {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.ws.addEventListener("message", (e) => this.onMessage?.(JSON.parse(e.data)));
    this.ws.addEventListener("open", () => {
      this.send({ type: "hello", name: `Joueur${Math.floor(Math.random()*1000)}` });
    });
  }
  send(obj) { if (this.ws.readyState === 1) this.ws.send(JSON.stringify(obj)); }
}
