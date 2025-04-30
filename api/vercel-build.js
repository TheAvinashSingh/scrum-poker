// Build script for Vercel
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting Vercel build process...');

// Ensure we have a proper index.html file as fallback
const ensureFallbackPage = () => {
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Check if we already have an index.html file
  const indexPath = path.join(publicDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    // Create a simple fallback page
    console.log('Creating fallback index.html...');
    const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scrum Poker - Loading</title>
  <style>
    body, html {
      font-family: system-ui, sans-serif;
      margin: 0;
      padding: 0;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      padding: 2rem;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .loader {
      display: inline-block;
      width: 50px;
      height: 50px;
      border: 5px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top-color: #3498db;
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 1rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Scrum Poker</h1>
    <div class="loader"></div>
    <p>
      Loading the application, please wait...
    </p>
  </div>
</body>
</html>`;
    fs.writeFileSync(indexPath, fallbackHtml);
  }
};

// Build the client application
try {
  console.log('Building client application...');
  
  // Ensure we have a fallback page
  ensureFallbackPage();

  // Create a simple status file to track build progress
  const statusPath = path.join(process.cwd(), 'public', 'build-status.json');
  fs.writeFileSync(statusPath, JSON.stringify({ status: 'building', timestamp: new Date().toISOString() }));
  
  // Run the build command with extra environment variables
  execSync('VITE_DEPLOYMENT=production npm run build', { 
    stdio: 'inherit',
    env: { ...process.env, VITE_DEPLOYMENT: 'production' }
  });
  
  // Check if dist directory exists and has files
  const distDir = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    // Copy dist files to public folder for static serving
    const publicDir = path.join(process.cwd(), 'public');
    
    // Copy all files from dist to public
    console.log('Copying built files to public directory...');
    execSync(`cp -R ${distDir}/* ${publicDir}/`);
    
    // Update build status
    fs.writeFileSync(statusPath, JSON.stringify({ 
      status: 'completed', 
      timestamp: new Date().toISOString() 
    }));
    
    console.log('Build process completed successfully!');
  } else {
    console.error('Error: dist directory not found after build');
    process.exit(1);
  }
} catch (error) {
  console.error('Build process failed:', error);
  // Try to write error to status file
  try {
    const statusPath = path.join(process.cwd(), 'public', 'build-status.json');
    fs.writeFileSync(statusPath, JSON.stringify({ 
      status: 'failed', 
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString() 
    }));
  } catch (e) {
    console.error('Could not write status file:', e);
  }
  process.exit(1);
}