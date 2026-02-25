import { motion } from 'motion/react';

export default function Hero() {
  return (
    <section className="relative pt-16 pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                Empower Communities, <br />
                <span className="text-primary">Change Lives.</span>
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
                Join Chomnouy to support impactful projects or start your own journey of giving. We connect compassionate donors with grassroots initiatives making a real difference.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <button className="bg-primary text-white px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform shadow-lg shadow-primary/20">
                Donate Now
              </button>
              <button className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-8 py-4 rounded-full font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                Start a Campaign
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <img 
                    key={i}
                    src={`https://picsum.photos/seed/avatar${i}/100/100`} 
                    alt="User avatar" 
                    className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
              <p className="text-sm font-medium text-slate-500">Joined by 15k+ active donors</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-orange-100 dark:bg-orange-950/30 rounded-3xl p-6 lg:p-12 relative overflow-hidden">
              <img 
                src="https://picsum.photos/seed/charity/800/600" 
                alt="Children in classroom" 
                className="rounded-2xl shadow-2xl w-full h-[400px] object-cover"
                referrerPolicy="no-referrer"
              />
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute bottom-10 right-10 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl max-w-[200px]"
              >
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Latest Success</p>
                <p className="text-sm font-bold leading-tight dark:text-white">School Supplies for 500 Students in Siem Reap</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
