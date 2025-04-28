
"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
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
import { generateQuestionCards, type GenerateQuestionCardsOutput, type GenerateQuestionCardsInput } from '@/ai/flows/generate-question-cards';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

// Schema for single file upload
const singleFileSchema = z.object({
  file: z
    .custom<FileList>(
        (val) => typeof window === 'undefined' || val instanceof FileList, // Check type only on client
        'Expected a FileList.'
     )
    .refine(
      (files) => files?.length === 1, // Must be exactly one file
      'Please upload exactly one file.'
    )
    .transform((files) => files?.[0]) // Get the single file
    .pipe(fileValidation), // Apply shared validation
  numberOfQuestions: z.coerce
    .number()
    .int()
    .min(1, 'Must generate at least 1 question.')
    .max(20, 'Cannot generate more than 20 questions per file.'),
});

// Schema for multiple file upload (folder/batch)
const multiFileSchema = z.object({
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
    .max(10, 'Cannot generate more than 10 questions per file in batch mode.'), // Lower limit for batch
});

type SingleFormValues = z.infer<typeof singleFileSchema>;
type MultiFormValues = z.infer<typeof multiFileSchema>;

// Combined type for easier handling, though we'll use type guards
type FormValues = Partial<SingleFormValues> & Partial<MultiFormValues>;

type QuestionCardData = GenerateQuestionCardsOutput['questionCards'][number];

