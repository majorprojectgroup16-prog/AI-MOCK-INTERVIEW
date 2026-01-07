'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { provideRealTimeFeedback } from '@/ai/flows/provide-real-time-feedback';
import type { TranscriptItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Bot, Loader2, User, Mic, MicOff } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { simulateInterview } from '@/ai/flows/simulate-interview';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';


// Declare the speech recognition type for window
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function InterviewSessionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [jobDescription, setJobDescription] = useState('');
  const [resume, setResume] = useState('');
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [feedback, setFeedback] = useState('');
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [areQuestionsLoading, setAreQuestionsLoading] = useState(true);

  // New state for speech recognition
  const [isRecording, setIsRecording] = useState(false);
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState(false);
  const recognitionRef = useRef<any>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Text to Speech function
  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Cancel any ongoing speech before starting a new one
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      // You can configure voice, rate, pitch etc. here if needed
      // const voices = window.speechSynthesis.getVoices();
      // utterance.voice = voices[0];
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

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
  
  // Request microphone permission on component mount
  useEffect(() => {
    const getMicrophonePermission = async () => {
      if (typeof window !== 'undefined' && 'mediaDevices' in navigator) {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          setHasMicrophonePermission(true);
        } catch (error) {
          console.error('Microphone access denied:', error);
          setHasMicrophonePermission(false);
          toast({
            variant: 'destructive',
            title: 'Microphone Access Denied',
            description: 'Please enable microphone permissions in your browser settings to use voice input.',
          });
        }
      }
    };
    getMicrophonePermission();
  }, [toast]);


  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          // Update the textarea with the final transcript part, appended to existing text
          setUserAnswer(prevAnswer => prevAnswer + finalTranscript);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
            toast({
              variant: 'destructive',
              title: 'Speech Error',
              description: `An error occurred with speech recognition: ${event.error}`,
            });
          }
          // Always set recording to false on error to allow restart
          setIsRecording(false);
        };
        
        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      } else {
        toast({
            title: 'Browser Not Supported',
            description: 'Speech recognition is not supported in your browser.',
        });
      }
    }
  }, [toast]);


  const toggleRecording = () => {
    if (!recognitionRef.current || !hasMicrophonePermission) {
        if(!hasMicrophonePermission) {
            toast({
                variant: 'destructive',
                title: 'Cannot Record',
                description: 'Microphone access is not granted.',
            });
        }
        return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch(e) {
        // This catch block handles cases where start() is called on an already active recognition.
        // It might happen in rare race conditions.
        console.error("Could not start speech recognition:", e);
        if (e instanceof Error && e.name === 'InvalidStateError') {
          // It's already started, so we just ensure our state is correct.
          setIsRecording(true);
        }
      }
    }
  };


  useEffect(() => {
    if (isInitialized) {
      const getQuestions = async () => {
        try {
          setAreQuestionsLoading(true);
          const result = await simulateInterview({
            jobDescription,
            resume,
          });
          setInterviewQuestions(result.questions);
          // Speak the first question
          if (result.questions.length > 0) {
            speak(result.questions[0]);
          }
        } catch (error) {
          console.error('Error getting interview questions:', error);
          toast({
            variant: 'destructive',
            title: 'AI Error',
            description: 'Could not generate interview questions. Please try again.',
          });
          router.push('/interview');
        } finally {
          setAreQuestionsLoading(false);
        }
      };
      getQuestions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, jobDescription, resume, router, toast]); // speak is stable

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [transcript]);

  const handleAnswerSubmit = async () => {
    if (isRecording) {
        toggleRecording();
    }
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
      speak("Here's some feedback.");
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
      const nextQuestionIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextQuestionIndex);
      setFeedback('');
      // Speak the next question
      speak(interviewQuestions[nextQuestionIndex]);
    } else {
      handleEndInterview();
    }
  };

  const handleEndInterview = () => {
    // Stop any ongoing speech or recording
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    if (isRecording && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsRecording(false);
    }
    
    localStorage.setItem('interviewTranscript', JSON.stringify(transcript));
    toast({
      title: 'Interview Complete',
      description: 'Generating your performance report...',
    });
    router.push('/interview/report');
  };

  if (!isInitialized || areQuestionsLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-xl font-semibold">Generating your interview questions...</h2>
        <p className="text-muted-foreground">The AI is tailoring questions for you.</p>
      </div>
    );
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
                 {!hasMicrophonePermission && (
                    <Alert variant="destructive">
                      <AlertTitle>Microphone Access Required</AlertTitle>
                      <AlertDescription>
                        Please allow microphone access in your browser to use the voice input feature.
                      </AlertDescription>
                    </Alert>
                  )}
                <div className="relative">
                    <Textarea
                    placeholder="Type your answer or use the microphone to speak..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="min-h-[150px] pr-12"
                    disabled={isFeedbackLoading}
                    />
                    <Button 
                        size="icon" 
                        variant={isRecording ? 'destructive' : 'outline'}
                        onClick={toggleRecording} 
                        className="absolute bottom-3 right-3"
                        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                        disabled={!hasMicrophonePermission}
                    >
                        {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                    </Button>
                </div>
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
