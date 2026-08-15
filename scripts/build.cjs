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

console.log('🚀 [Build] 4. Préparation de dist/index.html...');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('/src/main.tsx', '/assets/index.js');
fs.writeFileSync('dist/index.html', html, 'utf8');

console.log('✅ [Build] Build terminé avec succès dans dist/ (100% autonome et compatible Vercel/Netlify/GitHub) !');
