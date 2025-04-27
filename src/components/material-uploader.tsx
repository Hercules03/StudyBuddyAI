
"use client";

import type * as React from 'react';
import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, BrainCircuit, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { generateQuestionCards, type GenerateQuestionCardsOutput } from '@/ai/flows/generate-question-cards';

const formSchema = z.object({
  file: z
    .any() // Use z.any() initially to avoid server-side error
    .refine(
      (files) => typeof window === 'undefined' || files instanceof FileList, // Check type only on client
      'Expected a FileList.'
    )
    .refine(
      (files) => typeof window === 'undefined' || (files instanceof FileList && files?.length === 1),
      'Please upload exactly one file.'
    )
    .refine(
      (files) => typeof window === 'undefined' || (files instanceof FileList && files?.[0]?.size <= 5 * 1024 * 1024), // 5MB limit
      `Max file size is 5MB.`
    ),
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numberOfQuestions: 5,
      file: undefined,
    },
  });

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
     // Double check file type on client submit just in case
    if (!(data.file instanceof FileList) || data.file.length !== 1) {
        toast({
            variant: "destructive",
            title: "Invalid File",
            description: "Please select a single valid file.",
        });
        return;
    }
    const file = data.file[0];
    if (file.size > 5 * 1024 * 1024) {
        toast({
            variant: "destructive",
            title: "File Too Large",
            description: "Max file size is 5MB.",
        });
        return;
    }

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
        });
      } else {
        throw new Error('Failed to generate question cards.');
      }
    } catch (error) {
      console.error('Error generating question cards:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg rounded-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
           <BrainCircuit className="text-primary" /> StudyBuddyAI
        </CardTitle>
        <CardDescription>Upload your study materials and let AI create question cards for you.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="file-upload" className="flex items-center gap-2 cursor-pointer">
                    <Upload className="text-primary" size={20} /> Upload Study Material
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".pdf,.txt,.md,.docx" // Specify acceptable file types
                      className="mt-1 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      {...fileRef}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="numberOfQuestions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Questions</FormLabel>
                  <FormControl>
                     <Input type="number" min="1" max="20" className="mt-1 block w-full" {...field} />
                  </FormControl>
                   <FormDescription>
                      How many question cards do you want? (1-20)
                   </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Question Cards'
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
