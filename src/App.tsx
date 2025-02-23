
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

// Fun Book Creation Routes - Funny Book
import FunnyBookAuthorStep from "./pages/wizard/fun/funny-book/AuthorStep";
import FunnyBookStoriesStep from "./pages/wizard/fun/funny-book/StoriesStep";
import FunnyBookIdeasStep from "./pages/wizard/fun/funny-book/IdeasStep";
import FunnyBookPhotosStep from "./pages/wizard/fun/funny-book/PhotosStep";
import FunnyBookGenerateStep from "./pages/wizard/fun/funny-book/GenerateStep";

// Fantasy Book Routes
import FantasyBookAuthorStep from "./pages/wizard/fantasy/fantasy-book/AuthorStep";
import FantasyBookQuestionsStep from "./pages/wizard/fantasy/fantasy-book/QuestionsStep";
import FantasyBookIdeasStep from "./pages/wizard/fantasy/fantasy-book/IdeasStep";
import FantasyBookMomentsStep from "./pages/wizard/fantasy/fantasy-book/MomentsStep";
import FantasyBookGenerateStep from "./pages/wizard/fantasy/fantasy-book/GenerateStep";

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
                
                {/* Funny Book Routes */}
                <Route path="/create/fun/funny-book/author" element={<FunnyBookAuthorStep />} />
                <Route path="/create/fun/funny-book/stories" element={<FunnyBookStoriesStep />} />
                <Route path="/create/fun/funny-book/ideas" element={<FunnyBookIdeasStep />} />
                <Route path="/create/fun/funny-book/photos" element={<FunnyBookPhotosStep />} />
                <Route path="/create/fun/funny-book/generate" element={<FunnyBookGenerateStep />} />

                {/* Fantasy Book Routes */}
                <Route path="/create/fantasy/fantasy-book/author" element={<FantasyBookAuthorStep />} />
                <Route path="/create/fantasy/fantasy-book/questions" element={<FantasyBookQuestionsStep />} />
                <Route path="/create/fantasy/fantasy-book/ideas" element={<FantasyBookIdeasStep />} />
                <Route path="/create/fantasy/fantasy-book/moments" element={<FantasyBookMomentsStep />} />
                <Route path="/create/fantasy/fantasy-book/generate" element={<FantasyBookGenerateStep />} />
                
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
