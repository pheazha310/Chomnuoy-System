/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Circle,
} from 'lucide-react';

export default function RegisterPage({ onToggleMode }) {
  const [role, setRole] = useState('Donor');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });

  const passwordRequirements = {
    length: formData.password.length >= 8,
    special: /[0-9!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };

  const handleRegister = (e) => {
    e.preventDefault();
    console.log('Registering:', { role, ...formData });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <div className="text-center lg:pt-4">
        <h1 className="text-4xl font-bold tracking-tight text-[#101828]">Register</h1>
        <p className="mt-2.5 text-base font-medium text-[#4B617A]">Join the Chomnuoy community today</p>
      </div>

      <div className="mt-8">
        <p className="text-center text-sm font-bold text-[#101828]">I am joining as a...</p>
        <div className="mt-3 grid grid-cols-2 rounded-2xl bg-[#ECEFF3] p-1.5">
          {['Donor', 'Organization'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`rounded-xl py-2.5 text-sm font-semibold transition ${
                role === r ? 'bg-white text-[#101828] shadow-sm' : 'text-[#667085] hover:text-[#344054]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleRegister} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-bold text-[#101828]">Full Name</label>
          <div className="relative mt-2">
            <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              className="block h-12 w-full rounded-2xl border border-[#D0D5DD] bg-white pl-12 pr-4 text-base text-[#101828] placeholder:text-[#98A2B3] focus:border-[#2563EB] focus:outline-none"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-[#101828]">Email Address</label>
          <div className="relative mt-2">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />
            <input
              type="email"
              required
              placeholder="name@company.com"
              className="block h-12 w-full rounded-2xl border border-[#D0D5DD] bg-white pl-12 pr-4 text-base text-[#101828] placeholder:text-[#98A2B3] focus:border-[#2563EB] focus:outline-none"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-[#101828]">Password</label>
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
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#667085]"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            {passwordRequirements.length ? <CheckCircle2 className="h-4 w-4 text-[#2563EB]" /> : <Circle className="h-4 w-4 text-[#D0D5DD]" />}
            <span className={passwordRequirements.length ? 'text-[#667085]' : 'text-[#98A2B3]'}>Minimum 8 characters</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            {passwordRequirements.special ? <CheckCircle2 className="h-4 w-4 text-[#2563EB]" /> : <Circle className="h-4 w-4 text-[#D0D5DD]" />}
            <span className={passwordRequirements.special ? 'text-[#667085]' : 'text-[#98A2B3]'}>At least one number or symbol</span>
          </div>
        </div>

        <button
          type="submit"
          className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-xl font-bold text-white shadow-[0_10px_24px_rgba(37,99,235,0.35)] transition hover:bg-[#1D4ED8]"
        >
          Register
          <ArrowRight className="h-5 w-5" />
        </button>
      </form>

      <p className="mt-6 text-center text-base font-medium text-[#4B617A]">
        Already have an account?{' '}
        <button onClick={onToggleMode} className="font-bold text-[#2563EB] hover:text-[#1D4ED8]">
          Login now
        </button>
      </p>

      <p className="mt-7 text-center text-xs text-[#98A2B3]">
        By signing up, you agree to our{' '}
        <a href="#" className="underline hover:text-[#667085]">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="#" className="underline hover:text-[#667085]">
          Privacy Policy
        </a>
        .
      </p>
    </motion.div>
  );
}

