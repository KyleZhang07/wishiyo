
import { Helmet } from 'react-helmet';

const ReturnPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <Helmet>
        <title>Return Policy - WISHIYO</title>
        <meta name="description" content="Learn about WISHIYO's return policy for personalized Story Books and Picture Books." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.wishiyo.com/return-policy" />
      </Helmet>

      <div className="mt-12">
        <h1 className="text-4xl font-serif font-bold mb-8 text-center">Return Policy</h1>
      </div>

      <div className="prose prose-lg max-w-none">
        <h2 className="text-2xl font-serif font-semibold mb-4">1. Custom-Made Products</h2>
        <p>
          At Wishiyo, we create personalized Story Books and Picture Books that are custom-made specifically for you based on the information, photos, and preferences you provide. Each book is uniquely created using our AI technology to generate personalized content and illustrations.
        </p>
        <p>
          Due to the personalized nature of our products, we generally do not accept returns or exchanges. Each book is printed on-demand specifically for you and cannot be resold.
        </p>

        <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">2. Quality Guarantee</h2>
        <p>
          We stand behind the quality of our products. If your book arrives with any of the following issues, we will gladly replace it at no additional cost:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Printing errors (missing pages, blank pages, ink smudges)</li>
          <li>Binding defects (loose pages, misaligned binding)</li>
          <li>Damage during shipping (bent corners, torn pages, water damage)</li>
          <li>Wrong book delivered (not matching your order)</li>
        </ul>
        <p>
          To request a replacement for a defective book, please contact our customer support team within 14 days of receiving your order. You will need to provide:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Your order number</li>
          <li>A description of the issue</li>
          <li>Photos showing the defect or damage</li>
        </ul>

        <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">3. Content Satisfaction</h2>
        <p>
          Our AI technology creates unique stories and illustrations based on the information you provide during the book creation process. The final content is generated using artificial intelligence and may vary in style and specific details.
        </p>
        <p>
          While we strive to create high-quality, engaging content, we cannot guarantee that every aspect of the AI-generated content will meet your specific expectations. The nature of AI-generated content means there may be variations in style, tone, and specific details.
        </p>
        <p>
          If you are significantly dissatisfied with the content of your book, please contact our customer support team within 14 days of receiving your order. We will review your concerns on a case-by-case basis and may offer one of the following solutions:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Partial refund</li>
          <li>Discount on a future order</li>
          <li>Regeneration of content (in certain circumstances)</li>
        </ul>

        <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">4. Cancellation Policy</h2>
        <p>
          You may cancel your order within 24 hours of placing it, provided that production has not yet begun. Once our team starts creating your personalized book, cancellations are not possible.
        </p>
        <p>
          To cancel an order, please contact our customer support team immediately with your order number and request for cancellation.
        </p>

        <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">5. Shipping Issues</h2>
        <p>
          If your order is lost or significantly delayed during shipping, please contact our customer support team. We will work with our shipping partners to locate your package or arrange for a replacement if necessary.
        </p>
        <p>
          For packages marked as delivered but not received, please:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Check with neighbors and household members</li>
          <li>Look around your property for alternative delivery locations</li>
          <li>Contact the delivery carrier with your tracking number</li>
          <li>Notify our customer support team if you still cannot locate your package</li>
        </ul>

        <h2 className="text-2xl font-serif font-semibold mt-8 mb-4">6. Refund Process</h2>
        <p>
          When a refund is approved, it will be processed using the original payment method. Refunds typically take 5-10 business days to appear on your account, depending on your financial institution.
        </p>
        <p>
          Shipping costs are generally non-refundable, except in cases where we made an error or the product was defective.
        </p>


      </div>
    </div>
  );
};

export default ReturnPolicy;
