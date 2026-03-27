import React from 'react';

export default function StatsCard({ label, value, icon, iconBg, iconColor }) {
  return (
    <div className="flex min-w-[168px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className={`${iconBg} ${iconColor} rounded-lg p-2`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <p className="text-[1.05rem] font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}
