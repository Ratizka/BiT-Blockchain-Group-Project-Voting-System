// Simple configuration file for NEAR blockchain connection
// This file is designed to work without any module-specific features

const CONTRACT_NAME = process.env.CONTRACT_NAME || 'hammadaiy.testnet';

function getConfig(environment) {
  if (!environment) {
    environment = process.env.NODE_ENV || 'development';
  }
  
  switch (environment) {
    case 'production':
    case 'mainnet':
      return {
        networkId: 'mainnet',
        nodeUrl: 'https://rpc.mainnet.near.org',
        contractName: process.env.CONTRACT_NAME || 'polling-app.near',
        walletUrl: 'https://app.mynearwallet.com',
        helperUrl: 'https://helper.mainnet.near.org',
        explorerUrl: 'https://explorer.near.org',
      };
    case 'development':
    case 'testnet':
      return {
        networkId: 'testnet',
        nodeUrl: 'https://rpc.testnet.near.org',
        contractName: process.env.CONTRACT_NAME || CONTRACT_NAME,
        walletUrl: 'https://testnet.mynearwallet.com',
        helperUrl: 'https://helper.testnet.near.org',
        explorerUrl: 'https://explorer.testnet.near.org',
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
        contractName: CONTRACT_NAME,
        walletUrl: 'http://localhost:4000/wallet',
        helperUrl: 'http://localhost:3000',
        explorerUrl: 'https://explorer.testnet.near.org',
      };
    default:
      throw Error(`Unconfigured environment '${environment}'. Can be configured in src/config-compat.js.`);
  }
}

module.exports = getConfig;
