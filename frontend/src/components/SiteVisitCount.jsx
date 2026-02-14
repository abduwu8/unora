import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { HiUserGroup } from 'react-icons/hi2';
import { supabase } from '../supabaseClient';

const TABLE_NAME = 'unora_site_visits';
const START_COUNT = 50;
const ROLL_DURATION_MS = 1800;

// One insert per page load (avoids +2 from React StrictMode double-mount in dev)
let hasInsertedThisPageLoad = false;

// Ease-out-expo: fast start, slow settle (casino roll)
function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

const SiteVisitCount = () => {
  const [visitCount, setVisitCount] = useState(null);
  const [displayCount, setDisplayCount] = useState(null);
  const hasSupabase = Boolean(supabase);
  const containerRef = useRef(null);
  const inView = useInView(containerRef, { once: false, amount: 0.5 });
  const rafRef = useRef(null);
  const rollFromRef = useRef(START_COUNT);

  const fetchCount = async () => {
    if (!supabase) return;
    const { count, error } = await supabase
      .from(TABLE_NAME)
      .select('*', { count: 'exact', head: true });
    if (!error && count != null) {
      setVisitCount(START_COUNT + count);
    }
  };

  // Rolling count-up when scrolled into view (casino-style). Only update rollFromRef at end of roll so we always get a visible roll when scrolling in.
  useEffect(() => {
    if (visitCount == null || !inView) return;

    const from = rollFromRef.current;
    const to = visitCount;
    if (from === to) {
      setDisplayCount(to);
      return;
    }

    setDisplayCount(from);
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / ROLL_DURATION_MS, 1);
      const eased = easeOutExpo(progress);
      const value = Math.round(from + (to - from) * eased);
      setDisplayCount(value);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rollFromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [visitCount, inView]);

  useEffect(() => {
    if (typeof window === 'undefined' || !hasSupabase) return;

    let channel = null;

    const run = async () => {
      await fetchCount();

      // One insert per page load (StrictMode double-mount would otherwise +2)
      if (!hasInsertedThisPageLoad) {
        hasInsertedThisPageLoad = true;
        const visitorId =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

        const { error: insertError } = await supabase.from(TABLE_NAME).insert({
          visitor_id: visitorId,
          last_visited_at: new Date().toISOString(),
        });

        if (insertError) {
          console.error('Failed to record site visit', insertError);
          hasInsertedThisPageLoad = false;
          return;
        }

        await fetchCount();
      }

      channel = supabase
        .channel('site_visits_count')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: TABLE_NAME,
          },
          () => fetchCount(),
        )
        .subscribe();
    };

    run();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [hasSupabase]);

  if (visitCount == null) {
    return (
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center py-8 text-gray-500"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <span className="text-sm">…</span>
      </motion.div>
    );
  }

  const shown = inView && displayCount != null ? displayCount : visitCount;

  return (
    <motion.div
      ref={containerRef}
      className="relative z-10 flex flex-col items-center justify-center py-6 px-4"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: [0.6, -0.05, 0.01, 0.99] }}
    >
      <div className="flex items-center gap-2.5">
        <HiUserGroup className="h-8 w-8 md:h-9 md:w-9 text-gray-600 shrink-0" aria-hidden />
        <span className="text-4xl md:text-5xl font-bold text-gray-900 tabular-nums tracking-tight">
          {shown != null ? shown.toLocaleString() : '—'}
        </span>
      </div>
      <span className="mt-1.5 text-base font-medium text-gray-700">visitors</span>
    </motion.div>
  );
};

export default SiteVisitCount;
