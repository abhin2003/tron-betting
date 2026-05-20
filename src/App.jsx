import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import ErrorBoundary from './components/ErrorBoundary';
import { useTronLink } from './hooks/useTronLink';
import './index.css';

const LoadingScreen = () => (
  <div className="loading-screen">
    <div className="loading-spinner"></div>
    <p>Connecting to TronLink...</p>
  </div>
);

const AppContent = () => {
  const { isLoading } = useTronLink();

  useEffect(() => {
    document.title = 'TRON BET — Odd/Even Betting';
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
      <Footer />
    </>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
      </Router>
    </ErrorBoundary>
  );
};

export default App;
