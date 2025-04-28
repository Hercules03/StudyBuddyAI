
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
    if (typeof window !== 'undefined') {
      try {
        const storedCards = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedCards) {
          setSavedCards(JSON.parse(storedCards));
        }
      } catch (error) {
        console.error("Failed to load saved cards from localStorage:", error);
        // Optionally show a toast error
        toast({
          variant: "destructive",
          title: "Load Error",
          description: "Could not load saved cards.",
        });
      } finally {
        setIsLoaded(true); // Mark as loaded regardless of success/failure
      }
    }
  }, [toast]); // Added toast dependency

  // Save cards to localStorage whenever they change (client-side only)
  useEffect(() => {
    // Only save after initial load to prevent overwriting with empty array
    if (typeof window !== 'undefined' && isLoaded) {
       try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedCards));
       } catch (error) {
         console.error("Failed to save cards to localStorage:", error);
         // Optionally show a toast error
         toast({
           variant: "destructive",
           title: "Save Error",
           description: "Could not save cards.",
         });
       }
    }
  }, [savedCards, isLoaded, toast]); // Added isLoaded and toast dependency

  const addCard = useCallback((card: Omit<SavedCard, 'id'>) => {
    // Use question as ID, simple approach. Consider UUIDs for more robustness.
    const newCard: SavedCard = { ...card, id: card.question };
    setSavedCards((prevCards) => {
      // Prevent duplicates
      if (prevCards.some(c => c.id === newCard.id)) {
        toast({
            title: "Already Saved",
            description: "This card is already in your saved list.",
        });
        return prevCards;
      }
       toast({
            title: "Card Saved!",
            description: "The flashcard has been added to your saved list.",
            variant: "default"
       });
      return [...prevCards, newCard];
    });
  }, [toast]); // Added toast dependency

  const removeCard = useCallback((id: string) => {
    setSavedCards((prevCards) => {
        const updatedCards = prevCards.filter((card) => card.id !== id);
        if (updatedCards.length < prevCards.length) {
            toast({
                title: "Card Removed",
                description: "The flashcard has been removed from your saved list.",
                variant: "default" // Or use a different variant like 'destructive' if preferred
            });
        }
        return updatedCards;
    });
  }, [toast]); // Added toast dependency

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
