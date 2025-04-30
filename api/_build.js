// Build script for Vercel
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

// Create build directories
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Run the build process
exec('npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error during build: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Build stderr: ${stderr}`);
  }
  console.log(`Build completed: ${stdout}`);
});