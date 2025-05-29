// UserProfile.js - Component to display user-specific information, including polls created and voted on.
// This component fetches and displays two main lists: polls created by the logged-in user
// and polls in which the logged-in user has participated (voted).

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useHistory } from 'react-router-dom';
import pollService from '../services/PollService'; // Service for blockchain interactions related to polls.
import { login, logout, slugify } from '../utils'; // accountId will be accessed via window.accountId, Added slugify
import { FaUserCircle, FaPoll, FaVoteYea, FaPlusSquare, FaSignInAlt, FaSignOutAlt, FaSpinner, FaExternalLinkAlt, FaTrashAlt, FaEye, FaEdit, FaListAlt, FaHistory, FaPlayCircle, FaUserCheck, FaUsers } from 'react-icons/fa'; // Added FaPlayCircle, FaUserCheck, FaUsers
import { parsePollDate, formatRelativeDate } from '../utils/dateUtils'; // Date utility functions for parsing and formatting.
import ConfirmationModal from './ConfirmationModal'; // Import the modal component

// Main functional component for the User Profile page.
const UserProfile = () => {
  const [userPolls, setUserPolls] = useState([]);
  const [votedPolls, setVotedPolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('managePolls');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pollToDelete, setPollToDelete] = useState(null);

  const history = useHistory();

  // Timer for success/error messages
  useEffect(() => {
    let timer;
    if (actionSuccess) {
      timer = setTimeout(() => {
        setActionSuccess('');
      }, 5000);
    }
    // Clear timeout if component unmounts or if actionSuccess changes before 5s
    return () => clearTimeout(timer);
  }, [actionSuccess]);

  useEffect(() => {
    let timer;
    if (actionError) {
      timer = setTimeout(() => {
        setActionError('');
      }, 5000);
    }
    // Clear timeout if component unmounts or if actionError changes before 5s
    return () => clearTimeout(timer);
  }, [actionError]);

  const cardClasses = "bg-slate-800 shadow-xl rounded-lg p-6 transition-all duration-300 hover:shadow-2xl";
  const linkClasses = "text-teal-400 hover:text-teal-300 font-medium transition-colors";
  const buttonClasses = "mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 transition-all transform hover:scale-105";
  const smallButtonClasses = "inline-flex items-center px-4 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed";
  const tabButtonBaseClasses = "flex-1 sm:flex-none sm:px-6 py-3 text-sm font-medium rounded-t-md focus:outline-none transition-all duration-200 ease-in-out flex items-center justify-center";
  const tabButtonActiveClasses = "bg-slate-800 text-teal-400 shadow-inner";
  const tabButtonInactiveClasses = "bg-slate-700/50 hover:bg-slate-700 text-gray-400 hover:text-gray-200";

  const isLoggedIn = !!window.accountId;

  const fetchUserData = useCallback(async () => {
    if (!isLoggedIn) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError('');
    setActionError('');
    setActionSuccess('');
    try {
      // Fetch polls created by the user
      const rawUserPolls = await pollService.getUserPolls(window.accountId);
      const processedUserPolls = (rawUserPolls || []).map(poll => {
        if (!poll || !poll.id) return null;
        
        const currentPollObject = poll;
        let isExpiredFlag;

        const _createdAt = currentPollObject.createdAt;
        const _durationNs = currentPollObject.durationNs;

        // Logic to determine isExpiredFlag, mirroring PollCard.js
        if (!_createdAt || _durationNs === null || typeof _durationNs === 'undefined') {
            isExpiredFlag = true;
        } else {
            const createdAtMs = parsePollDate(String(_createdAt));
            if (createdAtMs === null || isNaN(createdAtMs)) {
                isExpiredFlag = true;
            } else {
                let durationMs;
                try {
                    durationMs = Number(BigInt(String(_durationNs)) / 1000000n);
                    if (isNaN(durationMs)) { // Should not happen if BigInt conversion is okay and _durationNs is numeric string.
                        isExpiredFlag = true; 
                    }
                } catch (e) {
                    isExpiredFlag = true; // Error during duration conversion
                }

                if (isExpiredFlag !== true) { // Only proceed if not already marked expired
                    const expiryTimeMs = createdAtMs + durationMs;
                    if (isNaN(expiryTimeMs)) { // Safety check for the sum
                        isExpiredFlag = true;
                    } else {
                        isExpiredFlag = expiryTimeMs < Date.now();
                    }
                }
            }
        }
        
        return { ...currentPollObject, isExpired: isExpiredFlag };
      }).filter(Boolean);

      // Sort user polls by creation date (newest first)
      processedUserPolls.sort((a, b) => {
        
        const dateA = BigInt(a.createdAt);
        const dateB = BigInt(b.createdAt);
        if (dateB > dateA) return 1; // b is newer, should come first
        if (dateB < dateA) return -1; // a is newer, should come first
        return 0;
      });

      setUserPolls(processedUserPolls);

      // Fetch voting history and then details for each voted poll
      const historyData = await pollService.getUserVoteHistory(window.accountId);
      const votedDetailsPromises = (historyData || []).map(async (historyEntry) => {
        try {
          const idToFetch = typeof historyEntry === 'string' ? historyEntry : historyEntry?.pollId;
          if (!idToFetch || typeof idToFetch !== 'string') {
            console.warn(`[UserProfile - fetchUserData] Invalid or missing poll ID in history entry:`, historyEntry);
            return null;
          }
          const pollDetail = await pollService.getPollById(idToFetch);
          if (pollDetail && pollDetail.id) {
            const currentPollObject = pollDetail;
            let isExpiredFlag;

            const _createdAt = currentPollObject.createdAt;
            const _durationNs = currentPollObject.durationNs;

            // Logic to determine isExpiredFlag, mirroring PollCard.js
            if (!_createdAt || _durationNs === null || typeof _durationNs === 'undefined') {
                isExpiredFlag = true;
            } else {
                const createdAtMs = parsePollDate(String(_createdAt));
                if (createdAtMs === null || isNaN(createdAtMs)) {
                    isExpiredFlag = true;
                } else {
                    let durationMs;
                    try {
                        durationMs = Number(BigInt(String(_durationNs)) / 1000000n);
                        if (isNaN(durationMs)) {
                            isExpiredFlag = true;
                        }
                    } catch (e) {
                        isExpiredFlag = true; // Error during duration conversion
                    }

                    if (isExpiredFlag !== true) { // Only proceed if not already marked expired
                        const expiryTimeMs = createdAtMs + durationMs;
                        if (isNaN(expiryTimeMs)) {
                            isExpiredFlag = true;
                        } else {
                            isExpiredFlag = expiryTimeMs < Date.now();
                        }
                    }
                }
            }
            
            return { ...currentPollObject, isExpired: isExpiredFlag };
          }
          return null;
        } catch (innerErr) {
          const idForWarning = typeof historyEntry === 'string' ? historyEntry : (historyEntry?.pollId);
          console.warn(`Could not fetch details for voted poll (ID: ${idForWarning || 'unknown'}):`, innerErr);
          return null;
        }
      });
      
      const resolvedVotedDetails = (await Promise.all(votedDetailsPromises)).filter(Boolean);
      setVotedPolls(resolvedVotedDetails);

    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Failed to load your profile data. Please try again later.");
      setUserPolls([]);
      setVotedPolls([]);
    }
    setIsLoading(false);
  }, [isLoggedIn]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleDeletePoll = async (pollId) => {
    setPollToDelete(pollId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!pollToDelete) return;

    setShowDeleteModal(false);
    setIsProcessing(true);
    setActionError('');
    setActionSuccess('');
    try {
      const success = await pollService.deletePoll(pollToDelete);
      if (success) {
        setActionSuccess("Poll deleted successfully.");
        setUserPolls(prevPolls => prevPolls.filter(poll => poll.id !== pollToDelete));
      } else {
        setActionError("Failed to delete the poll. It might have already been deleted or an error occurred.");
      }
    } catch (err) {
      console.error("Error deleting poll:", err);
      setActionError("An error occurred while trying to delete the poll. Please try again.");
    }
    setIsProcessing(false);
    setPollToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setPollToDelete(null);
  };

  if (isLoading && isLoggedIn) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <FaSpinner className="animate-spin text-6xl text-teal-400" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-gray-100 p-4">
        <div className="bg-slate-800/70 backdrop-blur-md p-8 sm:p-12 rounded-xl shadow-2xl max-w-md w-full text-center">
          <FaUserCircle className="text-6xl text-teal-400 mb-6 mx-auto" />
          <h2 className="text-3xl font-semibold mb-3 text-white font-sans">
            Access Your Profile
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Please log in with your NEAR wallet to view your created polls, voting history, and manage your activities.
          </p>
          <button
            onClick={login}
            className="w-full text-lg py-3 px-6 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500"
          >
            Log In with NEAR
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-gray-100 p-4 text-center">
        <p className="text-red-400 text-xl">{error}</p>
        <button onClick={fetchUserData} className={`${buttonClasses} mt-6`}>
          Try Again
        </button>
      </div>
    );
  }

  // Calculate counts for the new cards
  const pollsCreatedCount = userPolls.length;
  const activePollsCount = userPolls.filter(poll => !poll.isExpired && !poll.isPaused).length;
  const expiredPollsCount = userPolls.filter(poll => poll.isExpired).length;
  const yourVotesCastCount = votedPolls.length;

  // For "Votes in Your Polls", attempt to sum from poll.totalVotes or poll.candidatesList[i].votes
  // If these are not present, this count may be 0 or inaccurate.
  const votesInYourPollsCount = userPolls.reduce((totalAcc, poll) => {
    if (typeof poll.totalVotes === 'number') {
      return totalAcc + poll.totalVotes;
    }
    if (poll.candidatesList && Array.isArray(poll.candidatesList)) {
      const pollVotesOnThisPoll = poll.candidatesList.reduce((candidateAcc, candidate) => {
        // Ensure candidate.votes is treated as a number, default to 0 if not present or invalid
        const votes = Number(candidate.votes);
        return candidateAcc + (isNaN(votes) ? 0 : votes);
      }, 0);
      return totalAcc + pollVotesOnThisPoll;
    }
    return totalAcc;
  }, 0);

  const statCardBaseStyle = "p-5 rounded-xl shadow-lg text-white flex flex-col items-center justify-center transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 cursor-default";

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gradient-to-br from-slate-900 to-slate-800 text-gray-100 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* User Info Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 p-4 bg-slate-800 rounded-lg shadow-md">
          <div className="flex-grow flex items-center mb-4 sm:mb-0">
            <FaUserCircle className="text-5xl sm:text-6xl text-teal-400 mr-4 flex-shrink-0" />
            <p className="text-xl font-mono text-gray-300 break-all font-bold">{window.accountId}</p>
          </div>
          <button
            onClick={logout}
            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 flex items-center"
          >
            <FaSignOutAlt className="mr-2" />
            Logout
          </button>
        </div>

        {/* Statistics Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-10">
          {/* Card 1: Polls Created */}
          <div className={`${statCardBaseStyle} bg-slate-700/50`}>
            <FaListAlt className="text-3xl mb-2 text-blue-400" />
            <p className="text-3xl font-bold text-blue-400">{pollsCreatedCount}</p>
            <h3 className="text-xs font-medium text-blue-400 mt-1">Polls Created</h3>
          </div>
          {/* Card 2: Active Polls */}
          <div className={`${statCardBaseStyle} bg-slate-700/50`}>
            <FaPlayCircle className="text-3xl mb-2 text-green-400" />
            <p className="text-3xl font-bold text-green-400">{activePollsCount}</p>
            <h3 className="text-xs font-medium text-green-400 mt-1">Active Polls</h3>
          </div>
          {/* Card 3: Expired Polls */}
          <div className={`${statCardBaseStyle} bg-slate-700/50`}>
            <FaHistory className="text-3xl mb-2 text-red-400" />
            <p className="text-3xl font-bold text-red-400">{expiredPollsCount}</p>
            <h3 className="text-xs font-medium text-red-400 mt-1">Expired Polls</h3>
          </div>
          {/* Card 4: Your Casted Votes */}
          <div className={`${statCardBaseStyle} bg-slate-700/50`}>
            <FaUserCheck className="text-3xl mb-2 text-white/80" />
            <p className="text-3xl font-bold text-white">{yourVotesCastCount}</p>
            <h3 className="text-xs font-medium text-white/90 mt-1">Your Casted Votes</h3>
          </div>
          {/* Card 5: Votes in Your Polls */}
          <div className={`${statCardBaseStyle} bg-slate-700/50`}>
            <FaUsers className="text-3xl mb-2 text-white/80" />
            <p className="text-3xl font-bold text-white">{votesInYourPollsCount}</p>
            <h3 className="text-xs font-medium text-white/90 mt-1">Votes in Your Polls</h3>
          </div>
        </div>

        {actionError && <p className="mb-4 text-sm text-red-400 bg-red-900/30 p-3 rounded-md text-center">{actionError}</p>}
        {actionSuccess && <p className="mb-4 text-sm text-green-400 bg-green-900/30 p-3 rounded-md text-center">{actionSuccess}</p>}

        {/* Tab Navigation */}
        <div className="mb-6 flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('managePolls')}
            className={`py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors duration-150 ease-in-out focus:outline-none
              ${activeTab === 'managePolls'
                ? 'border-b-2 border-teal-400 text-teal-400'
                : 'text-gray-400 hover:text-gray-200'
              } mr-1`}
          >
            <FaPoll className="inline mr-2 mb-0.5" /> Manage My Polls
          </button>
          <button
            onClick={() => setActiveTab('votingHistory')}
            className={`py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors duration-150 ease-in-out focus:outline-none
              ${activeTab === 'votingHistory'
                ? 'border-b-2 border-green-400 text-green-400'
                : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            <FaVoteYea className="inline mr-2 mb-0.5" /> Voting History
          </button>
        </div>

        {/* Conditional Content Based on Active Tab */}
        {activeTab === 'managePolls' && (
          <div className={`${cardClasses} mb-8`}>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-100 mb-5 flex items-center">
              <FaPoll className="mr-3 text-sky-400" /> Manage My Polls
            </h2>
            {userPolls.length > 0 ? (
              <div className="space-y-5">
                {userPolls.map((poll) => {
                  const pollSlug = slugify(poll.prompt);
                  return (
                    <div key={poll.id} className="bg-slate-700 p-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-600 hover:border-teal-500/70">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div className="flex-grow mb-3 sm:mb-0 pr-0 sm:pr-4">
                          <Link 
                            to={{ 
                              pathname: `/poll/${pollSlug}`,
                              state: { pollId: poll.prompt } 
                            }}
                            className={`${linkClasses} text-lg font-semibold break-words block hover:underline`}
                          >
                            {poll.prompt}
                          </Link>
                          <p className="text-xs text-gray-400 mt-1">
                            Created: <span className="text-gray-300">{formatRelativeDate(String(poll.createdAt))}</span>
                            <span className="mx-2 text-gray-500">|</span>
                            Status:
                            <span className={`font-medium ml-1 ${poll.isPaused ? 'text-yellow-400' : poll.isExpired ? 'text-red-400' : 'text-green-400'}`}>
                              {poll.isPaused ? 'Paused' : poll.isExpired ? 'Ended' : 'Active'}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <button
                            onClick={() => history.push({ pathname: `/poll/${pollSlug}`, state: { pollId: poll.prompt } })}
                            className="text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center bg-sky-500 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400"
                            title="View Poll"
                            disabled={isProcessing}
                          >
                            <FaEye className="mr-1.5" /> View
                          </button>
                          {/*
                          <button
                            onClick={() => handleDeletePoll(poll.id)}
                            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            title="Delete Poll"
                            disabled={isProcessing}
                          >
                            {isProcessing ? <FaSpinner className="animate-spin mr-1.5" /> : <FaTrashAlt className="mr-1.5" />}
                            Delete
                          </button>
                          */}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 italic">You haven't created any polls yet.</p>
            )}
          </div>
        )}

        {activeTab === 'votingHistory' && (
          <div className={cardClasses}>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-100 mb-5 flex items-center">
              <FaVoteYea className="mr-3 text-green-400" /> Voting History
            </h2>
            {votedPolls.length > 0 ? (
              <ul className="space-y-4">
                {votedPolls.map((poll) => {
                  const pollSlug = slugify(poll.prompt);
                  return (
                    <li key={poll.id} className="p-4 bg-slate-700/50 rounded-md hover:bg-slate-600/50 transition-colors">
                      <Link 
                        to={{ 
                          pathname: `/poll/${pollSlug}`,
                          state: { pollId: poll.prompt } 
                        }}
                        className={`${linkClasses} text-lg break-words block`}
                      >
                        {poll.prompt}
                      </Link>
                      <div className="text-xs text-gray-400 mt-1.5 flex items-center justify-between">
                        <span>
                          Created: <span className="text-gray-300">{formatRelativeDate(String(poll.createdAt))}</span>
                        </span>
                        <Link 
                          to={{ 
                            pathname: `/poll/${pollSlug}`,
                            state: { pollId: poll.prompt } 
                          }}
                          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center"
                        >
                          View Poll <FaExternalLinkAlt className="ml-1" />
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-400 italic">You haven't voted in any polls yet.</p>
            )}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this poll? This action cannot be undone and the poll will be permanently removed."
      />
    </div>
  );
};

export default UserProfile;