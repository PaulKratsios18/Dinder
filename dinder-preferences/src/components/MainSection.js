import React from 'react';
import './MainSection.css';

function MainSection() {
  return (
    <section className="main-section">
      <div className="text-content">
        <h1>
          SWIPE.<br />
          MATCH.<br />
          <span className="eat-text">EAT.</span>
        </h1>
        <button className="get-started-button">Get Started</button>
      </div>
      <div className="icon-container">
        <div className="icon">
          <img src="/DinderLogoV1.png" alt="Swipe icon" />
        </div>
      </div>
    </section>
  );
}

export default MainSection;
