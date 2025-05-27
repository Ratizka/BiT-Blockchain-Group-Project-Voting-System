// Home.js - Main landing page component, displays a list of polls and user-specific information.
import React, { useState, useEffect, useCallback } from "react";
import pollService from "../services/PollService"; // Service for interacting with poll-related blockchain functions.
import PollCard from "./PollCard"; // Component to display individual poll information.
import { login, logout } from "../utils"; // Utility functions for user authentication.
import { FaPlusCircle, FaUserCircle, FaSpinner, FaExclamationTriangle, FaSearch, FaFilter, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa'; // Icons for UI elements.
import { Link } from "react-router-dom";

const Home = () => {
  // State variables for managing polls, loading states, user information, and UI interactions.
  const [polls, setPolls] = useState([]); // Stores the list of all polls fetched from the service.
  const [filteredPolls, setFilteredPolls] = useState([]); // Stores polls after applying search and filter criteria.
  const [isLoading, setIsLoading] = useState(true); // Tracks loading state for polls.
  const [error, setError] = useState(""); // Stores error messages, if any.
  const [searchTerm, setSearchTerm] = useState(""); // Current search term entered by the user.
  const [filterCategory, setFilterCategory] = useState("All"); // Selected category for filtering polls.
  const [sortOrder, setSortOrder] = useState("latest"); // Sorting order for polls (e.g., latest, oldest, mostVoted).
  const [isLoggedIn, setIsLoggedIn] = useState(!!window.accountId); // Tracks user's login status.
  const [categories, setCategories] = useState([
    "All", 
    "Politics", 
    "Entertainment", 
    "Sports", 
    "Technology", 
    "Education", 
    "Business", 
    "Lifestyle", 
    "Science", 
    "Art & Culture", 
    "Health & Wellness", 
    "Gaming", 
    "Other"
  ]); // Predefined list of categories for filtering.

  // Memoized callback to refresh user-specific statistics (poll count, vote count).
  // This is crucial for updating UI elements that depend on user login status and actions.
  const refreshUserStats = useCallback(async () => {
    // Only fetch stats if the user is logged in.
    if (isLoggedIn && window.accountId) {
      try {
        // Fetch and set the count of polls created by the user.
        const userPolls = await pollService.getUserPolls(window.accountId);
        
        // Fetch and set the count of votes cast by the user.
        const userVoteHistory = await pollService.getUserVoteHistory(window.accountId);
      } catch (err) {
        console.error("[Home - refreshUserStats] Error fetching user stats:", err);
        // Optionally set an error state here if stats loading fails critically,
        // for example, by calling setError("Failed to load user statistics.").
      }
    }
  }, [isLoggedIn]); // Dependency: isLoggedIn ensures this runs when login status changes.

  // Effect to load all polls and initial user stats when the component mounts.
  // It also re-runs if refreshUserStats changes (which depends on isLoggedIn).
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true); // Indicate that data loading has started.
      setError(""); // Clear any previous errors.
      try {
        // Fetch all polls from the poll service.
        const fetchedPolls = await pollService.getAllPolls();
        if (fetchedPolls) {
          // Sort polls by creation date (latest first) by default upon fetching.
          const sortedPolls = fetchedPolls.sort((a, b) => {
            const dateA = BigInt(a.createdAt);
            const dateB = BigInt(b.createdAt);
            if (dateB > dateA) return 1;
            if (dateB < dateA) return -1;
            return 0;
          });
          setPolls(sortedPolls); // Store all fetched polls.
          setFilteredPolls(sortedPolls); // Initially, filtered polls are the same as all polls.

          // Extract unique categories from the fetched polls to populate the filter dropdown.
          // 'All' is added as the default option.
          // const uniqueCategories = ["All", ...new Set(sortedPolls.map(p => p.category).filter(Boolean))];
          // setCategories(uniqueCategories); // This line is removed as categories are now predefined.
        } else {
          // Handle cases where no polls are returned or an error occurs during fetch.
          setPolls([]);
          setFilteredPolls([]);
          setError("No polls found or failed to load polls.");
        }
      } catch (err) {
        console.error("[Home - loadData] Error fetching polls:", err);
        setError(`Failed to load polls: ${err.message}`); // Set a error message.
        setPolls([]); // Ensure polls lists are empty on error.
        setFilteredPolls([]);
      } finally {
        setIsLoading(false); // Indicate that data loading has finished.
      }
    };

    loadData(); // Execute the data loading function.
    refreshUserStats(); // Refresh user-specific statistics (e.g., polls created, votes cast).
  }, [refreshUserStats]); // Dependency: refreshUserStats callback (which itself depends on isLoggedIn).

  // Effect to handle account changes (e.g., user logs in or out).
  // This updates the isLoggedIn state and refreshes user stats if necessary.
  useEffect(() => {
    setIsLoggedIn(!!window.accountId); // Update login status based on the global window.accountId.
    if (window.accountId) {
      refreshUserStats(); // If a user is now logged in, refresh their stats.
    } else {
      // If user logs out, reset their specific stats to 0.
    }
  }, [window.accountId, refreshUserStats]); // Dependencies: window.accountId and the refreshUserStats callback.

  // Effect to filter and sort polls whenever relevant state variables (searchTerm, filterCategory, sortOrder, or polls list) change.
  // This ensures the displayed list of polls is always up-to-date with user interactions.
  useEffect(() => {
    let tempPolls = [...polls]; // Create a mutable copy of the polls array to avoid direct state mutation.

    // Apply search filter: checks poll prompt, description, and owner fields.
    // The search is case-insensitive.
    if (searchTerm) {
      tempPolls = tempPolls.filter(poll => 
        (poll.prompt?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (poll.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (poll.owner?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply category filter. If 'All' is selected, no category filtering is applied.
    if (filterCategory !== "All") {
      tempPolls = tempPolls.filter(poll => poll.category?.toLowerCase() === filterCategory.toLowerCase());
    }

    // Apply sorting based on the selected sortOrder.
    switch (sortOrder) {
      case "latest":
        // Sort by creation date, newest first.
        tempPolls.sort((a, b) => {
          const dateA = BigInt(a.createdAt);
          const dateB = BigInt(b.createdAt);
          if (dateB > dateA) return 1;
          if (dateB < dateA) return -1;
          return 0;
        });
        break;
      case "oldest":
        // Sort by creation date, oldest first.
        tempPolls.sort((a, b) => {
          const dateA = BigInt(a.createdAt);
          const dateB = BigInt(b.createdAt);
          if (dateA > dateB) return 1;
          if (dateA < dateB) return -1;
          return 0;
        });
        break;
      case "mostVoted":
        // Sort by the total number of votes. Polls with more votes appear first.
        // votesCount is an array of vote counts for each option in a poll.
        tempPolls.sort((a, b) => {
          const votesA = a.votesCount ? a.votesCount.reduce((sum, count) => sum + Number(count), 0) : 0;
          const votesB = b.votesCount ? b.votesCount.reduce((sum, count) => sum + Number(count), 0) : 0;
          return votesB - votesA; // Descending order of votes.
        });
        break;
      default:
        // No specific sort order or an unknown order was provided.
        break;
    }
    setFilteredPolls(tempPolls); // Update the state with the newly filtered and sorted polls.
  }, [searchTerm, filterCategory, sortOrder, polls]); // Dependencies: these states trigger re-filtering/sorting.

  // Handler for search input changes. Updates the searchTerm state.
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Handler for category filter changes. Updates the filterCategory state.
  const handleFilterChange = (event) => {
    setFilterCategory(event.target.value);
  };

  // Handler for sort order changes. Updates the sortOrder state.
  const handleSortChange = (event) => {
    setSortOrder(event.target.value);
  };

  // Tailwind CSS classes for styling form elements and buttons, promoting consistency.
  const formElementClasses = "w-full sm:w-auto bg-slate-700 text-gray-200 border border-slate-600 rounded-md py-2 px-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors";
  const buttonClasses = "px-4 py-2 rounded-lg font-semibold transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-75";
  const primaryButtonClasses = `${buttonClasses} bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 focus:ring-teal-400`;
  const secondaryButtonClasses = `${buttonClasses} bg-slate-600 hover:bg-slate-500 text-gray-200 shadow-sm hover:shadow-md focus:ring-slate-400`;

  // Render loading spinner while data is being fetched initially.
  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <FaSpinner className="animate-spin text-6xl text-teal-400" />
      </div>
    );
  }

  // Render error message if data fetching failed.
  if (error && polls.length === 0) { // Show error prominently if no polls could be loaded.
    return (
      <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-gray-100 p-4">
        <FaExclamationTriangle className="text-5xl text-red-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error</h2>
        <p className="text-red-400 text-center">{error}</p>
      </div>
    );
  }

  // If user is not logged in, show a login prompt.
  if (!isLoggedIn) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-gray-100 p-4">
        <div className="bg-slate-800/70 backdrop-blur-md p-8 sm:p-12 rounded-xl shadow-2xl max-w-md w-full text-center">
          <FaUserCircle className="text-6xl text-teal-400 mb-6 mx-auto" />
          <h2 className="text-3xl font-semibold mb-3 text-white font-sans">
            Welcome to BIT Polling App!
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Please log in with your NEAR account to view polls, cast your vote, and create your own polls.
          </p>
          <button
            onClick={login}
            className={`${primaryButtonClasses} w-full text-lg py-3`}
          >
            Login with NEAR
          </button>
          <p className="text-sm text-gray-500 mt-10">
            Powered by Blockchain Technology. Secure, transparent, and community-driven.
          </p>
        </div>
      </div>
    );
  }

  // Main component rendering logic.
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Page Header Section */}
      <header className="text-center mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight mb-3">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-teal-400 to-green-400">
            BIT Polling App
          </span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Cast your vote on a variety of topics, powered by the blockchain technology. Secure, transparent, and community-driven!
        </p>
      </header>
      
      {/* Search, Filter, and Sort Controls Section */}
      <div className="mb-10"> {/* Outer container with bottom margin */}
        <div className="p-5 bg-slate-800/70 rounded-xl shadow-md"> {/* Controls box with styling */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end"> {/* Grid layout for controls */}
            
            {/* Search Input Field */}
            <div>
              <label htmlFor="searchInput" className="block text-xs font-medium text-gray-300 mb-1.5">Search</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </span>
                <input
                  id="searchInput"
                  type="text"
                  placeholder="Search polls..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="block w-full bg-slate-700 text-gray-200 border-slate-600 border rounded-lg py-2.5 px-3.5 pl-10 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors placeholder-gray-500"
                />
              </div>
            </div>

            {/* Category Filter Dropdown */}
            <div>
              <label htmlFor="categoryFilter" className="block text-xs font-medium text-gray-300 mb-1.5">Category</label>
              <div className="relative">
                <select
                  id="categoryFilter"
                  value={filterCategory}
                  onChange={handleFilterChange}
                  className="block w-full bg-slate-700 text-gray-200 border-slate-600 border rounded-lg py-2.5 px-3.5 pr-10 appearance-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <FaFilter className="h-5 w-5 text-gray-400" />
                </span>
              </div>
            </div>

            {/* Sort Order Dropdown */}
            <div>
              <label htmlFor="sortOrder" className="block text-xs font-medium text-gray-300 mb-1.5">Sort by</label>
              <div className="relative">
                <select
                  id="sortOrder"
                  value={sortOrder}
                  onChange={handleSortChange}
                  className="block w-full bg-slate-700 text-gray-200 border-slate-600 border rounded-lg py-2.5 px-3.5 pr-10 appearance-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                >
                  <option value="latest">Latest</option>
                  <option value="oldest">Oldest</option>
                  <option value="mostVoted">Most Voted</option>
                </select>
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  {sortOrder === 'latest' && <FaSortAmountDown className="h-5 w-5 text-gray-400" />}
                  {sortOrder === 'oldest' && <FaSortAmountUp className="h-5 w-5 text-gray-400" />}
                  {/* No specific icon for 'mostVoted' to keep it minimal, select padding handles spacing */}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Polls List Display Section */}
      {/* Conditionally render PollCards if filteredPolls exist, otherwise show a message. */}
      {filteredPolls.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
          {/* Map through filtered polls and render a PollCard for each. */}
          {filteredPolls.map((poll) => (
            <PollCard key={poll.prompt} poll={poll} /> // Use poll.prompt as the key
          ))}
        </div>
      ) : (
        // Display message if no polls match the current filters or search term, or if no polls exist at all.
        <div className="text-center py-10">
          <FaExclamationTriangle className="text-4xl text-yellow-500 mx-auto mb-4" />
          <p className="text-xl text-gray-300">No polls match your current filters.</p>
          {polls.length > 0 && (
              // Suggests adjusting filters if there are polls but they are filtered out.
              <p className="text-gray-400 mt-2">Try adjusting your search or filter settings.</p>
          )}
          {polls.length === 0 && !isLoading && !error && (
               // Suggests creating a poll if no polls exist and not loading/error state.
               <p className="text-gray-400 mt-2">There are no polls available at the moment. Why not <Link to="/new-poll" className="text-teal-400 hover:text-teal-300 underline">create one</Link>?</p>
          )}
        </div>
      )}
      {/* Display a general error message if an error occurred but some polls might still be displayed (e.g., partial error or error during stats update). */}
      {error && polls.length > 0 && <p className="mt-6 text-center text-red-400">Error: {error}</p>}
    </div>
  );
};

export default Home;
