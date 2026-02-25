export default function TrustSection() {
  const logos = ['UNICEF', 'Red Cross', 'WWF', 'CARE', 'OXFAM'];

  return (
    <div className="py-12 border-y border-slate-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Trusted by Global Organizations</p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-20 opacity-50 grayscale dark:invert">
          {logos.map((logo) => (
            <span key={logo} className="text-2xl font-black text-slate-900 dark:text-white">{logo}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
