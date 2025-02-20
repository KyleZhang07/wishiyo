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
import FunnyBiographyIdeasStep from "./pages/wizard/friends/funny-biography/IdeasStep";
import FunnyBiographyPhotosStep from "./pages/wizard/friends/funny-biography/PhotosStep";
import FunnyBiographyGenerateStep from "./pages/wizard/friends/funny-biography/GenerateStep";

// Friends Book Creation Routes - Wild Fantasy
import WildFantasyAuthorStep from "./pages/wizard/friends/wild-fantasy/AuthorStep";
import WildFantasyAdventureStep from "./pages/wizard/friends/wild-fantasy/AdventureStep";
import WildFantasyIdeasStep from "./pages/wizard/friends/wild-fantasy/IdeasStep";
import WildFantasyPhotosStep from "./pages/wizard/friends/wild-fantasy/PhotosStep";
import WildFantasyGenerateStep from "./pages/wizard/friends/wild-fantasy/GenerateStep";

// Friends Book Creation Routes - Prank Book
import PrankBookAuthorStep from "./pages/wizard/friends/prank-book/AuthorStep";
import PrankBookPranksStep from "./pages/wizard/friends/prank-book/PranksStep";
import PrankBookIdeasStep from "./pages/wizard/friends/prank-book/IdeasStep";
import PrankBookEvidenceStep from "./pages/wizard/friends/prank-book/EvidenceStep";
import PrankBookGenerateStep from "./pages/wizard/friends/prank-book/GenerateStep";

// Love Book Creation Routes - Travel Book (formerly love-story)
import LoveStoryAuthorStep from "./pages/wizard/love/travel-book/AuthorStep";
import LoveStoryQuestionsStep from "./pages/wizard/love/travel-book/QuestionsStep";
import LoveStoryIdeasStep from "./pages/wizard/love/travel-book/IdeasStep";
import LoveStoryMomentsStep from "./pages/wizard/love/travel-book/MomentsStep";
import LoveStoryGenerateStep from "./pages/wizard/love/travel-book/GenerateStep";

// Love Book Creation Routes - Time Travel (formerly love-poems)
import LovePoemsAuthorStep from "./pages/wizard/love/time-travel/AuthorStep";
import LovePoemsFeelingsStep from "./pages/wizard/love/time-travel/FeelingsStep";
import LovePoemsStyleStep from "./pages/wizard/love/time-travel/StyleStep";
import LovePoemsGenerateStep from "./pages/wizard/love/time-travel/GenerateStep";

// Love Book Creation Routes - Love Letters (formerly picture-album)
import PictureAlbumAuthorStep from "./pages/wizard/love/love-letters/AuthorStep";
import PictureAlbumPhotosStep from "./pages/wizard/love/love-letters/PhotosStep";
import PictureAlbumGenerateStep from "./pages/wizard/love/love-letters/GenerateStep";

// Kids Book Creation Routes - Adventure
import KidsAdventureAuthorStep from "./pages/wizard/kids/adventure/AuthorStep";
import KidsAdventureCharacterStep from "./pages/wizard/kids/adventure/CharacterStep";
import KidsAdventureStoryStep from "./pages/wizard/kids/adventure/StoryStep";
import KidsAdventureGenerateStep from "./pages/wizard/kids/adventure/GenerateStep";

// Kids Book Creation Routes - Career Exploration (formerly story-book)
import StoryBookAuthorStep from "./pages/wizard/kids/career-exploration/AuthorStep";
import StoryBookThemeStep from "./pages/wizard/kids/career-exploration/ThemeStep";
import StoryBookCharactersStep from "./pages/wizard/kids/career-exploration/CharactersStep";
import StoryBookGenerateStep from "./pages/wizard/kids/career-exploration/GenerateStep";

