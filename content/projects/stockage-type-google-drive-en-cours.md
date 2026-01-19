# Stockage type Google Drive (en cours) – Détails du projet

![Capture stockage](../../assets/images/drive-like.png)

## Contexte
Application **React + Node.js** pour uploader, organiser et partager des fichiers.

## Fonctionnalités
- Upload drag-and-drop
- Dossiers, droits d’accès, partages
- Aperçus de fichiers

## Extrait de code (upload React)
```jsx
function Uploader(){
  const [files, setFiles] = useState([]);
  const onDrop = e => {
    const list = Array.from(e.target.files || e.dataTransfer.files);
    setFiles(list);
  };
  const upload = async () => {
    const fd = new FormData();
    files.forEach(f => fd.append('files', f));
    await fetch('/api/upload', { method:'POST', body: fd });
  };
  return (
    <div>
      <input type="file" multiple onChange={onDrop} />
      <button onClick={upload}>Uploader</button>
    </div>
  );
}
```

## Médias
- Vidéo (placeholder): https://example.com/demo-drive
