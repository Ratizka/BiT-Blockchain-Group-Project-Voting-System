// This script helps configure NEAR CLI for deployment
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const homeDir = process.env.HOME || process.env.USERPROFILE;
const nearCredentialsDir = path.join(homeDir, '.near-credentials');

// Ensure the directory exists
if (!fs.existsSync(nearCredentialsDir)) {
  fs.mkdirSync(nearCredentialsDir, { recursive: true });
}

// Create a generic config file if it doesn't exist
const configPath = path.join(homeDir, '.near-config.js');
if (!fs.existsSync(configPath)) {
  const configContent = `
    const CONTRACT_NAME = process.env.CONTRACT_NAME || 'hammadaiy.testnet';
    
    module.exports = {
      testnet: {
        networkId: 'testnet',
        nodeUrl: 'https://rpc.testnet.near.org',
        contractName: CONTRACT_NAME,
        walletUrl: 'https://testnet.mynearwallet.com',
        helperUrl: 'https://helper.testnet.near.org',
        explorerUrl: 'https://explorer.testnet.near.org',
      },
      mainnet: {
        networkId: 'mainnet',
        nodeUrl: 'https://rpc.mainnet.near.org',
        contractName: CONTRACT_NAME,
        walletUrl: 'https://app.mynearwallet.com',
        helperUrl: 'https://helper.mainnet.near.org',
        explorerUrl: 'https://explorer.near.org',
      }
    };
  `;
  fs.writeFileSync(configPath, configContent);
  console.log(`Created NEAR configuration file at ${configPath}`);
}

console.log('NEAR CLI configuration complete!');
