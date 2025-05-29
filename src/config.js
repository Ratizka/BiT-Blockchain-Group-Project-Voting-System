// Configuration for NEAR blockchain connection
import { getEnvVar } from './env-utils';

function getConfig(environment) {
  console.log('Using environment:', environment);
  
  switch (environment) {
    case 'production': // This is used by Vercel for production deployments
      return {
        networkId: 'testnet', // Hardcoded to testnet
        nodeUrl: 'https://rpc.testnet.near.org', // Hardcoded to testnet
        contractName: 'hammadaiy.testnet', // Hardcoded to your testnet contract
        walletUrl: 'https://testnet.mynearwallet.com', // Hardcoded to testnet
        helperUrl: 'https://helper.testnet.near.org', // Hardcoded to testnet
        explorerUrl: 'https://explorer.testnet.near.org', // Hardcoded to testnet
      };
    case 'development': // This is used for local development (e.g., npm run start)
      return {
        // Keep using getEnvVar for local development so .env files can override if needed
        networkId: getEnvVar('VITE_NETWORK_ID', 'testnet'),
        nodeUrl: getEnvVar('VITE_NODE_URL', 'https://rpc.testnet.near.org'),
        contractName: getEnvVar('VITE_CONTRACT_NAME', 'hammadaiy.testnet'), 
        walletUrl: getEnvVar('VITE_WALLET_URL', 'https://testnet.mynearwallet.com'),
        helperUrl: getEnvVar('VITE_HELPER_URL', 'https://helper.testnet.near.org'),
        explorerUrl: getEnvVar('VITE_EXPLORER_URL', 'https://explorer.testnet.near.org'),
      };
    case 'betanet':
      return {
        networkId: 'betanet',
        nodeUrl: 'https://rpc.betanet.near.org',
        contractName: getEnvVar('VITE_CONTRACT_NAME', 'default-betanet-contract.betanet'),
        walletUrl: 'https://wallet.betanet.near.org',
        helperUrl: 'https://helper.betanet.near.org',
        explorerUrl: 'https://explorer.betanet.near.org',
      };
    case 'local':
      return {
        networkId: 'local',
        nodeUrl: 'http://localhost:3030',
        keyPath: `${process.env.HOME}/.near/validator_key.json`,
        walletUrl: 'http://localhost:4000/wallet',
        contractName: getEnvVar('VITE_CONTRACT_NAME', 'local-contract.testnet'),
      };
    case 'test':
    case 'ci':
      return {
        networkId: 'shared-test',
        nodeUrl: 'https://rpc.ci-testnet.near.org',
        contractName: getEnvVar('VITE_CONTRACT_NAME', 'ci-test-contract.testnet'),
        masterAccount: 'test.near',
      };
    case 'ci-betanet':
      return {
        networkId: 'shared-test-staging',
        nodeUrl: 'https://rpc.ci-betanet.near.org',
        contractName: getEnvVar('VITE_CONTRACT_NAME', 'ci-betanet-contract.betanet'),
        masterAccount: 'test.near',
      };
    default:
      // Fallback for any other environment, can also point to testnet
      console.warn(`Unknown environment '${environment}', defaulting to testnet settings.`);
      return {
        networkId: 'testnet',
        nodeUrl: 'https://rpc.testnet.near.org',
        contractName: 'hammadaiy.testnet',
        walletUrl: 'https://testnet.mynearwallet.com',
        helperUrl: 'https://helper.testnet.near.org',
        explorerUrl: 'https://explorer.testnet.near.org',
      };
  }
}

// App configuration
export const APP_CONFIG = {
  name: getEnvVar('VITE_APP_NAME', 'Blockchain Polling App'),
  version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
  debug: getEnvVar('VITE_DEBUG', 'false') === 'true',
  devMode: getEnvVar('VITE_DEV_MODE', 'false') === 'true',
};

export default getConfig;