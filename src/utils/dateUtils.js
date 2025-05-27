// src/utils/dateUtils.js

/**
 * Parses a date value from various formats into milliseconds since epoch.
 * Handles strings (digits, ISO-like), numbers (ms, ns), and BigInts (ns).
 * Includes extensive console logging for debugging purposes.
 *
 * @param {string | number | BigInt} dateValue - The date value to parse.
 *   Can be a string representing nanoseconds, milliseconds, or a parsable date string.
 *   Can be a number representing nanoseconds or milliseconds.
 *   Can be a BigInt representing nanoseconds.
 * @returns {number | null} The date in milliseconds since epoch, or null if parsing fails.
 */
export const parsePollDate = (dateValue) => {
  // Log 1: Initial input
  console.log("[dateUtils - parsePollDate DBG] Input dateValue:", JSON.stringify(dateValue), "Type:", typeof dateValue);

  if (dateValue == null || dateValue === "") { // Handles null, undefined, ""
    console.warn("[dateUtils - parsePollDate DBG] dateValue is null, undefined, or empty string. Returning null.");
    return null;
  }
  let ms;
  let processedValue = dateValue; // Use a new variable for processing

  if (typeof processedValue === 'string') {
    processedValue = processedValue.trim(); // Trim whitespace
    console.log("[dateUtils - parsePollDate DBG] dateValue is a string. Trimmed: '" + processedValue + "' Length: " + processedValue.length);
    const isPurelyDigits = /^\d+$/.test(processedValue);
    console.log("[dateUtils - parsePollDate DBG] Regex /^\d+$/.test(processedValue) result:", isPurelyDigits);

    if (isPurelyDigits) {
      console.log("[dateUtils - parsePollDate DBG] String is purely digits.");
      if (processedValue.length > 13) {
        console.log("[dateUtils - parsePollDate DBG] String length > 13, treating as nanoseconds string.");
        try {
          const bigIntValue = BigInt(processedValue);
          console.log("[dateUtils - parsePollDate DBG] Converted to BigInt:", String(bigIntValue) + "n");
          ms = Number(bigIntValue / 1000000n);
          console.log("[dateUtils - parsePollDate DBG] Calculated ms from BigInt:", ms);
        } catch (e) {
          console.error("[dateUtils - parsePollDate DBG] Error converting string processedValue to BigInt:", processedValue, e);
          return null;
        }
      } else {
        console.log("[dateUtils - parsePollDate DBG] String length <= 13, treating as milliseconds string.");
        ms = parseInt(processedValue, 10);
        console.log("[dateUtils - parsePollDate DBG] Calculated ms from parseInt:", ms);
      }
    } else {
      console.log("[dateUtils - parsePollDate DBG] String is not purely digits. Attempting Date.parse() on original string value:", dateValue);
      ms = Date.parse(dateValue); 
      console.log("[dateUtils - parsePollDate DBG] Calculated ms from Date.parse():", ms);
    }
  } else if (typeof processedValue === 'number') {
    console.log("[dateUtils - parsePollDate DBG] dateValue is a number:", processedValue);
    if (isNaN(processedValue) || !isFinite(processedValue)) {
        console.warn("[dateUtils - parsePollDate DBG] dateValue is NaN or Infinity. Returning null.");
        return null;
    }
    if (processedValue > 100000000000000) { 
      console.log("[dateUtils - parsePollDate DBG] Number > 10^14, treating as nanoseconds number.");
      ms = Math.floor(processedValue / 1000000); // Convert nanoseconds to milliseconds
      console.log("[dateUtils - parsePollDate DBG] Calculated ms from large number (nanoseconds):", ms);
    } else {
      console.log("[dateUtils - parsePollDate DBG] Number <= 10^14, treating as milliseconds/seconds number.");
      ms = processedValue; // Assume it's already in ms
      console.log("[dateUtils - parsePollDate DBG] ms is processedValue (number, assumed ms):", ms);
    }
  } else {
    console.warn("[dateUtils - parsePollDate DBG] Invalid dateValue type:", typeof processedValue, processedValue);
    return null;
  }

  console.log("[dateUtils - parsePollDate DBG] Final ms before isNaN check:", ms);
  if (isNaN(ms)) {
      console.warn("[dateUtils - parsePollDate DBG] Resulting ms is NaN for original dateValue:", JSON.stringify(dateValue), "(Original type was " + typeof dateValue + ")");
      return null;
  }
  console.log("[dateUtils - parsePollDate DBG] Successfully parsed. Returning ms:", ms);
  return ms;
};

