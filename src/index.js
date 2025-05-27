// Load polyfills first
import './polyfills';

// React imports
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initContract } from './utils'
import './styles/output.css'
import './global.css'

console.log('Starting the application...');

window.nearInitPromise = initContract()
  .then(() => {
    console.log('Contract initialized, rendering app...');
    try {
      // Check if ReactDOM.createRoot is available (React 18+)
      if (typeof ReactDOM.createRoot === 'function') {
        console.log('Using React 18 createRoot API');
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(
          <React.StrictMode>
            <App />
          </React.StrictMode>
        );
      } else {
        // Fallback for older React versions
        console.log('Falling back to older React render API');
        ReactDOM.render(
          <React.StrictMode>
            <App />
          </React.StrictMode>,
          document.getElementById('root')
        );
      }
    } catch (renderError) {
      console.error('Error rendering app:', renderError);
      document.getElementById('root').innerHTML = `
        <div style="color: red; padding: 20px;">
          <h1>Error Rendering Application</h1>
          <p>${renderError.message}</p>
        </div>
      `;
    }
  })
  .catch(error => {
    console.error('Error initializing contract:', error);
    document.querySelector('#root').innerHTML = `
      <div style="color: red; padding: 20px;">
        <h1>Error Initializing Application</h1>
        <p>Check the console for details.</p>
      </div>
    `;
  })
