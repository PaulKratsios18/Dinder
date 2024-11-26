import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Header from './components/Header';
import MainSection from './pages/homepage/MainSection';
import Footer from './components/Footer';
import About from './pages/homepage/About';
import Contact from './pages/homepage/Contact';
import Services from './pages/homepage/Services';
import SessionSelection from './pages/session-selection/SessionSelection';
import JoinPreferences from './pages/preferences-join/PreferencesJoin';
import LobbyHost from './pages/lobby-host/LobbyHost';
import LobbyJoin from './pages/lobby-join/LobbyJoin';
import HostPreferences from './pages/preferences-host/PreferencesHost';
import RestaurantSwiper from './pages/restaurant-swiper/RestaurantSwiper';
import './App.css';

function AppLayout() {
  // Check if the current path matches any of the defined routes
  const location = useLocation();
  const isSessionSelectionPage = location.pathname === '/session-selection';
  const isJoinPreferencePage = location.pathname === '/preferences-join';
  const isLobbyHostPage = location.pathname === '/lobby-host';
  const isHostPreferencePage = location.pathname === '/preferences-host';
  const isLobbyJoinPage = location.pathname === '/lobby-join';

  return (
    <div className="App">
      <div className="page-container">
        <Header /> {/* Header is always rendered */}
        
        <div className="content-wrap">
          {isSessionSelectionPage ? (
            <SessionSelection />
          ) : isJoinPreferencePage ? (
            <JoinPreferences />
          ) : isLobbyHostPage ? (
            <LobbyHost />
          ) : isHostPreferencePage ? (
            <HostPreferences />
          ) : isLobbyJoinPage ? (
            <LobbyJoin />
          ) : (
            <>
              <MainSection />
              <About />
              <Contact />
              <Services />
            </>
          )}
        </div>

        {/* Footer is shown only on the homepage */}
        {!isSessionSelectionPage && !isJoinPreferencePage && !isLobbyHostPage && !isHostPreferencePage && !isLobbyJoinPage && <Footer />}
      </div>
    </div>
  );
}

// Main App component
function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect any undefined route to the homepage */}
        <Route path="/" element={<AppLayout />} />
        <Route path="/session-selection" element={<AppLayout />} />
        <Route path="/preferences-join" element={<AppLayout />} />
        <Route path="/preferences-host" element={<AppLayout />} />
        <Route path="/lobby-host" element={<AppLayout />} />
        <Route path="/lobby-join" element={<AppLayout />} />
        <Route path="/sessions/:sessionId/restaurants" element={<RestaurantSwiper />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