// Kids Book Creation Routes - Learning Journey (formerly learning)
import LearningJourneyAuthorStep from "./pages/wizard/kids/learning-journey/AuthorStep";
import LearningJourneySubjectStep from "./pages/wizard/kids/learning-journey/SubjectStep";
import LearningJourneyStyleStep from "./pages/wizard/kids/learning-journey/StyleStep";
import LearningJourneyGenerateStep from "./pages/wizard/kids/learning-journey/GenerateStep";

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
                <Route path="/create/friends/funny-biography/ideas" element={<FunnyBiographyIdeasStep />} />
                <Route path="/create/friends/funny-biography/photos" element={<FunnyBiographyPhotosStep />} />
                <Route path="/create/friends/funny-biography/generate" element={<FunnyBiographyGenerateStep />} />
                
                {/* Wild Fantasy Routes */}
                <Route path="/create/friends/wild-fantasy/author" element={<WildFantasyAuthorStep />} />
                <Route path="/create/friends/wild-fantasy/adventure" element={<WildFantasyAdventureStep />} />
                <Route path="/create/friends/wild-fantasy/ideas" element={<WildFantasyIdeasStep />} />
                <Route path="/create/friends/wild-fantasy/photos" element={<WildFantasyPhotosStep />} />
                <Route path="/create/friends/wild-fantasy/generate" element={<WildFantasyGenerateStep />} />

                {/* Prank Book Routes */}
                <Route path="/create/friends/prank-book/author" element={<PrankBookAuthorStep />} />
                <Route path="/create/friends/prank-book/pranks" element={<PrankBookPranksStep />} />
                <Route path="/create/friends/prank-book/ideas" element={<PrankBookIdeasStep />} />
                <Route path="/create/friends/prank-book/evidence" element={<PrankBookEvidenceStep />} />
                <Route path="/create/friends/prank-book/generate" element={<PrankBookGenerateStep />} />

                {/* Travel Book Routes (formerly love-story) */}
                <Route path="/create/love/travel-book/author" element={<LoveStoryAuthorStep />} />
                <Route path="/create/love/travel-book/questions" element={<LoveStoryQuestionsStep />} />
                <Route path="/create/love/travel-book/ideas" element={<LoveStoryIdeasStep />} />
                <Route path="/create/love/travel-book/moments" element={<LoveStoryMomentsStep />} />
                <Route path="/create/love/travel-book/generate" element={<LoveStoryGenerateStep />} />

                {/* Time Travel Routes (formerly love-poems) */}
                <Route path="/create/love/time-travel/author" element={<LovePoemsAuthorStep />} />
                <Route path="/create/love/time-travel/feelings" element={<LovePoemsFeelingsStep />} />
                <Route path="/create/love/time-travel/style" element={<LovePoemsStyleStep />} />
                <Route path="/create/love/time-travel/generate" element={<LovePoemsGenerateStep />} />

                {/* Love Letters Routes (formerly picture-album) */}
                <Route path="/create/love/love-letters/author" element={<PictureAlbumAuthorStep />} />
                <Route path="/create/love/love-letters/photos" element={<PictureAlbumPhotosStep />} />
                <Route path="/create/love/love-letters/generate" element={<PictureAlbumGenerateStep />} />

                {/* Adventure Routes */}
                <Route path="/create/kids/adventure/author" element={<KidsAdventureAuthorStep />} />
                <Route path="/create/kids/adventure/character" element={<KidsAdventureCharacterStep />} />
                <Route path="/create/kids/adventure/story" element={<KidsAdventureStoryStep />} />
                <Route path="/create/kids/adventure/generate" element={<KidsAdventureGenerateStep />} />
                
                {/* Career Exploration Routes (formerly story-book) */}
                <Route path="/create/kids/career-exploration/author" element={<StoryBookAuthorStep />} />
                <Route path="/create/kids/career-exploration/theme" element={<StoryBookThemeStep />} />
                <Route path="/create/kids/career-exploration/characters" element={<StoryBookCharactersStep />} />
                <Route path="/create/kids/career-exploration/generate" element={<StoryBookGenerateStep />} />

                {/* Learning Journey Routes */}
                <Route path="/create/kids/learning-journey/author" element={<LearningJourneyAuthorStep />} />
                <Route path="/create/kids/learning-journey/subject" element={<LearningJourneySubjectStep />} />
                <Route path="/create/kids/learning-journey/style" element={<LearningJourneyStyleStep />} />
                <Route path="/create/kids/learning-journey/generate" element={<LearningJourneyGenerateStep />} />
                
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
