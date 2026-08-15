import { build } from 'esbuild';
import path from 'path';
import fs from 'fs';

build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  outfile: 'dist/assets/index.js',
  loader: { '.tsx': 'tsx', '.ts': 'ts' },
  jsx: 'automatic',
  nodePaths: [path.resolve('node_modules'), path.resolve('C:/Users/DELL/node_modules')],
  alias: {
    'lucide-react': path.resolve('node_modules/lucide-react/dist/cjs/lucide-react.js'),
  },
  minify: false,
  sourcemap: true,
  define: {
    'process.env.NODE_ENV': '"development"',
  },
}).then(() => {
  // Copy PWA files to dist
  if (fs.existsSync('public/sw.js')) {
    fs.copyFileSync('public/sw.js', 'dist/sw.js');
  }
  if (fs.existsSync('public/manifest.json')) {
    fs.copyFileSync('public/manifest.json', 'dist/manifest.json');
  }
  console.log('✅ Esbuild bundle and PWA assets created successfully in dist/');
}).catch((err) => {
  console.error('❌ Build error:', err);
  process.exit(1);
});
