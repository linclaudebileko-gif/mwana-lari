import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 [Vercel Build] 1. Génération des assets audio...');
execSync('node scripts/generate_audio.js', { stdio: 'inherit' });

console.log('🚀 [Vercel Build] 2. Compilation de l\'application avec Vite...');
execSync('npx vite build', { stdio: 'inherit' });

console.log('✅ [Vercel Build] Build terminé avec succès dans dist/ !');
