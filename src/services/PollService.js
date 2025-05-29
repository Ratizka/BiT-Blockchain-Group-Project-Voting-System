// PollService.js - Service layer for interacting with the NEAR blockchain contract.
// This object encapsulates all contract calls related to poll management.

const pollService = {
  /**
   * Creates a new poll on the blockchain.
   * @param {Object} pollData - The data for the new poll.
   * @param {string} pollData.prompt - The main question or title of the poll (acts as a unique ID).
   * @param {string} pollData.description - A detailed description of the poll.
   * @param {string} pollData.category - The category of the poll.
   * @param {Array<Object>} pollData.candidates - Candidate objects (e.g., { name: string, description?: string }).
   * @param {number} pollData.durationDays - Poll duration in days.
   * @param {number} pollData.durationHours - Poll duration in hours.
   * @param {Array<string>} [pollData.tags] - Optional tags for the poll.
   * @returns {Promise<boolean>} - True on successful creation, otherwise throws an error.
   */
  async createPoll(pollData) {
    try {
      // Calls the 'createPoll' method on the smart contract.
      // Ensures field names match contract expectations.
      const result = await window.contract.createPoll({
        prompt: pollData.prompt,
        description: pollData.description,
        category: pollData.category,
        candidates: pollData.candidates, // Array of candidate objects.
        durationDays: parseInt(pollData.durationDays, 10), // Ensure integer.
        durationHours: parseInt(pollData.durationHours, 10), // Ensure integer.
        tags: pollData.tags || [] // Default to empty array if tags are absent.
      });
      return !!result; // True if transaction was successful.
    } catch (error) {
      console.error("PollService - Error creating poll:", error);
      throw error; // Rethrow for UI component handling.
    }
  },

  /**
   * Retrieves a specific poll by its ID (which is its prompt).
   * @param {string} pollId - The unique identifier (prompt) of the poll.
   * @returns {Promise<Object|null>} - The poll object if found, otherwise null.
   */
  async getPollById(pollId) {
    try {
      console.log(`[PollService - getPollById] Calling contract.getPoll with pollId: '${pollId}'`);
      const poll = await window.contract.getPoll({ pollId: pollId }); 
      
      if (!poll) {
        console.warn(`[PollService - getPollById] contract.getPoll('${pollId}') returned null or undefined. Poll may not exist.`);
        return null; // Poll not found.
      }
      console.log(`[PollService - getPollById] contract.getPoll('${pollId}') returned:`, poll);
      return poll; // Returns the fetched poll object.
    } catch (error) {
      console.error(`[PollService - getPollById] Error fetching poll with ID '${pollId}':`, error);
      return null; 
    }
  },

  /**
   * Retrieves all polls from the blockchain.
   * @returns {Promise<Array<Object>>} - An array of poll objects. Returns empty array on error or if no polls exist.
   */
  async getAllPolls() {
    try {
      // Calls the 'getAllPolls' method on the smart contract.
      const polls = await window.contract.getAllPolls();
      if (!polls) {
        console.warn("[PollService - getAllPolls] contract.getAllPolls() returned null or undefined.");
        return []; // No polls found or an issue with the contract method.
      }
      // Assumes the contract returns an array of Poll objects.
      // Filters out any potential null/undefined entries just in case.
      return polls.filter(Boolean);
    } catch (error) {
      console.error("[PollService - getAllPolls] Error getting all polls:", error);
      return []; // Return empty array on error to ensure consistent return type.
    }
  },

  /**
   * Retrieves polls filtered by a specific category.
   * @param {string} category - The category name to filter by.
   * @returns {Promise<Array<Object>>} - An array of poll objects matching the category. Empty array on error or no match.
   */
  async getPollsByCategory(category) {
    try {
      // Calls 'getPollsByCategory' on the contract.
      const polls = await window.contract.getPollsByCategory({ category });
      if (!polls) {
        console.warn(`[PollService - getPollsByCategory] contract.getPollsByCategory('${category}') returned null or undefined.`);
        return [];
      }
      return polls.filter(Boolean);
    } catch (error) {
      console.error(`[PollService - getPollsByCategory] Error getting polls for category '${category}':`, error);
      return [];
    }
  },

  /**
   * Submits a vote for a candidate in a specific poll.
   * @param {string} pollId - The ID (prompt) of the poll to vote in.
   * @param {number} candidateIndex - The index of the chosen candidate.
   * @returns {Promise<boolean>} - True if the vote was successfully recorded, otherwise throws an error.
   */
  async vote(pollId, candidateIndex) {
    try {
      // Calls the 'vote' method on the smart contract.
      console.log(`[PollService - vote] Calling contract.vote with pollId: '${pollId}', candidateIndex: ${candidateIndex}`);
      const result = await window.contract.vote({
        pollId: pollId, // Pass pollId (prompt) to the contract.
        candidateIndex: Number(candidateIndex) // Ensure candidateIndex is a number.
      });
      console.log("[PollService - vote] contract.vote result:", result);
      return !!result; // True if transaction was successful.
    } catch (error) {
      console.error("[PollService - vote] Error submitting vote:", error);
      throw error; // Rethrow for UI handling (e.g., display error message to user).
    }
  },

  /**
   * Checks if a specific user has already voted in a given poll.
   * @param {string} pollId - The ID (prompt) of the poll.
   * @param {string} userId - The account ID of the user.
   * @returns {Promise<boolean>} - True if the user has voted, false otherwise or on error.
   */
  async hasUserVoted(pollId, userId) {
    try {
      const result = await window.contract.hasUserVoted({
        pollId: pollId,
        userId
      });
      return !!result;
    } catch (error) {
      console.error(`[PollService - hasUserVoted] Error checking vote status for poll '${pollId}', user '${userId}':`, error);
      return false;
    }
  },

  /**
   * Retrieves the candidate index a user voted for in a specific poll.
   * @param {string} pollId - The ID (prompt) of the poll.
   * @param {string} userId - The account ID of the user.
   * @returns {Promise<number|null>} - The index of the candidate voted for, or null if not voted or on error.
   */
  async getUserVote(pollId, userId) {
    try {
      const result = await window.contract.getUserVote({
        pollId: pollId,
        userId
      });
      return (result !== undefined && result !== null && Number(result) >= 0) ? Number(result) : null;
    } catch (error) {
      console.error(`[PollService - getUserVote] Error getting user vote for poll '${pollId}', user '${userId}':`, error);
      return null;
    }
  },

  /**
   * Retrieves all polls created by a specific user.
   * @param {string} userId - The account ID of the user.
   * @returns {Promise<Array<Object>>} - An array of poll objects created by the user. Empty array on error or if none.
   */
  async getUserPolls(userId) {
    try {
      const polls = await window.contract.getUserPolls({ userId });
      if (!polls) {
        console.warn(`[PollService - getUserPolls] contract.getUserPolls('${userId}') returned null or undefined.`);
        return [];
      }
      return polls.filter(Boolean);
    } catch (error) {
      console.error(`[PollService - getUserPolls] Error getting polls for user '${userId}':`, error);
      return [];
    }
  },

  /**
   * Retrieves the voting history for a specific user.
   * This typically means a list of polls the user has participated in.
   * @param {string} userId - The account ID of the user.
   * @returns {Promise<Array<string>|Array<Object>>} - An array of poll IDs or vote records (contract dependent).
   */
  async getUserVoteHistory(userId) {
    try {
      const voteHistory = await window.contract.getUserVoteHistory({ userId });
      if (!voteHistory) {
        console.warn(`[PollService - getUserVoteHistory] contract.getUserVoteHistory('${userId}') returned null or undefined.`);
        return [];
      }
      return voteHistory;
    } catch (error) {
      console.error(`[PollService - getUserVoteHistory] Error getting vote history for user '${userId}':`, error);
      return [];
    }
  },

  /**
   * Pauses a poll, preventing further votes (owner action).
   * @param {string} pollId - The ID (prompt) of the poll to pause.
   * @returns {Promise<boolean>} - True if the poll was successfully paused, false otherwise (e.g., error, not owner).
   */
  async pausePoll(pollId) {
    try {
      const result = await window.contract.pausePoll({ pollId: pollId });
      return !!result;
    } catch (error) {
      console.error(`[PollService - pausePoll] Error pausing poll '${pollId}':`, error);
      return false;
    }
  },

  /**
   * Resumes a paused poll, allowing votes again (owner action).
   * @param {string} pollId - The ID (prompt) of the poll to resume.
   * @returns {Promise<boolean>} - True if the poll was successfully resumed, false otherwise.
   */
  async resumePoll(pollId) {
    try {
      const result = await window.contract.resumePoll({ pollId: pollId });
      return !!result;
    } catch (error) {
      console.error(`[PollService - resumePoll] Error resuming poll '${pollId}':`, error);
      return false;
    }
  },

  /**
   * Extends the duration of an active poll (owner action).
   * @param {string} pollId - The ID (prompt) of the poll to extend.
   * @param {number} additionalDays - Number of days to add to the duration.
   * @param {number} additionalHours - Number of hours to add to the duration.
   * @returns {Promise<boolean>} - True if poll duration was successfully extended, false otherwise.
   */
  async extendPoll(pollId, additionalDays, additionalHours) {
    try {
      const result = await window.contract.extendPoll({
        pollId: pollId,
        additionalDays: parseInt(additionalDays, 10),
        additionalHours: parseInt(additionalHours, 10)
      });
      return !!result;
    } catch (error) {
      console.error(`[PollService - extendPoll] Error extending poll '${pollId}':`, error);
      return false;
    }
  },

  /**
   * Deletes a poll from the blockchain (owner action).
   * @param {string} pollId - The ID (prompt) of the poll to delete.
   * @returns {Promise<boolean>} - True if the poll was successfully deleted, false otherwise.
   */
  async deletePoll(pollId) {
    try {
      const result = await window.contract.deletePoll({ prompt: pollId });
      return !!result;
    } catch (error) {
      console.error(`[PollService - deletePoll] Error deleting poll '${pollId}':`, error);
      return false;
    }
  }
};

export default pollService;