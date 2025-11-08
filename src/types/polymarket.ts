/**
 * Type definitions for Polymarket API responses and data structures
 */

export interface Market {
  id: string;
  question: string;
  description?: string;
  market_slug: string;
  end_date_iso: string;
  game_start_time?: string;
  created_at?: string;
  updated_at?: string;
  volume?: string;
  volume_24hr?: string;
  liquidity?: string;
  active?: boolean;
  closed?: boolean;
  accepting_orders?: boolean;
  tokens?: Token[];
  outcomes?: string[];
}

export interface Token {
  token_id: string;
  outcome: string;
  price?: string;
  winner?: boolean;
}

export interface PricePoint {
  t: number; // Unix timestamp
  p: string; // Price as string
}

export interface PriceHistory {
  token_id: string;
  outcome: string;
  prices: PricePoint[];
}

export interface Trade {
  id: string;
  market: string;
  asset_id: string;
  maker_address: string;
  taker_address?: string;
  price: string;
  side: 'BUY' | 'SELL';
  size: string;
  timestamp: number;
  outcome?: string;
  fee_rate_bps?: string;
  status?: string;
}

export interface VolumeMetrics {
  total_volume: string;
  trade_count: number;
  volume_by_hour?: Record<string, string>;
  volume_by_day?: Record<string, string>;
}

export interface EventData {
  market: Market;
  tokens: TokenData[];
  fetchedAt: string;
  timeRange?: {
    start: string | null;
    end: string | null;
  };
}

export interface TokenData {
  tokenId: string;
  outcome: string;
  priceHistory: PricePoint[];
  trades: Trade[];
  volumeMetrics: VolumeMetrics;
}

export interface PolymarketApiConfig {
  baseUrl: string;
  timeout?: number;
}

export type MarketStatus = 'active' | 'closed' | 'resolved' | 'archived';

export interface MarketSearchParams {
  slug?: string;
  closed?: boolean;
  archived?: boolean;
  _status?: MarketStatus;
}

export interface Event {
  id: string;
  ticker?: string | null;
  slug?: string | null;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  resolutionSource?: string | null;
  startDate?: string | null;
  creationDate?: string | null;
  endDate?: string | null;
  image?: string | null;
  icon?: string | null;
  active?: boolean | null;
  closed?: boolean | null;
  archived?: boolean | null;
  new?: boolean | null;
  featured?: boolean | null;
  restricted?: boolean | null;
  liquidity?: number | null;
  volume?: number | null;
  openInterest?: number | null;
  volume24hr?: number | null;
  volume1wk?: number | null;
  volume1mo?: number | null;
  volume1yr?: number | null;
  markets?: any[];
  tags?: any[];
  [key: string]: any; // Allow other fields
}

export interface EventSearchParams {
  limit?: number;
  offset?: number;
  order?: string;
  ascending?: boolean;
  id?: number[];
  slug?: string[];
  tag_id?: number;
  exclude_tag_id?: number[];
  related_tags?: boolean;
  featured?: boolean;
  cyom?: boolean;
  include_chat?: boolean;
  include_template?: boolean;
  recurrence?: string;
  closed?: boolean;
  start_date_min?: string;
  start_date_max?: string;
  end_date_min?: string;
  end_date_max?: string;
}
