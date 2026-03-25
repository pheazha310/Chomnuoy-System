import { motion } from 'framer-motion';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1600&auto=format&fit=crop';

export default function AuthLayout({ mode, children }) {
  const isLogin = mode === 'login';

  return (
    <div className="min-h-screen bg-[#fffdf8]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen w-full lg:grid lg:grid-cols-[1fr_1fr]"
      >
        <aside className="relative hidden min-h-screen overflow-hidden lg:block">
          <img
            src={HERO_IMAGE}
            alt="Children smiling together"
            className="absolute inset-0 h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(44,24,11,0.14)_0%,rgba(44,24,11,0.24)_35%,rgba(44,24,11,0.62)_100%)]" />

          <div className="absolute inset-x-0 bottom-0 p-10 text-white xl:p-14">
            <h2 className="max-w-[420px] text-[46px] font-bold leading-[0.98] tracking-[-0.03em]">
              {isLogin ? 'Welcome back to the community' : 'Start your journey with us'}
            </h2>
            <p className="mt-7 max-w-[480px] text-[29px] leading-[1.18] text-white/92">
              {isLogin
                ? 'Access your dashboard, manage your contributions, and stay connected with the impact you create.'
                : 'Join a global network of donors and organizations dedicated to making a real difference.'}
            </p>
          </div>
        </aside>

        <section className="flex min-h-screen items-center justify-center bg-[#fffdf8] px-6 py-10 sm:px-10 lg:px-14 xl:px-20">
          <div className="w-full max-w-[650px]">{children}</div>
        </section>
      </motion.div>
    </div>
  );
}
