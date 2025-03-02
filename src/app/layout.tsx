import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
  return (
    <div className={cn("min-h-screen font-sans antialiased")}>
      <div>
        {children}
      </div>
    </div>
  );
}

// Background provider component to handle different background colors
export function BackgroundProvider({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#FFFAF5] min-h-screen">
      {children}
    </div>
  );
}
