import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BackCoverPreviewCardProps {
  authorName: string;
  backCoverText: string;
  isGeneratingBackCover?: boolean;
}

export const BackCoverPreviewCard = ({
  authorName,
  backCoverText,
  isGeneratingBackCover = false
}: BackCoverPreviewCardProps) => {
  const [backCoverImage, setBackCoverImage] = useState<string | null>(null);

  useEffect(() => {
    // 从localStorage获取背景图片URL
    const savedBackCoverImageUrl = localStorage.getItem('loveStoryBackCoverImage_url');
    if (savedBackCoverImageUrl) {
      setBackCoverImage(savedBackCoverImageUrl);
    }
  }, []);

  return (
    <div className="relative">
      <div className="max-w-xl mx-auto">
        <div className="aspect-square overflow-hidden relative rounded-md shadow-lg">
          {isGeneratingBackCover ? (
            <div className="h-full flex flex-col justify-center items-center text-center bg-gray-100/50">
              <RefreshCw className="animate-spin h-8 w-8 mb-4" />
              <p className="text-gray-600">Generating back cover...</p>
            </div>
          ) : (
            <div className="w-full h-full">
              {backCoverImage ? (
                <div className="relative w-full h-full">
                  {/* 背景图片 */}
                  <img
                    src={backCoverImage}
                    alt="Book back cover"
                    className="w-full h-full object-cover"
                  />

                  {/* 添加wishiyo logo */}
                  <div className="absolute inset-0 flex flex-col justify-end items-center pb-16">
                    <img
                      src="/assets/logos/spine-logo.png"
                      alt="Wishiyo logo"
                      className="h-8 w-auto"
                    />
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-center bg-gray-100">
                  <p className="text-gray-600">No back cover image available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 为文字添加阴影效果的样式
const styles = `
  .shadow-text {
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
  }
`;

// 将样式添加到文档中
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = styles;
  document.head.appendChild(styleElement);
}