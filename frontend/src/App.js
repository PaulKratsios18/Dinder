import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import PreferencesHostPage from './pages/preferences-host/PreferencesHostPage';
import PreferencesJoinPage from './pages/preferences-join/PreferencesJoinPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <div className="page-container">
          <div className="content-wrap">
            <Header />
            
            <Routes>
              <Route path="/preferences-host" element={<PreferencesHostPage />} />
              <Route path="/preferences-join" element={<PreferencesJoinPage />} />
              <Route path="/" element={
                <div>
                  <h1>Welcome to Dinder</h1>
                  <div className="navigation-links">
                    <Link to="/preferences-host">Host a Session</Link>
                    <Link to="/preferences-join">Join a Session</Link>
                  </div>
                </div>
              } />
            </Routes>
          </div>
          <Footer />
        </div>
      </div>
    </Router>
  );
}

export default App;