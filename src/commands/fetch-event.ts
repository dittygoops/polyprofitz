import { PolymarketClient } from '../api/polymarket';
import {
  EventData,
  TokenData,
  MarketStatus,
  Event,
} from '../types/polymarket';
import { parseDate, formatISO, createSlug } from '../utils/time';
import { saveEventData } from '../utils/storage';
import { plotPriceHistory, generatePlotFilename } from '../utils/plot';
import * as path from 'path';

export interface FetchEventOptions {
  startDate?: string;
  endDate?: string;
  output?: string;
  status?: MarketStatus;
}

/**
 * Fetch all data for a market event
 */
export async function fetchEventCommand(
  eventSlugOrQuery: string,
  options: FetchEventOptions
): Promise<void> {
  const client = new PolymarketClient();

  console.log(`Searching for event: ${eventSlugOrQuery}...`);

  // Parse date options if provided, default to last 7 days
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (options.startDate) {
    try {
      startDate = parseDate(options.startDate);
      console.log(`Start date: ${formatISO(startDate)}`);
    } catch (error) {
      throw new Error(`Invalid start date: ${options.startDate}`);
    }
  } else {
    // Default to 7 days ago
    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    console.log(`Start date (default): ${formatISO(startDate)} (7 days ago)`);
  }

  if (options.endDate) {
    try {
      endDate = parseDate(options.endDate);
      console.log(`End date: ${formatISO(endDate)}`);
    } catch (error) {
      throw new Error(`Invalid end date: ${options.endDate}`);
    }
  } else {
    // Default to now
    endDate = new Date();
    console.log(`End date (default): ${formatISO(endDate)} (now)`);
  }

  // Step 1: Try to find the event by exact slug first
  let event: Event | null = null;

  // Try exact slug first
  try {
    event = await client.getEventBySlug(eventSlugOrQuery);
    console.log(`\nFound event by exact slug:`);
  } catch (error) {
    // If that fails, try converting the query to a slug and searching again
    const slugified = createSlug(eventSlugOrQuery);
    if (slugified !== eventSlugOrQuery) {
      console.log(`Trying slugified version: ${slugified}...`);
      try {
        event = await client.getEventBySlug(slugified);
        console.log(`\nFound event by slugified query:`);
      } catch (error2) {
        // Still not found, do fuzzy search
        console.log(`Exact slug not found, searching for similar events...`);
        const closedFilter = options.status === 'resolved' || options.status === 'closed';
        event = await client.findClosestEvent(eventSlugOrQuery, {
          closed: closedFilter,
          limit: 1000  // Increased from 100 to search more events
        });
      }
    } else {
      // Already a slug, do fuzzy search
      console.log(`Exact slug not found, searching for similar events...`);
      const closedFilter = options.status === 'resolved' || options.status === 'closed';
      event = await client.findClosestEvent(eventSlugOrQuery, {
        closed: closedFilter,
        limit: 1000  // Increased from 100 to search more events
      });
    }
  }

  if (!event) {
    throw new Error(`No event found matching: ${eventSlugOrQuery}`);
  }

  console.log(`  ID: ${event.id}`);
  console.log(`  Title: ${event.title}`);
  console.log(`  Slug: ${event.slug}`);
  console.log(`  Active: ${event.active}`);
  console.log(`  Closed: ${event.closed}`);

  // Step 2: Get markets from the event
  if (!event.markets || event.markets.length === 0) {
    throw new Error('Event has no markets available');
  }

  console.log(`\nFound ${event.markets.length} market(s) in this event`);

  // Helper function to check various possible locations for CLOB token IDs
  const checkForTokens = (obj: any, outcomeOverride?: string) => {
    if (obj.tokens && Array.isArray(obj.tokens) && obj.tokens.length > 0) {
      return obj.tokens;
    }

    // clobTokenIds is often a JSON string, not an array
    if (obj.clobTokenIds) {
      let tokenIds = obj.clobTokenIds;
      if (typeof tokenIds === 'string') {
        try {
          tokenIds = JSON.parse(tokenIds);
        } catch (e) {
          console.warn('Failed to parse clobTokenIds:', tokenIds);
        }
      }
      if (Array.isArray(tokenIds) && tokenIds.length > 0) {
        // outcomes is also often a JSON string
        let outcomes = obj.outcomes;
        if (typeof outcomes === 'string') {
          try {
            outcomes = JSON.parse(outcomes);
          } catch (e) {
            outcomes = ['Yes', 'No']; // Default for binary markets
          }
        }

        // If this is part of a multi-outcome event, use groupItemTitle as the base outcome name
        const baseOutcome = outcomeOverride || '';

        return tokenIds.map((tokenId: string, index: number) => ({
          token_id: tokenId,
          outcome: baseOutcome ? `${baseOutcome}` : (outcomes?.[index] || `Outcome ${index + 1}`),
        }));
      }
    }

    if (obj.outcomePrices && Array.isArray(obj.outcomePrices)) {
      // Sometimes token IDs are in outcomePrices
      return obj.outcomePrices.map((price: any, index: number) => ({
        token_id: price.token_id || price.tokenId,
        outcome: obj.outcomes?.[index] || `Outcome ${index + 1}`,
      }));
    }
    return null;
  };

  // Fetch data for ALL markets in the event
  let allTokens: any[] = [];
  let primaryMarket: any = null;
  let allTags: any[] = [];

  for (let i = 0; i < event.markets.length; i++) {
    const marketFromEvent = event.markets[i];
    console.log(`\n[${i + 1}/${event.markets.length}] Fetching market: ${marketFromEvent.question || marketFromEvent.groupItemTitle || marketFromEvent.id}`);

    // Try to get full market details
    let market: any;
    try {
      market = await client.getMarketDetails(marketFromEvent.id);
    } catch (error) {
      console.log('  Could not fetch market details, using event market data');
      market = marketFromEvent;
    }

    // Store the first market as the primary one (for metadata)
    if (i === 0) {
      primaryMarket = market;

      // Fetch market tags/categories from the first market
      console.log('  Fetching market tags...');
      const tags = await client.getMarketTags(marketFromEvent.id);
      if (tags.length > 0) {
        allTags = tags;
        console.log(`  Found ${tags.length} tag(s): ${tags.map((t: any) => t.label || t.name).join(', ')}`);
      }
    }

    // Determine outcome name for multi-outcome events
    const outcomeName = marketFromEvent.groupItemTitle || null;

    // Extract tokens from this market
    const marketTokens = checkForTokens(market, outcomeName) || checkForTokens(marketFromEvent, outcomeName) || [];

    if (marketTokens.length === 0) {
      // Silently skip markets without tokens (reduces noise for large multi-outcome events)
      continue;
    }

    console.log(`  ✓ Found tokens for: ${outcomeName || marketFromEvent.question || 'market'}`);
    
    // For multi-outcome events (with groupItemTitle), only take the first token (Yes)
    // For binary markets, take all tokens
    if (outcomeName && marketTokens.length > 1) {
      allTokens.push(marketTokens[0]); // Only the "Yes" token
    } else {
      allTokens = allTokens.concat(marketTokens);
    }
  }

  if (allTokens.length === 0) {
    console.error('\n❌ No active markets found with trading data');
    console.error(`   Event: ${event.title}`);
    console.error(`   Total markets: ${event.markets.length}`);
    console.error(`   Markets with tokens: 0`);
    console.error('\n   This usually means:');
    console.error('   • The market hasn\'t started trading yet');
    console.error('   • The market is closed or inactive');
    console.error('   • The market structure doesn\'t support CLOB trading');
    console.error('\n   Try:');
    console.error('   • Searching for a different, active market');
    console.error('   • Waiting for this market to open for trading');
    throw new Error('No tradable markets found in this event');
  }
  
  console.log(`\n✓ Successfully found ${allTokens.length} tradable outcome(s) from ${event.markets.length} total markets`);

  // Add tags to the primary market
  if (allTags.length > 0) {
    primaryMarket.tags = allTags;
  }

  console.log(`\nTotal outcomes across all markets: ${allTokens.length}`);

  // Build tokens array from all markets
  let tokens: any[] = allTokens;

  // Fetch data for each token
  const tokenDataPromises = tokens.map(async (token: any) => {
    console.log(`Fetching data for token: ${token.outcome} (${token.token_id})...`);

    // Fetch price history
    let priceHistory: any[] = [];
    try {
      priceHistory = await client.getPriceHistory(
        token.token_id,
        startDate,
        endDate
      );
      console.log(`  - Price points: ${priceHistory.length}`);
    } catch (error) {
      console.warn(`  - Could not fetch price history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const tokenData: TokenData = {
      tokenId: token.token_id,
      outcome: token.outcome,
      priceHistory,
      trades: [],
      volumeMetrics: {
        total_volume: '0',
        trade_count: 0,
      },
    };

    return tokenData;
  });

  const tokenDataResults = await Promise.all(tokenDataPromises);

  // Prepare the complete event data
  const eventData: EventData = {
    market: primaryMarket,
    tokens: tokenDataResults,
    fetchedAt: formatISO(new Date()),
    timeRange: {
      start: startDate ? formatISO(startDate) : null,
      end: endDate ? formatISO(endDate) : null,
    },
  };

  // Save to file using the event slug
  const fileSlug = event.slug || eventSlugOrQuery;
  const filePath = saveEventData(eventData, fileSlug, options.output);

  console.log(`\nData saved successfully to: ${filePath}`);
  console.log(`Total tokens: ${tokenDataResults.length}`);
  console.log(`Total price data points: ${tokenDataResults.reduce((sum, t) => sum + t.priceHistory.length, 0)}`);

  // Generate plot
  console.log('\nGenerating price history plot...');
  const outputDir = options.output || './data';
  const plotFilename = generatePlotFilename(fileSlug);
  const plotPath = path.join(outputDir, plotFilename);
  plotPriceHistory(eventData, plotPath);
  console.log(`Plot saved to: ${plotPath}`);
  console.log(`Open the plot in your browser to view the interactive chart.`);
}
