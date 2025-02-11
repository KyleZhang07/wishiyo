
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

// Friends Book Creation Routes
import FriendsStyleStep from "./pages/wizard/friends/StyleStep";
import FriendsMemoriesStep from "./pages/wizard/friends/MemoriesStep";
import FriendsPhotoStep from "./pages/wizard/friends/PhotoStep";
import FriendsGenerateStep from "./pages/wizard/friends/GenerateStep";

// Love Book Creation Routes
import LoveStyleStep from "./pages/wizard/love/StyleStep";
import LoveMessageStep from "./pages/wizard/love/MessageStep";
import LoveMomentsStep from "./pages/wizard/love/MomentsStep";
import LoveGenerateStep from "./pages/wizard/love/GenerateStep";

// Kids Book Creation Routes
import KidsCharacterStep from "./pages/wizard/kids/CharacterStep";
import KidsSettingStep from "./pages/wizard/kids/SettingStep";
import KidsStoryStep from "./pages/wizard/kids/StoryStep";
import KidsGenerateStep from "./pages/wizard/kids/GenerateStep";

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
                
                {/* Friends Book Creation Routes */}
                <Route path="/create/friends/style" element={<FriendsStyleStep />} />
                <Route path="/create/friends/memories" element={<FriendsMemoriesStep />} />
                <Route path="/create/friends/photos" element={<FriendsPhotoStep />} />
                <Route path="/create/friends/generate" element={<FriendsGenerateStep />} />
                
                {/* Love Book Creation Routes */}
                <Route path="/create/love/style" element={<LoveStyleStep />} />
                <Route path="/create/love/message" element={<LoveMessageStep />} />
                <Route path="/create/love/moments" element={<LoveMomentsStep />} />
                <Route path="/create/love/generate" element={<LoveGenerateStep />} />
                
                {/* Kids Book Creation Routes */}
                <Route path="/create/kids/character" element={<KidsCharacterStep />} />
                <Route path="/create/kids/setting" element={<KidsSettingStep />} />
                <Route path="/create/kids/story" element={<KidsStoryStep />} />
                <Route path="/create/kids/generate" element={<KidsGenerateStep />} />
                
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
