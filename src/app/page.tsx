import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-interview');

  return (
    <div className="flex-1 flex flex-col">
      <section className="w-full py-20 md:py-32 lg:py-40 bg-secondary/50">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline text-primary">
                  Ace Your Next Interview with AI
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  MockInterviewPro provides personalized mock interviews based on your resume and the job description, with real-time feedback to help you land your dream job.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link href="/interview">
                    Start Your Interview
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
            {heroImage && (
              <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                data-ai-hint={heroImage.imageHint}
                width={600}
                height={400}
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
              />
            )}
          </div>
        </div>
      </section>
      <section id="features" className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-primary">How It Works</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Our platform guides you through a seamless process to prepare you for success.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:max-w-none mt-12">
            <div className="grid gap-1 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              </div>
              <h3 className="text-lg font-bold">1. Upload Details</h3>
              <p className="text-sm text-muted-foreground">Provide the job description and your resume to create a tailored interview experience.</p>
            </div>
            <div className="grid gap-1 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>
              </div>
              <h3 className="text-lg font-bold">2. Simulate Interview</h3>
              <p className="text-sm text-muted-foreground">Engage in a realistic, AI-driven interview with questions relevant to the role and your background.</p>
            </div>
            <div className="grid gap-1 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"><path d="m15.5 21-4.2-4.2a.9.9 0 0 0-1.3 0l-4.2 4.2"/><path d="M12 21v-4.2"/><path d="M4.2 11.8a.9.9 0 0 0 0 1.3l4.2 4.2"/><path d="M3 15h4.2"/><path d="M19.8 11.8a.9.9 0 0 1 0 1.3l-4.2 4.2"/><path d="M21 15h-4.2"/><path d="m15.5 3-4.2 4.2a.9.9 0 0 1-1.3 0L5.8 3"/><path d="M12 3v4.2"/><path d="M4.2 12.2a.9.9 0 0 1 0-1.3L8.4 6.7"/><path d="M3 9h4.2"/><path d="M19.8 12.2a.9.9 0 0 0 0-1.3l-4.2-4.2"/><path d="M21 9h-4.2"/></svg>
              </div>
              <h3 className="text-lg font-bold">3. Get Feedback</h3>
              <p className="text-sm text-muted-foreground">Receive instant, real-time feedback on your answers and a detailed post-interview analysis report.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
