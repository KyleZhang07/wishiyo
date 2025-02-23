
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import UserCenter from "./pages/UserCenter";
import NotFound from "./pages/NotFound";
import FunLanding from "./pages/FunLanding";
import FantasyLanding from "./pages/FantasyLanding";

// Fun Book Creation Routes
import FunnyBiographyAuthorStep from "./pages/wizard/fun/funny-biography/AuthorStep";
import FunnyBiographyStoriesStep from "./pages/wizard/fun/funny-biography/StoriesStep";
import FunnyBiographyIdeasStep from "./pages/wizard/fun/funny-biography/IdeasStep";
import FunnyBiographyPhotosStep from "./pages/wizard/fun/funny-biography/PhotosStep";
import FunnyBiographyGenerateStep from "./pages/wizard/fun/funny-biography/GenerateStep";

// Fantasy Story Routes
import LoveStoryAuthorStep from "./pages/wizard/fantasy/love-story/AuthorStep";
import LoveStoryQuestionsStep from "./pages/wizard/fantasy/love-story/QuestionsStep";
import LoveStoryIdeasStep from "./pages/wizard/fantasy/love-story/IdeasStep";
import LoveStoryMomentsStep from "./pages/wizard/fantasy/love-story/MomentsStep";
import LoveStoryGenerateStep from "./pages/wizard/fantasy/love-story/GenerateStep";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/user-center" element={<UserCenter />} />
                
                {/* Category Landing Pages */}
                <Route path="/fun" element={<FunLanding />} />
                <Route path="/fantasy" element={<FantasyLanding />} />
                
                {/* Fun Book Creation Routes */}
                <Route path="/create/fun/funny-biography/author" element={<FunnyBiographyAuthorStep />} />
                <Route path="/create/fun/funny-biography/stories" element={<FunnyBiographyStoriesStep />} />
                <Route path="/create/fun/funny-biography/ideas" element={<FunnyBiographyIdeasStep />} />
                <Route path="/create/fun/funny-biography/photos" element={<FunnyBiographyPhotosStep />} />
                <Route path="/create/fun/funny-biography/generate" element={<FunnyBiographyGenerateStep />} />

                {/* Fantasy Story Routes */}
                <Route path="/create/fantasy/love-story/author" element={<LoveStoryAuthorStep />} />
                <Route path="/create/fantasy/love-story/questions" element={<LoveStoryQuestionsStep />} />
                <Route path="/create/fantasy/love-story/ideas" element={<LoveStoryIdeasStep />} />
                <Route path="/create/fantasy/love-story/moments" element={<LoveStoryMomentsStep />} />
                <Route path="/create/fantasy/love-story/generate" element={<LoveStoryGenerateStep />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
