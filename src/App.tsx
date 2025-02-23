
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

// Book Creation Steps
import AuthorStep from "./pages/wizard/AuthorStep";
import StoriesStep from "./pages/wizard/StoriesStep";
import IdeasStep from "./pages/wizard/IdeasStep";
import PhotosStep from "./pages/wizard/PhotosStep";
import GenerateStep from "./pages/wizard/GenerateStep";

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
                
                {/* Book Creation Routes */}
                <Route path="/create/fun/author" element={<AuthorStep category="fun" />} />
                <Route path="/create/fun/stories" element={<StoriesStep category="fun" />} />
                <Route path="/create/fun/ideas" element={<IdeasStep category="fun" />} />
                <Route path="/create/fun/photos" element={<PhotosStep category="fun" />} />
                <Route path="/create/fun/generate" element={<GenerateStep category="fun" />} />

                <Route path="/create/fantasy/author" element={<AuthorStep category="fantasy" />} />
                <Route path="/create/fantasy/stories" element={<StoriesStep category="fantasy" />} />
                <Route path="/create/fantasy/ideas" element={<IdeasStep category="fantasy" />} />
                <Route path="/create/fantasy/photos" element={<PhotosStep category="fantasy" />} />
                <Route path="/create/fantasy/generate" element={<GenerateStep category="fantasy" />} />
                
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
