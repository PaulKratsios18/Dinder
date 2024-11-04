import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Header from './components/Header';
import MainSection from './pages/homepage/MainSection';
import Footer from './components/Footer';
import About from './pages/homepage/About';
import Contact from './pages/homepage/Contact';
import Services from './pages/homepage/Services';
import Starter from './pages/session-selection/SessionSelection';
import JoinPreferences from './pages/preferences-join/PreferencesJoin'
import GroupLobbyHost from './pages/lobby-host/LobbyHost'
import './App.css';

function AppLayout() {
  const location = useLocation();
  const isSessionSelectionPage = location.pathname === '/session-selection';
  const isPreferencesJoinPage = location.pathname === '/preferences-join';
  const isLobbyHostPage = location.pathname === '/lobby-host';

  return (
    <div className="App">
      <div className="page-container">
        <Header /> {/* Header is always rendered */}
        
        <div className="content-wrap">
          {isSessionSelectionPage ? (
            <Starter />
          ) : isPreferencesJoinPage ? (
            <JoinPreferences />
          ) : isLobbyHostPage ? (
            <GroupLobbyHost />
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
        {!isSessionSelectionPage && !isPreferencesJoinPage && !isLobbyHostPage && <Footer />}
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
        <Route path="/session-selection" element={<AppLayout />} />
        <Route path="/preferences-join" element={<AppLayout />} />
        <Route path="/lobby-host" element={<AppLayout />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
