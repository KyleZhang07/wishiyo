
import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import Home from '@/pages/Home';
import NotFound from '@/pages/NotFound';
import Index from '@/pages/Index';
import UserCenter from '@/pages/UserCenter';
import LoveLanding from '@/pages/LoveLanding';
import FriendsLanding from '@/pages/FriendsLanding';
import { initializeSupabaseResources } from '@/utils/initializeSupabase';

import './App.css';

// Love Book Routes
import LoveStoryAuthorStep from '@/pages/wizard/love/love-story/AuthorStep';
import LoveStoryQuestionsStep from '@/pages/wizard/love/love-story/QuestionsStep';
import LoveStoryIdeasStep from '@/pages/wizard/love/love-story/IdeasStep';
import LoveStoryDebugPromptsStep from '@/pages/wizard/love/love-story/DebugPromptsStep';
import LoveStoryMomentsStep from '@/pages/wizard/love/love-story/MomentsStep';
import LoveStoryGenerateStep from '@/pages/wizard/love/love-story/GenerateStep';

// Friends Book Routes
import FunnyBiographyAuthorStep from '@/pages/wizard/friends/funny-biography/AuthorStep';
import FunnyBiographyStoriesStep from '@/pages/wizard/friends/funny-biography/StoriesStep';
import FunnyBiographyIdeasStep from '@/pages/wizard/friends/funny-biography/IdeasStep';
import FunnyBiographyPhotosStep from '@/pages/wizard/friends/funny-biography/PhotosStep';
import FunnyBiographyGenerateStep from '@/pages/wizard/friends/funny-biography/GenerateStep';
import FunnyBiographyPreviewStep from '@/pages/wizard/friends/funny-biography/PreviewStep';
import FunnyBiographyCompletePage from '@/pages/wizard/friends/funny-biography/CompletePage';

const App = () => {
  useEffect(() => {
    // Initialize Supabase resources when the app starts
    initializeSupabaseResources();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/home" element={<Home />} />
      <Route path="/user-center" element={<UserCenter />} />
      <Route path="/love" element={<LoveLanding />} />
      <Route path="/friends" element={<FriendsLanding />} />

      {/* Love Story Wizard Steps */}
      <Route path="/create/love/love-story/author" element={<LoveStoryAuthorStep />} />
      <Route path="/create/love/love-story/questions" element={<LoveStoryQuestionsStep />} />
      <Route path="/create/love/love-story/ideas" element={<LoveStoryIdeasStep />} />
      <Route path="/create/love/love-story/debug-prompts" element={<LoveStoryDebugPromptsStep />} />
      <Route path="/create/love/love-story/moments" element={<LoveStoryMomentsStep />} />
      <Route path="/create/love/love-story/generate" element={<LoveStoryGenerateStep />} />

      {/* Funny Biography Wizard Steps */}
      <Route path="/create/friends/funny-biography/author" element={<FunnyBiographyAuthorStep />} />
      <Route path="/create/friends/funny-biography/stories" element={<FunnyBiographyStoriesStep />} />
      <Route path="/create/friends/funny-biography/ideas" element={<FunnyBiographyIdeasStep />} />
      <Route path="/create/friends/funny-biography/photos" element={<FunnyBiographyPhotosStep />} />
      <Route path="/create/friends/funny-biography/generate" element={<FunnyBiographyGenerateStep />} />
      <Route path="/create/friends/funny-biography/preview" element={<FunnyBiographyPreviewStep />} />
      <Route path="/create/friends/funny-biography/complete" element={<FunnyBiographyCompletePage />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
