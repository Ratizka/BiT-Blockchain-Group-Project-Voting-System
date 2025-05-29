// Custom Buffer shim for the browser environment
// This defines a minimal Buffer implementation with TYPED_ARRAY_SUPPORT set to true

// Create a simple Buffer-like interface
const BufferShim = {
  // Required property that base64-js checks for
  TYPED_ARRAY_SUPPORT: true,
  
  // Basic conversion method
  from: function(data, encoding) {
    if (typeof data === 'string') {
      if (encoding === 'base64') {
        try {
          // Try to use the browser's atob for base64 if available
          const binary = window.atob(data);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          return bytes;
        } catch (e) {
          console.error('Base64 decode error:', e);
          return new Uint8Array(0);
        }
      }
      
      // UTF-8 encoding (simplified)
      const bytes = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) {
        bytes[i] = data.charCodeAt(i);
      }
      return bytes;
    }
    
    // If data is already an array-like object, return a view of it
    if (ArrayBuffer.isView(data)) {
      return data;
    }
    
    // Fallback
    return new Uint8Array(0);
  },
  
  // Check if something is a Buffer
  isBuffer: function(obj) {
    return false; // Simplified check
  },
  
  // Add standard methods that might be needed
  alloc: function(size) {
    return new Uint8Array(size);
  },
  
  allocUnsafe: function(size) {
    return new Uint8Array(size);
  },
  
  isEncoding: function(encoding) {
    return ['utf8', 'utf-8', 'hex', 'base64'].includes(encoding);
  }
};

// Export the Buffer shim
module.exports = {
  Buffer: BufferShim,
  TYPED_ARRAY_SUPPORT: true
};
