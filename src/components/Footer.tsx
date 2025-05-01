import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-12" itemScope itemType="https://schema.org/WPFooter">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-3">
            <h3 className="text-xl brand-logo mb-4">WISHIYO</h3>
            <p className="text-gray-600 max-w-[200px]">
              Create beautiful books powered by artificial intelligence in 3 minutes.
            </p>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-base font-semibold mb-3 text-[#FF6B35]">Follow us</h4>
            <div className="flex space-x-5">
              <a href="https://www.tiktok.com/@wishiyobook" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="text-gray-700 hover:text-[#FF6B35] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 448 512"><path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/></svg>
              </a>
              <a href="https://www.instagram.com/wishiyobook" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-700 hover:text-[#FF6B35] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 448 512"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>
              </a>
              <a href="https://www.facebook.com/wishiyo" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-gray-700 hover:text-[#FF6B35] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 320 512"><path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"/></svg>
              </a>
            </div>
          </div>

          <div className="md:col-span-2 md:ml-6">
            <h4 className="text-sm font-semibold mb-4">Quick Links</h4>
            <nav aria-label="Footer Navigation - Quick Links">
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/"
                    onClick={() => {
                      window.scrollTo(0, 0);
                    }}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/friends" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Story Book
                  </Link>
                </li>
                <li>
                  <Link to="/love" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Picture Book
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div className="md:col-span-2 md:ml-8">
            <h4 className="text-sm font-semibold mb-4">Support</h4>
            <nav aria-label="Footer Navigation - Support">
              <ul className="space-y-2">
                <li>
                  <Link to="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div className="md:col-span-2 md:ml-10 md:mr-0">
            <h4 className="text-sm font-semibold mb-4">Legal</h4>
            <nav aria-label="Footer Navigation - Legal">
              <ul className="space-y-2">
                <li>
                  <Link to="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/return-policy" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Return Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-600">
            © 2024-2025 <span className="brand-logo">WISHIYO</span>. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
