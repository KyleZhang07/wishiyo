
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-display font-semibold">
            AI Book Crafter
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors">
              Home
            </Link>
            <Link to="/create/step1" className="text-gray-600 hover:text-gray-900 transition-colors">
              Create Book
            </Link>
            <Link to="/user-center" className="text-gray-600 hover:text-gray-900 transition-colors">
              My Books
            </Link>
            <Link to="/login" className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors">
              Sign In
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 space-y-4">
            <Link 
              to="/" 
              className="block px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/create/step1" 
              className="block px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Create Book
            </Link>
            <Link 
              to="/user-center" 
              className="block px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              My Books
            </Link>
            <Link 
              to="/login" 
              className="block px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Sign In
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
