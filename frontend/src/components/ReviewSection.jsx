import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HiStar } from 'react-icons/hi2';
import { supabase } from '../supabaseClient';

const STORAGE_KEY = 'unora_star_rating';

const ReviewSection = () => {
  const [rating, setRating] = useState(0);
  const [average, setAverage] = useState(null);
  const [count, setCount] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [clientId, setClientId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const hasSupabase = Boolean(supabase);

  const computeStatsFromRows = (rows) => {
    if (!rows || rows.length === 0) {
      setAverage(null);
      setCount(0);
      return;
    }
    const total = rows.reduce((sum, row) => sum + (row.rating || 0), 0);
    const cnt = rows.length;
    setAverage(parseFloat((total / cnt).toFixed(1)));
    setCount(cnt);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load or create clientId + local rating
    let stored;
    try {
      stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    } catch {
      stored = null;
    }

    let cid = stored?.clientId;
    if (!cid) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        cid = crypto.randomUUID();
      } else {
        cid = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ clientId: cid }));
    }
    setClientId(cid);

    if (!hasSupabase) {
      if (stored?.rating) {
        setRating(stored.rating);
      }
      return;
    }

    // Fetch all ratings once to build global average and this client rating
    (async () => {
      const { data, error } = await supabase
        .from('unora_star_ratings')
        .select('client_id, rating');

      if (error) {
        console.error('Failed to load ratings', error);
        if (stored?.rating) {
          setRating(stored.rating);
        }
        return;
      }

      computeStatsFromRows(data);

      const mine = data.find((row) => row.client_id === cid);
      if (mine && typeof mine.rating === 'number') {
        setRating(mine.rating);
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ clientId: cid, rating: mine.rating }),
        );
      } else if (stored?.rating) {
        setRating(stored.rating);
      }
    })();
  }, [hasSupabase]);

  const handleClick = async (value) => {
    setRating(value);

    if (typeof window !== 'undefined') {
      const toStore = { clientId, rating: value };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    }

    if (!hasSupabase || !clientId) {
      return;
    }

    setIsSaving(true);
    try {
      // Upsert one rating per clientId
      const { error: upsertError } = await supabase
        .from('unora_star_ratings')
        .upsert(
          { client_id: clientId, rating: value },
          { onConflict: 'client_id' },
        );

      if (upsertError) {
        console.error('Failed to save rating', upsertError);
        return;
      }

      // Reload stats after save
      const { data, error } = await supabase
        .from('unora_star_ratings')
        .select('rating');

      if (error) {
        console.error('Failed to reload ratings', error);
        return;
      }

      computeStatsFromRows(data);
    } finally {
      setIsSaving(false);
    }
  };

  const visibleRating = hoverRating || rating;

  return (
    <motion.section
      className="relative z-10 px-4 md:px-6 pb-6 max-w-3xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs md:text-sm text-gray-700">
          How useful is Unora for you right now?
        </p>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleClick(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-0.5"
            >
              <HiStar
                className={`h-5 w-5 ${
                  star <= visibleRating ? 'text-amber-500' : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500">
          {average != null
            ? `Average: ${average}/5 · ${count} rating${count === 1 ? '' : 's'}`
            : rating
              ? `You rated: ${rating}/5`
              : isSaving
                ? 'Saving…'
                : 'Tap to rate'}
        </span>
      </div>
    </motion.section>
  );
};

export default ReviewSection;

