import React from 'react';
import { ArrowRight, Clock } from 'lucide-react';

interface CauseProps {
  category: string;
  categoryColor: string;
  title: string;
  description: string;
  image: string;
  raised: string;
  progress: number;
  timeLeft: string;
  isUrgent?: boolean;
}

const CauseCard: React.FC<CauseProps> = ({ category, categoryColor, title, description, image, raised, progress, timeLeft, isUrgent }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-slate-100 dark:border-slate-700 group">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <span className={`absolute top-4 left-4 ${categoryColor} text-white text-[10px] font-bold px-2 py-1 rounded uppercase`}>
          {category}
        </span>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2 dark:text-white">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 line-clamp-2">{description}</p>
        <div className="space-y-4">
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="flex justify-between text-xs font-bold">
            <div><span className="text-primary">{raised}</span> <span className="text-slate-400">raised</span></div>
            <div className="text-primary">{progress}%</div>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <div className={`flex items-center gap-1 text-xs ${isUrgent ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
              <Clock className="w-4 h-4" /> {timeLeft}
            </div>
            <a href="#" className="text-primary font-bold text-sm hover:underline">Donate Now</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FeaturedCauses() {
  const causes: CauseProps[] = [
    {
      category: 'Environment',
      categoryColor: 'bg-primary',
      title: 'Clean Water for Rural Villages',
      description: 'Providing sustainable water solutions to remote areas, ensuring access to safe drinking water.',
      image: 'https://picsum.photos/seed/water/600/400',
      raised: '$13,200',
      progress: 65,
      timeLeft: '12 days left'
    },
    {
      category: 'Education',
      categoryColor: 'bg-green-500',
      title: 'Digital Literacy for Youth',
      description: 'Equipping students with essential tech skills and providing computers to community centers.',
      image: 'https://picsum.photos/seed/digital/600/400',
      raised: '$8,450',
      progress: 42,
      timeLeft: '24 days left'
    },
    {
      category: 'Health',
      categoryColor: 'bg-red-500',
      title: 'Mobile Clinics for Remote Areas',
      description: 'Bringing essential healthcare services to populations without nearby medical facilities.',
      image: 'https://picsum.photos/seed/health/600/400',
      raised: '$22,900',
      progress: 81,
      timeLeft: '3 days left',
      isUrgent: true
    }
  ];

  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-extrabold mb-2 dark:text-white">Featured Causes</h2>
            <p className="text-slate-600 dark:text-slate-400">Urgent projects that need your immediate support.</p>
          </div>
          <a href="#" className="text-primary font-bold flex items-center gap-1 hover:gap-2 transition-all">
            View All Causes <ArrowRight className="w-4 h-4" />
          </a>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {causes.map((cause, idx) => (
            <CauseCard 
              key={idx} 
              category={cause.category}
              categoryColor={cause.categoryColor}
              title={cause.title}
              description={cause.description}
              image={cause.image}
              raised={cause.raised}
              progress={cause.progress}
              timeLeft={cause.timeLeft}
              isUrgent={cause.isUrgent}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
