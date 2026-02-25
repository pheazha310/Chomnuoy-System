import { useState, useEffect } from 'react';
import { Heart, Moon, Sun, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const [isDark, setIsDark] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Heart className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-primary">Chomnouy</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-sm font-semibold hover:text-primary transition-colors">Home</a>
            <a href="#" className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary">Organization</a>
            <a href="#" className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary">About Us</a>
            <a href="#" className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary">Contact</a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <a href="#" className="hidden sm:block bg-primary text-white px-6 py-2.5 rounded-full font-bold text-sm hover:opacity-90 transition-opacity">
              Login
            </a>
            <button 
              className="md:hidden p-2 text-slate-600 dark:text-slate-400"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              <a href="#" className="block px-3 py-2 text-base font-medium text-slate-900 dark:text-white hover:text-primary">Home</a>
              <a href="#" className="block px-3 py-2 text-base font-medium text-slate-600 dark:text-slate-400 hover:text-primary">Organization</a>
              <a href="#" className="block px-3 py-2 text-base font-medium text-slate-600 dark:text-slate-400 hover:text-primary">About Us</a>
              <a href="#" className="block px-3 py-2 text-base font-medium text-slate-600 dark:text-slate-400 hover:text-primary">Contact</a>
              <div className="pt-4">
                <a href="#" className="block w-full text-center bg-primary text-white px-6 py-3 rounded-full font-bold text-sm">Login</a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
