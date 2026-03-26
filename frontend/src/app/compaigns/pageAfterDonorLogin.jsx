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
  const isMaterialCampaign = String(campaignType || '').toLowerCase().includes('material');
  const requestedItems = Math.max(1, Number(materialItem?.quantity || goal || 1));
  const pledgedItems = Math.max(0, Number(raised || 0));
  const safeGoal = isMaterialCampaign ? requestedItems : (goal > 0 ? goal : 1);
  const progressBase = isMaterialCampaign ? pledgedItems : raised;
  const progress = Math.min((progressBase / safeGoal) * 100, 100);
  const campaignTypeLabel = isMaterialCampaign ? 'Material Drive' : 'Monetary Campaign';
  const primaryMetricLabel = isMaterialCampaign ? 'Pledged' : 'Raised';
  const secondaryMetricLabel = isMaterialCampaign ? 'Needed' : 'Goal';
  const primaryMetricValue = isMaterialCampaign ? pledgedItems.toLocaleString() : `$${raised.toLocaleString()}`;
  const secondaryMetricValue = isMaterialCampaign ? requestedItems.toLocaleString() : `$${goal.toLocaleString()}`;
  const progressLabel = isMaterialCampaign ? `${Math.round(progress)}% pledged` : `${Math.round(progress)}% funded`;
  const remainingValue = isMaterialCampaign
    ? `${Math.max(0, requestedItems - pledgedItems).toLocaleString()} items remaining`
    : `$${Math.max(0, goal - raised).toLocaleString()} remaining`;
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
      className="group flex cursor-pointer flex-col overflow-hidden rounded-[18px] border border-[#dbe4ef] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(15,23,42,0.1)]"
    >
      <div className="relative h-40 overflow-hidden bg-slate-100">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/12 via-transparent to-transparent" />
        {isUrgent && (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-[#ef4444] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_8px_16px_rgba(239,68,68,0.22)]">
            <Zap className="h-3 w-3" />
            Urgent
          </div>
        )}
        {isNew && !isUrgent && (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-[#2563eb] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_8px_16px_rgba(37,99,235,0.22)]">
            <Sparkles className="h-3 w-3" />
            New
          </div>
        )}
        <div className="absolute bottom-3 left-3 rounded-md border border-white/80 bg-white/92 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-700 shadow-sm backdrop-blur-sm">
          {category}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex-1">
          <h3
            className="mb-1.5 text-[1.02rem] font-black leading-[1.22] text-slate-900 transition-colors group-hover:text-[#2563eb] md:text-[1.08rem]"
            style={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
            }}
          >
            {title}
          </h3>
          <p className="mb-2 text-[0.66rem] font-semibold text-slate-500">{organization || location || 'Verified Organization'}</p>
          <p
            className="mb-3 text-[0.72rem] leading-5 text-slate-600"
            style={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
            }}
          >
            {description}
          </p>
        </div>

        <div className="space-y-3">
          <div className="rounded-[14px] border border-[#e5ebf2] bg-[#fbfdff] px-3.5 py-3">
              <div className="flex items-end justify-between gap-3 text-sm">
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">{primaryMetricLabel}</span>
                <span className="text-[1.15rem] font-black leading-tight text-slate-900">
                  {primaryMetricValue}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">{secondaryMetricLabel}</span>
                <span className="text-[0.92rem] font-bold text-slate-700">{secondaryMetricValue}</span>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
              <span>{progressLabel}</span>
              <span>{campaignTypeLabel}</span>
            </div>

            <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#e8eef5] pt-2">
            <div className="flex items-center gap-2 text-[0.78rem] font-semibold text-slate-600">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#d9e5f1] bg-[#f8fbff] text-slate-500">
                <Clock className="h-3.5 w-3.5" />
              </span>
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Timeline</span>
                <span>{isMaterialCampaign ? remainingValue : timeLeft}</span>
              </div>
            </div>
            <button
              onClick={handleDonateClick}
              className="rounded-lg bg-gradient-to-r from-[#3294ff] to-[#1f7de2] px-3.5 py-2 text-[0.72rem] font-extrabold text-white shadow-[0_8px_18px_rgba(31,125,226,0.2)] transition hover:translate-y-[-1px] hover:from-[#2589f6] hover:to-[#156fd6]"
            >
              {isMaterialCampaign ? 'Pledge Support' : 'Support'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
