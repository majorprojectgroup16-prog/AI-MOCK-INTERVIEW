'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing real-time feedback during a mock interview.
 *
 * - provideRealTimeFeedback - A function that takes the job description, resume, and user's response as input and returns real-time feedback.
 * - ProvideRealTimeFeedbackInput - The input type for the provideRealTimeFeedback function.
 * - ProvideRealTimeFeedbackOutput - The return type for the provideRealTimeFeedback function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const ProvideRealTimeFeedbackInputSchema = z.object({
  jobDescription: z
    .string()
    .describe('The job description for the role the user is interviewing for.'),
  resume: z.string().describe('The resume of the user.'),
  userResponse: z.string().describe('The user\'s response to the interview question.'),
  interviewQuestion: z.string().describe('The current interview question being asked.'),
});
export type ProvideRealTimeFeedbackInput = z.infer<typeof ProvideRealTimeFeedbackInputSchema>;

const ProvideRealTimeFeedbackOutputSchema = z.object({
  feedback: z.string().describe('Real-time feedback on the user\'s response.'),
});
export type ProvideRealTimeFeedbackOutput = z.infer<typeof ProvideRealTimeFeedbackOutputSchema>;

export async function provideRealTimeFeedback(input: ProvideRealTimeFeedbackInput): Promise<ProvideRealTimeFeedbackOutput> {
  return provideRealTimeFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'provideRealTimeFeedbackPrompt',
  input: {schema: ProvideRealTimeFeedbackInputSchema},
  output: {schema: ProvideRealTimeFeedbackOutputSchema},
  model: googleAI.model('gemini-1.5-flash'),
  prompt: `You are an AI-powered interview coach providing real-time feedback to a candidate during a mock interview. Consider the job description, the candidate's resume, and their response to the current interview question to provide constructive feedback.

Job Description: {{{jobDescription}}}

Resume: {{{resume}}}

Interview Question: {{{interviewQuestion}}}

Candidate's Response: {{{userResponse}}}

Provide specific feedback on the clarity, relevance, and completeness of the candidate's response. Suggest areas for improvement, such as elaborating on specific experiences or tailoring the response to better align with the job description. Keep the feedback concise and actionable.
`,
});

const provideRealTimeFeedbackFlow = ai.defineFlow(
  {
    name: 'provideRealTimeFeedbackFlow',
    inputSchema: ProvideRealTimeFeedbackInputSchema,
    outputSchema: ProvideRealTimeFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
