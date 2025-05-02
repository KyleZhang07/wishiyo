import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useToast } from '@/hooks/use-toast';
import { Mail, Clock, HelpCircle, ChevronDown, Copy, Check } from 'lucide-react';

const Contact = () => {
  const { toast } = useToast();
  const [openFaqs, setOpenFaqs] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);

  // Toggle FAQ open/close
  const toggleFaq = (index: number) => {
    setOpenFaqs(prev =>
      prev.includes(index)
        ? prev.filter(item => item !== index)
        : [...prev, index]
    );
  };

  // Copy email to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText('support@wishiyo.com')
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  return (
    <div className="container mx-auto px-4 py-16 pt-24 max-w-5xl">
      <Helmet>
        <title>Contact Us - Wishiyo</title>
        <meta name="description" content="Contact the Wishiyo team for support, feedback, or inquiries about our personalized book services." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.wishiyo.com/contact" />
      </Helmet>

      <div className="mt-12 mb-12">
        <h1 className="text-4xl font-serif font-bold mb-4 text-center">Contact Us</h1>
        <p className="text-center text-gray-600 max-w-2xl mx-auto">
          We'd love to hear from you, answer your questions, or provide assistance. Please use the following contact methods.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {/* Contact cards */}
        <div className="bg-[#FFFAF5] rounded-lg p-6 shadow-sm flex flex-col items-center text-center">
          <div className="bg-orange-100 p-3 rounded-full mb-4">
            <Mail className="h-6 w-6 text-[#FF6B35]" />
          </div>
          <h3 className="text-xl font-medium mb-2">Email</h3>
          <p className="text-gray-600 mb-3">Feel free to email us anytime</p>
          <div className="flex items-center justify-center">
            <a 
              href="mailto:support@wishiyo.com?subject=Wishiyo%20Support%20Request" 
              className="text-[#FF6B35] font-medium hover:underline mr-1"
            >
              support@wishiyo.com
            </a>
            <button 
              onClick={copyToClipboard}
              className="text-gray-500 hover:text-[#FF6B35] transition-colors p-1 rounded-full hover:bg-orange-50"
              aria-label="Copy email address"
              title="Copy email address"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        <div className="bg-[#FFFAF5] rounded-lg p-6 shadow-sm flex flex-col items-center text-center">
          <div className="bg-orange-100 p-3 rounded-full mb-4">
            <Clock className="h-6 w-6 text-[#FF6B35]" />
          </div>
          <h3 className="text-xl font-medium mb-2">Response Time</h3>
          <p className="text-gray-600 mb-3">We aim to respond quickly to all inquiries</p>
          <p className="text-gray-800">
            <span className="font-medium">1-3 business days</span>
          </p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mb-16">
        <div className="flex items-center mb-6">
          <HelpCircle className="h-8 w-8 text-[#FF6B35] mr-3" />
          <h2 className="text-2xl font-serif font-semibold">Frequently Asked Questions</h2>
        </div>
        
        <div className="w-full" role="region" aria-label="Frequently Asked Questions about Wishiyo personalized books">
          {/* FAQ Item 1 */}
          <div className="border-b border-gray-200" itemScope itemType="https://schema.org/Question">
            <button
              className="w-full flex justify-between items-center py-6 text-left focus:outline-none"
              onClick={() => toggleFaq(0)}
              aria-expanded={openFaqs.includes(0)}
              aria-controls="faq-answer-1"
            >
              <h3 className="text-xl font-medium text-[#333333]" itemProp="name">Why should I choose Wishiyo?</h3>
              <ChevronDown className={`h-6 w-6 text-[#FF6B35] transition-transform duration-200 ${openFaqs.includes(0) ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            <div id="faq-answer-1" className={`pb-6 ${openFaqs.includes(0) ? 'block' : 'hidden'}`} itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
              <p className="text-gray-700" itemProp="text">
                Wishiyo makes it easy to create personalized books in minutes. Simply choose between a Story Book or Picture Book,
                upload photos, add details about your recipient, and our AI will generate a unique, high-quality book that's printed
                and shipped directly to you or your recipient.
              </p>
            </div>
          </div>

          {/* FAQ Item 2 */}
          <div className="border-b border-gray-200" itemScope itemType="https://schema.org/Question">
            <button
              className="w-full flex justify-between items-center py-6 text-left focus:outline-none"
              onClick={() => toggleFaq(1)}
              aria-expanded={openFaqs.includes(1)}
              aria-controls="faq-answer-2"
            >
              <h3 className="text-xl font-medium text-[#333333]" itemProp="name">Why are Wishiyo books splendid gifts?</h3>
              <ChevronDown className={`h-6 w-6 text-[#FF6B35] transition-transform duration-200 ${openFaqs.includes(1) ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            <div id="faq-answer-2" className={`pb-6 ${openFaqs.includes(1) ? 'block' : 'hidden'}`} itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
              <p className="text-gray-700" itemProp="text">
                Wishiyo books make perfect gifts for friends, family members, partners, and colleagues. Each book features a completely
                personalized story or illustrations that belong exclusively to the recipient. They're ideal for birthdays, anniversaries,
                graduations, retirements, or any special occasion when you want to give something truly meaningful that captures your
                shared memories or transforms them into the star of their own story.
              </p>
            </div>
          </div>

          {/* FAQ Item 3 */}
          <div className="border-b border-gray-200" itemScope itemType="https://schema.org/Question">
            <button
              className="w-full flex justify-between items-center py-6 text-left focus:outline-none"
              onClick={() => toggleFaq(2)}
              aria-expanded={openFaqs.includes(2)}
              aria-controls="faq-answer-3"
            >
              <h3 className="text-xl font-medium text-[#333333]" itemProp="name">How long does it take to get the book?</h3>
              <ChevronDown className={`h-6 w-6 text-[#FF6B35] transition-transform duration-200 ${openFaqs.includes(2) ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            <div id="faq-answer-3" className={`pb-6 ${openFaqs.includes(2) ? 'block' : 'hidden'}`} itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
              <p className="text-gray-700" itemProp="text">
                After placing your order, your book will be printed within 3-5 business days. Standard shipping takes 5-7 business days
                within the US. Express shipping options are available at checkout for faster delivery.
              </p>
            </div>
          </div>

          {/* FAQ Item 4 */}
          <div className="border-b border-gray-200" itemScope itemType="https://schema.org/Question">
            <button
              className="w-full flex justify-between items-center py-6 text-left focus:outline-none"
              onClick={() => toggleFaq(3)}
              aria-expanded={openFaqs.includes(3)}
              aria-controls="faq-answer-4"
            >
              <h3 className="text-xl font-medium text-[#333333]" itemProp="name">What are the sizes of the books?</h3>
              <ChevronDown className={`h-6 w-6 text-[#FF6B35] transition-transform duration-200 ${openFaqs.includes(3) ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            <div id="faq-answer-4" className={`pb-6 ${openFaqs.includes(3) ? 'block' : 'hidden'}`} itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
              <p className="text-gray-700" itemProp="text">
                Our Picture Books measure 8.5" x 8.5" (21.6cm x 21.6cm) with 24-32 pages of vibrant color illustrations.
                Story Books are 6" x 9" (15.2cm x 22.9cm) and typically contain 220-240 pages of personalized content.
                Both book types are printed on premium paper and professionally bound for durability.
              </p>
            </div>
          </div>

          {/* FAQ Item 5 */}
          <div className="border-b border-gray-200" itemScope itemType="https://schema.org/Question">
            <button
              className="w-full flex justify-between items-center py-6 text-left focus:outline-none"
              onClick={() => toggleFaq(4)}
              aria-expanded={openFaqs.includes(4)}
              aria-controls="faq-answer-5"
            >
              <h3 className="text-xl font-medium text-[#333333]" itemProp="name">What is your return policy?</h3>
              <ChevronDown className={`h-6 w-6 text-[#FF6B35] transition-transform duration-200 ${openFaqs.includes(4) ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            <div id="faq-answer-5" className={`pb-6 ${openFaqs.includes(4) ? 'block' : 'hidden'}`} itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
              <p className="text-gray-700" itemProp="text">
                Since each book is custom-made, we don't accept returns. However, if there's a printing error or damage during shipping,
                we'll gladly replace your book at no additional cost. Just contact us within 14 days of receiving your order.
              </p>
            </div>
          </div>

          {/* FAQ Item 6 */}
          <div className="border-b border-gray-200" itemScope itemType="https://schema.org/Question">
            <button
              className="w-full flex justify-between items-center py-6 text-left focus:outline-none"
              onClick={() => toggleFaq(5)}
              aria-expanded={openFaqs.includes(5)}
              aria-controls="faq-answer-6"
            >
              <h3 className="text-xl font-medium text-[#333333]" itemProp="name">Can I use the book for commercial purposes?</h3>
              <ChevronDown className={`h-6 w-6 text-[#FF6B35] transition-transform duration-200 ${openFaqs.includes(5) ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            <div id="faq-answer-6" className={`pb-6 ${openFaqs.includes(5) ? 'block' : 'hidden'}`} itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
              <p className="text-gray-700" itemProp="text">
                No. Wishiyo books are created for fun and as gifts only. They are designed for personal enjoyment and to be shared
                with friends and family. Our books are not intended for commercial use, resale, or distribution beyond personal gifting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
