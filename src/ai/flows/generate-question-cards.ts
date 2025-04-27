// src/ai/flows/generate-question-cards.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating question cards from study materials.
 *
 * It takes study materials and the desired number of question cards as input,
 * uses GenAI to create questions and answers, and returns an array of question card objects.
 *
 * @exports {
 *   generateQuestionCards: function
 *   GenerateQuestionCardsInput: type
 *   GenerateQuestionCardsOutput: type
 * }
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateQuestionCardsInputSchema = z.object({
  studyMaterial: z
    .string()
    .describe("The study material to generate questions from. Should be passed as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  numberOfQuestions: z
    .number()
    .describe('The number of question cards to generate.')
    .min(1)
    .max(20),
});
export type GenerateQuestionCardsInput = z.infer<typeof GenerateQuestionCardsInputSchema>;

const GenerateQuestionCardsOutputSchema = z.object({
  questionCards: z.array(
    z.object({
      question: z.string().describe('The question on the card.'),
      answer: z.string().describe('The answer on the back of the card.'),
    })
  ).describe('An array of question card objects.')
});
export type GenerateQuestionCardsOutput = z.infer<typeof GenerateQuestionCardsOutputSchema>;

export async function generateQuestionCards(input: GenerateQuestionCardsInput): Promise<GenerateQuestionCardsOutput> {
  return generateQuestionCardsFlow(input);
}

const generateQuestionCardsPrompt = ai.definePrompt({
  name: 'generateQuestionCardsPrompt',
  input: {
    schema: z.object({
      studyMaterial: z
        .string()
        .describe("The study material to generate questions from. Should be passed as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
      numberOfQuestions: z
        .number()
        .describe('The number of question cards to generate.')
        .min(1)
        .max(20),
    }),
  },
  output: {
    schema: z.object({
      questionCards: z.array(
        z.object({
          question: z.string().describe('The question on the card.'),
          answer: z.string().describe('The answer on the back of the card.'),
        })
      ).describe('An array of question card objects.')
    }),
  },
  prompt: `You are an AI that generates question cards for students based on their study materials.  The study material will be in the form of a document.

  Generate {{numberOfQuestions}} question cards based on the following study material. The questions should test the student's understanding of the material.

  Study Material: {{media url=studyMaterial}}

  Format the output as a JSON array of question card objects, each with a question and an answer.
  `,
});

const generateQuestionCardsFlow = ai.defineFlow<
  typeof GenerateQuestionCardsInputSchema,
  typeof GenerateQuestionCardsOutputSchema
>({
  name: 'generateQuestionCardsFlow',
  inputSchema: GenerateQuestionCardsInputSchema,
  outputSchema: GenerateQuestionCardsOutputSchema,
}, async input => {
  const {output} = await generateQuestionCardsPrompt(input);
  return output!;
});
