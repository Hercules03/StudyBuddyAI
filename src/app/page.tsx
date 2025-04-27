
"use client";

import { useState } from 'react';
import type { GenerateQuestionCardsOutput } from '@/ai/flows/generate-question-cards';
import { MaterialUploader } from '@/components/material-uploader';
import { QuestionCard } from '@/components/question-card';
import { Button } from '@/components/ui/button';
import { BrainCircuit, BookOpenText } from 'lucide-react'; // Import icon for reset button

type Question = GenerateQuestionCardsOutput['questionCards'][number];

export default function Home() {
  const [questionCards, setQuestionCards] = useState<Question[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showUploader, setShowUploader] = useState(true);

  const handleQuestionsGenerated = (cards: Question[]) => {
    setQuestionCards(cards);
    setCurrentCardIndex(0);
    setShowUploader(false); // Hide uploader and show cards
  };

  const handleNextCard = () => {
    if (currentCardIndex < questionCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      // Last card was shown, go back to uploader
      handleReset(); // Go back to uploader and reset state
    }
  };

   const handleReset = () => {
    setShowUploader(true);
    setQuestionCards([]);
    setCurrentCardIndex(0);
    setIsLoading(false);
  };


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 bg-secondary/30"> {/* Use secondary background */}
      <div className="container mx-auto flex flex-col items-center gap-8 w-full max-w-4xl px-0"> {/* Remove horizontal padding */}
        {showUploader ? (
          <MaterialUploader
            onQuestionsGenerated={handleQuestionsGenerated}
            setIsLoading={setIsLoading}
            isLoading={isLoading}
          />
        ) : (
          questionCards.length > 0 && (
            <div className="flex flex-col items-center w-full gap-6"> {/* Wrapper div for card and button */}
             <QuestionCard
                key={currentCardIndex} // Add key for proper re-rendering on index change
                question={questionCards[currentCardIndex].question}
                answer={questionCards[currentCardIndex].answer}
                onNext={handleNextCard}
                isLastCard={currentCardIndex === questionCards.length - 1}
             />
             {/* Show reset button only when cards are displayed */}
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
