# Stockage type Google Drive – Détails du projet

![Capture stockage](assets/images/drive-like.png)

## Résumé
Application de stockage en ligne sécurisé type Google Drive, conçue pour permettre aux utilisateurs d'uploader, organiser, partager et gérer des fichiers et dossiers. Le backend expose une API REST avec chiffrement des données, gestion des permissions granulaires, et partages multi-utilisateurs (privés et publics par lien).

## Architecture globale

### Backend (API)
- **Framework** : Express.js + TypeScript
- **Base de données** : MongoDB avec Mongoose
- **Authentification** : JWT + OAuth (Google, Microsoft)
- **Stockage** : Système de fichiers local avec chiffrement AES-256-GCM
- **Services** : Nettoyage automatique, gestion des partages, compression ZIP

### Frontend (En développement)
- **Framework** : React Native (Expo Router)
- **Plateforme** : iOS/Web avec Expo

## Stack technique réelle
- **Backend** : Express 5.x, Mongoose 9.x, Multer 2.x, Passport (OAuth)
- **Chiffrement** : crypto (AES-256-GCM), SHA-256
- **Utilitaires** : Archiver (ZIP), Mime-types, Express-validator
- **Infrastructure** : Docker (Dockerfile + docker-compose)

---

## Fonctionnalités détaillées

### 1. Authentification & comptes utilisateur

Le système d'authentification offre deux approches : une authentification classique par email/mot de passe avec JWT, et une intégration OAuth pour Google et Microsoft. Chaque utilisateur dispose d'un profil stockant l'email, le provider, un avatar, et des préférences de thème.

**Modèle utilisateur (Mongoose)**
```ts
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    provider: { type: String, enum: ["local", "google", "microsoft"], default: "local" },
    providerId: { type: String, required: false },
    avatar: { type: String, required: false },
    usedSpace: { type: Number, default: 0 },
    theme: { type: String, enum: ["light", "dark"], default: "light" }
});
```

**Middleware d'authentification**
```ts
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "Accès refusé" });
    return;
  }
  const loggedUser = jwt.verify(token, process.env.JWT_SECRET);
  req.loggedUser = loggedUser;
  next();
};
```

**Fonctionnalités**
- **Inscription/connexion locale** : Génération JWT (expires après 7 jours configurables).
- **OAuth** : Connexion via Google/Microsoft sans mot de passe.
- **Quota utilisateur** : Suivi en temps réel de l'espace utilisé vs. limite disponible.

![Auth & comptes (placeholder)](assets/images/placeholder-auth-user.png)

---

### 2. Hiérarchie de fichiers & dossiers

La structure repose sur un modèle d'arborescence où chaque élément (fichier/dossier) est un "Node" relié à un parent, formant une hiérarchie naturelle.

**Modèle Node**
```ts
const NodeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Node", required: false, default: null },
    type: { type: String, enum: ["folder", "file"], required: true },
    name: { type: String, required: true },
    deleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, required: false },
    isSystemFolder: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// Index optimisés
NodeSchema.index({ userId: 1, parentId: 1 });
NodeSchema.index({ userId: 1, type: 1, deleted: 1, updatedAt: -1 });
NodeSchema.index({ userId: 1, name: "text", type: 1, deleted: 1 });
```

**Fonctionnalités**
- **Arborescence flexible** : Profondeur illimitée, navigation visuelle type explorateur.
- **Soft delete** : Marquage logique (`deleted: true`) avec restauration possible pendant X jours.
- **Dossiers système** : Racine, corbeille, dossiers partagés (marqués pour éviter suppression).
- **Recherche optimisée** : Index texte natif MongoDB pour recherche rapide par nom.

![Hiérarchie fichiers (placeholder)](assets/images/placeholder-file-hierarchy.png)

---

### 3. Upload de fichiers avec chiffrement

L'upload suit un processus sécurisé : réception temporaire → vérification → chiffrement AES-256-GCM → stockage permanent.

**Contrôleur d'upload**
```ts
export const uploadFile = async (req: Request, res: Response) => {
  const { parentId, name } = req.body;
  const userId = req.loggedUser?.userId;

  // Vérifier permissions parent
  const parent = await Node.findOne({ _id: parentId, userId, deleted: false });
  if (!parent) {
    res.status(404).json({ message: "Dossier parent introuvable" });
    return;
  }

  // Générer nom unique si conflit
  const uniqueFileName = await generateUniqueName(name || req.file.originalname, parentId, userId, "file");

  // Chiffrer et déplacer de /temp vers /uploads/files/{userId}
  const saved = await moveFileFromTemp(req.file.path, path.join("uploads", "files", userId), req.file.originalname);

  // Créer Node et métadonnées
  const node = await Node.create({
    userId, parentId: parentId || null, type: "file", name: uniqueFileName
  });

  await FileMetadata.create({
    nodeId: node._id,
    mimeType: req.file.mimetype,
    size: saved.size,
    physicalPath: saved.physicalPath,
    checksum: saved.checksum,
    encryption: { iv: saved.encryption.iv, authTag: saved.encryption.authTag, algorithm: 'aes-256-gcm' }
  });

  // Mettre à jour quota
  await User.findByIdAndUpdate(userId, { $inc: { usedSpace: saved.size } });

  res.status(201).json({ message: "Fichier uploadé", node, finalName: uniqueFileName });
};
```

