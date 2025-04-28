
import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google'; // Renamed for clarity
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { SavedCardsProvider } from '@/context/SavedCardsContext'; // Import provider
import Link from 'next/link'; // Import Link
import { BookMarked, Home } from 'lucide-react'; // Import icons
import { Button } from '@/components/ui/button'; // Import Button

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: 'StudyBuddyAI',
  description: 'Enhance your studying with AI-generated question cards.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <SavedCardsProvider> {/* Wrap with provider */}
          <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
              <Link href="/" className="mr-6 flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-6 w-6">
                  <rect width="256" height="256" fill="none"></rect>
                  <line x1="208" y1="128" x2="128" y2="208" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line>
                  <line x1="192" y1="40" x2="40" y2="192" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line>
                </svg>
                 <span className="font-bold text-xl">StudyBuddy<span className="text-primary">AI</span></span>
              </Link>
              <nav className="flex items-center gap-2">
                 <Link href="/" passHref>
                  <Button variant="ghost">
                     <Home className="h-4 w-4 mr-2"/> Home
                  </Button>
                 </Link>
                 <Link href="/saved" passHref>
                   <Button variant="ghost">
                     <BookMarked className="h-4 w-4 mr-2"/> Saved Cards
                   </Button>
                 </Link>
              </nav>
            </div>
          </header>
          {children}
        </SavedCardsProvider>
        <Toaster />
      </body>
    </html>
  );
}