interface MaterialUploaderProps {
  onQuestionsGenerated: (output: QuestionCardData[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  isLoading: boolean;
}

export function MaterialUploader({ onQuestionsGenerated, setIsLoading, isLoading }: MaterialUploaderProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'singleFile' | 'folderBatch'>('singleFile');
  const [selectedFilesInfo, setSelectedFilesInfo] = useState<string>("No file selected");

  const form = useForm<FormValues>({
    // Use resolver based on activeTab? No, better to handle validation in onSubmit
    // resolver: zodResolver(activeTab === 'singleFile' ? singleFileSchema : multiFileSchema), // This won't work dynamically
    defaultValues: {
      numberOfQuestions: 5,
      file: undefined, // For single file tab
      files: undefined, // For multi file tab
    },
  });

  // Watch files based on active tab
  const watchedFile = form.watch('file'); // Single file
  const watchedFiles = form.watch('files'); // Multi file

  // Effect to update file info display
  useEffect(() => {
    if (activeTab === 'singleFile') {
      if (watchedFile && watchedFile.length > 0) {
        setSelectedFilesInfo(watchedFile[0].name);
      } else {
        setSelectedFilesInfo("No file selected");
      }
    } else if (activeTab === 'folderBatch') {
      if (watchedFiles && watchedFiles.length > 0) {
        // Basic validation for display purposes
        const validFiles = Array.from(watchedFiles).filter(file =>
            file.size <= MAX_FILE_SIZE_MB * 1024 * 1024 && SUPPORTED_MIME_TYPES.includes(file.type)
        );
        const totalSize = Array.from(watchedFiles).reduce((acc, file) => acc + file.size, 0);
        const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
        const fileCount = watchedFiles.length;

        let infoText = `${fileCount} file(s) selected (${totalSizeMB}MB total). `;

        if (fileCount > MAX_FILES) {
            infoText += `Error: Exceeds max ${MAX_FILES} files. `;
        }
        if (totalSize > MAX_TOTAL_SIZE_MB * 1024 * 1024) {
             infoText += `Error: Exceeds max ${MAX_TOTAL_SIZE_MB}MB total. `;
        }

        if (validFiles.length === fileCount && fileCount <= MAX_FILES && totalSize <= MAX_TOTAL_SIZE_MB * 1024 * 1024) {
            infoText += `${validFiles.length} valid.`;
        } else if (fileCount <= MAX_FILES && totalSize <= MAX_TOTAL_SIZE_MB * 1024 * 1024) {
             infoText += `${validFiles.length} valid, ${fileCount - validFiles.length} invalid.`;
        }


        setSelectedFilesInfo(infoText);
      } else {
        setSelectedFilesInfo("No folder/files selected");
      }
    }
  }, [watchedFile, watchedFiles, activeTab]);

  const fileRef = form.register('file'); // For single file input
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
    let validationSchema;
    let formData;

    try {
        if (activeTab === 'singleFile') {
            validationSchema = singleFileSchema;
            const result = validationSchema.safeParse(data);
            if (!result.success) {
                 console.error("Validation errors:", result.error.flatten());
                 // Show specific errors from Zod
                 result.error.errors.forEach(err => {
                    form.setError(err.path[0] as keyof FormValues, { message: err.message });
                 });
                 toast({
                    variant: "destructive",
                    title: "Invalid Input",
                    description: "Please check the form for errors.",
                });
                setIsLoading(false);
                return;
            }
            formData = result.data;
            filesToProcess.push(formData.file); // The validated single file

        } else { // folderBatch
             validationSchema = multiFileSchema;
             const result = validationSchema.safeParse(data);
             if (!result.success) {
                 console.error("Validation errors:", result.error.flatten());
                  // Show specific errors from Zod
                  result.error.errors.forEach(err => {
                     form.setError(err.path[0] as keyof FormValues, { message: err.message });
                  });
                  // Handle array index errors for file validation if needed
                  if (result.error.flatten().fieldErrors.files) {
                     form.setError('files', { message: "One or more files have validation errors (size/type)." });
                  }
                 toast({
                    variant: "destructive",
                    title: "Invalid Input",
                    description: "Please check the selected files and number of questions.",
                 });
                 setIsLoading(false);
                 return;
             }
             formData = result.data;
             filesToProcess = formData.files; // The array of validated files
        }

      const numQuestionsPerFile = formData.numberOfQuestions;
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
      // Catch errors during validation or initial setup
      console.error('Error during form submission setup:', error);
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: "An unexpected error occurred before processing files. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
      setActiveTab(value as 'singleFile' | 'folderBatch');
      form.reset(); // Reset form when switching tabs
      setSelectedFilesInfo(value === 'singleFile' ? "No file selected" : "No folder/files selected");
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg rounded-xl border-border/50 bg-card transform transition-all duration-300 hover:shadow-xl">
      <CardHeader className="text-center space-y-2 pb-4">
         <div className="inline-flex items-center justify-center gap-2 mb-2 bg-primary/10 text-primary p-3 rounded-full mx-auto">
             <BrainCircuit className="h-8 w-8" />
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight">StudyBuddy<span className="text-primary">AI</span></CardTitle>
        <CardDescription className="text-base text-muted-foreground px-4">Upload study material & let AI create flashcards for you.</CardDescription>
      </CardHeader>

     <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full px-6 pb-2 pt-0">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="singleFile">Single File</TabsTrigger>
          <TabsTrigger value="folderBatch">Multiple Files</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <TabsContent value="singleFile">
               <CardContent className="space-y-6 p-0"> {/* Remove padding from CardContent */}
                 <FormField
                  control={form.control}
                  name="file" // Use 'file' for single upload
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="file-upload-single" className="text-base font-medium">
                        Select File
                      </FormLabel>
                      <FormControl>
                         <div className="flex flex-col items-start space-y-2 mt-1">
                           {/* File Input Trigger Button */}
                            <Label
                             htmlFor="file-upload-single"
                             className={cn(
                               "flex h-10 w-full items-center justify-center rounded-lg border border-input bg-background px-5 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer",
                               "gap-2 shadow-sm hover:shadow-md"
                             )}
                            >
                              <Upload size={16} />
                              <span>{watchedFile && watchedFile.length > 0 ? 'Change File' : 'Choose File'}</span>
                            </Label>
                            {/* Hidden actual input */}
                            <Input
                                id="file-upload-single"
                                type="file"
                                accept={SUPPORTED_MIME_TYPES.join(',')}
                                className="hidden" // Hide the default input visually
                                {...fileRef} // Use the registered ref
                                onChange={(e) => {
                                    field.onChange(e.target.files); // Update RHF state
                                }}
                             />
                              {/* File Info Display Area */}
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground border border-dashed border-border rounded-lg p-2.5 w-full min-h-[40px] bg-secondary/30">
                                {watchedFile && watchedFile.length > 0 ? (
                                    <>
                                        <FileText size={16} className="text-primary flex-shrink-0" />
                                        <span className="truncate font-medium">{selectedFilesInfo}</span>
                                    </>
                                ) : (
                                    <span className="italic">{selectedFilesInfo}</span>
                                )}
                            </div>
                         </div>
                      </FormControl>
                       <FormDescription className="pt-1">
                          Max {MAX_FILE_SIZE_MB}MB. Supports PDF, TXT, MD, DOCX.
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
                          How many question cards per file? (1-20)
                       </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
               </CardContent>
            </TabsContent>

            <TabsContent value="folderBatch">
                 <CardContent className="space-y-6 p-0"> {/* Remove padding from CardContent */}
                  <FormField
                  control={form.control}
                  name="files" // Use 'files' for multi upload
                  render={({ field }) => (
                    <FormItem>
                     <FormLabel htmlFor="file-upload-multi" className="text-base font-medium">
                        Select Files or Folder
                      </FormLabel>
                      <FormControl>
                         <div className="flex flex-col items-start space-y-2 mt-1">
                          {/* Button to trigger file/folder selection */}
                           <Label
                             htmlFor="file-upload-multi"
                              className={cn(
                               "flex h-10 w-full items-center justify-center rounded-lg border border-input bg-background px-5 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer",
                               "gap-2 shadow-sm hover:shadow-md"
                             )}
                            >
                              <Files size={16} /> {/* Using Files icon */}
                              <span>{watchedFiles && watchedFiles.length > 0 ? 'Change Selection' : 'Choose Files'}</span>
                            </Label>
                           {/* Hidden input for multiple files */}
                           <Input
                              id="file-upload-multi"
                              type="file"
                              multiple // Allow multiple file selection
                              // webkitdirectory directory // These attributes enable folder selection but might not be universally supported or desired UX
                              accept={SUPPORTED_MIME_TYPES.join(',')}
                              className="hidden"
                              {...filesRef}
                              onChange={(e) => {
                                    field.onChange(e.target.files);
                               }}
                            />
                           {/* File Info Display Area */}
                           <div className="flex items-center space-x-2 text-sm text-muted-foreground border border-dashed border-border rounded-lg p-2.5 w-full min-h-[40px] bg-secondary/30">
                                <FileText size={16} className="text-primary flex-shrink-0" />
                                <span className="font-medium flex-1 break-words">{selectedFilesInfo}</span>
                            </div>
                         </div>
                      </FormControl>
                       <FormDescription className="pt-1">
                          Max {MAX_FILES} files, {MAX_TOTAL_SIZE_MB}MB total. Max {MAX_FILE_SIZE_MB}MB per file. Supports PDF, TXT, MD, DOCX.
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
                         How many question cards per file? (1-10 for batch)
                       </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                 />
                </CardContent>
            </TabsContent>

            {/* Common Footer for both tabs */}
             <CardFooter className="p-6 pt-4"> {/* Adjusted padding */}
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
      </Tabs>


    </Card>
  );
}


    