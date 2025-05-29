// index.ts - Revised Implementation
import { Context, PersistentMap, logging, PersistentVector } from "near-sdk-as";
import { Poll, Candidate, UserVoteRecord } from "./models";

// Storage for all polls - key: poll prompt (id), value: Poll object
const POLLS = new PersistentMap<string, Poll>("p");

// Track user votes to prevent double voting - key: userId_pollId, value: candidate index voted for
const USER_VOTES = new PersistentMap<string, i32>("uv");

// To efficiently list all poll IDs, especially for functions like getAllPolls, getUserPolls, etc.
// Storing IDs in a PersistentVector is more gas-efficient for iteration than getting all entries from a map.
const POLL_IDS = new PersistentVector<string>("pi");

/**
 * Creates a new poll.
 * @param prompt The question or topic of the poll. This will also serve as its unique ID.
 * @param description Additional context or information about the poll.
 * @param category The category of the poll (e.g., "politics", "sports").
 * @param candidates An array of candidate objects for the poll.
 * @param durationDays The duration of the poll in days.
 * @param durationHours The duration of the poll in hours.
 * @param tags Optional array of tags for the poll.
 * @returns boolean - True if the poll was created successfully, false otherwise.
 */
export function createPoll(
  prompt: string,
  description: string,
  category: string,
  candidates: Candidate[], // Expecting an array of Candidate objects
  durationDays: i32,
  durationHours: i32,
  tags: string[] = []
): boolean {
  // Ensure the poll prompt is unique
  if (POLLS.contains(prompt)) {
    logging.log("Poll with this prompt already exists.");
    return false;
  }

  // Validate candidates: must have at least 2 candidates
  if (candidates.length < 2) {
    logging.log("Poll must have at least two candidates.");
    return false;
  }

  // Validate duration: must be positive
  if (durationDays <= 0 && durationHours <= 0) {
    logging.log("Poll duration must be positive.");
    return false;
  }
  if (durationDays < 0 || durationHours < 0) {
    logging.log("Poll duration components cannot be negative.");
    return false;
  }

  const poll = new Poll(prompt, description, category, candidates, durationDays, durationHours, tags);
  POLLS.set(prompt, poll);
  POLL_IDS.push(prompt); // Add poll ID to the list
  logging.log("Poll created successfully: " + prompt);
  return true;
}

/**
 * Allows a user to vote on a poll.
 * @param pollId The ID (prompt) of the poll to vote on.
 * @param candidateIndex The index of the candidate to vote for.
 * @returns boolean - True if the vote was cast successfully, false otherwise.
 */
export function vote(pollId: string, candidateIndex: i32): boolean {
  const poll = POLLS.get(pollId);
  if (!poll) {
    logging.log("Poll not found: " + pollId);
    return false;
  }

  if (!poll.isActive) {
    logging.log("Poll is not active or has expired: " + pollId);
    return false;
  }

  const userId = Context.sender;
  const userVoteKey = userId + "_" + pollId;

  if (USER_VOTES.contains(userVoteKey)) {
    logging.log("User " + userId + " has already voted on poll " + pollId);
    return false;
  }

  if (!poll.recordVote(candidateIndex)) {
    // recordVote logs internally if candidateIndex is invalid
    logging.log("Failed to record vote for poll " + pollId + ". Invalid candidate index or other issue.");
    return false;
  }

  POLLS.set(pollId, poll); // Re-set the poll to save updated vote counts
  USER_VOTES.set(userVoteKey, candidateIndex);

  logging.log("User " + userId + " voted for candidate " + candidateIndex.toString() + " in poll " + pollId);
  return true;
}

/**
 * Retrieves a specific poll by its ID (prompt).
 * @param pollId The ID of the poll.
 * @returns Poll | null - The Poll object if found, otherwise null.
 */
export function getPoll(pollId: string): Poll | null {
  return POLLS.get(pollId);
}

/**
 * Retrieves all available polls.
 * This implementation returns an array of Poll objects.
 * Note: Retrieving all entries from a PersistentMap can be costly in terms of gas if the map is very large.
 * Consider pagination or more specific query methods for large datasets.
 * @returns Poll[] - An array of all Poll objects.
 */
export function getAllPolls(): Poll[] {
  const result: Poll[] = [];
  for (let i = 0; i < POLL_IDS.length; i++) {
    const pollId = POLL_IDS[i];
    const poll = POLLS.get(pollId);
    if (poll) {
      result.push(poll);
    }
  }
  return result;
}

/**
 * Checks if a user has already voted on a specific poll.
 * @param pollId The ID of the poll.
 * @param userId The account ID of the user.
 * @returns boolean - True if the user has voted, false otherwise.
 */
export function hasUserVoted(pollId: string, userId: string): boolean {
  const userVoteKey = userId + "_" + pollId;
  return USER_VOTES.contains(userVoteKey) == true; // Explicitly compare bool to true for boolean return
}

