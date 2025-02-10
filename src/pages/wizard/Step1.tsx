
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface BookType {
  id: string;
  title: string;
  description: string;
  image: string;
}

const bookTypes: Record<string, BookType[]> = {
  friends: [
    {
      id: 'satire',
      title: 'AI 讽刺 & 搞怪吐槽手册',
      description: '充满趣味的吐槽合集，记录与朋友间的欢乐时光',
      image: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901'
    },
    {
      id: 'adventure',
      title: '冒险合伙人档案册',
      description: '记录你们共同经历的冒险故事',
      image: 'https://images.unsplash.com/photo-1466721591366-2d5fba72006d'
    },
    {
      id: 'memory',
      title: '友情回忆写真册',
      description: '珍藏美好的友谊回忆',
      image: 'https://images.unsplash.com/photo-1721322800607-8c38375eef04'
    }
  ],
  love: [
    {
      id: 'romantic',
      title: 'AI 浪漫绘本',
      description: '以童话或爱情故事的形式呈现你们的故事',
      image: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901'
    },
    {
      id: 'calendar',
      title: '365天恋爱日历书',
      description: '记录一年中的每一个特别时刻',
      image: 'https://images.unsplash.com/photo-1721322800607-8c38375eef04'
    },
    {
      id: 'quest',
      title: '爱情剧情任务本',
      description: '创造属于你们的浪漫冒险',
      image: 'https://images.unsplash.com/photo-1466721591366-2d5fba72006d'
    }
  ],
  kids: [
    {
      id: 'comic',
      title: 'AI 漫画/绘本',
      description: '让孩子成为故事的主角',
      image: 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1'
    },
    {
      id: 'coloring',
      title: '涂色+故事双模式绘本',
      description: '互动式学习与娱乐',
      image: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901'
    },
    {
      id: 'popup',
      title: '立体翻翻书',
      description: '激发孩子的探索欲望',
      image: 'https://images.unsplash.com/photo-1721322800607-8c38375eef04'
    }
  ],
  you: [
    {
      id: 'diary',
      title: '个人档案自传册',
      description: '记录你的个人故事',
      image: 'https://images.unsplash.com/photo-1721322800607-8c38375eef04'
    },
    {
      id: 'inspiration',
      title: 'AI 灵感随笔本',
      description: '捕捉你的创意灵感',
      image: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901'
    },
    {
      id: 'poster',
      title: '时尚海报合订本',
      description: '展现你的个性风格',
      image: 'https://images.unsplash.com/photo-1466721591366-2d5fba72006d'
    }
  ]
};

const Step1 = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedBookType, setSelectedBookType] = useState<string | null>(null);
  const type = searchParams.get('type') || 'friends';

  const handleBookTypeSelect = (bookType: string) => {
    setSelectedBookType(bookType);
    navigate('/create/step2', { state: { type, bookType } });
  };

  return (
    <div className="page-transition container mx-auto px-4 py-24">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-display font-bold mb-4">
            Choose Your Book Type
          </h1>
          <p className="text-gray-600">
            Select a book format that best suits your story
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {bookTypes[type].map((bookType) => (
            <div
              key={bookType.id}
              onClick={() => handleBookTypeSelect(bookType.id)}
              className="glass-card rounded-2xl overflow-hidden cursor-pointer transition-transform hover:scale-105"
            >
              <div className="aspect-[4/3] relative">
                <img 
                  src={bookType.image} 
                  alt={bookType.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{bookType.title}</h3>
                <p className="text-gray-600">{bookType.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Step1;
