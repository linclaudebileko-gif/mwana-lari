const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

function copyDir(src, dest, ignoreDirs = []) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    if (ignoreDirs.includes(item)) continue;
    const s = path.join(src, item);
    const d = path.join(dest, item);
    if (fs.statSync(s).isDirectory()) copyDir(s, d, ignoreDirs);
    else fs.copyFileSync(s, d);
  }
}

console.log('🚀 [Build] 1. Nettoyage et initialisation des dossiers...');
removeDir('public/assets');
removeDir('assets');
removeDir('dist');
fs.mkdirSync('dist/assets', { recursive: true });

console.log('🚀 [Build] 2. Génération et copie des fichiers audio & PWA...');
execSync('node scripts/generate_audio.js', { stdio: 'inherit' });
copyDir('public', 'dist', ['assets']);

console.log('🚀 [Build] 3. Compilation TypeScript / React avec esbuild...');
execSync('npx esbuild src/main.tsx --bundle --outfile=dist/assets/index.js --loader:.tsx=tsx --loader:.ts=ts --jsx=automatic --minify', { stdio: 'inherit' });

// Synchroniser dist/assets/index.js vers assets/ et public/assets/
if (!fs.existsSync('assets')) fs.mkdirSync('assets', { recursive: true });
if (!fs.existsSync('public/assets')) fs.mkdirSync('public/assets', { recursive: true });
fs.copyFileSync('dist/assets/index.js', 'assets/index.js');
fs.copyFileSync('dist/assets/index.js', 'public/assets/index.js');
if (fs.existsSync('dist/assets/index.css')) {
  fs.copyFileSync('dist/assets/index.css', 'assets/index.css');
  fs.copyFileSync('dist/assets/index.css', 'public/assets/index.css');
}

console.log('🚀 [Build] 4. Préparation de dist/index.html (compatible racine & sous-dossiers WordPress)...');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('/src/main.tsx', './assets/index.js?v=3.0');
html = html.replace(/src=["'][^"']*assets\/index\.js[^"']*["']/g, 'src="./assets/index.js?v=3.0"');
html = html.replace(/href=["'][^"']*manifest\.json["']/g, 'href="./manifest.json"');
html = html.replace(/href=["'][^"']*vite\.svg["']/g, 'href="./vite.svg"');
fs.writeFileSync('dist/index.html', html, 'utf8');

console.log('🚀 [Build] 5. Synchronisation du dossier mwana-lari-wp/...');
removeDir('mwana-lari-wp');
copyDir('dist', 'mwana-lari-wp');

console.log('📦 [Build] 6. Création de l\'archive ZIP pour le Gestionnaire de Fichiers WordPress (mwana-lari-wp.zip)...');
try {
  if (fs.existsSync('mwana-lari-wp.zip')) fs.unlinkSync('mwana-lari-wp.zip');
  execSync('powershell -Command "Compress-Archive -Path dist/* -DestinationPath mwana-lari-wp.zip -Force"', { stdio: 'ignore' });
  console.log('✅ [Build] mwana-lari-wp.zip généré avec succès à la racine du projet !');
} catch (e) {
  console.warn('Note: ZIP generation skipped or handled externally');
}

console.log('✅ [Build] Build terminé avec succès dans dist/ et mwana-lari-wp/ (100% autonome et compatible WordPress / Netlify / Vercel) !');
