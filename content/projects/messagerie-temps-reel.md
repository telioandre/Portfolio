# Messagerie temps réel – Détails du projet

![Capture messagerie](../../assets/images/chat-app.png)

## Résumé
Application de messagerie **temps réel** type Teams/Discord, conçue pour le travail collaboratif en entreprise : espaces de travail, salons, conversations privées, notifications et modération. Le projet est découpé en **3 modules** (backend, web, mobile) avec une architecture orientée API REST + Socket.IO.

## Architecture & modules
### Back-End (API)
- API REST Express + Socket.IO.
- MongoDB (Mongoose) avec modèles riches (users, workspaces, roles, messages, etc.).
- Authentification JWT + OAuth (Google, GitHub, Facebook).
- Uploads (avatars, logos, fichiers de message) et stockage local.

### Front-End (Web)
- Application Vue 3 + Vite + TypeScript.
- Pinia pour l’état global, Vue Router pour la navigation.
- UI riche (modals, menus contextuels, emojis, GIFs, embeds, etc.).

### Mobile (Android)
- Vue 3 + Capacitor.
- Cible Android avec build dédié et synchronisation Capacitor.
- Reprise des mêmes entités, stores et parcours que la version web.

## Stack technique réelle
- **Backend** : Node.js, Express, Socket.IO, MongoDB/Mongoose, JWT, Passport OAuth, Zod (validation), Multer (upload), Nodemailer (email/OTP).
- **Web** : Vue 3, TypeScript, Vite, Pinia, Vue Router, Bootstrap, Socket.IO client, Markdown-it.
- **Mobile** : Vue 3, TypeScript, Vite, Capacitor (Android), Socket.IO client.

## Fonctionnalités détaillées
### Authentification & comptes
- Inscription, connexion, déconnexion.
- JWT côté API + cookies sécurisés.
- Connexion via Google, GitHub et Facebook.
- Liaison/déliaison de comptes OAuth.
- Vérification de token et contrôle de session.
- Réinitialisation et changement de mot de passe.
- OTP email (envoi, vérification, état de vérification).

**Extrait de code (routes auth + login)**
```ts
router.post('/login', body(loginSchema), loginUser);
router.post('/verify-token', body(tokenVerificationSchema), verifyToken);

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport.authenticate("google", { session: false }), (req, res) => {
	const { token } = req.user as any;
	res.redirect(`${process.env.FRONT_URL}/login?token=${token}`);
});
```

![Auth flow (placeholder)](../../assets/images/placeholder-auth-flow.png)

### Profils & préférences utilisateur
- Profil enrichi (nom, avatar, poste, localisation, horaires).
- Statuts de présence : online / away / busy / offline.
- Préférences notifications (email, son, volume).
- Blocage de notifications par salon ou conversation.

**Extrait de code (modèle utilisateur)**
```ts
status: { type: String, enum: ['online','offline','away','busy'], default: 'offline' },
preferredStatus: { type: String, enum: ['online','offline','away','busy'], default: 'online' },
notification: { type: Boolean, default: true },
notificationSound: { type: Boolean, default: true },
notificationVolume: { type: Number, default: 50, min: 0, max: 100 },
channelNotificationBlock: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Channel' }],
conversationNotificationBlock: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' }]
```

![Profil utilisateur (placeholder)](../../assets/images/placeholder-profile.png)

### Organisations, espaces & accès
- **Sociétés** : création, vérification, branding (logo/couleur), membres, whitelist.
- **Workspaces** : création, modification, suppression, description, tags, logo.
- Gestion des membres (liste, ajout, retrait, départ volontaire).
- Channels rattachés à un workspace, canal d’accueil.

**Extrait de code (workspaces + sociétés)**
```ts
router.post('/society', authMiddleware, uploadFile(...).single('logo'), createSociety);
router.post('/workspace', authMiddleware, uploadFile(...).single('logo'), createWorkspace);
router.get('/workspace/:id/members', authMiddleware, getMembersDetails);
```

![Organisation & workspace (placeholder)](../../assets/images/placeholder-organization.png)

### Rôles & permissions (RBAC)
- Rôles hiérarchisés (rang, couleur, admin workspace).
- Droits fins : visibilité salons, écriture, ajout de salons, kick/ban.
- Contrôle d’accès par middleware et vérification de rang.

**Extrait de code (middleware RBAC)**
```ts
const userRoles = await Role.find({ workspaceId, users: userId });
const isWorkspaceAdmin = userRoles.some((r) => r.workspaceAdmin);
const canKick = userRoles.some((r) => r.canKick);
if (!isWorkspaceAdmin && !canKick) {
	res.status(403).json({ message: "Accès refusé" });
	return;
}
```

