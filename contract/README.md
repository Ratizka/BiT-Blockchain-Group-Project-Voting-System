BIT Polling App Smart Contract
==============================

A [smart contract] written in [AssemblyScript] for the BIT Polling App, a decentralized application on the NEAR Protocol.

Overview
========

This smart contract manages polls, voting, and user interactions within the BIT Polling App. Key functionalities include:

*   **Poll Creation:** Users can create new polls with a prompt, description, category, multiple candidates, and a defined duration.
*   **Voting:** Authenticated users can cast a single vote on active polls.
*   **Poll Retrieval:** Users can view all polls, polls by a specific creator, polls by category, or individual poll details.
*   **Vote Tracking:** The contract tracks votes for each candidate and prevents users from voting multiple times on the same poll.
*   **User Vote History:** Users can retrieve a list of polls they have voted on.
*   **Poll Deletion:** Poll creators can delete their own polls.

Smart Contract Structure
========================

The core logic of the smart contract is organized into the following files:

*   `assembly/index.ts`: This is the main entry point of the contract. It contains the public-facing functions that can be called on the NEAR blockchain. This includes functions for creating polls (`createPoll`), voting (`vote`), retrieving poll data (`getPoll`, `getAllPolls`, `getUserPolls`, `getPollsByCategory`), managing user votes (`hasUserVoted`, `getUserVote`, `getUserVoteHistory`), and deleting polls (`deletePoll`).
*   `assembly/models.ts`: This file defines the data structures (models) used by the smart contract. Key models include:
    *   `Poll`: Represents a poll, including its ID (prompt), description, creator, category, tags, creation timestamp, duration, candidate list, and vote counts. It also includes helper methods to check if a poll is active (`isActive`) and to record votes (`recordVote`).
    *   `Candidate`: Represents a candidate within a poll, containing details like name, slogan, description, and image URL.
    *   `UserVoteRecord`: A simple structure to link a user's vote to a specific poll and candidate.

Building the Contract
=====================

The smart contract is compiled from AssemblyScript to WebAssembly (WASM). The build process is managed by the `compile.js` script located in the `contract` directory.

To compile the contract:

1.  Ensure you have [Node.js] (version 12 or higher) installed.
2.  Navigate to the `contract` directory in your terminal.
3.  Run the build script:
    ```bash
    node compile.js
    ```
    This command executes the `npm run build` script defined in `contract/package.json`, which in turn uses the AssemblyScript compiler (`asc`) to build the contract.
4.  The compiled WASM file will be located at `contract/build/release/exapmle.wasm` (or `contract/build/debug/example.wasm` if compiled with the `--debug` flag).
5.  The `compile.js` script also creates a copy of the compiled WASM file at `out/main.wasm` in the root project directory, which is the standard location expected by `near-cli` for deployment.

Testing
=======

Smart contract tests can be run using the script defined in `contract/package.json` (typically `npm test` within the `contract` directory). This usually involves using a testing framework like [as-pect] for AssemblyScript.

Key Scripts in `contract/package.json` (example):
```json
"scripts": {
   "build:debug": "asb --target debug", // Or directly: asc assembly/index.ts --target debug --outFile build/debug/example.wasm ...
  "build": "asb", // Or directly: asc assembly/index.ts --target release --outFile build/release/example.wasm ...
  "build": "asb", // Or directly: asc assembly/index.ts --target release --outFile build/release/example.wasm ...
  "test": "asp --summary --verbose" // Or your specific test command
}
```
*(Note: `asb` and `asp` are common aliases for AssemblyScript build and test commands, actual commands might vary based on project setup)*

Deployment
==========

Once compiled, the smart contract (`out/main.wasm`) can be deployed to the NEAR blockchain using `near-cli`.

Example deployment command:
```bash
near deploy --accountId YOUR_ACCOUNT_ID --wasmFile out/main.wasm
```

Interacting with the Contract
=============================

After deployment, you can interact with the contract's methods using `near-cli` or through a frontend application that integrates with the NEAR JavaScript API.

Example `near-cli` call to create a poll:
```bash
near call YOUR_CONTRACT_ACCOUNT_ID createPoll '{"prompt": "Favorite Color?", "description": "Choose your favorite color.", "category": "General", "candidates": [{"name": "Red"}, {"name": "Blue"}], "durationDays": 1, "durationHours": 0}' --accountId YOUR_ACCOUNT_ID
```

  [smart contract]: https://docs.near.org/docs/develop/contracts/overview
  [AssemblyScript]: https://www.assemblyscript.org/
  [Node.js]: https://nodejs.org/en/download/package-manager/
  [as-pect]: https://www.npmjs.com/package/@as-pect/cli
  [create-near-app]: https://github.com/near/create-near-app
