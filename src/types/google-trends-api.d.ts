/**
 * Type definitions for google-trends-api
 * This module doesn't have official types, so we declare them here
 */

declare module 'google-trends-api' {
  export interface InterestOverTimeOptions {
    keyword: string | string[];
    startTime?: Date;
    endTime?: Date;
    geo?: string;
    hl?: string;
    timezone?: number;
    category?: number;
    granularTimeResolution?: boolean;
  }

  export interface InterestByRegionOptions {
    keyword: string | string[];
    startTime?: Date;
    endTime?: Date;
    geo?: string;
    hl?: string;
    timezone?: number;
    category?: number;
    resolution?: string;
  }

  export interface RelatedQueriesOptions {
    keyword: string;
    startTime?: Date;
    endTime?: Date;
    geo?: string;
    hl?: string;
    timezone?: number;
    category?: number;
  }

  export function interestOverTime(options: InterestOverTimeOptions): Promise<string>;
  export function interestByRegion(options: InterestByRegionOptions): Promise<string>;
  export function relatedQueries(options: RelatedQueriesOptions): Promise<string>;
  export function relatedTopics(options: RelatedQueriesOptions): Promise<string>;
  export function autoComplete(options: { keyword: string; hl?: string }): Promise<string>;
  export function dailyTrends(options: { geo?: string; hl?: string }): Promise<string>;
  export function realTimeTrends(options: { geo?: string; hl?: string; category?: string }): Promise<string>;
}

