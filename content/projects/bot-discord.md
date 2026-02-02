# Bot Discord – RevoLord (gacha, profils et mini-jeux)

## Contexte
Bot perso **Discord.js v14** orienté communauté : gacha d'emotes, profils utilisateurs, mini-jeux, classements et maintenance automatique des fils. Déploiement sur Render, fallback DB (SQLite → MongoDB). Architecture modulaire : commandes slash, handlers d'interactions/boutons, features planifiées (anniversaires, nettoyage de threads), mini-jeux (Wordle Pokémon, quiz citation, guess number).

## Fonctionnalités principales

### Gacha d'emotes (avec cooldown)
- Tirages quotidiens `/tirage` (reset midi/minuit) avec raretés, craft et échange d'emotes.
- Cooldown visible via timestamp relatif `<t:...:R>`, correction auto des cooldowns invalides, mises à jour d'emotes serveur en arrière-plan.
- Embeds paginés quand la collection dépasse 1024 caractères/champ, leaderboards dédiés.
![Tirage du bot](assets/images/bot_tirage.png)

### Profils & stats utilisateur
- Commande `/user` : collecte messages/réactions récents, canaux favoris, activité (scores + ratios), estimation de total via échantillonnage.
- Buttons d'interaction (rafraîchir/détails), upsert des stats en base avec fallback si l'écriture échoue.
- Gestion des timeouts guild et interactions expirées pour éviter les échecs silencieux.
![Profil utilisateur](assets/images/bot_user.png)

### Classements & compétitif
- Elo, win rate, pulls/emotes, ranks ; commandes admin (`setElo`, `givePulls`, `resetTirage`).
- Embeds paginés pour gros volumes, validations côté commande pour éviter le spam.
![Classement](assets/images/bot_classement.png)

### Mini-jeux
- Pokemon Wordle (cache initialisé au boot), guess number, quiz citation, boutons de défis.
- Gestion des réactions/messages pour la boucle de jeu, sécurisée contre les timeouts Discord.
![Jeu du Wordle Pokemon](assets/images/bot_wordle.png)

### Maintenance & santé
- Anniversaires (notifications planifiées), nettoyage de threads inactifs.
- HTTP healthcheck `/health` pour Render, retry de port en dev (gestion EADDRINUSE), logs shard disconnect.
![Logs de démarrage](assets/images/bot_logs.png)

## Architecture & stack
- **Entrypoint** : `main.js` lance le client, bind HTTP (port dynamique, retries en dev), init cache Pokémon, connectBot.
- **Core bot** : `src/bot.js` crée le client avec intents (guilds, messages, reactions, members), init DB (SQLite ou MongoDB), démarre anniversaires + cleanup.
- **Handlers** : messages (jeux), reactions, interactions slash, boutons (gacha, profil, défis).
- **Données** : `utils/db.js` (gacha, craft, cooldowns), `utils/mongodb.js` (driver officiel), constantes/rarités dans `utils/constants.js`.
- **Commands** : gacha (`emoteGacha`, `exchangeEmotes`, `emoteLeaderboard`), profils (`userProfile`), admin (`adminSay`, `givePulls`, `resetTirage`), compétitif (`leaderboard`, `winRateLeaderboard`, `setElo`, `ranks`).

## Problématiques & solutions
- **Ports Render/EADDRINUSE** : retry de port en dev, port fixe en prod, healthcheck `/health`.
- **Timeouts API Discord** : `deferReply`, gestion interaction expirée, messages éphémères.
- **Limiter le spam** : cooldown tirages, reset à midi/minuit, vérifs anti-double guild emotes.
- **Robustesse** : fallback cache DB, try/catch systématiques, logs par catégorie, handlers shard disconnect.
- **UX** : embeds paginés pour listes d'emotes, boutons d'action sur profils, timestamps relatifs pour cooldowns.

## Extraits de code

### Entrée bot + serveur healthcheck
```js
const client = createBot();
const eventHandlers = { messageReactionAdd: handleReactionAdd, messageCreate: handleGameMessage, interactionCreate: handleSlashCommands };
const portEnv = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
_httpServer = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/ping') return res.end('OK');
  res.end('RevoLord is running');
});
await tryListen(portEnv, 10); // retries en dev si EADDRINUSE
await connectBot(client, eventHandlers);
initializePokemonCache();
```

### Fallback DB + features planifiées
```js
client.on('clientReady', handleReadyEvent);
async function handleReadyEvent() {
  const preferMongoDB = process.env.NODE_ENV === 'production' && process.env.MONGODB_URI;
  await initDB({ preferMongoDB, tryMongoDB: preferMongoDB });
  startAnniversarySystem(client);
  startThreadCleanupSystem(client);
}
```

### Gacha d'emotes (cooldown + embed résultat)
```js
if (!(await canPlayerPull(userId, guildId))) {
  const nextPullTime = await getNextPullTime(userId, guildId);
  return interaction.reply({
    embeds: [new EmbedBuilder()
      .setTitle('⏰ Tirage en Cooldown')
      .addFields({ name: 'Temps restant', value: `<t:${Math.floor(nextPullTime/1000)}:R>` })
      .setFooter({ text: 'Reset à midi et minuit' })], ephemeral: true });
}
const pullResult = await performEmotePull(userId, guildId, interaction.guild);
const embed = await createPullResultEmbed(interaction.user, pullResult.results);
await interaction.editReply({ embeds: [embed] });
```

### Profil utilisateur (stats rapides + boutons)
```js
const stats = await collectUserStats(member, interaction.guild); // messages, réactions, canaux favoris, activité
await upsertUser(member.id, { lastCollected: Date.now(), stats });
const buttons = createInteractionButtons(member.id);
await interaction.editReply({ embeds: [createUserProfileEmbed(member, stats)], components: [buttons] });
```
