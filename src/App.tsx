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

// Friends Book Creation Routes - Funny Biography
import FunnyBiographyAuthorStep from "./pages/wizard/friends/funny-biography/AuthorStep";
import FunnyBiographyStoriesStep from "./pages/wizard/friends/funny-biography/StoriesStep";
import FunnyBiographyIdeasStep from "./pages/wizard/friends/funny-biography/IdeasStep";
import FunnyBiographyDebugStep from "./pages/wizard/friends/funny-biography/DebugStep";
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

// Order Success Page
import OrderSuccess from "./pages/order-success";

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
          <Route path="/create/friends/funny-biography/debug" element={<FunnyBiographyDebugStep />} />
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
          
          {/* Order Success Route */}
          <Route path="/order-success" element={<OrderSuccess />} />
          
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