/**
 * Retrieves the candidate index a user voted for in a specific poll.
 * @param pollId The ID of the poll.
 * @param userId The account ID of the user.
 * @returns i32 - The index of the candidate voted for, or -1 if the user hasn't voted or poll doesn't exist.
 */
export function getUserVote(pollId: string, userId: string): i32 {
  const userVoteKey = userId + "_" + pollId;
  if (USER_VOTES.contains(userVoteKey)) {
    return USER_VOTES.getSome(userVoteKey);
  }
  return -1; // Indicates user hasn't voted
}

/**
 * Retrieves all polls created by a specific user.
 * @param userId The account ID of the user.
 * @returns Poll[] - An array of Poll objects created by the user.
 */
export function getUserPolls(userId: string): Poll[] {
  const userPolls: Poll[] = [];
  for (let i = 0; i < POLL_IDS.length; i++) {
    const pollId = POLL_IDS[i];
    const poll = POLLS.get(pollId);
    if (poll && poll.createdBy == userId) {
      userPolls.push(poll);
    }
  }
  return userPolls;
}

/**
 * Retrieves the voting history for a specific user.
 * This requires iterating through all polls and checking USER_VOTES, which can be inefficient.
 * A more robust solution might involve a dedicated PersistentMap or Vector for user vote history if this is a frequent query.
 * For this simplified version, we will construct UserVoteRecord objects.
 * @param userId The account ID of the user.
 * @returns UserVoteRecord[] - An array of UserVoteRecord objects.
 */
export function getUserVoteHistory(userId: string): UserVoteRecord[] {
  const history: UserVoteRecord[] = [];
  for (let i = 0; i < POLL_IDS.length; i++) {
    const pollId = POLL_IDS[i];
    const userVoteKey = userId + "_" + pollId;
    if (USER_VOTES.contains(userVoteKey)) {
      const candidateIndex = USER_VOTES.getSome(userVoteKey);
      history.push(new UserVoteRecord(pollId, candidateIndex));
    }
  }
  return history;
}

/**
 * Retrieves polls by a specific category.
 * @param category The category to filter polls by.
 * @returns Poll[] - An array of Poll objects matching the category.
 */
export function getPollsByCategory(category: string): Poll[] {
  const categorizedPolls: Poll[] = [];
  for (let i = 0; i < POLL_IDS.length; i++) {
    const pollId = POLL_IDS[i];
    const poll = POLLS.get(pollId);
    if (poll && poll.category == category) {
      categorizedPolls.push(poll);
    }
  }
  return categorizedPolls;
}

/**
 * Deletes a poll. Only the creator of the poll can delete it.
 * @param prompt The ID (prompt) of the poll to delete.
 * @returns boolean - True if the poll was deleted successfully, false otherwise.
 */
export function deletePoll(prompt: string): boolean {
  const poll = POLLS.get(prompt);
  if (!poll) {
    logging.log("Poll not found for deletion: " + prompt);
    return false;
  }

  if (poll.createdBy != Context.sender) {
    logging.log("Unauthorized: Only the creator (" + poll.createdBy + ") can delete poll " + prompt + ". Sender: " + Context.sender);
    return false;
  }

  // Remove from POLLS map
  POLLS.delete(prompt);

  // Remove from POLL_IDS vector
  let foundIndex = -1;
  for (let i = 0; i < POLL_IDS.length; i++) {
    if (POLL_IDS[i] == prompt) {
      foundIndex = i;
      break;
    }
  }

  if (foundIndex != -1) {
    // Efficiently remove by swapping with the last element and popping
    // This changes the order of POLL_IDS, which is generally fine if it's just used for iteration.
    if (POLL_IDS.length == 1 || foundIndex == POLL_IDS.length - 1) {
      POLL_IDS.pop();
    } else {
      // The swap_remove method in near-sdk-as does this:
      // it takes an index, replaces element at index with last element, then pops.
      POLL_IDS.swap_remove(foundIndex);
    }
  } else {
    // This case should ideally not happen if POLL_IDS is kept consistent with POLLS
    logging.log("Warning: Poll ID " + prompt + " not found in POLL_IDS vector during deletion, but was in POLLS map.");
  }
  
  // Consider cleaning up USER_VOTES associated with this pollId if necessary,
  // though this can be complex and gas-intensive. For now, focusing on poll removal.

  logging.log("Poll deleted successfully: " + prompt);
  return true;
}

// Functions like deletePoll, pausePoll, resumePoll, extendPoll from the original
// index.ts are not part of the core requirements in newpoll.md (Home, Create, Vote, View).
// They can be added back if needed, with proper logic for permissions (e.g., createdBy checks)
// and state management (e.g., poll status like 'paused', 'active', 'expired').
// For now, they are omitted to keep the contract aligned with the simplified newpoll.md description.
