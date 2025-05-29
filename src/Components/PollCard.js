// PollCard.js - Component to display a single poll card
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { FaTag, FaRegThumbsUp, FaChevronRight, FaRegClock } from 'react-icons/fa';
import { parsePollDate, formatDate } from '../utils/dateUtils';
import { slugify } from '../utils'; // Corrected import path for slugify

const PollCard = ({ poll }) => {
  const history = useHistory();
  const [remainingTime, setRemainingTime] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  // Effect to calculate and update remaining time for the poll
  useEffect(() => {
    if (!poll || !poll.createdAt || !poll.durationNs) {
      setRemainingTime('Invalid date data');
      setIsExpired(true); // Assume expired if date info is missing
      return;
    }

    const createdAtMs = parsePollDate(String(poll.createdAt));
    let durationMs;

    try {
      // Convert duration from nanoseconds to milliseconds
      durationMs = poll.durationNs ? Number(BigInt(String(poll.durationNs)) / 1000000n) : 0;
    } catch (e) {
      console.error("[PollCard - Timer] Error converting durationNs:", e);
      setRemainingTime("Invalid duration");
      setIsExpired(true);
      return;
    }

    if (createdAtMs === null) {
      setRemainingTime('Invalid creation date');
      setIsExpired(true);
      return;
    }

    const expiryTimeMs = createdAtMs + durationMs;

    // Calculates remaining time and updates state
    const calculateRemaining = () => {
      const nowMs = new Date().getTime();
      const diffMs = expiryTimeMs - nowMs;

      if (diffMs <= 0) {
        setIsExpired(true);
        setRemainingTime('Poll Ended');
        return null; // Stop interval if poll expired
      }

      setIsExpired(false);
      const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const h = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      let timeStr = "";
      if (d > 0) timeStr += `${d}d `;
      if (h > 0 || d > 0) timeStr += `${h}h `;
      timeStr += `${m}m remaining`;
      
      setRemainingTime(timeStr.trim());
      return diffMs; // Continue interval
    };

    if (calculateRemaining() === null) return; // Initial check, stop if already expired
    
    // Set an interval to update remaining time every minute
    const intervalId = setInterval(() => {
      if (calculateRemaining() === null) {
        clearInterval(intervalId); // Clear interval if poll expires
      }
    }, 60000); 

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, [poll]);

  // Formats the total vote count for display
  const formatVoteCount = (votesArray) => {
    if (!votesArray || !Array.isArray(votesArray)) {
      return '0 votes';
    }
    const totalVotes = votesArray.reduce((acc, count) => acc + Number(count), 0);
    if (isNaN(totalVotes)) {
      return '0 votes';
    }
    return `${totalVotes} vote${totalVotes === 1 ? '' : 's'}`;
  };

  // Navigates to the detailed poll view
  const viewPollDetails = (originalPollPrompt) => {
    if (originalPollPrompt) {
      const slug = slugify(originalPollPrompt);
      history.push({
        pathname: `/poll/${slug}`,
        state: { pollId: originalPollPrompt } // Pass original prompt as state
      });
    } else {
      console.error("viewPollDetails: originalPollPrompt is undefined");
    }
  };

  // Do not render if poll data or its prompt (used as ID) is invalid
  if (!poll || !poll.prompt) {
    console.warn("Skipping render for invalid poll object (missing prompt) in PollCard:", poll);
    return null;
  }

  const voteDisplay = formatVoteCount(poll.votesCount);

  return (
    <div className="bg-slate-800/70 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300 ease-out flex flex-col relative">
      {/* Top section: Category and Timer */}
      <div className="absolute top-0 left-0 right-0 p-5 sm:p-6 flex justify-between items-start">
        <div className="flex items-center text-sm text-teal-400 font-medium bg-slate-900/50 px-2 py-1 rounded">
          <FaTag className="mr-2 opacity-80" />
          {poll.category || 'General'}
        </div>
        <div className={`text-xs px-2 py-1 rounded ${isExpired ? 'text-red-400 bg-red-900/50' : 'text-sky-300 bg-sky-900/50'}`}>
          {remainingTime}
        </div>
      </div>

      {/* Main Content: Title, Description, Date, Votes */}
      <div className="p-5 sm:p-6 flex-grow mt-10"> 
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-100 mb-3 min-h-[2.5em] break-words pt-2" title={poll.prompt}>
          {poll.prompt || 'Untitled Poll'}
        </h3>
        <p className="text-gray-400 text-sm mb-4 h-10 overflow-hidden">
          {poll.description || 'No description provided.'}
        </p>
        
        {/* Created Date and Vote Count */}
        <div className="space-y-2 text-sm mt-4">
          <p className="text-xs text-gray-400 min-h-[1.2em]">
            <FaRegClock className="inline mr-1" /> 
            Created: {poll.createdAt ? formatDate(parsePollDate(String(poll.createdAt))) : 'Date N/A'}
          </p>
          <div className="flex items-center text-gray-300">
            <FaRegThumbsUp className="mr-2 text-green-400 opacity-80" />
            {voteDisplay}
          </div>
        </div>
      </div>

      {/* Footer: View & Vote Button */}
      <div className="bg-slate-700/50 px-5 py-3 sm:px-6 sm:py-4 flex justify-end items-center">
        <button
          onClick={() => viewPollDetails(poll.prompt)}
          className="inline-flex items-center px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-opacity-75 transition-all duration-300 ease-in-out"
        >
          <FaChevronRight className="w-3 h-3 mr-1.5" />
          View & Vote
        </button>
      </div>
    </div>
  );
};

export default PollCard;