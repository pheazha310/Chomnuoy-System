import { Heart, Twitter, Instagram, Send } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Heart className="text-white w-4 h-4" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-primary">Chomnouy</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Chomnouy is a global crowdfunding platform dedicated to empowering local communities and fostering sustainable growth through collective giving.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-6 dark:text-white">Explore</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a href="#" className="hover:text-primary transition-colors">Featured Causes</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Recent Projects</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Education</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Health & Wellness</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Environment</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 dark:text-white">Resources</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">How it Works</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Transparency</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Success Stories</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 dark:text-white">Newsletter</h4>
            <p className="text-sm text-slate-500 mb-4">Stay updated with the latest causes and impact reports.</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Email address" 
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm w-full focus:ring-primary focus:border-primary outline-none dark:text-white"
              />
              <button className="bg-primary text-white p-2 rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-400">
          <p>© 2024 CHOMNOUY PLATFORM. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-6 uppercase tracking-widest">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
