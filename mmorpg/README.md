# MMORPG Prototype (Server-authoritative)

## Stack
- Server: Node.js + TypeScript + ws (WebSocket)
- Client: HTML5 Canvas + vanilla JS (aucun bundler)

## Lancer
Terminal 1:
```bash
cd server
npm install
npm run dev
```

Terminal 2 (serveur de fichiers simple):

```bash
cd ../client
# Python (au choix) :
python3 -m http.server 8080
# Ouvrir http://localhost:8080
```

Par défaut le serveur écoute sur ws://localhost:8081.

