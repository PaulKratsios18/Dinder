// src/HomePage.js
import React from 'react';

function HomePage() {
  return (
    <div className="homepage">
      <header className="header">
        <h1 className="logo">🍽️ Dinder</h1>
      </header>
      <main className="content">
        <h2 className="tagline">SWIPE. MATCH. EAT.</h2>
        <button className="get-started-button">Get Started</button>
      </main>
      <footer>
        <a href="#" className="contact-link">Contact Us</a>
      </footer>
    </div>
  );
}

export default HomePage;