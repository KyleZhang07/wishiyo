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

// Friends Book Creation Routes - Funny Biography
import FunnyBiographyAuthorStep from "./pages/wizard/friends/funny-biography/AuthorStep";
import FunnyBiographyStoriesStep from "./pages/wizard/friends/funny-biography/StoriesStep";
import FunnyBiographyPhotosStep from "./pages/wizard/friends/funny-biography/PhotosStep";
import FunnyBiographyGenerateStep from "./pages/wizard/friends/funny-biography/GenerateStep";

// Friends Book Creation Routes - Wild Fantasy
import WildFantasyAuthorStep from "./pages/wizard/friends/wild-fantasy/AuthorStep";
import WildFantasyAdventureStep from "./pages/wizard/friends/wild-fantasy/AdventureStep";

// Friends Book Creation Routes - Prank Book
import PrankBookAuthorStep from "./pages/wizard/friends/prank-book/AuthorStep";
import PrankBookPranksStep from "./pages/wizard/friends/prank-book/PranksStep";
import PrankBookEvidenceStep from "./pages/wizard/friends/prank-book/EvidenceStep";
import PrankBookGenerateStep from "./pages/wizard/friends/prank-book/GenerateStep";

// Love Book Creation Routes - Love Story
import LoveStoryAuthorStep from "./pages/wizard/love/love-story/AuthorStep";
import LoveStoryQuestionsStep from "./pages/wizard/love/love-story/QuestionsStep";
import LoveStoryMomentsStep from "./pages/wizard/love/love-story/MomentsStep";
import LoveStoryGenerateStep from "./pages/wizard/love/love-story/GenerateStep";

// Kids Book Creation Routes - Adventure
import KidsAdventureAuthorStep from "./pages/wizard/kids/adventure/AuthorStep";
import KidsAdventureCharacterStep from "./pages/wizard/kids/adventure/CharacterStep";
import KidsAdventureStoryStep from "./pages/wizard/kids/adventure/StoryStep";
import KidsAdventureGenerateStep from "./pages/wizard/kids/adventure/GenerateStep";

// Love Book Creation Routes - Love Poems
import LovePoemsAuthorStep from "./pages/wizard/love/love-poems/AuthorStep";
import LovePoemsFeelingsStep from "./pages/wizard/love/love-poems/FeelingsStep";
import LovePoemsStyleStep from "./pages/wizard/love/love-poems/StyleStep";
import LovePoemsGenerateStep from "./pages/wizard/love/love-poems/GenerateStep";

// Love Book Creation Routes - Picture Album
import PictureAlbumAuthorStep from "./pages/wizard/love/picture-album/AuthorStep";
import PictureAlbumPhotosStep from "./pages/wizard/love/picture-album/PhotosStep";
import PictureAlbumGenerateStep from "./pages/wizard/love/picture-album/GenerateStep";

// Kids Book Creation Routes - Story Book
import StoryBookAuthorStep from "./pages/wizard/kids/story-book/AuthorStep";
import StoryBookThemeStep from "./pages/wizard/kids/story-book/ThemeStep";
import StoryBookCharactersStep from "./pages/wizard/kids/story-book/CharactersStep";
import StoryBookGenerateStep from "./pages/wizard/kids/story-book/GenerateStep";

// Kids Book Creation Routes - Learning Journey
import LearningJourneyAuthorStep from "./pages/wizard/kids/learning/AuthorStep";
import LearningJourneySubjectStep from "./pages/wizard/kids/learning/SubjectStep";
import LearningJourneyStyleStep from "./pages/wizard/kids/learning/StyleStep";
import LearningJourneyGenerateStep from "./pages/wizard/kids/learning/GenerateStep";

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
                
                {/* Funny Biography Routes */}
                <Route path="/create/friends/funny-biography/author" element={<FunnyBiographyAuthorStep />} />
                <Route path="/create/friends/funny-biography/stories" element={<FunnyBiographyStoriesStep />} />
                <Route path="/create/friends/funny-biography/photos" element={<FunnyBiographyPhotosStep />} />
                <Route path="/create/friends/funny-biography/generate" element={<FunnyBiographyGenerateStep />} />
                
                {/* Wild Fantasy Routes */}
                <Route path="/create/friends/wild-fantasy/author" element={<WildFantasyAuthorStep />} />
                <Route path="/create/friends/wild-fantasy/adventure" element={<WildFantasyAdventureStep />} />

                {/* Prank Book Routes */}
                <Route path="/create/friends/prank-book/author" element={<PrankBookAuthorStep />} />
                <Route path="/create/friends/prank-book/pranks" element={<PrankBookPranksStep />} />
                <Route path="/create/friends/prank-book/evidence" element={<PrankBookEvidenceStep />} />
                <Route path="/create/friends/prank-book/generate" element={<PrankBookGenerateStep />} />

                {/* Love Story Routes */}
                <Route path="/create/love/love-story/author" element={<LoveStoryAuthorStep />} />
                <Route path="/create/love/love-story/questions" element={<LoveStoryQuestionsStep />} />
                <Route path="/create/love/love-story/moments" element={<LoveStoryMomentsStep />} />
                <Route path="/create/love/love-story/generate" element={<LoveStoryGenerateStep />} />

                {/* Kids Adventure Routes */}
                <Route path="/create/kids/adventure/author" element={<KidsAdventureAuthorStep />} />
                <Route path="/create/kids/adventure/character" element={<KidsAdventureCharacterStep />} />
                <Route path="/create/kids/adventure/story" element={<KidsAdventureStoryStep />} />
                <Route path="/create/kids/adventure/generate" element={<KidsAdventureGenerateStep />} />
                
                {/* Love Poems Routes */}
                <Route path="/create/love/love-poems/author" element={<LovePoemsAuthorStep />} />
                <Route path="/create/love/love-poems/feelings" element={<LovePoemsFeelingsStep />} />
                <Route path="/create/love/love-poems/style" element={<LovePoemsStyleStep />} />
                <Route path="/create/love/love-poems/generate" element={<LovePoemsGenerateStep />} />
                
                {/* Picture Album Routes */}
                <Route path="/create/love/picture-album/author" element={<PictureAlbumAuthorStep />} />
                <Route path="/create/love/picture-album/photos" element={<PictureAlbumPhotosStep />} />
                <Route path="/create/love/picture-album/generate" element={<PictureAlbumGenerateStep />} />
                
                {/* Story Book Routes */}
                <Route path="/create/kids/story-book/author" element={<StoryBookAuthorStep />} />
                <Route path="/create/kids/story-book/theme" element={<StoryBookThemeStep />} />
                <Route path="/create/kids/story-book/characters" element={<StoryBookCharactersStep />} />
                <Route path="/create/kids/story-book/generate" element={<StoryBookGenerateStep />} />
                
                {/* Learning Journey Routes */}
                <Route path="/create/kids/learning/author" element={<LearningJourneyAuthorStep />} />
                <Route path="/create/kids/learning/subject" element={<LearningJourneySubjectStep />} />
                <Route path="/create/kids/learning/style" element={<LearningJourneyStyleStep />} />
                <Route path="/create/kids/learning/generate" element={<LearningJourneyGenerateStep />} />
                
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
