import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState } from "react";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import UserCenter from "./pages/UserCenter";
import NotFound from "./pages/NotFound";
import FriendsLanding from "./pages/FriendsLanding";
import LoveLanding from "./pages/LoveLanding";

// Friends Book Creation Routes - Funny Biography
import FunnyBiographyAuthorStep from "./pages/wizard/friends/funny-biography/AuthorStep";
import FunnyBiographyStoriesStep from "./pages/wizard/friends/funny-biography/StoriesStep";
import FunnyBiographyIdeasStep from "./pages/wizard/friends/funny-biography/IdeasStep";
import FunnyBiographyPhotosStep from "./pages/wizard/friends/funny-biography/PhotosStep";
import FunnyBiographyGenerateStep from "./pages/wizard/friends/funny-biography/GenerateStep";
import FunnyBiographyPreviewStep from "./pages/wizard/friends/funny-biography/PreviewStep";
import FunnyBiographyCompletePage from "./pages/wizard/friends/funny-biography/CompletePage";

// Love Story Routes
import LoveStoryAuthorStep from "./pages/wizard/love/love-story/AuthorStep";
import LoveStoryQuestionsStep from "./pages/wizard/love/love-story/QuestionsStep";
import LoveStoryTextToneStep from "./pages/wizard/love/love-story/TextToneStep";
import LoveStoryMomentsStep from "./pages/wizard/love/love-story/MomentsStep";
import LoveStoryIdeasStep from "./pages/wizard/love/love-story/IdeasStep";
import LoveStoryGenerateStep from "./pages/wizard/love/love-story/GenerateStep";
import DebugPromptsStep from "./pages/wizard/love/love-story/DebugPromptsStep";

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
          <Route path="/user-center" element={<UserCenter />} />
          
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
          <Route path="/create/friends/funny-biography/complete" element={<FunnyBiographyCompletePage />} />

          {/* Love Story Routes - Updated order */}
          <Route path="/create/love/love-story/author" element={<LoveStoryAuthorStep />} />
          <Route path="/create/love/love-story/questions" element={<LoveStoryQuestionsStep />} />
          <Route path="/create/love/love-story/text-tone" element={<LoveStoryTextToneStep />} />
          <Route path="/create/love/love-story/moments" element={<LoveStoryMomentsStep />} />
          <Route path="/create/love/love-story/ideas" element={<LoveStoryIdeasStep />} />
          <Route path="/create/love/love-story/debug-prompts" element={<DebugPromptsStep />} />
          <Route path="/create/love/love-story/generate" element={<LoveStoryGenerateStep />} />
          
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
