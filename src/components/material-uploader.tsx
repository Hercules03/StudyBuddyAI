
"use client";

import * as React from 'react'; // Import React
import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, BrainCircuit, Loader2, FileText, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { generateQuestionCards, type GenerateQuestionCardsOutput } from '@/ai/flows/generate-question-cards';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  file: z
    .custom<FileList>(
        (val) => typeof window === 'undefined' || val instanceof FileList, // Check type only on client
        'Expected a FileList.'
     )
    .refine(
      (files) => files?.length === 1,
      'Please upload exactly one file.'
    )
    .refine(
      (files) => files?.[0]?.size <= 5 * 1024 * 1024, // 5MB limit
      `Max file size is 5MB.`
    )
    // Add MIME type check if needed, e.g.:
    .refine(
      (files) => files?.[0]?.type ? ['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(files[0].type) : false,
      'Unsupported file type. Please upload PDF, TXT, MD, or DOCX.'
    )
    ,
  numberOfQuestions: z.coerce
    .number()
    .int()
    .min(1, 'Must generate at least 1 question.')
    .max(20, 'Cannot generate more than 20 questions.'),
});


type FormValues = z.infer<typeof formSchema>;

interface MaterialUploaderProps {
  onQuestionsGenerated: (output: GenerateQuestionCardsOutput['questionCards']) => void;
  setIsLoading: (isLoading: boolean) => void;
  isLoading: boolean;
}

export function MaterialUploader({ onQuestionsGenerated, setIsLoading, isLoading }: MaterialUploaderProps) {
  const { toast } = useToast();
  const [fileName, setFileName] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numberOfQuestions: 5,
      file: undefined,
    },
  });

  // Use watch to reactively update the file name display
  const watchedFile = form.watch('file');
  React.useEffect(() => {
    if (watchedFile && watchedFile.length > 0) {
      setFileName(watchedFile[0].name);
    } else {
      setFileName(null);
    }
  }, [watchedFile]);

  const fileRef = form.register('file');

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!data.file || data.file.length !== 1) {
        toast({
            variant: "destructive",
            title: "Invalid File",
            description: "Please select a single valid file.",
        });
        return;
    }
    const file = data.file[0];
    // Validation is now handled by Zod schema

    setIsLoading(true);
    try {
      const studyMaterialDataUrl = await readFileAsDataURL(file);

      const result = await generateQuestionCards({
        studyMaterial: studyMaterialDataUrl,
        numberOfQuestions: data.numberOfQuestions,
      });

      if (result && result.questionCards) {
        onQuestionsGenerated(result.questionCards);
        toast({
          title: "Success!",
          description: "Generated question cards.",
          variant: 'default', // Explicitly set variant if needed
        });
      } else {
        throw new Error('Failed to generate question cards. The AI might have returned an unexpected response.');
      }
    } catch (error) {
      console.error('Error generating question cards:', error);
      toast({
        variant: "destructive",
        title: "Error Generating Cards",
        description: error instanceof Error ? error.message : "An unexpected error occurred while contacting the AI. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg rounded-xl border-border/50 bg-card transform transition-all duration-300 hover:shadow-xl">
      <CardHeader className="text-center space-y-2 pb-4">
        <div className="inline-flex items-center justify-center gap-2 mb-2 bg-primary/10 text-primary p-3 rounded-full mx-auto">
             <BrainCircuit className="h-8 w-8" />
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight">StudyBuddy<span className="text-primary">AI</span></CardTitle>
        <CardDescription className="text-base text-muted-foreground px-4">Upload study material (PDF, TXT, MD, DOCX) & let AI create flashcards.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 p-6 pt-2">
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="file-upload" className="text-base font-medium">
                    Study Material
                  </FormLabel>
                  <FormControl>
                     <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mt-1">
                       <Label
                         htmlFor="file-upload"
                         className={cn(
                           "flex h-10 w-full sm:w-auto items-center justify-center rounded-lg border border-input bg-background px-5 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer",
                           "gap-2 shadow-sm hover:shadow-md" // Ensure gap between icon and text
                         )}
                        >
                          <Upload size={16} />
                          <span>{fileName ? 'Change File' : 'Choose File'}</span>
                        </Label>
                        {/* Hidden actual input */}
                        <Input
                            id="file-upload"
                            type="file"
                            accept=".pdf,.txt,.md,.docx,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            className="hidden" // Hide the default input visually
                            {...fileRef} // Use the registered ref
                            onChange={(e) => {
                                field.onChange(e.target.files); // Update RHF state
                            }}
                         />
                         {/* File Name Display Area */}
                         {fileName && (
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground border border-dashed border-border rounded-lg p-2.5 flex-1 min-w-0 bg-secondary/30">
                                <FileText size={16} className="text-primary flex-shrink-0" />
                                <span className="truncate font-medium">{fileName}</span>
                            </div>
                        )}
                         {!fileName && (
                            <div className="flex items-center justify-center text-sm text-muted-foreground border border-dashed border-border rounded-lg p-2.5 flex-1 min-w-0 h-10">
                                <span>No file selected</span>
                            </div>
                        )}
                     </div>
                  </FormControl>
                   <FormDescription className="pt-1">
                      Max 5MB. Supports PDF, TXT, MD, DOCX.
                   </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="numberOfQuestions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Number of Questions</FormLabel>
                  <FormControl>
                     <Input type="number" min="1" max="20" className="mt-1 block w-full rounded-lg" {...field} />
                  </FormControl>
                   <FormDescription className="pt-1">
                      How many question cards do you want? (1-20)
                   </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="p-6 pt-2">
            <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-semibold shadow-md rounded-lg transition-transform hover:scale-[1.02] active:scale-[0.98]" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Cards...
                </>
              ) : (
                 <>
                  <Sparkles className="mr-2 h-5 w-5"/>
                   Generate Flashcards
                 </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

