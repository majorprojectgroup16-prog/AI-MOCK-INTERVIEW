'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import * as pdfjs from 'pdfjs-dist';

// pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;


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
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleFileChange = async (file: File | null, fieldName: 'jobDescription' | 'resume') => {
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload a PDF file.',
      });
      return;
    }

    setIsProcessing(true);
    toast({ title: 'Processing PDF...', description: 'Extracting text from the document.' });

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (!event.target?.result) return;
        const typedArray = new Uint8Array(event.target.result as ArrayBuffer);
        const pdf = await pdfjs.getDocument(typedArray).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(' ');
        }
        // mark that this field was extracted from a PDF so downstream logic can call the local model
        localStorage.setItem(`${fieldName}ExtractedFromPdf`, 'true');
        form.setValue(fieldName, text);
        toast({
          variant: 'default',
          title: 'Success',
          description: `Extracted text from ${file.name}.`,
        });
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast({
        variant: 'destructive',
        title: 'PDF Processing Error',
        description: 'Could not extract text from the PDF. Please try again or paste the text manually.',
      });
    } finally {
        setIsProcessing(false);
    }
  };


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
            Provide the job description and your resume to start your personalized mock interview.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Tabs defaultValue="text-jd" className="space-y-4">
                <FormField
                  control={form.control}
                  name="jobDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Description</FormLabel>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="text-jd">Paste Text</TabsTrigger>
                        <TabsTrigger value="upload-jd">Upload PDF</TabsTrigger>
                      </TabsList>
                      <TabsContent value="text-jd">
                        <FormControl>
                          <Textarea
                            placeholder="Paste the full job description here..."
                            className="min-h-[150px] resize-y"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              // mark as not-from-pdf when user types/pastes manually
                              localStorage.setItem('jobDescriptionExtractedFromPdf', 'false');
                            }}
                          />
                        </FormControl>
                        <FormDescription className="pt-2">
                          This helps us tailor the interview questions to the specific role.
                        </FormDescription>
                      </TabsContent>
                      <TabsContent value="upload-jd">
                        <FormControl>
                          <Input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null, 'jobDescription')}
                          />
                        </FormControl>
                         <FormDescription className="pt-2">
                          Upload the job description as a PDF file.
                        </FormDescription>
                      </TabsContent>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Tabs>
              
              <Tabs defaultValue="text-resume" className="space-y-4">
                 <FormField
                  control={form.control}
                  name="resume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Resume</FormLabel>
                       <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="text-resume">Paste Text</TabsTrigger>
                        <TabsTrigger value="upload-resume">Upload PDF</TabsTrigger>
                      </TabsList>
                       <TabsContent value="text-resume">
                        <FormControl>
                          <Textarea
                            placeholder="Paste your full resume here..."
                            className="min-h-[150px] resize-y"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              // mark as not-from-pdf when the user manually edits/pastes the resume
                              localStorage.setItem('resumeExtractedFromPdf', 'false');
                            }}
                          />
                        </FormControl>
                         <FormDescription className="pt-2">
                          Your resume provides context about your skills and experience.
                        </FormDescription>
                      </TabsContent>
                      <TabsContent value="upload-resume">
                         <FormControl>
                           <Input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null, 'resume')}
                          />
                        </FormControl>
                         <FormDescription className="pt-2">
                          Upload your resume as a PDF file.
                        </FormDescription>
                      </TabsContent>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Tabs>

              <Button type="submit" size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isUserLoading || isProcessing}>
                {isProcessing ? 'Processing PDF...' : 'Start Interview'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
