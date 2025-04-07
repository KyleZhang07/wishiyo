
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState } from "react";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import FriendsLanding from "./pages/FriendsLanding";
import LoveLanding from "./pages/LoveLanding";
import OrdersPage from "./pages/OrdersPage";
import OrderHistory from "./pages/OrderHistory";
import VerifyOrder from "./pages/VerifyOrder";

// Friends Book Creation Routes - Funny Biography
import FunnyBiographyAuthorStep from "./pages/wizard/friends/funny-biography/AuthorStep";
import FunnyBiographyStoriesStep from "./pages/wizard/friends/funny-biography/StoriesStep";
import FunnyBiographyIdeasStep from "./pages/wizard/friends/funny-biography/IdeasStep";
import FunnyBiographyPhotosStep from "./pages/wizard/friends/funny-biography/PhotosStep";
import FunnyBiographyGenerateStep from "./pages/wizard/friends/funny-biography/GenerateStep";
import FunnyBiographyPreviewStep from "./pages/wizard/friends/funny-biography/PreviewStep";
import FunnyBiographyFormatStep from "./pages/wizard/friends/funny-biography/FormatStep";

// Love Story Routes
import LoveStoryCharacterStep from "./pages/wizard/love/love-story/CharacterStep";
import LoveStoryQuestionsStep from "./pages/wizard/love/love-story/QuestionsStep";
import LoveStoryMomentsStep from "./pages/wizard/love/love-story/MomentsStep";
import LoveStoryStyleStep from "./pages/wizard/love/love-story/StyleStep";
import LoveStoryIdeasStep from "./pages/wizard/love/love-story/IdeasStep";
import LoveStoryCoverStep from "./pages/wizard/love/love-story/CoverStep";
import LoveStoryGenerateStep from "./pages/wizard/love/love-story/GenerateStep";
import DebugPromptsStep from "./pages/wizard/love/love-story/DebugPromptsStep";
import LoveStoryFormatStep from "./pages/wizard/love/love-story/FormatStep";

// Simple OrderSuccess component
const OrderSuccess = () => {
  // Get order ID from localStorage (either love story or funny biography)
  const loveStoryOrderId = localStorage.getItem('loveStoryOrderId');
  const funnyBiographyOrderId = localStorage.getItem('funnyBiographyOrderId');
  const orderId = loveStoryOrderId || funnyBiographyOrderId || 'WY-UNKNOWN';
  
  // Get book title from localStorage (either love story or funny biography)
  const loveStoryBookTitle = localStorage.getItem('loveStoryBookTitle');
  const funnyBiographyBookTitle = localStorage.getItem('funnyBiographyBookTitle');
  const bookTitle = loveStoryBookTitle || funnyBiographyBookTitle || 'Your Custom Book';
  
  return (
    <div className="min-h-screen bg-[#FFFAF5] flex items-center justify-center">
      <div className="text-center p-8 max-w-md w-full">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold mb-2">Order Successful!</h1>
        <p className="text-xl text-gray-600 mb-2">Thank you for your purchase</p>
        <p className="text-gray-500 mb-6">Order ID: {orderId}</p>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <p className="text-gray-600">We have received your order for:</p>
          <p className="font-bold text-lg my-2">{bookTitle}</p>
          <p className="text-gray-600 text-sm">Your book will be printed and shipped within 3-5 business days.</p>
        </div>
        
        <button 
          onClick={() => window.location.href = '/'} 
          className="px-6 py-3 bg-[#FF7F50] text-white rounded-md hover:bg-[#FF7F50]/80 transition-colors w-full"
        >
          Return Home
        </button>
      </div>
    </div>
  );
};

// Layout wrapper component that conditionally renders the header
const AppLayout = () => {
  const location = useLocation();
  
  // Check if the current path is a book creation path
  const isCreationPath = location.pathname.includes('/create/');
  
  return (
    <div className="min-h-screen flex flex-col">
      {!isCreationPath && <Header />}
      <main className={`flex-grow ${isCreationPath ? 'pt-0' : 'pt-0'}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          
          {/* Category Landing Pages */}
          <Route path="/friends" element={<FriendsLanding />} />
          <Route path="/love" element={<LoveLanding />} />
          
          {/* Funny Biography Routes */}
          <Route path="/create/friends/funny-biography/author" element={<FunnyBiographyAuthorStep />} />
          <Route path="/create/friends/funny-biography/stories" element={<FunnyBiographyStoriesStep />} />
          <Route path="/create/friends/funny-biography/ideas" element={<FunnyBiographyIdeasStep />} />
          <Route path="/create/friends/funny-biography/photos" element={<FunnyBiographyPhotosStep />} />
          <Route path="/create/friends/funny-biography/generate" element={<FunnyBiographyGenerateStep />} />
          <Route path="/create/friends/funny-biography/preview" element={<FunnyBiographyPreviewStep />} />
          <Route path="/create/friends/funny-biography/format" element={<FunnyBiographyFormatStep />} />

          {/* Love Story Routes - Updated order */}
          <Route path="/create/love/love-story/character" element={<LoveStoryCharacterStep />} />
          <Route path="/create/love/love-story/questions" element={<LoveStoryQuestionsStep />} />
          <Route path="/create/love/love-story/moments" element={<LoveStoryMomentsStep />} />
          <Route path="/create/love/love-story/style" element={<LoveStoryStyleStep />} />
          <Route path="/create/love/love-story/ideas" element={<LoveStoryIdeasStep />} />
          <Route path="/create/love/love-story/cover" element={<LoveStoryCoverStep />} />
          <Route path="/create/love/love-story/debug-prompts" element={<DebugPromptsStep />} />
          <Route path="/create/love/love-story/generate" element={<LoveStoryGenerateStep />} />
          <Route path="/create/love/love-story/format" element={<LoveStoryFormatStep />} />
          
          {/* Order Routes */}
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/verify-order" element={<VerifyOrder />} />
          <Route path="/orders/history" element={<OrderHistory />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isCreationPath && <Footer />}
    </div>
  );
};

const App = () => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <AppLayout />
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
