import { usePathname } from 'next/navigation';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={cn(
        "min-h-screen font-sans antialiased",
        fontSans.variable
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <BackgroundProvider>
            {children}
          </BackgroundProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

// Background provider component to handle different background colors
function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Determine background color based on route
  let bgColorClass = "bg-white";
  
  if (pathname?.includes('/friends/funny-biography')) {
    bgColorClass = "bg-amber-50";
  } else if (pathname?.includes('/love/love-story')) {
    bgColorClass = "bg-red-50";
  }
  
  return (
    <div className={`${bgColorClass} min-h-screen`}>
      {children}
    </div>
  );
} 