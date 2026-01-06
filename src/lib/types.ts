import type { AnalyzeInterviewPerformanceOutput } from '@/ai/flows/analyze-interview-performance';

export type TranscriptItem = {
  speaker: 'interviewer' | 'user';
  text: string;
};

export type InterviewAnalysis = AnalyzeInterviewPerformanceOutput;

export type InterviewHistoryItem = {
  id: string;
  jobTitle: string;
  date: string;
  overallScore: number;
};
