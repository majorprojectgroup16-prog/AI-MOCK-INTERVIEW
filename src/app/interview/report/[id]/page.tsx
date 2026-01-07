'use client';

import { useEffect, useState } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { InterviewAnalysis } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ThumbsUp, ThumbsDown, Target, Award } from 'lucide-react';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';

const chartConfig = {
  score: {
    label: 'Score',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export default function ReportPage({ params }: { params: { id: string } }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const analysisRef = useMemoFirebase(() => {
    if (!user || !params.id) return null;
    return doc(firestore, `users/${user.uid}/interviewAnalyses/${params.id}`);
  }, [firestore, user, params.id]);

  const { data: analysis, isLoading, error } = useDoc<InterviewAnalysis>(analysisRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isLoading || isUserLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-xl font-semibold">Loading your report...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold">Error loading report.</h2>
        <p className="text-muted-foreground mt-2">{error.message}</p>
        <Button asChild className="mt-4">
          <Link href="/history">Back to History</Link>
        </Button>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold">Report not found.</h2>
        <p className="text-muted-foreground mt-2">Could not find the specified interview report.</p>
        <Button asChild className="mt-4">
          <Link href="/history">Back to History</Link>
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
                <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>A visual breakdown of your performance scores.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                        <BarChart accessibilityLayer data={analysis.scores}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                            dataKey="name"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            />
                            <YAxis domain={[0, 100]} />
                            <Tooltip
                                cursor={false}
                                content={<ChartTooltipContent 
                                    labelKey="name" 
                                    formatter={(value, name, payload) => (
                                        <div>
                                            <p className="font-medium">{payload.payload.name}: {value}</p>
                                            <p className="text-sm text-muted-foreground">{payload.payload.justification}</p>
                                        </div>
                                    )}
                                />}
                            />
                            <Bar dataKey="score" fill="var(--color-score)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

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