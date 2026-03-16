import React from 'react';
import { Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function CampaignCard({
  id,
  title,
  description,
  image,
  category,
  raised,
  goal,
  timeLeft,
  isUrgent,
  isNew,
}) {
  const navigate = useNavigate();
  const safeGoal = goal > 0 ? goal : 1;
  const progress = Math.min((raised / safeGoal) * 100, 100);
  const campaignPath = `/campaigns/${id || title.toLowerCase().replace(/\s+/g, '-')}`;

  const handleCardClick = () => {
    navigate(campaignPath);
  };

  const handleDonateClick = (e) => {
    e.stopPropagation();
    navigate(campaignPath);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onClick={handleCardClick}
      className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col cursor-pointer"
    >
      <div className="relative h-56 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        {isUrgent && (
          <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg">
            <span className="w-3 h-3">⚡</span> Urgent
          </div>
        )}
        {isNew && (
          <div className="absolute top-4 left-4 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg">
            <span className="w-3 h-3">★</span> New
          </div>
        )}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold text-slate-900">
          {category}
        </div>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex-1">
          <h3
            className="text-xl font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors"
            style={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
            }}
          >
            {title}
          </h3>
          <p
            className="text-slate-600 text-sm mb-6"
            style={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 3,
              overflow: 'hidden',
            }}
          >
            {description}
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-end text-sm">
            <div className="flex flex-col">
              <span className="text-slate-500 text-xs font-medium">Raised</span>
              <span className="text-slate-900 font-bold text-lg leading-tight">
                ${raised.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-slate-500 text-xs font-medium">Goal</span>
              <span className="text-slate-400 font-medium">${goal.toLocaleString()}</span>
            </div>
          </div>
          <div className="relative h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute top-0 left-0 h-full bg-primary rounded-full"
            />
          </div>
          <div className="flex justify-between items-center pt-2">
            <div className="flex items-center gap-1 text-slate-500 text-sm">
              <Clock className="w-4 h-4" />
              <span>{timeLeft}</span>
            </div>
            <button 
              onClick={handleDonateClick}
              className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors"
            >
              Support
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
