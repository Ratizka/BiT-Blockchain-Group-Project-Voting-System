// NewPoll.js - Component for creating new polls
import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import pollService from "../services/PollService";
import { login } from "../utils";
import { FaArrowLeft, FaArrowRight, FaPlus, FaTrash, FaSpinner, FaExclamationTriangle, FaUserCircle } from 'react-icons/fa';

const NewPoll = () => {
  const history = useHistory();
  const [isLoggedIn, setIsLoggedIn] = useState(!!window.accountId);

  // Effect to update login status if window.accountId changes (e.g., after login/logout)
  useEffect(() => {
    setIsLoggedIn(!!window.accountId);
  }, [window.accountId]);

  // State for managing form steps, submission status, and errors
  const [formStep, setFormStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submissionError, setSubmissionError] = useState('');

  const [pollQuestion, setPollQuestion] = useState('');
  const [pollDescription, setPollDescription] = useState('');
  const [pollCategory, setPollCategory] = useState('');
  const [pollDurationDays, setPollDurationDays] = useState(7);
  const [pollDurationHours, setPollDurationHours] = useState(0);
  const [tags, setTags] = useState('');

  // State for poll candidates, initialized with two empty candidates
  const [candidates, setCandidates] = useState([
    { name: '', slogan: '', description: '', imageUrl: '', position: 0 },
    { name: '', slogan: '', description: '', imageUrl: '', position: 1 }
  ]);

  // Predefined categories for poll creation
  const categories = [
    "Politics", "Entertainment", "Sports", "Technology", 
    "Education", "Business", "Lifestyle", "Science", "Art & Culture", "Health & Wellness", "Gaming", "Other"
  ];

  const quickDurations = [
    { label: '1 Day', days: 1, hours: 0 },
    { label: '3 Days', days: 3, hours: 0 },
    { label: '1 Week', days: 7, hours: 0 },
    { label: '2 Weeks', days: 14, hours: 0 },
    { label: '1 Month', days: 30, hours: 0 }
  ];

  // If user is not logged in, display login prompt
  if (!isLoggedIn) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-gray-100 p-4">
        <div className="bg-slate-800/70 backdrop-blur-md p-8 sm:p-12 rounded-xl shadow-2xl max-w-md w-full text-center">
          <FaUserCircle className="text-6xl text-teal-400 mb-6 mx-auto" />
          <h2 className="text-3xl font-semibold mb-3 text-white font-sans">
            Welcome to BIT Polling App!
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Please log in with your NEAR account to create new polls and engage with the community.
          </p>
          <button
            onClick={login}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-opacity-75 text-lg"
          >
            Login with NEAR
          </button>
        </div>
      </div>
    );
  }

  // Validates the first step of the poll creation form (basic info)
  const validateStep1 = () => {
    const newErrors = {};
    if (!pollQuestion.trim()) newErrors.pollQuestion = "Poll question is required";
    if (!pollCategory) newErrors.pollCategory = "Please select a category";
    if (pollDurationDays === 0 && pollDurationHours === 0) newErrors.pollDuration = "Poll duration must be at least 1 hour";
    else if (pollDurationDays < 0 || pollDurationHours < 0 || pollDurationHours > 23) newErrors.pollDuration = "Invalid duration values";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validates the second step of the poll creation form (candidates)
  const validateStep2 = () => {
    const newErrors = {};
    const validCandidates = candidates.filter(c => c.name.trim() !== '');
    if (validCandidates.length < 2) newErrors.candidates = "At least 2 candidates with names are required";
    // Optional: Add more specific candidate validation if needed
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Proceeds to the next step if current step is valid
  const handleNextStep = () => {
    if (formStep === 1 && validateStep1()) setFormStep(2);
  };

  // Returns to the previous step
  const handlePrevStep = () => setFormStep(formStep - 1);

  // Updates a specific field for a candidate
  const updateCandidate = (index, field, value) => {
    const updatedCandidates = [...candidates];
    updatedCandidates[index] = { ...updatedCandidates[index], [field]: value };
    setCandidates(updatedCandidates);
  };

  // Adds a new empty candidate entry, up to a maximum of 10
  const addCandidate = () => {
    if (candidates.length < 10) { 
      setCandidates([...candidates, { name: '', slogan: '', description: '', imageUrl: '', position: candidates.length }]);
    }
  };

  // Removes a candidate, ensuring at least 2 remain
  const removeCandidate = (index) => {
    if (candidates.length > 2) {
      const updatedCandidates = candidates.filter((_, i) => i !== index)
        .map((candidate, i) => ({ ...candidate, position: i }));
      setCandidates(updatedCandidates);
    }
  };

  // Applies a predefined quick duration to the poll
  const applyQuickDuration = (days, hours) => {
    setPollDurationDays(days);
    setPollDurationHours(hours);
  };

  // Handles the final submission of the new poll
  const handleSubmit = async (event) => {
    event.preventDefault();
    // Validate both steps before submission
    if (!validateStep1() || !validateStep2()) {
      if (formStep === 1 && !validateStep1()) return;
      if (formStep === 2 && !validateStep2()) return; 
      if (!validateStep2()) {
        setErrors(prev => ({...prev, candidates: "Please ensure at least two candidates have names before submitting."}));
        return;
      }
    }

    setIsSubmitting(true);
    setSubmissionError('');

    // Prepare poll data for the service
    const pollDataForService = {
      owner: window.accountId,
      prompt: pollQuestion,
      description: pollDescription,
      category: pollCategory,
      durationDays: parseInt(pollDurationDays, 10),
      durationHours: parseInt(pollDurationHours, 10),
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      candidates: candidates
        .filter(c => c.name.trim() !== '') // Filter out candidates without names
        .map(c => ({ name: c.name, slogan: c.slogan, description: c.description, imageUrl: c.imageUrl, votes: 0 }))
    };
    
    // Ensure at least two valid candidates before submitting
    if (pollDataForService.candidates.length < 2) {
        setSubmissionError("Poll creation failed: At least two candidates with names are required.");
        setErrors(prev => ({...prev, candidates: "At least two candidates with names are required."}));
        setIsSubmitting(false);
        return;
    }

    try {
      await pollService.createPoll(pollDataForService);
      history.push("/");
    } catch (error) {
      console.error("Failed to create poll:", error);
      setSubmissionError(`Failed to create poll: ${error.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Tailwind CSS classes for styling
  const inputBaseClasses = "w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors";
  const labelBaseClasses = "block text-gray-300 font-medium mb-2";
  const errorTextClasses = "text-red-400 text-sm mt-1";
  const buttonClasses = "px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-75";
  const primaryButtonClasses = `${buttonClasses} bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 focus:ring-teal-400`;
  const secondaryButtonClasses = `${buttonClasses} bg-slate-600 hover:bg-slate-500 text-gray-200 shadow-sm hover:shadow-md focus:ring-slate-400`;
  const dangerButtonClasses = `${buttonClasses} bg-red-600 hover:bg-red-700 text-white`;

  // Renders the current step of the form
  const renderFormStep = () => {
    switch (formStep) {
      case 1: // Step 1: Basic Poll Information
        return (
          <div className="space-y-8">
            <div>
              <label className={labelBaseClasses} htmlFor="pollQuestion">
                Poll Question <span className="text-red-400">*</span>
              </label>
              <input type="text" id="pollQuestion" className={`${inputBaseClasses} ${errors.pollQuestion ? 'border-red-500 ring-red-500' : 'border-slate-600'}`} placeholder="What's the burning question?" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} />
              {errors.pollQuestion && <p className={errorTextClasses}>{errors.pollQuestion}</p>}
            </div>

            <div>
              <label className={labelBaseClasses} htmlFor="pollDescription">Description (Optional)</label>
              <textarea id="pollDescription" rows="4" className={`${inputBaseClasses} resize-none`} placeholder="Add some context or details..." value={pollDescription} onChange={(e) => setPollDescription(e.target.value)}></textarea>
            </div>

            <div>
              <label className={labelBaseClasses} htmlFor="pollCategory">Category <span className="text-red-400">*</span></label>
              <select id="pollCategory" className={`${inputBaseClasses} ${errors.pollCategory ? 'border-red-500 ring-red-500' : 'border-slate-600'}`} value={pollCategory} onChange={(e) => setPollCategory(e.target.value)}>
                <option value="">Select a category</option>
                {categories.map((cat) => <option key={cat} value={cat.toLowerCase()}>{cat}</option>)}
              </select>
              {errors.pollCategory && <p className={errorTextClasses}>{errors.pollCategory}</p>}
            </div>
            
            <div>
              <label className={labelBaseClasses}>Poll Duration <span className="text-red-400">*</span></label>
              <div className="flex flex-wrap gap-2 mb-4">
                {quickDurations.map((opt) => (
                  <button key={opt.label} type="button" onClick={() => applyQuickDuration(opt.days, opt.hours)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-teal-400 rounded-md text-sm transition-colors">
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1" htmlFor="durationDays">Days (0-30)</label>
                  <input type="number" id="durationDays" min="0" max="30" className={`${inputBaseClasses} ${errors.pollDuration ? 'border-red-500 ring-red-500' : 'border-slate-600'}`} value={pollDurationDays} onChange={(e) => setPollDurationDays(Math.max(0, Math.min(30, parseInt(e.target.value) || 0)))} />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1" htmlFor="durationHours">Hours (0-23)</label>
                  <input type="number" id="durationHours" min="0" max="23" className={`${inputBaseClasses} ${errors.pollDuration ? 'border-red-500 ring-red-500' : 'border-slate-600'}`} value={pollDurationHours} onChange={(e) => setPollDurationHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))} />
                </div>
              </div>
              {errors.pollDuration && <p className={errorTextClasses}>{errors.pollDuration}</p>}
            </div>

            <div>
              <label className={labelBaseClasses} htmlFor="tags">Tags (Optional, comma-separated)</label>
              <input type="text" id="tags" className={inputBaseClasses} placeholder="e.g., crypto, governance, fun" value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
          </div>
        );
      case 2: // Step 2: Add Candidates
        return (
          <div className="space-y-8">
            {errors.candidates && <p className={`${errorTextClasses} mb-4 p-3 bg-red-900/30 border border-red-700 rounded-md`}>{errors.candidates}</p>}
            {candidates.map((candidate, index) => (
              <div key={index} className="p-6 bg-slate-800 rounded-lg shadow-md relative space-y-4">
                <h3 className="text-xl font-semibold text-teal-400 mb-3">Candidate #{index + 1}</h3>
                {candidates.length > 2 && (
                  <button type="button" onClick={() => removeCandidate(index)} className={`${dangerButtonClasses} absolute top-4 right-4 px-3 py-1 text-sm`} title="Remove Candidate">
                    <FaTrash />
                  </button>
                )}
                <div>
                  <label className={labelBaseClasses} htmlFor={`candidateName${index}`}>Name <span className="text-red-400">*</span></label>
                  <input type="text" id={`candidateName${index}`} className={`${inputBaseClasses} ${errors[`candidateName${index}`] ? 'border-red-500 ring-red-500' : 'border-slate-600'}`} placeholder="Candidate's Name" value={candidate.name} onChange={(e) => updateCandidate(index, 'name', e.target.value)} />
                  {errors[`candidateName${index}`] && <p className={errorTextClasses}>{errors[`candidateName${index}`]}</p>}
                </div>
                <div>
                  <label className={labelBaseClasses} htmlFor={`candidateSlogan${index}`}>Slogan (Optional)</label>
                  <input type="text" id={`candidateSlogan${index}`} className={inputBaseClasses} placeholder="Catchy phrase" value={candidate.slogan} onChange={(e) => updateCandidate(index, 'slogan', e.target.value)} />
                </div>
                <div>
                  <label className={labelBaseClasses} htmlFor={`candidateDescription${index}`}>Description (Optional)</label>
                  <textarea id={`candidateDescription${index}`} rows="3" className={`${inputBaseClasses} resize-none`} placeholder="Brief description" value={candidate.description} onChange={(e) => updateCandidate(index, 'description', e.target.value)}></textarea>
                </div>
                <div>
                  <label className={labelBaseClasses} htmlFor={`candidateImageUrl${index}`}>Image URL (Optional)</label>
                  <input type="url" id={`candidateImageUrl${index}`} className={inputBaseClasses} placeholder="https://example.com/image.png" value={candidate.imageUrl} onChange={(e) => updateCandidate(index, 'imageUrl', e.target.value)} />
                </div>
              </div>
            ))}
            {candidates.length < 10 && (
              <button type="button" onClick={addCandidate} className={`${secondaryButtonClasses} w-full flex items-center justify-center`}>
                <FaPlus className="mr-2" /> Add Candidate
              </button>
            )}
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gradient-to-br from-slate-900 to-slate-800 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 text-gray-100">
      <div className="max-w-3xl mx-auto bg-slate-800/70 backdrop-blur-md p-6 sm:p-10 rounded-xl shadow-2xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-teal-400 mb-8">Create New Poll</h1>
        
        {/* Form Step Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm font-medium ${formStep >= 1 ? 'text-teal-400' : 'text-gray-500'}`}>Poll Details</span>
            <span className={`text-sm font-medium ${formStep >= 2 ? 'text-teal-400' : 'text-gray-500'}`}>Candidates</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: formStep === 1 ? '50%' : '100%' }}></div>
          </div>
        </div>

        {/* Display submission error if any */}
        {submissionError && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg flex items-center">
            <FaExclamationTriangle className="mr-3 text-xl" />
            <div>
              <p className="font-semibold">Submission Error:</p>
              <p>{submissionError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {renderFormStep()}
          
          <div className="mt-10 pt-6 border-t border-slate-700 flex justify-between items-center">
            {formStep > 1 && (
              <button type="button" onClick={handlePrevStep} className={`${secondaryButtonClasses} flex items-center`}>
                <FaArrowLeft className="mr-2" /> Previous
              </button>
            )}
            {formStep === 1 && (
              <button type="button" onClick={handleNextStep} className={`${primaryButtonClasses} ml-auto flex items-center`}>
                Next <FaArrowRight className="ml-2" />
              </button>
            )}
            {formStep === 2 && (
              <button type="submit" disabled={isSubmitting} className={`${primaryButtonClasses} ml-auto flex items-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" /> Submitting...
                  </>
                ) : "Create Poll"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPoll;
