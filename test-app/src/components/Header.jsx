import React from 'react';
import './Header.css'; // You'll create this for styling the header

function Header() {
  return (
    <header>
      <div className="logo" id="header">
        <img src="/DinderLogoV1.png" alt="Dinder Logo" />
        <h1>Dinder</h1>
      </div>
    </header>
  );
}

export default Header;