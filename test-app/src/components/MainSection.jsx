import React from 'react';
import './MainSection.css';

function MainSection() {
  return (
    <section className="main-section" id="homepage">
      <div className="text-content">
        <h1>
          SWIPE. MATCH. 
          <span className="eat-text"> EAT.</span>
        </h1>
        
        <span>{<br/>}</span>
        <h2>
          Welcome to Dinder! Click below to get started and find your ideal food spot today.
        </h2>
        <div className="button-container">
          <button className="get-started-button">Get Started</button>
          
        </div>
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
