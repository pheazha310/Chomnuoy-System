/**
* @license
* SPDX-License-Identifier: Apache-2.0
*/

import { loginUser } from '../services/user-service';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4a4.6 4.6 0 0 1-2 3.1l3.2 2.5c1.8-1.7 2.9-4.1 2.9-7.1 0-.7-.1-1.5-.2-2.2H12z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.6 0 4.9-.9 6.5-2.4l-3.2-2.5c-.9.6-2 .9-3.3.9-2.6 0-4.8-1.7-5.5-4.1H3.2v2.6A10 10 0 0 0 12 22z"
      />
      <path
        fill="#FBBC05"
        d="M6.5 13.9A6 6 0 0 1 6.2 12c0-.7.1-1.3.3-1.9V7.5H3.2A10 10 0 0 0 2 12c0 1.6.4 3.1 1.2 4.5l3.3-2.6z"
      />
      <path
        fill="#4285F4"
        d="M12 6c1.4 0 2.7.5 3.8 1.5l2.8-2.8A9.8 9.8 0 0 0 12 2 10 10 0 0 0 3.2 7.5l3.3 2.6C7.2 7.7 9.4 6 12 6z"
      />
    </svg>
  );
}

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#1877F2"
        d="M24 12a12 12 0 1 0-13.9 11.8v-8.3H7.1V12h3V9.3c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v2.9h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.3A12 12 0 0 0 24 12z"
      />
    </svg>
  );
}

export default function LoginPage({ onToggleMode, onLoginSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const socialAuthUrls = {
    google:
      import.meta.env.VITE_GOOGLE_AUTH_URL ??
      `${import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'}/api/auth/google/redirect`,
    facebook:
      import.meta.env.VITE_FACEBOOK_AUTH_URL ??
      `${import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'}/api/auth/facebook/redirect`,
  };

  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({ email: '', password: '' });
    setIsSubmitting(true);

    try {
      const data = await loginUser({
        email: formData.email,
        password: formData.password,
      });

      onLoginSuccess?.(data);
    } catch (err) {
      const errors = err.response?.data?.errors || {};
      setFieldErrors({
        email: errors.email?.[0] || '',
        password: errors.password?.[0] || '',
      });
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = (provider) => {
    const authUrl = socialAuthUrls[provider];
    if (!authUrl) {
      setError(`Unable to start ${provider} login. Please try again later.`);
      return;
    }

    setError(null);
    setSocialLoading(provider);
    window.location.assign(authUrl);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <div className="text-center lg:pt-4">
        <h1 className="text-4xl font-bold tracking-tight text-[#101828]">Welcome back</h1>
        <p className="mt-2.5 text-base font-medium text-[#4B617A]">Login to your Chomnuoy account to continue</p>
      </div>


      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        </motion.div>
      )}

      <form onSubmit={handleLogin} className="mt-6 space-y-4">
        <div>
          <label className="text-lg font-bold text-[#101828]">Email Address</label>
          <div className="relative mt-2">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />
            <input
              type="email"
              required
              placeholder="Email"
              className="block h-12 w-full rounded-2xl border border-[#D0D5DD] bg-white pl-12 pr-4 text-base text-[#101828] placeholder:text-[#98A2B3] focus:border-[#2563EB] focus:outline-none"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-lg font-bold text-[#101828]">Password</label>
            <a href="#" className="text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8]">
              Forgot Password?
            </a>
          </div>
          <div className="relative mt-2">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="********"
              className="block h-12 w-full rounded-2xl border border-[#D0D5DD] bg-white pl-12 pr-12 text-base text-[#101828] placeholder:text-[#98A2B3] focus:border-[#2563EB] focus:outline-none"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
            )}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#667085]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="rememberMe"
            className="h-4 w-4 rounded-md border-[#98A2B3] text-[#2563EB] focus:ring-[#2563EB]/20"
            checked={formData.rememberMe}
            onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
          />
          <label htmlFor="rememberMe" className="text-lg font-bold text-[#101828]">
            Remember Me
          </label>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#E4E7EC]" />
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">or login with email</span>
          <span className="h-px flex-1 bg-[#E4E7EC]" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleSocialLogin('google')}
            disabled={socialLoading !== null}
            className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-[#101828] transition hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleIcon className="h-5 w-5" />
            Gmail
          </button>
          <button
            type="button"
            onClick={() => handleSocialLogin('facebook')}
            disabled={socialLoading !== null}
            className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-[#101828] transition hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FacebookIcon className="h-5 w-5" />
            Facebook
          </button>
        </div>
        <button
          type="submit"
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-xl font-bold text-white shadow-[0_10px_24px_rgba(37,99,235,0.35)] transition hover:bg-[#1D4ED8]"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Logging in...
            </>
          ) : (
            <>
              Login
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-base font-medium text-[#4B617A]">
        Don&apos;t have an account?{' '}
        <button onClick={onToggleMode} className="font-bold text-[#2563EB] hover:text-[#1D4ED8]">
          Register now
        </button>
      </p>
    </motion.div>
  );
}
