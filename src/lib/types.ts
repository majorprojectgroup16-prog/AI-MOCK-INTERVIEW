import type { AnalyzeInterviewPerformanceOutput } from '@/ai/flows/analyze-interview-performance';

export type TranscriptItem = {
  speaker: 'interviewer' | 'user';
  text: string;
};

// This now includes fields that will be stored in Firestore.
export type InterviewAnalysis = AnalyzeInterviewPerformanceOutput & {
  id: string;
  userId: string;
  jobDescriptionId: string;
  resumeId: string;
  analysisDate: string; // ISO 8601 date string
  transcript: string;
};

export type InterviewHistoryItem = {
  id: string;
  jobTitle: string; // We'll need to fetch the related job description to display this
  date: string;
  overallScore: number; // We'll need to calculate or store this
  jobDescriptionId: string;
};
