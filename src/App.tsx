
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
import FriendsLanding from "./pages/FriendsLanding";
import LoveLanding from "./pages/LoveLanding";

// Friends Book Creation Routes - Funny Biography
import FunnyBiographyAuthorStep from "./pages/wizard/friends/funny-biography/AuthorStep";
import FunnyBiographyStoriesStep from "./pages/wizard/friends/funny-biography/StoriesStep";
import FunnyBiographyIdeasStep from "./pages/wizard/friends/funny-biography/IdeasStep";
import FunnyBiographyPhotosStep from "./pages/wizard/friends/funny-biography/PhotosStep";
import FunnyBiographyGenerateStep from "./pages/wizard/friends/funny-biography/GenerateStep";

// Love Story Routes
import LoveStoryAuthorStep from "./pages/wizard/love/love-story/AuthorStep";
import LoveStoryQuestionsStep from "./pages/wizard/love/love-story/QuestionsStep";
import LoveStoryIdeasStep from "./pages/wizard/love/love-story/IdeasStep";
import LoveStoryMomentsStep from "./pages/wizard/love/love-story/MomentsStep";
import LoveStoryGenerateStep from "./pages/wizard/love/love-story/GenerateStep";

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
                <Route path="/friends" element={<FriendsLanding />} />
                <Route path="/love" element={<LoveLanding />} />
                
                {/* Funny Biography Routes */}
                <Route path="/create/friends/funny-biography/author" element={<FunnyBiographyAuthorStep />} />
                <Route path="/create/friends/funny-biography/stories" element={<FunnyBiographyStoriesStep />} />
                <Route path="/create/friends/funny-biography/ideas" element={<FunnyBiographyIdeasStep />} />
                <Route path="/create/friends/funny-biography/photos" element={<FunnyBiographyPhotosStep />} />
                <Route path="/create/friends/funny-biography/generate" element={<FunnyBiographyGenerateStep />} />

                {/* Love Story Routes */}
                <Route path="/create/love/love-story/author" element={<LoveStoryAuthorStep />} />
                <Route path="/create/love/love-story/questions" element={<LoveStoryQuestionsStep />} />
                <Route path="/create/love/love-story/ideas" element={<LoveStoryIdeasStep />} />
                <Route path="/create/love/love-story/moments" element={<LoveStoryMomentsStep />} />
                <Route path="/create/love/love-story/generate" element={<LoveStoryGenerateStep />} />
                
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
