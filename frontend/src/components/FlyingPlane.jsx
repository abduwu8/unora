import React from 'react';
import { motion } from 'framer-motion';

const FlyingPlane = () => {
  return (
    <motion.div
      className="absolute inset-0 w-full h-full pointer-events-none z-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <img
        src="/plane.gif"
        alt="Flying plane"
        className="w-full h-full object-contain"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          objectPosition: 'center center',
        }}
        onError={(e) => {
          // Fallback if plane.gif doesn't exist yet
          console.warn('plane.gif not found. Please add it to the public folder.');
          e.target.style.display = 'none';
        }}
      />
    </motion.div>
  );
};

export default FlyingPlane;
