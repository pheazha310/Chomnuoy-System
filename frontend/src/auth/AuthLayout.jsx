import { motion } from 'framer-motion';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1509099836639-18ba1795216d?q=80&w=1200&auto=format&fit=crop';

export default function AuthLayout({ mode, children }) {
  const isLogin = mode === 'login';

  return (
    <div className="min-h-screen bg-[#EFF1F6] px-4 sm:px-6">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center py-8 sm:py-10">

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full overflow-hidden rounded-[28px] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.08)] lg:grid lg:grid-cols-2"
        >
          <aside className="relative hidden min-h-[560px] lg:block">
            <img
              src={HERO_IMAGE}
              alt="Community children"
              className="absolute inset-0 h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2449CF]/85 via-[#2449CF]/25 to-transparent" />

            <div className="absolute bottom-0 p-10 text-white">
              <h2 className="max-w-sm text-[38px] font-bold leading-[1.02] tracking-[-0.02em]">
                {isLogin ? 'Welcome back to the community' : 'Start your journey with us'}
              </h2>
              <p className="mt-6 max-w-[360px] text-[24px] leading-[1.24] text-white/90">
                {isLogin
                  ? 'Access your dashboard, manage your contributions, and stay connected with the impact you create.'
                  : 'Join a global network of donors and organizations dedicated to making a real difference.'}
              </p>
            </div>
          </aside>

          <section className="px-6 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</section>
        </motion.div>

      </div>
    </div>
  );
}
