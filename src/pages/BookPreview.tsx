import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const BookPreview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [bookData, setBookData] = useState<any>(null);
  const [generatedPdfs, setGeneratedPdfs] = useState<{
    interior_pdf_url?: string;
    cover_pdf_url?: string;
  }>({});
  const [error, setError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // 从localStorage获取作者姓名和书名
    const authorName = localStorage.getItem('funnyBiographyAuthorName') || '';
    const bookTitle = localStorage.getItem('funnyBiographyBookTitle') || 'My Funny Biography';
    
    // 从localStorage获取选择的创意
    const selectedIdeaStr = localStorage.getItem('funnyBiographySelectedIdea');
    const selectedIdea = selectedIdeaStr ? JSON.parse(selectedIdeaStr) : null;
    
    // 从localStorage获取问题答案
    const answersStr = localStorage.getItem('funnyBiographyAnswers');
    const answers = answersStr ? JSON.parse(answersStr) : [];
    
    // 从localStorage获取目录
    const tableOfContentsStr = localStorage.getItem('funnyBiographyTableOfContents');
    const tableOfContents = tableOfContentsStr ? JSON.parse(tableOfContentsStr) : [];

    // 从localStorage获取封面画布数据
    const frontCoverCanvas = localStorage.getItem('funnyBiographyFrontCoverCanvas') || '';
    const spineCanvas = localStorage.getItem('funnyBiographySpineCanvas') || '';
    const backCoverCanvas = localStorage.getItem('funnyBiographyBackCoverCanvas') || '';
    
    // 设置书籍数据
    setBookData({
      authorName,
      bookTitle,
      selectedIdea,
      answers,
      tableOfContents,
      frontCoverCanvas,
      spineCanvas,
      backCoverCanvas
    });
  }, []);

  const generateBook = async () => {
    if (!bookData) {
      toast({
        title: "错误",
        description: "未找到书籍数据",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // 创建一个随机的order ID，用于测试
      const testOrderId = `test-${Math.random().toString(36).substring(2, 15)}`;
      
      // 调用Supabase函数生成书籍内容
      const response = await fetch('https://hbkgbggctzvqffqfrmhl.supabase.co/functions/v1/generate-book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: testOrderId,
          productId: 'funny-biography',
          title: bookData.bookTitle,
          format: 'Standard',
          shipping: null,
          customerEmail: 'test@example.com',
          paymentStatus: 'testing',
          localStorageData: bookData
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API调用失败: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "成功",
          description: "书籍生成成功，PDF已创建",
        });
        
        // 保存生成的PDF URLs
        setGeneratedPdfs({
          interior_pdf_url: result.interior_pdf_url,
          cover_pdf_url: result.cover_pdf_url
        });
      } else {
        throw new Error(result.error || '未知错误');
      }
    } catch (error) {
      console.error('生成书籍时出错:', error);
      setError(error.message || '生成书籍时出现错误');
      toast({
        title: "生成失败",
        description: error.message || "生成书籍时出现错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Book Preview Generator</h1>
      
      {bookData ? (
        <div className="space-y-6 mb-8">
          <div className="p-6 bg-muted rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">{bookData.bookTitle}</h2>
            <p className="text-lg text-muted-foreground">作者: {bookData.authorName}</p>
            
            {bookData.selectedIdea && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-1">选择的创意</h3>
                <p>{bookData.selectedIdea.description}</p>
              </div>
            )}
            
            {bookData.answers && bookData.answers.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-1">作者背景信息</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {bookData.answers.map((qa: any, index: number) => (
                    <li key={index}>
                      <span className="font-medium">{qa.question}:</span> {qa.answer}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {bookData.tableOfContents && bookData.tableOfContents.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-1">目录</h3>
                <ol className="list-decimal pl-5 space-y-1">
                  {bookData.tableOfContents.map((chapter: any, index: number) => (
                    <li key={index}>
                      {chapter.title} - <span className="text-muted-foreground">{chapter.description}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-1">封面数据状态</h3>
              <ul className="list-disc pl-5">
                <li>封面: {bookData.frontCoverCanvas ? '已存在' : '未找到'}</li>
                <li>书脊: {bookData.spineCanvas ? '已存在' : '未找到'}</li>
                <li>封底: {bookData.backCoverCanvas ? '已存在' : '未找到'}</li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col space-y-4">
            <Button 
              onClick={generateBook} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  正在生成书籍内容和PDF...
                </>
              ) : '生成书籍内容和PDF'}
            </Button>
            
            {generatedPdfs.interior_pdf_url && (
              <div className="space-y-3 p-4 bg-sky-50 rounded-lg border border-sky-200">
                <h3 className="text-lg font-medium text-sky-800">PDF已生成</h3>
                <div className="space-y-2">
                  <a 
                    href={generatedPdfs.interior_pdf_url} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center p-3 bg-white text-sky-600 rounded-md border border-sky-200 hover:bg-sky-50 transition"
                  >
                    查看内页PDF
                  </a>
                  
                  {generatedPdfs.cover_pdf_url && (
                    <a 
                      href={generatedPdfs.cover_pdf_url} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center p-3 bg-white text-sky-600 rounded-md border border-sky-200 hover:bg-sky-50 transition"
                    >
                      查看封面PDF
                    </a>
                  )}
                </div>
                <p className="text-sm text-sky-600">
                  这些PDF文件符合LuluPress的打印规格，内页PDF包含标题页、版权页和章节内容，封面PDF包含封面、书脊和封底。
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      {error && (
        <div className="mb-8 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
          <h3 className="font-semibold mb-2">Error</h3>
          <p>{error}</p>
        </div>
      )}
      
      <div className="flex justify-between mt-8">
        <Button 
          variant="outline" 
          onClick={() => navigate('/')}
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default BookPreview;
