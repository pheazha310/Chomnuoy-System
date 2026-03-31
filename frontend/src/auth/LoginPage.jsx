/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { loginUser, loginWithGoogleCredential } from "../services/user-service";
import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import GoogleSignInButton from "./GoogleSignInButton";

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

export default function LoginPage({ onToggleMode, onLoginSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const [providerStatus, setProviderStatus] = useState({
    google: Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID),
  });
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
  const googleSignInEnabled =
    String(import.meta.env.VITE_ENABLE_GOOGLE_SIGN_IN ?? "false").toLowerCase() === "true" &&
    Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });

  useEffect(() => {
    let active = true;

    fetch(`${apiBaseUrl}/api/auth/providers/status`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!active || !data?.providers) return;
        setProviderStatus({
          google: googleSignInEnabled || Boolean(data.providers.google?.configured),
        });
      })
      .catch(() => {
        if (!active) return;
        setProviderStatus({
          google: googleSignInEnabled,
        });
      });

    return () => {
      active = false;
    };
  }, [apiBaseUrl]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({ email: "", password: "" });
    setIsSubmitting(true);

    try {
      const data = await loginUser({
        email: formData.email,
        password: formData.password,
      });

      onLoginSuccess?.(data);
    } catch (err) {
      const errors = err.response?.data?.errors || {};
      const firstErrorMessage =
        errors.email?.[0] ||
        errors.password?.[0] ||
        err.response?.data?.message ||
        (err.request
          ? "Unable to connect to the server. Please check that backend is running."
          : "Login failed");

      setFieldErrors({
        email: errors.email?.[0] || "",
        password: errors.password?.[0] || "",
      });
      setError(firstErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleCredential = async (credentialResponse) => {
    const credential = credentialResponse?.credential;
    if (!credential) {
      setError("Google login did not return a credential. Please try again.");
      return;
    }

    setError(null);
    setSocialLoading("google");

    try {
      const data = await loginWithGoogleCredential(credential);
      onLoginSuccess?.(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Google login failed. Please try again."
      );
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="text-center lg:pt-4">
        <h1 className="text-4xl font-bold tracking-tight text-[#101828]">
          Welcome back
        </h1>
        <p className="mt-2.5 text-base font-medium text-[#4B617A]">
          Login to your Chomnuoy account to continue
        </p>
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

      {!providerStatus.google && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-700"
        >
          Google login is not available yet. Please check the app configuration.
        </motion.div>
      )}

      <form onSubmit={handleLogin} className="mt-6 space-y-4">
        <div>
          <label className="text-lg font-bold text-[#101828]">
            Email Address
          </label>
          <div className="relative mt-2">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />
            <input
              type="email"
              required
              placeholder="Email"
              className="block h-12 w-full rounded-2xl border border-[#D0D5DD] bg-white pl-12 pr-4 text-base text-[#101828] placeholder:text-[#98A2B3] focus:border-[#2563EB] focus:outline-none"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />

            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-lg font-bold text-[#101828]">Password</label>
            <a
              href="#"
              className="text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8]"
            >
              Forgot Password?
            </a>
          </div>
          <div className="relative mt-2">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="********"
              className="block h-12 w-full rounded-2xl border border-[#D0D5DD] bg-white pl-12 pr-12 text-base text-[#101828] placeholder:text-[#98A2B3] focus:border-[#2563EB] focus:outline-none"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />

            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.password}
              </p>
            )}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#667085]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <Eye className="h-5 w-5" />
              ) : (
                <EyeOff className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="rememberMe"
            className="h-4 w-4 rounded-md border-[#98A2B3] text-[#2563EB] focus:ring-[#2563EB]/20"
            checked={formData.rememberMe}
            onChange={(e) =>
              setFormData({ ...formData, rememberMe: e.target.checked })
            }
          />
          <label
            htmlFor="rememberMe"
            className="text-lg font-bold text-[#101828]"
          >
            Remember Me
          </label>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#E4E7EC]" />
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
            or continue with Google
          </span>
          <span className="h-px flex-1 bg-[#E4E7EC]" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3">
          {providerStatus.google ? (
            <div className="rounded-[28px] border border-[#D9E2F2] bg-[linear-gradient(180deg,#F8FBFF_0%,#EEF4FF_100%)] p-3 shadow-[0_14px_34px_rgba(37,99,235,0.08)]">
              <div className="flex items-center justify-between rounded-[22px] border border-white/80 bg-white/90 px-4 py-3 backdrop-blur">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7C8DA6]">
                    Quick Access
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#101828]">
                    Sign in with your Google account
                  </p>
                </div>
                <div className="shrink-0">
                  <GoogleSignInButton
                    onSuccess={handleGoogleCredential}
                    onError={() => setError("Google login could not be started. Please try again.")}
                    theme="outline"
                    size="large"
                    shape="pill"
                    text="signin_with"
                    width="260"
                  />
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled
              className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-[#101828] transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleIcon className="h-5 w-5" />
              Google unavailable
            </button>
          )}
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
        Don&apos;t have an account?{" "}
        <button
          onClick={onToggleMode}
          className="font-bold text-[#2563EB] hover:text-[#1D4ED8]"
        >
          Register now
        </button>
      </p>
    </motion.div>
  );
}
