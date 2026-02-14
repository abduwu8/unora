import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiSparkles, HiAcademicCap } from 'react-icons/hi2';
import { apiFetch } from '../apiClient';
import { getApiErrorMessage } from '../utils/apiError';

const Compare = () => {
  const [universities, setUniversities] = useState(['', '', '']);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = universities.filter((uni) => uni.trim()).length >= 2;

  const handleUniversityChange = (index, value) => {
    const newUniversities = [...universities];
    newUniversities[index] = value;
    setUniversities(newUniversities);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validUniversities = universities.filter((uni) => uni.trim());
    
    if (validUniversities.length < 2) {
      setError('Please enter at least 2 universities to compare');
      return;
    }

    if (validUniversities.length > 3) {
      setError('Maximum 3 universities can be compared');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await apiFetch('/api/compare-universities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          universities: validUniversities,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to compare universities');
      }

      const data = await response.json();
      setResult(data);
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
          backgroundAttachment: 'fixed',
        }}
      />
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10 md:px-8 md:py-16">
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
            university comparison
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900">
            Compare universities side by side
            <span className="block text-amber-600">based on real student insights.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm md:text-base text-gray-700">
            Enter up to 3 universities and we&apos;ll compare them across key factors like academic
            quality, student life, career outcomes, and value for money, all based on real Reddit
            discussions and verified information.
          </p>
        </motion.header>

        <motion.section className="space-y-6" variants={itemVariants}>
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-5 md:px-6 md:py-6 shadow-sm"
          >
            <div className="space-y-3">
              {[0, 1, 2].map((index) => (
                <div key={index}>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    University {index + 1} {index < 2 && <span className="text-gray-400">(optional)</span>}
                  </label>
                  <input
                    type="text"
                    placeholder={`e.g. ${index === 0 ? 'University of Glasgow' : index === 1 ? 'University of Edinburgh' : 'University of Manchester'}`}
                    className="w-full rounded-lg border border-gray-200 bg-white py-2.5 px-3 text-sm outline-none focus:border-gray-800 focus:ring-2 focus:ring-gray-200"
                    value={universities[index]}
                    onChange={(e) => handleUniversityChange(index, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gray-900 text-white px-6 py-2.5 text-sm font-semibold shadow-md hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isLoading || !canSubmit}
            >
              {isLoading ? (
                <>
                  <span className="inline-flex h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Comparing universities...
                </>
              ) : (
                <>
                  <HiSparkles className="h-5 w-5" />
                  Compare Universities
                </>
              )}
            </button>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-red-600"
              >
                {error}
              </motion.p>
            )}
          </form>

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <span className="inline-flex h-4 w-4 rounded-full border-[1.5px] border-gray-400 border-t-transparent animate-spin" />
              <span>Analyzing Reddit discussions and gathering comparison data…</span>
            </div>
          )}

          {result && !isLoading && (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-6">
                  Comparison Results
                </h2>

                {/* Comparison Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-[0.1em]">
                          Criteria
                        </th>
                        {result.comparison?.map((uni, idx) => (
                          <th
                            key={idx}
                            className="text-center py-3 px-4 text-sm font-semibold text-gray-900 min-w-[200px]"
                          >
                            {uni.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.comparisonPoints?.map((point, pointIdx) => (
                        <tr
                          key={pointIdx}
                          className="border-b border-gray-100 hover:bg-gray-50 transition"
                        >
                          <td className="py-4 px-4 text-sm font-medium text-gray-900">
                            {point.name}
                          </td>
                          {result.comparison?.map((uni, uniIdx) => (
                            <td key={uniIdx} className="py-4 px-4 text-sm text-gray-700 text-center">
                              <div className="space-y-2">
                                {point.rating && (
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="text-lg font-semibold text-gray-900">
                                      {uni.points?.[pointIdx]?.rating || 'N/A'}
                                    </span>
                                    <span className="text-xs text-gray-500">/10</span>
                                  </div>
                                )}
                                <p className="text-xs text-gray-600 leading-relaxed">
                                  {uni.points?.[pointIdx]?.description || 'No data available'}
                                </p>
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary Section */}
                {result.summary && (
                  <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Overall Summary</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">{result.summary}</p>
                  </div>
                )}

                {/* Key Insights */}
                {result.insights && Array.isArray(result.insights) && result.insights.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900">Key Insights</h3>
                    <ul className="space-y-2">
                      {result.insights.map((insight, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-gray-700"
                        >
                          <span className="text-amber-600 mt-1">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sources */}
                {result.sources && Array.isArray(result.sources) && result.sources.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-900 mb-2">
                      Sources & Verification
                    </p>
                    <p className="text-xs text-gray-600 mb-3">
                      Based on Reddit discussions and verified information. Always check official
                      university websites for the most current details.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.sources.map((source, idx) => (
                        <a
                          key={idx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1.5 text-xs md:text-sm text-gray-800 hover:border-gray-400 hover:bg-gray-50 transition"
                        >
                          {source.label || source}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.section>
      </div>
    </motion.div>
  );
};

export default Compare;
