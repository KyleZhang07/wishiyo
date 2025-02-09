
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login success
    navigate('/user-center');
  };

  return (
    <div className="page-transition min-h-screen flex items-center justify-center bg-gray-50">
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-md mx-auto">
          <div className="glass-card rounded-2xl p-8">
            <h1 className="text-2xl font-display font-bold text-center mb-8">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Enter your password"
                />
              </div>
              
              <button
                type="submit"
                className="w-full py-3 text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
