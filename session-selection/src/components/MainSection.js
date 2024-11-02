import React from 'react';
import './MainSection.css';

function MainSection() {
  return (
    <section className="main-section">
      <div className="text-content">
        <h1>
          <strong>Hi there!</strong>
        </h1>
        <p className="description">
          Find a place to eat by starting a session or joining an existing group.
        </p>
        <div className="button-container">
          <button className="session-button start-session">
            Start a group session
          </button>
          <div className="divider-container">
            <div className="divider-line"></div>
            <span className="divider-text">or</span>
            <div className="divider-line"></div>
          </div>
          <button className="session-button join-session">
            Join a group session
          </button>
        </div>
      </div>
    </section>
  );
}

export default MainSection;