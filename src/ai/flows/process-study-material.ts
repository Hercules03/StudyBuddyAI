'use server';
/**
 * @fileOverview Processes uploaded study materials using GenAI to generate question cards.
 *
 * - processStudyMaterial - A function that handles the processing of study materials and question generation.
 * - ProcessStudyMaterialInput - The input type for the processStudyMaterial function.
 * - ProcessStudyMaterialOutput - The return type for the processStudyMaterial function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ProcessStudyMaterialInputSchema = z.object({
  studyMaterial: z
    .string()
    .describe(
      'The study material to process, as text. It could be lecture slides, notes, or any other learning material.'
    ),
  numberOfQuestions: z
    .number()
    .int()
    .min(1)
    .max(10)
    .default(3)
    .describe('The number of question cards to generate.'),
});
export type ProcessStudyMaterialInput = z.infer<typeof ProcessStudyMaterialInputSchema>;

const QuestionCardSchema = z.object({
  question: z.string().describe('The question to ask.'),
  answer: z.string().describe('The answer to the question.'),
});

const ProcessStudyMaterialOutputSchema = z.object({
  questionCards: z.array(QuestionCardSchema).describe('The generated question cards.'),
});
export type ProcessStudyMaterialOutput = z.infer<typeof ProcessStudyMaterialOutputSchema>;

export async function processStudyMaterial(
  input: ProcessStudyMaterialInput
): Promise<ProcessStudyMaterialOutput> {
  return processStudyMaterialFlow(input);
}

const generateQuestionCardsPrompt = ai.definePrompt({
  name: 'generateQuestionCardsPrompt',
  input: {
    schema: z.object({
      studyMaterial: z
        .string()
        .describe(
          'The study material to process. It could be lecture slides, notes, or any other learning material.'
        ),
      numberOfQuestions: z
        .number()
        .int()
        .min(1)
        .max(10)
        .default(3)
        .describe('The number of question cards to generate.'),
    }),
  },
  output: {
    schema: z.object({
      questionCards: z.array(QuestionCardSchema).describe('The generated question cards.'),
    }),
  },
  prompt: `You are an AI assistant designed to help students study. Given the following study material, generate a specified number of question cards.

Study Material: {{{studyMaterial}}}

Number of Questions: {{{numberOfQuestions}}}

Each question card should have a question and its corresponding answer, derived directly from the study material. Focus on key concepts and important details.

Ensure the questions are clear, concise, and relevant to the material. The answers should be accurate and provide sufficient explanation.

Output the question cards as an array of JSON objects, where each object has "question" and "answer" fields.

Here's an example of the output format:

{
  "questionCards": [
    {
      "question": "What is the main concept discussed in the study material?",
      "answer": "The main concept is..."
    },
    {
      "question": "Explain the significance of ...",
      "answer": "The significance is..."
    }
  ]
}
`,
});

const processStudyMaterialFlow = ai.defineFlow<
  typeof ProcessStudyMaterialInputSchema,
  typeof ProcessStudyMaterialOutputSchema
>(
  {
    name: 'processStudyMaterialFlow',
    inputSchema: ProcessStudyMaterialInputSchema,
    outputSchema: ProcessStudyMaterialOutputSchema,
  },
  async input => {
    const {output} = await generateQuestionCardsPrompt(input);
    return output!;
  }
);
