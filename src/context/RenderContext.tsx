import React, { createContext, useContext, useState, ReactNode } from 'react';

interface RenderContextType {
  isRenderingCover: boolean;
  setIsRenderingCover: (isRendering: boolean) => void;
  coverRenderComplete: boolean;
  setCoverRenderComplete: (isComplete: boolean) => void;
  coverImageUrl: string | null;
  setCoverImageUrl: (url: string | null) => void;
  backCoverImageUrl: string | null;
  setBackCoverImageUrl: (url: string | null) => void;
  spineImageUrl: string | null;
  setSpineImageUrl: (url: string | null) => void;
}

const RenderContext = createContext<RenderContextType>({
  isRenderingCover: false,
  setIsRenderingCover: () => {},
  coverRenderComplete: false,
  setCoverRenderComplete: () => {},
  coverImageUrl: null,
  setCoverImageUrl: () => {},
  backCoverImageUrl: null,
  setBackCoverImageUrl: () => {},
  spineImageUrl: null,
  setSpineImageUrl: () => {},
});

export const useRenderContext = () => useContext(RenderContext);

export const RenderProvider = ({ children }: { children: ReactNode }) => {
  const [isRenderingCover, setIsRenderingCover] = useState(false);
  const [coverRenderComplete, setCoverRenderComplete] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [backCoverImageUrl, setBackCoverImageUrl] = useState<string | null>(null);
  const [spineImageUrl, setSpineImageUrl] = useState<string | null>(null);

  return (
    <RenderContext.Provider 
      value={{ 
        isRenderingCover, 
        setIsRenderingCover,
        coverRenderComplete,
        setCoverRenderComplete,
        coverImageUrl,
        setCoverImageUrl,
        backCoverImageUrl,
        setBackCoverImageUrl,
        spineImageUrl,
        setSpineImageUrl
      }}
    >
      {children}
    </RenderContext.Provider>
  );
};
