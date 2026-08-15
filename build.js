import { build } from 'esbuild';
import path from 'path';
import fs from 'fs';

// Helper to copy directory recursively
function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function runBuild() {
  console.log('🚀 Démarrage du build universel Mwana Lari...');

  // 1. Ensure dist output structure
  const distDir = path.resolve('dist');
  const distAssetsDir = path.resolve('dist/assets');
  if (!fs.existsSync(distAssetsDir)) {
    fs.mkdirSync(distAssetsDir, { recursive: true });
  }

  // 2. Build JavaScript/TypeScript bundle with esbuild
  await build({
    entryPoints: ['src/main.tsx'],
    bundle: true,
    outfile: 'dist/assets/index.js',
    loader: { '.tsx': 'tsx', '.ts': 'ts' },
    jsx: 'automatic',
    minify: true,
    sourcemap: true,
    define: {
      'process.env.NODE_ENV': '"production"',
    },
  });

  // 3. Prepare dist/index.html
  let indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf-8');
  indexHtml = indexHtml.replace('/src/main.tsx', '/assets/index.js');
  fs.writeFileSync(path.join(distDir, 'index.html'), indexHtml, 'utf-8');

  // 4. Copy all public assets to dist
  const publicDir = path.resolve('public');
  if (fs.existsSync(publicDir)) {
    copyDirSync(publicDir, distDir);
  }

  console.log('✅ Build terminé avec succès dans dist/ (compatible Vercel, Netlify, Cloudflare)');
}

runBuild().catch((err) => {
  console.error('❌ Erreur critique de build:', err);
  process.exit(1);
});
