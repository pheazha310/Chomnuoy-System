import { User, Building2 } from 'lucide-react';

export default function HowItWorks() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-4xl font-extrabold mb-4 dark:text-white">How Chomnouy Works</h2>
          <p className="text-slate-600 dark:text-slate-400">Connecting visionaries with the resources they need to create lasting impact in our community.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* For Donors */}
          <div className="bg-blue-50/50 dark:bg-blue-900/10 p-10 rounded-3xl space-y-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-extrabold dark:text-white">For Donors</h3>
            </div>
            <div className="space-y-6">
              {[
                { step: 1, title: 'Browse Projects', desc: 'Explore verified causes across education, environment, health, and more.' },
                { step: 2, title: 'Give Securely', desc: 'Make a one-time or recurring donation through our encrypted platform.' },
                { step: 3, title: 'Track Impact', desc: 'Receive regular updates and see exactly how your contribution is changing lives.' }
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 dark:text-white">{item.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* For Organizations */}
          <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-10 rounded-3xl space-y-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-extrabold dark:text-white">For Organizations</h3>
            </div>
            <div className="space-y-6">
              {[
                { step: 1, title: 'Create Campaign', desc: 'Set up your cause with compelling stories, photos, and a clear funding goal.' },
                { step: 2, title: 'Share & Engage', desc: 'Use our built-in tools to reach new donors and keep your community informed.' },
                { step: 3, title: 'Receive Funds', desc: 'Fast, transparent fund disbursement to help you start your project sooner.' }
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 dark:text-white">{item.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
