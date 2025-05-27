/**
 * Helper script to start the development server with polyfilled Node.js modules
 */
const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Print startup banner
console.log('='.repeat(80));
console.log('🚀 Starting NEAR blockchain polling app development server');
console.log('='.repeat(80));

// Load environment variables
console.log('📂 Loading environment variables...');
try {
  const envPath = path.join(__dirname, '.env.development');
  console.log(`Checking for .env.development at ${envPath}`);
  if (fs.existsSync(envPath)) {
    console.log('Found .env.development file, loading variables...');
    dotenv.config({ path: envPath });
  } else {
    console.log('⚠️ .env.development not found, creating empty one');
    fs.writeFileSync(envPath, '# Development environment variables\n');
    dotenv.config({ path: envPath });
  }
} catch (error) {
  console.warn('❌ Error loading .env.development:', error.message);
}

// If neardev/dev-account.env exists, load those variables too
const devAccountEnvPath = path.join(__dirname, 'neardev', 'dev-account.env');
console.log(`Checking for dev-account.env at ${devAccountEnvPath}`);
if (fs.existsSync(devAccountEnvPath)) {
  console.log('Found dev-account.env file, loading variables...');
  try {
    const devEnv = dotenv.parse(fs.readFileSync(devAccountEnvPath));
    for (const key in devEnv) {
      process.env[key] = devEnv[key];
      console.log(`Setting ${key}=${devEnv[key]}`);
    }
  } catch (error) {
    console.warn('❌ Error loading dev-account.env:', error.message);
  }
} else {
  console.log('dev-account.env not found');
}

console.log('Starting development server with Node.js polyfills...');
console.log(`CONTRACT_NAME: ${process.env.CONTRACT_NAME || 'not set'}`);

try {
  console.log('🎨 Building Tailwind CSS...');
  execSync('npm run build:tailwind', { stdio: 'inherit' });
  
  console.log('🌐 The app is starting! It will automatically open in your browser when ready');
  
  // Find and create a package.json.browser file that specifies browser replacements
  // This helps Parcel understand what to use as polyfills
  try {
    console.log('🔧 Setting up browser polyfill mappings...');
    const browserPolyfills = {
      "browser": {
        "buffer": false,
        "process": false,
        "crypto": false,
        "stream": false,
        "util": false
      }
    };
    
    // Write temporary browser config to help Parcel
    fs.writeFileSync(
      path.join(__dirname, 'browser-polyfills.json'), 
      JSON.stringify(browserPolyfills, null, 2)
    );
    console.log('✅ Created browser polyfill mappings');
  } catch (error) {
    console.error('⚠️ Error creating browser polyfill mappings:', error.message);
    // Continue execution, this is not fatal
  }
  
  // Use locally installed parcel-bundler
  // const parcelPath = path.join(__dirname, 'node_modules', '.bin', 'parcel'); // Remove this line
  // console.log(`Using Parcel at: ${parcelPath}`); // Remove this line
  
  // Determine the right Parcel executable name based on platform
  // const parcelExecutable = process.platform === 'win32' ? `${parcelPath}.cmd` : parcelPath; // Remove this line
  
  // Start Parcel with specific environment variables to help with polyfill resolution
  const parcelCommand = 'npx parcel'; // Add this line
  const args = ['serve', 'src/index.html', '--open', '--no-hmr', '--no-cache'];
  
  console.log(`🚀 Running command: ${parcelCommand} ${args.join(' ')}`);
  
  const parcelProcess = spawn(parcelCommand, args, {
    stdio: 'inherit',
    shell: true, // Use shell to handle path issues on Windows
    env: {
      ...process.env,
      GLOBAL_CONTEXT: 'true',  // Custom flag we can check for in polyfills.js
      BROWSER: 'true',         // Tell any code that might check that we're in a browser
      NODE_ENV: 'development', // Ensure NODE_ENV is set
      PARCEL_WORKERS: '1',     // Use single worker to avoid race conditions
      DEBUG: '*'               // Enable all debug output to help diagnose issues
    }
  });
  
  parcelProcess.on('error', (err) => {
    console.error('❌ Failed to start Parcel:', err);
  });
  
  parcelProcess.on('close', (code) => {
    console.log(`Parcel exited with code ${code}`);
    
    // Clean up the temporary browser config file
    try {
      fs.unlinkSync(path.join(__dirname, 'browser-polyfills.json'));
    } catch (error) {
      // Ignore errors during cleanup
    }
  });
} catch (error) {
  console.error('❌ Error starting development server:', error);
  process.exit(1);
}
