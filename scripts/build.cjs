const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const s = path.join(src, item);
    const d = path.join(dest, item);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

console.log('🚀 [Build] 1. Création du dossier dist...');
if (!fs.existsSync('dist/assets')) fs.mkdirSync('dist/assets', { recursive: true });

console.log('🚀 [Build] 2. Génération et copie des fichiers audio & PWA...');
execSync('node scripts/generate_audio.js', { stdio: 'inherit' });
copyDir('public', 'dist');

console.log('🚀 [Build] 3. Compilation TypeScript / React avec esbuild...');
execSync('npx esbuild src/main.tsx --bundle --outfile=dist/assets/index.js --loader:.tsx=tsx --loader:.ts=ts --jsx=automatic --minify', { stdio: 'inherit' });

console.log('🚀 [Build] 4. Préparation de dist/index.html (compatible racine & sous-dossiers WordPress)...');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('/src/main.tsx', './assets/index.js');
html = html.replace('src="/assets/index.js"', 'src="./assets/index.js"');
html = html.replace('href="/manifest.json"', 'href="./manifest.json"');
html = html.replace('href="/vite.svg"', 'href="./vite.svg"');
fs.writeFileSync('dist/index.html', html, 'utf8');

console.log('📦 [Build] 5. Création de l\'archive ZIP pour le Gestionnaire de Fichiers WordPress (mwana-lari-wp.zip)...');
try {
  execSync('powershell -Command "Compress-Archive -Path dist/* -DestinationPath mwana-lari-wp.zip -Force"', { stdio: 'ignore' });
  console.log('✅ [Build] mwana-lari-wp.zip généré avec succès à la racine du projet !');
} catch (e) {
  console.warn('Note: ZIP generation skipped or handled externally');
}

console.log('✅ [Build] Build terminé avec succès dans dist/ (100% autonome et compatible WordPress / Netlify / Vercel) !');
