import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Helmet>
        <title>Page Not Found - WISHIYO</title>
        <meta name="robots" content="noindex, follow" />
        <meta name="description" content="The page you are looking for could not be found. Return to WISHIYO homepage to create your custom story book." />
      </Helmet>
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <p className="text-gray-500 mb-6">The page you are looking for might have been removed or is temporarily unavailable.</p>
        <a href="/" className="px-6 py-3 bg-[#FF6B35] text-white rounded-md hover:bg-[#FF6B35]/80 transition-colors">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
