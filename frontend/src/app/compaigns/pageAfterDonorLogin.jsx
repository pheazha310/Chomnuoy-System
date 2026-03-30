import React from 'react';
import { Clock, Sparkles, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import ROUTES from '@/constants/routes.js';

const placeholderImage =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#c7d2fe"/><stop offset="100%" stop-color="#fef3c7"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><text x="50%" y="50%" font-size="28" font-family="Arial" text-anchor="middle" fill="#334155">Campaign</text></svg>'
  );

const fallbackCampaignImage =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#DBEAFE"/><stop offset="100%" stop-color="#FEF3C7"/></linearGradient></defs><rect width="1200" height="700" fill="url(#g)"/><text x="50%" y="50%" font-size="36" font-family="Source Sans 3, Noto Sans Khmer, sans-serif" text-anchor="middle" fill="#334155">Campaign Image</text></svg>'
  );

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
  const location = useLocation();
  const navigate = useNavigate();
  const safeGoal = goal > 0 ? goal : 1;
  const progress = Math.min((raised / safeGoal) * 100, 100);
  const campaignPath = ROUTES.CAMPAIGN_DETAILS(id || title.toLowerCase().replace(/\s+/g, '-'));
  const fromPath = `${location.pathname}${location.search || ''}`;

  const handleCardClick = () => {
    navigate(campaignPath, { state: { from: fromPath } });
  };

  const handleDonateClick = (e) => {
    e.stopPropagation();
    navigate(campaignPath, { state: { from: fromPath } });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onClick={handleCardClick}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-xl"
    >
      <div className="relative h-56 overflow-hidden bg-slate-100">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
          onError={(event) => {
<<<<<<< HEAD
            event.currentTarget.onerror = null;
            event.currentTarget.src = placeholderImage;
=======
            if (event.currentTarget.src !== fallbackCampaignImage) {
              event.currentTarget.src = fallbackCampaignImage;
            }
>>>>>>> 368e64761fc38b6c82439821fe92c0c52a5bfab8
          }}
        />
        {isUrgent && (
          <div className="absolute top-4 left-4 flex items-center gap-1 rounded-full bg-red-600 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
            <Zap className="h-3 w-3" />
            Urgent
          </div>
        )}
        {isNew && !isUrgent && (
          <div className="absolute top-4 left-4 flex items-center gap-1 rounded-full bg-[#c7763c] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
            <Sparkles className="h-3 w-3" />
            New
          </div>
        )}
        <div className="absolute bottom-4 left-4 rounded-lg bg-white/92 px-3 py-1 text-xs font-bold text-slate-900 backdrop-blur-sm">
          {category}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex-1">
          <h3
            className="mb-2 text-xl font-bold text-slate-900 transition-colors group-hover:text-[#a85b2e]"
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
            className="mb-6 text-sm text-slate-700"
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
          <div className="flex items-end justify-between text-sm">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-500">Raised</span>
              <span className="text-lg font-bold leading-tight text-slate-900">
                ${raised.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs font-medium text-slate-500">Goal</span>
              <span className="font-semibold text-slate-600">${goal.toLocaleString()}</span>
            </div>
          </div>

          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="absolute top-0 left-0 h-full rounded-full bg-[#c7763c]"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1 text-sm text-slate-600">
              <Clock className="h-4 w-4" />
              <span>{timeLeft}</span>
            </div>
            <button
              onClick={handleDonateClick}
              className="rounded-lg bg-[#c7763c] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-[#a85b2e]"
            >
              Support
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
