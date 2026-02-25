export default function CTASection() {
  return (
    <section className="py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-primary rounded-[2rem] p-12 lg:p-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white">Ready to make a difference?</h2>
            <p className="text-white/80 text-lg max-w-xl mx-auto">Whether you're looking to give or starting a new initiative, Chomnouy is here to support your journey.</p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <button className="bg-white text-primary px-10 py-4 rounded-full font-bold hover:scale-105 transition-transform">
                Start Your Journey
              </button>
              <button className="bg-white/10 text-white border border-white/20 backdrop-blur-sm px-10 py-4 rounded-full font-bold hover:bg-white/20 transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}