/**
 * Formats a timestamp in milliseconds into a locale-specific date and time string.
 *
 * @param {number | null} timestampMs - The timestamp in milliseconds since epoch.
 * @returns {string} A locale-specific string representation of the date and time, or 'Invalid date' if input is invalid.
 */
export const formatDate = (timestampMs) => {
  if (timestampMs === null || isNaN(timestampMs)) {
    return 'Invalid date';
  }
  const date = new Date(timestampMs);
  return date.toLocaleString(); // Or any other format you prefer
};

/**
 * Formats a date value into a human-readable relative time string (e.g., "2 hours ago", "yesterday").
 * Uses `parsePollDate` to convert the input `dateValue` into a timestamp in milliseconds.
 *
 * @param {string | number | BigInt} dateValue - The date value to format. See `parsePollDate` for accepted formats.
 * @returns {string} A relative time string (e.g., "just now", "5 minutes ago", "yesterday", "2 weeks ago"),
 *                   or 'Invalid date' if the input `dateValue` cannot be parsed.
 */
export const formatRelativeDate = (dateValue) => {
  const timestampMs = parsePollDate(dateValue);

  if (timestampMs === null || isNaN(timestampMs)) {
    return 'Invalid date';
  }

  const now = new Date();
  const date = new Date(timestampMs);
  const seconds = Math.round((now - date) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const weeks = Math.round(days / 7);
  const months = Math.round(days / 30.44); // Average days in a month
  const years = Math.round(days / 365.25); // Account for leap years

  if (seconds < 5) {
    return "just now";
  } else if (seconds < 60) {
    return `${seconds} seconds ago`;
  } else if (minutes < 60) {
    return minutes === 1 ? "a minute ago" : `${minutes} minutes ago`;
  } else if (hours < 24) {
    return hours === 1 ? "an hour ago" : `${hours} hours ago`;
  } else if (days < 7) {
    if (days === 1) {
      // Check if "yesterday" is appropriate
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (date.getFullYear() === yesterday.getFullYear() &&
          date.getMonth() === yesterday.getMonth() &&
          date.getDate() === yesterday.getDate()) {
        return "yesterday";
      }
    }
    return `${days} days ago`;
  } else if (weeks < 5) { // Up to roughly a month
    return weeks === 1 ? "a week ago" : `${weeks} weeks ago`;
  } else if (months < 12) {
    return months === 1 ? "a month ago" : `${months} months ago`;
  } else {
    return years === 1 ? "a year ago" : `${years} years ago`;
  }
};

/**
 * Formats the remaining time until a given end date.
 *
 * @param {Date | number} endsAtDate - The end date, either as a Date object or a timestamp in milliseconds.
 * @returns {string} A string representing the remaining time (e.g., "2 days, 5 hours, 30 minutes remaining")
 *                   or "Poll has ended" if the date is in the past.
 */
export const formatRemainingTime = (endsAtDate) => {
  const now = new Date().getTime();
  const endTime = endsAtDate instanceof Date ? endsAtDate.getTime() : endsAtDate;

  if (isNaN(endTime)) {
    return 'Invalid end date';
  }

  let remainingMs = endTime - now;

  if (remainingMs <= 0) {
    return 'Poll has ended';
  }

  const seconds = Math.floor((remainingMs / 1000) % 60);
  const minutes = Math.floor((remainingMs / (1000 * 60)) % 60);
  const hours = Math.floor((remainingMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));

  let parts = [];
  if (days > 0) parts.push(days + (days === 1 ? " day" : " days"));
  if (hours > 0) parts.push(hours + (hours === 1 ? " hour" : " hours"));
  if (minutes > 0) parts.push(minutes + (minutes === 1 ? " minute" : " minutes"));
  if (parts.length === 0 && seconds > 0) { // Only show seconds if it's the smallest unit left and > 0
    parts.push(seconds + (seconds === 1 ? " second" : " seconds"));
  } else if (parts.length > 0 && seconds > 0 && days === 0 && hours === 0) { // Show seconds if less than an hour remaining
     parts.push(seconds + (seconds === 1 ? " second" : " seconds"));
  }


  if (parts.length === 0 && remainingMs > 0) { // If less than a second remaining
    return "Ending soon";
  }
  
  if (parts.length === 0) { // Should be caught by remainingMs <= 0, but as a fallback
      return "Poll has ended";
  }

  return parts.join(', ') + " remaining";
};