import React from 'react';
import { ArrowRight, Clock, Sparkles, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const LAST_OPENED_CAMPAIGN_KEY = 'chomnuoy_last_opened_campaign';

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
  const footerHeadline = isMaterialCampaign ? `${Math.max(0, requestedItems - pledgedItems).toLocaleString()} items left` : timeLeft;
  const footerEyebrow = isMaterialCampaign ? 'Items Remaining' : 'Campaign Closes';
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
          onError={(event) => {
            if (event.currentTarget.src !== fallbackCampaignImage) {
              event.currentTarget.src = fallbackCampaignImage;
            }
          }}
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
          <div className="rounded-[20px] border border-[#dbe4ee] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              <div className="flex items-end justify-between gap-3 text-sm">
              <div className="flex flex-col">
                <span className="text-[0.62rem] font-extrabold uppercase tracking-[0.2em] text-[#8a9ab0]">{primaryMetricLabel}</span>
                <span className="text-[1.25rem] font-black leading-none text-[#0d2546]">
                  {primaryMetricValue}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[0.62rem] font-extrabold uppercase tracking-[0.2em] text-[#8a9ab0]">{secondaryMetricLabel}</span>
                <span className="text-[1.25rem] font-black leading-none text-[#0d2546]">{secondaryMetricValue}</span>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#8a9ab0]">
              <span>{progressLabel}</span>
              <span>{campaignTypeLabel}</span>
            </div>

            <div
              className="relative mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#e7edf5]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
            >
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#3b82f6] to-[#1f7de2]"
              />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[22px] border border-[#dbe6f3] bg-[linear-gradient(135deg,#ffffff_0%,#f7fbff_52%,#edf5ff_100%)] p-3 shadow-[0_12px_28px_rgba(15,23,42,0.045)]">
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.12),transparent_70%)]" />
            <div className="relative flex items-center gap-2.5">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#c9d9ea] bg-[linear-gradient(180deg,#ffffff_0%,#edf6ff_100%)] text-[#65809d] shadow-[0_6px_14px_rgba(59,130,246,0.08)]">
                  <Clock className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block text-[0.56rem] font-extrabold uppercase tracking-[0.22em] text-[#8ea0b5]">
                    {footerEyebrow}
                  </span>
                  <p className="mt-0.5 text-[0.9rem] font-black leading-tight text-[#102a4c]">
                    {footerHeadline}
                  </p>
                  <span className="mt-0.5 block text-[0.72rem] font-semibold text-[#6d8097]">
                    {campaignTypeLabel}
                  </span>
                </div>
              </div>
              <button
                onClick={handleDonateClick}
                className="inline-flex min-h-[46px] shrink-0 items-center justify-center gap-1.5 rounded-[18px] bg-[linear-gradient(135deg,#3a97ff_0%,#2180eb_55%,#156fd6_100%)] px-4 py-2.5 text-[0.76rem] font-black text-white shadow-[0_12px_22px_rgba(31,125,226,0.22)] transition hover:translate-y-[-1px] hover:shadow-[0_16px_28px_rgba(31,125,226,0.28)] sm:min-w-[150px]"
              >
                <span>{isMaterialCampaign ? 'Pledge Support' : 'Support Now'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
