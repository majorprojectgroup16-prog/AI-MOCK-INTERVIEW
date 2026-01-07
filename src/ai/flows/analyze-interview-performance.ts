'use server';

/**
 * @fileOverview Provides a detailed post-interview analysis highlighting strengths, weaknesses, and areas for improvement.
 *
 * - analyzeInterviewPerformance - A function that analyzes the interview and provides feedback.
 * - AnalyzeInterviewPerformanceInput - The input type for the analyzeInterviewPerformance function.
 * - AnalyzeInterviewPerformanceOutput - The return type for the analyzeInterviewPerformance function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const AnalyzeInterviewPerformanceInputSchema = z.object({
  jobDescription: z.string().describe('The job description for the role.'),
  resume: z.string().describe('The resume of the candidate.'),
  interviewTranscript: z.string().describe('The transcript of the mock interview.'),
});
export type AnalyzeInterviewPerformanceInput = z.infer<typeof AnalyzeInterviewPerformanceInputSchema>;

const PerformanceScoreSchema = z.object({
  name: z.string().describe('The name of the skill or area being scored (e.g., Clarity, Technical Knowledge).'),
  score: z.number().min(0).max(100).describe('The score from 0 to 100 for this area.'),
  justification: z.string().describe('A brief justification for the score.'),
});

const AnalyzeInterviewPerformanceOutputSchema = z.object({
  strengths: z.string().describe('The strengths demonstrated during the interview.'),
  weaknesses: z.string().describe('The weaknesses demonstrated during the interview.'),
  areasForImprovement: z.string().describe('Areas for improvement based on the interview.'),
  overallFeedback: z.string().describe('Overall feedback on the interview performance.'),
  scores: z.array(PerformanceScoreSchema).describe('A list of scores for different performance metrics like Clarity, Relevance, and Confidence. Provide 3 to 5 metrics.'),
});
export type AnalyzeInterviewPerformanceOutput = z.infer<typeof AnalyzeInterviewPerformanceOutputSchema>;

export async function analyzeInterviewPerformance(
  input: AnalyzeInterviewPerformanceInput
): Promise<AnalyzeInterviewPerformanceOutput> {
  return analyzeInterviewPerformanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeInterviewPerformancePrompt',
  input: {schema: AnalyzeInterviewPerformanceInputSchema},
  output: {schema: AnalyzeInterviewPerformanceOutputSchema},
  model: googleAI.model('gemini-1.5-flash'),
  prompt: `You are an expert interview analyst. Analyze the interview transcript, resume, and job description to provide detailed feedback.

Job Description: {{{jobDescription}}}

Resume: {{{resume}}}

Interview Transcript: {{{interviewTranscript}}}

Provide a structured analysis covering strengths, weaknesses, areas for improvement, and overall feedback.
Also provide a list of 3-5 scores for key performance metrics such as "Clarity", "Relevance", "Confidence", "STAR Method Usage", or "Technical Depth". For each metric, provide a score from 0-100 and a brief justification.`,
});

const analyzeInterviewPerformanceFlow = ai.defineFlow(
  {
    name: 'analyzeInterviewPerformanceFlow',
    inputSchema: AnalyzeInterviewPerformanceInputSchema,
    outputSchema: AnalyzeInterviewPerformanceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
