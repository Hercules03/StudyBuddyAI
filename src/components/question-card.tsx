
"use client";

import * as React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, RotateCcw, BrainCircuit, Check, Bookmark, BookmarkCheck, Trash2 } from 'lucide-react'; // Added Trash2
import { cn } from '@/lib/utils';
import { useSavedCards } from '@/context/SavedCardsContext'; // Import context hook

interface QuestionCardProps {
  question: string;
  answer: string;
  onNext?: () => void; // Make onNext optional for saved cards view
  isLastCard?: boolean; // Make optional
  showSaveButton?: boolean; // Control visibility of save button
  showDeleteButton?: boolean; // Control visibility of delete button (for saved cards)
  onDelete?: (id: string) => void; // Function to handle delete
}

export function QuestionCard({
  question,
  answer,
  onNext,
  isLastCard = false, // Default to false
  showSaveButton = true, // Default to true for generated cards
  showDeleteButton = false, // Default to false
  onDelete,
}: QuestionCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { addCard, isCardSaved, removeCard } = useSavedCards(); // Use context

  const cardId = question; // Use question as a simple ID for now
  const saved = isCardSaved(cardId);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setIsFlipped(false);
    // Apply a slight delay for flip back animation if needed
    if (onNext) {
        setTimeout(onNext, isFlipped ? 300 : 0);
    }
  };

  const handleSave = () => {
    if (!saved) {
        addCard({ question, answer });
    } else {
        // Optional: Implement unsave functionality or just show feedback
        console.log("Removing saved card");
         removeCard(cardId); // Use removeCard to unsave
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(cardId); // Pass the cardId
    }
  };

  return (
    <div className="perspective w-full max-w-xl mx-auto">
      <Card className={cn(
        "relative preserve-3d transition-transform duration-700 rounded-xl shadow-xl flex flex-col min-h-[350px] justify-between", // Increased min-height slightly, kept justify-between
        isFlipped ? 'rotate-y-180' : ''
      )}>
        {/* Front Face */}
        <div className="absolute-fill backface-hidden flex flex-col p-6 bg-card rounded-xl">
          <CardHeader className="pb-4 pt-2 flex-shrink-0"> {/* Prevent header shrinking */}
             <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <BrainCircuit className="mr-2 h-4 w-4 text-primary"/> Question
             </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center text-center overflow-y-auto py-4"> {/* Allow vertical scroll if needed */}
            <p className="text-xl md:text-2xl font-semibold leading-relaxed">{question}</p>
          </CardContent>
          <CardFooter className="flex justify-between items-center pt-4 gap-2 flex-shrink-0"> {/* Keep footer at bottom */}
            <div className="flex gap-2"> {/* Left Group */}
               <Button onClick={handleFlip} variant="outline" className="border-primary text-primary hover:bg-primary/10 hover:text-primary rounded-lg font-medium shadow-sm">
                 <RotateCcw className="mr-2 h-4 w-4" /> Show Answer
               </Button>
            </div>
            <div className="flex gap-2"> {/* Right Group */}
               {showSaveButton && (
                 <Button onClick={handleSave} variant={saved ? "secondary" : "outline"} className={cn("rounded-lg font-medium shadow-sm", saved ? "" : "border-amber-500 text-amber-600 hover:bg-amber-500/10 hover:text-amber-600")}>
                   {saved ? <BookmarkCheck className="mr-2 h-4 w-4" /> : <Bookmark className="mr-2 h-4 w-4" />} {saved ? 'Saved' : 'Save Card'}
                 </Button>
               )}
              {/* Add an empty div if no save button to maintain justify-between */}
              {!showSaveButton && <div className="w-0" />}
             </div>
          </CardFooter>
        </div>

        {/* Back Face */}
        <div className="absolute-fill backface-hidden rotate-y-180 flex flex-col p-6 bg-secondary rounded-xl">
           <CardHeader className="pb-4 pt-2 flex-shrink-0"> {/* Prevent header shrinking */}
             <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500"/> Answer
             </CardTitle>
          </CardHeader>
           <CardContent className="flex-grow flex items-center justify-center text-center overflow-y-auto py-4"> {/* Allow vertical scroll if needed */}
            <p className="text-lg md:text-xl text-secondary-foreground leading-relaxed">{answer}</p>
          </CardContent>
           <CardFooter className="flex justify-between items-center pt-4 gap-2 flex-shrink-0"> {/* Keep footer at bottom */}
             <div className="flex gap-2"> {/* Left Group */}
               <Button onClick={handleFlip} variant="outline" className="border-primary text-primary hover:bg-primary/10 hover:text-primary rounded-lg font-medium shadow-sm">
                 <RotateCcw className="mr-2 h-4 w-4" /> Show Question
               </Button>
               {showDeleteButton && onDelete && (
                  <Button onClick={handleDelete} variant="destructive" className="rounded-lg font-medium shadow-sm">
                     <Trash2 className="mr-2 h-4 w-4" /> Delete Card
                  </Button>
               )}
             </div>
             <div className="flex gap-2"> {/* Right Group */}
               {onNext && (
                   <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium shadow-sm">
                       {isLastCard ? 'Finish Session' : 'Next Question'} <ArrowRight className="ml-2 h-4 w-4" />
                   </Button>
               )}
                {/* Add an empty div if no next/delete button to maintain justify-between */}
                {!onNext && <div className="w-0"/>}
             </div>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}
