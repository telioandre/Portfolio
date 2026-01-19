# Messagerie temps réel – Détails du projet

![Capture messagerie](../../assets/images/chat-app.png)

## Contexte
Application type **Teams/Discord** en **Node.js + React** avec **Socket.IO** et version mobile.

## Stack
- Backend: Node.js, Express, Socket.IO, MongoDB
- Frontend: React
- Mobile: React Native (ou Expo)

## Fonctionnalités
- Salons, messages en temps réel, statuts en ligne
- Authentification et profils
- Notifications

## Extrait de code (serveur)
```js
const io = require('socket.io')(3001, { cors: { origin: '*' }});
io.on('connection', socket => {
  socket.on('message', (room, msg) => {
    io.to(room).emit('message', { user: socket.id, msg, at: Date.now() });
  });
  socket.on('join', room => socket.join(room));
});
```

## Médias
- Vidéo (placeholder): https://example.com/demo-chat
