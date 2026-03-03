import React from 'react';

export default function StatsCard({ label, value, icon, iconBg, iconColor }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm min-w-[180px]">
      <div className={`${iconBg} ${iconColor} p-2 rounded-lg`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
