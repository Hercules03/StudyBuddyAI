
"use client";

import { useState, useEffect } from 'react';
import { useSavedCards } from '@/context/SavedCardsContext';
import { QuestionCard } from '@/components/question-card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2 } from 'lucide-react'; // Import icons
import Link from 'next/link';

export default function SavedCardsPage() {
  const { savedCards, removeCard } = useSavedCards();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isClient, setIsClient] = useState(false); // State to track client-side rendering

  useEffect(() => {
    setIsClient(true); // Component has mounted on the client
  }, []);

  const handlePreviousCard = () => {
    setCurrentCardIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : savedCards.length - 1));
  };

  const handleNextCard = () => {
    setCurrentCardIndex((prevIndex) => (prevIndex < savedCards.length - 1 ? prevIndex + 1 : 0));
  };

  const handleDeleteCard = (id: string) => {
    removeCard(id);
    // Adjust index if the last card was deleted or if the current index becomes out of bounds
    if (savedCards.length <= 1) {
        setCurrentCardIndex(0); // Reset index if no cards left or only one was left
    } else if (currentCardIndex >= savedCards.length - 1) { // -1 because state updates after filter
        setCurrentCardIndex(savedCards.length - 2); // Go to the new last card
    }
    // No need to change index if deleting from the middle, the next card will take its place
  };


  // Render loading or placeholder on server/initial client render
  if (!isClient) {
    return (
        <main className="flex min-h-[calc(100vh-57px)] flex-col items-center justify-center p-4 sm:p-8 md:p-12 bg-secondary/30">
             <div className="container mx-auto flex flex-col items-center gap-8 w-full max-w-4xl">
                  <p className="text-muted-foreground">Loading saved cards...</p>
             </div>
        </main>
    );
  }

  if (savedCards.length === 0) {
    return (
      <main className="flex min-h-[calc(100vh-57px)] flex-col items-center justify-center p-4 sm:p-8 md:p-12 bg-secondary/30">
        <div className="container mx-auto flex flex-col items-center text-center gap-4 w-full max-w-lg">
            <h1 className="text-2xl font-semibold">No Saved Cards</h1>
             <p className="text-muted-foreground">You haven't saved any flashcards yet. Go generate some and save your favorites!</p>
             <Link href="/" passHref>
                <Button>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Generator
                </Button>
             </Link>
        </div>
      </main>
    );
  }


  return (
    <main className="flex min-h-[calc(100vh-57px)] flex-col items-center justify-center p-4 sm:p-8 md:p-12 bg-secondary/30">
      <div className="container mx-auto flex flex-col items-center gap-6 w-full max-w-4xl">
         <h1 className="text-3xl font-bold tracking-tight mb-4">Your Saved Flashcards</h1>
         <p className="text-muted-foreground mb-6">
            Review your saved cards. Card {currentCardIndex + 1} of {savedCards.length}.
         </p>

        <QuestionCard
          key={savedCards[currentCardIndex].id} // Use unique ID from saved card
          question={savedCards[currentCardIndex].question}
          answer={savedCards[currentCardIndex].answer}
          showSaveButton={false} // Don't show save button on saved cards page
          showDeleteButton={true} // Show delete button
          onDelete={handleDeleteCard}
        />

        {/* Navigation Buttons */}
        <div className="flex justify-center items-center gap-4 mt-4 w-full max-w-xl">
           <Button onClick={handlePreviousCard} variant="outline" className="rounded-lg" disabled={savedCards.length <= 1}>
             <ArrowLeft className="mr-2 h-4 w-4" /> Previous
           </Button>
           {/* Delete button is now part of QuestionCard */}
           {/*<Button onClick={() => handleDeleteCard(savedCards[currentCardIndex].id)} variant="destructive" className="rounded-lg">
               <Trash2 className="mr-2 h-4 w-4" /> Delete
           </Button>*/}
            <Button onClick={handleNextCard} variant="outline" className="rounded-lg" disabled={savedCards.length <= 1}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
           </Button>
        </div>
         <Link href="/" passHref className="mt-6">
             <Button variant="link" className="text-primary">
                 <ArrowLeft className="mr-2 h-4 w-4" /> Back to Generator
             </Button>
         </Link>
      </div>
    </main>
  );
}
