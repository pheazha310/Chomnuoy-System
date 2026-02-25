export default function Stats() {
  const stats = [
    { label: 'Total Donated', value: '$2.5M+' },
    { label: 'Lives Touched', value: '150k+' },
    { label: 'Active Projects', value: '450+' },
  ];

  return (
    <section className="bg-primary py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
          {stats.map((stat, idx) => (
            <div key={idx} className={`space-y-1 ${idx === 1 ? 'border-y md:border-y-0 md:border-x border-white/20 py-8 md:py-0' : ''}`}>
              <p className="text-4xl font-extrabold">{stat.value}</p>
              <p className="text-sm font-medium opacity-80 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