**Chiffrement AES-256-GCM**
```ts
export const moveFileFromTemp = async (tempPath, destDir, originalName) => {
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const hash = crypto.createHash('sha256');
  const readStream = fs.createReadStream(tempPath);
  const writeStream = fs.createWriteStream(physicalPath);

  readStream.pipe(cipher).pipe(writeStream);

  const checksum = hash.digest('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return { physicalPath, size, checksum, encryption: { iv: iv.toString('hex'), authTag } };
};
```

**Points clés**
- Chiffrement avec clé dérivée + IV aléatoire unique par fichier.
- AuthTag GCM pour vérification d'intégrité.
- Limite : 30 GB par fichier (configurable).

![Upload chiffrement (placeholder)](assets/images/placeholder-upload-encryption.png)

---

### 4. Métadonnées & recherche

Le système expose des endpoints pour consulter et rechercher les fichiers. Les métadonnées (MIME-type, taille, dates) enrichissent chaque fichier.

**Routes métadonnées**
```ts
router.get("/:id/metadata", authMiddleware, fileIdValidator, getFileMetadata);
router.get("/", authMiddleware, getUserFiles);
router.get("/search", authMiddleware, searchFiles);
router.get("/recent", authMiddleware, getRecentFiles);
router.get("/storage", authMiddleware, getStorageInfo);
```

**Récupération des fichiers avec métadonnées**
```ts
export const getUserFiles = async (req: Request, res: Response) => {
  const { parentId } = req.query;
  const userId = req.loggedUser?.userId;
  const filter = { userId, type: "file", deleted: false };

  if (parentId) filter.parentId = parentId;

  const files = await Node.find(filter).sort({ createdAt: -1 });

  // Enrichir avec métadonnées
  const filesWithMetadata = await Promise.all(
    files.map(async (file) => {
      const metadata = await FileMetadata.findOne({ nodeId: file._id });
      return { ...file.toObject(), metadata };
    })
  );

  res.status(200).json({ files: filesWithMetadata });
};
```

**Fonctionnalités**
- **Récupération par dossier** : Filtrage par parentId, tri par date.
- **Recherche texte** : Index natif MongoDB, insensible à la casse.
- **Fichiers récents** : Endpoint dédié pour historique.
- **Info stockage** : Espace utilisé, limite, pourcentage quota.

![Métadonnées & recherche (placeholder)](assets/images/placeholder-metadata-search.png)

---

### 5. Déchiffrement & téléchargement

Le téléchargement utilise un streaming pour déchiffrer en temps réel sans charger de gros fichiers en mémoire.

**Déchiffrement streaming**
```ts
export const getDecryptedStream = (physicalPath, ivHex, authTagHex) => {
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  return fs.createReadStream(physicalPath).pipe(decipher);
};
```

