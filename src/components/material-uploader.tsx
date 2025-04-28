
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, BrainCircuit, Loader2, FileText, Sparkles, Files } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { generateQuestionCards, type GenerateQuestionCardsOutput } from '@/ai/flows/generate-question-cards';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE_MB = 5;
const MAX_TOTAL_SIZE_MB = 50; // Limit for total size of all files
const MAX_FILES = 10; // Limit number of files
const SUPPORTED_MIME_TYPES = ['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Shared validation logic for files
const fileValidation = z.custom<File>(
  (file) => file instanceof File,
  "Expected a file."
).refine(
  (file) => file.size <= MAX_FILE_SIZE_MB * 1024 * 1024,
  `Max file size is ${MAX_FILE_SIZE_MB}MB.`
).refine(
  (file) => SUPPORTED_MIME_TYPES.includes(file.type),
  'Unsupported file type. Please upload PDF, TXT, MD, or DOCX.'
);

// Schema for multiple file upload
const uploadSchema = z.object({
  files: z
    .custom<FileList>(
        (val) => typeof window === 'undefined' || val instanceof FileList,
        'Expected a FileList.'
     )
    .refine(
        (files) => files && files.length > 0,
        'Please select at least one file.'
     )
    .refine(
        (files) => files && files.length <= MAX_FILES,
        `You can select a maximum of ${MAX_FILES} files.`
    )
     .refine(
        (files) => {
            if (!files) return false;
            let totalSize = 0;
            for (let i = 0; i < files.length; i++) {
                totalSize += files[i].size;
            }
            return totalSize <= MAX_TOTAL_SIZE_MB * 1024 * 1024;
        },
        `Total size of all files cannot exceed ${MAX_TOTAL_SIZE_MB}MB.`
    )
    .transform(files => files ? Array.from(files) : []) // Convert FileList to Array
    .pipe(z.array(fileValidation)), // Validate each file in the array
  numberOfQuestions: z.coerce
    .number()
    .int()
    .min(1, 'Must generate at least 1 question per file.')
    .max(10, 'Cannot generate more than 10 questions per file.'), // Limit for batch
});

type FormValues = z.infer<typeof uploadSchema>;

type QuestionCardData = GenerateQuestionCardsOutput['questionCards'][number];

interface MaterialUploaderProps {
  onQuestionsGenerated: (output: QuestionCardData[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  isLoading: boolean;
}

export function MaterialUploader({ onQuestionsGenerated, setIsLoading, isLoading }: MaterialUploaderProps) {
  const { toast } = useToast();
  const [selectedFilesInfo, setSelectedFilesInfo] = useState<string>("No file selected");

  const form = useForm<FormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      numberOfQuestions: 5,
      files: undefined,
    },
  });

  const watchedFiles = form.watch('files'); // Watch multi file input

  // Effect to update file info display
  useEffect(() => {
    if (watchedFiles && watchedFiles.length > 0) {
        const filesArray = Array.from(watchedFiles);
        const validFilesCount = filesArray.filter(file =>
            file.size <= MAX_FILE_SIZE_MB * 1024 * 1024 && SUPPORTED_MIME_TYPES.includes(file.type)
        ).length;
        const totalSize = filesArray.reduce((acc, file) => acc + file.size, 0);
        const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
        const fileCount = watchedFiles.length;
        const totalSizeExceeded = totalSize > MAX_TOTAL_SIZE_MB * 1024 * 1024;
        const fileCountExceeded = fileCount > MAX_FILES;

        let infoParts: string[] = [];
        infoParts.push(`${fileCount} file(s) selected (${totalSizeMB}MB total).`);

        if (fileCountExceeded) {
            infoParts.push(`Error: Exceeds max ${MAX_FILES} files.`);
        } else if (totalSizeExceeded) {
             infoParts.push(`Error: Exceeds max ${MAX_TOTAL_SIZE_MB}MB total.`);
        } else if (validFilesCount < fileCount) {
            infoParts.push(`${validFilesCount} valid, ${fileCount - validFilesCount} invalid (check size/type).`);
        } else {
             infoParts.push(`${validFilesCount} valid file(s) ready.`);
        }
        setSelectedFilesInfo(infoParts.join(' '));

    } else {
      setSelectedFilesInfo("No files selected");
    }
  }, [watchedFiles]);

  const filesRef = form.register('files'); // For multi file input

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    let allGeneratedCards: QuestionCardData[] = [];
    let filesToProcess: File[] = [];

    try {
        // Validation is handled by zodResolver
        filesToProcess = data.files; // The array of validated files

        const numQuestionsPerFile = data.numberOfQuestions;
        let successfulFiles = 0;
        let failedFiles = 0;

        for (const file of filesToProcess) {
            try {
            const studyMaterialDataUrl = await readFileAsDataURL(file);
            const result = await generateQuestionCards({
                studyMaterial: studyMaterialDataUrl,
                numberOfQuestions: numQuestionsPerFile,
            });

            if (result && result.questionCards) {
                allGeneratedCards = [...allGeneratedCards, ...result.questionCards];
                successfulFiles++;
                // Optional: Toast per file success? Might be too noisy.
            } else {
                failedFiles++;
                console.error(`Failed to generate cards for ${file.name}: AI returned unexpected response.`);
                toast({
                    variant: "destructive",
                    title: `Processing Error (${file.name})`,
                    description: "AI failed to generate cards for this file.",
                    duration: 5000
                });
            }
            } catch (error) {
                failedFiles++;
                console.error(`Error processing file ${file.name}:`, error);
                toast({
                    variant: "destructive",
                    title: `Processing Error (${file.name})`,
                    description: error instanceof Error ? error.message : "An unexpected error occurred.",
                    duration: 5000
                });
            }
        } // End of file loop

        if (allGeneratedCards.length > 0) {
            onQuestionsGenerated(allGeneratedCards);
            toast({
            title: "Processing Complete!",
            description: `Generated ${allGeneratedCards.length} cards from ${successfulFiles} file(s). ${failedFiles > 0 ? `${failedFiles} file(s) failed.` : ''}`,
            variant: 'default',
            });
        } else if (failedFiles > 0 && successfulFiles === 0) {
            toast({
                variant: "destructive",
                title: "Processing Failed",
                description: "Could not generate cards from any of the selected files.",
            });
        } else if (filesToProcess.length === 0) {
            // This case should ideally be caught by validation, but as a fallback:
            toast({
                variant: "destructive",
                title: "No Files",
                description: "No valid files were provided for processing.",
            });
        }

    } catch (error) {
      // Catch errors during validation or initial setup (though zodResolver should handle most)
      console.error('Error during form submission:', error);
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: "An unexpected error occurred. Please check your input and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg rounded-xl border-border/50 bg-card transform transition-all duration-300 hover:shadow-xl overflow-hidden">
      <CardHeader className="text-center space-y-2 pb-4 bg-secondary/30 border-b">
         <div className="inline-flex items-center justify-center gap-2 mb-2 bg-primary/10 text-primary p-3 rounded-full mx-auto border border-primary/20 shadow-sm">
             <BrainCircuit className="h-8 w-8" />
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight">StudyBuddy<span className="text-primary">AI</span></CardTitle>
        <CardDescription className="text-base text-muted-foreground px-4">Upload study materials (PDF, TXT, DOCX) & let AI create flashcards for you.</CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 p-6"> {/* Restore padding */}
                <FormField
                control={form.control}
                name="files" // Use 'files' for multi upload
                render={({ field }) => (
                    <FormItem>
                    <FormLabel htmlFor="file-upload-multi" className="text-base font-medium">
                        Upload Files
                    </FormLabel>
                    <FormControl>
                        <div className="flex flex-col items-start space-y-2 mt-1">
                        {/* Button to trigger file/folder selection */}
                        <Label
                            htmlFor="file-upload-multi"
                            className={cn(
                                "flex h-12 w-full items-center justify-center rounded-lg border-2 border-dashed border-input bg-background px-5 py-2 text-base font-medium ring-offset-background transition-all duration-150 hover:bg-accent hover:text-accent-foreground hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer",
                                "gap-3 shadow-sm hover:shadow-md",
                                // Style adjustments when files are selected? (Optional)
                                watchedFiles && watchedFiles.length > 0 ? 'border-primary/50' : ''
                            )}
                            >
                            <Upload size={20} /> {/* Using Upload icon */}
                            <span>{watchedFiles && watchedFiles.length > 0 ? 'Change Selection' : 'Click or Drag & Drop Files Here'}</span>
                        </Label>
                        {/* Hidden input for multiple files */}
                        <Input
                            id="file-upload-multi"
                            type="file"
                            multiple // Allow multiple file selection
                            accept={SUPPORTED_MIME_TYPES.join(',')}
                            className="hidden"
                            {...filesRef}
                            onChange={(e) => {
                                field.onChange(e.target.files);
                            }}
                            // Add drag and drop handlers if desired (more complex)
                            />
                        {/* File Info Display Area */}
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground border border-dashed border-border rounded-lg p-2.5 w-full min-h-[40px] bg-secondary/30">
                            <FileText size={16} className="text-primary flex-shrink-0" />
                            <span className="font-medium flex-1 break-words">{selectedFilesInfo}</span>
                        </div>
                        </div>
                    </FormControl>
                    <FormDescription className="pt-1">
                        Up to {MAX_FILES} files, {MAX_TOTAL_SIZE_MB}MB total. Max {MAX_FILE_SIZE_MB}MB per file. Supports PDF, TXT, MD, DOCX.
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
                    <FormLabel className="text-base font-medium">Questions per File</FormLabel>
                    <FormControl>
                        <Input type="number" min="1" max="10" className="mt-1 block w-full rounded-lg" {...field} />
                    </FormControl>
                    <FormDescription className="pt-1">
                        How many question cards per file? (1-10)
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </CardContent>

            {/* Common Footer */}
            <CardFooter className="p-6 pt-4 border-t bg-secondary/30">
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

    