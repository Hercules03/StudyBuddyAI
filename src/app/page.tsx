
"use client";

import { useState } from 'react';
import type { GenerateQuestionCardsOutput } from '@/ai/flows/generate-question-cards';
import { MaterialUploader } from '@/components/material-uploader';
import { QuestionCard } from '@/components/question-card';
import { Button } from '@/components/ui/button';
import { BrainCircuit, BookOpenText } from 'lucide-react';

type Question = GenerateQuestionCardsOutput['questionCards'][number];

export default function Home() {
  const [questionCards, setQuestionCards] = useState<Question[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showUploader, setShowUploader] = useState(true);

  const handleQuestionsGenerated = (cards: Question[]) => {
    setQuestionCards(cards);
    setCurrentCardIndex(0);
    setShowUploader(false);
  };

  const handleNextCard = () => {
    if (currentCardIndex < questionCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      handleReset();
    }
  };

   const handleReset = () => {
    setShowUploader(true);
    setQuestionCards([]);
    setCurrentCardIndex(0);
    setIsLoading(false);
  };


  return (
    <main className="flex min-h-[calc(100vh-57px)] flex-col items-center justify-center p-4 sm:p-8 md:p-12 bg-secondary/30"> {/* Adjusted min-height */}
      <div className="container mx-auto flex flex-col items-center gap-8 w-full max-w-4xl px-0">
        {showUploader ? (
          <MaterialUploader
            onQuestionsGenerated={handleQuestionsGenerated}
            setIsLoading={setIsLoading}
            isLoading={isLoading}
          />
        ) : (
          questionCards.length > 0 && (
            // Increased gap from gap-6 to gap-8 or gap-10 for more space
            <div className="flex flex-col items-center w-full gap-10">
             <QuestionCard
                key={currentCardIndex}
                question={questionCards[currentCardIndex].question}
                answer={questionCards[currentCardIndex].answer}
                onNext={handleNextCard}
                isLastCard={currentCardIndex === questionCards.length - 1}
                showSaveButton={true} // Explicitly show save button here
                showDeleteButton={false} // Explicitly hide delete button here
             />
              <Button onClick={handleReset} variant="outline" className="border-primary text-primary hover:bg-primary/10 shadow rounded-lg font-medium">
                <BookOpenText className="mr-2 h-4 w-4" /> Upload New Material
              </Button>
            </div>
          )
        )}
      </div>
    </main>
  );
}

