import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Header from './home_components/Header';
import MainSection from './home_components/MainSection';
import Footer from './home_components/Footer';
import About from './home_components/About';
import Contact from './home_components/Contact';
import Services from './home_components/Services';
import Starter from './starting_menu_components/startMenu';
import './App.css';

function AppLayout() {
  const location = useLocation();
  const isGetStartedPage = location.pathname === '/get-started';

  return (
    <div className="App">
      <div className="page-container">
        <div className="content-wrap">
          <Header />
          {isGetStartedPage ? (
            <Starter />
          ) : (
            <>
              <MainSection />
              <About />
              <Contact />
              <Services />
            </>
          )}
        </div>
        {!isGetStartedPage && <Footer />}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect any undefined route to the homepage */}
        <Route path="/" element={<AppLayout />} />
        <Route path="/get-started" element={<AppLayout />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
