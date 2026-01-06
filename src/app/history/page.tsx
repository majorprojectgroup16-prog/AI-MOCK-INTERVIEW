import Link from 'next/link';
import { mockHistory } from '@/lib/data';
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
import { ArrowRight } from 'lucide-react';

export default function HistoryPage() {
  const getBadgeVariant = (score: number) => {
    if (score >= 85) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

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
                {mockHistory.length > 0 ? (
                  mockHistory.map((item) => (
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
