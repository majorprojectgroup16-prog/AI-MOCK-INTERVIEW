'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const formSchema = z.object({
  jobDescription: z.string().min(50, {
    message: 'Job description must be at least 50 characters.',
  }),
  resume: z.string().min(50, {
    message: 'Resume must be at least 50 characters.',
  }),
});

export default function InterviewSetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobDescription: '',
      resume: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
        router.push('/login');
        toast({
            variant: 'destructive',
            title: 'Unauthorized',
            description: 'You must be logged in to start an interview.',
        });
    }
  }, [user, isUserLoading, router, toast]);

  useEffect(() => {
    const storedJD = localStorage.getItem('jobDescription');
    const storedResume = localStorage.getItem('resume');
    if (storedJD) {
      form.setValue('jobDescription', storedJD);
    }
    if (storedResume) {
      form.setValue('resume', storedResume);
    }
  }, [form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
        return;
    }
    try {
      localStorage.setItem('jobDescription', values.jobDescription);
      localStorage.setItem('resume', values.resume);
      
      const jobDocRef = doc(collection(firestore, `users/${user.uid}/jobDescriptions`));
      setDocumentNonBlocking(jobDocRef, { 
          id: jobDocRef.id,
          userId: user.uid,
          title: 'Job Description', // You might want a more descriptive title
          content: values.jobDescription,
          uploadDate: serverTimestamp(),
      }, { merge: true });
      localStorage.setItem('jobDescriptionId', jobDocRef.id);

      const resumeDocRef = doc(collection(firestore, `users/${user.uid}/resumes`));
      setDocumentNonBlocking(resumeDocRef, { 
          id: resumeDocRef.id,
          userId: user.uid,
          title: 'My Resume', // You might want a more descriptive title
          content: values.resume,
          uploadDate: serverTimestamp(),
      }, { merge: true });
      localStorage.setItem('resumeId', resumeDocRef.id);

      toast({
        title: 'Setup Complete',
        description: 'Your interview session is ready to begin.',
      });
      router.push('/interview/session');
    } catch (error) {
       console.error("Error saving documents:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not save your details. Please try again.',
      });
    }
  }

  return (
    <div className="container py-8 flex-1 flex items-center justify-center">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Prepare Your Interview</CardTitle>
          <CardDescription>
            Paste the job description and your resume below to start your personalized mock interview.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="jobDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste the full job description here..."
                        className="min-h-[150px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This helps us tailor the interview questions to the specific role.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="resume"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Resume</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste your full resume here..."
                        className="min-h-[150px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Your resume provides context about your skills and experience.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isUserLoading}>
                Start Interview
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
