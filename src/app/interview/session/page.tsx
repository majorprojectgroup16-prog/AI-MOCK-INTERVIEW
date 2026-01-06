'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { provideRealTimeFeedback } from '@/ai/flows/provide-real-time-feedback';
import type { TranscriptItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Bot, Loader2, User } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const interviewQuestions = [
  'Tell me about yourself.',
  'What are your biggest strengths?',
  'What are your biggest weaknesses?',
  'Why are you interested in this role?',
  'Where do you see yourself in five years?',
];

export default function InterviewSessionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [jobDescription, setJobDescription] = useState('');
  const [resume, setResume] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [feedback, setFeedback] = useState('');
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedJD = localStorage.getItem('jobDescription');
    const storedResume = localStorage.getItem('resume');

    if (!storedJD || !storedResume) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Interview details not found. Please start over.',
      });
      router.push('/interview');
    } else {
      setJobDescription(storedJD);
      setResume(storedResume);
      setIsInitialized(true);
    }
  }, [router, toast]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [transcript]);

  const handleAnswerSubmit = async () => {
    if (!userAnswer.trim()) {
      toast({
        variant: 'destructive',
        title: 'Empty Answer',
        description: 'Please provide an answer to the question.',
      });
      return;
    }

    const currentQuestion = interviewQuestions[currentQuestionIndex];
    setTranscript((prev) => [
      ...prev,
      { speaker: 'interviewer', text: currentQuestion },
      { speaker: 'user', text: userAnswer },
    ]);
    
    setIsFeedbackLoading(true);
    setFeedback('');

    try {
      const feedbackResult = await provideRealTimeFeedback({
        jobDescription,
        resume,
        interviewQuestion: currentQuestion,
        userResponse: userAnswer,
      });
      setFeedback(feedbackResult.feedback);
    } catch (error) {
      console.error('Error getting feedback:', error);
      toast({
        variant: 'destructive',
        title: 'AI Error',
        description: 'Could not get feedback from the AI. Please try again.',
      });
    } finally {
      setIsFeedbackLoading(false);
      setUserAnswer('');
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < interviewQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setFeedback('');
    } else {
      handleEndInterview();
    }
  };

  const handleEndInterview = () => {
    localStorage.setItem('interviewTranscript', JSON.stringify(transcript));
    toast({
      title: 'Interview Complete',
      description: 'Generating your performance report...',
    });
    router.push('/interview/report');
  };

  if (!isInitialized) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container py-8 flex-1">
      <div className="grid md:grid-cols-2 gap-8 h-full">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Interview Transcript</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 pr-4 -mr-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {transcript.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {item.speaker === 'interviewer' ? 
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"><Bot size={18} /></span> :
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground"><User size={18} /></span>
                      }
                    </div>
                    <div className="flex-1 rounded-lg bg-muted p-3 text-sm">
                      <p className="font-semibold mb-1">{item.speaker === 'interviewer' ? 'Interviewer' : 'You'}</p>
                      <p className="text-muted-foreground whitespace-pre-wrap">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Question {currentQuestionIndex + 1} of {interviewQuestions.length}</CardTitle>
              <CardDescription className="text-lg pt-2">{interviewQuestions[currentQuestionIndex]}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Type your answer here..."
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="min-h-[150px]"
                  disabled={isFeedbackLoading}
                />
                <Button onClick={handleAnswerSubmit} disabled={isFeedbackLoading || !userAnswer} className="w-full">
                  {isFeedbackLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Submit Answer
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle>Real-time Feedback</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="flex-1">
                {isFeedbackLoading && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/> Analyzing...</div>}
                {feedback && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{feedback}</p>}
                {!isFeedbackLoading && !feedback && <p className="text-sm text-muted-foreground">Submit your answer to get AI feedback.</p>}
              </div>
              <div className="mt-4 flex gap-4">
                <Button onClick={handleNextQuestion} variant="outline" className="flex-1" disabled={!feedback && !isFeedbackLoading}>
                  {currentQuestionIndex < interviewQuestions.length - 1 ? 'Next Question' : 'Finish Interview'} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button onClick={handleEndInterview} variant="destructive" className="flex-1">
                  End Interview Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
