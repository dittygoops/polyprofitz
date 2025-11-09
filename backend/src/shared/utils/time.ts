import { parseISO, format } from 'date-fns';

/**
 * Time utility functions for date parsing and conversion
 */

/**
 * Parse a date string and return a Date object
 * Supports ISO format and common date formats
 */
export function parseDate(dateString: string): Date {
  // Try parsing as ISO format first
  try {
    return parseISO(dateString);
  } catch {
    // Fallback to native Date parsing
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateString}`);
    }
    return date;
  }
}

/**
 * Convert Date to Unix timestamp (seconds)
 */
export function toUnixTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

/**
 * Convert Unix timestamp (seconds) to Date
 */
export function fromUnixTimestamp(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

/**
 * Format a date for filenames (safe for all operating systems)
 */
export function formatForFilename(date: Date): string {
  return format(date, 'yyyy-MM-dd_HH-mm-ss');
}

/**
 * Format a date for ISO string
 */
export function formatISO(date: Date): string {
  return date.toISOString();
}

/**
 * Validate if a date string is valid
 */
export function isValidDate(dateString: string): boolean {
  try {
    parseDate(dateString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a URL-friendly slug from a string
 */
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '');  // Remove leading/trailing hyphens
}
