#!/usr/bin/env node

import { Command } from 'commander';
import { fetchEventCommand } from './commands/fetch-event';

const program = new Command();

program
  .name('polyprofitz')
  .description('CLI tool for fetching and storing Polymarket event data')
  .version('1.0.0');

program
  .command('fetch-event')
  .description('Fetch all data for a Polymarket event by market slug')
  .argument('<market-slug>', 'Market slug (e.g., "trump-election-2024")')
  .option('-s, --start-date <date>', 'Start date for historical data (ISO format or common date format)')
  .option('-e, --end-date <date>', 'End date for historical data (ISO format or common date format)')
  .option('-o, --output <path>', 'Output directory for JSON file (default: ./data)')
  .option('--status <status>', 'Market status filter (active, closed, resolved, archived)', 'active')
  .action(async (marketSlug: string, options) => {
    try {
      await fetchEventCommand(marketSlug, options);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
