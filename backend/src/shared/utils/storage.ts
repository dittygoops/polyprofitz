import * as fs from 'fs';
import * as path from 'path';
import { EventData } from '../types/polymarket';
import { formatForFilename } from './time';

/**
 * Storage utility functions for saving data to JSON files
 */

/**
 * Ensure the data directory exists
 */
function ensureDataDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Save event data to a JSON file
 */
export function saveEventData(
  data: EventData,
  marketSlug: string,
  outputPath?: string
): string {
  const timestamp = formatForFilename(new Date());
  const filename = `${marketSlug}_${timestamp}.json`;

  const dirPath = outputPath || path.join(process.cwd(), 'data');
  ensureDataDirectory(dirPath);

  const filePath = path.join(dirPath, filename);

  // Write JSON with pretty formatting
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

  return filePath;
}

/**
 * Load event data from a JSON file
 */
export function loadEventData(filePath: string): EventData {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as EventData;
}

/**
 * Get all saved event data files in a directory
 */
export function listEventDataFiles(dirPath?: string): string[] {
  const dataDir = dirPath || path.join(process.cwd(), 'data');

  if (!fs.existsSync(dataDir)) {
    return [];
  }

  return fs
    .readdirSync(dataDir)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(dataDir, file));
}
