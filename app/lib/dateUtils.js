/**
 * Date utility functions for PST/PDT timezone handling
 *
 * Problem: Backend sends dates as LocalDate (e.g., "2026-01-30")
 * JavaScript treats this as UTC midnight, which is the previous day in PST
 *
 * Solution: Always interpret dates as PST and format them accordingly
 */

/**
 * Format a date string or Date object to PST/PDT display format
 * @param {string|Date} date - Date string from backend or Date object
 * @param {boolean} includeTime - Whether to include time (default: false)
 * @returns {string} Formatted date in PST/PDT
 */
export function formatDatePST(date, includeTime = false) {
  if (!date) return 'N/A';

  let dateObj;

  if (typeof date === 'string') {
    // If it's just a date string like "2026-01-30", append time to avoid UTC midnight issue
    if (date.length === 10 && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Treat as PST date by appending noon PST time
      dateObj = new Date(date + 'T12:00:00');
    } else {
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }

  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  const options = {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.second = '2-digit';
  }

  return dateObj.toLocaleString('en-US', options);
}

/**
 * Format date for input fields (YYYY-MM-DD in PST)
 * @param {string|Date} date - Date string or Date object
 * @returns {string} Date in YYYY-MM-DD format (PST)
 */
export function formatDateForInput(date) {
  if (!date) return '';

  let dateObj;

  if (typeof date === 'string') {
    // If already in YYYY-MM-DD format, return as-is
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date;
    }
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }

  if (isNaN(dateObj.getTime())) return '';

  // Get PST date components
  const pstDate = new Date(dateObj.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));

  const year = pstDate.getFullYear();
  const month = String(pstDate.getMonth() + 1).padStart(2, '0');
  const day = String(pstDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Get current date in PST as YYYY-MM-DD
 * @returns {string} Today's date in PST
 */
export function getTodayPST() {
  const now = new Date();
  const pstDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));

  const year = pstDate.getFullYear();
  const month = String(pstDate.getMonth() + 1).padStart(2, '0');
  const day = String(pstDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Format date/time for display with PST timezone indicator
 * @param {string|Date} date - Date string or Date object
 * @returns {string} Formatted date/time with timezone
 */
export function formatDateTimePST(date) {
  if (!date) return 'N/A';

  const formatted = formatDatePST(date, true);
  if (formatted === 'Invalid Date' || formatted === 'N/A') return formatted;

  // Check if DST is in effect
  const dateObj = new Date(date);
  const pstOffset = new Date(dateObj.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const isDST = pstOffset.getTimezoneOffset() < dateObj.getTimezoneOffset();

  return `${formatted} ${isDST ? 'PDT' : 'PST'}`;
}

/**
 * Parse a date input value and ensure it's treated as PST
 * @param {string} dateString - Date string from input field (YYYY-MM-DD)
 * @returns {Date} Date object representing PST date
 */
export function parseDateAsPST(dateString) {
  if (!dateString) return null;

  // Create date at noon PST to avoid timezone shift issues
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0);

  return date;
}

/**
 * Format a date range for display
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date (null for ongoing)
 * @returns {string} Formatted date range
 */
export function formatDateRangePST(startDate, endDate) {
  const start = formatDatePST(startDate);

  if (!endDate) {
    return `${start} to present`;
  }

  const end = formatDatePST(endDate);
  return `${start} to ${end}`;
}

/**
 * Calculate duration between two dates
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date (null for ongoing)
 * @returns {string} Duration description
 */
export function calculateDuration(startDate, endDate) {
  if (!startDate) return 'Unknown';

  const start = parseDateAsPST(typeof startDate === 'string' && startDate.length === 10 ? startDate : formatDateForInput(startDate));
  const end = endDate ? parseDateAsPST(typeof endDate === 'string' && endDate.length === 10 ? endDate : formatDateForInput(endDate)) : new Date();

  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 30) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months !== 1 ? 's' : ''}`;
  } else {
    const years = Math.floor(diffDays / 365);
    const remainingMonths = Math.floor((diffDays % 365) / 30);
    if (remainingMonths > 0) {
      return `${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    }
    return `${years} year${years !== 1 ? 's' : ''}`;
  }
}
