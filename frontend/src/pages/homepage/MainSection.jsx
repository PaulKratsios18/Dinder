import React from 'react';
import './MainSection.css';
import { useNavigate } from 'react-router-dom';
import dinderLogo from '../../assets/DinderLogoV1.png';

function MainSection() {
  // Navigate to the session selection page
  const navigate = useNavigate();

  // Navigate to the session selection page
  const handleGetStarted = () => {
    navigate('/session-selection');
  };
  
  // Render the main section
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
          <button className="get-started-button" onClick={handleGetStarted}>Get Started</button>
          
        </div>
      </div>
      <div className="icon-container">
        <div className="icon">
          <img src={dinderLogo} alt="Dinder Logo" />
        </div>
      </div>
    </section>
  );
}

export default MainSection;
