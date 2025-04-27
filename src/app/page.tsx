
"use client";

import { useState } from 'react';
import type { GenerateQuestionCardsOutput } from '@/ai/flows/generate-question-cards';
import { MaterialUploader } from '@/components/material-uploader';
import { QuestionCard } from '@/components/question-card';
import { Button } from '@/components/ui/button';
import { BrainCircuit } from 'lucide-react'; // Import icon for reset button

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
      setShowUploader(true);
      setQuestionCards([]); // Clear cards
    }
  };

   const handleReset = () => {
    setShowUploader(true);
    setQuestionCards([]);
    setCurrentCardIndex(0);
    setIsLoading(false);
  };


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-secondary">
      <div className="container mx-auto flex flex-col items-center gap-8 w-full">
        {showUploader ? (
          <MaterialUploader
            onQuestionsGenerated={handleQuestionsGenerated}
            setIsLoading={setIsLoading}
            isLoading={isLoading}
          />
        ) : (
          questionCards.length > 0 && (
            <>
             <QuestionCard
                key={currentCardIndex} // Add key for proper re-rendering on index change
                question={questionCards[currentCardIndex].question}
                answer={questionCards[currentCardIndex].answer}
                onNext={handleNextCard}
                isLastCard={currentCardIndex === questionCards.length - 1}
             />
              <Button onClick={handleReset} variant="outline" className="mt-4 border-primary text-primary hover:bg-primary/10">
                <BrainCircuit className="mr-2 h-4 w-4" /> Start New Session
              </Button>
            </>
          )
        )}
      </div>
    </main>
  );
}
