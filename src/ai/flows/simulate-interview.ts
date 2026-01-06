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
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const SimulateInterviewInputSchema = z.object({
  jobDescription: z
    .string()
    .describe('The job description for the position being interviewed for.'),
  resume: z.string().describe('The resume of the candidate.'),
});
export type SimulateInterviewInput = z.infer<typeof SimulateInterviewInputSchema>;

const SimulateInterviewOutputSchema = z.object({
  questions: z.array(z.string()).describe('A list of interview questions.'),
});
export type SimulateInterviewOutput = z.infer<typeof SimulateInterviewOutputSchema>;

export async function simulateInterview(input: SimulateInterviewInput): Promise<SimulateInterviewOutput> {
  return simulateInterviewFlow(input);
}

const prompt = ai.definePrompt({
  name: 'simulateInterviewPrompt',
  input: {schema: SimulateInterviewInputSchema},
  output: {schema: SimulateInterviewOutputSchema},
  model: googleAI.model('gemini-pro'),
  prompt: `You are an AI-powered interview simulator. Your task is to generate a list of relevant interview questions based on the provided job description and candidate's resume.

Job Description: {{{jobDescription}}}

Resume: {{{resume}}}

Generate a list of 5-7 interview questions. The questions should cover a mix of behavioral, technical (if applicable), and situational topics relevant to the role.
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
