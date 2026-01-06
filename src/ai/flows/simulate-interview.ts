'use server';

/**
 * @fileOverview This file defines a Genkit flow for simulating a mock interview.
 *
 * It takes a job description and a resume as input, and uses the Gemini API to conduct
 * a mock interview tailored to the specific job requirements and the candidate's skills.
 *
 * - simulateInterview - The main function to start the mock interview simulation.
 * - SimulateInterviewInput - The input type for the simulateInterview function.
 * - SimulateInterviewOutput - The output type for the simulateInterview function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SimulateInterviewInputSchema = z.object({
  jobDescription: z
    .string()
    .describe('The job description for the position being interviewed for.'),
  resume: z.string().describe('The resume of the candidate.'),
});
export type SimulateInterviewInput = z.infer<typeof SimulateInterviewInputSchema>;

const SimulateInterviewOutputSchema = z.object({
  interviewSession: z
    .string()
    .describe('A simulated interview session containing questions and answers.'),
  feedback: z.string().describe('Feedback on the interview performance.'),
});
export type SimulateInterviewOutput = z.infer<typeof SimulateInterviewOutputSchema>;

export async function simulateInterview(input: SimulateInterviewInput): Promise<SimulateInterviewOutput> {
  return simulateInterviewFlow(input);
}

const prompt = ai.definePrompt({
  name: 'simulateInterviewPrompt',
  input: {schema: SimulateInterviewInputSchema},
  output: {schema: SimulateInterviewOutputSchema},
  prompt: `You are an AI-powered interview simulator. Your task is to conduct a mock interview with a candidate based on their resume and the job description provided. After the interview, provide detailed feedback on their performance.

Job Description: {{{jobDescription}}}

Resume: {{{resume}}}

Conduct the interview, and then provide feedback on the candidate's responses, including strengths, weaknesses, and areas for improvement. Structure the interview session to include an opening, behavioral questions, technical questions (if applicable based on the job description), and a closing. The interviewSession value should contain the entire transcript of the interview, and the feedback value should contain your assessment of the candidate's performance.

`,
});

const simulateInterviewFlow = ai.defineFlow(
  {
    name: 'simulateInterviewFlow',
    inputSchema: SimulateInterviewInputSchema,
    outputSchema: SimulateInterviewOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
