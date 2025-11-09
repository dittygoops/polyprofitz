import googleTrends from 'google-trends-api';

export interface TrendsResult {
  current: number;
  twentyFourHoursAgo: number;
  sevenDaysAgo: number;
  history: Array<{ t: number; v: number }>;
}

export class TrendsService {
  async getGoogleTrends(keyword: string, daysBack: number = 7): Promise<TrendsResult> {
    try {
      const startTime = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
      const endTime = new Date();

      const result = await googleTrends.interestOverTime({
        keyword,
        startTime,
        endTime,
        granularTimeResolution: true,
      });

      const data = JSON.parse(result);
      const timelineData = data.default?.timelineData || [];

      if (timelineData.length === 0) {
        console.warn(`No Google Trends data for keyword: ${keyword}`);
        return {
          current: 0,
          twentyFourHoursAgo: 0,
          sevenDaysAgo: 0,
          history: [],
        };
      }

      // Extract history
      const history = timelineData.map((point: any) => ({
        t: new Date(point.time * 1000).getTime(),
        v: point.value[0] || 0,
      }));

      // Get current, 24h ago, and 7 days ago values
      const current = timelineData[timelineData.length - 1]?.value[0] || 0;
      const twentyFourHoursAgo = timelineData.length >= 24
        ? timelineData[timelineData.length - 24]?.value[0] || 0
        : current; // Fallback to current if not enough data
      const sevenDaysAgo = timelineData[0]?.value[0] || 0;

      return {
        current,
        twentyFourHoursAgo,
        sevenDaysAgo,
        history,
      };
    } catch (error: any) {
      console.error('Google Trends error:', error);

      // Return zeros instead of failing completely
      return {
        current: 0,
        twentyFourHoursAgo: 0,
        sevenDaysAgo: 0,
        history: [],
      };
    }
  }
}
