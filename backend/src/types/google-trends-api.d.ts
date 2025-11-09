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

  export function interestOverTime(options: InterestOverTimeOptions): Promise<string>;
  export function interestByRegion(options: InterestByRegionOptions): Promise<string>;
  export function relatedQueries(options: any): Promise<string>;
  export function relatedTopics(options: any): Promise<string>;
}

