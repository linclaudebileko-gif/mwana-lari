const { build } = require('esbuild');
const path = require('path');

build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  outfile: 'dist/assets/index.js',
  loader: { '.tsx': 'tsx', '.ts': 'ts' },
  jsx: 'automatic',
  nodePaths: [path.resolve('node_modules'), path.resolve('C:/Users/DELL/node_modules')],
  minify: false,
  sourcemap: true,
  define: {
    'process.env.NODE_ENV': '"development"',
  },
}).then(() => {
  console.log('✅ Esbuild bundle created successfully in dist/assets/index.js');
}).catch((err) => {
  console.error('❌ Build error:', err);
  process.exit(1);
});
