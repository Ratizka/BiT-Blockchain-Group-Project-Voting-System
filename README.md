# BIT Polling App
====================================

This is a decentralized polling/voting application built with React, Tailwind CSS, and NEAR Protocol.

This project was originally initialized using `create-near-app` and has been significantly updated.

Quick Start
===========

To run this project locally:

1.  **Prerequisites**:
    *   Make sure you've installed [Node.js] (version 16 or higher is recommended).
    *   Install yarn (optional, if you prefer it over npm): `npm install --global yarn`

2.  **Clone the repository (if you haven't already)**:
    ```bash
    git clone <your-repository-url>
    cd blockchain-polling-app # Or your project's directory name
    ```

3.  **Install dependencies**:
    Using npm:
    ```bash
    npm install
    ```
    Or using yarn:
    ```bash
    yarn install
    ```
    *If you encounter issues like `Error: Could not locate the bindings file.` related to `deasync` during or after installation, try:*
    ```bash
    npm uninstall deasync
    npm install deasync
    ```

4.  **Set up Environment Variables**:
    *   This project uses Vite, which handles environment variables. You'll need to create a `.env` file in the project root.

5.  **Run the local development server**:
    The primary script for development is:
    ```bash
    npm run dev
    ```
    This command typically handles contract deployment to a dev account, builds the frontend, and starts a development server with hot reloading.

    Alternatively, for a simpler frontend-only start (assuming contract is already deployed and configured):
    ```bash
    npm run start:frontend 
    ```
    (Consult `package.json` for a full list of `scripts`.)

You should now have a local development environment running the application, typically connected to the NEAR TestNet. As you make code changes, the app (if using `npm run dev`) should automatically reload.

Exploring The Code
==================

1.  **Smart Contract (Backend)**:
    *   Lives in the `/contract` folder.
    *   Written in AssemblyScript.
    *   See `contract/README.md` for more specific details on its structure, build process, and testing.

2.  **Frontend**:
    *   Lives in the `/src` folder.
    *   Built with [React], [Tailwind CSS] for styling, and [Vite] as the build tool.
    *   `src/index.html` is the main HTML entry point.
    *   `src/main.jsx` (or `src/index.js` / `src/App.js`) is where the React application is initialized and connected to the NEAR blockchain via utility functions in `src/utils.js` and configuration in `src/config.js`.
    *   Components are located in `src/Components/`.
    *   Services for interacting with the blockchain (like `PollService.js`) are in `src/services/`.

3.  **Tests**:
    *   Frontend tests might use [Jest]. Run tests using:
        ```bash
        npm test
        ```
    *   Smart contract tests are typically run within the `/contract` directory (see its README).

Deployment
==========

Deploying this application involves two main parts: deploying the smart contract to the NEAR blockchain and deploying the frontend application.

### Smart Contract Deployment

1.  **Install NEAR CLI**: If not already installed globally, it's recommended for easier contract management.
    ```bash
    npm install --global near-cli
    ```
    (Or use the version from `node_modules` via `npx near ...`)

2.  **Create a NEAR Account**: Your smart contract needs its own NEAR account.
    *   If you don't have one, create one at [NEAR Wallet] (TestNet or MainNet).
    *   Log in with `near login`.
    *   Create a sub-account for your contract, e.g., `polling-app.your-account.testnet`:
        ```bash
        near create-account polling-app.YOUR-ACCOUNT.testnet --masterAccount YOUR-ACCOUNT.testnet
        ```

3.  **Configure Contract Name**:
    *   Update `VITE_CONTRACT_NAME` in your `.env` file (for local) or directly in `src/config.js` if not using `.env` for this specific deployment script, to point to your deployed contract account ID (e.g., `polling-app.YOUR-ACCOUNT.testnet`).

4.  **Deploy the Contract**:
    The `package.json` includes scripts for contract deployment. For a release build and deployment:
    ```bash
    npm run deploy:contract 
    ```
    This script might need adjustment based on your target network (TestNet/MainNet) and account. It typically builds the contract in release mode and deploys it.
    For development, `npm run dev` often handles deploying a debug version to a dev account.

### Frontend Deployment

The project is set up to deploy the frontend to GitHub Pages using `gh-pages` via:
```bash
npm run deploy:pages
```
This is part of the combined `npm run deploy` script.

General Project Information
===========================

*   **Styling**: [Tailwind CSS] is used for styling. Customize configuration in `tailwind.config.js`.
*   **Build Tool**: [Vite] is used for frontend bundling and development server.

Troubleshooting
===============

*   **Windows `EPERM` errors**: If you encounter errors containing `EPERM` on Windows, it might be related to spaces in your project path or issues with file permissions.
*   **Build Issues**: Ensure all dependencies are correctly installed. Check console logs for specific error messages.
*   **Contract Calls Failing**:
    *   Verify `VITE_CONTRACT_NAME` in your `.env` (or `src/config.js`) is correct and matches the deployed contract account.
    *   Ensure the contract is deployed to the correct NEAR network (TestNet/MainNet) as configured.
    *   Check NEAR Explorer for transaction details and contract state.

---

Links:
  [React]: https://reactjs.org/
  [create-near-app]: https://github.com/near/create-near-app
  [Node.js]: https://nodejs.org/
  [Tailwind CSS]: https://tailwindcss.com/
  [Vite]: https://vitejs.dev/
  [Jest]: https://jestjs.io/
  [NEAR accounts]: https://docs.near.org/concepts/account
  [NEAR Wallet]: https://wallet.testnet.near.org/ (for TestNet) or https://wallet.near.org/ (for MainNet)
  [near-cli]: https://github.com/near/near-cli
  [gh-pages]: https://github.com/tschaub/gh-pages
