// A simplified environment variable helper that doesn't directly import process

const getEnvironment = () => {
  // In browser
  if (typeof window !== 'undefined') {
    // Create a merged environment from multiple possible sources
    return {
      // Priority 1: Any explicitly set window.env vars (often from server)
      ...((window && window.env) || {}),
      
      // Priority 2: Any env vars that might have been serialized for the browser
      ...(window.__ENV || {}),
      
      // Priority 3: Some static defaults
      NODE_ENV: 'development',
      BROWSER: true
    };
  } 
  // In Node.js (should never execute in browser bundle)
  else if (typeof process !== 'undefined' && process.env) {
    return process.env;
  } 
  // Fallback for any other environment
  else {
    return {};
  }
};

// Helper function to get an env var with a default
export const getEnvVar = (name, defaultValue = '') => {
  const env = getEnvironment();
  return env[name] !== undefined ? env[name] : defaultValue;
};

// Export the environment object for direct access if needed
export const env = getEnvironment();

export default {
  getEnvVar,
  env
};