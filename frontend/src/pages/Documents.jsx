import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiDocumentText } from 'react-icons/hi2';
import { HiArrowDownTray } from 'react-icons/hi2';
import { apiFetch } from '../apiClient';
import { getApiErrorMessage } from '../utils/apiError';
import { formatCachedAt } from '../utils/formatCachedAt';
import { downloadDocumentsPdf } from '../utils/documentsPdf';

const Documents = () => {
  const [country, setCountry] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = country.trim().length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!country.trim()) {
      setError('Please enter a country before getting the document checklist.');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await apiFetch('/api/required-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          country: country.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get required documents');
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
            required documents
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900">
            Get your document checklist
            <span className="block text-amber-600">for any country.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm md:text-base text-gray-700">
            Enter a country name and we&apos;ll provide a comprehensive list of all required documents
            for student visa applications, including academic transcripts, language tests, financial
            proof, and more.
          </p>
        </motion.header>

        <motion.section className="space-y-6" variants={itemVariants}>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 md:flex-row md:items-end"
          >
            <div className="flex-1">
              <label className="block text-[11px] font-medium text-gray-700 mb-1.5 uppercase tracking-[0.18em]">
                Country
              </label>
              <input
                type="text"
                placeholder="e.g. United Kingdom, Canada, Germany, Australia"
                className="w-full rounded-full border border-gray-200 bg-white py-3 px-4 text-sm md:text-base outline-none shadow-sm focus:border-gray-700 focus:ring-2 focus:ring-gray-200 transition"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gray-900 text-white px-4 md:px-5 py-2.5 md:py-3 mt-1 md:mt-0 shadow-md hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isLoading || !canSubmit}
            >
              {isLoading ? (
                <>
                  <span className="inline-flex h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span className="hidden md:inline">Checking...</span>
                </>
              ) : (
                <>
                  <HiDocumentText className="h-5 w-5" />
                  <span className="hidden md:inline">Get Documents</span>
                  <span className="md:hidden">Get List</span>
                </>
              )}
            </button>
          </form>

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <span className="inline-flex h-4 w-4 rounded-full border-[1.5px] border-gray-400 border-t-transparent animate-spin" />
              <span>Analyzing document requirements for {country}…</span>
            </div>
          )}

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-red-600"
            >
              {error}
            </motion.p>
          )}

          {result && !isLoading && (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {formatCachedAt(result.cachedAt) && (
                <p className="text-xs text-gray-500">
                  {formatCachedAt(result.cachedAt)}
                </p>
              )}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                <div className="flex flex-row items-start justify-between gap-4 mb-4">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                    Required Documents for {result.country || country}
                  </h2>
                  <button
                    type="button"
                    onClick={() => downloadDocumentsPdf(result, country)}
                    title="Download PDF"
                    className="shrink-0 inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-2.5 md:px-4 md:py-2.5 md:gap-2 text-xs font-medium leading-none text-gray-700 shadow-sm hover:border-amber-300 hover:bg-amber-50 transition min-h-[2.5rem] w-10 h-10 md:w-auto md:h-auto md:min-h-[2.5rem]"
                  >
                    <HiArrowDownTray className="h-5 w-5 md:h-4 md:w-4 shrink-0" aria-hidden />
                    <span className="hidden md:inline">Download PDF</span>
                  </button>
                </div>
                
                {result.summary && (
                  <p className="text-sm md:text-base text-gray-700 mb-6 leading-relaxed">
                    {result.summary}
                  </p>
                )}

                {result.documents && Array.isArray(result.documents) && result.documents.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-[0.1em] mb-3">
                      Document Checklist
                    </h3>
                    <ul className="space-y-3">
                      {result.documents.map((doc, idx) => (
                        <motion.li
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: idx * 0.05 }}
                        >
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-semibold flex items-center justify-center mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm md:text-base font-medium text-gray-900">
                              {doc.name || doc}
                            </p>
                            {doc.description && (
                              <p className="text-xs md:text-sm text-gray-600 mt-1">
                                {doc.description}
                              </p>
                            )}
                            {doc.notes && (
                              <p className="text-xs text-gray-500 mt-1 italic">
                                Note: {doc.notes}
                              </p>
                            )}
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    No specific documents listed. Please check official government websites for the most up-to-date requirements.
                  </p>
                )}

                {result.categories && Object.keys(result.categories).length > 0 && (
                  <div className="mt-8 space-y-6">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-[0.1em]">
                      Documents by Category
                    </h3>
                    {Object.entries(result.categories).map(([category, docs]) => (
                      <div key={category} className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-800 capitalize">
                          {category}
                        </h4>
                        <ul className="space-y-2 ml-4">
                          {Array.isArray(docs) && docs.map((doc, idx) => (
                            <li key={idx} className="text-sm text-gray-700 list-disc">
                              {doc.name || doc}
                              {doc.description && (
                                <span className="text-gray-600 ml-2">
                                  — {doc.description}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {result.importantNotes && (
                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-semibold text-amber-900 mb-2">
                      Important Notes
                    </p>
                    <ul className="space-y-1 text-xs text-amber-800">
                      {Array.isArray(result.importantNotes) ? (
                        result.importantNotes.map((note, idx) => (
                          <li key={idx} className="list-disc ml-4">
                            {note}
                          </li>
                        ))
                      ) : (
                        <li>{result.importantNotes}</li>
                      )}
                    </ul>
                  </div>
                )}

                {result.sources && Array.isArray(result.sources) && result.sources.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-900 mb-2">
                      Verify Information
                    </p>
                    <p className="text-xs text-gray-600 mb-3">
                      Always confirm document requirements on official government websites. These links are starting points:
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

export default Documents;
