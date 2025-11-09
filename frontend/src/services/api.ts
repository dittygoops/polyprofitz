import axios from 'axios';
import { AnalysisResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const analyzeMarket = async (query: string): Promise<AnalysisResponse> => {
  try {
    const response = await api.post<AnalysisResponse>('/api/analyze', { query });
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      return error.response.data;
    }

    return {
      success: false,
      error: error.message || 'Failed to analyze market',
    };
  }
};
