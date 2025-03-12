import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
      <div className="container mx-auto px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-display font-semibold pl-4">WISHIYO</Link>
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-600 hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/friends" className="text-gray-600 hover:text-primary transition-colors">Personalized Book</Link>
              <Link to="/love" className="text-gray-600 hover:text-primary transition-colors">Illustrated Book</Link>
            </nav>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 pr-4">
            {/* Empty div to maintain layout */}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && <nav className="md:hidden py-4 space-y-4">
            <Link to="/" className="block px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors" onClick={() => setIsMenuOpen(false)}>
              Home
            </Link>
            <Link to="/friends" className="block px-4 py-2 text-amber-600 hover:text-amber-700 transition-colors" onClick={() => setIsMenuOpen(false)}>
              Personalized Book
            </Link>
            <Link to="/love" className="block px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors" onClick={() => setIsMenuOpen(false)}>
              Illustrated Book
            </Link>
          </nav>}
      </div>
    </header>;
};
export default Header;