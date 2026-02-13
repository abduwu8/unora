import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiFetch } from '../apiClient';

const initialForm = {
  cgpa: '',
  degree: '',
  ielts: '',
  budget: '',
  countryPreference: '',
  needScholarship: 'no',
  wantPr: 'no',
};

const Match = () => {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const canSubmit =
    form.cgpa.trim() &&
    form.degree.trim() &&
    form.ielts.trim() &&
    form.budget.trim() &&
    form.countryPreference.trim();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.cgpa.trim() ||
      !form.degree.trim() ||
      !form.ielts.trim() ||
      !form.budget.trim() ||
      !form.countryPreference.trim()
    ) {
      setError('Please fill in all the fields before matching universities.');
      return;
    }
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await apiFetch('/api/profile-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cgpa: form.cgpa,
          degree: form.degree,
          ielts: form.ielts,
          budget: form.budget,
          countryPreference: form.countryPreference,
          needScholarship: form.needScholarship === 'yes',
          wantPr: form.wantPr === 'yes',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get matched universities');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong while matching universities.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderBucket = (label, bucketKey, toneClass) => {
    const bucket = result?.[bucketKey]?.universities || [];
    if (!bucket.length) return null;

    return (
      <motion.section
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-2">
          <span className={`text-[11px] uppercase tracking-[0.25em] font-semibold ${toneClass}`}>
            {label}
          </span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {bucket.map((u, idx) => (
            <article
              key={`${u.name}-${idx}`}
              className="rounded-2xl border border-gray-100 bg-white/90 px-5 py-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm md:text-base font-semibold text-gray-900 truncate">
                    {u.name}
                  </p>
                  <p className="text-[11px] md:text-xs text-gray-500 mt-0.5">
                    {[u.city, u.country].filter(Boolean).join(', ')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/universities?name=${encodeURIComponent(u.name)}`)}
                  className="shrink-0 text-[11px] md:text-xs font-medium text-gray-900 border border-gray-300 rounded-full px-3 py-1 hover:bg-gray-900 hover:text-white transition"
                >
                  Reddit reviews
                </button>
              </div>
              {u.reason && (
                <p className="mt-2 text-xs md:text-sm text-gray-700 leading-snug">
                  {u.reason}
                </p>
              )}
            </article>
          ))}
        </div>
      </motion.section>
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.6, -0.05, 0.01, 0.99],
      },
    },
  };

  return (
    <motion.div
      className="min-h-screen w-full bg-white relative"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          backgroundImage: `
        radial-gradient(125% 125% at 50% 10%, #ffffff 40%, #f59e0b 100%)
      `,
          backgroundSize: '100% 100%',
        }}
      />
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10 md:px-10 md:py-16">
        <motion.div className="mb-4" variants={itemVariants}>
          <Link
            to="/"
            className="inline-flex items-center text-[11px] md:text-xs text-gray-500 hover:text-gray-900"
          >
            <span className="mr-1.5">←</span>
            back to home
          </Link>
        </motion.div>
        <motion.header className="mb-8" variants={itemVariants}>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-3">
            profile-based matching
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900">
            Find universities that fit
            <span className="block text-amber-600">your exact profile.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm md:text-base text-gray-700">
            Enter your academic profile once and we&apos;ll suggest a mix of safe, moderate,
            and ambitious universities. Then, in one click, you can scan real Reddit-style
            reviews for any option.
          </p>
        </motion.header>

        <motion.section className="space-y-10" variants={itemVariants}>
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-5 md:px-6 md:py-6 shadow-sm"
          >
            <div className="grid gap-3">
              <label className="text-xs font-medium text-gray-700">
                CGPA
                <input
                  type="text"
                  name="cgpa"
                  value={form.cgpa}
                  onChange={handleChange}
                  placeholder="e.g. 7.8 / 10"
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm outline-none focus:border-gray-800 focus:ring-2 focus:ring-gray-200"
                />
              </label>

              <label className="text-xs font-medium text-gray-700">
                Current / target degree
                <input
                  type="text"
                  name="degree"
                  value={form.degree}
                  onChange={handleChange}
                  placeholder="e.g. BCA, BSc CS, BBA..."
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm outline-none focus:border-gray-800 focus:ring-2 focus:ring-gray-200"
                />
              </label>

              <label className="text-xs font-medium text-gray-700">
                IELTS / English score
                <input
                  type="text"
                  name="ielts"
                  value={form.ielts}
                  onChange={handleChange}
                  placeholder="e.g. IELTS 7.0, Duolingo 120"
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm outline-none focus:border-gray-800 focus:ring-2 focus:ring-gray-200"
                />
              </label>

              <label className="text-xs font-medium text-gray-700">
                Total yearly budget (incl. tuition)
                <input
                  type="text"
                  name="budget"
                  value={form.budget}
                  onChange={handleChange}
                  placeholder="e.g. £18,000 per year"
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm outline-none focus:border-gray-800 focus:ring-2 focus:ring-gray-200"
                />
              </label>

              <label className="text-xs font-medium text-gray-700">
                Country preference
                <input
                  type="text"
                  name="countryPreference"
                  value={form.countryPreference}
                  onChange={handleChange}
                  placeholder="e.g. UK, Canada, Netherlands"
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm outline-none focus:border-gray-800 focus:ring-2 focus:ring-gray-200"
                />
              </label>

              <div className="grid grid-cols-2 gap-3 text-xs font-medium text-gray-700">
                <label>
                  Need scholarship?
                  <select
                    name="needScholarship"
                    value={form.needScholarship}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm outline-none focus:border-gray-800 focus:ring-2 focus:ring-gray-200"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </label>
                <label>
                  Prefer PR-friendly country?
                  <select
                    name="wantPr"
                    value={form.wantPr}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm outline-none focus:border-gray-800 focus:ring-2 focus:ring-gray-200"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center rounded-full bg-gray-900 text-white text-xs md:text-sm font-semibold px-6 py-2.5 shadow-md hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isLoading || !canSubmit}
            >
              {isLoading ? 'Finding matches…' : 'Match universities'}
            </button>

            {error && (
              <p className="mt-2 text-xs text-red-600">
                {error}
              </p>
            )}
          </form>

          {!result && !isLoading && (
            <p className="text-sm md:text-base text-gray-600">
              You&apos;ll see three sections below: safe options that are very realistic, moderate
              options that are competitive but achievable, and ambitious options that are more of
              a reach. For any university you like, click &quot;Reddit reviews&quot; to open the
              detailed sentiment breakdown page.
            </p>
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <span className="inline-flex h-4 w-4 rounded-full border-[1.5px] border-gray-400 border-t-transparent animate-spin" />
              <span>Analysing your profile and building shortlists…</span>
            </div>
          )}

          {result && !isLoading && (
            <div className="space-y-10">
              {renderBucket('Safe universities', 'safe', 'text-emerald-700')}
              {renderBucket('Moderate universities', 'moderate', 'text-amber-700')}
              {renderBucket('Ambitious universities', 'ambitious', 'text-rose-700')}
            </div>
          )}
        </motion.section>
      </div>
    </motion.div>
  );
};

export default Match;

