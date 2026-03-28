/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getCategories, registerUser } from "../services/user-service";
import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  DEFAULT_MAP_CENTER,
  getCurrentCoordinates,
} from "../utils/geolocation";
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Circle,
} from "lucide-react";

export default function RegisterPage({ onToggleMode }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [categories, setCategories] = useState([]);
  const [role, setRole] = useState("Donor");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    password: "",
    organizationName: "",
    categoryId: "",
    categoryNameNew: "",
    location: "",
    latitude: "",
    longitude: "",
    description: "",
  });

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (role === "Organization") {
      loadCategories();
    }
  }, [role]);

  const updateOrganizationLocation = (coords) => {
    setFormData((current) => ({
      ...current,
      location: `${coords.latitude}, ${coords.longitude}`,
      latitude: String(coords.latitude),
      longitude: String(coords.longitude),
    }));
  };

  const captureLocation = async ({ useFallback = false } = {}) => {
    if (role !== 'Organization') {
      return;
    }

    setIsLocating(true);
    setLocationError('');

    try {
      const coords = await getCurrentCoordinates();
      updateOrganizationLocation(coords);
    } catch (err) {
      if (useFallback) {
        updateOrganizationLocation(DEFAULT_MAP_CENTER);
      }
      setLocationError(err.message || 'Unable to get your current location.');
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    if (role === 'Organization' && !formData.latitude && !formData.longitude) {
      captureLocation();
    }
  }, [role]);

  const passwordRequirements = {
    length: formData.password.length >= 8,
    special: /[0-9!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };

  const hasCoordinates =
    formData.latitude !== "" &&
    formData.longitude !== "" &&
    Number.isFinite(Number(formData.latitude)) &&
    Number.isFinite(Number(formData.longitude));

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported on this device.");
      return;
    }

    setLocationLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setLocationLoading(false);
      },
      (geoError) => {
        setLocationError(geoError?.message || "Unable to detect your location.");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await registerUser({
        name: role === "Donor" ? formData.fullName : null,
        phone: role === "Donor" ? formData.phoneNumber : null,
        email: formData.email,
        password: formData.password,
        role,
        organization:
          role === "Organization"
            ? {
                name: formData.organizationName,
                category_id: formData.categoryId
                  ? Number(formData.categoryId)
                  : null,
                category_name_new: formData.categoryNameNew?.trim() || null,
                location: formData.location,
                latitude: formData.latitude ? Number(formData.latitude) : null,
                longitude: formData.longitude ? Number(formData.longitude) : null,
                description: formData.description,
              }
            : null,
      });

      onToggleMode(formData.email);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
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
          Register
        </h1>
        <p className="mt-2.5 text-base font-medium text-[#4B617A]">
          Join the Chomnuoy community today
        </p>
      </div>

      <div className="mt-8">
        <p className="text-center text-sm font-bold text-[#101828]">
          I am joining as a...
        </p>
        <div className="mt-3 grid grid-cols-2 rounded-2xl bg-[#ECEFF3] p-1.5">
          {["Donor", "Organization"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`rounded-xl py-2.5 text-sm font-semibold transition ${
                role === r
                  ? "bg-white text-[#101828] shadow-sm"
                  : "text-[#667085] hover:text-[#344054]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleRegister} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {role === "Organization" && (
          <>
            <div>
              <label className="text-sm font-bold text-[#101828]">
                Organization Name
              </label>
              <div className="relative mt-2">
                <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />
                <input
                  type="text"
                  required
                  placeholder="Enter your organization name"
                  className="block h-12 w-full rounded-2xl border border-[#D0D5DD] bg-white pl-12 pr-4 text-base text-[#101828] placeholder:text-[#98A2B3] focus:border-[#2563EB] focus:outline-none"
                  value={formData.organizationName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      organizationName: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#101828]">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewCategory((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
                >
                  {showNewCategory
                    ? "Use Existing Category"
                    : "Create New Category"}
                </button>
              </div>
              <div className="relative mt-2">
                <select
                  required={!showNewCategory}
                  className="block h-12 w-full rounded-2xl border border-[#D0D5DD] bg-white px-4 text-base text-[#101828] focus:border-[#2563EB] focus:outline-none"
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  onFocus={loadCategories}
                  disabled={showNewCategory}
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.category_name}
                    </option>
                  ))}
                </select>
              </div>
              {showNewCategory && (
                <div className="relative mt-2">
                  <input
                    type="text"
                    required
                    placeholder="Enter new category name"
                    className="block h-12 w-full rounded-2xl border border-[#D0D5DD] bg-white px-4 text-base text-[#101828] placeholder:text-[#98A2B3] focus:border-[#2563EB] focus:outline-none"
                    value={formData.categoryNameNew}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        categoryNameNew: e.target.value,
                        categoryId: "",
                      })
                    }
                  />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-bold text-[#101828]">Current Location</label>
                <button
                  type="button"
                  onClick={() => captureLocation({ useFallback: true })}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] disabled:opacity-60"
                  disabled={isLocating}
                >
                  {isLocating ? 'Detecting...' : 'Refresh Location'}
                </button>
              </div>
              <div className="mt-2 rounded-2xl border border-[#D0D5DD] bg-[#F8FAFC] px-4 py-3 text-sm text-[#344054]">
                {formData.latitude && formData.longitude ? (
                  <>
                    <p><strong>Latitude:</strong> {formData.latitude}</p>
                    <p><strong>Longitude:</strong> {formData.longitude}</p>
                  </>
                ) : (
                  <p>We will try to collect your location automatically from your device.</p>
                )}
              </div>
              {locationError && (
                <p className="mt-2 text-xs font-medium text-amber-600">
                  {locationError}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-bold text-[#101828]">Description</label>
              <div className="relative mt-2">
                <textarea
                  rows={3}
                  placeholder="Tell us about your organization"
                  className="block w-full rounded-2xl border border-[#D0D5DD] bg-white px-4 py-3 text-base text-[#101828] placeholder:text-[#98A2B3] focus:border-[#2563EB] focus:outline-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </>
        )}

        {role === "Donor" && (
          <>
            <div>
              <label className="text-sm font-bold text-[#101828]">
                Full Name
              </label>
              <div className="relative mt-2">
                <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="block h-12 w-full rounded-2xl border border-[#D0D5DD] bg-white pl-12 pr-4 text-base text-[#101828] placeholder:text-[#98A2B3] focus:border-[#2563EB] focus:outline-none"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-[#101828]">
                Phone Number
              </label>
              <div className="relative mt-2">
                <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />
                <input
                  type="tel"
                  required
                  placeholder="Enter your phone number"
                  className="block h-12 w-full rounded-2xl border border-[#D0D5DD] bg-white pl-12 pr-4 text-base text-[#101828] placeholder:text-[#98A2B3] focus:border-[#2563EB] focus:outline-none"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="text-sm font-bold text-[#101828]">
            Email Address
          </label>
          <div className="relative mt-2">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />
            <input
              type="email"
              required
              placeholder="name@company.com"
              className="block h-12 w-full rounded-2xl border border-[#D0D5DD] bg-white pl-12 pr-4 text-base text-[#101828] placeholder:text-[#98A2B3] focus:border-[#2563EB] focus:outline-none"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-[#101828]">Password</label>
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

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            {passwordRequirements.length ? (
              <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />
            ) : (
              <Circle className="h-4 w-4 text-[#D0D5DD]" />
            )}
            <span
              className={
                passwordRequirements.length
                  ? "text-[#667085]"
                  : "text-[#98A2B3]"
              }
            >
              Minimum 8 characters
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            {passwordRequirements.special ? (
              <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />
            ) : (
              <Circle className="h-4 w-4 text-[#D0D5DD]" />
            )}
            <span
              className={
                passwordRequirements.special
                  ? "text-[#667085]"
                  : "text-[#98A2B3]"
              }
            >
              At least one number or symbol
            </span>
          </div>
        </div>

        {role === "Organization" && (
          <>
            <div>
              <label className="text-sm font-bold text-[#101828]">
                Location
              </label>
              <div className="relative mt-2 space-y-3">
                <input
                  type="text"
                  placeholder="City / Address"
                  className="block h-12 w-full rounded-2xl border border-[#D0D5DD] bg-white px-4 text-base text-[#101828] placeholder:text-[#98A2B3] focus:border-[#2563EB] focus:outline-none"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
                <div className="rounded-3xl border border-[#D9E5F7] bg-gradient-to-br from-[#F8FBFF] to-white p-3.5 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#101828]">
                        Map Coordinates
                      </p>
                      <p className="mt-1 text-xs font-medium leading-5 text-[#667085]">
                        Use lat/lng for more precise map placement.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={detectLocation}
                      className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-2xl border border-[#BFDBFE] bg-white px-3.5 text-sm font-semibold text-[#2563EB] shadow-[0_8px_18px_rgba(37,99,235,0.12)] transition hover:-translate-y-0.5 hover:border-[#93C5FD] hover:text-[#1D4ED8]"
                    >
                      {locationLoading ? "Detecting..." : "Use Current"}
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#667085]">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        placeholder="11.5564"
                        className="mt-1.5 block h-11 w-full rounded-2xl border border-[#D0DDF0] bg-white px-4 text-base text-[#101828] placeholder:text-[#98A2B3] focus:border-[#2563EB] focus:outline-none"
                        value={formData.latitude}
                        onChange={(e) =>
                          setFormData({ ...formData, latitude: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#667085]">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        placeholder="104.9282"
                        className="mt-1.5 block h-11 w-full rounded-2xl border border-[#D0DDF0] bg-white px-4 text-base text-[#101828] placeholder:text-[#98A2B3] focus:border-[#2563EB] focus:outline-none"
                        value={formData.longitude}
                        onChange={(e) =>
                          setFormData({ ...formData, longitude: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-3 overflow-hidden rounded-3xl border border-[#DCE6F5] bg-white">
                    {hasCoordinates ? (
                      <>
                        <iframe
                          title="Registration location map preview"
                          src={`https://maps.google.com/maps?q=${formData.latitude},${formData.longitude}&z=15&output=embed`}
                          className="h-44 w-full border-0"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                        <div className="flex flex-col gap-2 border-t border-[#E4ECF7] px-4 py-3 text-xs font-medium text-[#667085] sm:flex-row sm:items-center sm:justify-between">
                          <span>
                            Lat {Number(formData.latitude).toFixed(5)}, Lng{" "}
                            {Number(formData.longitude).toFixed(5)}
                          </span>
                          <a
                            href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold text-[#2563EB] hover:text-[#1D4ED8]"
                          >
                            Open in Google Maps
                          </a>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-40 items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_42%),linear-gradient(180deg,_#F8FBFF_0%,_#FFFFFF_100%)] px-6 text-center text-sm font-medium text-[#98A2B3]">
                        Add coordinates to preview the map.
                      </div>
                    )}
                  </div>

                  {locationError ? (
                    <p className="mt-3 text-sm font-medium text-red-600">
                      {locationError}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-[#101828]">
                Description
              </label>
              <div className="relative mt-2">
                <textarea
                  rows={3}
                  placeholder="Tell us about your organization"
                  className="block w-full rounded-2xl border border-[#D0D5DD] bg-white px-4 py-3 text-base text-[#101828] placeholder:text-[#98A2B3] focus:border-[#2563EB] focus:outline-none"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
            </div>
          </>
        )}

        <button
          type="submit"
          className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-xl font-bold text-white shadow-[0_10px_24px_rgba(37,99,235,0.35)] transition hover:bg-[#1D4ED8]"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Registering...
            </>
          ) : (
            <>
              Register
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-base font-medium text-[#4B617A]">
        Already have an account?{" "}
        <button
          onClick={onToggleMode}
          className="font-bold text-[#2563EB] hover:text-[#1D4ED8]"
        >
          Login now
        </button>
      </p>

      <p className="mt-7 text-center text-xs text-[#98A2B3]">
        By signing up, you agree to our{" "}
        <a href="#" className="underline hover:text-[#667085]">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="underline hover:text-[#667085]">
          Privacy Policy
        </a>
        .
      </p>
    </motion.div>
  );
}
