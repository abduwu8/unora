import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Universities from './pages/Universities';
import Match from './pages/Match';
import Budget from './pages/Budget';
import Documents from './pages/Documents';
import Compare from './pages/Compare';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/universities" element={<Universities />} />
      <Route path="/match" element={<Match />} />
      <Route path="/budget" element={<Budget />} />
      <Route path="/documents" element={<Documents />} />
      <Route path="/compare" element={<Compare />} />
    </Routes>
  );
};

export default App;
