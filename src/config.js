const CONTRACT_NAME = process.env.CONTRACT_NAME ||'blockvote.roughjava5453.testnet'

const CONTRACT_NAME = getEnvVar('CONTRACT_NAME', 
                              getEnvVar('NEAR_CLI_DEV_ACCOUNT_ID', 'hammadaiy.testnet'));
const NETWORK_ID = getEnvVar('NETWORK_ID', 'testnet');

function getConfig(environment) {
  if (!environment) {
    environment = getEnvVar('MODE', getEnvVar('NODE_ENV', 'development'));
  }
  
  console.log('Using environment:', environment);
  console.log('Using contract name:', CONTRACT_NAME);
  
  switch (environment) {
    case 'production':
    case 'mainnet':
      return {
        networkId: 'mainnet',
        nodeUrl: getEnvVar('VITE_NODE_URL', 'https://rpc.mainnet.near.org'),
        contractName: getEnvVar('VITE_CONTRACT_NAME', 'polling-app.near'),
        walletUrl: getEnvVar('VITE_WALLET_URL', 'https://app.mynearwallet.com'),
        helperUrl: getEnvVar('VITE_HELPER_URL', 'https://helper.mainnet.near.org'),
        explorerUrl: getEnvVar('VITE_EXPLORER_URL', 'https://explorer.near.org'),
      };
    case 'development':
    case 'testnet':
      return {
        networkId: 'testnet',
        nodeUrl: getEnvVar('VITE_NODE_URL', 'https://rpc.testnet.near.org'),
        contractName: getEnvVar('VITE_CONTRACT_NAME', CONTRACT_NAME),
        walletUrl: getEnvVar('VITE_WALLET_URL', 'https://testnet.mynearwallet.com'),
        helperUrl: getEnvVar('VITE_HELPER_URL', 'https://helper.testnet.near.org'),
        explorerUrl: getEnvVar('VITE_EXPLORER_URL', 'https://explorer.testnet.near.org'),
      };
    case 'betanet':
      return {
        networkId: 'betanet',
        nodeUrl: 'https://rpc.betanet.near.org',
        contractName: CONTRACT_NAME,
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
        contractName: CONTRACT_NAME,
      };
    case 'test':
    case 'ci':
      return {
        networkId: 'shared-test',
        nodeUrl: 'https://rpc.ci-testnet.near.org',
        contractName: CONTRACT_NAME,
        masterAccount: 'test.near',
      };
    case 'ci-betanet':
      return {
        networkId: 'shared-test-staging',
        nodeUrl: 'https://rpc.ci-betanet.near.org',
        contractName: CONTRACT_NAME,
        masterAccount: 'test.near',
      };
    default:
      throw Error(`Unknown environment '${environment}'.`);
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