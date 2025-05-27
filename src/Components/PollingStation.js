// PollingStation.js - Component for displaying and interacting with a single poll.

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import pollService from '../services/PollService'; // Service for blockchain interactions.
import { login, logout } from '../utils'; // Authentication utilities.
import { FaArrowLeft, FaRegClock, FaUsers, FaCheckCircle, FaRegCircle, FaSpinner, FaChartBar, FaEdit, FaTrashAlt, FaPauseCircle, FaPlayCircle, FaPlusSquare, FaExclamationTriangle } from 'react-icons/fa'; // Icons.
import { parsePollDate, formatRemainingTime, formatDate } from '../utils/dateUtils'; // Date utility functions.
import './PollingStation.css'; // Specific styles for this component.

// Main functional component for the Polling Station page.
const PollingStation = () => {
  // React Router hooks for accessing URL parameters (pollId) and navigation history.
  const { id: pollIdFromParams } = useParams(); // Extracts route parameter 'id' as pollIdFromParams.
  const history = useHistory(); // Access to browser history for navigation.

  // State variables for managing poll data, UI, and interaction logic.
  const [poll, setPoll] = useState(null); // Stores the fetched poll object.
  const [isLoading, setIsLoading] = useState(true); // Tracks loading state for data fetching.
  const [error, setError] = useState(''); // Stores error messages for display.
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(null); // Index of the candidate selected by the user.
  const [isVoting, setIsVoting] = useState(false); // Tracks if a vote submission is in progress.
  const [hasVoted, setHasVoted] = useState(false); // Tracks if the current user has already voted in this poll.
  const [userVote, setUserVote] = useState(null); // Stores the candidate index the user voted for, if any.
  const [showResults, setShowResults] = useState(false); // Controls visibility of poll results.
  const [isExpired, setIsExpired] = useState(false); // Tracks if the poll's voting duration has ended.
  const [remainingTime, setRemainingTime] = useState(''); // Formatted string of time remaining for the poll.
  const [isOwner, setIsOwner] = useState(false); // Tracks if the current user is the owner of the poll.
  const [isPaused, setIsPaused] = useState(false); // Tracks if the poll is currently paused by the owner. (Didn't use isPaused due to the way the contract is set up, but kept for future use and aslo to avoid exploitation of the contract.)
  const [showExtendModal, setShowExtendModal] = useState(false); // Controls visibility of the extend poll duration modal. (Didn't use showExtendModal due to the way the contract is set up, but kept for future use and also to avoid exploitation of the contract.)
  const [extendDays, setExtendDays] = useState(0); // Days to extend poll by. (Didn't use extendDays due to the way the contract is set up, but kept for future use and also to avoid exploitation of the contract.)
  const [extendHours, setExtendHours] = useState(0); // Hours to extend poll by. (Didn't use extendHours due to the way the contract is set up, but kept for future use and also to avoid exploitation of the contract.)

  // CSS classes for consistent button styling, promoting reusability and maintainability.
  const primaryButtonClasses = "px-4 py-2 rounded-lg font-semibold transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-75 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 focus:ring-teal-400";
  const secondaryButtonClasses = "px-4 py-2 rounded-lg font-semibold transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-75 bg-slate-600 hover:bg-slate-500 text-gray-200 shadow-sm hover:shadow-md focus:ring-slate-400";
  const dangerButtonClasses = "px-4 py-2 rounded-lg font-semibold transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-75 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 focus:ring-red-400";

  // Utility function to check if the user is logged in by verifying window.accountId.
  const isLoggedIn = !!window.accountId;

  // Callback to fetch poll details from the blockchain using the pollId from URL parameters.
  // Uses useCallback to memoize the function, preventing unnecessary re-renders if pollIdFromParams doesn't change.
  const fetchPollDetails = useCallback(async () => {
    setIsLoading(true); // Set loading state to true before fetching.
    setError(''); // Clear any previous errors.

    // Validate that pollIdFromParams is available before attempting to fetch.
    if (!pollIdFromParams) {
      console.error("[PollingStation - fetchPollDetails] pollIdFromParams is undefined. Cannot fetch poll.");
      setError('Poll ID is missing. Cannot load poll details.');
      setIsLoading(false);
      setPoll(null);
      return; // Exit if pollId is not available.
    }

    try {
      // Attempt to fetch poll data using the pollService.
      console.log(`[PollingStation - fetchPollDetails] Fetching poll with ID: '${pollIdFromParams}'`);
      const pollData = await pollService.getPollById(pollIdFromParams);
      if (pollData) {
        setPoll(pollData); // Store fetched poll data in state.
        console.log(`[PollingStation - fetchPollDetails] Successfully fetched poll:`, pollData);
      } else {
        // Handle case where pollData is null or undefined (poll not found by service).
        setError('Poll not found or could not be loaded.');
        setPoll(null); // Ensure poll state is null if not found.
        console.warn(`[PollingStation - fetchPollDetails] Poll with ID '${pollIdFromParams}' not found by service.`);
      }
    } catch (err) {
      // Handle any errors during the fetch operation.
      console.error(`[PollingStation - fetchPollDetails] Error fetching poll details for ID '${pollIdFromParams}':`, err);
      setError(`Failed to load poll: ${err.message}`);
      setPoll(null); // Ensure poll state is null on error.
    }
    setIsLoading(false); // Set loading state to false after fetching (or on error).
  }, [pollIdFromParams]); // Dependency: pollIdFromParams. Re-fetches if this URL parameter changes.

  // Effect hook: Fetches poll details when the component mounts or when pollIdFromParams (from URL) changes.
  useEffect(() => {
    fetchPollDetails();
  }, [fetchPollDetails]); // Dependency: memoized fetchPollDetails callback.

  // Effect hook: Checks if the current user has already voted in this poll.
  // Runs when poll data is available, user is logged in, and pollIdFromParams is valid.
  useEffect(() => {
    if (poll && isLoggedIn && pollIdFromParams) {
      const checkVoteStatus = async () => {
        try {
          // Call pollService to get the user's vote for the current poll.
          // The service should return the index of the candidate voted for, or null/undefined if not voted.
          const votedCandidateIndex = await pollService.getUserVote(pollIdFromParams, window.accountId);
          if (votedCandidateIndex !== null && votedCandidateIndex !== undefined && votedCandidateIndex >= 0) {
            setHasVoted(true); // User has voted.
            setUserVote(votedCandidateIndex); // Store which candidate the user voted for.
            setSelectedCandidateIndex(votedCandidateIndex); // Pre-select the voted candidate in the UI.
          } else {
            setHasVoted(false); // User has not voted.
            setUserVote(null);
          }
        } catch (error) {
          // Log error but avoid setting a general error that might confuse the user or overwrite other critical errors.
          console.error(`[PollingStation - checkVoteStatus] Error checking vote status for poll '${pollIdFromParams}':`, error);
        }
      };
      checkVoteStatus();
    }
  }, [poll, isLoggedIn, pollIdFromParams]); // Dependencies: poll data, login status, and poll ID from URL.

  // Effect hook: Calculates and updates the poll's remaining time and expiration status.
  // Runs when poll data (specifically poll.endsAt) is available.
  // Sets up an interval to update the remaining time display periodically.
  useEffect(() => {
    let intervalId; // Declare intervalId here

    // Ensure poll and poll.endsAt are valid before proceeding.
    if (!poll || !poll.durationNs || !poll.createdAt) { // Using durationNs and createdAt to calculate endsAt
      setIsExpired(true); // If no end date info, consider it expired or invalid.
      setRemainingTime('End date not available');
      return;
    }

    // Parse createdAt and duration to calculate expiry time.
    const createdAtMs = parsePollDate(String(poll.createdAt));
    let durationMs;
    try {
      durationMs = poll.durationNs ? Number(BigInt(String(poll.durationNs)) / 1000000n) : 0;
    } catch (e) {
      console.error("[PollingStation - Timer] Error converting durationNs:", e);
      setIsExpired(true);
      setRemainingTime("Invalid duration");
      return;
    }

    if (createdAtMs === null) {
        setIsExpired(true);
        setRemainingTime("Invalid creation date");
        return;
    }
    const expiryTimeMs = createdAtMs + durationMs;
    const endsAtDate = new Date(expiryTimeMs);


    // Function to update remaining time and expiration status.
    const updateRemainingTime = () => {
      const now = new Date();
      if (now >= endsAtDate) {
        setIsExpired(true); // Poll has expired.
        setRemainingTime('Poll has ended');
        if (intervalId) clearInterval(intervalId); // Check if intervalId is defined before clearing
      } else {
        setIsExpired(false); // Poll is active.
        setRemainingTime(formatRemainingTime(endsAtDate)); // Format and set remaining time.
      }
    };

    updateRemainingTime(); // Initial call to set time immediately.
    intervalId = setInterval(updateRemainingTime, 1000); // Assign to the higher-scoped intervalId

    // Cleanup function: Clears the interval when the component unmounts or poll data changes.
    return () => {
      if (intervalId) clearInterval(intervalId); // Check if intervalId is defined before clearing
    };
  }, [poll]); // Dependency: poll object. Re-calculates if poll data changes.

  // Effect hook: Determines if the current logged-in user is the owner of the poll and sets the poll's pause status.
  // Runs when poll data is available.
  useEffect(() => {
    if (poll && window.accountId) {
      // Check if the current user's account ID matches the poll owner's ID.
      setIsOwner(poll.owner === window.accountId);
    }
    if (poll) {
      // Set the pause status based on poll.isPaused, defaulting to false if undefined. (See comment above about isPaused.)
      setIsPaused(poll.isPaused || false);
    }
  }, [poll]); // Dependency: poll object. Re-evaluates if poll data changes.

  // Handler for submitting a vote.
  // Validates conditions (login, selection, poll status) before calling the pollService.
  const handleVote = async () => {
    // Check 1: User must be logged in.
    if (!isLoggedIn) {
      setError("Please log in to vote.");
      login(); // Prompt user to log in via utility function.
      return;
    }
    // Check 2: Various conditions that prevent voting.
    if (selectedCandidateIndex === null || isVoting || hasVoted || isExpired || !pollIdFromParams || isPaused) {
      console.warn("[PollingStation - handleVote] Vote attempt blocked due to conditions:", {
        selectedCandidateIndex, isVoting, hasVoted, isExpired, pollId: pollIdFromParams, isPaused
      });
      if (selectedCandidateIndex === null) setError("Please select a candidate before submitting your vote.");
      else if (hasVoted) setError("You have already voted in this poll.");
      else if (isExpired) setError("This poll has already expired.");
      else if (isPaused) setError("This poll is currently paused and not accepting votes.");
      return;
    }
    
    setIsVoting(true); // Indicate that vote submission is in progress.
    setError(''); // Clear previous errors.
    const currentAccountId = window.accountId; // Get current user's account ID.
    // Keys for sessionStorage to manage optimistic UI updates across page refreshes/navigation.
    const optimisticFlagKey = `lastVotedPoll_${pollIdFromParams}_${currentAccountId}`;
    const optimisticIndexKey = `optimisticVoteIndex_${pollIdFromParams}_${currentAccountId}`;

    try {
      console.log(`[PollingStation - handleVote] Attempting to vote for candidate ${selectedCandidateIndex} in poll '${pollIdFromParams}' by user '${currentAccountId}'`);
      // Call pollService to submit the vote.
      await pollService.vote(pollIdFromParams, selectedCandidateIndex);
      console.log(`[PollingStation - handleVote] Vote successful for poll '${pollIdFromParams}'.`);
      
      // Optimistically update UI: set vote status and show results immediately.
      setHasVoted(true);
      setUserVote(selectedCandidateIndex);
      setShowResults(true);
      
      // Store optimistic vote details in sessionStorage to persist this state.
      sessionStorage.setItem(optimisticFlagKey, Date.now().toString());
      sessionStorage.setItem(optimisticIndexKey, selectedCandidateIndex.toString());
      
      // Optimistically update local poll vote counts for immediate UI feedback.
      if (poll && poll.votesCount && poll.votesCount[selectedCandidateIndex] !== undefined) {
        const updatedPoll = { ...poll }; // Shallow copy the poll object.
        updatedPoll.votesCount = [...poll.votesCount]; // Shallow copy the votesCount array.
        // Increment the vote count for the selected candidate. Assumes counts are strings representing BigInts.
        updatedPoll.votesCount[selectedCandidateIndex] = (BigInt(updatedPoll.votesCount[selectedCandidateIndex]) + 1n).toString();
        setPoll(updatedPoll); // Update the local poll state.
      }

    } catch (err) {
      // Handle errors during vote submission.
      console.error(`[PollingStation - handleVote] Error voting in poll '${pollIdFromParams}':`, err);
      setError(`Vote failed: ${err.message || 'Unknown error'}`);
      // Clear optimistic flags from sessionStorage if the vote failed.
      sessionStorage.removeItem(optimisticFlagKey);
      sessionStorage.removeItem(optimisticIndexKey);
    } finally {
      setIsVoting(false); // Reset voting in progress flag.
    }
  };

  // Handler to toggle the display of poll results.
  const handleShowResults = () => {
    setShowResults(prevShowResults => !prevShowResults); // Toggle boolean state.
  };

  // Handler for pausing the poll (owner action).
  // Validates ownership before calling the pollService.
  const handlePausePoll = async () => {
    if (!isOwner || !pollIdFromParams) return; // Only owner can pause.
    
    try {
      setIsVoting(true); // Use isVoting to disable other actions during this operation.
      await pollService.pausePoll(pollIdFromParams);
      setIsPaused(true); // Update local pause state.
      // Optionally, refresh poll details here to get the latest state from contract if needed.
      // fetchPollDetails(); 
      console.log(`[PollingStation - handlePausePoll] Poll '${pollIdFromParams}' paused.`);
    } catch (err) {
      console.error(`[PollingStation - handlePausePoll] Error pausing poll '${pollIdFromParams}':`, err);
      setError(`Failed to pause poll: ${err.message || 'Unknown error'}`);
    } finally {
      setIsVoting(false);
    }
  };

  // Handler for resuming a paused poll (owner action).
  // Validates ownership before calling the pollService.
  const handleResumePoll = async () => {
    if (!isOwner || !pollIdFromParams) return; // Only owner can resume.
    
    try {
      setIsVoting(true); // Use isVoting to disable other actions.
      await pollService.resumePoll(pollIdFromParams);
      setIsPaused(false); // Update local pause state.
      // Optionally, refresh poll details.
      // fetchPollDetails();
      console.log(`[PollingStation - handleResumePoll] Poll '${pollIdFromParams}' resumed.`);
    } catch (err) {
      console.error(`[PollingStation - handleResumePoll] Error resuming poll '${pollIdFromParams}':`, err);
      setError(`Failed to resume poll: ${err.message || 'Unknown error'}`);
    } finally {
      setIsVoting(false);
    }
  };

  // Handler for initiating poll duration extension (owner action).
  // Shows the modal for extending poll duration.
  const handleExtendPoll = () => {
    if (!isOwner) return; // Only owner can extend.
    setShowExtendModal(true); // Open the extension modal.
  };

  // Handler for confirming and submitting poll duration extension (owner action).
  // Validates ownership and input values before calling pollService.
  const submitExtendPoll = async () => {
    if (!isOwner || !pollIdFromParams) return; // Only owner can submit.
    if (extendDays <= 0 && extendHours <= 0) {
        setError("Please enter a valid duration (days or hours) to extend the poll.");
        return;
    }
    
    try {
      setIsVoting(true); // Disable other actions.
      // Call pollService to extend the poll duration.
      // Note: The service expects additionalDays and additionalHours as numbers.
      await pollService.extendPoll(pollIdFromParams, extendDays, extendHours);
      setShowExtendModal(false); // Close modal on success.
      setExtendDays(0); // Reset input fields.
      setExtendHours(0);
      // Refresh poll details to reflect the new duration/end time.
      fetchPollDetails(); 
      console.log(`[PollingStation - submitExtendPoll] Poll '${pollIdFromParams}' extended by ${extendDays}d ${extendHours}h.`);
    } catch (err) {
      console.error(`[PollingStation - submitExtendPoll] Error extending poll '${pollIdFromParams}':`, err);
      setError(`Failed to extend poll: ${err.message || 'Unknown error'}`);
    } finally {
      setIsVoting(false);
    }
  };

  // Handler for deleting the poll (owner action).
  // Prompts for confirmation before calling pollService.
  const handleDeletePoll = async () => {
    if (!isOwner || !pollIdFromParams) return; // Only owner can delete.
    
    // Confirm with the user before proceeding with deletion.
    if (window.confirm("Are you sure you want to delete this poll? This action cannot be undone.")) {
      try {
        setIsVoting(true); // Disable other actions.
        await pollService.deletePoll(pollIdFromParams);
        console.log(`[PollingStation - handleDeletePoll] Poll '${pollIdFromParams}' deleted.`);
        history.push('/'); // Redirect to home page after successful deletion.
      } catch (err) {
        console.error(`[PollingStation - handleDeletePoll] Error deleting poll '${pollIdFromParams}':`, err);
        setError(`Failed to delete poll: ${err.message || 'Unknown error'}`);
      } finally {
        setIsVoting(false);
      }
    }
  };

  // Conditional rendering: Display loading spinner while data is being fetched.
  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <FaSpinner className="animate-spin text-6xl text-teal-400" />
      </div>
    );
  }

  // Conditional rendering: Display error message if poll data couldn't be fetched and poll state is null.
  if (error && !poll) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-gray-100 p-4">
        <FaExclamationTriangle className="text-5xl text-red-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Poll</h2>
        <p className="text-red-400 text-center max-w-md">{error}</p>
        <button
          onClick={() => history.push('/')} // Navigate to home page.
          className={`${secondaryButtonClasses} mt-6`}
        >
          Go to Home
        </button>
      </div>
    );
  }

  // Conditional rendering: Display message if poll data is not available (e.g., pollId invalid, poll deleted).
  // This should ideally be covered by the error state if fetching failed.
  if (!poll) {
     return (
      <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-gray-100 p-4">
        <FaExclamationTriangle className="text-5xl text-yellow-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Poll Not Available</h2>
        <p className="text-yellow-300 text-center max-w-md">
          The poll you are looking for could not be found or is no longer available.
          {/* Display pollId if available, for debugging or user reference. */}
          {pollIdFromParams ? ` (ID: ${pollIdFromParams})` : ''}
        </p>
        <button
          onClick={() => history.push('/')} // Navigate to home page.
          className={`${secondaryButtonClasses} mt-6`}
        >
          Go to Home
        </button>
      </div>
    );
  }
  
  // Calculate total votes for display purposes. Sums up vote counts for all candidates.
  // Assumes poll.votesCount is an array of numbers (or strings convertible to numbers).
  const totalVotes = poll.votesCount ? poll.votesCount.reduce((acc, count) => acc + Number(count), 0) : 0;

  // Main component JSX structure for displaying the poll.
  return (
    // Page container with background gradient and padding.
    <div className="min-h-[calc(100vh-120px)] bg-gradient-to-br from-slate-900 to-slate-800 text-gray-100 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Container for the poll content, centered with a max width, shadow, and rounded corners. */}
      <div className="max-w-3xl mx-auto bg-slate-800 shadow-2xl rounded-xl overflow-hidden">
        {/* Header Section: Contains back button, poll title, owner, description, and metadata. */}
        <div className="p-6 sm:p-8 border-b border-slate-700">
          {/* Back button to navigate to the previous page in browser history. */}
          <button
            onClick={() => history.goBack()}
            className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 mb-4 transition-colors"
          >
            <FaArrowLeft className="mr-2" /> Back
          </button>
          {/* Poll Prompt (Title): Displayed with a gradient text effect. */}
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-400 to-green-400 mb-2 break-words">
            {poll.prompt}
          </h1>
          {/* Poll Owner Information: Displays the creator of the poll. */}
          <p className="text-gray-400 text-sm mb-1">
            Created by: <span className="font-medium text-gray-300">{poll.owner || 'N/A'}</span>
            {/* Display "(You)" if the current logged-in user is the owner. */}
            {isOwner && <span className="text-xs text-teal-400 ml-1">(You)</span>}
          </p>
          {/* Poll Category and Creation Date: Provides context about the poll. */}
          <div className="text-xs text-gray-500 mb-3">
            <span>Category: <span className="font-semibold text-gray-400">{poll.category || 'General'}</span></span>
            <span className="mx-2">|</span>
            {/* Display formatted creation date using utility functions. */}
            <span>Created: <span className="font-semibold text-gray-400">{formatDate(parsePollDate(String(poll.createdAt)))}</span></span>
          </div>
          {/* Poll Description: Detailed information about the poll. */}
          <p className="text-gray-300 mt-1 text-sm mb-3 min-h-[1.25em]">
            {poll.description || 'No description available.'} {/* Fallback if description is empty. */}
          </p>
          
          {/* Enhanced Poll Metadata Section */}
          <div className="mt-4 space-y-3 text-sm">
            {/* Row 1: Status & Remaining Time */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center">
                <span className="text-gray-400 mr-2 font-medium">Status:</span>
                {isPaused ? <span className="font-semibold text-yellow-400 py-0.5 px-2 rounded-full bg-yellow-900/50">Paused</span> :
                 isExpired ? <span className="font-semibold text-red-400 py-0.5 px-2 rounded-full bg-red-900/50">Ended</span> :
                 <span className="font-semibold text-green-400 py-0.5 px-2 rounded-full bg-green-900/50">Active</span>}
              </div>
              {!isExpired && !isPaused && poll.durationNs && poll.createdAt && (
                <div className="flex items-center">
                  <FaRegClock className="mr-1.5 text-sky-400" />
                  <span className="text-gray-300">{remainingTime || 'Calculating...'}</span>
                </div>
              )}
            </div>
            
            {/* Row 2: Total Votes & Tags */}
            <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
              <div className="flex items-center">
                <FaUsers className="mr-1.5 text-purple-400" />
                <span className="text-gray-300">{Number(totalVotes).toLocaleString()} Total Votes</span>
              </div>
              {poll.tags && poll.tags.length > 0 && (
                <div className="flex items-center flex-wrap">
                  <span className="text-gray-400 mr-2 font-medium">Tags:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {poll.tags.map((tag, index) => (
                      <span key={index} className="inline-block bg-slate-700 hover:bg-slate-600 text-teal-300 text-xs font-semibold px-2.5 py-1 rounded-full cursor-default">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Display error messages related to voting actions (e.g., "Please select a candidate"), if any, and not currently in the process of a blockchain transaction. */}
          {error && !isVoting && <p className="mt-4 text-sm text-red-400 bg-red-900/30 p-3 rounded-md">{error}</p>}
        </div>

        {/* Owner Actions Section: Visible only if the current user is the poll owner. */}
        {/* Provides controls for managing the poll (edit, delete, pause/resume, extend). */}
        {isOwner && (
          <div className="p-4 sm:p-6 bg-slate-850 border-b border-slate-700">
            {/* Container for owner action buttons, laid out with flexbox and wrapping. */}
            <div className="flex flex-wrap gap-4">
              {/* Edit Poll Button: Navigates to the poll editing page (functionality to be implemented). */}
              <button
                onClick={() => history.push(`/polls/edit/${pollIdFromParams}`)} // Placeholder for edit navigation.
                className={`${primaryButtonClasses} flex-1 min-w-[120px]`} // Styling classes.
                title="Edit poll details (feature coming soon)" // Tooltip for future feature.
              >
                <FaEdit className="mr-2" /> Edit Poll
              </button>
              {/* Delete Poll Button: Triggers handleDeletePoll handler. */}
              <button
                onClick={handleDeletePoll}
                className={`${dangerButtonClasses} flex-1 min-w-[120px]`}
              >
                <FaTrashAlt className="mr-2" /> Delete Poll
              </button>
              {/* Pause/Resume Poll Button: Toggles poll pause state via handlers. */}
              <button
                onClick={isPaused ? handleResumePoll : handlePausePoll}
                className={`${primaryButtonClasses} flex-1 min-w-[120px]`}
              >
                {isPaused ? <><FaPlayCircle className="mr-2" /> Resume Poll</> : <><FaPauseCircle className="mr-2" /> Pause Poll</>}
              </button>
              {/* Extend Poll Button: Triggers handleExtendPoll handler to show modal. */}
              <button
                onClick={handleExtendPoll}
                className={`${primaryButtonClasses} flex-1 min-w-[120px]`}
              >
                <FaPlusSquare className="mr-2" /> Extend Poll
              </button>
            </div>
            {/* Display current poll status: Active, Paused, or Expired, for owner's reference. */}
            <div className="mt-4 text-center">
              <span className={`text-xs font-semibold ${isExpired ? 'text-red-400' : isPaused ? 'text-yellow-400' : 'text-green-400'}`}>
                {isExpired ? 'This poll has expired.' : isPaused ? 'This poll is currently paused.' : 'This poll is active.'}
              </span>
            </div>
          </div>
        )}

        {/* Extend Poll Modal: Shown when showExtendModal is true and user is owner. */}
        {/* Allows the poll owner to extend the poll's duration. */}
        {showExtendModal && isOwner && (
          // Modal overlay, covering the page.
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            {/* Modal content container. */}
            <div className="bg-slate-800 rounded-lg shadow-lg p-6 sm:p-8 max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4 text-gray-200">Extend Poll Duration</h2>
              <p className="text-sm text-gray-400 mb-4">
                Specify additional days and/or hours to extend the poll. The current poll will be updated with the new duration.
              </p>
              {/* Input fields for days and hours. */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="extendDaysInput" className="block text-sm font-medium text-gray-300 mb-1">Days:</label>
                  <input
                    id="extendDaysInput"
                    type="number"
                    min="0" // Minimum value for days.
                    value={extendDays}
                    onChange={(e) => setExtendDays(Math.max(0, parseInt(e.target.value, 10) || 0))} // Update state, ensure non-negative.
                    className="px-4 py-2 rounded-lg w-full bg-slate-700 text-gray-200 focus:ring-2 focus:ring-teal-400 focus:outline-none"
                    placeholder="Enter number of days"
                  />
                </div>
                <div>
                  <label htmlFor="extendHoursInput" className="block text-sm font-medium text-gray-300 mb-1">Hours:</label>
                  <input
                    id="extendHoursInput"
                    type="number"
                    min="0" // Minimum value for hours.
                    max="23" // Maximum value for hours (part of a day).
                    value={extendHours}
                    onChange={(e) => setExtendHours(Math.max(0, Math.min(23, parseInt(e.target.value, 10) || 0)))} // Update state, ensure 0-23 range.
                    className="px-4 py-2 rounded-lg w-full bg-slate-700 text-gray-200 focus:ring-2 focus:ring-teal-400 focus:outline-none"
                    placeholder="Enter number of hours"
                  />
                </div>
              </div>
              {/* Modal action buttons: Cancel and Extend Poll. */}
              <div className="mt-6 flex justify-end gap-4">
                <button
                  onClick={() => setShowExtendModal(false)} // Close modal.
                  className={`${secondaryButtonClasses} flex-1`}
                >
                  Cancel
                </button>
                <button
                  onClick={submitExtendPoll} // Submit extension.
                  className={`${primaryButtonClasses} flex-1`}
                  disabled={isVoting || (extendDays <= 0 && extendHours <= 0)} // Disable if processing or no duration entered.
                >
                  {isVoting ? <FaSpinner className="animate-spin mr-2" /> : null} Extend Poll
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Interaction Area: Login Prompt, Expired/Paused Message, Voting Interface, or Results Display. */}
        {/* This section conditionally renders different UI based on poll state (expired, voted, paused) and user status (logged in). */}
        <div className="p-6 sm:p-8">
          {/* Condition 1: User not logged in, poll is active (not expired, not paused), and results are not currently shown. */}
          {/* Prompts the user to log in to participate in an active poll. */}
          {!isLoggedIn && !isExpired && !isPaused && !showResults && (
            <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg text-center">
              <p className="text-blue-300 mb-3">You need to log in to vote.</p>
              <button onClick={login} className={primaryButtonClasses}>
                Login
              </button>
            </div>
          )}

          {/* Condition 2: Poll is expired, and results are not yet shown. */}
          {/* Allows viewing results for an expired poll. */}
          {isExpired && !showResults && (
            <div className="text-center py-6">
                <p className="text-xl font-semibold text-red-400 mb-4">This poll has ended.</p>
                <button onClick={() => setShowResults(true)} className={secondaryButtonClasses}>
                    View Results
                </button>
            </div>
          )}

          {/* Condition 3: Poll is paused by the owner, and results are not yet shown. */}
          {/* Informs user that the poll is paused and allows viewing results if available. */}
          {isPaused && !showResults && (
            <div className="text-center py-6">
                <p className="text-xl font-semibold text-yellow-400 mb-4">This poll is currently paused.</p>
                {/* Allow viewing results even if paused, as votes might exist. */}
                <button onClick={() => setShowResults(true)} className={secondaryButtonClasses}>
                    View Results
                </button>
            </div>
          )}

          {/* Condition 4: Voting Interface - Poll is active (not expired, not paused), user logged in, and not currently showing results. */}
          {/* Displays candidate selection and vote submission button. */}
          {!showResults && !isExpired && !isPaused && isLoggedIn && (
            <div>
              {/* Section title: "Cast Your Vote" or "You've Voted For:" based on hasVoted state. */}
              <h2 className="text-xl font-semibold mb-5 text-gray-200">
                {hasVoted ? "You've Voted For:" : "Cast Your Vote:"}
              </h2>
              {/* Grid for displaying candidate buttons. Responsive columns. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {/* Map through candidatesList to create selectable buttons for each candidate. */}
                {poll.candidatesList && poll.candidatesList.length > 0
                  ? poll.candidatesList.map((candidate, index) => (
                      <button
                        key={index} // Unique key for React list rendering.
                        // onClick handler: Sets selected candidate if user hasn't voted.
                        onClick={() => !hasVoted && setSelectedCandidateIndex(index)}
                        // Dynamic styling based on selection, vote status, and hover.
                        // Highlights selected/voted candidate.
                        className={`p-4 rounded-lg text-left transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-75
                                      ${(hasVoted ? userVote === index : selectedCandidateIndex === index)
                                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg ring-cyan-400 scale-105' // Style for selected/voted.
                                        : 'bg-slate-700 hover:bg-slate-600/70 text-gray-200 shadow-md ring-slate-600'} // Default style.
                                      ${hasVoted ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'} flex flex-col items-start h-full`}
                        disabled={hasVoted} // Disable button if user has already voted.
                      >
                        {/* Candidate Image */}
                        {candidate.imageUrl && (
                          <img 
                            src={candidate.imageUrl} 
                            alt={candidate.name || `Candidate ${index + 1}`} 
                            className="w-full h-32 object-cover rounded-md mb-3" 
                          />
                        )}
                        {/* Candidate Name (Title) and selection indicator icon */}
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-bold text-lg break-words">{candidate.name || `Candidate ${index + 1}`}</span>
                          {(hasVoted ? userVote === index : selectedCandidateIndex === index)
                            ? <FaCheckCircle className="text-xl text-white ml-2 flex-shrink-0" />
                            : <FaRegCircle className="text-xl text-slate-500 ml-2 flex-shrink-0" />}
                        </div>
                        {/* Candidate Slogan */}
                        {candidate.slogan && (
                          <p className={`text-sm italic ${(hasVoted ? userVote === index : selectedCandidateIndex === index) ? 'text-cyan-200' : 'text-gray-400'} mb-2 break-words`}>
                            {candidate.slogan}
                          </p>
                        )}
                        {/* Candidate Description */}
                        {candidate.description && (
                          <p className={`text-xs ${(hasVoted ? userVote === index : selectedCandidateIndex === index) ? 'text-cyan-100' : 'text-gray-500'} break-words flex-grow`}>
                            {candidate.description}
                          </p>
                        )}
                        {/* Fallback if no image, slogan, or description */}
                        {!candidate.imageUrl && !candidate.slogan && !candidate.description && (
                           <div className="flex-grow"></div> // Ensures button takes full height if only name is present
                        )}
                      </button>
                    ))
                  // Fallback message if no candidates are available for the poll.
                  : <p className="text-center text-gray-400 col-span-full">No candidates available for this poll.</p>}
              </div>
              {/* Vote submission button area: Shown if user hasn't voted yet. */}
              {!hasVoted && (
                <div className="mt-8 text-center">
                  <button
                    onClick={handleVote} // Triggers vote submission.
                    // Disable button under various conditions (no selection, voting in progress, already voted, expired, not logged in, paused).
                    disabled={selectedCandidateIndex === null || isVoting || hasVoted || isExpired || !isLoggedIn || isPaused}
                    className={`${primaryButtonClasses} w-full sm:w-auto disabled:opacity-50 disabled:transform-none disabled:shadow-none disabled:cursor-not-allowed`}
                  >
                    {isVoting ? <FaSpinner className="animate-spin inline mr-2" /> : null} {/* Show spinner if voting. */}
                    {/* Dynamic button text based on state. */}
                    {isVoting ? 'Submitting...' : hasVoted ? 'Already Voted' : isExpired ? 'Poll Expired' : isPaused ? 'Poll Paused' : 'Submit Vote'}
                  </button>
                </div>
              )}
              {/* Button to show results: Shown if user has voted but results are not yet visible. */}
              {hasVoted && !showResults && (
                <div className="mt-6 text-center">
                  <button onClick={handleShowResults} className={secondaryButtonClasses}>
                    View Results
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Condition 5: Results Display - Shown when showResults is true and candidates exist. */}
          {/* Displays poll results with candidate names, vote counts, and percentages in bar chart form. */}
          {showResults && poll.candidatesList && poll.candidatesList.length > 0 && (
            <div>
              {/* Section title for poll results, with an icon. */}
              <h2 className="text-xl font-semibold mb-5 text-gray-200 flex items-center">
                <FaChartBar className="mr-2 text-teal-400"/> Poll Results:
              </h2>
              {/* Container for individual candidate result bars. */}
              <div className="space-y-5">
                {/* Map through candidatesList to display their results. */}
                {poll.candidatesList.map((candidate, index) => {
                  // Calculate vote count and percentage for the current candidate.
                  const voteCount = Number(poll.votesCount[index] || 0); // Default to 0 if undefined.
                  const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0; // Avoid division by zero.
                  return (
                    // Container for a single candidate's result bar and details.
                    <div key={index} className="bg-slate-700/50 p-4 rounded-lg shadow">
                      {/* Candidate name and vote count/percentage text. */}
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-medium text-gray-100 break-words w-3/4">{candidate.name || `Candidate ${index + 1}`}</span>
                        <span className="text-sm text-gray-300">{voteCount.toLocaleString()} vote{voteCount !== 1 ? 's' : ''} ({percentage.toFixed(1)}%)</span>
                      </div>
                      {/* Progress bar representing vote percentage. */}
                      <div className="w-full bg-slate-600 rounded-full h-5 overflow-hidden shadow-inner" title={`${percentage.toFixed(1)}%`}>
                        <div
                          className="bg-gradient-to-r from-teal-500 to-cyan-500 h-5 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${percentage}%` }} // Dynamic width based on percentage.
                          role="progressbar" // ARIA role for accessibility.
                          aria-valuenow={percentage}
                          aria-valuemin="0"
                          aria-valuemax="100"
                          aria-label={`Votes for ${candidate.name || `Candidate ${index + 1}`}: ${percentage.toFixed(1)}%`}
                        ></div>
                      </div>
                      {/* Display "(Your Vote)" if this was the user's voted candidate. */}
                      {hasVoted && userVote === index && (
                        <p className="text-xs text-teal-300 mt-1 text-right">Your Vote</p>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Button to hide results and return to voting/poll view (if applicable and poll is still active for voting). */}
              {!isExpired && isLoggedIn && !hasVoted && !isPaused && (
                 <div className="mt-6 text-center">
                    <button onClick={() => setShowResults(false)} className={secondaryButtonClasses}>
                        Back to Voting
                    </button>
                 </div>
              )}
            </div>
          )}
           {/* Message if results are requested to be shown but there are no candidates (e.g., poll was created without candidates). */}
           {showResults && (!poll.candidatesList || poll.candidatesList.length === 0) && (
             <p className="text-center text-gray-400 mt-6">No candidates or results to display for this poll.</p>
           )}
        </div>
      </div>
    </div>
  );
};

export default PollingStation;