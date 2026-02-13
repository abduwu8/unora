import React from 'react';
import { motion } from 'framer-motion';

const Start = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: [0.6, -0.05, 0.01, 0.99],
      },
    },
  };

  const contentVariants = {
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
      className="min-h-screen w-full bg-white flex"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Hoverable Sidebar */}
      <motion.aside
        className="group relative h-screen bg-gray-900 text-white flex-shrink-0 w-14 hover:w-64 transition-all duration-300 ease-out"
        variants={itemVariants}
      >
        {/* Sidebar icon area */}
        <div className="flex items-center justify-center h-16 border-b border-gray-700">
          <div className="space-y-1.5">
            <span className="block h-0.5 w-5 bg-white rounded-full" />
            <span className="block h-0.5 w-4 bg-white rounded-full" />
            <span className="block h-0.5 w-3 bg-white rounded-full" />
          </div>
        </div>

        {/* Sidebar content shown on hover */}
        <nav className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-6 px-4">
          <p className="text-xs uppercase tracking-[0.25em] text-gray-400 mb-4">
            menu
          </p>
          <ul className="space-y-3 text-sm">
            <li className="text-gray-200">Dashboard</li>
            <li className="text-gray-200">Applications</li>
            <li className="text-gray-200">Shortlist</li>
            <li className="text-gray-200">Timeline</li>
          </ul>
        </nav>
      </motion.aside>

      {/* Main content area */}
      <motion.main
        className="flex-1 flex items-center justify-center px-6"
        variants={contentVariants}
      >
        <div className="max-w-xl text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">
            Start organizing your university journey
          </h2>
          <p className="text-gray-700 text-sm md:text-base">
            This workspace will soon become your hub for comparing universities,
            tracking deadlines, and keeping every application detail in one calm,
            focused place.
          </p>
        </div>
      </motion.main>
    </motion.div>
  );
};

export default Start;
