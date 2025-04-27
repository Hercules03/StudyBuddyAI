
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Use a standard Google Font like Inter
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

const inter = Inter({ // Use Inter font
  variable: '--font-inter', // Define a CSS variable for Inter
  subsets: ['latin'],
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
    <html lang="en">
      {/* Applied font variable and antialiased directly */}
      {/* Applied background color here for full page coverage */}
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
        <Toaster /> {/* Add Toaster component */}
      </body>
    </html>
  );
}
