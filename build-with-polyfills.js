const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define paths
const distDir = path.join(__dirname, 'dist');
const indexFile = path.join(distDir, 'index.html');

// Ensure the dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

console.log('Building with Parcel and Node.js polyfills...');

try {
  // Run parcel build with explicit Node.js polyfill handling
  execSync('npx parcel build src/index.html --public-url ./ --no-source-maps --no-cache', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
    }
  });

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
