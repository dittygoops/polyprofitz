import { PolymarketClient } from '../api/polymarket';
import {
  EventData,
  TokenData,
  MarketStatus,
  Event,
} from '../types/polymarket';
import { parseDate, formatISO, createSlug } from '../utils/time';
import { saveEventData } from '../utils/storage';

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

  // Parse date options if provided
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (options.startDate) {
    try {
      startDate = parseDate(options.startDate);
      console.log(`Start date: ${formatISO(startDate)}`);
    } catch (error) {
      throw new Error(`Invalid start date: ${options.startDate}`);
    }
  }

  if (options.endDate) {
    try {
      endDate = parseDate(options.endDate);
      console.log(`End date: ${formatISO(endDate)}`);
    } catch (error) {
      throw new Error(`Invalid end date: ${options.endDate}`);
    }
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
          limit: 100
        });
      }
    } else {
      // Already a slug, do fuzzy search
      console.log(`Exact slug not found, searching for similar events...`);
      const closedFilter = options.status === 'resolved' || options.status === 'closed';
      event = await client.findClosestEvent(eventSlugOrQuery, {
        closed: closedFilter,
        limit: 100
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

  // For now, let's fetch data for the first market
  // TODO: In the future, you might want to fetch all markets
  const marketFromEvent = event.markets[0];
  console.log(`\nFetching details for market: ${marketFromEvent.question || marketFromEvent.id}`);

  // Try to get full market details
  let market: any;
  try {
    market = await client.getMarketDetails(marketFromEvent.id);
  } catch (error) {
    console.log('Could not fetch market details, using event market data');
    market = marketFromEvent;
  }

  // Fetch market tags/categories
  console.log('Fetching market tags...');
  const tags = await client.getMarketTags(marketFromEvent.id);
  if (tags.length > 0) {
    market.tags = tags;
    console.log(`Found ${tags.length} tag(s): ${tags.map((t: any) => t.label || t.name).join(', ')}`);
  }

  // Build tokens array from available data
  // Markets can have tokens in different formats
  let tokens: any[] = [];

  // Check various possible locations for CLOB token IDs
  const checkForTokens = (obj: any) => {
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
        return tokenIds.map((tokenId: string, index: number) => ({
          token_id: tokenId,
          outcome: outcomes?.[index] || `Outcome ${index + 1}`,
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

  tokens = checkForTokens(market) || checkForTokens(marketFromEvent) || [];

  if (tokens.length === 0) {
    // Print full structure to debug
    console.error('\n=== FULL MARKET STRUCTURE ===');
    console.error(JSON.stringify(market, null, 2));
    console.error('\n=== FULL MARKET FROM EVENT ===');
    console.error(JSON.stringify(marketFromEvent, null, 2));
    throw new Error('\nMarket has no CLOB token IDs available. Please check the structures above and identify where token IDs are stored.');
  }

  console.log(`Found ${tokens.length} token(s) for this market`);

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
    market,
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
}
