// App.js - Main Application Component
// This component sets up the main structure of the application, including routing, navigation, and global state management like login status.

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom"; // React Router for SPA navigation.
import "./styles/output.css"; // Tailwind CSS output.
import "./global.css"; // Custom global styles.
import BitLogo from 'url:./assets/bitlogo.svg'; // Application logo.

// Import page components.
import Home from "./Components/Home";
import NewPoll from "./Components/NewPoll";
import PollingStation from "./Components/PollingStation";
import UserProfile from "./Components/UserProfile";

// Import NEAR utilities for wallet interaction.
import { login, logout } from "./utils";

// Main App functional component.
const App = () => {
  // State for managing user login status.
  const [isLoggedIn, setIsLoggedIn] = useState(!!window.accountId);
  // State for mobile menu visibility.
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // State for controlling the logout confirmation modal.
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Effect hook to update login state when the component mounts or accountId changes globally.
  // This ensures the UI reflects the current login status if it changes outside this component (e.g., after initContract).
  useEffect(() => {
    setIsLoggedIn(!!window.accountId);
    // The dependency array is empty, meaning this runs once on mount.
    // To monitor global window.accountId changes more reliably without a full state management library,
    // one could listen to custom events dispatched after login/logout, or periodically check.
    // For this app, re-renders triggered by other state changes (like navigation) will also re-check window.accountId.
  }, []); // Consider adding a listener or context if `window.accountId` can change dynamically without re-render.

  // Handler for initiating the login process.
  const handleLogin = () => {
    login(); // Calls the login utility from utils.js.
  };

  // Handler for initiating the logout process (shows confirmation modal).
  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  // Handler for confirming logout action.
  const confirmLogout = () => {
    logout(); // Calls the logout utility from utils.js.
    setShowLogoutModal(false); // Hides the modal.
    setIsLoggedIn(false); // Updates local state to reflect logout.
    // Note: The page might reload after logout depending on the `logout` function's implementation in utils.js.
    // If it reloads, `isLoggedIn` will be re-initialized based on `window.accountId`.
  };

  // Handler for canceling the logout action.
  const cancelLogout = () => {
    setShowLogoutModal(false); // Hides the modal.
  };

  // Handler to toggle the mobile menu's visibility.
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // JSX for the application structure.
  return (
    <Router>
      {/* Main container with gradient background and flex column layout. */}
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-800 text-gray-100 flex flex-col font-sans">
        {/* Navigation Bar: Sticky, with blur effect. */}
        <nav className="bg-slate-800/70 backdrop-blur-md shadow-lg sticky top-0 z-50">
          {/* Container for nav content, centered with padding. */}
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            {/* Logo and Home Link */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2" aria-label="Home">
                <img src={BitLogo} alt="BitLogo" className="h-12 w-auto" /> {/* Logo image */}
              </Link>
            </div>

            {/* Mobile menu button: Visible on smaller screens (md:hidden). */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu} // Toggles mobile menu visibility.
                className="text-gray-300 hover:text-white focus:outline-none p-2 rounded-md transition-colors"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"} // Accessibility label.
                aria-expanded={isMenuOpen} // Indicates if the menu is open.
              >
                {/* SVG icon for hamburger/close. */}
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMenuOpen ? (
                    // Close icon (X shape) when menu is open.
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    // Hamburger icon (three lines) when menu is closed.
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>

            {/* Desktop navigation links: Hidden on smaller screens (hidden md:flex). */}
            <div className={`hidden md:flex items-center space-x-4`}>
              <Link to="/" className="nav-link">Home</Link>
              {isLoggedIn && (
                <>
                  <Link to="/profile" className="nav-link">Profile</Link>
                  <Link to="/new-poll" className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"> Create Poll </Link>
                  <button onClick={handleLogout} className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300" >Logout</button>
                </>
              )}
              {!isLoggedIn && (
                <button onClick={handleLogin} className="nav-link-button">Login</button>
              )}
            </div>
          </div>

          {/* Mobile menu: Absolutely positioned, slides in from the top. */}
          {/* Shown or hidden based on isMenuOpen state. */}
          <div
            className={`absolute top-full left-0 right-0 bg-slate-800 shadow-xl md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
              isMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            {/* Links within the mobile menu. */}
            <Link to="/" className="mobile-nav-link" onClick={toggleMenu}>Home</Link>
            {isLoggedIn && (
              <>
                <Link to="/profile" className="mobile-nav-link" onClick={toggleMenu}>Profile</Link>
                <Link to="/new-poll" className="block w-full text-left px-4 py-3 text-sm text-gray-200 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 hover:text-white transition-colors duration-150" onClick={toggleMenu}>Create Poll</Link>
                <button onClick={() => { handleLogout(); toggleMenu(); }} className="block w-full text-left px-4 py-3 text-sm text-gray-200 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 hover:text-white transition-colors duration-150">Logout</button>
              </>
            )}
            {!isLoggedIn && (
              <button onClick={() => { handleLogin(); toggleMenu(); }} className="mobile-nav-link-button w-full text-left">Login</button>
            )}
          </div>
        </nav>

        {/* Main content area: Takes remaining vertical space. */}
        <main className="flex-grow container mx-auto p-4 md:p-6">
          {/* Switch component for defining routes. Only the first matching route is rendered. */}
          <Switch>
            {/* Route for the Home page. */}
            <Route path="/" exact component={Home} />
            {/* Route for creating a new poll. */}
            <Route path="/new-poll" component={NewPoll} />
            {/* Route for viewing a specific poll. The ':id' is a URL parameter for the poll ID. */}
            <Route path="/poll/:id" component={PollingStation} />
            {/* Route for the user profile page. */}
            <Route path="/profile" component={UserProfile} />
          </Switch>
        </main>

        {/* Logout Confirmation Modal */}
        {showLogoutModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="logout-modal-title">
            <div className="bg-slate-800 p-6 rounded-lg shadow-2xl max-w-sm w-full mx-auto">
              <h2 id="logout-modal-title" className="text-xl font-semibold text-white mb-4">Confirm Logout</h2>
              <p className="text-gray-300 mb-6">Are you sure you want to log out?</p>
              <div className="flex justify-end space-x-3">
                <button onClick={cancelLogout} className="px-4 py-2 rounded-md bg-slate-600 hover:bg-slate-500 text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400">Cancel</button>
                <button onClick={confirmLogout} className="px-4 py-2 rounded-md bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-500">Logout</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
};

export default App;