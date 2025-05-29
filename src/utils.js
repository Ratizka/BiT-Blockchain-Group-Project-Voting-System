// utils.js - Utility functions for NEAR blockchain interaction, including contract initialization, login, and logout.

import { connect, Contract, keyStores, WalletConnection } from 'near-api-js';
import getConfig from './config';
import { getEnvVar } from './env-utils';

// Determine environment using process.env.NODE_ENV, which Parcel and Vercel support.
// Vercel sets NODE_ENV to 'production' for production builds, and 'development' for preview/development.
const environment = process.env.NODE_ENV || 'development'; 
const nearConfig = getConfig(environment);

console.log('nearConfig based on environment (' + environment + '):', nearConfig);

/**
 * Initializes connection to NEAR blockchain and the smart contract.
 * Sets global `window.walletConnection`, `window.accountId`, and `window.contract`.
 * @returns {Promise<{accountId: string | null, contract: Contract | null}>} Account ID and initialized contract instance, or nulls on error.
 * @throws {Error} If contract initialization fails, to be handled by the caller.
 */
export async function initContract() {
  try {
    // Log essential configuration for debugging.
    // The nearConfig at the top of the file is already determined by process.env.NODE_ENV
    console.log('[utils.js - initContract] NEAR Config Used:', { 
      networkId: nearConfig.networkId,
      contractName: nearConfig.contractName,
      nodeUrl: nearConfig.nodeUrl,
      walletUrl: nearConfig.walletUrl
    });

    const near = await connect({
      ...nearConfig, // Use the globally determined nearConfig
      deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() },
      headers: {}
    });

    // Initialize WalletConnection for NEAR Wallet interaction.
    // The second argument (appKeyPrefix) namespaces keys in local storage, typically the contract name.
    window.walletConnection = new WalletConnection(near, getEnvVar('VITE_APP_TITLE', 'NEAR Poll'));
    
    // Handle post-login redirect: NEAR Wallet redirects back to the app.
    // A flag helps manage actions needed immediately after login.
    const justLoggedIn = localStorage.getItem('justLoggedIn') === 'true';
    if (justLoggedIn) {
      localStorage.setItem('justLoggedIn', 'false'); // Reset flag.
      // Reload to ensure app state reflects login. Consider if a more targeted state update is feasible.
      window.location.reload(); 
    }
    
    // Retrieve the current signed-in account ID.
    window.accountId = window.walletConnection.getAccountId();
    console.log('[utils.js - initContract] Current NEAR Account ID:', window.accountId || 'Not logged in');

    // Initialize the smart contract instance for view and change method calls.
    window.contract = await new Contract(
      window.walletConnection.account(), 
      nearConfig.contractName, // Use the globally determined nearConfig
      {
        // View methods: read-only, no transaction signing or gas fees (usually).
        viewMethods: [
          'getPoll',            // Retrieves a specific poll by its ID (prompt).
          'getAllPolls',        // Retrieves all polls.
          'getUserPolls',       // Retrieves polls created by a specific user.
          'getPollsByCategory', // Retrieves polls in a specific category.
          'getPollsByTag',      // Retrieves polls with a specific tag (if implemented).
          'hasUserVoted',       // Checks if a user voted in a specific poll.
          'getUserVote',        // Gets a user's vote in a poll.
          'getUserVoteHistory', // Retrieves user's voting history (e.g., list of poll IDs).
          // Add other view methods specific to your contract as needed.
          // 'getGreeting', // Example, remove if not used.
        ],
        // Change methods: modify blockchain state, require signing and gas fees.
        changeMethods: [
          'createPoll',         // Creates a new poll.
          'vote',               // Submits a vote.
          'deletePoll',         // Deletes a poll (owner-only).
          'extendPoll',         // Extends poll duration (owner-only).
          'pausePoll',          // Pauses a poll (owner-only).
          'resumePoll',         // Resumes a paused poll (owner-only).
          // 'pauseResumePoll', // Alternative: toggles pause/resume (owner-only).
          // Add other change methods specific to your contract as needed.
          // 'addUrl', // Example, remove if not used.
        ]
      }
    );
    
    console.log('[utils.js - initContract] Contract initialized successfully.');
    return { accountId: window.accountId, contract: window.contract };
  } catch (error) {
    console.error('[utils.js - initContract] Error during NEAR contract initialization:', error);
    // Ensure UI can handle this, e.g., by setting contract/accountId to null or showing an error.
    window.contract = null;
    window.accountId = null;
    // Rethrow error for the calling code (e.g., index.js) to handle appropriately (e.g., render error page).
    throw error; 
  }
}

/**
 * Logs the current user out of the NEAR Wallet.
 * Clears `accountId`, related local storage, and reloads the page.
 */
export function logout() {
  if (window.walletConnection) {
    window.walletConnection.signOut(); // Signs out from NEAR Wallet.
    window.accountId = null; // Clear global account ID.
    localStorage.removeItem('justLoggedIn'); // Clear login flag.
    // Consider clearing other app-specific session data if necessary.
    
    // Reload the page to reset application state to logged-out view.
    // `replace` avoids adding the logged-out page to browser history.
    window.location.replace(window.location.origin + window.location.pathname);
  } else {
    console.warn('[utils.js - logout] Logout called but walletConnection not found.');
  }
}

/**
 * Initiates NEAR Wallet login process.
 * Redirects user to NEAR Wallet for authentication.
 */
export function login() {
  
  console.log('Login function using global nearConfig:', nearConfig);
  window.walletConnection.requestSignIn(nearConfig.contractName);
}

/**
 * Converts a string into a URL-friendly slug.
 * Example: "Live or recorded music?" becomes "live-or-recorded-music".
 * @param {string} text The text to slugify.
 * @returns {string} The slugified text.
 */
export function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w-]+/g, '')       // Remove all non-word chars except hyphens
    .replace(/--+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')           // Trim - from start of text
    .replace(/-+$/, '');          // Trim - from end of text
}
