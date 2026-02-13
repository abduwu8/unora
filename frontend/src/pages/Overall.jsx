import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiAdjustmentsHorizontal } from 'react-icons/hi2';
import { apiFetch } from '../apiClient';

const Overall = () => {
  const [form, setForm] = useState({ university: '', country: '' });
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = form.university.trim() && form.country.trim();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.university.trim() || !form.country.trim()) {
      setError('Please enter both university and country.');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await apiFetch('/api/overall-insight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          university: form.university,
          country: form.country,
        }),
      });

      if (!response.ok) {
        throw new Error('Something broke on our side. Please try again later.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Something broke on our side. Please try again later.');
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
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10 md:px-8 md:py-16">
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
            one-look verdict (india)
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900">
            Is this uni worth it
            <span className="block text-amber-600">for an Indian applicant?</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm md:text-base text-gray-700">
            Type a university and country once. We&apos;ll crunch Reddit reviews and rough
            cost-of-study to give you a single, straight answer.
          </p>
        </motion.header>

        <motion.section className="space-y-8" variants={itemVariants}>
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-5 md:px-6 md:py-6 shadow-sm"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs font-medium text-gray-700">
                University name
                <input
                  type="text"
                  name="university"
                  value={form.university}
                  onChange={handleChange}
                  placeholder="e.g. University of Glasgow"
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white py-2.5 px-3 text-sm outline-none focus:border-gray-800 focus:ring-2 focus:ring-gray-200"
                />
              </label>
              <label className="text-xs font-medium text-gray-700">
                Country
                <input
                  type="text"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  placeholder="e.g. United Kingdom, Canada"
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white py-2.5 px-3 text-sm outline-none focus:border-gray-800 focus:ring-2 focus:ring-gray-200"
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-gray-900 text-white text-xs md:text-sm font-semibold px-5 py-2.5 shadow-md hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isLoading || !canSubmit}
            >
              {isLoading ? (
                <>
                  <span className="inline-flex h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Thinking…</span>
                </>
              ) : (
                <>
                  <HiAdjustmentsHorizontal className="h-4 w-4" />
                  <span>One-line verdict</span>
                </>
              )}
            </button>

            {error && (
              <p className="mt-2 text-xs text-red-600">
                {error}
              </p>
            )}
          </form>

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <span className="inline-flex h-4 w-4 rounded-full border-[1.5px] border-gray-400 border-t-transparent animate-spin" />
              <span>Pulling reviews and rough cost info…</span>
            </div>
          )}

          {result && !isLoading && (
            <motion.div
              className="space-y-4 rounded-2xl border border-gray-100 bg-white px-5 py-5 md:px-6 md:py-6 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex flex-col gap-1">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                  quick context
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {result.university || form.university} · {result.country || form.country}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3 text-sm text-gray-900">
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
                    worth it?
                  </p>
                  <p>{result.isWorthItVerdict}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
                    reddit mood
                  </p>
                  <p>{result.reviewMood}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
                    rough yearly cost (₹)
                  </p>
                  <p>{result.yearlyCostInr || result.yearlyCostInInr || '—'}</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] text-xs md:text-sm">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500 mb-1">
                    difficulty level
                  </p>
                  <p className="text-gray-900">
                    {result.difficultyLevel}
                  </p>
                </div>
                {Array.isArray(result.quickNotes) && result.quickNotes.length > 0 && (
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500 mb-1">
                      quick notes
                    </p>
                    <ul className="space-y-1 text-gray-800">
                      {result.quickNotes.map((note, idx) => (
                        <li key={idx}>• {note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {Array.isArray(result.sources) && result.sources.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500 mb-1">
                    check raw sources
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.sources.map((s, idx) => (
                      <a
                        key={`${s.url}-${idx}`}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1.5 text-xs md:text-sm text-gray-800 hover:border-gray-400 hover:bg-gray-50 transition"
                      >
                        {s.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.section>
      </div>
    </motion.div>
  );
};

export default Overall;