**Contrôleur téléchargement**
```ts
export const downloadFile = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.loggedUser?.userId;

  const node = await Node.findOne({ _id: id, userId, deleted: false });
  if (!node) {
    res.status(404).json({ message: "Fichier introuvable" });
    return;
  }

  const metadata = await FileMetadata.findOne({ nodeId: id });
  const stream = getDecryptedStream(metadata.physicalPath, metadata.encryption.iv, metadata.encryption.authTag);

  res.setHeader('Content-Type', metadata.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${node.name}"`);
  res.setHeader('Content-Length', metadata.size);

  stream.pipe(res);
};
```

**Points clés**
- Déchiffrement par chunks (évite 30 GB en RAM).
- Vérification intégrité via authTag GCM.
- Prévisualisation possible pour images/PDF.

![Déchiffrement & téléchargement (placeholder)](assets/images/placeholder-download-decryption.png)

---

### 6. Partages privés (user-to-user)

Le partage privé suit un modèle d'invitation avec confirmation : création invitation → statut pending → acceptation/refus → accès.

**Modèle de partage**
```ts
const UserSharedNodeSchema = new mongoose.Schema({
    nodeId: { type: mongoose.Schema.Types.ObjectId, ref: "Node", required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sharedWithId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    permissions: { type: String, enum: ["read", "write"], required: true },
    status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
    message: { type: String, required: false }
}, { timestamps: true });
```

**Créer une invitation**
```ts
export const shareFolder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { targetUserId, permissions, message } = req.body;
  const userId = req.loggedUser?.userId;

  const folder = await Node.findOne({ _id: id, userId, type: "folder", deleted: false });
  if (!folder) {
    res.status(404).json({ message: "Dossier introuvable" });
    return;
  }

  const sharedNode = await UserSharedNode.create({
    nodeId: id,
    ownerId: userId,
    sharedWithId: targetUserId,
    permissions,
    status: "pending",
    message: message ?? null
  });

  res.status(201).json({ message: "Invitation envoyée", sharedNode });
};
```

**Permissions**
- **read** : Consultation/téléchargement seul.
- **write** : Lecture + ajout/modification/suppression de fichiers.

**Sécurité** : Chaque accès vérifie l'invitation existante avec statut `accepted`.

![Partages privés (placeholder)](assets/images/placeholder-private-sharing.png)

---

### 7. Partages publics (lien)

Les liens publics permettent de générer une URL shareable sans compte. Token cryptographique + options (password, expiration, limite téléchargements).

**Modèle de lien public**
```ts
const SharedLinkSchema = new mongoose.Schema({
    nodeId: { type: mongoose.Schema.Types.ObjectId, ref: "Node", required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: false },
    expiresAt: { type: Date, required: false },
    maxDownloads: { type: Number, required: false },
    downloadCount: { type: Number, default: 0 }
}, { timestamps: true });
```

**Créer un lien public**
```ts
export const createPublicLink = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { password, expiresAt, maxDownloads } = req.body;
  const userId = req.loggedUser?.userId;

  const node = await Node.findOne({ _id: id, userId, deleted: false });
  if (!node) {
    res.status(404).json({ message: "Nœud introuvable" });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const hashedPassword = password ? bcrypt.hashSync(password, 10) : null;

  const link = await SharedLink.create({
    nodeId: id,
    ownerId: userId,
    token,
    password: hashedPassword,
    expiresAt,
    maxDownloads
  });

  res.status(201).json({ 
    message: "Lien créé", 
    link, 
    publicUrl: `${process.env.BASE_URL}/public/${token}` 
  });
};
```

**Points clés**
- Token 64 caractères (cryptographiquement sécurisé).
- Vérification : password (bcrypt), expiration, limite téléchargements.
- Compteur incrémenté à chaque accès.

![Partages publics (placeholder)](assets/images/placeholder-public-sharing.png)

---

### 8. Corbeille & suppression

Mécanisme de suppression progressive : soft delete → corbeille (30 jours) → suppression physique.

**Soft delete**
```ts
export const deleteFileNode = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.loggedUser?.userId;

  const node = await Node.findOne({ _id: id, userId, deleted: false });
  if (!node) {
    res.status(404).json({ message: "Nœud introuvable" });
    return;
  }

  // Soft delete
  await Node.findByIdAndUpdate(id, { deleted: true, deletedAt: new Date() });

  res.status(200).json({ message: "Fichier supprimé (disponible en corbeille)" });
};
```

**Restauration**
```ts
export const restoreFromTrash = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.loggedUser?.userId;

  await Node.findOneAndUpdate(
    { _id: id, userId, deleted: true },
    { deleted: false, deletedAt: null }
  );

  res.status(200).json({ message: "Fichier restauré" });
};
```

**Points clés**
- Marquage `deleted: true` + `deletedAt`.
- Restauration possible pendant 30 jours.
- Suppression physique automatique (job cron).

![Corbeille (placeholder)](assets/images/placeholder-trash.png)

---

### 9. Nettoyage automatique (Cleanup)

Services automatiques : nettoyage au démarrage + nettoyage périodique (toutes les 60 min).

**Service de nettoyage**
```ts
export const startPeriodicCleanup = (intervalMinutes: number = 60): NodeJS.Timeout => {
  console.log(`🕒 Nettoyage périodique temp (${intervalMinutes} min)`);

  return setInterval(async () => {
    await cleanupOldTempFiles(60 * 60 * 1000); // Fichiers > 1h
    await cleanupTrashedFiles(30 * 24 * 60 * 60 * 1000); // Corbeille > 30 jours
  }, intervalMinutes * 60 * 1000);
};

