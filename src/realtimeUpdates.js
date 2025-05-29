/**
 * This is a mock WebSocket implementation for real-time updates
 * In a real implementation, this would connect to an actual WebSocket server
 */

class RealtimeUpdates {
  constructor() {
    this.subscribers = [];
    this.isConnected = false;
    this.mockData = {
      activePollCount: 5,
      totalVotes: 124,
      recentVotes: []
    };
    
    // Mock data for simulation
    this.mockPolls = [
      { id: 1, prompt: "Best programming language?", candidates: ["JavaScript", "Python"], votes: [12, 18] },
      { id: 2, prompt: "Favorite blockchain?", candidates: ["NEAR", "Ethereum"], votes: [24, 16] },
      { id: 3, prompt: "Best web framework?", candidates: ["React", "Vue"], votes: [31, 23] }
    ];
  }
  
  connect() {
    if (this.isConnected) return;
    
    console.log("Connecting to realtime updates...");
    this.isConnected = true;
    
    // Simulate periodic updates
    this.interval = setInterval(() => {
      // Simulate a new vote
      const pollIndex = Math.floor(Math.random() * this.mockPolls.length);
      const candidateIndex = Math.floor(Math.random() * 2);
      
      const poll = this.mockPolls[pollIndex];
      poll.votes[candidateIndex]++;
      
      this.mockData.totalVotes++;
      this.mockData.recentVotes.unshift({
        pollId: poll.id,
        pollPrompt: poll.prompt,
        candidateIndex: candidateIndex,
        candidateName: poll.candidates[candidateIndex],
        timestamp: new Date().toISOString()
      });
      
      // Keep only the last 5 votes
      if (this.mockData.recentVotes.length > 5) {
        this.mockData.recentVotes.pop();
      }
      
      // Notify all subscribers
      this.notifySubscribers({
        type: 'update',
        data: {
          poll: {
            id: poll.id,
            prompt: poll.prompt,
            votes: poll.votes
          },
          stats: {
            totalVotes: this.mockData.totalVotes,
            recentVotes: this.mockData.recentVotes
          }
        }
      });
      
    }, 5000); // Update every 5 seconds
    
    return Promise.resolve();
  }
  
  disconnect() {
    if (!this.isConnected) return;
    
    console.log("Disconnecting from realtime updates...");
    clearInterval(this.interval);
    this.isConnected = false;
    
    return Promise.resolve();
  }
  
  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    
    this.subscribers.push(callback);
    
    // Immediately send current data
    callback({
      type: 'initial',
      data: {
        polls: this.mockPolls,
        stats: {
          totalVotes: this.mockData.totalVotes,
          activePollCount: this.mockData.activePollCount,
          recentVotes: this.mockData.recentVotes
        }
      }
    });
    
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }
  
  notifySubscribers(message) {
    this.subscribers.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error("Error in subscriber callback:", error);
      }
    });
  }
}

// Create a singleton instance
const realtimeUpdates = new RealtimeUpdates();

export default realtimeUpdates;
