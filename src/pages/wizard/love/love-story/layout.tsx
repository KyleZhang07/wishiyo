import React from 'react';
import { LoveStoryProvider } from '@/context/LoveStoryDataContext';

interface LayoutProps {
  children: React.ReactNode;
}

const LoveStoryLayout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <LoveStoryProvider>
      {children}
    </LoveStoryProvider>
  );
};

export default LoveStoryLayout; 