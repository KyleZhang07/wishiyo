import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Package, Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200" itemScope itemType="https://schema.org/SiteNavigationElement" role="navigation" aria-label="Main Navigation">
      <div className="container mx-auto px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl pl-4 brand-logo" aria-label="WISHIYO Home">WISHIYO</Link>
            <nav className="hidden md:flex items-center space-x-8" aria-label="Primary Navigation">
              <Link to="/" className="text-gray-600 hover:text-primary transition-colors relative group" itemProp="url">
                <span itemProp="name">Home</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-200 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link to="/friends" className="text-gray-600 hover:text-primary transition-colors relative group" itemProp="url">
                <span itemProp="name">Story Book</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#FF6B35] transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link to="/love" className="text-gray-600 hover:text-primary transition-colors relative group" itemProp="url">
                <span itemProp="name">Picture Book</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </nav>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 pr-4">
            <Link to="/verify-order" className="text-gray-600 hover:text-primary transition-colors relative group" itemProp="url">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <span itemProp="name">Orders</span>
              </div>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-200 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <Link to="/verify-order" className="relative mr-2">
              <Button variant="ghost" size="icon">
                <Package className="h-5 w-5" />
              </Button>
            </Link>
            <button className="p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && <nav className="md:hidden py-4 space-y-4">
            <Link to="/" className="block px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors relative" onClick={() => setIsMenuOpen(false)}>
              Home
              <span className="absolute left-4 -bottom-1 w-12 h-0.5 bg-gray-200"></span>
            </Link>
            <Link to="/friends" className="block px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors relative" onClick={() => setIsMenuOpen(false)}>
              Story Book
              <span className="absolute left-4 -bottom-1 w-20 h-0.5 bg-[#FF6B35]"></span>
            </Link>
            <Link to="/love" className="block px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors relative" onClick={() => setIsMenuOpen(false)}>
              Picture Book
              <span className="absolute left-4 -bottom-1 w-24 h-0.5 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500"></span>
            </Link>
          </nav>}
      </div>
    </header>;
};
export default Header;
