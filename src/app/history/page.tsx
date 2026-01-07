'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, getDoc, doc } from 'firebase/firestore';
import type { InterviewAnalysis } from '@/lib/types';
import { format } from 'date-fns';
import { useState } from 'react';

// New type for the combined data
type HistoryViewItem = {
  id: string;
  jobTitle: string;
  date: string;
  overallScore: number;
};

export default function HistoryPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [historyItems, setHistoryItems] = useState<HistoryViewItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  const analysesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/interviewAnalyses`),
      orderBy('analysisDate', 'desc')
    );
  }, [firestore, user]);

  const { data: analyses, isLoading: areAnalysesLoading } = useCollection<InterviewAnalysis>(analysesQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (analyses && firestore && user) {
      const fetchRelatedData = async () => {
        setIsHistoryLoading(true);
        const items: HistoryViewItem[] = await Promise.all(
          analyses.map(async (analysis) => {
            let jobTitle = 'Untitled Job';
            try {
              const jobDescRef = doc(firestore, `users/${user.uid}/jobDescriptions/${analysis.jobDescriptionId}`);
              const jobDescSnap = await getDoc(jobDescRef);
              if (jobDescSnap.exists()) {
                // Assuming the title is stored in a 'title' field.
                // If not, you might need to generate one from content.
                jobTitle = jobDescSnap.data().title || `Job from ${format(new Date(analysis.analysisDate), 'PPP')}`;
              }
            } catch (e) {
                console.error("Could not fetch job description", e);
            }

            // Calculate overall score (average of scores)
            const overallScore = analysis.scores && analysis.scores.length > 0
                ? Math.round(analysis.scores.reduce((acc, s) => acc + s.score, 0) / analysis.scores.length)
                : 0;

            return {
              id: analysis.id,
              jobTitle,
              date: format(new Date(analysis.analysisDate), 'PPP'),
              overallScore,
            };
          })
        );
        setHistoryItems(items);
        setIsHistoryLoading(false);
      };

      fetchRelatedData();
    } else if (!areAnalysesLoading) {
        setIsHistoryLoading(false);
    }
  }, [analyses, areAnalysesLoading, firestore, user]);

  const getBadgeVariant = (score: number) => {
    if (score >= 85) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

  const isLoading = isUserLoading || areAnalysesLoading || isHistoryLoading;

  return (
    <div className="container py-8 flex-1">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline">Interview History</h1>
          <p className="text-muted-foreground mt-1">Track your progress and review past performances.</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Your Past Interviews</CardTitle>
            <CardDescription>This is a log of your completed mock interviews.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Overall Score</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyItems.length > 0 ? (
                    historyItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.jobTitle}</TableCell>
                        <TableCell>{item.date}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={getBadgeVariant(item.overallScore)}>{item.overallScore}%</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/interview/report/${item.id}`}>
                              View Report
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">
                        No interview history found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
