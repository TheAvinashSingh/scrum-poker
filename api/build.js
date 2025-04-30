// Build process for Vercel
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Starting build process for Vercel...');

// Ensure dist directory exists
if (!fs.existsSync(path.join(process.cwd(), 'dist'))) {
  fs.mkdirSync(path.join(process.cwd(), 'dist'), { recursive: true });
}

try {
  // Build the client
  console.log('Building client application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}