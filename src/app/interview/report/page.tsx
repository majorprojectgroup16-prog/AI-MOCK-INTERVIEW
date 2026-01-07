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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useUser, useFirestore } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const chartConfig = {
  score: {
    label: 'Score',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export default function ReportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<InterviewAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
        router.push('/login');
        return;
    }

    const getAnalysis = async () => {
      const jobDescription = localStorage.getItem('jobDescription');
      const resume = localStorage.getItem('resume');
      const transcriptJSON = localStorage.getItem('interviewTranscript');
      const jobDescriptionId = localStorage.getItem('jobDescriptionId');
      const resumeId = localStorage.getItem('resumeId');

      if (!jobDescription || !resume || !transcriptJSON || !jobDescriptionId || !resumeId) {
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

        const analysisDocRef = doc(collection(firestore, `users/${user.uid}/interviewAnalyses`));

        const analysisData: Omit<InterviewAnalysis, 'id'> = {
            ...result,
            userId: user.uid,
            jobDescriptionId,
            resumeId,
            analysisDate: new Date().toISOString(),
            transcript: interviewTranscript,
        };

        setDocumentNonBlocking(analysisDocRef, analysisData, { merge: true });

        setAnalysis({ ...analysisData, id: analysisDocRef.id });

        // Clean up localStorage
        localStorage.removeItem('jobDescription');
        localStorage.removeItem('resume');
        localStorage.removeItem('interviewTranscript');
        localStorage.removeItem('jobDescriptionId');
        localStorage.removeItem('resumeId');
        
        // Redirect to the new report page
        router.replace(`/interview/report/${analysisDocRef.id}`);

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
  }, [user, isUserLoading, router, toast, firestore]);

  if (isLoading || isUserLoading) {
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
  
  // This part of the component will likely not be reached as it redirects.
  // It's here as a fallback during the transition.
  return (
    <div className="container py-8 flex-1">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold font-headline text-primary">Interview Performance Report</h1>
          <p className="text-lg text-muted-foreground mt-2">Redirecting to your saved report...</p>
        </div>
      </div>
    </div>
  );
}
