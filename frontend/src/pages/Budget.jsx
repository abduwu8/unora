import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const initialForm = {
  country: '',
  city: '',
};

const Budget = () => {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
   const [currency, setCurrency] = useState('USD'); // USD, EUR, INR

  const canSubmit = form.country.trim().length > 0;

  const convertUsdRange = (rangeStr, target) => {
    if (!rangeStr || typeof rangeStr !== 'string') return rangeStr || 'N/A';
    if (target === 'USD') {
      return rangeStr;
    }

    // Extract first two numbers in the string as a range
    const numbers = rangeStr
      .replace(/,/g, '')
      .match(/(\d+(\.\d+)?)/g);

    if (!numbers || numbers.length === 0) {
      return rangeStr;
    }

    const [minRaw, maxRaw] = numbers;
    const min = parseFloat(minRaw);
    const max = maxRaw ? parseFloat(maxRaw) : undefined;
    if (Number.isNaN(min)) return rangeStr;

    const rates = {
      USD: 1,
      EUR: 0.92,
      INR: 83,
    };

    const rate = rates[target] || 1;

    const format = (val) =>
      target === 'INR'
        ? Math.round(val * rate).toLocaleString('en-IN')
        : Math.round(val * rate).toLocaleString('en-US');

    if (max && !Number.isNaN(max) && max !== min) {
      return `${format(min)}–${format(max)} ${target}`;
    }

    return `${format(min)} ${target}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.country.trim()) {
      setError('Please enter a country to check your budget.');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('http://localhost:4000/api/budget-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          country: form.country,
          city: form.city,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get budget information');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong while fetching budget information.');
    } finally {
      setIsLoading(false);
    }
  };

  const sources = Array.isArray(result?.sources) ? result.sources : [];

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
        <motion.header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between" variants={itemVariants}>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-3">
              budget &amp; pre-arrival costs
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900">
              Know the real costs
              <span className="block text-amber-600">before you book your flight.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm md:text-base text-gray-700">
              Search by country (and city if you know it) to see an approximate breakdown of visa
              charges, mandatory insurance, flights, and monthly living costs. We also show you
              links to official sites and recent Reddit threads so you can double-check everything.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
              display currency
            </span>
            <div className="inline-flex rounded-full border border-gray-200 bg-white p-0.5">
              {['USD', 'EUR', 'INR'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={`px-3 py-1.5 text-[11px] rounded-full transition ${
                    currency === c
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </motion.header>

        <motion.section className="space-y-8" variants={itemVariants}>
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-5 md:px-6 md:py-6 shadow-sm"
          >
            <div className="grid gap-3 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <label className="text-xs font-medium text-gray-700">
                Country you&apos;re targeting
                <input
                  type="text"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  placeholder="e.g. United Kingdom, Canada, Germany"
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white py-2.5 px-3 text-sm outline-none focus:border-gray-800 focus:ring-2 focus:ring-gray-200"
                  required
                />
              </label>
              <label className="text-xs font-medium text-gray-700">
                City (optional, for more precise living costs)
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="e.g. London, Toronto, Berlin"
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white py-2.5 px-3 text-sm outline-none focus:border-gray-800 focus:ring-2 focus:ring-gray-200"
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-1 inline-flex items-center justify-center rounded-full bg-gray-900 text-white text-xs md:text-sm font-semibold px-6 py-2.5 shadow-md hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isLoading || !canSubmit}
            >
              {isLoading ? 'Calculating approximate costs…' : 'Check budget'}
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
              <span>Pulling together approximate fees and Reddit-based living costs…</span>
            </div>
          )}

          {result && !isLoading && (
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.section
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-sm font-semibold text-gray-900">
                  Visa &amp; mandatory fees
                </h2>
                <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
                    approximate student visa charges
                  </p>
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">Visa fee range (local): </span>
                    {result.visa?.feeRangeLocal || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">
                      Visa fee range ({currency}):
                      {' '}
                    </span>
                    {convertUsdRange(result.visa?.feeRangeUsd, currency)}
                  </p>
                  <p className="mt-2 text-sm text-gray-800">
                    <span className="font-medium">Health insurance / surcharge: </span>
                    {result.visa?.insuranceOrHealthCharge || 'N/A'}
                  </p>
                  {result.visa?.notes && (
                    <p className="mt-2 text-xs md:text-sm text-gray-700">
                      {result.visa.notes}
                    </p>
                  )}
                </div>
              </motion.section>

              <motion.section
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h2 className="text-sm font-semibold text-gray-900">
                  Pre-arrival costs (outside tuition)
                </h2>
                <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm space-y-2">
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">Accommodation deposit / first rent: </span>
                    {result.preArrival?.accommodationDeposit || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">
                      Typical one-way flight ({currency}):
                      {' '}
                    </span>
                    {convertUsdRange(result.preArrival?.flightRangeUsd, currency)}
                  </p>
                  {result.preArrival?.otherUpfrontCosts && (
                    <p className="text-xs md:text-sm text-gray-700">
                      {result.preArrival.otherUpfrontCosts}
                    </p>
                  )}
                </div>
              </motion.section>

              <motion.section
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h2 className="text-sm font-semibold text-gray-900">
                  Monthly living expenses (Reddit-informed estimate)
                </h2>
                <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm space-y-2">
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">Monthly range (local): </span>
                    {result.living?.monthlyRangeLocal || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">
                      Monthly range ({currency}):
                      {' '}
                    </span>
                    {convertUsdRange(result.living?.monthlyRangeUsd, currency)}
                  </p>
                  {Array.isArray(result.living?.drivers) && result.living.drivers.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-gray-700 mb-1">
                        What changes the budget:
                      </p>
                      <ul className="text-xs md:text-sm text-gray-700 space-y-1">
                        {result.living.drivers.map((d, idx) => (
                          <li key={idx}>• {d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.living?.redditSummary && (
                    <p className="mt-2 text-xs md:text-sm text-gray-700">
                      {result.living.redditSummary}
                    </p>
                  )}
                  {result.living?.evidenceStrength && (
                    <p className="mt-1 text-[11px] text-gray-500">
                      Evidence from Reddit threads: {result.living.evidenceStrength}
                    </p>
                  )}
                  <p className="mt-2 text-[11px] text-gray-500">
                    These living cost ranges are estimated from a mix of Reddit discussions and
                    general patterns; they will not be perfectly accurate for every student.
                  </p>
                </div>
              </motion.section>

              <motion.section
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h2 className="text-sm font-semibold text-gray-900">
                  Part-time work while studying
                </h2>
                <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm space-y-2">
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">Max hours per week (term time): </span>
                    {result.partTime?.maxHoursPerWeekTerm || 'Varies by visa type – check official rules.'}
                  </p>
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">Max hours per week (vacations): </span>
                    {result.partTime?.maxHoursPerWeekVacation || 'Often higher than term-time limits; confirm with official guidance.'}
                  </p>
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">
                      Typical part-time hourly wage ({currency}):
                      {' '}
                    </span>
                    {convertUsdRange(result.partTime?.hourlyRangeUsd, currency) || 'N/A'}
                  </p>
                  {result.partTime?.notes && (
                    <p className="text-xs md:text-sm text-gray-700">
                      {result.partTime.notes}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-gray-500">
                    Part-time work policies change often and depend on your exact visa. Always read the latest rules on the official immigration website for this country, and don&apos;t rely on these estimates alone for your budget planning.
                  </p>
                </div>
              </motion.section>

              <motion.section
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <h2 className="text-sm font-semibold text-gray-900">
                  Sources to verify everything
                </h2>
                <p className="text-xs md:text-sm text-gray-700">
                  Always confirm visa fees, insurance, and other charges on official government
                  and university websites. These links are starting points to check real,
                  up-to-date information.
                </p>
                <div className="flex flex-wrap gap-2">
                  {sources.map((s, idx) => (
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
              </motion.section>

              {result.disclaimer && (
                <motion.section
                  className="pt-4 border-t border-gray-100"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <p className="text-[11px] md:text-xs text-gray-500">
                    {result.disclaimer}
                  </p>
                </motion.section>
              )}
            </motion.div>
          )}
        </motion.section>
      </div>
    </motion.div>
  );
};

export default Budget;

