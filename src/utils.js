// utils.js - Utility functions for NEAR blockchain interaction, including contract initialization, login, and logout.

import { connect, Contract, keyStores, WalletConnection } from 'near-api-js';
import getConfig from './config-compat'; // Imports environment-specific NEAR configuration.

/**
 * Initializes connection to NEAR blockchain and the smart contract.
 * Sets global `window.walletConnection`, `window.accountId`, and `window.contract`.
 * @returns {Promise<{accountId: string | null, contract: Contract | null}>} Account ID and initialized contract instance, or nulls on error.
 * @throws {Error} If contract initialization fails, to be handled by the caller.
 */
export async function initContract() {
  try {
    // Retrieve NEAR configuration based on environment (development, testnet, mainnet).
    const nearConfig = getConfig(process.env.NEAR_ENV || process.env.NODE_ENV || 'development');
    
    // Log essential configuration for debugging.
    console.log('[utils.js - initContract] NEAR Config Used:', { 
      networkId: nearConfig.networkId,
      contractName: nearConfig.contractName,
      nodeUrl: nearConfig.nodeUrl,
      walletUrl: nearConfig.walletUrl
    });

    // Establish connection to the NEAR network.
    // Uses BrowserLocalStorageKeyStore for account key storage in browser's local storage.
    const near = await connect({
      deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() },
      ...nearConfig // Spread networkId, nodeUrl, etc.
    });

    // Initialize WalletConnection for NEAR Wallet interaction.
    // The second argument (appKeyPrefix) namespaces keys in local storage, typically the contract name.
    window.walletConnection = new WalletConnection(near, nearConfig.contractName);
    
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
      window.walletConnection.account(), // Current user's account (or guest account if not logged in).
      nearConfig.contractName, // Deployed smart contract name/address.
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
  if (window.walletConnection) {
    try {
      // Set a flag in local storage to indicate login attempt.
      // Used on page reload (after redirect from wallet) for post-login actions.
      localStorage.setItem('justLoggedIn', 'true');
      
      // getConfig is called here, it was previously duplicated causing an error
      const loginNearConfig = getConfig(process.env.NEAR_ENV || process.env.NODE_ENV || 'development');
      
      // Request sign-in with NEAR Wallet.
      window.walletConnection.requestSignIn(
        loginNearConfig.contractName, // Contract to request access to.
        loginNearConfig.appTitle || 'Blockchain Polling App', // App title for wallet approval screen.
        // Success URL: where to redirect after successful login.
        `${window.location.origin}${window.location.pathname}`,
        // Failure URL: where to redirect if login fails or is denied.
        `${window.location.origin}${window.location.pathname}?error=login_failed` 
      );
    } catch (error) {
      console.error('[utils.js - login] NEAR Wallet login error:', error);
      alert('An error occurred while trying to log in with NEAR Wallet. Please try again.');
      localStorage.setItem('justLoggedIn', 'false'); // Reset flag on error.
    }
  } else {
    console.error('[utils.js - login] Login called but walletConnection not initialized.');
    // Fallback: Inform user or attempt re-initialization (carefully to avoid loops).
    alert('Wallet connection is not ready. Please wait or reload the page and try again.');
  }
}
