import { context, PersistentVector } from "near-sdk-as";

// @nearBindgen decorator should be available globally based on your as-types.d.ts
@nearBindgen
export class Candidate {
  name: string;
  slogan: string;
  description: string;
  imageUrl: string;

  constructor(name: string, slogan: string = "", description: string = "", imageUrl: string = "") {
    this.name = name;
    this.slogan = slogan;
    this.description = description;
    this.imageUrl = imageUrl;
  }
}

@nearBindgen
export class Poll {
  id: string; // Unique identifier for the poll, using the prompt
  prompt: string;
  description: string;
  createdBy: string; // Account ID of the poll creator
  category: string;
  tags: string[];
  createdAt: u64; // Timestamp of creation (nanoseconds) - u64 is a global type
  durationNs: u64; // Duration in nanoseconds - u64 is a global type

  candidatesList: Candidate[];
  votesCount: u64[]; // u64 is a global type


  constructor(
    prompt: string,
    description: string,
    category: string,
    initialCandidates: Candidate[],
    durationDays: i32,
    durationHours: i32,
    tags: string[]
  ) {
    this.id = prompt; // Use prompt as the unique ID for simplicity
    this.prompt = prompt;
    this.description = description;
    this.createdBy = context.sender;
    this.category = category;
    this.tags = tags;
    this.createdAt = context.blockTimestamp;

    const daysToNs = <u64>durationDays * 24 * 60 * 60 * 1_000_000_000;
    const hoursToNs = <u64>durationHours * 60 * 60 * 1_000_000_000;
    this.durationNs = daysToNs + hoursToNs;

    this.candidatesList = initialCandidates;
    this.votesCount = new Array<u64>(initialCandidates.length);
    for (let i = 0; i < initialCandidates.length; i++) {
      this.votesCount[i] = 0; // Initialize with 0 as u64
    }
  }

  get expiresAt(): u64 {
    return this.createdAt + this.durationNs;
  }

  get isActive(): boolean {
    return context.blockTimestamp < this.expiresAt;
  }

  // Method to record a vote for a candidate
  recordVote(candidateIndex: i32): boolean {
    if (candidateIndex < 0 || candidateIndex >= this.candidatesList.length) {
      // Index out of bounds
      return false;
    }
    if (!this.isActive) {
      // Poll is not active (expired)
      return false;
    }
    this.votesCount[candidateIndex] = this.votesCount[candidateIndex] + 1;
    return true;
  }
}

@nearBindgen
export class UserVoteRecord {
  pollId: string; // The ID of the poll (prompt)
  candidateIndex: i32; // The index of the candidate voted for

  constructor(pollId: string, candidateIndex: i32) {
    this.pollId = pollId;
    this.candidateIndex = candidateIndex;
  }
}