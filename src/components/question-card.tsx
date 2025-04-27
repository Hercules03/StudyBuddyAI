
"use client";

import * as React from 'react'; // Import React
import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'; // Added Header & Title
import { Button } from '@/components/ui/button';
import { ArrowRight, RotateCcw, BrainCircuit, Check } from 'lucide-react'; // Added Check icon
import { cn } from '@/lib/utils';

interface QuestionCardProps {
  question: string;
  answer: string;
  onNext: () => void;
  isLastCard: boolean;
}

export function QuestionCard({ question, answer, onNext, isLastCard }: QuestionCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setIsFlipped(false); // Reset flip state for the next card
    // Apply a slight delay to allow the flip back animation to start visually
    setTimeout(onNext, isFlipped ? 300 : 0);
  };

  return (
    <div className="perspective w-full max-w-xl mx-auto min-h-[350px]"> {/* Increased min-height */}
      <Card className={cn(
        "relative preserve-3d transition-transform duration-700 rounded-xl shadow-xl flex flex-col h-full", // Use h-full
        isFlipped ? 'rotate-y-180' : ''
      )}>
        {/* Front of the Card */}
        <div className="absolute-fill backface-hidden flex flex-col p-6 bg-card rounded-xl">
          <CardHeader className="pb-4 pt-2">
             <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <BrainCircuit className="mr-2 h-4 w-4 text-primary"/> Question
             </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center">
            <p className="text-xl md:text-2xl font-semibold text-center leading-relaxed">{question}</p>
          </CardContent>
          <CardFooter className="flex justify-center pt-4">
            <Button onClick={handleFlip} variant="outline" className="border-primary text-primary hover:bg-primary/10 hover:text-primary rounded-lg font-medium shadow-sm">
              <RotateCcw className="mr-2 h-4 w-4" /> Show Answer
            </Button>
          </CardFooter>
        </div>

        {/* Back of the Card */}
        <div className="absolute-fill backface-hidden rotate-y-180 flex flex-col p-6 bg-secondary rounded-xl">
           <CardHeader className="pb-4 pt-2">
             <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500"/> Answer
             </CardTitle>
          </CardHeader>
           <CardContent className="flex-grow flex items-center justify-center">
            <p className="text-lg md:text-xl text-center text-secondary-foreground leading-relaxed">{answer}</p>
          </CardContent>
          <CardFooter className="flex justify-between items-center pt-4">
             <Button onClick={handleFlip} variant="outline" className="border-primary text-primary hover:bg-primary/10 hover:text-primary rounded-lg font-medium shadow-sm">
               <RotateCcw className="mr-2 h-4 w-4" /> Show Question
             </Button>
            <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium shadow-sm">
              {isLastCard ? 'Finish Session' : 'Next Question'} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}