export const cleanupTempOnStartup = async (): Promise<CleanupResult> => {
  const tempDir = path.join(process.cwd(), 'temp');
  await removeDirectoryRecursive(tempDir);
  return { deletedFiles, deletedSize, errors };
};
```

**Points clés**
- Nettoyage démarrage : purge `/temp/` (fichiers orphelins après crash).
- Nettoyage périodique : fichiers temp > 1h, corbeille > 30 jours.
- Logging : nombre fichiers supprimés, espace libéré, erreurs.

![Nettoyage (placeholder)](assets/images/placeholder-cleanup.png)

---

### 10. Validation & sécurité

Sécurité multi-couches : authentification JWT, validation entrées (express-validator), vérification permissions, soft delete.

**Validation express-validator**
```ts
const uploadValidators = [
  body('parentId').optional().isMongoId(),
  body('name').optional().isString().trim().isLength({ max: 255 })
];

const handleValidationErrors: express.RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
```

**Middleware permissions**
```ts
export const checkSharedWritePermission = async (req: Request, res: Response, next) => {
  const sharedNode = await UserSharedNode.findOne({
    nodeId: req.body.newParentId,
    sharedWithId: req.loggedUser.userId,
    permissions: "write",
    status: "accepted"
  });

  if (!sharedNode) {
    res.status(403).json({ message: "Permission insuffisante" });
    return;
  }

  next();
};
```

**Points clés**
- JWT : expire après 7 jours, vérification cryptographique.
- Validation stricte : ObjectIds, noms (255 char max), permissions énumérées.
- Rate limiting, HTTPS, CORS, secrets en env.

![Sécurité & validation (placeholder)](assets/images/placeholder-security-validation.png)

---

### 11. Gestion des noms uniques

Détection automatique de collisions de noms et génération de noms uniques au format `filename (N).ext`.

**Service de génération de nom unique**
```ts
export const generateUniqueName = async (
  originalName: string,
  parentId: string | null,
  userId: string,
  type: "file" | "folder"
): Promise<string> => {
  const existing = await Node.findOne({
    name: originalName,
    parentId,
    userId,
    type,
    deleted: false
  });

  if (!existing) return originalName;

  // Générer nom unique : "filename (1).ext"
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);

  let counter = 1;
  let newName = `${baseName} (${counter})${ext}`;

  while (await Node.exists({ name: newName, parentId, userId, type, deleted: false })) {
    counter++;
    newName = `${baseName} (${counter})${ext}`;
  }

  return newName;
};
```

**Exemples**
- `rapport.pdf` → `rapport (1).pdf` → `rapport (2).pdf`
- `archive.tar.gz` → `archive (1).tar.gz`

![Nommage unique (placeholder)](assets/images/placeholder-unique-naming.png)

---

### 12. Opérations en masse

Support des opérations groupées : téléchargement ZIP, suppression masse, déplacement masse.

**Archivage ZIP streaming**
```ts
export const downloadPublicFile = async (req: Request, res: Response) => {
  const { token } = req.params;

  const link = await SharedLink.findOne({ token });
  if (!link) {
    res.status(404).json({ message: "Lien introuvable" });
    return;
  }

  const node = await Node.findById(link.nodeId);

  if (node.type === "folder") {
    const archive = archiver('zip', { zlib: { level: 9 } });

    const items = await Node.find({ parentId: node._id, deleted: false });
    for (const item of items) {
      const metadata = await FileMetadata.findOne({ nodeId: item._id });
      const stream = getDecryptedStream(metadata.physicalPath, metadata.encryption.iv, metadata.encryption.authTag);
      archive.append(stream, { name: item.name });
    }

    res.attachment(`${node.name}.zip`);
    archive.pipe(res);
    archive.finalize();
  } else {
    // Fichier unique
    const metadata = await FileMetadata.findOne({ nodeId: node._id });
    const stream = getDecryptedStream(metadata.physicalPath, metadata.encryption.iv, metadata.encryption.authTag);
    res.attachment(node.name);
    stream.pipe(res);
  }
};
```

**Points clés**
- ZIP à la volée (streaming, pas de fichier temporaire).
- Déchiffrement en temps réel de chaque fichier.
- Structure arborescente préservée.

---

## Points clés d'implémentation

**Chiffrement bout-à-bout**
- AES-256-GCM avec IV aléatoire et clé dérivée.
- AuthTag pour intégrité.

**Gestion d'espace**
- Suivi du `usedSpace` par utilisateur.
- Quota configurable.

**Hiérarchie flexible**
- Arborescence native (parentId).
- Dossiers système.
- Soft delete avec expiration.

**Partages granulaires**
- Privé (user-to-user) avec permissions (read/write).
- Public (token) avec optionnel : password, expiration, limite de téléchargements.

**Performance**
- Index MongoDB optimisés.
- Recherche texte native.
- Streaming pour déchiffrement.
- Nettoyage automatique des fichiers orphelins.
