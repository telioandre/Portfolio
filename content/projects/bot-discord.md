# Bot Discord – Détails du projet

![Bot Discord](../../assets/images/discord-bot.png)

## Contexte
Bot **Discord.js** avec commandes de modération, utilitaires et divertissement.

## Extrait de code
```js
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
client.on('messageCreate', msg => {
  if(msg.content === '!ping') msg.reply('Pong!');
});
client.login(process.env.BOT_TOKEN);
```

## Médias
- Vidéo (placeholder): https://example.com/demo-discord
