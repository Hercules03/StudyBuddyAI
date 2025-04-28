
"use client";

import type React from 'react'; // Import type React
import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface SavedCard {
  id: string; // Use question as a simple ID for now
  question: string;
  answer: string;
}

interface SavedCardsContextType {
  savedCards: SavedCard[];
  addCard: (card: Omit<SavedCard, 'id'>) => void;
  removeCard: (id: string) => void;
  isCardSaved: (id: string) => boolean;
}

const SavedCardsContext = createContext<SavedCardsContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'studybuddyai_saved_cards';

export const SavedCardsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [isLoaded, setIsLoaded] = useState(false); // State to track if loaded from localStorage
  const { toast } = useToast();

  // Load cards from localStorage on mount (client-side only)
   useEffect(() => {
    let loadError: Error | null = null;
    if (typeof window !== 'undefined') {
      try {
        const storedCards = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedCards) {
          setSavedCards(JSON.parse(storedCards));
        }
      } catch (error) {
        console.error("Failed to load saved cards from localStorage:", error);
        loadError = error instanceof Error ? error : new Error("Unknown load error");
      } finally {
        setIsLoaded(true); // Mark as loaded regardless of success/failure
        // Show toast *after* state updates (setIsLoaded)
        if (loadError) {
          toast({
            variant: "destructive",
            title: "Load Error",
            description: "Could not load saved cards.",
          });
        }
      }
    }
  }, [toast]); // Keep toast dependency

  // Save cards to localStorage whenever they change (client-side only)
   useEffect(() => {
    let saveError: Error | null = null;
    if (typeof window !== 'undefined' && isLoaded) {
       try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedCards));
       } catch (error) {
         console.error("Failed to save cards to localStorage:", error);
         saveError = error instanceof Error ? error : new Error("Unknown save error");
       } finally {
         // Show toast *after* potential state updates related to savedCards
         if (saveError) {
             toast({
               variant: "destructive",
               title: "Save Error",
               description: "Could not save cards.",
             });
         }
       }
    }
  }, [savedCards, isLoaded, toast]); // Keep dependencies

  const addCard = useCallback((card: Omit<SavedCard, 'id'>) => {
    const newCardId = card.question; // Determine ID

    // Check if card exists *before* calling setState
    if (savedCards.some(c => c.id === newCardId)) {
      toast({
          title: "Already Saved",
          description: "This card is already in your saved list.",
      });
      return; // Exit early
    }

    // Update state
    const newCard: SavedCard = { ...card, id: newCardId };
    setSavedCards((prevCards) => [...prevCards, newCard]);

    // Show toast *after* state update is initiated
    toast({
          title: "Card Saved!",
          description: "The flashcard has been added to your saved list.",
          variant: "default"
     });
  }, [savedCards, toast]); // Added savedCards to dependency array

  const removeCard = useCallback((id: string) => {
    let cardRemoved = false;
    setSavedCards((prevCards) => {
        const originalLength = prevCards.length;
        const updatedCards = prevCards.filter((card) => card.id !== id);
        cardRemoved = updatedCards.length < originalLength; // Check if removal happened
        return updatedCards;
    });

    // Show toast *after* state update is initiated
    if (cardRemoved) {
        toast({
            title: "Card Removed",
            description: "The flashcard has been removed from your saved list.",
            variant: "default" // Or use a different variant like 'destructive' if preferred
        });
    }
  }, [toast]); // No dependency on savedCards needed here

  const isCardSaved = useCallback((id: string) => {
    return savedCards.some(card => card.id === id);
  }, [savedCards]);

  return (
    <SavedCardsContext.Provider value={{ savedCards, addCard, removeCard, isCardSaved }}>
      {children}
    </SavedCardsContext.Provider>
  );
};

export const useSavedCards = (): SavedCardsContextType => {
  const context = useContext(SavedCardsContext);
  if (context === undefined) {
    throw new Error('useSavedCards must be used within a SavedCardsProvider');
  }
  return context;
};
