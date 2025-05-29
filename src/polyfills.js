// Browser polyfill for Node.js built-in modules
// This file provides polyfills for Node.js core modules used by Near API

// Import the actual modules if possible, to be used as fallbacks
let BufferModule;
let ProcessModule;

try {
  // Try to import the modules, but don't fail if they're not available
  BufferModule = require('buffer');
} catch (e) {
  console.log('Could not import buffer module:', e.message);
}

try {
  ProcessModule = require('process');
} catch (e) {
  console.log('Could not import process module:', e.message);
}

// Store references to our local implementations that we will export
// We'll assign these either from the imports above or from the global objects
let BufferExport;
let ProcessExport;

// Define or configure global Buffer
try {
  if (typeof globalThis.Buffer === 'undefined') {
    console.log('Buffer was undefined - setting up a shim');
    
    // Try to use the imported module if available
    if (BufferModule && BufferModule.Buffer) {
      globalThis.Buffer = BufferModule.Buffer;
      console.log('Using imported Buffer module');
    } else {
      // Simplified polyfill if Buffer is completely missing
      globalThis.Buffer = {
        from: (data, encoding) => {
          if (encoding === 'base64') {
            return { data };
          }
          return { data };
        },
        isBuffer: () => false,
        TYPED_ARRAY_SUPPORT: true,
        alloc: (size) => new Uint8Array(size),
        isEncoding: (encoding) => ['utf8', 'utf-8', 'hex', 'base64'].includes(encoding)
      };
      console.log('Using custom Buffer shim');
    }
  } else {
    // Ensure TYPED_ARRAY_SUPPORT is set on existing Buffer
    console.log('Buffer was already defined - ensuring TYPED_ARRAY_SUPPORT is set');
    // Set the property only if Buffer exists and is an object
    if (typeof globalThis.Buffer === 'object' || typeof globalThis.Buffer === 'function') {
      globalThis.Buffer.TYPED_ARRAY_SUPPORT = true;
    } else {
      console.warn('Buffer is defined but not an object or function. Cannot set TYPED_ARRAY_SUPPORT.');
    }
  }
  
  // Store reference for export
  BufferExport = globalThis.Buffer;
  
} catch (bufferError) {
  console.error('Error configuring Buffer:', bufferError);
  // Create a minimal export to avoid undefined errors
  BufferExport = {
    from: () => ({}),
    isBuffer: () => false,
    TYPED_ARRAY_SUPPORT: true,
    alloc: () => new Uint8Array(0),
    isEncoding: () => false
  };
}

// Define or configure global process
try {
  if (typeof globalThis.process === 'undefined') {
    console.log('process was undefined - setting up a shim');
    
    // Try to use the imported module if available
    if (ProcessModule) {
      globalThis.process = ProcessModule;
      console.log('Using imported process module');
    } else {
      // Simplified process object if it's missing
      globalThis.process = {
        env: {},
        browser: true,
        version: '',
        nextTick: (callback) => setTimeout(callback, 0),
      };
      console.log('Using custom process shim');
    }
  } else {
    // Ensure browser flag is set on existing process
    console.log('process was already defined - setting browser flag');
    if (typeof globalThis.process === 'object') {
      globalThis.process.browser = true;
    } else {
      console.warn('process is defined but not an object. Cannot set browser flag.');
    }
  }
  
  // Store reference for export
  ProcessExport = globalThis.process;
  
} catch (processError) {
  console.error('Error configuring process:', processError);
  // Create a minimal export to avoid undefined errors
  ProcessExport = {
    env: {},
    browser: true,
    nextTick: (callback) => setTimeout(callback, 0)
  };
}

// Add this logging to confirm the polyfill is loaded and values are set
console.log('Node.js polyfills set up:');

// Safe logging that won't throw errors if objects are not properly defined
try {
  const bufferSupport = 
    typeof BufferExport !== 'undefined' &&
    (typeof BufferExport === 'object' || typeof BufferExport === 'function') &&
    'TYPED_ARRAY_SUPPORT' in BufferExport
      ? BufferExport.TYPED_ARRAY_SUPPORT 
      : 'not available';
  console.log('- Buffer.TYPED_ARRAY_SUPPORT:', bufferSupport);
} catch (e) {
  console.log('- Buffer.TYPED_ARRAY_SUPPORT: [error accessing property]', e);
}

try {
  const browserFlag = 
    typeof ProcessExport !== 'undefined' &&
    typeof ProcessExport === 'object' &&
    'browser' in ProcessExport
      ? ProcessExport.browser 
      : 'not available';
  console.log('- process.browser:', browserFlag);
} catch (e) {
  console.log('- process.browser: [error accessing property]', e);
}

// Export our local references instead of global objects
// This ensures we're exporting something defined within this module
export { BufferExport as Buffer, ProcessExport as process };
