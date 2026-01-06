'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { analyzeInterviewPerformance } from '@/ai/flows/analyze-interview-performance';
import type { InterviewAnalysis, TranscriptItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ThumbsUp, ThumbsDown, Target, Award } from 'lucide-react';
import Link from 'next/link';

export default function ReportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<InterviewAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getAnalysis = async () => {
      const jobDescription = localStorage.getItem('jobDescription');
      const resume = localStorage.getItem('resume');
      const transcriptJSON = localStorage.getItem('interviewTranscript');

      if (!jobDescription || !resume || !transcriptJSON) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load interview data. Please start a new interview.',
        });
        router.push('/interview');
        return;
      }

      try {
        const transcript: TranscriptItem[] = JSON.parse(transcriptJSON);
        const interviewTranscript = transcript.map(item => `${item.speaker === 'user' ? 'Candidate' : 'Interviewer'}: ${item.text}`).join('\n\n');
        
        const result = await analyzeInterviewPerformance({
          jobDescription,
          resume,
          interviewTranscript,
        });
        setAnalysis(result);
      } catch (error) {
        console.error('Error getting analysis:', error);
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: 'There was an error generating your report.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    getAnalysis();
  }, [router, toast]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-xl font-semibold">Generating your report...</h2>
        <p className="text-muted-foreground">The AI is analyzing your performance.</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold">Could not generate report.</h2>
        <p className="text-muted-foreground mt-2">Please try another interview.</p>
        <Button asChild className="mt-4">
          <Link href="/interview">Start New Interview</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container py-8 flex-1">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold font-headline text-primary">Interview Performance Report</h1>
          <p className="text-lg text-muted-foreground mt-2">Here's a breakdown of your performance.</p>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Award className="w-8 h-8 text-primary" />
              <div>
                <CardTitle>Overall Feedback</CardTitle>
                <CardDescription>A summary of your interview.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{analysis.overallFeedback}</p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <ThumbsUp className="w-8 h-8 text-green-500" />
                <div>
                  <CardTitle>Strengths</CardTitle>
                  <CardDescription>What you did well.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{analysis.strengths}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <ThumbsDown className="w-8 h-8 text-red-500" />
                <div>
                  <CardTitle>Weaknesses</CardTitle>
                  <CardDescription>Areas to be mindful of.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{analysis.weaknesses}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Target className="w-8 h-8 text-accent" />
              <div>
                <CardTitle>Areas for Improvement</CardTitle>
                <CardDescription>Actionable advice for your next interview.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{analysis.areasForImprovement}</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <Button asChild>
            <Link href="/interview">Start a New Interview</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/history">View History</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
