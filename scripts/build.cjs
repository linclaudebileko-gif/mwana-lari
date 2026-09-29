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
    if (fs.statSync(s).isDirectory()) {
      copyDir(s, d, ignoreDirs);
    } else {
      const ext = path.extname(item).toLowerCase();
      // If .wav and a matching .mp3 exists in the same folder, skip redundant heavy wav in production bundle
      if (ext === '.wav' && fs.existsSync(s.replace(/\.wav$/i, '.mp3'))) {
        continue;
      }
      fs.copyFileSync(s, d);
    }
  }
}

console.log('🚀 [Build] 1. Nettoyage et initialisation des dossiers...');
removeDir('public/assets');
removeDir('assets');
removeDir('dist');
fs.mkdirSync('dist/assets', { recursive: true });

console.log('🚀 [Build] 2. Génération et copie des fichiers audio & PWA...');
execSync('node scripts/generate_png_icons.cjs', { stdio: 'inherit' });
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
html = html.replace('/src/main.tsx', './assets/index.js?v=3.2');
html = html.replace(/src=["'][^"']*assets\/index\.js[^"']*["']/g, 'src="./assets/index.js?v=3.2"');
html = html.replace(/href=["'][^"']*manifest\.json["']/g, 'href="./manifest.json"');
html = html.replace(/href=["'][^"']*favicon\.svg["']/g, 'href="./favicon.svg"');
html = html.replace(/href=["'][^"']*icons\/icon-192\.svg["']/g, 'href="./icons/icon-192.svg"');
fs.writeFileSync('dist/index.html', html, 'utf8');

console.log('🚀 [Build] 5. Synchronisation du dossier mwana-lari-wp/...');
removeDir('mwana-lari-wp');
copyDir('dist', 'mwana-lari-wp');

console.log('📦 [Build] 6. Création de l\'archive ZIP ultra-légère (mwana-lari-v3.zip)...');
try {
  if (fs.existsSync('mwana-lari-v3.zip')) {
    try { fs.unlinkSync('mwana-lari-v3.zip'); } catch {}
  }
  execSync('powershell -Command "Compress-Archive -Path \'dist\\*\' -DestinationPath \'mwana-lari-v3.zip\' -Force"', { stdio: 'ignore' });
  console.log('✅ [Build] mwana-lari-v3.zip généré avec succès !');
} catch (e) {
  console.warn('Note: ZIP generation skipped or handled externally');
}

console.log('✅ [Build] Build terminé avec succès dans dist/ et mwana-lari-wp/ (100% autonome et compatible WordPress / Netlify / Vercel) !');
