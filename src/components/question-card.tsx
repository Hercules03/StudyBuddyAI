
"use client";

import type * as React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, RotateCcw } from 'lucide-react';
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
    setTimeout(onNext, 300); // Allow flip animation to start before moving next
  };

  return (
    <div className="perspective w-full max-w-xl mx-auto">
      <Card className={cn(
        "relative preserve-3d transition-transform duration-600 rounded-lg shadow-xl min-h-[300px] flex flex-col",
        isFlipped ? 'rotate-y-180' : ''
      )}>
        {/* Front of the Card */}
        <div className="absolute-fill backface-hidden flex flex-col p-6">
          <CardContent className="flex-grow flex items-center justify-center">
            <p className="text-xl font-semibold text-center">{question}</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={handleFlip} variant="outline" className="border-primary text-primary hover:bg-primary/10 hover:text-primary">
              <RotateCcw className="mr-2 h-4 w-4" /> Check Answer
            </Button>
          </CardFooter>
        </div>

        {/* Back of the Card */}
        <div className="absolute-fill backface-hidden rotate-y-180 flex flex-col p-6 bg-secondary rounded-lg">
           <CardContent className="flex-grow flex items-center justify-center">
            <p className="text-lg text-center text-secondary-foreground">{answer}</p>
          </CardContent>
          <CardFooter className="flex justify-between">
             <Button onClick={handleFlip} variant="outline" className="border-primary text-primary hover:bg-primary/10 hover:text-primary">
               <RotateCcw className="mr-2 h-4 w-4" /> Flip Back
             </Button>
            <Button onClick={handleNext} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {isLastCard ? 'Finish' : 'Next Question'} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}
