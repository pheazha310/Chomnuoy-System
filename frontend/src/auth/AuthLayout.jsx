import { motion } from 'motion/react';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1509099836639-18ba1795216d?q=80&w=1200&auto=format&fit=crop';

export default function AuthLayout({ mode, children }) {
  const isLogin = mode === 'login';

  return (
    <div className="min-h-screen bg-[#EFF1F6]">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="min-h-screen w-full bg-white lg:grid lg:grid-cols-2"
      >
        <aside className="relative hidden min-h-screen lg:block">
          <img
            src={HERO_IMAGE}
            alt="Community children"
            className="absolute inset-0 h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2449CF]/85 via-[#2449CF]/25 to-transparent" />

          <div className="absolute bottom-0 p-12 text-white">
            <h2 className="max-w-sm text-[46px] font-bold leading-[1.02] tracking-[-0.02em]">
              {isLogin ? 'Welcome back to the community' : 'Start your journey with us'}
            </h2>
            <p className="mt-6 max-w-[420px] text-[30px] leading-[1.2] text-white/90">
              {isLogin
                ? 'Access your dashboard, manage your contributions, and stay connected with the impact you create.'
                : 'Join a global network of donors and organizations dedicated to making a real difference.'}
            </p>
          </div>
        </aside>

        <section className="flex min-h-screen items-center justify-center px-6 py-8 sm:px-10 lg:px-14">
          <div className="w-full max-w-[520px]">{children}</div>
        </section>
      </motion.div>
    </div>
  );
}
