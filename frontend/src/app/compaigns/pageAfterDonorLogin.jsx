import React from 'react';
import { Clock, Sparkles, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const LAST_OPENED_CAMPAIGN_KEY = 'chomnuoy_last_opened_campaign';

export default function CampaignCard({
  id,
  title,
  description,
  image,
  category,
  campaignType,
  materialItem,
  organizationId,
  organization,
  location,
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
  const campaignState = {
    from: '/campaigns/donor',
    campaign: {
      id,
      title,
      summary: description,
      image,
      category,
      campaignType,
      materialItem,
      organizationId,
      organization,
      location,
      raisedAmount: raised,
      goalAmount: goal,
    },
  };

  const handleCardClick = () => {
    window.localStorage.setItem(LAST_OPENED_CAMPAIGN_KEY, JSON.stringify(campaignState.campaign));
    navigate(campaignPath, { state: campaignState });
  };

  const handleDonateClick = (e) => {
    e.stopPropagation();
    window.localStorage.setItem(LAST_OPENED_CAMPAIGN_KEY, JSON.stringify(campaignState.campaign));
    navigate(campaignPath, { state: campaignState });
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
