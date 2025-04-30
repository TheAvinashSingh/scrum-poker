// Build script for Vercel
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting Vercel build process...');

// Build the client application
try {
  console.log('Building client application...');
  
  // Run the build command
  execSync('npm run build', { stdio: 'inherit' });
  
  // Check if dist directory exists and has files
  const distDir = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    // Copy dist files to public folder for static serving
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Copy all files from dist to public
    console.log('Copying built files to public directory...');
    execSync(`cp -R ${distDir}/* ${publicDir}/`);
    
    console.log('Build process completed successfully!');
  } else {
    console.error('Error: dist directory not found after build');
    process.exit(1);
  }
} catch (error) {
  console.error('Build process failed:', error);
  process.exit(1);
}