import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Package, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import OrderVerificationModal from './orders/OrderVerificationModal';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
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
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center space-x-1" 
              onClick={() => setIsOrderModalOpen(true)}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>My Orders</span>
            </Button>
            <Link to="/orders" className="relative">
              <Button variant="ghost" size="icon">
                <Package className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <Link to="/orders" className="relative mr-2">
              <Button variant="ghost" size="icon">
                <Package className="h-5 w-5" />
              </Button>
            </Link>
            <button className="p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden px-4 py-4 space-y-4 border-t border-gray-200">
            <Link to="/" className="block text-gray-600 hover:text-primary transition-colors">
              Home
            </Link>
            <Link to="/friends" className="block text-gray-600 hover:text-primary transition-colors">
              Personalized Book
            </Link>
            <Link to="/love" className="block text-gray-600 hover:text-primary transition-colors">
              Illustrated Book
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center space-x-1 w-full justify-start" 
              onClick={() => {
                setIsMenuOpen(false);
                setIsOrderModalOpen(true);
              }}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>My Orders</span>
            </Button>
          </div>
        )}

        {/* 订单验证模态框 */}
        <OrderVerificationModal 
          isOpen={isOrderModalOpen} 
          onClose={() => setIsOrderModalOpen(false)} 
        />
      </div>
    </header>
  );
};

export default Header;