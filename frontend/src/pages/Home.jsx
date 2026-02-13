import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiAcademicCap, HiAdjustmentsHorizontal, HiCurrencyDollar, HiDocumentText, HiArrowsRightLeft, HiSparkles } from 'react-icons/hi2';
import FeedbackForm from '../components/FeedbackForm';
import FlyingPlane from '../components/FlyingPlane';

const Home = () => {
  // Animation variants
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

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.6, -0.05, 0.01, 0.99],
      },
    },
  };

  return (
    <motion.div
      className="min-h-screen w-full bg-white relative flex flex-col"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Amber Glow Background - Fixed */}
      <motion.div
        className="fixed inset-0 z-0"
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
      {/* Hero + Video + Buttons - natural flow, top always visible */}
      <div className="relative z-10 flex flex-col items-center pt-8 pb-12 md:pt-24 md:pb-16 min-h-screen">
        {/* Plane GIF Section - Mobile Only */}
        <div className="relative w-full max-w-full mt-0 mb-6 md:hidden" style={{ height: '220px', minHeight: '220px' }}>
          <FlyingPlane />
        </div>

        <div className="text-center px-4 relative w-full flex flex-col items-center">
          {/* Clean black line above unora */}
          <motion.div
            className="w-16 md:w-24 h-px bg-gray-900 mx-auto mb-8 md:mb-12"
            variants={itemVariants}
          />
          <motion.h1
            className="text-6xl md:text-8xl font-bold text-gray-900"
            variants={itemVariants}
          >
            unora
          </motion.h1>
          <motion.p
            className="mt-4 md:mt-5 md:text-lg text-gray-800 max-w-2xl mx-auto"
            variants={itemVariants}
          >
            explore real student reviews, compare universities, check realistic budgets, and see visa
            document checklists, all in one focused place.
          </motion.p>

          {/* Demo Video - isko.mp4, muted, loop, thin black border */}
          <motion.div
            className="mt-10 w-full max-w-full px-3 md:px-4"
            variants={itemVariants}
          >
            <div className="relative w-full max-w-5xl mx-auto">
              {/* output.gif - in the nook outside top-left corner of the border (red highlight area) */}
              <img
                src="/output-onlinegiftools.gif"
                alt=""
                className="absolute w-28 h-28 md:w-32 md:h-32 object-contain pointer-events-none z-20 hidden md:block"
                style={{ top: 0, left: 0, transform: 'translate(-50%, -50%)' }}
                aria-hidden
              />
              <div
                className="relative w-full rounded-xl md:rounded-2xl overflow-hidden border border-black"
                style={{ aspectRatio: '16/9', minHeight: '280px', borderWidth: '1px' }}
              >
                <video
                  className="absolute inset-0 w-full h-full object-cover"
                  src="/isko.mp4"
                  playsInline
                  muted
                  loop
                  autoPlay
                  preload="auto"
                  aria-label="Product demo video"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="mt-10 grid grid-cols-2 md:flex md:flex-wrap md:items-center md:justify-center gap-6 md:gap-8 max-w-md md:max-w-none mx-auto"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.15,
                  delayChildren: 0.3,
                },
              },
            }}
          >
            <motion.div variants={buttonVariants} className="flex flex-col items-center justify-start">
              <Link to="/universities" className="group flex flex-col items-center gap-2 w-full">
                <div className="inline-flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-white/80 text-gray-900 border border-gray-900/40 shadow-md backdrop-blur group-hover:bg-gray-900 group-hover:text-white transition">
                  <HiAcademicCap className="h-6 w-6" />
                </div>
                <span className="text-xs md:text-sm font-medium uppercase tracking-[0.18em] text-gray-900">
                  reviews
                </span>
              </Link>
              <span className="mt-2 md:hidden text-[10px] text-gray-600 uppercase tracking-[0.15em] text-center max-w-[120px]">
                Real student reviews
              </span>
            </motion.div>

            <motion.div variants={buttonVariants} className="flex flex-col items-center justify-start">
              <Link to="/match" className="group flex flex-col items-center gap-2 w-full">
                <div className="inline-flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-white/80 text-gray-900 border border-gray-900/40 shadow-md backdrop-blur group-hover:bg-gray-900 group-hover:text-white transition">
                  <HiAdjustmentsHorizontal className="h-6 w-6" />
                </div>
                <span className="text-xs md:text-sm font-medium uppercase tracking-[0.18em] text-gray-900">
                  match
                </span>
              </Link>
              <span className="mt-2 md:hidden text-[10px] text-gray-600 uppercase tracking-[0.15em] text-center max-w-[120px]">
                Match your profile
              </span>
            </motion.div>

            <motion.div variants={buttonVariants} className="flex flex-col items-center justify-start">
              <Link to="/budget" className="group flex flex-col items-center gap-2 w-full">
                <div className="inline-flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-white/80 text-gray-900 border border-gray-900/40 shadow-md backdrop-blur group-hover:bg-gray-900 group-hover:text-white transition">
                  <HiCurrencyDollar className="h-6 w-6" />
                </div>
                <span className="text-xs md:text-sm font-medium uppercase tracking-[0.18em] text-gray-900">
                  budget
                </span>
              </Link>
              <span className="mt-2 md:hidden text-[10px] text-gray-600 uppercase tracking-[0.15em] text-center max-w-[120px]">
                Know real costs
              </span>
            </motion.div>

            <motion.div variants={buttonVariants} className="flex flex-col items-center justify-start">
              <Link to="/documents" className="group flex flex-col items-center gap-2 w-full">
                <div className="inline-flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-white/80 text-gray-900 border border-gray-900/40 shadow-md backdrop-blur group-hover:bg-gray-900 group-hover:text-white transition">
                  <HiDocumentText className="h-6 w-6" />
                </div>
                <span className="text-xs md:text-sm font-medium uppercase tracking-[0.18em] text-gray-900">
                  documents
                </span>
              </Link>
              <span className="mt-2 md:hidden text-[10px] text-gray-600 uppercase tracking-[0.15em] text-center max-w-[120px]">
                Required documents list
              </span>
            </motion.div>

            {/* 5th button - centered in its own row on mobile */}
            <motion.div variants={buttonVariants} className="flex flex-col items-center justify-center col-span-2 md:col-span-1">
              <Link to="/compare" className="group flex flex-col items-center gap-2 w-full md:w-auto">
                <div className="inline-flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-white/80 text-gray-900 border border-gray-900/40 shadow-md backdrop-blur group-hover:bg-gray-900 group-hover:text-white transition">
                  <HiArrowsRightLeft className="h-6 w-6" />
                </div>
                <span className="text-xs md:text-sm font-medium uppercase tracking-[0.18em] text-gray-900">
                  compare
                </span>
              </Link>
              <span className="mt-2 md:hidden text-[10px] text-gray-600 uppercase tracking-[0.15em] text-center max-w-[120px]">
                Compare universities
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Why I made this */}
      <motion.section
        className="relative z-10 px-4 md:px-6 py-16 md:py-20 max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6 text-center">
          Why I made this
        </h2>
        <div className="space-y-4 text-gray-700 text-sm md:text-base leading-relaxed">
          <p>
            University applications shouldn’t feel like a full-time job. I’ve been there, awaiting
            deadlines, hunting down document checklists, and scrolling through endless threads
            just to find one honest take. Different rules for every country, no single place to
            compare, and that constant worry you’re missing something.
          </p>
          <p>
            So I built unora: one calm place to track, compare, and plan. Because your next
            chapter deserves a little less chaos and a lot more clarity.
          </p>
        </div>
        <div className="mt-6 flex justify-center">
          <Link
            to="/overall"
            className="inline-flex items-center justify-center rounded-full border border-gray-900/60 bg-gray-900 text-white text-xs md:text-sm font-semibold px-6 py-2.5 shadow-sm hover:bg-white hover:text-gray-900 hover:border-gray-900 transition"
          >
            Straightforward verdict
          </Link>
        </div>
      </motion.section>
      
      {/* Feedback Form Section */}
      <div className="relative z-10 pb-12">
        <FeedbackForm />
      </div>

      {/* End of page linked text (regular footer, sits at bottom of viewport/content) */}
      <div className="relative z-10 mt-auto pb-4 pt-4 flex justify-center">
        <a
          href="https://www.linkedin.com/in/abdullahkhannn"
          className="inline-flex items-center justify-center"
          aria-label="LinkedIn profile"
        >
          <img
            src="/linkedin.png"
            alt="LinkedIn"
            className="h-5 w-5 md:h-6 md:w-6"
          />
        </a>
      </div>
    </motion.div>
  );
};

export default Home;
