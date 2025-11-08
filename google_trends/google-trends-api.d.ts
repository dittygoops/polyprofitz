declare module 'google-trends-api' {
  export function interestOverTime(options: {
    keyword: string | string[];
    startTime?: Date;
    endTime?: Date;
    geo?: string;
    hl?: string;
    timezone?: number;
    category?: number;
    granularTimeResolution?: boolean;
  }): Promise<string>;

  export function dailyTrends(options: {
    trendDate?: Date;
    geo?: string;
    hl?: string;
  }): Promise<string>;

  export function realTimeTrends(options: {
    geo?: string;
    hl?: string;
    category?: string;
  }): Promise<string>;
}

