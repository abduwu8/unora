import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiSparkles } from 'react-icons/hi2';
import { apiFetch } from '../apiClient';
import { getApiErrorMessage } from '../utils/apiError';
import { formatCachedAt } from '../utils/formatCachedAt';

const Universities = () => {
  const [customName, setCustomName] = useState('');
  const [country, setCountry] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  const canSubmit = customName.trim().length > 0;

  // Load search history from localStorage on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('unihandle_university_history');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch {
      // ignore parse errors and start fresh
    }
  }, []);

  const persistHistory = (items) => {
    setHistory(items);
    try {
      window.localStorage.setItem('unihandle_university_history', JSON.stringify(items));
    } catch {
      // ignore storage errors (e.g. private mode)
    }
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    if (!customName.trim()) {
      setError('Please enter a university name before analyzing reviews.');
      return;
    }

    setIsLoading(true);
    setError('');
    setAiResult(null);

    try {
      const response = await apiFetch('/api/university-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        name: customName.trim(),
        ...(country.trim() && { country: country.trim() }),
      }),
      });

      if (!response.ok) {
        throw new Error('Failed to reach scoring API');
      }

      const data = await response.json();
      setAiResult(data);

      // Update local history with this university
      const displayName = data?.name || customName.trim();
      const displayCountry = data?.country || country.trim() || null;
      if (displayName) {
        const key = (n, c) => `${n.toLowerCase()}-${(c || '').toLowerCase()}`;
        const existingWithoutCurrent = history.filter(
          (item) => key(item.name, item.country) !== key(displayName, displayCountry)
        );
        const next = [
          { name: displayName, country: displayCountry || undefined, viewedAt: Date.now() },
          ...existingWithoutCurrent,
        ].slice(0, 8); // keep last 8
        persistHistory(next);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
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
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-10 md:px-8 md:py-16">
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
            universities
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900">
            Real student reviews,
            <span className="block text-amber-600">summarised for you.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm md:text-base text-gray-700">
            Type a university name and country below and we&apos;ll scan real Reddit-style
            threads, then summarise what students are actually saying into a
            simple score with pros and cons.
          </p>
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs md:text-sm text-amber-900/90">
            <strong>Notice:</strong> Our AI is still being trained and may not always be accurate. Sometimes it can return empty or missing data. Information can be incomplete or out of date. Please double-check with official university sources.
          </div>
        </motion.header>

        {/* Custom university evaluation with Groq */}
        <motion.section className="space-y-6" variants={itemVariants}>
          <form
            onSubmit={handleEvaluate}
            className="flex flex-col gap-3"
          >
            <div className="grid gap-3 md:grid-cols-2 md:items-end">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1.5 uppercase tracking-[0.18em]">
                  university name
                </label>
                <input
                  type="text"
                  placeholder="e.g. University of Glasgow"
                  className="w-full rounded-full border border-gray-200 bg-white py-3 px-4 text-sm md:text-base outline-none shadow-sm focus:border-gray-700 focus:ring-2 focus:ring-gray-200 transition"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1.5 uppercase tracking-[0.18em]">
                  country
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scotland, UK, Germany"
                  className="w-full rounded-full border border-gray-200 bg-white py-3 px-4 text-sm md:text-base outline-none shadow-sm focus:border-gray-700 focus:ring-2 focus:ring-gray-200 transition"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-gray-900 text-white px-4 md:px-5 py-2.5 md:py-3 shadow-md hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isLoading || !canSubmit}
                aria-label={isLoading ? 'Analysing reviews' : 'Rate with AI'}
              >
                <HiSparkles className="h-5 w-5" />
              </button>
            </div>
          </form>

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <span className="inline-flex h-4 w-4 rounded-full border-[1.5px] border-gray-400 border-t-transparent animate-spin" />
              <span>Estimating sentiment from recent Reddit-style reviews…</span>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600">
              {error}
            </p>
          )}

          {aiResult && !error && (
            <div className="space-y-4 md:space-y-5">
              {formatCachedAt(aiResult.cachedAt) && (
                <p className="text-xs text-gray-500">
                  {formatCachedAt(aiResult.cachedAt)}
                </p>
              )}
              <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-1">
                    estimated rating
                  </p>
                  <div className="inline-flex items-baseline gap-1.5 rounded-xl bg-white px-4 py-3 shadow-sm border border-gray-100">
                    <span className="text-3xl font-semibold text-gray-900">
                      {aiResult.rating}
                    </span>
                    <span className="text-sm text-gray-500">/ 10</span>
                  </div>
                  <p className="mt-3 text-xs md:text-sm text-gray-600">
                    This score is an AI estimate, summarising real Reddit threads and similar online discussions – not an official ranking.
                  </p>
                </div>

                <div className="text-sm md:text-base text-gray-800 space-y-3 md:space-y-4">
                  <p className="font-semibold text-lg text-gray-900">
                    {aiResult.name || customName}
                    {aiResult.country && (
                      <span className="font-normal text-gray-600"> · {aiResult.country}</span>
                    )}
                  </p>
                  <p>
                    {aiResult.summary}
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="font-semibold text-sm md:text-base text-emerald-700 mb-2">
                        Pros from students
                      </p>
                      <ul className="space-y-1.5">
                        {(aiResult.pros || []).map((item, idx) => (
                          <li key={idx} className="leading-snug">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-sm md:text-base text-rose-700 mb-2">
                        Cons from students
                      </p>
                      <ul className="space-y-1.5">
                        {(aiResult.cons || []).map((item, idx) => (
                          <li key={idx} className="leading-snug">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </motion.section>

        {/* History of recently checked universities */}
        {history.length > 0 && (
          <motion.section
            className="mt-10 pt-8 border-t border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-sm font-semibold text-gray-900 mb-2">
              Recently checked universities
            </h2>
            <p className="text-xs text-gray-600 mb-3">
              Jump straight to official information for places you&apos;ve already evaluated.
            </p>
            <div className="flex flex-wrap gap-2">
              {history.map((item) => {
                const label = item.country ? `${item.name} · ${item.country}` : item.name;
                const officialSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
                  `${item.name} official university website`
                )}`;
                return (
                  <a
                    key={item.viewedAt + (item.country || '') + item.name}
                    href={officialSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1.5 text-xs md:text-sm text-gray-800 hover:border-gray-400 hover:bg-gray-50 transition"
                  >
                    <span className="truncate max-w-[10rem] md:max-w-[14rem]">
                      {label}
                    </span>
                    <span className="ml-2 text-[11px] text-gray-500 shrink-0">
                      official site
                    </span>
                  </a>
                );
              })}
            </div>
          </motion.section>
        )}
      </div>
    </motion.div>
  );
};

export default Universities;

