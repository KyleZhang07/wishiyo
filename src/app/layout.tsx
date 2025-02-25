
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
  const pathname = window.location.pathname;
  
  // Determine background color based on route
  let bgColorClass = "bg-white";
  
  if (pathname.includes('/friends/funny-biography')) {
    bgColorClass = "bg-amber-50";
  } else if (pathname.includes('/love/love-story')) {
    bgColorClass = "bg-red-50";
  }
  
  return (
    <div className={`${bgColorClass} min-h-screen`}>
      {children}
    </div>
  );
}