![Rôles & permissions (placeholder)](../../assets/images/placeholder-roles.png)

### Salons & conversations
- Salons publics/privés/protégés.
- Conversations privées (1–1 ou groupe).
- Épinglage de messages côté salon et conversation.
- Recherche de messages par contexte.

**Extrait de code (routes salons & conversations)**
```ts
router.get('/channel/:id/messages', authMiddleware, getChannelMessages);
router.get('/conversation/:id/messages', authMiddleware, getConversationMessages);
router.get('/channel/:id/pinnedMessages', authMiddleware, getChannelPinnedMessages);
router.get('/conversation/:id/pinnedMessages', authMiddleware, getConversationPinnedMessages);
```

![Salons & conversations (placeholder)](../../assets/images/placeholder-channels.png)

### Messages & contenus
- Message temps réel (Socket.IO) avec création/édition/suppression.
- Réactions emoji sur messages.
- Sondages intégrés (options + votes + expiration).
- Commande **/programmer** pour envoi différé (planification cron).
- Support **@mentions** et **#mentions** de salon.
- Upload de fichiers (jusqu’à 10 par message, avec prévisualisation web).
- Rendu Markdown avec liens et HTML autorisé.

**Extrait de code (création message + planification)**
```ts
const programmer = parseScheduleCommand(content);
if (programmer) {
	const cronExpr = `${utcMinute} ${utcHour} * * *`;
	cron.schedule(cronExpr, async () => {
		const programmatedMessage = await Message.create({ content: programmer.text, channel, conversationId, sender });
		await sendMessageToUsersFromChannel('createdMessage', channel, programmatedMessage, true);
	});
	return res.status(200).json({ messageApi: `Message programmé pour ${programmer.time}` });
}
```

**Extrait de code (upload pièces jointes)**
```ts
const uploadMessageFiles = upload.array('fileAttachments', 10);
const fileAttachment = await FileAttachmentModel.create({ fileName, fileType, fileSize, fileUrl });
req.body.fileAttachmentIds = fileAttachments;
```

![Messages & contenus (placeholder)](../../assets/images/placeholder-messages.png)

### Temps réel & présence
- Sessions Socket par utilisateur.
- Indicateur “en train d’écrire”.
- Statuts auto (away/offline) selon l’inactivité.

**Extrait de code (socket + typing)**
```ts
socketServer.on('connection', async (socket) => {
	socket.on('typing', async (data) => {
		socketServer.to(session.socketId).emit('typing', { channelId, user });
	});
	socket.on('setStatus', async (status: string) => setUserPreferredStatus(status));
});
```

![Temps réel & présence (placeholder)](../../assets/images/placeholder-realtime.png)

### Notifications
- Notifications persistées (création, lecture, mise à jour).
- Son, volume, et blocage ciblé par salon/conversation.

**Extrait de code (routes notifications)**
```ts
router.get("/", authMiddleware, getNotifications);
router.get("/:id", authMiddleware, getNotification);
router.post("/", authMiddleware, readNotification);
router.put("/:id", authMiddleware, updateNotification);
```

![Notifications (placeholder)](../../assets/images/placeholder-notifications.png)

### Modération & sécurité
- Ban/kick/unban au niveau workspace.
- Liste des bannis.
- Validation stricte des payloads (schemas Zod).
- Contrôle d’accès par rôles + protections sur uploads.

**Extrait de code (ban/kick)**
```ts
router.put('/:id/kick', authMiddleware, roleWorkspaceMiddleware, canKickMiddleware, kickFromWorkspace);
router.put('/:id/ban', authMiddleware, roleWorkspaceMiddleware, canBanMiddleware, banFromWorkspace);
router.put('/:id/unban', authMiddleware, roleWorkspaceMiddleware, canBanMiddleware, unBanFromWorkspace);
```

![Modération & sécurité (placeholder)](../../assets/images/placeholder-moderation.png)

### Intégrations & enrichissements
- Embeds GitHub (repo, issue, PR, org, profil).
- Embeds Google Docs/Sheets/Slides/Forms.
- Commande **/météo** (retour enrichi côté UI).

**Extrait de code (embeds)**
```ts
repo.value = await githubStore.getRepo(props.data.owner, props.data.repo);
issue.value = await githubStore.getIssue(props.data.owner, props.data.repo, props.data.number);
const t = await fetchGoogleDocTitle(props.data.url);
```

![Intégrations (placeholder)](../../assets/images/placeholder-integrations.png)

## Médias
- Vidéo (placeholder): https://example.com/demo-chat
