
import { Helmet } from 'react-helmet';

const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <Helmet>
        <title>Privacy Policy - WISHIYO</title>
        <meta name="description" content="Learn about WISHIYO's privacy policy and how we protect your personal information when creating personalized books." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.wishiyo.com/privacy" />
      </Helmet>

      <div className="mt-12">
        <h1 className="text-4xl font-serif font-bold mb-8 text-center">Privacy Policy</h1>
      </div>

      <div className="prose prose-lg max-w-none">
        <h2 className="text-2xl font-serif font-semibold mb-4">1. Introduction</h2>
        <p>
          Welcome to Wishiyo ("we," "our," or "us"). At Wishiyo, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website (wishiyo.com) or use our services to create personalized Story Books and Picture Books.
        </p>
        <p>
          By accessing or using our services, you agree to this Privacy Policy. If you do not agree with our policies and practices, please do not use our services.
        </p>

        <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">2. Information We Collect</h2>
        <h3 className="text-xl font-serif font-medium mt-6 mb-3">2.1 Personal Information</h3>
        <p>
          We may collect the following types of personal information:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Contact information (name, email address, shipping address)</li>
          <li>Payment information (processed through our secure payment processor)</li>
          <li>Account information (if you create an account)</li>
          <li>Order history and preferences</li>
          <li>Photos and content you upload to create your personalized books</li>
          <li>Information about the recipient of your book (if provided)</li>
        </ul>

        <h3 className="text-xl font-serif font-medium mt-6 mb-3">2.2 Automatically Collected Information</h3>
        <p>
          When you visit our website, we may automatically collect certain information about your device and usage, including:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>IP address</li>
          <li>Browser type and version</li>
          <li>Operating system</li>
          <li>Time and date of your visit</li>
          <li>Pages you view</li>
          <li>Time spent on pages</li>
          <li>Referral sources</li>
          <li>Other browsing information</li>
        </ul>

        <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
        <p>
          We use your information for the following purposes:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>To create and deliver your personalized books</li>
          <li>To process and fulfill your orders</li>
          <li>To provide customer support</li>
          <li>To communicate with you about your orders and our services</li>
          <li>To improve our website and services</li>
          <li>To personalize your experience</li>
          <li>To process payments</li>
          <li>To comply with legal obligations</li>
        </ul>

        <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">4. AI-Generated Content</h2>
        <p>
          Wishiyo uses artificial intelligence to generate personalized content for your books. When you provide information and photos to create a book, our AI systems process this data to create unique stories and illustrations. This process involves:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Analyzing photos to create personalized illustrations</li>
          <li>Using your answers to questions to generate personalized stories</li>
          <li>Creating book content based on your selected themes and preferences</li>
        </ul>
        <p>
          We do not use your personal content to train our AI models. Your uploaded photos and personal information are used solely for creating your personalized book.
        </p>

        <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">5. Information Sharing and Disclosure</h2>
        <p>
          We may share your information with:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Printing and shipping partners (to fulfill your orders)</li>
          <li>Payment processors (to process transactions)</li>
          <li>Service providers (who help us operate our business)</li>
          <li>Legal authorities (when required by law)</li>
        </ul>
        <p>
          We do not sell your personal information to third parties.
        </p>

        <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">6. Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
        </p>

        <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">7. Data Retention</h2>
        <p>
          We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. We will retain order information to fulfill your orders and provide customer support, but you may request deletion of your account and personal information at any time.
        </p>

        <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">8. Your Rights</h2>
        <p>
          Depending on your location, you may have certain rights regarding your personal information, including:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>The right to access your personal information</li>
          <li>The right to correct inaccurate information</li>
          <li>The right to delete your personal information</li>
          <li>The right to restrict or object to processing</li>
          <li>The right to data portability</li>
          <li>The right to withdraw consent</li>
        </ul>
        <p>
          To exercise these rights, please contact us through our website.
        </p>

        <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">9. Children's Privacy</h2>
        <p>
          Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us, and we will delete such information from our records.
        </p>

        <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">10. Changes to This Privacy Policy</h2>
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
        </p>


      </div>
    </div>
  );
};

export default PrivacyPolicy;
