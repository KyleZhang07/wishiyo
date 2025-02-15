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
import KidsLanding from "./pages/KidsLanding";

// Friends Book Creation Routes
import FriendsAuthorStep from "./pages/wizard/friends/AuthorStep";
import FriendsQuestionStep from "./pages/wizard/friends/QuestionStep";
import FriendsIdeaStep from "./pages/wizard/friends/IdeaStep";
import FriendsPhotoStep from "./pages/wizard/friends/PhotoStep";
import FriendsGenerateStep from "./pages/wizard/friends/GenerateStep";

// Love Book Creation Routes
import LoveAuthorStep from "./pages/wizard/love/AuthorStep";
import LoveQuestionStep from "./pages/wizard/love/QuestionStep";
import LoveIdeaStep from "./pages/wizard/love/IdeaStep";
import LoveMomentsStep from "./pages/wizard/love/MomentsStep";
import LoveGenerateStep from "./pages/wizard/love/GenerateStep";

// Kids Book Creation Routes
import KidsAuthorStep from "./pages/wizard/kids/AuthorStep";
import KidsQuestionStep from "./pages/wizard/kids/QuestionStep";
import KidsIdeaStep from "./pages/wizard/kids/IdeaStep";
import KidsStoryStep from "./pages/wizard/kids/StoryStep";
import KidsGenerateStep from "./pages/wizard/kids/GenerateStep";

// Friends Book Creation Routes - Funny Biography
import FunnyBiographyAuthorStep from "./pages/wizard/friends/funny-biography/AuthorStep";
import FunnyBiographyStoriesStep from "./pages/wizard/friends/funny-biography/StoriesStep";
import FunnyBiographyPhotosStep from "./pages/wizard/friends/funny-biography/PhotosStep";
import FunnyBiographyGenerateStep from "./pages/wizard/friends/funny-biography/GenerateStep";

// Friends Book Creation Routes - Wild Fantasy
import WildFantasyAuthorStep from "./pages/wizard/friends/wild-fantasy/AuthorStep";
import WildFantasyAdventureStep from "./pages/wizard/friends/wild-fantasy/AdventureStep";

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
                <Route path="/kids" element={<KidsLanding />} />
                
                {/* Friends Book Creation Routes */}
                <Route path="/create/friends/author" element={<FriendsAuthorStep />} />
                <Route path="/create/friends/question" element={<FriendsQuestionStep />} />
                <Route path="/create/friends/idea" element={<FriendsIdeaStep />} />
                <Route path="/create/friends/photos" element={<FriendsPhotoStep />} />
                <Route path="/create/friends/generate" element={<FriendsGenerateStep />} />
                
                {/* Love Book Creation Routes */}
                <Route path="/create/love/author" element={<LoveAuthorStep />} />
                <Route path="/create/love/question" element={<LoveQuestionStep />} />
                <Route path="/create/love/idea" element={<LoveIdeaStep />} />
                <Route path="/create/love/moments" element={<LoveMomentsStep />} />
                <Route path="/create/love/generate" element={<LoveGenerateStep />} />
                
                {/* Kids Book Creation Routes */}
                <Route path="/create/kids/author" element={<KidsAuthorStep />} />
                <Route path="/create/kids/question" element={<KidsQuestionStep />} />
                <Route path="/create/kids/idea" element={<KidsIdeaStep />} />
                <Route path="/create/kids/story" element={<KidsStoryStep />} />
                <Route path="/create/kids/generate" element={<KidsGenerateStep />} />
                
                {/* Funny Biography Routes */}
                <Route path="/create/friends/funny-biography/author" element={<FunnyBiographyAuthorStep />} />
                <Route path="/create/friends/funny-biography/stories" element={<FunnyBiographyStoriesStep />} />
                <Route path="/create/friends/funny-biography/photos" element={<FunnyBiographyPhotosStep />} />
                <Route path="/create/friends/funny-biography/generate" element={<FunnyBiographyGenerateStep />} />
                
                {/* Wild Fantasy Routes */}
                <Route path="/create/friends/wild-fantasy/author" element={<WildFantasyAuthorStep />} />
                <Route path="/create/friends/wild-fantasy/adventure" element={<WildFantasyAdventureStep />} />
                
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
