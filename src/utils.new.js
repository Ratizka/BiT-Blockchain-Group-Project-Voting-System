import { connect, Contract, keyStores, WalletConnection } from 'near-api-js';
import getConfig from './config';

/**
 * Initialize the NEAR contract
 * @returns {Promise<{accountId: string, contract: object}>} Account ID and contract
 */
export async function initContract() {
  try {
    // Get config for the current environment 
    const nearConfig = getConfig(process.env.NEAR_ENV || process.env.NODE_ENV || 'development');
    
    // Log the configuration for debugging
    console.log('NEAR Config:', { 
      networkId: nearConfig.networkId,
      contractName: nearConfig.contractName,
      nodeUrl: nearConfig.nodeUrl
    });

    // Initialize connection to the NEAR network
    const near = await connect({
      deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() },
      ...nearConfig
    });

    // Initialize wallet connection
    window.walletConnection = new WalletConnection(near);
    
    // Check if the user just logged in
    const justLoggedIn = localStorage.getItem('justLoggedIn') === 'true';
    if (justLoggedIn) {
      localStorage.setItem('justLoggedIn', 'false');
      window.location.reload();
    }
    
    // Get and store the account ID
    window.accountId = window.walletConnection.getAccountId();
    console.log('Current account ID:', window.accountId || 'Not logged in');

    // Initialize contract with all required methods
    window.contract = await new Contract(
      window.walletConnection.account(),
      nearConfig.contractName,
      {
        // View methods (read-only)
        viewMethods: [
          'getPoll',
          'getAllPolls',
          'getUserPolls',
          'getPollsByCategory',
          'getPollsByTag',
          'hasUserVoted',
          'getUserVote',
          'getAllCandidates',
          // Legacy methods for backward compatibility
          'getGreeting',
          'didParticipate',
          'getAllPrompts',
          'getVotes',
          'getUrl',
          'getCandidatePair',
          'getPollVotes'
        ],
        // Change methods (write operations)
        changeMethods: [
          'createPoll',
          'vote',
          'extendPoll',
          'pauseResumePoll',
          // Legacy methods for backward compatibility
          'addUrl',
          'addCandidatePair',
          'addToPromptArray',
          'addVote',
          'recordUser',
          'clearPromptArray',
          'setUrl'
        ]
      }
    );
    
    return { accountId: window.accountId, contract: window.contract };
  } catch (error) {
    console.error('Error initializing contract:', error);
    throw error;
  }
}

/**
 * Log out from NEAR wallet
 */
export function logout() {
  if (window.walletConnection) {
    window.walletConnection.signOut();
    // Clear account ID
    window.accountId = null;
    // Clear session data
    localStorage.removeItem('lastLoginTime');
    // Reload the page to reset the UI
    window.location.replace(window.location.origin + window.location.pathname);
  }
}

/**
 * Log in to NEAR wallet
 */
export function login() {
  if (window.walletConnection) {
    try {
      // Flag to identify first login
      localStorage.setItem('justLoggedIn', 'true');
      
      // Get current config
      const nearConfig = getConfig(process.env.NEAR_ENV || process.env.NODE_ENV || 'development');
      
      // Redirect to wallet with full options
      window.walletConnection.requestSignIn(
        nearConfig.contractName, 
        nearConfig.appTitle || 'Blockchain Polling App',
        `${window.location.origin}${window.location.pathname}`,
        `${window.location.origin}${window.location.pathname}?error=login_failed`
      );
    } catch (error) {
      console.error('Login error:', error);
      alert('Error during login. Please try again.');
    }
  } else {
    console.error('Wallet connection not initialized');
    alert('Unable to connect to NEAR wallet. Please reload the page.');
  }
}
